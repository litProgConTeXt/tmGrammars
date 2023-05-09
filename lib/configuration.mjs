
import { Command, Option } from "commander"
import fsp                 from "fs/promises"
import { deepmerge       } from "deepmerge-ts"
import os                  from "os"
import path                from "path"
import toml                from "@ltd/j-toml"
import url                 from "url"
import yaml                from "yaml"

import { Builders      } from "./builders.mjs"
import { Grammars      } from "./grammars.mjs"
import { ScopeActions  } from "./scopeActions.mjs"

function appendArg(newArg, oldArg) {
  if (!oldArg) oldArg = []
  if (!Array.isArray(oldArg)) oldArg = [ oldArg ]
  oldArg.push(newArg)
  return oldArg
}

class AppendableCommand extends Command {
  optionAppend(flags, description, fn, defaultValue) {
    return this.addOption(
      new Option(flags, description, fn, defaultValue)
      .argParser(appendArg)
    )
  }    
}  

// Standard configuration for the LPiC projects

class Config {

  static theConfig = {}

  static addCliArgs(cliArgs, configBaseName) {
    cliArgs
      .option('-v, --verbose', 'Be verbose')
      .option('-c, --config <file>',  `Load a configuration file (YAML|TOML|JSON) (default: ${configBaseName}.{yaml|yml|toml|json})`)
      .option('-d, --dir <aDir>', 'Write all output to this directory (default: ".")')
      .optionAppend('-la, --loadActions <file>', 'Load actions from a ES6 module')
      .optionAppend('-lb, --loadBuilders <file>', 'Load builders from an ES6 module')
      .optionAppend('-lg, --loadGrammar <file>', 'Load a grammar from the file system (JSON|PLIST)')
      .option('--path <aPath>', "A path prefix to prepend to all files loaded which don't start with a '~|@|$'")
      .option('-s, --save <file>', 'Save the current configuration into file (YAML|TOML|JSON)')
  }    

  static normalizePath(aPath) {
    //console.log(`normalizing path [${aPath}]`)
    var pathPrefix = process.cwd()
    if (Config.theConfig['path']) pathPrefix = Config.theConfig['path']

    if (aPath.startsWith('~')) {
      // load from a home directory
      pathPrefix = os.homedir()
      if (!aPath.startsWith('~/') && !aPath.startsWith('~\\') && aPath !== '~') {
        pathPrefix = path.dirname(pathPrefix)
      }  
      aPath = aPath.replace(/^~/, '')
    } else if (aPath.startsWith('@')) {
      // load from node_modules....
      pathPrefix = path.dirname(url.fileURLToPath(import.meta.url))
      while ( pathPrefix && !pathPrefix.endsWith('node_modules')) {
        pathPrefix = path.dirname(pathPrefix)
      }
      aPath = aPath.replace(/^@/, '')
    } else if (aPath.startsWith('$')) {
      // load from this repository...
      pathPrefix = path.dirname(url.fileURLToPath(import.meta.url))
      while ( pathPrefix && !pathPrefix.endsWith('node_modules')) {
        pathPrefix = path.dirname(pathPrefix)
      }
      pathPrefix = path.dirname(pathPrefix)
      aPath = aPath.replace(/^\$/, '')
    }  
    aPath = path.join(
      pathPrefix,
      aPath
    )  
    return path.normalize(aPath)
  }  

  static async loadConfig(cliArgs, configBaseName, defaultConfig, funcObj) {
    if (!funcObj) funcObj = {}
    const cliOpts = cliArgs.opts()
    const verbose = cliOpts.verbose ;
    var   config  = {};

    if (defaultConfig) {
      config = deepmerge(config, defaultConfig) ;
        if (verbose) {
          console.log("\n--default config-------------------------------------------")
          console.log(yaml.stringify(config))
          console.log("-----------------------------------------------------------")
        }  
      }  
    
    if (verbose) {
      console.log("\n--command line config--------------------------------------")
      console.log(yaml.stringify(cliOpts))
      console.log("-----------------------------------------------------------")
    }
    
    var configText = ""
    if (!cliOpts.config) {
      if (!configText) try {
        cliOpts.config = configBaseName + ".yaml"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText) try {
        cliOpts.config = configBaseName + ".yml"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText) try {
        cliOpts.config = configBaseName + ".toml"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText) try {
        cliOpts.config = configBaseName + ".json"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText && !config['ignoreConfig']) {
        console.log(`Could not load the default configuration file [${configBaseName}.{yaml|yml|toml|json}]`)
        console.log("  continuing with out loaded configuration...")  
      }
    } else {
      if (!configText) try {
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) {
        console.log(`Could not load the configuration file [${cliOpts.config}]`)
        console.log("  continuing with out loaded configuration...")  
      }
    }
    if (configText) {
      if (verbose) console.log(`Loaded configuration from [${cliOpts.config}]`)
      var fileConfig = {}
      const lcConfigPath = cliOpts.config.toLowerCase() ;
      if (lcConfigPath.endsWith('yaml') || lcConfigPath.endsWith('yml')) {
        fileConfig = yaml.parse(configText) ;
      } else if (lcConfigPath.endsWith('toml')) {
        fileConfig = toml.parse(configText) ;
      } else if (lcConfigPath.endsWith('json')) {
        fileConfig = JSON.parse(configText) ;
      }
      config = deepmerge(config, fileConfig) ;
      if (verbose) {
        console.log("\n--config file config---------------------------------------")
        console.log(yaml.stringify(config))
        console.log("-----------------------------------------------------------")
      }
    }
      
    config = deepmerge(config, cliOpts) ;

    if (!config['dir']) config['dir'] = '.'

    if (funcObj['preLoadFunc']) funcObj['preLoadFunc'](config)
    
    if (config.loadActions && 0 < config.loadActions.length) {
      if (verbose) {
        console.log("\n--loading actions----------------------------------------")
      }
      await Promise.all(config.loadActions.map( async (anActionsPath) => {
        if (verbose) console.log(`starting to load actions from [${anActionsPath}]`)
        await ScopeActions.loadActionsFrom(anActionsPath, config)
          .catch(err => console.log(err))
        if (verbose) console.log(`finished loading actions from [${anActionsPath}]`)
      }))
      if (verbose) {
        console.log("---------------------------------------------------------")
      }
    }
  
    if (config.loadBuilders && 0 < config.loadBuilders.length) {
      if (verbose) {
        console.log("\n--loading builders---------------------------------------")
      }
      await Promise.all(config.loadBuilders.map( async (aBuildersPath) => {
        if (verbose) console.log(`starting to load builders from [${aBuildersPath}]`)
        await Builders.loadBuildersFrom(aBuildersPath, config)
          .catch(err => console.log(err))
        if (verbose) console.log(`finished loading builders from [${aBuildersPath}]`)
      }))
      if (verbose) {
        console.log("---------------------------------------------------------")
      }
    }
  
    if (config.loadGrammar && 0 < config.loadGrammar.length) {
      if (verbose) {
        console.log("\n--loading grammars---------------------------------------")
      }
      await Promise.all(config.loadGrammar.map( async (aGrammarPath) => {
        if (verbose) console.log(`starting to load grammar from [${aGrammarPath}]`)
        await Grammars.loadGrammarFrom(aGrammarPath, config.verbose).catch(err => console.log(err))
        if (verbose) console.log(`finished loading grammar from [${aGrammarPath}]`)
      }))     
      if (verbose) {
        console.log("---------------------------------------------------------")
      }
    }
    
    ////////////////////////////////////////////////////////////////////////////
    // remove pathPrefix from the remaining command line arguments

    var pathPrefix    = config['path']
    var pathPrefixLen = 0

    if (pathPrefix && !pathPrefix.endsWith(path.sep)) {
      pathPrefix = pathPrefix+path.sep
    }
    if (pathPrefix) pathPrefixLen = pathPrefix.length

    const initFiles = []
    for (var aPath of cliArgs.args) {
      if (pathPrefix && aPath.startsWith(pathPrefix)) {
        aPath = aPath.substring(pathPrefixLen)
      }
      initFiles.push(aPath)
    }
    config['initialFiles'] = initFiles

    if (funcObj['preRunFunc']) funcObj['preRunFunc'](config)
    
    if (verbose) {
      console.log("\n--config---------------------------------------------------")
      console.log(yaml.stringify(config))
      console.log("-----------------------------------------------------------")
    }
  
    if (config['save']) {
      const savePath = config['save']
      const lcSavePath = savePath.toLowerCase()
      // ensure the follow DO NOT get saved...
      if (config['save'])         delete config['save']
      if (config['verbose'])      delete config['verbose']
      if (config['config'])       delete config['config']
      if (config['initialFiles']) delete config['initialFiles']
      // now save everything else!
      if (funcObj['preSaveFunc']) funcObj['preSaveFunc'](config)
      var configStr = ""
      if (lcSavePath.endsWith('yaml') || lcSavePath.endsWith('yml')) {
        configStr = yaml.stringify(config)
      } else if (lcSavePath.endsWith('toml')) {
        configStr = toml.stringify(config, {
          'newline' : '\n',
          'indent'  : 2
        })
      } else if (lcSavePath.endsWith('json')) {
        configStr = JSON.stringify(config, null, 2)
      }
      await fsp.writeFile(savePath, configStr, {
        'encoding' : 'utf8',
        'mode'     : 0o644
      })
      process.exit(0)
    }

    Config.theConfig = config
    return config
  }
}

export { Config, AppendableCommand }
