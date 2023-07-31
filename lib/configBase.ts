/**
 * Base configuration
 *
 * The ConfigClasses provide a collection of Type-Safe (TypeScript)
 * Configuration class for the LPiL projects.
 * 
 * This is the base of the ConfigClass hierarchy.
 * 
 * It defines the configuration which is common to all tools for example:
 * 
 *  - loading grammars
 *  - loading scoped actions
 *  - loading builders
 *
 * @module
 */

import { 
  IConfig,
  CfgrCollector,
  appendStrArg
} from "./cfgrCollector.js"
import { ConsoleLogger                } from "./logging.js"

const cfgr = new CfgrCollector()

// The base configuration class
@cfgr.klass()
export class BaseConfig extends IConfig {

  // Does nothing... do not use
  constructor() { super() }

  /**
   *  An array of configuration paths which will be loaded in order.
   * 
   *  - **configPath:** configPaths
   *  - **cli:**        -c, --config
   */
  @cfgr.cliOption(
    'configPaths',
    '-c, --config <path>',
    `Load one or more configuration files (YAML|TOML|JSON)`,
    appendStrArg
  )
  @cfgr.defaultStr('${configBaseName}.yaml')
  configPaths : Array<string> = []

  /**
   * The current logger logLevel (see: {@link ConsoleLogger.level})
   * 
   * - **configPath:** logLevel
   * - **cli:** -ll, --logLevel
   */
  @cfgr.cliOption(
    'logLevel',
    '-ll, --logLevel <levelName>',
    'Set the logger log level',
    undefined
  )  
  logLevel : string = 'info'

  /**
   * An array of paths to LPiL actions to be used in this tool.
   * 
   * - **configPath:** load.actions
   * - **cli:** -la, -loadActions
   */
  @cfgr.cliOption(
    'load.actions',
    '-la, --loadActions <file>',
    'Load actions from a ES6 module',
    appendStrArg
  )
  loadActions : Array<string> = []

  /**
   * An array of paths to LPiL builders to be used in this tool.
   * 
   * - **configPath:** load.builders
   * - **cli:** -lb, --loadBuilders
   */
  @cfgr.cliOption(
    'load.builders',
    '-lb, --loadBuilders <file>',
    'Load builders from an ES6 module',
    appendStrArg
  )
  loadBuilders : Array<string> = []

  /**
   * An array of paths to TextMate/LPiL grammars to be used in this tool.
   *
   * - **configPath:** load.grammars
   * - **cli:** -lg, --loadGrammars
   */
  @cfgr.cliOption(
    'load.grammars',
    '-lg, --loadGrammar <file>',
    'Load a grammar from the file system (JSON|PLIST)',
    appendStrArg
  )
  loadGrammars : Array<string> = []

  /**
   * The path prefix to be prepended by {@link Cfgr.normalizePath } to any path
   * that doesn't start with `~`
   *
   * - **configPath:** pathPrefix
   * - **cli:** --path
   */
  @cfgr.cliOption(
    'pathPrefix',
    '--path <aPath>',
    "A path prefix to prepend to all files loaded which don't start with a '~|@|$'",
    undefined
  )
  pathPrefix : string = ""

  /**
   * A path in the file-system to which the currently loaded configuration will
   * be saved.
   *
   * - **configPath:** savePath
   * - **cli:** -s, --save
   */
  @cfgr.cliOption(
    'savePath',
    '-s, --save <file>',
    'Save the current configuration into file (YAML|TOML|JSON)',
    undefined
  )
  savePath : string = ""

  /**
   * Run all scoped actions in parallel. (Default: false)
   * 
   * - **configPath:** parallel
   * - **cli:** -p, --parallel
   */
  @cfgr.cliOption(
    'parallel',
    '-p, --parallel',
    'Run all scoped actions in parallel',
    undefined
  )
  parallel : boolean = false

  /**
   * The files to be parsed by the LPiL tool
   * 
   * - **configPath:** initialFiles
   * - **cli:** all remaining (non-optional) arguments
   */
  @cfgr.cliArgument(
    'initialFiles',
    '[path]',
    'The documents to parse',
    appendStrArg
  )
  initialFiles : string[] = []
}
