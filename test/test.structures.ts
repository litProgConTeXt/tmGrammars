/**
 * Testing Structures
 *
 * We test the Structures module by:
 *
 * - first trying to `getStructure` using a name we know does not exist
 *
 * - then using `newStructure` to register a simple structure (Array) using the
 *   name `test2`
 *
 * - then using `getStructure` to get the previously registered structure
 *   `test2`
 *
 * - the using `getStructureNames` check that the result has the single name
 *   `test2`.
 *
 * @module
 */

import { expect, should, assert } from  'chai'

import { Structures } from '../lib/structures.js'

describe('Structures', function() {
  describe('#{get/new}Structure', function() {
    it('should behave as expected...', function() {
      var anObj = Structures.getStructure("test1")
      expect(anObj).to.be.undefined
      var test2 = [ "this", "is", "a", "test"]
      anObj = Structures.newStructure("test2", test2)
      expect(anObj).to.not.be.undefined
      expect(anObj).to.equal(test2)

      anObj = Structures.getStructure("test2")
      expect(anObj).to.not.be.undefined
      expect(anObj).to.equal(test2)

      var someNames = Structures.getStructureNames()
      expect(someNames).is.instanceof(Array)
      expect(someNames.length).is.equal(1)
      expect(someNames[0]).is.equal("test2")
    })
  })

})