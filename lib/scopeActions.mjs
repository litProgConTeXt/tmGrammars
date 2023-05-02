import fsp from "fs/promises"
import deepcopy from "deepcopy"
import path from "path"

import { Config } from "./configuration.mjs"

const True  = 1
const False = 0

class ScopeAction {
  constructor(scopeStr, funcPath, actionFunc, callArgs) {
    this.scope    = scopeStr 
    this.funcPath = funcPath 
    this.func     = actionFunc 
    this.callArgs = callArgs 
  }

  // we may want a "__str__" function...

  run(theScope, theTokens) {
    return this.func(this.scope, theScope, theTokens, deepcopy(this.callArgs)) ;
  }
}

class ScopeActions {
  
  static actions = {}

  static addScopedAction(scopeStr, funcPath, callArgs, aFunc) {
    if (callArgs === undefined) { callArgs = {} }
    var scopeParts = scopeStr.split('.') ;
    var curScope = ScopeActions.actions ;
    scopeParts.forEach( aScopePart => {
      if (!curScope[aScopePart]) {
        curScope[aScopePart] = {} ;
      }
      curScope = curScope[aScopePart] ;
    }) ;
    if (!curScope['__actions__']) {
      curScope['__actions__'] = []
    }
    curScope['__actions__'].push(new ScopeAction(
      scopeStr, funcPath, aFunc, deepcopy(callArgs, {}) 
    ))
  }
  
  static getAction(scopeStr) {
    var scopeParts = scopeStr.split('.')
    var curScope   = ScopeActions.actions
    scopeParts.forEach( aScopePart => {
      if (curScope[aScopePart]) {
        curScope = curScope[aScopePart]
      } else {
        return null
      }
    })
    if (curScope['__actions__']) {
      return curScope['__actions__']
    }
    return null
  }

  static hasAction(scopeStr) {
    return ScopeActions.getAction(scopeStr)
  }

  static run(scopeStr) {
    const scopeActions = ScopeActions.getAction(scopeStr)
    if (!scopeActions) { return null }
    scopeActions.forEach(function(anAction){
      anAction.run()
    })
  }

  static getAllActions(scopeStr) {
    var actionsFound = []
    var scopeParts = scopeStr.split('.') 
    var curScope   = ScopeActions.actions
    scopeParts.forEach( aScopePart => {
      if (curScope[aScopePart]) {
        curScope = curScope[aScopePart]
      } else {
        return actionsFound
      }
      if (curScope['__actions__']) {
        actionsFound.unshift(curScope['__actions__'])
      }
    })
    return actionsFound
  }

  static hasAnyAction(scopeStr) {
    return 0 < ScopeActions.getAllActions(scopeStr).lenght
  }

  static runMostSpecific(scopeStr) {
    const someActions = ScopeActions.getAllActions(scopeStr)
    if (someActions.length < 1) { return null }
    someActions[0].forEach(function(anAction){
      anAction.run()
    })
  }

  static runAll(scopeStr) {
    const someActions = ScopeActions.getAllActions(scopeStr)
    if (someActions.length < 1) { return null }
    someActions.forEach(function(someScopedActions){
      someScopedActions.forEach(function(anAction){
        anAction.run()
      })
    })
  }

  static async loadActionsFrom(aDir, verbose) {
    if (verbose) console.log(`loading actions from ${aDir}`)
    aDir = Config.normalizePath(aDir)
    const dir = await fsp.opendir(aDir)
    const actionsToLoad = {}
    for await (const dirEnt of dir) {
      if (!dirEnt.name.endsWith(".mjs")) continue
      actionsToLoad[path.join(aDir, dirEnt.name)] = True
    }
    await Promise.all(Object.keys(actionsToLoad).map(async(aPath)=>{
      if (verbose) console.log(`  loading ${aPath}`)
      const aModule = await import(aPath)
      if (verbose) console.log(`  loaded ${aPath}`)
      aModule.registerActions(ScopeActions)
      if (verbose) console.log(`  registered ${aPath}`)
    }))
  }

  static _forEachScope(baseScope, actions, aCallBackFunc) {
    Object.keys(actions).sort().forEach(function(aKey){
      if (aKey === '__actions__') {
          aCallBackFunc(baseScope, actions['__actions__'])
      } else {
        var newKey = aKey
        if (baseScope) newKey = baseScope+'.'+aKey
        ScopeActions._forEachScope(newKey, actions[aKey], aCallBackFunc)
      }
    })
  }

  // aCallBackFunc(aScope, someActions) is called for each ScopeAction
  // in the ScopeActions
  //
  static forEachScope(aCallBackFunc) {
    ScopeActions._forEachScope('', ScopeActions.actions, aCallBackFunc)
  }

  // aCallBackFunc(aScope, someActions) is called for each ScopeAction
  // in the ScopeActions
  //
  static forEachAction(aCallBackFunc) {
    ScopeActions.forEachScope(function(aScope, someActions) {
      someActions.forEach(function(anAction){
        aCallBackFunc(aScope, anAction)
      })
    })
  }

  static getScopesWithActions() {
    const scopesWithActions = {}
    ScopeActions.forEachScope(function(aScope, someActions){
      scopesWithActions[aScope] = someActions
    })  
    return scopesWithActions
  }  

  static printActions() {
    console.log("--actions-----------------------------------------------------")
    ScopeActions.forEachAction(function(aBaseScope, anAction){
      console.log(anAction)
    })
    console.log("--------------------------------------------------------------")
  }

}                    

export { ScopeActions }
