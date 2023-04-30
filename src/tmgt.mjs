
//const cliArgs      = require('commander') ;
import { Command } from "commander"
//const config       = require('./configuration') ;
import { Config } from "./configuration.mjs"
//const scopeActions = require('./scopeActions');

const cliArgs = new Command()

cliArgs
  .name('tmgt')
  .description('CLI to manipulate textmate grammars')
  .version('0.0.1');

Config.addCliArgs(cliArgs) ;

cliArgs
.option('--prune',  'Prune unused patterns from grammar')
.option('--actions', 'Show the actions')
.option('--grammar <baseScope...>', 'Show the (raw) grammar')
.option('--grammars', 'Show all (known raw) grammars')
.option('-ta, --testActions <file>', 'Test the loaded actions using a document')
.option('-tg, --testGrammars <file>', 'Test the loaded grammars using a document')

cliArgs.parse();

var config = {}
try {
  config = await Config.loadConfig(cliArgs)
} catch (err) {
  const error = await err
  console.log(error)
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

if (config['testActions']) {
  const aDocPath = config['testActions']
  const aDoc = await DocumentCache.loadFromFile(aDocPath)
  await Grammars.testActionsUsing(aDoc)
  process.exit(0)      
}

if (config['testGrammars']) {
  const aDocPath = config['testGrammars']
  const aDoc = await DocumentCache.loadFromFile(aDocPath)
  await Grammars.testGrammarsUsing(aDoc)
  process.exit(0)      
}

console.log("ALL DONE!")
