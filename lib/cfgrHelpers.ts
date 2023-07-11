/**
 * A simple tool to declare configuration information for a Type-Safe
 * (TypeScript) Config class.
 *
 * This code has been inspired by:
 * [typed-config](https://github.com/christav/typed-config)
 *
 * This consists of three parts...
 *
 * 1. - We provide tools to extract meta-data from an application's Type-save
 *      (TypeScript) Config class.
 *
 * 2. - We provide tools to load configuration information from a list of
 *      directories/files with a range of well known file-extensions.
 *
 * 3. - We provide a tool to merge in-comming configuration information (from a
 *      single config file on the file-system) into the application's Config
 *      class.
 *
 * We use the <TypeScript v5.0 ("modern") decorators:
 * https://2ality.com/2022/10/javascript-decorators.html> and especially the
 * subsection: <how are decoratros executed:
 * https://2ality.com/2022/10/javascript-decorators.html#how-are-decorators-executed%3F>
 *
 * @module
 */

// Reference paths are relative to *this* file...
/// <reference path="../node_modules/typescript/lib/lib.decorators.d.ts" />

import { Command, Option, Argument } from "commander"
import   * as fsp                    from "fs/promises"
import   * as os                     from "os"
import   * as path                   from "path"
import   toml                        from "@ltd/j-toml"
import   * as yaml                   from 'yaml'

import { 
  SString,
  CommanderOptions,
  IConfig
}                                      from "./cfgrCollector.ts"
import { Logging, ValidLogger       } from "./logging.ts"

const logger : ValidLogger = Logging.getLogger('lpic')

// Cfgr is the global Configurator class (it has no useful instances)
export class CfgrHelpers {

  // Does nothing... do not use
  constructor() {}

  //////////////////////////////////////////////////////////////////////////////
  // @cateogry Path normalization
  //
  // deal with file-system path normalization
  //

  // TODO fix this!!!!
  static pathPrefix : string = ""

  /**
   * normalize the given path
   *
   * At the moment, we can normalize any path that begins with `~` to the user's
   * home directory.
   *
   * Normalize paths using the built in `path.normalize` function.
   *
   * @param aPath - the filesystem path to be normalized
   * 
   * @category Path Normalization
   */
  static normalizePath(aPath : string) {
    var pathPrefix = process.cwd()
    if (this.pathPrefix && (0 < this.pathPrefix.length))
      pathPrefix = this.pathPrefix
  
    if (aPath.startsWith('~')) {
      // load from a home directory
      pathPrefix = os.homedir()
      if (!aPath.startsWith('~/') && !aPath.startsWith('~\\') && aPath !== '~') {
        pathPrefix = path.dirname(pathPrefix)
      }  
      aPath = aPath.replace(/^~/, '')
    //} else if (aPath.startsWith('@')) {
    //  // load from node_modules....
    //  pathPrefix = path.dirname(__filename)
    //  while ( pathPrefix && !pathPrefix.endsWith('node_modules')) {
    //    pathPrefix = path.dirname(pathPrefix)
    //  }
    //  aPath = aPath.replace(/^@/, '')
    //} else if (aPath.startsWith('$')) {
    //  // load from this repository...
    //  pathPrefix = path.dirname(__filename)
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

 
  //////////////////////////////////////////////////////////////////////////////
  // topic: configuration files
  //
  // implement the filesystem YAML/TOML/JSON configuration file to typed
  // configuration field mappings 
  //

  /**
   * load the configuration from a dictionary/object/any.
   *
   * We walk the sub-dictionaries building up a dotted "path" to a given
   * configuration item.
   *
   * For each item found, we check the <key2fieldMapping> to see if there is a
   * configuration field to hold this value. IF there is a corresponding
   * configuration field, AND their types match, we update the field.
   *
   * @param aConfigInstance - the typed configuration object/any which stores
   * all values
   * @param baseConfigPath - the current dotted path to this dictionary
   * @param aConfigDict - the current configuration dictionary/object/any which
   * is being searched for known configuraiton values.
   *
   * @category Configuration Files
   */
  static loadConfigFromDict(
    aConfigInstance : IConfig, // a configuration instance
    baseConfigPath : string,
    aConfigDict : any
  ) {
    logger.debug(`loadFromDict (1): ${baseConfigPath} ${typeof aConfigDict}`)
    const aCfgAny = <any>aConfigInstance
    var aField = aConfigInstance._key2fieldMapping.get(baseConfigPath)
    if (aField) {
      logger.debug(`loadFromDict (2): ${aField} ${typeof aCfgAny[aField]}`)
      if (typeof aCfgAny[aField] === typeof aConfigDict) {
        if (aConfigDict instanceof Array) {
          aCfgAny[aField].push(...aConfigDict)
        } else {
          aCfgAny[aField] = aConfigDict
        }
      }
    } else if (aConfigDict instanceof Array) {
      // ignore!
    } else if (typeof aConfigDict === "object") {
      logger.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
      logger.debug(yaml.stringify(aConfigDict))
      logger.debug("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
      Object.keys(aConfigDict).forEach(function(aKey: string | symbol){
        CfgrHelpers.loadConfigFromDict(
          aConfigInstance,
          ((0 < baseConfigPath.length) ?
            baseConfigPath + '.' + String(aKey) :
            String(aKey)
          ),
          aConfigDict[aKey]
        )
      })
    }
  }

  /**
   * Load configuration from an external YAML/TOML/JSON file.
   *
   * @param aConfigInstance - the typed configuration object/any which stores all
   * values
   * @param aConfigPath - the file-system path to the YAML/TOML/JSON file to be loaded.
   *
   * @category Configuration Files
   */
  static async loadConfigFromFile(aConfigInstance : any, aConfigPath : string) {
    logger.debug(`LOADING from ${aConfigPath}`)
    var configText : string = ""
    logger.debug(`Trying to load configuration from [${aConfigPath}]`)
    try {
      configText = await fsp.readFile(aConfigPath, 'utf8');
    } catch (error) {
      logger.debug(`Could not load configuration from [${aConfigPath}]`)
    }

    var fileConfig : any = {}
    if (configText) {
      logger.debug(`Loaded configuration from [${aConfigPath}]`)
      const lcConfigPath : string = aConfigPath.toLowerCase() ;
      if (lcConfigPath.endsWith('yaml') || lcConfigPath.endsWith('yml')) {
        fileConfig = yaml.parse(configText) ;
      } else if (lcConfigPath.endsWith('toml')) {
        fileConfig = toml.parse(configText) ;
      } else if (lcConfigPath.endsWith('json')) {
        fileConfig = JSON.parse(configText) ;
      }
    }
    if (fileConfig) {
      CfgrHelpers.loadConfigFromDict(aConfigInstance, "", fileConfig)
    }
    logger.debug("---------------")
    logger.debug(yaml.stringify(aConfigInstance))
    logger.debug("---------------")
  }

  /**
   * *Iteratively* load configuration files from any files listed in the
   * *configured* `configPaths` array in the `aConfigInstance` object. The
   * *configured* `configPaths` array can be updated/changed from any previous
   * iteration.
   *
   * @param aConfigInstance - the typed configuration object/any which stores
   * all values
   * @param configPaths - An array of config file paths to be added to any paths
   * already configured in the `aConfigIntance`s `configPaths` array.
   *
   * @category Configuration Files
   */

  static async loadConfigFiles(aConfigInstance : any , configPaths : Array<string>) {
    var loadedPaths : Array<string> = []
    if ( ! ('configPaths' in aConfigInstance) ) {
      aConfigInstance['configPaths'] = []
    }
    aConfigInstance['configPaths'].push(...configPaths)
    logger.debug(yaml.stringify(aConfigInstance))
    var morePaths : boolean = true
    while (morePaths) {
      logger.debug("Checking for next config path")
      logger.debug(yaml.stringify(loadedPaths))
      morePaths = false
      for (const aConfigPath of aConfigInstance['configPaths']) {
        if (loadedPaths.includes(aConfigPath)) continue
        morePaths = true
        loadedPaths.push(aConfigPath)
        logger.debug(`>>>> ${aConfigPath} >>>>`)
        await this.loadConfigFromFile(
          aConfigInstance, this.normalizePath(aConfigPath)
        )
        logger.debug(`<<<< ${aConfigPath} <<<<`)
        break
      }
    }
  }
  
  //////////////////////////////////////////////////////////////////////////////
  // topic: configuration defaults
  //
  // deal with (explicit) defaults
  
  /**
   * Walk through all known defaults and save their values into the
   * corresponding fields. 
   *
   * The default strings may contain JavaScript string interpolation operators
   * `${aKey}` which will be replaced with the corresponding value found in the
   * `aMapping` key->value mapping. This allows the default strings to contain
   * information which is only provided later in the initialization process.
   *
   * @param aConfigInstance - the typed configuration object/any which stores
   * all values
   * @param aMapping - a key->value mapping used to interpolate the default
   * string.
   *
   * @category Configuration Defaults
   */
  static updateDefaults(aConfigInstance : any, aMapping : Map<string, string>) {
    aConfigInstance.defaultStringsMapping.forEach(function(aDefaultStr : string, aKey : SString){
      if (aKey in aConfigInstance) {
        var aRegExp = /\${([^\}]+)}/g
        // The following is an evil bodge!
        // but nodejs v15.3.1 does not seem to recognize "compilerOptions:lib:['es2021']"
        var theBodge : any = aDefaultStr
        var result = theBodge.replaceAll(
          aRegExp,
          function(wholeMatch : string, mappingKey : string):string{
            var aValue = aMapping.get(mappingKey)
            if (aValue) { 
              aValue = String(aValue)
              return aValue
            }
            return wholeMatch
          }
        )
        if (aConfigInstance[aKey] instanceof Array) {
          aConfigInstance[aKey].push(result)
        } else {
          aConfigInstance[aKey] = result
        }
      }
    })
  }

  //////////////////////////////////////////////////////////////////////////////
  // topic: command line options
  //
  // deal with <Commander: https://github.com/tj/commander.js/> based command
  // line options....
  //

  /**
   * Setup the Commander command line interface
   *
   * @param cliArgs - a new Commander instance
   * @param name - the name of the application as used by the Commander
   * framework.
   * @param description - the description of the application as used by the
   * Commander framework.
   * @param version - the version of the application as used by the Commander
   * framework.
   *
   * @category Command Line Options
   */
  static setupCommander(
    aConfigInstance : any,
    cliArgs : Command,
    name : string,
    description : string,
    version : string
  ) {
    cliArgs.name(name).description(description).version(version)
    aConfigInstance.cliOptions.forEach(function(aCmdOpt : CommanderOptions){
      if (aCmdOpt.isArgument) {
        var anArgument : Argument = new Argument(aCmdOpt.flags, aCmdOpt.description)
        if (aCmdOpt.argParser) {anArgument.argParser(aCmdOpt.argParser) }
        cliArgs.addArgument(anArgument)
      } else {
        var anOption : Option = new Option(aCmdOpt.flags, aCmdOpt.description)
        var cliOpt = 'unknown'
        if (anOption.long) {
          cliOpt = anOption.long.replace('--','')
        } else if (anOption.short) {
          cliOpt = anOption.short.replace('--','')
        }
        aConfigInstance.cliOpt2fieldMapping.set(cliOpt, aCmdOpt.field)
        if (aCmdOpt.argParser) { 
          anOption.argParser(aCmdOpt.argParser)
        }
        cliArgs.addOption(anOption)
      }
    })
  }

  /**
   * Set the configured values with their associated command line options.
   *
   * @param aConfigInstance - the typed configuration object/any which stores
   * all values
   * @param cliArgs - a configured Commander instance
   *
   * @category Command Line Options
   */
  static updateConfigFromCli(aConfigInstance : any, cliArgs : Command) {
    if ((0 < cliArgs.args.length) && aConfigInstance['initialFiles']) {
      cliArgs.args.forEach(function (anInitialFile) {
        aConfigInstance['initialFiles'].push(anInitialFile)
      })
    }
    var cliOpts = cliArgs.opts()
    logger.debug(typeof cliOpts)
    Object.keys(cliOpts).forEach(function(aKey: string){
      var aValue = cliOpts[aKey]
      var aField = aConfigInstance.cliOpt2fieldMapping.get(aKey)
      if (aField && (typeof aConfigInstance[aField] === typeof aValue)) {
        if (aValue instanceof Array) {
          var valueArray : Array<string> = aValue
          aConfigInstance[aField].push(...valueArray)
        } else {
          aConfigInstance[aField] = aValue          
        }
      }
    })
  }

  /**
   * Build the Commander command line interface, then parse the command line
   * arguments, and then set the configured values with their associated command
   * line options.
   *
   * @param aConfigInstance - the typed configuration object/any which stores
   * all values
   * @param name - the name of the application as used by the Commander
   * framework.
   * @param description - the description of the application as used by the
   * Commander framework.
   * @param version - the version of the application as used by the Commander
   * framework.
   *
   * @category Command Line Options
   */
  static parseCliOptions(aConfigInstance : any, name : string, description : string, version : string) {
    var cliArgs = new Command()
    CfgrHelpers.setupCommander(
      aConfigInstance, cliArgs, name, description, version
    )
    cliArgs.parse(process.argv)
    CfgrHelpers.updateConfigFromCli(aConfigInstance, cliArgs)
  }

  /**
   * Assemble a configuration instance from a collection of configuration
   * classes.
   */
  static assembleConfigFrom(...configKlasses : Array<any>) : any {
    return {}
  }
}
