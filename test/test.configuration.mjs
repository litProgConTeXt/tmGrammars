import os from 'os'

import { expect, should, assert } from  'chai'

import { Config } from '../lib/configuration.mjs'

describe('Config', function() {
  describe('#normalizePath', function() {
    it('should normalize paths', function() {
      var aPath = Config.normalizePath('~')
      expect(aPath).is.equal(os.homedir())
      // the form '@test' should normalize to the node_modules/test path...
      // the form '$test' should normalize to this module's test path...
      // but at the moment we have removed both implementations
      //aPath = Config.normalizePath('@test')
      //console.log(aPath)
    })
  })

  // should test getSrcDir and getProjDescPath ... eventually

  // should test loadConfigFromFile 

  // should test loadConfig

  // since these all touch the file system... we won't bother at the moment...
})