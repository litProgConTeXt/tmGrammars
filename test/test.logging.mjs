import { expect, should, assert } from  'chai'
import { EventEmitter } from 'events'
import process from 'process'
import pino from 'pino'
import sinon from 'sinon'

import { NoOpLogger, Logging } from '../lib/logging.mjs'

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
  describe('#shouldLog', function (){
    it('should behave as a switch (initially on)', function() {
      assert(Logging.shouldLog)
      Logging.shouldLog = false
      assert.isFalse(Logging.shouldLog)
    })
  })

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
      Logging.shouldLog = true
      assert(Logging.shouldLog)
      expect(Logging.loggers).not.to.have.property('loggerOne')
      var loggerOne = Logging.getLogger('loggerOne')
      expect(loggerOne).is.instanceOf(EventEmitter)
      expect(Logging.loggers).to.have.property('loggerOne')
      var loggerOneA = Logging.getLogger('loggerOne')
      assert.equal(loggerOne, loggerOneA)
      Logging.shouldLog = false
      expect(Logging.loggers).not.to.have.property('loggerTwo')
      var loggerTwo = Logging.getLogger('loggerTwo')
      expect(loggerTwo).is.instanceOf(NoOpLogger)
      expect(Logging.loggers).to.not.have.property('loggerTwo')
    })
  })

  describe('#logFilePath', function() {
    it('should inclued "/tmp/lpicLogger_"', function() {
      expect(Logging.logFilePath).to.include('/tmp/lpicLogger_')
    })
  })
})
