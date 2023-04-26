
//const cliArgs      = require('commander') ;
import { Command } from "commander"
//const config       = require('./configuration') ;
import { Config } from "./configuration.mjs"
//const scopeActions = require('./scopeActions');

const cliArgs = new Command()

cliArgs
  .name('tmgc')
  .description('CLI to manipulate textmate grammars')
  .version('0.0.1');

Config.addCliArgs(cliArgs) ;

cliArgs.parse();

try {
  await Config.loadConfig(cliArgs)
} catch (err) {
  const error = await err
  console.log(error)
}

console.log("ALL DONE!")
