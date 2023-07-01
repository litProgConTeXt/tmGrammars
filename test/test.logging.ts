/**
 * Logging testing
 * 
 * We test the logging module
 * 
 * @module
 */

import { expect, should, assert } from  'chai'
import { EventEmitter } from 'events'

import { NoOpLogger, Logging } from '../lib/logging.js'

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

  

})
