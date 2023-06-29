/**
 * Scope actions
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

type ScopeActionFunction = (
  aScope: string, 
  theScope : string,
  theTokens : string[],
  theLine : number | undefined,
  theDoc : Document | undefined
) => void

class ScopeAction {
  scope : string
  funcPath : string
  func : ScopeActionFunction
  constructor(scopeStr : string, funcPath : string, actionFunc : ScopeActionFunction) {
    this.scope    = scopeStr 
    this.funcPath = funcPath 
    this.func     = actionFunc 
  }

  // we may want a "__str__" function...

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

class ScopeActions {
  
  static actions : Map<string, ScopeAction[]> = new Map()
  static loadedActionDirs : Map<string, boolean> = new Map()

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
  
  static getAction(scopeStr : string) {
    return ScopeActions.actions.get(scopeStr)
  }

  static hasAction(scopeStr : string) {
    return ScopeActions.getAction(scopeStr)
  }

  static async loadActionsFrom(aDir : string, config : Config) {
    logger.debug(`loading actions from ${aDir}`)
    aDir = Cfgr.normalizePath(aDir)
     if (ScopeActions.loadedActionDirs.has(aDir)) return
    ScopeActions.loadedActionDirs.set(aDir, true)
    const openedDir = await fsp.opendir(aDir)
    const actions2Load = []
    for await (const dirEnt of openedDir) {
      if (!dirEnt.name.endsWith(".mjs")) continue
      actions2Load.push(async function() {
        const aPath = path.join(aDir, dirEnt.name)
        logger.debug(`  loading ${aPath}`)
        const aModule = await import(aPath)
        logger.debug(`  loaded ${aPath}`)
        aModule.registerActions(config, Config, Builders, Grammars, ScopeActions, Structures, logger)
        logger.debug(`  registered ${aPath}`)          
      }())
    }
    await Promise.all(actions2Load)
  }

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

  static getScopesWithActions() {
    const scopesWithActions : Map<string, ScopeAction[]> = new Map()
    for (const [aScope, someActions] of ScopeActions.actions.entries()){
      scopesWithActions.set(aScope, someActions)
    }
    return scopesWithActions
  }  

  static printActions() {
    logger.debug("--actions-----------------------------------------------------")
    for (const [aBaseScope, anAction] of ScopeActions.actions.entries()) {
      logger.debug(anAction)
    }
    logger.debug("--------------------------------------------------------------")
  }

}                    

export { ScopeActions }
