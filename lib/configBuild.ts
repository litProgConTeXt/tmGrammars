/**
 * Building configuration
 *
 * ConfigClass provides a collection of (example) Type-Safe (TypeScript) Config
 * class for the LPiC projects.
 * 
 * @module
 */

import * as yaml from 'yaml'

import { Cfgr, appendStrArg } from "./configurator.js"
import { BaseConfig         } from "./configBase.js"

/**
 * Class: ConfigClass.BuildConfig
 *
 * The configuration used by the LPiC-tool to extract source code from a LPiC
 * document.
 */
@Cfgr.klass()
export class BuildConfig extends BaseConfig {

  /**
   * Property: buildSrcDir
   * 
   * (configPath: build.srcDir)
   * 
   * The directory into which all extracted source code should be put.
   */
  @Cfgr.key('build.srcDir')
  buildSrcDir : string = ""

  /**
   * Property: buildBuildDir
   * 
   * (configPath: build.buildDir)
   * 
   * The directory in which all building should take place.
   */
  @Cfgr.key('build.buildDir')
  buildBuildDir : string = ""

  /** 
   * Property: buildProjDescPath
   * 
   * (configPath: build.projDescPath)
   * 
   * The path into which the LPiC tool should save the project description.
   */
  @Cfgr.key('build.projDescPath')
  buildProjDescPath : string = ""

  /**
   * Property: ignoreConfig
   * 
   * (configPath: ignoreConfig)
   * 
   * Should the configuraiton files be loaded?
   */
  @Cfgr.key('ignoreConfig')
  ignoreConfig : boolean = false
}
