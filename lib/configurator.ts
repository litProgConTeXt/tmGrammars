/**
 * Configurator
 *
 * A simple tool to declare configuration information for a Type-Safe
 * (TypeScript) Config class.
 *
 * This code has been inspired by: <typed-config:
 * https://github.com/christav/typed-config>
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

import { Logging, ValidLogger       } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')

type ArgParserFunction =
  (newArg : string, oldArg : any | any[] | undefined) => any

/**
 * Function: appendStrArg
 *
 * A helper function which is used internally to collect additional options or
 * arguments of the same type into a single array.
 *
 * see: Commanderjs/typings/main.d.ts
 * > argParser<T>(fn: (value: string, previous: T) => T): this
 * 
 * Parameters:
 *
 * newArg - the value of the new option or argument
 *
 * oldArg - the array of existing options or arguments collected for this type
 *          of option or argument
 */
export function appendStrArg(newArg : string, oldArg : string | string[] | undefined) {
  if (oldArg === undefined) oldArg = []
  if (!Array.isArray(oldArg)) oldArg = [ oldArg ]
  oldArg.push(newArg)
  return oldArg
}

/**
 * Function: appendRegExpArg
 *
 * A helper function which is used internally to collect additional options or
 * arguments of the same type into a single array.
 *
 * see: Commanderjs/typings/main.d.ts
 * > argParser<T>(fn: (value: string, previous: T) => T): this
 * 
 * Parameters:
 *
 * newArg - the value of the new option or argument
 *
 * oldArg - the array of existing options or arguments collected for this type
 *          of option or argument
 */
export function appendRegExpArg(newArg : string, oldArg : RegExp | RegExp[] | undefined) {
  if (oldArg === undefined) oldArg = []
  if (!Array.isArray(oldArg)) oldArg = [ oldArg ]
  const newRegExpArg = new RegExp(newArg)
  oldArg.push(newRegExpArg)
  return oldArg
}

/**
 * Class: Configurator.CommanderOptions
 *
 * Commander Options provides an internal representaion of Commander
 * option/arguments.
 */
class CommanderOptions {

  /**
   * Function: constructor
   *
   * Construct a new CommanderOptions instance
   *
   * Parameters: 
   *
   * configPath - the configPath (a dotted path to configuration value in the
   * loaded YAML/TOML/JSON ).
   *
   * field      - the name/symbol of the configuration field in the typed
   * configuration instance.
   *
   * flags      - the Commander option/argument flags.
   * 
   * description - the Commander option/argument help description.
   * 
   * anArgParser - anArgParser used to process this argument.
   * 
   * isArgument  - is this option/argument an argument?
   */
  constructor(
    configPath : string, 
    field : string | symbol,
    flags : string,
    description : string,
    anArgParser : ArgParserFunction | undefined,
    isArgument : boolean
  ) {
    this.configPath = configPath
    this.field = field
    this.flags = flags
    this.description = description
    this.argParser = anArgParser
    this.isArgument = isArgument
  }
  
  /** Property: configPath
   *  the config path */
  configPath : string

  /** Property: field
   *  the field */
  field : string | symbol

  /** Property: flags
   *  the Commander flags */
  flags : string

  /** Property: description
   * the Commander description */
  description : string

  /** Property: anArgParser
   * An arg parser used to process this argument */
  argParser : ArgParserFunction | undefined

  /** Property: isArgument
   *  Is this an arugment (as opposed to an option)? */
  isArgument : boolean
}

/**
 * Type: SString
 * 
 * A string or symbol.
 */
type SString = string | symbol

/**
 * Class: Configurator.Cfgr
 * 
 * Cfgr is the Configurator class
 */
export class Cfgr {

  //////////////////////////////////////////////////////////////////////////////
  // Topic: path normalization
  //
  // deal with file-system path normalization
  //

  /**
   * Property: pathPrefix
   *
   * pathPrefix is a string which if not empty is used by the <normalizePath>
   * method as the (default) pathPrefix.
   */
  static pathPrefix : string = ""

  /**
   * Function: updatePathPrefix
   *
   * *private*: update the pathPrefix
   *
   * Paramters:
   *
   * aConfigInstance -- get the default pathPrefix from this object if it has
   *                    the `pathPrefix` property.
   */
  static updatePathPrefix(aConfigInstance : any) {
    if (('pathPrefix' in aConfigInstance) && 
        (0 < aConfigInstance['pathPrefix'].length)) {
      Cfgr.pathPrefix = aConfigInstance['pathPrefix']
    }
  }

  /**
   * Function: normalizePath
   *
   * *public*: normalize the given path
   *
   * At the moment, we can normalize any path that begins with `~` to the user's
   * home directory.
   *
   * Normalize paths using the built in `path.normalize` function.
   *
   * Parameters:
   *
   * aPath - the filesystem path to be normalized
   */
  static normalizePath(aPath : string) {
    var pathPrefix = process.cwd()
    if (0 < Cfgr.pathPrefix.length) pathPrefix = Cfgr.pathPrefix
  
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
  // topic: typed classes
  //
  // deal with classes (not really used yet...)
  //

  /**
   * Property: configClasses
   * 
   * The collection of known typed configuration classes in this project
   */
  static configClasses : Array<Function> = []
  
  /**
   * Function: listConfigClasses
   * 
   * List the known typed configuration classes.
   */
  static listConfigClasses() {
    const classNames : Array<Function> = []
    //const classNames : Array<string> = []
    Cfgr.configClasses.forEach(function(aKlass){
      classNames.push(aKlass)
      //classNames.push(aKlass.name)
    })
    return classNames
  }
  
  /**
   * Function: klass
   * 
   * A *decorator* which marks a class as part of the typed configuration.
   */
  static klass (/*pathArray : Array<string>*/) {
    return function decorator(value : Function, context : ClassDecoratorContext) {
      Cfgr.configClasses.push(value)
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // topic: configuration files
  //
  // implement the filesystem YAML/TOML/JSON configuration file to typed
  // configuration field mappings 
  //

  /**
   * Property: key2filedMapping
   * 
   * The key to field mapping.
   */
  static key2fieldMapping : Map<string, string> = new Map()
  //static field2keyMapping : Map<string, string> = new Map()

  /**
   * Function: stringifyKey2Field
   * 
   * Stringify (using YAML) the key to field mapping.
   */
  static stringifyKey2field() {
    return yaml.stringify(Cfgr.key2fieldMapping)
  }

  /**
   * Function: loadConfigFromDict
   *
   * *private*: load the configuration from a dictionary/object/any.
   *
   * We walk the sub-dictionaries building up a dotted "path" to a given
   * configuration item.
   *
   * For each item found, we check the <key2fieldMapping> to see if there is a
   * configuration field to hold this value. IF there is a corresponding
   * configuration field, AND their types match, we update the field.
   *
   * Parameters:
   *
   * aConfigInstance - the typed configuration object/any which stores all
   * values
   *
   * baseConfigPath - the current dotted path to this dictionary
   *
   * aConfigDict - the current configuration dictionary/object/any which is
   * being searched for known configuraiton values.
   *
   */
  static loadConfigFromDict(aConfigInstance : any, baseConfigPath : string, aConfigDict : any) {
    logger.debug(`loadFromDict (1): ${baseConfigPath} ${typeof aConfigDict}`)
    var aField = Cfgr.key2fieldMapping.get(baseConfigPath)
    if (aField) {
      logger.debug(`loadFromDict (2): ${aField} ${typeof aConfigInstance[aField]}`)
      if (typeof aConfigInstance[aField] === typeof aConfigDict) {
        if (aConfigDict instanceof Array) {
          aConfigInstance[aField].push(...aConfigDict)
        } else {
          aConfigInstance[aField] = aConfigDict
        }
      }
    } else if (aConfigDict instanceof Array) {
      // ignore!
    } else if (typeof aConfigDict === "object") {
      logger.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
      logger.debug(yaml.stringify(aConfigDict))
      logger.debug("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
      Object.keys(aConfigDict).forEach(function(aKey: string | symbol){
        Cfgr.loadConfigFromDict(
          aConfigInstance,
          ((0 < baseConfigPath.length) ?
            baseConfigPath + '.' + String(aKey) :
            String(aKey)
          ),
          aConfigDict[aKey]
        )
      })
    }
    Cfgr.updatePathPrefix(aConfigInstance)
  }

  /**
   * Function: loadConfigFromFile
   *
   * *private*: Load configuration from an external YAML/TOML/JSON file.
   *
   * Parameters:
   *
   * aConfigInstance - the typed configuration object/any which stores all
   * values
   * 
   * aConfigPath - the file-system path to the YAML/TOML/JSON file to be loaded.
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
      const lcConfigPath :string = aConfigPath.toLowerCase() ;
      if (lcConfigPath.endsWith('yaml') || lcConfigPath.endsWith('yml')) {
        fileConfig = yaml.parse(configText) ;
      } else if (lcConfigPath.endsWith('toml')) {
        fileConfig = toml.parse(configText) ;
      } else if (lcConfigPath.endsWith('json')) {
        fileConfig = JSON.parse(configText) ;
      }
    }
    if (fileConfig) {
      Cfgr.loadConfigFromDict(aConfigInstance, "", fileConfig)
    }
    logger.debug("---------------")
    logger.debug(yaml.stringify(aConfigInstance))
    logger.debug("---------------")
  }

  /**
   * Function: loadConfigFiles
   *
   * *public* _Iteratively_ load configuration files from any files listed in
   * the _configured_ `configPaths` array in the `aConfigInstance` object. The
   * _configured_ `configPaths` array can be updated/changed from any previous
   * iteration.
   *
   * Parameters:
   *
   * aConfigInstance - the typed configuration object/any which stores all
   * values
   *
   * configPaths - An array of config file paths to be added to any paths
   * already configured in the `aConfigIntance`s `configPaths` array.
   */

  static loadConfigFiles(aConfigInstance : any , configPaths : Array<string>) {
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
        Cfgr.loadConfigFromFile(
          aConfigInstance, Cfgr.normalizePath(aConfigPath)
        ).catch((err) => logger.error(err)).finally()
        logger.debug(`<<<< ${aConfigPath} <<<<`)
        break
      }
    }
  }

  /**
   * Function: addConfigPath
   * 
   * *private* add a dotted configuration path <-> field mapping
   * 
   * Parameters:
   * 
   * aConfigPath - the dotted configuration path
   * 
   * contextName - the field name
   */
  static addConfigPath( aConfigPath : string, contextName : string | symbol) {
    Cfgr.key2fieldMapping.set(aConfigPath, String(contextName))
  }

  /**
   * Function: key
   *
   * *public* a *decorator* which marks a given object/any field as a configured
   * field.
   *
   * Parameters:
   *
   * aConfigPath - the dotted configuration path to associate with this
   * configured field.
   */
  static key (aConfigPath : string) {
    return function decorator (value : undefined , context : ClassFieldDecoratorContext) {
      Cfgr.addConfigPath(aConfigPath, context.name)
    }
  }
  
  //////////////////////////////////////////////////////////////////////////////
  // topic: configuration defaults
  //
  // deal with (explicit) defaults
  
  /**
   * Property: defaultStringsMapping
   *
   * Map a configured field to a string which provides a default value.
   */
  static defaultStringsMapping : Map<string| symbol, string> = new Map()

  /**
   * Function: updateDefaults
   *
   * *public* walk through all known defaults and save their values into the
   * corresponding fields. 
   *
   * The default strings may contain JavaScript string interpolation operators
   * `${aKey}` which will be replaced with the corresponding value found in the
   * `aMapping` key->value mapping. This allows the default strings to contain
   * information which is only provided later in the initialization process.
   *
   * Parameters:
   *
   * aConfigInstance - the typed configuration object/any which stores all
   * values
   *
   * aMapping - a key->value mapping used to interpolate the default string.
   */
  static updateDefaults(aConfigInstance : any, aMapping : Map<string, string>) {
    Cfgr.defaultStringsMapping.forEach(function(aDefaultStr : string, aKey : SString){
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
    Cfgr.updatePathPrefix(aConfigInstance)
  }

  /**
   * Function: defaultStr
   *
   * A *decorator* used to associate a default string with a configured field.
   *
   * Parameters:
   *
   * aDefaultStr - the string to be used as the initial default value for the
   * associated configured field.
   */
  static defaultStr(aDefaultStr : string) {
    return function decorator (value: undefined, context : ClassFieldDecoratorContext) {
      Cfgr.defaultStringsMapping.set(context.name, aDefaultStr)
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // topic: command line options
  //
  // deal with <Commander: https://github.com/tj/commander.js/> based command
  // line options....
  //
  /**
   * Property: cliOptions
   * 
   * The array of Commander cli options (<Configurator.CommanderOptions)
   */
  static cliOptions : Array<CommanderOptions> = []

  /**
   * Property: cliOpt2fieldMapping
   *
   * The mapping of cli option keys (usually the long option without the `--) to
   * configured fields.
   */
  static cliOpt2fieldMapping : Map<string, string | symbol> = new Map()
  
  /**
   * Function: stringifyCliOptions
   *
   * Stingify (via YAML) the currently known array of Commander cli options
   */
  static stringifyCliOptions() {
    return yaml.stringify(Cfgr.cliOptions)
  }

  /**
   * Function: parseCliOptions
   *
   * *public* Build the Commander command line interface, then parse the command
   * line arguments, and then set the configured values with their associated
   * command line options.
   *
   * Parameters:
   *
   * aConfigInstance - the typed configuration object/any which stores all
   * values
   *
   * name - the name of the application as used by the Commander framework.
   *
   * description - the description of the application as used by the Commander
   * framework.
   *
   * version - the version of the application as used by the Commander
   * framework.
   */
  static parseCliOptions(aConfigInstance : any, name : string, description : string, version : string) {
    var cliArgs = new Command()
    cliArgs.name(name).description(description).version(version)
    Cfgr.cliOptions.forEach(function(aCmdOpt : CommanderOptions){
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
        Cfgr.cliOpt2fieldMapping.set(cliOpt, aCmdOpt.field)
        if (aCmdOpt.argParser) { anOption.argParser(aCmdOpt.argParser) }
        cliArgs.addOption(anOption)
      }
    })
    cliArgs.parse(process.argv)
    var cliOpts = cliArgs.opts()
    logger.debug(typeof cliOpts)
    Object.keys(cliOpts).forEach(function(aKey: string){
      var aValue = cliOpts[aKey]
      var aField = Cfgr.cliOpt2fieldMapping.get(aKey)
      if (aField && (typeof aConfigInstance[aField] === typeof aValue)) {
        if (aValue instanceof Array) {
          var valueArray : Array<string> = aValue
          aConfigInstance[aField].push(...valueArray)
        } else {
          aConfigInstance[aField] = aValue          
        }
      }
    })
    Cfgr.updatePathPrefix(aConfigInstance)
  }

  /**
   * Function: cliOption
   *
   * A *decorator* which associates a configuration path, and a command line
   * _option_ with a configured field.
   * 
   * Parameters:
   * 
   * configPath - the configPath (a dotted path to configuration value in the
   * loaded YAML/TOML/JSON ).
   *  
   * flags      - the Commander option flags.
   * 
   * description - the Commander option help description.
   * 
   */
  static cliOption(
    aConfigPath : string,
    flags : string,
    description : string,
    anArgParser : ArgParserFunction | undefined
  )  {
    return function decoration(value : any, context : ClassFieldDecoratorContext) {
      Cfgr.addConfigPath(aConfigPath, context.name)
      Cfgr.cliOptions.push(new CommanderOptions(
        aConfigPath, context.name, flags, description, anArgParser, false
      ))
    }
  }

  /**
   * Function: cliArgument
   *
   * A *decorator* which associates a configuration path, and a command line
   * _argument_ with a configured field.
   *
   * Parameters:
   *
   * configPath - the configPath (a dotted path to configuration value in the
   * loaded YAML/TOML/JSON ).
   *
   * flags      - the Commander argument flags.
   *
   * description - the Commander argument help description.
   *
   */
  static cliArgument(
    aConfigPath : string,
    flags : string,
    description : string,
    anArgParser : ArgParserFunction | undefined
  ) {
    return function decoration(value: any, context : ClassFieldDecoratorContext) {
      Cfgr.addConfigPath(aConfigPath, context.name)
      Cfgr.cliOptions.push(new CommanderOptions(
        aConfigPath, context.name, flags, description, anArgParser, true
      ))
    }
  }

}
