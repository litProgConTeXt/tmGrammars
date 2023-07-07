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
 * @param theTokens - the tokens which triggered this builder to be run
 * @param theLine   - the line in the document which triggered this builder
 * @param theDoc    - the document which triggered this builder
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
   *
   * @returns A Promise which when fulfilled, has run the associated builder
   * using the tokens, document and line number provided. The builder may store
   * the data it extracts/builds to/from an associated structure registered with
   * the Structures module. It may also have written its extracted data to one
   * or more files in the file-system.
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

  // Does nothing... not used
  constructor() {}

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
   * Get the builders associated with this scope
   * 
   * @param scopeStr - the scope
   */
  static getBuilder(scopeStr : string) : Builder[] | undefined {
    return Builders.builders.get(scopeStr)
  }
  
  /**
   * Are there any builders associated with this scope?
   * 
   * @param scopeStr - a scope
   */
  static hasBuilder(scopeStr : string) : Builder[] | undefined {
    return Builders.getBuilder(scopeStr)
  }
  
  /**
   * ***asynchronously*** load builders from a directory
   *
   * @param aDir   - the directory from which to load builders
   * @param config - a configuration instance passed to the builder registration
   *                 function.
   *
   * @returns A Promise which when fulfilled, has loaded all javascript modules
   * in the given directory. Each javascript module should contain one or more
   * builders which are registered with the Builders module using the
   * `registerBuilders` method.
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

  /**
   * **asynchronously** run all builders with scopes starting with the given
   * `scopeProbe`
   *
   * @param scopeProbe - the probe used to find appropriate builders
   * @param theScope - the scope in which these builders have been triggered.
   * @param someTokens - some tokens associated with the triggering of these
   * builders
   * @param theLine - the line of the document for which these builders are
   * being triggered
   * @param theDoc - the document for which these builders are being triggered
   * @param runParallel - can these builders be run in parallel?
   *
   * @returns A Promise which when fulfilled, has run all of the associated
   * builders using the tokens, document and line number provided. The builders
   * may store the data it extracts/builds to/from an associated structure
   * registered with the Structures module. It may also have written its
   * extracted data to one or more files in the file-system.
   */
  static async runBuildersStartingWith(
    scopeProbe  : string,
    theScope    : string,
    someTokens  : string[],
    theLine     : number,
    theDoc      : Document | undefined,
    runParallel : boolean
  ) {
    const actionFuncPromises = []
    for (const [aScope, someActions] of ScopeActions.actions.entries()) {
      if (aScope.startsWith(scopeProbe)) {
        for (const anAction of someActions) {
          actionFuncPromises.push(async function(){
            await anAction.run(theScope, someTokens, theLine, theDoc)
          }())
        }
      }
    }
    if (runParallel) {
      await Promise.all(actionFuncPromises)
    } else {
      for (const anActionFuncPromise of actionFuncPromises) {
        await anActionFuncPromise
      }
    }
  }
  
  // Get all scopes with builders
  static getScopesWithBuilders() {
    const scopesWithBuilders : Map<string, Builder[]> = new Map()
    for (const [aScope, someBuilders] of Builders.builders.entries()){
      scopesWithBuilders.set(aScope, someBuilders)
    }
    return scopesWithBuilders
  }  
  
  // Log all loaded builders at the `debug` level using the current logger.
  static logBuilders() {
    logger.debug("--builders----------------------------------------------------")
    for (const [aBaseScope, aBuilder] of Builders.builders.entries()) {
      logger.debug(aBuilder)
    }
    logger.debug("--------------------------------------------------------------")
  }
  
  // Print all loaded builders to the console.log
  static printBuilders() {
    console.log("--builders----------------------------------------------------")
    for (const [aBaseScope, aBuilder] of Builders.builders.entries()) {
      console.log(aBuilder)
    }
    console.log("--------------------------------------------------------------")
  }
  
}
