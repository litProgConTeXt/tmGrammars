
import yaml from "yaml"

import { Config, AppendableCommand } from "./configuration.mjs"
import { Grammars     } from "./grammars.mjs"
import { ScopeActions } from "./scopeActions.mjs"
import { Structures   } from "./structures.mjs"

const cliArgs = new AppendableCommand('[path]')

cliArgs
  .name('tmgt')
  .description('CLI to manipulate textmate grammars')
  .version('0.0.1')

Config.addCliArgs(cliArgs, 'tmgt') ;

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

cliArgs.parse();

var config = {}
try {
  config = await Config.loadConfig(cliArgs, 'tmgt', {}, {
    preRunFunc: function(config){
      // this is the preRunFunction 
      function compileRegExps(arrayA, arrayB) {
        var anArray = arrayA
        if (!anArray) anArray = arrayB
        if (!anArray) return []
        if (!Array.isArray(anArray)) anArray = [ anArray ]
        return anArray.map(function(aValue) {
          return new RegExp(aValue)
        })
      }
      ///////////////////////////////////////////////////////////////////////////////
      // normalize the trace options
      config['traceLines'] = {
        name:    'traceLines',
        include: compileRegExps(config['traceLine'], config['traceLines']['include']),
        exclude: compileRegExps(config['tlExclude'], config['traceLines']['exclude'])
      }
      if (config['traceLine']) delete config['traceLine']
      if (config['tlExclude']) delete config['tlExclude']

      config['traceActions'] = {
        name:    'traceActions',
        loaded:  Object.keys(ScopeActions.getScopesWithActions()).sort(),
        include: compileRegExps(config['traceAction'], config['traceActions']['include']),
        exclude: compileRegExps(config['taExclude'],   config['traceActions']['exclude'])
      }
      if (config['traceAction']) delete config['traceAction']
      if (config['taExclude'])   delete config['taExclude']

      config['traceScopes'] = {
        name:    'traceScopes',
        loaded:  Grammars.getKnownScopes(),
        include: compileRegExps(config['traceScope'], config['traceScopes']['include']),
        exclude: compileRegExps(config['tsExclude'],  config['traceScopes']['exclude'])
      }
      if (config['traceScope']) delete config['traceScope']
      if (config['tsExclude'])  delete config['tsExclude']

      config['traceStructures'] = {
        name:    'traceStructures',
        loaded:  Structures.getStructureNames(),
        include: compileRegExps(config['traceStructure'], config['traceStructures']['include']),
        exclude: compileRegExps(config['tSExclude'],      config['traceStructures']['exclude'])
      }
      if (config['traceStructure']) delete config['traceStructure']
      if (config['tSExclude'])      delete config['tSExclude']
    }, 
    preSaveFunc: function(config){
      // this is the preSaveFunction
      function decompileRegExps(anArray) {
        if (!anArray) return []
        if (!Array.isArray(anArray)) anArray = [ anArray ]
        return anArray.map(function(aValue) {
          return aValue.source
        })
      }    
      ///////////////////////////////////////////////////////////////////////////////
      // normalize the trace options
      config['traceLines'] = {
        name: 'traceLines',
        include: decompileRegExps(config['traceLines']['include']),
        exclude: decompileRegExps(config['traceLines']['exclude'])
      }
      config['traceActions'] = {
        name:    'traceActions',
        loaded:  Object.keys(ScopeActions.getScopesWithActions()).sort(),
        include: decompileRegExps(config['traceActions']['include']),
        exclude: decompileRegExps(config['traceActions']['exclude'])
      }
      config['traceScopes'] = {
        name:    'traceScopes',
        loaded:  Grammars.getKnownScopes(),
        include: decompileRegExps(config['traceScopes']['include']),
        exclude: decompileRegExps(config['traceScopes']['exclude'])
      }
      config['traceStructures'] = {
        name:    'traceStructures',
        loaded:  Structures.getStructureNames(),
        include: decompileRegExps(config['traceStructures']['include']),
        exclude: decompileRegExps(config['traceStructures']['exclude'])
      }
    }
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
  await Grammars.traceParseOf(aDocPath, config)
})

