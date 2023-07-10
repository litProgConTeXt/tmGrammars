/**
 * Base configuration
 *
 * The ConfigClasses provide a collection of Type-Safe (TypeScript)
 * Configuration class for the LPiC projects.
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

import * as yaml from 'yaml'

import { Cfgr, appendStrArg } from "./configurator.js"
import { ConsoleLogger }      from "./logging.js"

// The base configuration class
export class BaseConfig extends Cfgr {

  // Does nothing... do not use
  constructor() {
    super()
  }

  /**
   *  An array of configuration paths which will be loaded in order.
   * 
   *  - **configPath:** configPaths
   *  - **cli:**        -c, --config
   */
  @this.cliOption(
    'configPaths',
    '-c, --config <path>',
    `Load one or more configuration files (YAML|TOML|JSON)`,
    appendStrArg
  )
  @Cfgr.defaultStr('${configBaseName}.yaml')
  configPaths : Array<string> = []

  /**
   * The current logger logLevel (see: {@link ConsoleLogger.level})
   * 
   * - **configPath:** logLevel
   * - **cli:** -ll, --logLevel
   */
  @Cfgr.cliOption(
    'logLevel',
    '-ll, --logLevel <levelName>',
    'Set the logger log level',
    undefined
  )  
  logLevel : string = 'info'

  /**
   * An array of paths to LPiC actions to be used in this tool.
   * 
   * - **configPath:** load.actions
   * - **cli:** -la, -loadActions
   */
  @Cfgr.cliOption(
    'load.actions',
    '-la, --loadActions <file>',
    'Load actions from a ES6 module',
    appendStrArg
  )
  loadActions : Array<string> = []

  /**
   * An array of paths to LPiC builders to be used in this tool.
   * 
   * - **configPath:** load.builders
   * - **cli:** -lb, --loadBuilders
   */
  @Cfgr.cliOption(
    'load.builders',
    '-lb, --loadBuilders <file>',
    'Load builders from an ES6 module',
    appendStrArg
  )
  loadBuilders : Array<string> = []

  /**
   * An array of paths to TextMate/LPiC grammars to be used in this tool.
   *
   * - **configPath:** load.grammars
   * - **cli:** -lg, --loadGrammars
   */
  @Cfgr.cliOption(
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
  @Cfgr.cliOption(
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
  @Cfgr.cliOption(
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
    @Cfgr.cliOption(
      'parallel',
      '-p, --parallel',
      'Run all scoped actions in parallel',
      undefined
    )
    parallel : boolean = false

  /**
   * The files to be parsed by the LPiC tool
   * 
   * - **configPath:** initialFiles
   * - **cli:** all remaining (non-optional) arguments
   */
  @Cfgr.cliArgument(
    'initialFiles',
    '[path]',
    'The documents to parse',
    appendStrArg
  )
  initialFiles : string[] = []
}
