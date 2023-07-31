/**
 * Building configuration
 *
 * The ConfigClasses provide a collection of Type-Safe (TypeScript)
 * Configuration class for the LPiL projects.
 * 
 * This class extends the IConfig with configuration for:
 * 
 *  - saving build artefacts
 *
 * @module
 */

import { IConfig, CfgrCollector, appendStrArg  } from "./cfgrCollector.js"

const cfgr = new CfgrCollector()

// The configuration used by the LPiL-tool to extract source code from a LPiL
// document.
@cfgr.klass()
export class BuildConfig extends IConfig {

  /**
   * The directory into which all extracted source code should be put.
   * 
   * - **configPath:** build.srcDir
   */
  @cfgr.key('build.srcDir')
  srcDir : string = ""

  /**
   * The directory in which all building should take place.
   * 
   * - **configPath:** build.buildDir
   */
  @cfgr.key('build.buildDir')
  buildDir : string = ""

  /** 
   * The path into which the LPiL tool should save the project description.
   * 
   * - **configPath:** build.projDescPath
   */
  @cfgr.key('build.projDescPath')
  buildProjDescPath : string = ""

  /**
   * Should the configuration files be loaded?
   * 
   * - **configPath:** ignoreConfig
   */
  @cfgr.key('ignoreConfig')
  ignoreConfig : boolean = false
}
