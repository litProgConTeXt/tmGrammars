import fsp from "fs/promises"
import merge from "deepmerge"
import path from "path"

import { Config } from "./configuration.mjs"

class ScopeAction {
  constructor(scopeStr, funcPath, actionFunc, callArgs) {
    this.scope    = scopeStr 
    this.funcPath = funcPath 
    this.func     = actionFunc 
    this.callArgs = callArgs 
  }

  // we may want a "__str__" function...

  run() {
    return this.func(this.scopeStr, merge(this.callArgs)) ;
  }
}

class ScopeActions {
  
  static actions = {}

  static addScopedAction(scopeStr, funcPath, callArgs, aFunc) {
    if (callArgs === undefined) { callArgs = {} }
    var scopeParts = scopeStr.split('.') ;
    var curScope = ScopeActions.actions ;
    scopeParts.forEach( aScopePart => {
      if (!curScope.hasOwnProperty(aScopePart)) {
        curScope[aScopePart] = {} ;
      }
      curScope = curScope[aScopePart] ;
    }) ;
    curScope['__action__'] = new ScopeAction(
      scopeStr, funcPath, aFunc, merge(callArgs, {}) 
    ) ;
  }
  
  static getAction(scopeStr) {
    var scopeParts = scopeStr.split('.')
    var curScope   = ScopeActions.actions
    scopeParts.forEach( aScopePart => {
      if (curScope.hasOwnProperty(aScopePart)) {
        curScope = curScope[aScopePart]
      } else {
        return null
      }
    })
    if (curScope.hasOwnProperty('__action__')) {
      return curScope['__action__']
    }
    return null
  }

  static hasAction(scopeStr) {
    return ScopeActions.getAction(scopeStr)
  }

  static run(scopeStr) {
    scopeAction = ScopeActions.getAction(scopeStr)
    if (!scopeAction) { return null }
    return scopeAction.run()
  }

  static getAllActions(scopeStr) {
    var actionsFound = []
    var scopeParts = scopeStr.split('.') 
    var curScope   = ScopeActions.actions
    scopeParts.forEach( aScopePart => {
      if (curScope.hasOwnProperty(aScopePart)) {
        curScope = curScope[aScopePart]
      } else {
        return actionsFound
      }
      if (curScope.hasOwnProperty('__action__')) {
        actionsFound.unshift(curScope['__action__'])
      }
    })
    return actionsFound
  }

  static hasAnyAction(scopeStr) {
    return 0 < ScopeActions.getAllActions(scopeStr).lenght
  }

  static runMostSpecific(scopeStr) {
    someActions = ScopeActions.getAllActions(scopeStr)
    if (someActions.length < 1) { return null }
    return someActions[0].run()
  }

  static async loadActionsFrom(aDir, verbose) {
    if (verbose) console.log(`loading actions from ${aDir}`)
    aDir = Config.normalizePath(aDir)
    const dir = await fsp.opendir(aDir)
    const actionsToLoad = []
    for await (const dirEnt of dir) {
      //console.log(dirEnt.name)
      if (!dirEnt.name.endsWith(".mjs")) continue
      actionsToLoad.push(path.join(aDir, dirEnt.name))
    }
    await Promise.all(actionsToLoad.map(async(aPath)=>{
      if (verbose) console.log(`  loading ${aPath}`)
      const aModule = await import(aPath)
      if (verbose) console.log(`  loaded ${aPath}`)
      aModule.registerActions(ScopeActions)
      if (verbose) console.log(`  registered ${aPath}`)
    }))
  }

  static _printActions(baseScope, actions) {
    if (actions.hasOwnProperty('__action__')) {
      console.log(actions['__action__'])
      return
    }
    Object.keys(actions).sort().forEach( aKey => {
      ScopeActions._printActions(baseScope+'.'+aKey, actions[aKey])
    })
  }

  static printActions() {
    console.log("--actions-----------------------------------------------------")
    ScopeActions._printActions('', ScopeActions.actions)
    console.log("--------------------------------------------------------------")
  }

}                    

export { ScopeActions }
