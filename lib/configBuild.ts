/**
 * Building configuration
 *
 * The ConfigClasses provide a collection of Type-Safe (TypeScript)
 * Configuration class for the LPiC projects.
 * 
 * This class extends the BaseConfig with configuration for:
 * 
 *  - saving build artefacts
 *
 * @module
 */

import * as yaml from 'yaml'

import { Cfgr, appendStrArg } from "./configurator.js"
import { BaseConfig         } from "./configBase.js"

// The configuration used by the LPiC-tool to extract source code from a LPiC
// document.
@Cfgr.klass()
export class BuildConfig extends BaseConfig {

  /**
   * The directory into which all extracted source code should be put.
   * 
   * - **configPath:** build.srcDir
   */
  @Cfgr.key('build.srcDir')
  buildSrcDir : string = ""

  /**
   * The directory in which all building should take place.
   * 
   * - **configPath:** build.buildDir
   */
  @Cfgr.key('build.buildDir')
  buildBuildDir : string = ""

  /** 
   * The path into which the LPiC tool should save the project description.
   * 
   * - **configPath:** build.projDescPath
   */
  @Cfgr.key('build.projDescPath')
  buildProjDescPath : string = ""

  /**
   * Should the configuration files be loaded?
   * 
   * - **configPath:** ignoreConfig
   */
  @Cfgr.key('ignoreConfig')
  ignoreConfig : boolean = false
}
