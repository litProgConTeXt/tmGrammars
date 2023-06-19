
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
import { Logging       } from "./logging.mjs"

const logger = Logging.getLogger('rootLogger')

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
      .option('-ll, --logLevel <levelName>', 'Set the Pino log lever (default: info')
      .option('-c, --config <file>',  `Load a configuration file (YAML|TOML|JSON) (default: ${configBaseName}.{yaml|yml|toml|json})`)
      .option('-d, --dir <aDir>', 'Write all output to this directory (default: ".")')
      .optionAppend('-la, --loadActions <file>', 'Load actions from a ES6 module')
      .optionAppend('-lb, --loadBuilders <file>', 'Load builders from an ES6 module')
      .optionAppend('-lg, --loadGrammar <file>', 'Load a grammar from the file system (JSON|PLIST)')
      .option('--path <aPath>', "A path prefix to prepend to all files loaded which don't start with a '~|@|$'")
      .option('-s, --save <file>', 'Save the current configuration into file (YAML|TOML|JSON)')
  }    

  static normalizePath(aPath) {
    var pathPrefix = process.cwd()
    if (Config.theConfig['path']) pathPrefix = Config.theConfig['path']

    if (aPath.startsWith('~')) {
      // load from a home directory
      pathPrefix = os.homedir()
      if (!aPath.startsWith('~/') && !aPath.startsWith('~\\') && aPath !== '~') {
        pathPrefix = path.dirname(pathPrefix)
      }  
      aPath = aPath.replace(/^~/, '')
    //} else if (aPath.startsWith('@')) {
    //  // load from node_modules....
    //  pathPrefix = path.dirname(url.fileURLToPath(import.meta.url))
    //  while ( pathPrefix && !pathPrefix.endsWith('node_modules')) {
    //    pathPrefix = path.dirname(pathPrefix)
    //  }
    //  aPath = aPath.replace(/^@/, '')
    //} else if (aPath.startsWith('$')) {
    //  // load from this repository...
    //  pathPrefix = path.dirname(url.fileURLToPath(import.meta.url))
    //  while ( pathPrefix && !pathPrefix.endsWith('node_modules')) {
    //    pathPrefix = path.dirname(pathPrefix)
    //  }
    //  pathPrefix = path.dirname(pathPrefix)
    //  aPath = aPath.replace(/^\$/, '')
    }  
    aPath = path.join(
      pathPrefix,
      aPath
    )  
    return path.normalize(aPath)
  }  

  static getSrcDir() {
    var srcDir = '.'
    const bConf = Config.theConfig['build']
    if (!bConf) return srcDir
    if (!bConf['srcDir']) return srcDir
    srcDir = bConf['srcDir']
    const buildDir = bConf['buildDir']
    if (buildDir) srcDir = srcDir.replaceAll('$buildDir', buildDir)
    return this.normalizePath(srcDir)
  }

  static getProjDescPath() {
    var projDescPath = 'projDesc.yaml'
    const bConf = Config.theConfig['build']
    if (!bConf) return projDescPath
    if (!bConf['projDescPath']) return projDescPath
    if (!bConf['projDescPath'].endsWith('.yaml')) return projDescPath
    projDescPath = bConf['projDescPath']
    const buildDir = bConf['buildDir']
    if (buildDir) projDescPath = projDescPath.replaceAll('$buildDir', buildDir)
    return this.normalizePath(projDescPath)
  }

  static async loadConfigFromFile(configPath) {
    var configText = ""
    logger.info(`Trying to load configuration from [${configPath}]`)
    try {
      configText = await fsp.readFile(configPath, 'utf8');
    } catch (error) {
      logger.info(`Could not load configuration from [${configPath}]`)
    }

    var fileConfig = {}
    if (configText) {
      logger.info(`Loaded configuration from [${configPath}]`)
      const lcConfigPath = configPath.toLowerCase() ;
      if (lcConfigPath.endsWith('yaml') || lcConfigPath.endsWith('yml')) {
        fileConfig = yaml.parse(configText) ;
      } else if (lcConfigPath.endsWith('toml')) {
        fileConfig = toml.parse(configText) ;
      } else if (lcConfigPath.endsWith('json')) {
        fileConfig = JSON.parse(configText) ;
      }
    }
    return fileConfig
  }

  static async loadConfig(cliArgs, configBaseName, defaultConfig, funcObj) {
    if (!funcObj) funcObj = {}
    const cliOpts = cliArgs.opts()
    var  logLevel = cliOpts.logLevel
    var   config  = {}
    var   fConfig = {}
    
    if (!logger.levels.values[logLevel]) { logLevel = 'info'}
    logger.level = logLevel
    if (!cliOpts.config) {
      for (const anExt of ['.yaml', '.yml', '.toml', '.json']) {
        cliOpts.config = configBaseName + anExt
        fConfig = await Config.loadConfigFromFile(cliOpts.config)
        if (0 < Object.keys(fConfig).length) break
      }
    } else {
      fConfig = await Config.loadConfigFromFile(cliOpts.config)
    }

    if (Object.keys(fConfig).length < 1) {
      logger.warn(`Could not load the configuration file [${cliOpts.config}]`)
      logger.warn("  continuing with out loaded configuration...")  
    } else {
      config = deepmerge(config, fConfig) ;
    }

    if (config['cfdoitConfig']) {
      var cfdoitConfig = await Config.loadConfigFromFile(
        Config.normalizePath('~/.config/cfdoit/config.toml')
      )
      if (0 < Object.keys(cfdoitConfig).length) {
        config = deepmerge(config, cfdoitConfig)
      }
  
      cfdoitConfig = await Config.loadConfigFromFile(
        Config.normalizePath(config['cfdoitConfig'])
      )
      if (0 < Object.keys(cfdoitConfig).length) {
        config = deepmerge(config, cfdoitConfig)
      }
    }

    if (0 < Object.keys(defaultConfig).length) {
      config = deepmerge(config, defaultConfig) ;
    }  
    logger.debug("\n--default config-------------------------------------------")
    logger.debug(yaml.stringify(config))
    logger.debug("-----------------------------------------------------------")
    
    logger.debug("\n--command line config--------------------------------------")
    logger.debug(yaml.stringify(cliOpts))
    logger.debug("-----------------------------------------------------------")
    
    config = deepmerge(config, cliOpts) ;
    
    logger.debug("\n--config file config---------------------------------------")
    logger.debug(yaml.stringify(config))
    logger.debug("-----------------------------------------------------------")

    try {
      if (funcObj['preLoadFunc']) funcObj['preLoadFunc'](config)
    } catch(err) {
      logger.warn("Failed to run preLoadFunc!")
      logger.warn(err)
    }
    
    if (config.loadActions && 0 < config.loadActions.length) {
      logger.debug("\n--loading actions----------------------------------------")

      await Promise.all(config.loadActions.map( async (anActionsPath) => {
        logger.trace(`starting to load actions from [${anActionsPath}]`)
        await ScopeActions.loadActionsFrom(anActionsPath, config)
        .catch(err => logger.warn(err))
        logger.trace(`finished loading actions from [${anActionsPath}]`)
      }))
      logger.debug("---------------------------------------------------------")
    }
    
    if (config.loadBuilders && 0 < config.loadBuilders.length) {
      logger.trace("\n--loading builders---------------------------------------")
      await Promise.all(config.loadBuilders.map( async (aBuildersPath) => {
        logger.trace(`starting to load builders from [${aBuildersPath}]`)
        await Builders.loadBuildersFrom(aBuildersPath, config)
          .catch(err => logger.warn(err))
          logger.trace(`finished loading builders from [${aBuildersPath}]`)
      }))
      logger.trace("---------------------------------------------------------")
    }
    
    if (config.loadGrammar && 0 < config.loadGrammar.length) {
      logger.trace("\n--loading grammars---------------------------------------")
      await Promise.all(config.loadGrammar.map( async (aGrammarPath) => {
        logger.trace(`starting to load grammar from [${aGrammarPath}]`)
        await Grammars.loadGrammarFrom(aGrammarPath)
              .catch(err => logger.warn(err))
        logger.trace(`finished loading grammar from [${aGrammarPath}]`)
      }))
      logger.trace("---------------------------------------------------------")
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
    
    try {
      if (funcObj['preRunFunc']) funcObj['preRunFunc'](config)
    } catch (err) {
      logger.warn("Failed to run preRunFunc!")
      logger.warn(err)
    }
    
    logger.debug("\n--config---------------------------------------------------")
    logger.debug(yaml.stringify(config))
    logger.debug("-----------------------------------------------------------")
    
    if (config['save']) {
      const savePath = config['save']
      const lcSavePath = savePath.toLowerCase()
      // ensure the follow DO NOT get saved...
      if (config['save'])         delete config['save']
      if (config['logLevel'])     delete config['logLevel']
      if (config['config'])       delete config['config']
      if (config['initialFiles']) delete config['initialFiles']
      // now save everything else!
      try {
        if (funcObj['preSaveFunc']) funcObj['preSaveFunc'](config)
      } catch(err) {
        logger.warn("Failed to run preSaveFunc!")
        logger.warn(err)
      }
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
