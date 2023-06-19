import { expect, should, assert } from  'chai'
import { EventEmitter } from 'events'

import { NoOpLogger, ArrayLogger, Logging } from '../lib/logging.mjs'

describe('ArrayLogger', function() {
  describe('#constructor()', function() {
    it('should return an ArrayLogger', function() {
      var anArray = []
      var arrayLogger = new ArrayLogger(anArray)
      expect(arrayLogger).is.instanceOf(ArrayLogger)
      expect(arrayLogger.theArray).is.equal(anArray)
      expect(anArray).is.empty
      var msg = "This is a test"
      arrayLogger.warn(msg)
      expect(anArray).is.not.empty
      expect(anArray[0][0]).is.equal("warn")
      expect(anArray[0][2]).is.equal(msg)
    })
  })
})

describe('NoOpLogger', function () {
  describe('#constructor()', function () {
    it('should return NoOpLogger instance', function () {
      var noOpLogger = new NoOpLogger()
      assert.isObject(noOpLogger)
      expect(noOpLogger).is.instanceOf(NoOpLogger)
      expect(noOpLogger).has.property('debug')
      expect(noOpLogger).has.property('level')
      expect(noOpLogger).has.property('levels')
    })
  })
})

describe('Logging', function () {
  describe('#options', function () {
    it('can be set (initially empty object)', function () {
      expect(Logging.options).is.eql({})
      Logging.setOptions({})
      assert.isDefined(Logging.options)
    })
  })

  describe('#destination', function () {
    it('can be set (initially pino.destination(Logging.logFilePath) )', function () {
      assert.isDefined(Logging.destination)
    })
  })

  describe('#getLogger', function () {
    it('should return correct loggers', function () {
      expect(Logging.loggers).not.to.have.property('loggerOne')
      var loggerOne = Logging.getLogger('loggerOne')
      expect(loggerOne).is.instanceOf(EventEmitter)
      expect(Logging.loggers).to.have.property('loggerOne')
      var loggerOneA = Logging.getLogger('loggerOne')
      assert.equal(loggerOne, loggerOneA)
    })
  })

  describe('#logFilePath', function() {
    it('should inclued "/tmp/lpicLogger_"', function() {
      expect(Logging.logFilePath).to.include('/tmp/lpicLogger_')
    })
  })

  describe('#getNoOpLogger', function(){
    it('should be a NoOpLogger', function() {
      expect(Logging.loggers).not.to.have.property('TheNoOpLogger')
      var noOpLogger = Logging.getNoOpLogger('TheNoOpLogger')
      expect(Logging.loggers).to.have.property('TheNoOpLogger')
      expect(noOpLogger).is.instanceOf(NoOpLogger)
      Logging.removeLogger('TheNoOpLogger')
      expect(Logging.loggers).not.to.have.property('TheNoOpLogger')
    })
  })

  describe('#getArrayLogger', function(){
    it('should be an ArrayLogger', function() {
      expect(Logging.loggers).not.to.have.property('TheArrayLogger')
      var anArray = []
      var arrayLogger = Logging.getArrayLogger('TheArrayLogger', anArray)
      expect(Logging.loggers).to.have.property('TheArrayLogger')
      expect(arrayLogger).is.instanceOf(ArrayLogger)
      expect(arrayLogger.theArray).is.equal(anArray)
    })
  })

})
