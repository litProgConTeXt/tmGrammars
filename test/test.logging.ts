/**
 * Testing Logging
 *
 * We test the logging module by:
 *
 * - individually constructing Console, NoOp and File Loggers, checking:
 *   - their logging levels, 
 *   - that they log at all levels below the logging level
 *   - that they do not log at any levels above the logging level
 *   - While testing the `FileLogger` we manipulate the `LPIC_LOG_FILE`, and
 *     `LPIC_LOG_PREFIX` environment variables to ensure the correct behaviour.
 * 
 * - Using the Logging `getLogger`, `getNoOpLogger`, `getConsoleLogger` and
 *   `getFileLogger` methods to ensure the correct loggers are returned.
 *
 *   - While testing the `getLogger` method we manipulate the `LPIC_NO_LOG`,
 *     `LPIC_CONSOLE_LOG` and `LPIC_LOG_LEVEL` environment variables to ensure
 *     the correct behaviour.
 * @module
 */

import fs from "fs"

import { expect, should, assert } from 'chai'
import * as sinon                 from 'sinon'

import { ConsoleLogger, FileLogger, NoOpLogger, Logging } from '../lib/logging.js'

//var clSpy  = sinon.spy()

beforeEach(function() {
//  sinon.restore()
//  clSpy = sinon.spy()
//  var openSyncStub = sinon.stub(fs, "openSync").callsFake(clSpy).returns(42)
  var closeSyncStub = sinon.stub(fs, "closeSync")
})

afterEach(function(){
  Logging.close()
  sinon.restore()
})

describe('NoOpLogger', function () {
  describe('#constructor()', function () {
    it('should return NoOpLogger instance', function () {
      var noOpLogger = new NoOpLogger("aLog")
      assert.isObject(noOpLogger)
      expect(noOpLogger).is.instanceOf(NoOpLogger)
      expect(noOpLogger).has.property('debug')
      expect(noOpLogger).has.property('level')
      expect(noOpLogger.level).is.equal(30)
      expect(noOpLogger.isLevelEnabled(Logging.WARN)).to.be.false
    })
  })
})

describe('ConsoleLogger', function(){
  describe('#constructor()', function () {
    it('should return ConsoleLogger instance', function () {
      var clSpy  = sinon.spy()
      var clStub = sinon.stub(console, "log").callsFake(clSpy)
      var cLogger = new ConsoleLogger("aLog")
      assert.isObject(cLogger)
      expect(cLogger).is.instanceOf(ConsoleLogger)
      expect(cLogger.level).is.equal(30)
      cLogger.warn("This is a test")
      expect(clSpy.getCall(0).args[0]).is.equal(40)
      expect(clSpy.getCall(0).args[1][0]).is.equal("This is a test")
      cLogger.trace("This is another test")
      expect(clSpy.calledOnce).is.true
    })
  })
})

describe('FileLogger', function(){
  describe('#constructor()', function () {
    it('should return FileLogger instance', function () {
      var flStub = sinon.stub(fs, "openSync").returns(42)
      process.env.LPIC_LOG_FILE = "test.log"
      var fLogger = new FileLogger("aLog1")
      expect(fLogger.logFilePath).is.equal("test.log")
      expect(fLogger.logFile).is.equal(42)
      delete process.env.LPIC_LOG_FILE
      process.env.LPIC_LOG_PREFIX = "testDir"
      fLogger = new FileLogger("aLog2")
      expect(fLogger.logFilePath.startsWith("testDir_")).is.true
      delete process.env.LPIC_LOG_PREFIX
      fLogger = new FileLogger("aLog3")
      expect(fLogger.logFilePath.startsWith("/tmp/lpic_"))
    })
  })
})

describe('Logging', function () {
  describe('#getLogger', function() {
    it('should return the correct type of logger', function() {
      var flStub = sinon.stub(fs, "openSync").returns(42)

      var aLogger = Logging.getLogger("aLog1")
      expect(aLogger).is.instanceof(FileLogger)
      expect(aLogger.logName).is.equal("aLog1")
      expect(aLogger.level).is.equal(30)

      aLogger = Logging.getLogger("aLog1a")
      expect(aLogger).is.instanceof(FileLogger)
      expect(aLogger.logName).is.not.equal("aLog1a")
      expect(aLogger.logName).is.equal("aLog1")
      expect(aLogger.level).is.equal(30)
      delete Logging.theLogger

      process.env.LPIC_LOG_LEVEL="20"
      aLogger = Logging.getLogger("aLog2")
      expect(aLogger).is.instanceof(FileLogger)
      expect(aLogger.logName).is.equal("aLog2")
      expect(aLogger.level).is.equal(20)
      delete Logging.theLogger

      process.env.LPIC_CONSOLE_LOG="true"
      aLogger = Logging.getLogger("aLog3")
      expect(aLogger).is.instanceof(ConsoleLogger)
      expect(aLogger.logName).is.equal("aLog3")
      expect(aLogger.level).is.equal(20)
      delete Logging.theLogger

      delete process.env.LPIC_LOG_LEVEL
      aLogger = Logging.getLogger("aLog4")
      expect(aLogger).is.instanceof(ConsoleLogger)
      expect(aLogger.logName).is.equal("aLog4")
      expect(aLogger.level).is.equal(30)
      delete Logging.theLogger

      process.env.LPIC_NO_LOG="true"
      aLogger = Logging.getLogger("aLog5")
      expect(aLogger).is.instanceof(NoOpLogger)
      expect(aLogger.logName).is.equal("aLog5")
      expect(aLogger.level).is.equal(30)
      delete Logging.theLogger

      delete process.env.LPIC_CONSOLE_LOG
      aLogger = Logging.getLogger("aLog6")
      expect(aLogger).is.instanceof(NoOpLogger)
      expect(aLogger.logName).is.equal("aLog6")
      expect(aLogger.level).is.equal(30)
      delete Logging.theLogger

      delete process.env.LPIC_NO_LOG
      aLogger = Logging.getLogger("aLog7")
      expect(aLogger).is.instanceof(FileLogger)
      expect(aLogger.logName).is.equal("aLog7")
      expect(aLogger.level).is.equal(30)
    })
  })

  describe('#getNoOpLogger', function() {
    it('should return a NoOpLogger', function() {
      //var flStub1 = sinon.stub(fs, "openSync").returns(42)

      var aLogger = Logging.getNoOpLogger("aLog")
      expect(aLogger).is.instanceof(NoOpLogger)
      expect(Logging.theLogger).is.equal(aLogger)
    })
  })
  
  describe('#getConsoleLogger', function() {
    it('should return a ConsoleLogger', function() {
      //var flStub1 = sinon.stub(fs, "openSync").returns(42)

      var aLogger = Logging.getConsoleLogger("aLog")
      expect(aLogger).is.instanceof(ConsoleLogger)
      expect(Logging.theLogger).is.equal(aLogger)
    })
  })

  describe('#getFileLogger', function() {
    it('should return a FileLogger', function() {
      var flStub1 = sinon.stub(fs, "openSync").returns(42)

      var aLogger = Logging.getFileLogger("aLog")
      expect(aLogger).is.instanceof(FileLogger)
      expect(Logging.theLogger).is.equal(aLogger)
    })
  })
})
