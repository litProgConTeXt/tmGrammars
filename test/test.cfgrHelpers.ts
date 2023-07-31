/**
 * Testing CfgrHelpers
 *
 * We test the CfgrHelpers class by:
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
}                      from '../lib/cfgrCollector.js'
import { CfgrHelpers } from '../lib/cfgrHelpers.js'

var cfgr = new CfgrCollector()

// The base configuration class
@cfgr.klass()
export class BaseConfig extends IConfig{

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

cfgr = new CfgrCollector()

@cfgr.klass()
class BuildConfig extends IConfig {

  // Does nothing... do not use
  constructor() {super()}

  /**
   * Run all scoped actions in parallel. (Default: false)
   * 
   * - **configPath:** parallel
   * - **cli:** -p, --parallel
   */
  @cfgr.cliOption(
    'test',
    '-t, --test',
    'Test',
    undefined
  )
  test : boolean = false
}

const testYaml = `
configPaths: 
  - cTestA
  - cTestB
logLevel: trace
pathPrefix: /tmp/test
parallel: true
initialFiles: 
  - testA
  - testB
`
describe('CfgrHelpers', function() {
  
  describe('#updateDefaults', function () {
    it('should update the defaults', function () {
      var config = new BaseConfig()
      expect(config).is.not.undefined
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(0)
      
      var context : Map<string, string> = new Map()
      context.set('configBaseName', 'tmgt')
      CfgrHelpers.updateDefaults(config, context)
      expect(config).is.not.undefined
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(1)
      expect(config.configPaths[0]).is.equal("tmgt.yaml")
    })
  })
  
  describe('#loadConfigFromDict', function () {
    it('should load configuration from a dictionary', function () {
      var config = new BaseConfig()
      expect(config).is.not.undefined
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(0)
      expect(config.parallel).is.false
      expect(config.logLevel).is.equal("info")
      expect(config.pathPrefix).is.equal("")
      expect(config.initialFiles).is.instanceof(Array)
      expect(config.initialFiles.length).is.equal(0)

      var testDict = yaml.parse(testYaml)
      CfgrHelpers.loadConfigFromDict(<IConfig>config, '',testDict)
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(2)
      expect(config.configPaths[1]).is.equal("cTestB")
      expect(config.parallel).is.true
      expect(config.logLevel).is.equal("trace")
      expect(config.pathPrefix).is.equal("/tmp/test")
      expect(config.initialFiles).is.instanceof(Array)
      expect(config.initialFiles.length).is.equal(2)
      expect(config.initialFiles[1]).is.equal("testB")
    })
  })
  
  
  describe('#parseCliOptions', function () {
    it('should parse the cli options and set the config', function () {
      var config = new BaseConfig()
      expect(config).is.not.undefined
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(0)
      expect(config.parallel).is.false
      expect(config.logLevel).is.equal("info")
      expect(config.pathPrefix).is.equal("")
      expect(config.initialFiles).is.instanceof(Array)
      expect(config.initialFiles.length).is.equal(0)
      var cliArgs = new Command()
      CfgrHelpers.setupCommander(config, cliArgs, "test", "a test description", "0.0.1")
      cliArgs.parse([
        "anExecPath", "aScriptPath",
        "--config", "testConfig.yaml",
        "--logLevel", "trace",
        "--path", "/tmp/test",
        "--parallel",
        "testA1", "testB1"
      ])
      CfgrHelpers.updateConfigFromCli(config, cliArgs)
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(1)
      expect(config.configPaths[0]).is.equal("testConfig.yaml")
      expect(config.parallel).is.true
      expect(config.logLevel).is.equal("trace")
      expect(config.pathPrefix).is.equal("/tmp/test")
      expect(config.initialFiles).is.instanceof(Array)
      expect(config.initialFiles.length).is.equal(2)
      expect(config.initialFiles[1]).is.equal("testB1")
    })
  })

  describe('#assembleConfigFrom', function () {
    it('should assemble a configuration from a collection of mixins', function () {
      var config = <BaseConfig>CfgrHelpers.assembleConfigFrom(
        BaseConfig, BuildConfig
      )
      expect(config).is.not.undefined
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(0)
      expect(config.parallel).is.false
      expect(config.logLevel).is.equal("info")
      expect(config.pathPrefix).is.equal("")
      expect(config.initialFiles).is.instanceof(Array)
      expect(config.initialFiles.length).is.equal(0)
      expect(config.implements("BaseConfig")).is.true
      expect(config.implements(BaseConfig)).is.true
      expect(config.implements("TestBaseConfig")).is.false
      expect(config.implements(console.log)).is.false
      expect(config.implements(console)).is.false
      expect(config.implements("BuildConfig")).is.true
      expect(config.implements(BuildConfig)).is.true
    })
  })
  
  // should test getSrcDir and getProjDescPath ... eventually
  
  // should test loadConfigFromFile 
  
  // should test loadConfig
  
  // since these all touch the file system... we won't bother at the moment...

})
