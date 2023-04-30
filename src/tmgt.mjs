
import { Config, AppendableCommand } from "./configuration.mjs"
import { DocumentCache } from "./documents.mjs"
import { Grammars     } from "./grammars.mjs"
import { ScopeActions } from "./scopeActions.mjs"
import { Structures   } from "./structures.mjs"

const cliArgs = new AppendableCommand('[path]')

cliArgs
  .name('tmgt')
  .description('CLI to manipulate textmate grammars')
  .version('0.0.1')

Config.addCliArgs(cliArgs) ;

const documents2parse = []

cliArgs
.option('--prune',  'Prune unused patterns from grammar')
.option('--actions', 'Show the actions')
.optionAppend('--grammar <baseScope>', 'Show the (raw) grammar')
.option('--grammars', 'Show all (known raw) grammars')
.optionAppend('-tl, --traceLine <regexp>', 'Trace lines which match the specified regexp')
.optionAppend('-tlx, --tlExclude <regexp>', 'Do not trace lines which match the specified regexp')
.optionAppend('-ta, --traceAction <action>', 'Trace the specified action')
.optionAppend('-tax, --taExclude <action>', 'Do not trace the specified action')
.optionAppend('-ts, --traceScope <scope>', 'Trace the specified scope')
.optionAppend('-tsx, --tsExclude <scope>', 'Do not trace the specified scope')
.optionAppend('-tS, --traceStructure <struct>', 'Trace the specified structure')
.optionAppend('-tSx, --tSExclude <struct>', 'Do not trace the specified structure')
.arguments('[path]', 'The document to parse while tracing scopes, actions and structures')

//new Option('-tSx, --tSExclude <struct>', 'Do not trace the specified structure')
//.argParser(Config.appendArg)
//)

cliArgs.parse();

var config = {}
try {
  config = await Config.loadConfig(cliArgs, {}, function(config){
    ///////////////////////////////////////////////////////////////////////////////
    // normalize the trace options
    config['tarceLines'] = {
      include: config['traceLine'] || [],
      exclude: config['tlExclude'] || []
    }
    if (config['traceLine']) delete config['traceLine']
    if (config['tlExclude']) delete config['tlExclude']

    config['traceActions'] = {
      loaded: Object.keys(ScopeActions.getScopesWithActions()).sort(),
      include: config['traceAction'] || [],
      exclude: config['taExclude']   || []
    }
    if (config['traceAction']) delete config['traceAction']
    if (config['taExclude'])   delete config['taExclude']

    config['traceScopes'] = {
      loaded: Grammars.getKnownScopes(),
      include: config['traceScope'] || [],
      exclude: config['tsExclude']  || []
    }
    if (config['traceScope']) delete config['traceScope']
    if (config['tsExclude'])  delete config['tsExclude']

    config['traceStructures'] = {
      loaded: Structures.getStructureNames(),
      include: config['traceStructure'] || [],
      exclude: config['tSExclude']      || []
    }
    if (config['traceStructure']) delete config['traceStructure']
    if (config['tSExclude'])      delete config['tSExclude']
  })
} catch (err) {
  const error = await err
  console.log(error)
}
if (config['actions']) {
  ScopeActions.printActions()
  process.exit(0)
}

if (config['prune']) {
  const scopesWithActions = ScopeActions.getScopesWithActions()
  Grammars.pruneGrammars(scopesWithActions, config.verbose)
}

if (config['grammars']) {
  Grammars.printAllGrammars()
  process.exit(0)
}

if (config['grammar']) {
  config['grammar'].forEach(function(aBaseScope){
    Grammars.printGrammar(aBaseScope)
  })
  process.exit(0)
}

if (cliArgs.args.length < 1) {
  console.log("No document specified to trace while parsing")
  process.exit(0)
}

cliArgs.args.forEach(async function(aDocPath){
  const aDoc = await DocumentCache.loadFromFile(aDocPath)
  await Grammars.traceParseOf(aDoc, config)
})

