import * as os   from "os"
import * as path from "path"

import { Logging, ValidLogger } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpil')

/**
 * The prototype of all argParsers.
 *
 * An argParser is added to the cliOption or cliArgument decorators to specify
 * how command line arguments should be added to the configuration instance.
 * 
 * @param newArg - the value of the new option or argument
 * @param oldArg - the array of existing options or arguments collected for this type
 *                 of option or argument
 * 
 * @returns an (flat) Array of all new and old arguments.
 */
export type ArgParserFunction =
  (newArg : string, oldArg : any | any[] | undefined) => any

/**
 * An argParserFunction which is used internally to collect additional option
 * or argument strings into a single array.
 *
 * see: Commanderjs/typings/main.d.ts
 * > argParser<T>(fn: (value: string, previous: T) => T): this
 *
 * @param newArg - the value of the new option or argument
 * @param oldArg - the array of existing options or arguments collected for this
 *                 type of option or argument
 * 
 * @returns an (flat) Array of all new and old arguments as Strings.
 */
export function appendStrArg(newArg : string, oldArg : string | string[] | undefined) {
  if (oldArg === undefined) oldArg = []
  if (!Array.isArray(oldArg)) oldArg = [ oldArg ]
  oldArg.push(newArg)
  return oldArg
}

/**
 * An argParserFunction which is used internally to collect additional option
 * or argument strings, as pre-compiled RegExps, into a single array.
 *
 * see: Commanderjs/typings/main.d.ts
 * > argParser<T>(fn: (value: string, previous: T) => T): this
 *
 * @param newArg - the value of the new option or argument
 * @param oldArg - the array of existing options or arguments collected for this type
 *                 of option or argument
 * 
 * @returns an (flat) Array of all new and old arguments converted to RegExps.
 */
export function appendRegExpArg(newArg : string, oldArg : RegExp | RegExp[] | undefined) {
  if (oldArg === undefined) oldArg = []
  if (!Array.isArray(oldArg)) oldArg = [ oldArg ]
  const newRegExpArg = new RegExp(newArg)
  oldArg.push(newRegExpArg)
  return oldArg
}

// Commander Options provides an internal representaion of a particular
// definition of a Commander option/argument.
export class CommanderOptions {

  /**
   * Construct a new CommanderOptions definition.
   *
   * @param configPath - the configPath (a dotted path to configuration value in
   * the loaded YAML/TOML/JSON ).
   * @param field      - the name/symbol of the configuration field in the typed
   * configuration instance.
   * @param flags      - the Commander option/argument flags.
   * @param description - the Commander option/argument help description.
   * @param anArgParser - the argParserFunction used to process this argument.
   * @param isArgument  - is this option/argument an argument?
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
  
  // the config path
  configPath : string

  // the field
  field : string | symbol

  // the Commander flags
  flags : string

  // the Commander description
  description : string

  // An arg parser used to process this argument
  argParser : ArgParserFunction | undefined

  // Is this an arugment (as opposed to an option)?
  isArgument : boolean
}

// A string or symbol.
export type SString = string | symbol

export class IConfig {

  static clearMetaData(config : IConfigConstructor) {
    const pAny = config.prototype
    // keep the pAny._mixins unchanged
    pAny._key2fieldMapping      = new Map()
    pAny._defaultStringsMapping = new Map()
    pAny._cliOptions            = []
    pAny._cliOpt2fieldMapping   = new Map()
  }

  _mixins                : Array<string>
  _key2fieldMapping      : Map<string, string>
  _defaultStringsMapping : Map<SString, string>
  _cliOptions            : Array<CommanderOptions>
  _cliOpt2fieldMapping   : Map<string, SString>

  constructor() {
    const pAny = Object.getPrototypeOf(this)
    this._mixins                = pAny._mixins                || []
    this._key2fieldMapping      = pAny._key2fieldMapping      || new Map()
    this._defaultStringsMapping = pAny._defaultStringsMapping || new Map()
    this._cliOptions            = pAny._cliOptions            || []
    this._cliOpt2fieldMapping   = pAny._cliOpt2fieldMapping   || new Map()
  }

  implements(aType : any) : boolean {
    if (typeof aType === 'string') {
      if (this._mixins.includes(aType)) return true
    } else if (typeof aType === 'function') {
      if (this._mixins.includes(aType.name)) return true
    }
    return false
  }

  pathPrefix : string = ""

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
  normalizePath(aPath : string) {
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

  replaceTemplate(aTemplate : string) : string {
    var aRegExp     = /\${?(\w+)}?/g
    var templateAny = <any>aTemplate
    var thisAny     = <any>this
    var result      = aTemplate
    if (aTemplate.includes("$")) {
      result = templateAny.replaceAll(
        aRegExp,
        function(wholeMatch : string, mappingKey : string):string{
          //console.log(`aTemplate: [${aTemplate}]`)
          //console.log(`wholeMatch: [${wholeMatch}]`)
          //console.log(`mappingKey: [${mappingKey}]`)
          var replaceResult = wholeMatch
          if (thisAny[mappingKey]) {
            var aValue = thisAny[mappingKey]
            if (aValue) replaceResult = String(aValue)
          }
          return replaceResult
        }
      )
    }
    return result
  }
}

// see: https://www.simonholywell.com/post/typescript-constructor-type.html
export type IConfigConstructor<Config extends IConfig = IConfig> = new () => Config

export class CfgrCollector {

  //////////////////////////////////////////////////////////////////////////////
  // topic: configuration files
  //
  // implement the filesystem YAML/TOML/JSON configuration file to typed
  // configuration field mappings 
  //

  /**
   * The key -> field mapping.
   * 
   * @category Configuration Files
   */
  key2fieldMapping : Map<string, string> = new Map()

  /**
   * Stringify (using Logging) the key to field mapping.
   * 
   * @category Configuration Files
   */
  stringifyKey2field() {
    return Logging.stringify(this.key2fieldMapping)
  }

  /**
   * Add a dotted configuration path <-> field mapping
   * 
   * @param aConfigPath - the dotted configuration path
   * @param contextName - the field name
   *
   * @category Configuration Files
   */
  addConfigPath( aConfigPath : string, contextName : string | symbol) {
    this.key2fieldMapping.set(aConfigPath, String(contextName))
  }

  /**
   * A **decorator** which marks a given object/any field as a configured field.
   *
   * @param aConfigPath - the dotted configuration path to associate with this
   * configured field.
   *
   * @category Configuration Files
   */
  key (aConfigPath : string) {
    const self = this
    return function decorator (value : undefined , context : ClassFieldDecoratorContext) {
      self.addConfigPath(aConfigPath, context.name)
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // topic: configuration defaults
  //
  // deal with (explicit) defaults
  
  /**
   * Map a configured field to a string which provides a default value.
   * 
   * @category Configuration Defaults
   */
  defaultStringsMapping : Map<string| symbol, string> = new Map()

  /**
   * A **decorator** used to associate a default string with a configured field.
   *
   * @param aDefaultStr - the string to be used as the initial default value for
   * the associated configured field.
   *
   * @category Configuration Defaults
   */
  defaultStr(aDefaultStr : string) {
    const self = this
    return function decorator (value: undefined, context : ClassFieldDecoratorContext) {
      self.defaultStringsMapping.set(context.name, aDefaultStr)
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // topic: command line options
  //
  // deal with <Commander: https://github.com/tj/commander.js/> based command
  // line options....
  //

  /**
   * The array of Commander cli options (<Configurator.CommanderOptions)
   * 
   * @category Command Line Options
   */
  cliOptions : Array<CommanderOptions> = []

  /**
   * The mapping of cli option keys (usually the long option without the `--) to
   * configured fields.
   * 
   * @category Command Line Options
   */
  cliOpt2fieldMapping : Map<string, SString> = new Map()
  
  /**
   * Stingify (via YAML) the currently known array of Commander cli options
   * 
   * @category Command Line Options
   */
  stringifyCliOptions() {
    return Logging.stringify(this.cliOptions)
  }

  /**
   * A **decorator** which associates a configuration path, and a command line
   * _option_ with a configured field.
   *
   * @param configPath - the configPath (a dotted path to configuration value in
   * the loaded YAML/TOML/JSON ).
   * @param flags      - the Commander option flags.
   * @param description - the Commander option help description.
   * @param anArgParser - the argParserFunction used to process this argument.
   *
   * @category Command Line Options
   */
  cliOption(
    aConfigPath : string,
    flags : string,
    description : string,
    anArgParser : ArgParserFunction | undefined
  ) {
    const self = this
    return function decoration(value : any, context : ClassFieldDecoratorContext) {
      self.addConfigPath(aConfigPath, context.name)
      self.cliOptions.push(new CommanderOptions(
        aConfigPath, context.name, flags, description, anArgParser, false
      ))
    }
  }

  /**
   * A **decorator** which associates a configuration path, and a command line
   * _argument_ with a configured field.
   *
   * @param configPath - the configPath (a dotted path to configuration value in
   * the loaded YAML/TOML/JSON )
   * @param flags      - the Commander argument flags.
   * @param description - the Commander argument help description.
   * @param anArgParser - the argParserFunction used to process this argument.
   *
   * @category Command Line Options
   */
  cliArgument(
    aConfigPath : string,
    flags : string,
    description : string,
    anArgParser : ArgParserFunction | undefined
  ) {
    const self = this
    return function decoration(value: any, context : ClassFieldDecoratorContext) {
      self.addConfigPath(aConfigPath, context.name)
      self.cliOptions.push(new CommanderOptions(
        aConfigPath, context.name, flags, description, anArgParser, true
      ))
    }
  }

  //////////////////////////////////////////////////////////////////////////////
  // topic: typed classes
  //
  // append collected field information on the class
  //

  /**
   * A **decorator** which marks a class as part of the typed configuration.
   *
   * **NOTE**: we require the use of a decorator *factory* so that we can access
   * the CfgrCollector instance variables (using `self`)
   *
   * @category Typed Classes
   */
  klass () {
    const self = this
    return function decorator(
      value : Function,
      context : ClassDecoratorContext
    ) {
      value.prototype._mixins                = [ context.name ]
      value.prototype._key2fieldMapping      = self.key2fieldMapping
      value.prototype._defaultStringsMapping = self.defaultStringsMapping
      value.prototype._cliOptions            = self.cliOptions
      value.prototype._cliOpt2fieldMapping   = self.cliOpt2fieldMapping
    }
  }

}
