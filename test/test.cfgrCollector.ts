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

describe('CfgrCollector', function() {

  describe('#clearMetaData', function() {
    it("should clear the IConfig's meta data", function() {
      const pAny = BaseConfig.prototype
      expect(pAny).has.property('_mixins')
      expect(pAny._mixins).eql(["BaseConfig"])
      expect(pAny).has.property('_key2fieldMapping')
      expect(pAny._key2fieldMapping.size).is.not.equal(0)
      IConfig.clearMetaData(BaseConfig)
      expect(pAny).has.property('_mixins')
      expect(pAny._mixins).eql(["BaseConfig"])
      expect(pAny).has.property('_key2fieldMapping')
      expect(pAny._key2fieldMapping.size).is.equal(0)
    })
  })

  describe('#normalizePath', function() {
    it('should normalize paths', function() {
    })
  })

  describe('#replaceTemplate', function() {
    it('should replace all template substrings', function() {
      var bConfig = new BaseConfig()
      var aTemplate = "this should be $logLevel and $logLevel shouldn't it?"
      var result = bConfig.replaceTemplate(aTemplate)
      expect(result).to.equal("this should be info and info shouldn't it?")
      var aTemplate = "this should be $logLevel/src and $logLevel+src shouldn't it?"
      var result = bConfig.replaceTemplate(aTemplate)
      expect(result).to.equal("this should be info/src and info+src shouldn't it?")
      aTemplate = "this should be ${logLevel} and ${logLevel} shouldn't it?"
      var result = bConfig.replaceTemplate(aTemplate)
      expect(result).to.equal("this should be info and info shouldn't it?")
      aTemplate = "this should be $logLevel and ${logLevel} shouldn't it?"
      var result = bConfig.replaceTemplate(aTemplate)
      expect(result).to.equal("this should be info and info shouldn't it?")
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

})