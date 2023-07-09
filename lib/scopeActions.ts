/**
 * LPiC Scope actions
 *
 * The LPiC socpe actions are javascript methods, called 'actions', which are
 * run whenever a given scope is found while parsing a document.
 *
 * @module
 */

import * as fsp from "fs/promises"
import * as path from "path"
import * as yaml from "yaml"

import { Builders             } from "./builders.js"
import { Cfgr                 } from "./configurator.js"
import { BaseConfig as Config } from "./configBase.js"
import { Document             } from "./documents.js"
import { Grammars             } from "./grammars.js"
import { Structures           } from "./structures.js"
import { Logging, ValidLogger } from "./logging.js"

//TODO: https://masteringjs.io/tutorials/fundamentals/async-foreach

const logger : ValidLogger = Logging.getLogger('lpic')

/**
 * The protype scopeActionFunction
 * 
 * @param aScope - the scope associated with this action
 * @param theScope - the actual scope which triggered this action
 * @param theTokens - the document tokens which triggered this action
 * @param theLine - the number of the line which triggered this action
 * @param theDoc - the document which was scanned when this action was
 * triggered.
 */
type ScopeActionFunction = (
  aScope: string, 
  theScope : string,
  theTokens : string[],
  theLine : number,
  theDoc : Document | undefined
) => void

// The ScopeAction class representing a scoped action
class ScopeAction {

  // The scope
  scope : string

  // The file-system path to the module which defines this scoped action
  funcPath : string

  // The function which implements this scoped action
  func : ScopeActionFunction

  /**
   * Construct a ScopeAction
   *
   * @param scopeStr - the scope associated to this scoped action
   * @param funcPath - the file-system path to the module which implements this
   * scoped action
   * @param func     - the function which implements this scoped action
   */
  constructor(scopeStr : string, funcPath : string, actionFunc : ScopeActionFunction) {
    this.scope    = scopeStr 
    this.funcPath = funcPath 
    this.func     = actionFunc 
  }

  // we may want a "__str__" function...

  /**
   * **asynchronously** run this scoped action
   *
   * @param theScope - the actual scope which triggered this action
   * @param theTokens - the document tokens which triggered this action
   * @param theLine - the number of the line which triggered this action
   * @param theDoc - the document which was scanned when this action was
   * triggered.
   *
   * @returns A Promise which when fulfilled, has run the associated scoped
   * action using the (triggering) scope, tokens, document and line number. The
   * action may store the data it extracts to/from an associated structure
   * registered with the Structures module. It generally should *not* write
   * files to the file-system.
   */
  async run(
    theScope : string,
    theTokens : string[],
    theLine : number,
    theDoc : Document | undefined
  ) {
    logger.trace(`running action: ${theScope}`)
    return await this.func(
      this.scope, theScope, theTokens, theLine, theDoc
    )
  }
}

// The global collection of loaded scoped actions
export class ScopeActions {
  
  // The scope -> action[] mapping
  static actions : Map<string, ScopeAction[]> = new Map()

  // The set of already loaded directories containing scoped actions
  static loadedActionDirs : Set<string> = new Set()

  // Does nothing... not used
  constructor() {}

  /**
   * Add a scoped action
   *
   * @param scopeStr - the scope which will trigger this action
   * @param funcPath - the file-system path to the module which implements this
   * action
   * @param aFunc - the function which implements this action
   */
  static addScopedAction(
    scopeStr : string, funcPath : string, aFunc : ScopeActionFunction
  ) {
    if (! ScopeActions.actions.has(scopeStr) ) {
      ScopeActions.actions.set(scopeStr, [])
    }
    const someScopeActions = ScopeActions.actions.get(scopeStr)
    if (someScopeActions) {
      someScopeActions.push(
        new ScopeAction(scopeStr, funcPath, aFunc)
      )
    }
  }
  
  /**
   * Get the actions associated with this scope
   * 
   * @param scopeStr - the scope
   */
  static getAction(scopeStr : string) : ScopeAction[] | undefined {
    return ScopeActions.actions.get(scopeStr)
  }

  /**
   * Are there any actions associated with this scope?
   * 
   * @param scopeStr - a scope
   */
  static hasAction(scopeStr : string) : ScopeAction[] | undefined {
    return ScopeActions.getAction(scopeStr)
  }

  /**
   * **asynchronously** load scoped actions from the given directory.
   *
   * @param aDir - the directory from which to load scoped action
   * implementations
   * @param config - a configuration instance passed to the action registration
   *                 function.
   *
   * @returns A Promise which when fulfilled, has loaded all javascript modules
   * in the given directory. Each javascript module should contain one or more
   * scoped actions which are registered with the ScopedActions module using the
   * `registerActions` method.
   */
  static async loadActionsFrom(aDir : string, config : Config) {
    logger.debug(`loading actions from ${aDir}`)
    aDir = Cfgr.normalizePath(aDir)
     if (ScopeActions.loadedActionDirs.has(aDir)) return
    ScopeActions.loadedActionDirs.add(aDir)
    const openedDir = await fsp.opendir(aDir)
    const actions2Load = []
    for await (const dirEnt of openedDir) {
      if (!dirEnt.name.endsWith(".mjs")) continue
      actions2Load.push(async function() {
        const aPath = path.join(aDir, dirEnt.name)
        logger.debug(`  loading ${aPath}`)
        const aModule = await import(aPath)
        logger.debug(`  loaded ${aPath}`)
        aModule.registerActions(config)
        logger.debug(`  registered ${aPath}`)          
      }())
    }
    await Promise.all(actions2Load)
  }

  /**
   * **asynchronously** run all scoped actions with scopes starting with the
   * given `scopeProbe`
   *
   * @param scopeProbe - the probe used to find appropriate scoped actions
   * @param theScope - the scope in which these actions have been triggered.
   * @param someTokens - some tokens associated with the triggering of these
   * actions
   * @param theLine - the line of the document for which these actions are being
   * triggered
   * @param theDoc - the document for which these actions are being triggered
   * @param runParallel - can these actions be run in parallel?
   *
   * @returns A Promise which when fulfilled, has run all of the associated
   * actions using the tokens, document and line number provided. The actions
   * may store the data it extracts to/from an associated structure registered
   * with the Structures module. It generally should *not* write files to the
   * file-system.
   */
  static async runActionsStartingWith(
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

  // Get all scopes with actions
  static getScopesWithActions() {
    const scopesWithActions : Map<string, ScopeAction[]> = new Map()
    for (const [aScope, someActions] of ScopeActions.actions.entries()){
      scopesWithActions.set(aScope, someActions)
    }
    return scopesWithActions
  }  

  // Log all loaded actions at the `debug` level using the current logger.
  static logActions() {
    logger.debug("--actions-----------------------------------------------------")
    for (const [aBaseScope, anAction] of ScopeActions.actions.entries()) {
      logger.debug(anAction)
    }
    logger.debug("--------------------------------------------------------------")
  }

  // Print all loaded actions to the console.log
  static printActions() {
    console.log("--actions-----------------------------------------------------")
    for (const [aBaseScope, anAction] of ScopeActions.actions.entries()) {
      console.log(anAction)
    }
    console.log("--------------------------------------------------------------")
  }

}                    
