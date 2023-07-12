/**
 * Testing CfgrCollector
 *
 * We test the CfgrCollector class by:
 *
 * -
 *
 * @module
 */


import os from 'os'
import * as yaml from 'yaml'
import { Command } from "commander"

import { expect, should, assert } from  'chai'

import {
  IConfig,
  CfgrCollector,
  appendStrArg,
  appendRegExpArg
} from '../lib/cfgrCollector.js'
import { CfgrHelpers } from '../lib/cfgrHelpers.js'

const cfgr = new CfgrCollector()

// The base configuration class
@cfgr.klass()
export class BaseConfig extends IConfig {

  // Does nothing... do not use
  constructor() {super()}

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
   * The files to be parsed by the LPiC tool
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

