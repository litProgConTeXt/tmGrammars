/**
 * Testing Builders
 *
 * We test the Builder class by:
 *
 * - using the `constructor` and then checking that the correct fields have been
 *   set.
 *
 * - `run`ing the resulting builder using Sinon spies.
 *
 * We test the Builders class by:
 *
 * - adds a builder using `addBuilder`
 *
 * - gets the builder using `getBuilder`
 *
 * - DOES NOT test the `loadBuildersFrom` (since this requires javascript
 *   modules on the file-system)
 *
 * @module
 */

import { expect, should, assert } from  'chai'

import { Builders } from '../lib/builders.js'

describe('Builders', function() {
  describe('#something', function() {
    it.skip('should...', function() {
      // test something
    })
  })
})