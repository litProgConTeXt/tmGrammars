
import { Command, Option } from "commander"
import fsp                 from "fs/promises"
import { deepmerge       } from "deepmerge-ts"
import os                  from "os"
import path                from "path"
import toml                from "@ltd/j-toml"
import url                 from "url"
import yaml                from "yaml"

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

  static addCliArgs(cliArgs) {
    cliArgs
      .option('-v, --verbose', 'Be verbose')
      .option('-c, --config <file>',  'Load a configuration file (YAML|TOML|JSON) (default: tmgt.{yaml|yml|toml|json})')
      .optionAppend('-la, --loadActions <file>', 'Load actions from a CommonJS module')
      .optionAppend('-lg, --loadGrammar <file>', 'Load a grammar from the file system or a Python resource (JSON|PLIST)')
      .option('-s, --save <file>', 'Save the current configuration into file (YAML|TOML|JSON)')
  }    

  static normalizePath(aPath) {
    //console.log(`normalizing path [${aPath}]`)
    var pathPrefix = ""
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
    } else if (aPath.startsWith('.')) {
      // load from the current working directory
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

  static async loadConfig(cliArgs, defaultConfig, funcObj) {
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
        cliOpts.config = "tmgt.yaml"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText) try {
        cliOpts.config = "tmgt.yml"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText) try {
        cliOpts.config = "tmgt.toml"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText) try {
        cliOpts.config = "tmgt.json"
        configText = await fsp.readFile(cliOpts.config, 'utf8');
      } catch (error) { /* do nothing */ }
      if (!configText && !config['ignoreConfig']) {
        console.log(`Could not load the default configuration file [tmgt.{yaml|yml|toml|json}]`)
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

    if (funcObj['preLoadFunc']) funcObj['preLoadFunc'](config)
    
    if (config.loadActions && 0 < config.loadActions.length) {
      if (verbose) {
        console.log("\n--loading actions----------------------------------------")
      }
      await Promise.all(config.loadActions.map( async (anActionsPath) => {
        if (verbose) console.log(`starting to load actions from [${anActionsPath}]`)
        await ScopeActions.loadActionsFrom(anActionsPath, config.verbose).catch(err => console.log(err))
        if (verbose) console.log(`finished loading actions from [${anActionsPath}]`)
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
      if (config['save'])    delete config['save']
      if (config['verbose']) delete config['verbose']
      if (config['config'])  delete config['config']
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

    return config
  }
}

export { Config, AppendableCommand }
