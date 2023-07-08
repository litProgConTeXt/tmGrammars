/**
 * Testing Configurator
 *
 * We test the Cfgr class by:
 *
 * -
 *
 * @module
 */


import os from 'os'
import * as yaml from 'yaml'
import { Command } from "commander"

import { expect, should, assert } from  'chai'

import { Cfgr, appendStrArg, appendRegExpArg } from '../lib/configurator.js'

// The base configuration class
@Cfgr.klass()
export class BaseConfig {

  // Does nothing... do not use
  constructor() {}

  /**
   *  An array of configuration paths which will be loaded in order.
   * 
   *  - **configPath:** configPaths
   *  - **cli:**        -c, --config
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

describe('Cfgr', function() {
  describe('#normalizePath', function() {
    it.skip('should normalize paths', function() {
    })
  })

  describe('#updateDefaults', function () {
    it('should update the defaults', function () {
      var config = new BaseConfig()
      expect(config).is.not.undefined
      expect(config.configPaths).is.instanceof(Array)
      expect(config.configPaths.length).is.equal(0)

      var context : Map<string, string> = new Map()
      context.set('configBaseName', 'tmgt')
      Cfgr.updateDefaults(config, context)
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
      Cfgr.loadConfigFromDict(config, '',testDict)
      //console.log(config)
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

  describe('#appendStrArg', function () {
    it('should append an string argument', function () {
      var result = appendStrArg("testA", undefined)
      expect(result).is.instanceof(Array)
      expect(result.length).is.equal(1)
      expect(result[0]).is.equal("testA")

      result = appendStrArg("testB", "testA")
      expect(result).is.instanceof(Array)
      expect(result.length).is.equal(2)
      expect(result[0]).is.equal("testA")
      expect(result[1]).is.equal("testB")

      result = appendStrArg("testC", ["testA", "testB"])
      expect(result).is.instanceof(Array)
      expect(result.length).is.equal(3)
      expect(result[0]).is.equal("testA")
      expect(result[1]).is.equal("testB")
      expect(result[2]).is.equal("testC")
    })
  })

  describe('#appendRegExpArg', function () {
    it('should append an string argument', function () {
      var result = appendRegExpArg("testA", undefined)
      expect(result).is.instanceof(Array)
      expect(result.length).is.equal(1)
      expect(result[0]).is.eql(/testA/)

      result = appendRegExpArg("testB", /testA/)
      expect(result).is.instanceof(Array)
      expect(result.length).is.equal(2)
      expect(result[0]).is.eql(/testA/)
      expect(result[1]).is.eql(/testB/)

      result = appendRegExpArg("testC", [/testA/, /testB/])
      expect(result).is.instanceof(Array)
      expect(result.length).is.equal(3)
      expect(result[0]).is.eql(/testA/)
      expect(result[1]).is.eql(/testB/)
      expect(result[2]).is.eql(/testC/)
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
      Cfgr.setupCommander(cliArgs, "test", "a test description", "0.0.1")
      cliArgs.parse([
        "anExecPath", "aScriptPath",
        "--config", "testConfig.yaml",
        "--logLevel", "trace",
        "--path", "/tmp/test",
        "--parallel",
        "testA1", "testB1"
      ])
      Cfgr.updateConfigFromCli(config, cliArgs)
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

  // should test getSrcDir and getProjDescPath ... eventually

  // should test loadConfigFromFile 

  // should test loadConfig

  // since these all touch the file system... we won't bother at the moment...
})