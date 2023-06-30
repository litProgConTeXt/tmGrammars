/**
 * Logging testing
 * 
 * We test the logging module
 * 
 * @module
 */

import { expect, should, assert } from  'chai'
import { EventEmitter } from 'events'

//import pkg from '../out/logging.js';
//const { NoOpLogger, ArrayLogger, Logging } = pkg;

import { NoOpLogger, ArrayLogger, Logging } from '../lib/logging.js'

describe('ArrayLogger', function() {
  describe('#constructor()', function() {
    it('should return an ArrayLogger', function() {
      var anArray : Array<Array<any>> = []
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

  describe('#getLogger', function () {
    it('should return correct loggers', function () {
      expect(Logging.loggers).not.to.include('loggerOne')
      var loggerOne = Logging.getLogger('loggerOne')
      expect(loggerOne).is.instanceOf(EventEmitter)
      assert(Logging.loggers.has('loggerOne'))
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
      expect(Logging.loggers.has('TheNoOpLogger')).is.false
      var noOpLogger = Logging.getNoOpLogger('TheNoOpLogger')
      expect(Logging.loggers.has('TheNoOpLogger')).is.true
      expect(noOpLogger instanceof NoOpLogger).is.true
      Logging.removeLogger('TheNoOpLogger')
      expect(Logging.loggers.has('TheNoOpLogger')).is.false
    })
  })

  describe('#getArrayLogger', function(){
    it('should be an ArrayLogger', function() {
      expect(Logging.loggers.has('TheArrayLogger')).is.false
      var anArray : Array<Array<any>> = []
      var arrayLogger = Logging.getArrayLogger('TheArrayLogger', anArray)
      expect(Logging.loggers.has('TheArrayLogger')).is.true
      expect(arrayLogger instanceof ArrayLogger).is.true
      expect(arrayLogger.theArray).is.equal(anArray)
    })
  })

})
