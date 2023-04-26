
import fs    from "fs"
import merge from "deepmerge"
import os    from "os"
import path  from "path"
import toml  from "toml"
import yaml  from "yaml"

import { ScopeActions } from "./scopeActions.mjs"

// Standard configuration for the LPiC projects

class Config {

  static addCliArgs(cliArgs) {
    cliArgs
      .option('-v, --verbose', 'Be verbose')
      .option('-c, --config <file>',  'Load a configuration file (YAML|TOML|JSON)')
      .option('-la, --loadActions <file...>', 'Load actions from a CommonJS module')
      .option('-lg, --loadGrammar <file...>', 'Load a grammar from the file system or a Python resource (JSON|PLIST)')
      .option('--prune',  'Prune unused patterns from grammar')
      .option('--actions', 'Show the actions')
      .option('--grammar', 'Show the (raw) grammar')
  }

  static normalizePath(aPath) {
    var pathPrefix = ""
    if (aPath.startsWith('~')) {
      pathPrefix = os.homedir()
      if (!aPath.startsWith('~/') && !aPath.startsWith('~\\') && aPath !== '~') {
        pathPrefix = path.dirname(pathPrefix)
      }
      aPath = aPath.replace(/^~/, '')
    } else if (aPath.startsWith('.')) {
      pathPrefix = process.cwd()
    }
    if (pathPrefix) {
      aPath = path.join(
        pathPrefix,
        aPath
      )
    }
    return path.normalize(aPath)
  }

  static async loadConfig(cliArgs, defaultConfig) {
    var config = {};
    if (defaultConfig) {
      config = merge(config, defaultConfig) ;
    }
  
    const cliOpts = cliArgs.opts()
    const verbose = cliOpts.verbose ;
    if (verbose) {
      console.log("--command line config-------------------------------------")
      console.log(yaml.stringify(cliOpts))
      console.log("----------------------------------------------------------")
    }
  
    if (cliOpts.config) {
      const configText = fs.readFileSync(
        cliOpts.config, {encoding: 'utf8', flag: 'r'}
      );
      var fileConfig = {}
      const lcConfigPath = cliOpts.config.toLowerCase() ;
      if (lcConfigPath.endsWith('yaml') || lcConfigPath.endsWith('yml')) {
        fileConfig = yaml.parse(configText) ;
      } else if (lcConfigPath.endsWith('toml')) {
        fileConfig = toml.parse(configText) ;
      } else if (lcConfigPath.endsWith('json')) {
        fileConfig = JSON.parse(configText) ;
      }
      config = merge(config, fileConfig) ;
    }
    
    config = merge(config, cliOpts) ;
  
    if (verbose) {
      console.log("--command line config-------------------------------------")
      console.log(yaml.stringify(config))
      console.log("----------------------------------------------------------")
    }
  
    if (0 < config.loadActions.length) {
      await Promise.all(config.loadActions.map( async (anActionsPath) => {
        if (verbose) console.log(`starting to loadActions from [${anActionsPath}]`)
        await ScopeActions.loadActionsFrom(anActionsPath, config.verbose).catch(err => console.log(err))
        if (verbose) console.log(`finished loading loadActions from [${anActionsPath}]`)
      }))
    }
  
    if (config['actions']) {
      ScopeActions.printActions()
      process.exit(0)
    }
  }
}

export { Config }
