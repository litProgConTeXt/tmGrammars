/**
 * Testing ScopeActions
 *
 * We test the ScopeAction class by:
 *
 * - using the `constructor` and then checking that the correct fields have been
 *   set.
 *
 * - `run`ing the resulting scopeAction using Sinon spies.
 *
 * We test the ScopeActions class by:
 *
 * - adds a scopeAction using `addScopedAction`
 *
 * - gets the scopeAction using `getAction`, `hasAction`,
 *   `getScopesWithActions`, and `runActionsStartingWith`
 *
 * - DOES NOT test the `loadActionsFrom` (since this requires javascript modules
 *   on the file-system)
 *
 * @module
 */

import { expect, should, assert } from  'chai'

import { ScopeActions } from '../lib/scopeActions.js'

describe('ScopeActions', function() {
  describe('#something', function() {
    it.skip('should...', function() {
      // test something
    })
  })
})