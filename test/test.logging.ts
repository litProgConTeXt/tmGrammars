/**
 * Logging testing
 * 
 * We test the logging module
 * 
 * @module
 */

import fs from "fs"

import { expect, should, assert } from 'chai'
import * as sinon                 from 'sinon'

import { ConsoleLogger, FileLogger, NoOpLogger, Logging } from '../lib/logging.js'

afterEach(function(){
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
      var flSpy  = sinon.spy()
      var flStub = sinon.stub(fs, "openSync").callsFake(flSpy).returns(42)
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

  

})
