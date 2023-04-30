
import { Command, Option } from "commander"
import fsp                 from "fs/promises"
import { deepmerge       } from "deepmerge-ts"
import os                  from "os"
import path                from "path"
import toml                from "@ltd/j-toml"
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

  static async loadConfig(cliArgs, defaultConfig, preSaveFunc) {
    var config = {};
    if (defaultConfig) {
      config = deepmerge(config, defaultConfig) ;
    }
  
    const cliOpts = cliArgs.opts()
    const verbose = cliOpts.verbose ;
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
      if (!configText) {
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
    }
      
    config = deepmerge(config, cliOpts) ;
      
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
    
    if (preSaveFunc) preSaveFunc(config)
    
    if (verbose) {
      console.log("\n--command line config--------------------------------------")
      console.log(yaml.stringify(cliOpts))
      console.log("-----------------------------------------------------------")
    }
    
    if (verbose) {
      console.log("\n--config---------------------------------------------------")
      console.log(yaml.stringify(config))
      console.log("-----------------------------------------------------------")
    }
  
    if (config['save']) {
      const savePath = config['save']
      const lcSavePath = savePath.toLowerCase()
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
