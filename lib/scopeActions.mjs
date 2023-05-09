import fsp from "fs/promises"
import path from "path"
import yaml from "yaml"

import { Builders   } from "./builders.mjs"
import { Config     } from "./configuration.mjs"
import { Grammars   } from "./grammars.mjs"
import { Structures } from "./structures.mjs"

//TODO: https://masteringjs.io/tutorials/fundamentals/async-foreach

class ScopeAction {
  constructor(scopeStr, funcPath, actionFunc) {
    this.scope    = scopeStr 
    this.funcPath = funcPath 
    this.func     = actionFunc 
  }

  // we may want a "__str__" function...

  async run(theScope, theTokens, theLine, theDoc) {
    console.log(`running action: ${theScope}`)
    return await this.func(this.scope, theScope, theTokens, theLine, theDoc)
  }
}

class ScopeActions {
  
  static actions          = {}
  static loadedActionDirs = {}

  static addScopedAction(scopeStr, funcPath, aFunc) {
    var scopeParts = scopeStr.split('.')
    var curScope   = ScopeActions.actions
    for (const aScopePart of scopeParts) {
      if (!curScope[aScopePart]) curScope[aScopePart] = {}
      curScope = curScope[aScopePart]
    }
    if (!curScope['__actions__']) {
      curScope['__actions__'] = []
    }
    curScope['__actions__'].push(
      new ScopeAction(scopeStr, funcPath, aFunc)
    )
  }
  
  static getAction(scopeStr) {
    var scopeParts = scopeStr.split('.')
    var curScope   = ScopeActions.actions
    for (const aScopePart of scopeParts) {
      if (curScope[aScopePart]) {
        curScope = curScope[aScopePart]
      } else {
        return null
      }
    }
    if (curScope['__actions__']) {
      return curScope['__actions__']
    }
    return null
  }

  static hasAction(scopeStr) {
    return ScopeActions.getAction(scopeStr)
  }

  //static async run(scopeStr) {
  //  const scopeActions = ScopeActions.getAction(scopeStr)
  //  if (!scopeActions) { return null }
  //  for (const anAction of scopeActions) {
  //    await anAction.run()
  //  }
  //}

  static getAllActions(scopeStr) {
    var actionsFound = []
    var scopeParts = scopeStr.split('.') 
    var curScope   = ScopeActions.actions
    for (const aScopePart of scopeParts) {
      if (curScope[aScopePart]) {
        curScope = curScope[aScopePart]
      } else {
        return actionsFound
      }
      if (curScope['__actions__']) {
        actionsFound.unshift(curScope['__actions__'])
      }
    }
    return actionsFound
  }

  static hasAnyAction(scopeStr) {
    return 0 < ScopeActions.getAllActions(scopeStr).lenght
  }

  //static async runMostSpecific(scopeStr) {
  //  const someActions = ScopeActions.getAllActions(scopeStr)
  //  if (someActions.length < 1) { return null }
  //  for (const anAction of someActions[0]) {
  //    await anAction.run()
  //  }
  //}

  //static async runAll(scopeStr) {
  //  const someActions = ScopeActions.getAllActions(scopeStr)
  //  if (someActions.length < 1) { return null }
  //  for (const someScopedActions of someActions) {
  //    for (const anAction of someScopedActions) {
  //      await anAction.run()
  //    }
  //  }
  //}

  static async loadActionsFrom(aDir, config) {
    const verbose = config['verbose']
    if (verbose) console.log(`loading actions from ${aDir}`)
    aDir = Config.normalizePath(aDir)
     if (ScopeActions.loadedActionDirs[aDir]) return
    ScopeActions.loadedActionDirs[aDir] = true
    const openedDir = await fsp.opendir(aDir)
    const actions2Load = []
    for await (const dirEnt of openedDir) {
      if (!dirEnt.name.endsWith(".mjs")) continue
      actions2Load.push(async function() {
        const aPath = path.join(aDir, dirEnt.name)
        if (verbose) console.log(`  loading ${aPath}`)
        const aModule = await import(aPath)
        if (verbose) console.log(`  loaded ${aPath}`)
        aModule.registerActions(config, Builders, Grammars, ScopeActions, Structures)
        if (verbose) console.log(`  registered ${aPath}`)          
      }())
    }
    await Promise.all(actions2Load)
  }

  // yield [ aScope, someActions ]
  static* _genScopedActionLists(baseScope, actions) {
    try {
      for (const aKey of Object.keys(actions).sort()) {
        if (aKey === '__actions__') {
            yield [baseScope, actions['__actions__']]
        } else {
          var newKey = aKey
          if (baseScope) newKey = baseScope+'.'+aKey
          yield* ScopeActions._genScopedActionLists(newKey, actions[aKey])
        }
      }
    } catch (err) {
      console.log(err)
    }
  }

  // yield [ aScope, someActions ]
  static* genScopedActionLists() {
    yield* ScopeActions._genScopedActionLists('', ScopeActions.actions)
  }

  // yield anAction
  static* genScopedActions() {
    for (const [aScope, someActions] of ScopeActions.genScopedActionLists()) {
      for (const anAction of someActions) {
        yield [aScope, anAction]
      }
    }
  }

  static async runActionsStartingWith(
    scopeProbe, theScope, someTokens, theLine, theDoc, runParallel
  ) {
    const actionFuncPromises = []
    for (const [aScope, someActions] of ScopeActions.genScopedActionLists()) {
      if (aScope.startsWith(scopeProbe)) {
        for (const anAction of someActions) {
          actionFuncPromises.push(async function(){
            await anAction.run(theScope, someTokens, theLine, theDoc)
          }())
        }
      }
    }
    if (runParallel) {
      await Promise.all(actionFuncs2run)
    } else {
      for (const anActionFuncPromise of actionFuncPromises) {
        await anActionFuncPromise
      }
    }
  }

  static getScopesWithActions() {
    const scopesWithActions = {}
    for (const [aScope, someActions] of ScopeActions.genScopedActionLists()){
      scopesWithActions[aScope] = someActions
    }
    return scopesWithActions
  }  

  static printActions() {
    console.log("--actions-----------------------------------------------------")
    for (const [aBaseScope, anAction] of ScopeActions.genScopedActions()) {
      console.log(anAction)
    }
    console.log("--------------------------------------------------------------")
  }

}                    

export { ScopeActions }
