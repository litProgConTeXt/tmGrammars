
import fsp from "fs/promises"
import path from "path"
import yaml from "yaml"

import { Config       } from "./configuration.mjs"
import { Grammars     } from "./grammars.mjs"
import { ScopeActions } from "./scopeActions.mjs"
import { Structures   } from "./structures.mjs"
class Builder {
  constructor(builderName, funcPath, actionFunc) {
    this.name     = builderName 
    this.funcPath = funcPath 
    this.func     = actionFunc 
  }

  // we may want a "__str__" function...

  async run(theTokens, theLine, theDoc) {
    console.log(`running builder: ${theScope}`)
    return await this.func(theTokens, theLine, theDoc)
  }
}

class Builders {

  static builders = {}
  static loadedBuilderDirs = {}

  static addBuilder(builderName, funcPath, aFunc) {
    const builders = Builders.builders
    if (!builders[builderName]) {
      builders[builderName] = []
    }
    builders[builderName].push(
      new Builder(builderName, funcPath, aFunc)
    )
  }

  static async loadBuildersFrom(aDir, config) {
    const verbose = config['verbose']
    if (verbose) console.log(`loading builders from ${aDir}`)
    aDir = Config.normalizePath(aDir)
     if (Builders.loadedBuilderDirs[aDir]) return
    Builders.loadedBuilderDirs[aDir] = true
    const openedDir = await fsp.opendir(aDir)
    const builders2Load = []
    for await (const dirEnt of openedDir) {
      if (!dirEnt.name.endsWith(".mjs")) continue
      builders2Load.push(async function() {
        const aPath = path.join(aDir, dirEnt.name)
        if (verbose) console.log(`  loading ${aPath}`)
        const aModule = await import(aPath)
        if (verbose) console.log(`  loaded ${aPath}`)
        aModule.registerBuilders(config, Builders, Grammars, ScopeActions, Structures)
        if (verbose) console.log(`  registered ${aPath}`)          
      }())
    }
    await Promise.all(builders2Load)
  }

}

export { Builders }
