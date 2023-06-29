/**
 * Base configuration
 *
 * ConfigClass provides a collection of (example) Type-Safe (TypeScript) Config
 * class for the LPiC projects.
 * 
 * @module
 */

import * as yaml from 'yaml'

import { Cfgr, appendStrArg } from "./configurator.js"

/**
 * Class: ConfigClass.BaseConfig
 * 
 * The base configuraiton class
 */
@Cfgr.klass()
export class BaseConfig {

  /**
   * Property: configPaths
   * 
   * (configPath: configPaths)
   * (cli: -c, --config)
   * 
   * An array of configuration paths which will be loaded in order.
   */
  @Cfgr.cliOption(
    'configPaths',
    '-c, --config <path>',
    `Load one or more configuration files (YAML|TOML|JSON)`,
    appendStrArg
  )
  @Cfgr.defaultStr('${configBaseName}.yaml')
  configPaths : Array<string> = []

  /**
   * Property: logLevel
   * 
   * (configPath: logLevel)
   * (cli: -ll, --logLevel)
   * 
   * The current Pino logLevel
   */
  @Cfgr.cliOption(
    'logLevel',
    '-ll, --logLevel <levelName>',
    'Set the Pino log level',
    undefined
  )  
  logLevel : string = 'info'

  /**
   * Property: loadActions
   * 
   * (configPath: load.actions)
   * (cli: -la, -loadActions)
   * 
   * An array of paths to LPiC actions to be used in this tool.
   */
  @Cfgr.cliOption(
    'load.actions',
    '-la, --loadActions <file>',
    'Load actions from a ES6 module',
    appendStrArg
  )
  loadActions : Array<string> = []

  /**
   * Property: loadBuilders
   * 
   * (configPath: load.builders)
   * (cli: -lb, --loadBuilders)
   * 
   * An array of paths to LPiC builders to be used in this tool.
   */
  @Cfgr.cliOption(
    'load.builders',
    '-lb, --loadBuilders <file>',
    'Load builders from an ES6 module',
    appendStrArg
  )
  loadBuilders : Array<string> = []

  /**
   * Property: loadedGrammars
   *
   * (configPath: load.grammars)
   * (cli: -lg, --loadGrammars)
   *
   * An array of paths to TextMate/LPiC grammars to be used in this tool.
   */
  @Cfgr.cliOption(
    'load.grammars',
    '-lg, --loadGrammar <file>',
    'Load a grammar from the file system (JSON|PLIST)',
    appendStrArg
  )
  loadedGrammars : Array<string> = []

  /**
   * Property: pathPrefix
   *
   * (configPath: pathPrefix)
   * (cli: --path)
   *
   * The path prefix to be prepended by <Configurator.Cfgr.normalizePath> to any
   * path that doesn't start with `~`
   */
  @Cfgr.cliOption(
    'pathPrefix',
    '--path <aPath>',
    "A path prefix to prepend to all files loaded which don't start with a '~|@|$'",
    undefined
  )
  pathPrefix : string = ""

  /**
   * Property: savePath
   *
   * (configPath: savePath)
   * (cli: -s, --save)
   *
   * A path in the file-system to which the currently loaded configuration will
   * be saved.
   */
  @Cfgr.cliOption(
    'savePath',
    '-s, --save <file>',
    'Save the current configuration into file (YAML|TOML|JSON)',
    undefined
  )
  savePath : string = ""

  /**
   * Property: parallel
   * 
   * (configPath: parallel)
   * (cli: -p, --parallel)
   * 
   * Run all scoped actions in parallel. (Default: false)
   */
    @Cfgr.cliOption(
      'parallel',
      '-p, --parallel',
      'Run all scoped actions in parallel',
      undefined
    )
    parallel : boolean = false

  /**
   * Property: initialFiles
   * 
   * (configPath: initialFiles)
   * 
   * The files to be parsed by the LPiC tool
   */
  @Cfgr.cliArgument(
    'initialFiles',
    '[path]',
    'The documents to parse',
    appendStrArg
  )
  initialFiles = []
}
