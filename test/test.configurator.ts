/**
 * Testing Configurator
 *
 * We test the Cfgr class by:
 *
 * -
 *
 * @module
 */


import os from 'os'

import { expect, should, assert } from  'chai'

import { Cfgr } from '../lib/configurator.js'

describe('Configurator::Cfgr', function() {
  describe('#normalizePath', function() {
    it.skip('should normalize paths', function() {
    })
  })

  // should test getSrcDir and getProjDescPath ... eventually

  // should test loadConfigFromFile 

  // should test loadConfig

  // since these all touch the file system... we won't bother at the moment...
})