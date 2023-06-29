/**
 * LPiC code builders
 * 
 * LPiC Builders are used to assemble a collection of data contained in
 * structures into one or more output files on the file-system.
 * 
 * @module
 */

import * as fsp  from "fs/promises"
import * as path from "path"
import * as yaml from "yaml"

import { Cfgr                 } from "./configurator.js"
import { BaseConfig as Config } from "./configBase.js"
import { Document             } from "./documents.js"
import { Grammars             } from "./grammars.js"
import { ScopeActions         } from "./scopeActions.js"
import { Structures           } from "./structures.js"
import { Logging, ValidLogger } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')

/**
 * The call pattern for all builder functions
 * 
 * @typeParam builderName - the name of this builder
 * @typeParam funcPath    - the path to the module which defines this builder
 * @typeParam func        - this builder's function
 */
type BuilderFunction = (
  theTokens : string[],
  theLine : number,
  theDoc : Document
) => void

/**
 * Builder
 *
 * The representation of a single builder (which can be loaded, and then
 * registered, from an external collection of builders written in TypeScript)
 */
class Builder {

  // The name of this builder
  name : string

  // The path of the module in which this builder was defined
  funcPath : string

  // The name of the function used to implement this builder
  func : BuilderFunction
  
  /**
   * Create a new instance of a builder
   * 
   * @param builderName - the name of this builder
   * @param funcPath    - the path to the module which defines this builder
   * @param func        - this builder's function
   */
  constructor(
    builderName : string,
    funcPath    : string,
    actionFunc  : BuilderFunction
  ) {
    this.name     = builderName 
    this.funcPath = funcPath 
    this.func     = actionFunc 
  }

    // we may want a "__str__" function...

  /**
   * ***asychronously*** return the result of running this builder.
   * 
   * @param theTokens - the tokens which triggered this builder to be run
   * @param theLine   - the line in the document which triggered this builder
   * @param theDoc    - the document which triggered this builder
   */
  async run(theTokens : string[], theLine : number, theDoc : Document) {
    logger.debug(`running builder: ${this.name}`)
    return await this.func(theTokens, theLine, theDoc)
  }
}

/**
 * The global collection of known builders.
 */
export class Builders {

  // The dictionary of builders indexed by a builder name
  static builders : Map<string, Builder[]> = new Map()

  // The set of already loaded builders
  static loadedBuilderDirs : Set<string> = new Set()

  /**
   * Add a new builder to the dictionary of know builders
   *
   * @param builderName - the name of this builder
   * @param funcPath    - the file-system path of the module which defines this
   *                      builder
   * @param aFunc       - the function which implements this builder
   */
  static addBuilder(
    builderName : string,
    funcPath    : string,
    aFunc       : BuilderFunction
  ) {
    const builders = Builders.builders
    if (!builders.has(builderName)) {
      builders.set(builderName, [])
    }
    const someBuilders = Builders.builders.get(builderName)
    if (someBuilders) {
      someBuilders.push(
        new Builder(builderName, funcPath, aFunc)
      )
    }
  }

  /**
   * ***asynchronously*** load builders from a directory
   *
   * @param aDir   - the directory from which to load builders
   * @param config - a configuration instance passed to the builder registration
   *                 function.
   */
  static async loadBuildersFrom(aDir : string, config : Config) {
    logger.debug(`loading builders from ${aDir}`)
    aDir = Cfgr.normalizePath(aDir)
     if (Builders.loadedBuilderDirs.has(aDir)) return
    Builders.loadedBuilderDirs.add(aDir)
    const openedDir = await fsp.opendir(aDir)
    const builders2Load = []
    for await (const dirEnt of openedDir) {
      if (!dirEnt.name.endsWith(".mjs")) continue
      builders2Load.push(async function() {
        const aPath = path.join(aDir, dirEnt.name)
        logger.debug(`  loading ${aPath}`)
        const aModule = await import(aPath)
        logger.debug(`  loaded ${aPath}`)
        aModule.registerBuilders(config, Builders, Grammars, ScopeActions, Structures, logger)
        logger.debug(`  registered ${aPath}`)          
      }())
    }
    await Promise.all(builders2Load)
  }

}
