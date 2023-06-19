
import fsp from "fs/promises"
import path from "path"
import yaml from "yaml"

import { Config       } from "./configuration.mjs"
import { Grammars     } from "./grammars.mjs"
import { ScopeActions } from "./scopeActions.mjs"
import { Structures   } from "./structures.mjs"
import { Logging    } from "./logging.mjs"

const logger = Logging.getLogger('rootLogger')

class Builder {
  constructor(builderName, funcPath, actionFunc) {
    this.name     = builderName 
    this.funcPath = funcPath 
    this.func     = actionFunc 
  }

  // we may want a "__str__" function...

  async run(theTokens, theLine, theDoc) {
    logger.debug(`running builder: ${theScope}`)
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
    logger.debug(`loading builders from ${aDir}`)
    aDir = Config.normalizePath(aDir)
     if (Builders.loadedBuilderDirs[aDir]) return
    Builders.loadedBuilderDirs[aDir] = true
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

export { Builders }
