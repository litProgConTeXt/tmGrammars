/**
 * Runner
 *
 * @module
 */

import * as yaml from "yaml"

import { Cfgr                  } from "./configurator.js"
import { BaseConfig            } from "./configBase.js"
import { TraceConfig as Config } from "./configTrace.js"
import { Grammars              } from "./grammars.js"
import { ScopeActions          } from "./scopeActions.js"
import { Structures            } from "./structures.js"
import { Logging, ValidLogger  } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')
/**
 * setup a TextMate Grammar tool
 *
 * @param progName    - the name of this tool
 * @param progDesc    - a help(ful) description of this tool
 * @param progVersion - the version of this tool
 * @param configClass - the *class* of the configuration class for instantiation
 * @returns the fully configured configuration instance
 */
export function setupTMGTool(
  progName    : string,
  progDesc    : string,
  progVersion : string,
  configClass : any
) : any {

  console.log(`Logger       level: ${logger.level}`)
  console.log(`Logger logFilePath: ${Logging.logFilePath}`)

  var config = new configClass()
  var context : Map<string, string> = new Map()
  context.set('configBaseName', 'tmgt')
  Cfgr.updateDefaults(config, context)
  Cfgr.parseCliOptions(config, progName, progDesc, progVersion)
  Cfgr.loadConfigFiles(config, [])

  logger.debug("--------------------------------------------------------------")
  logger.debug(yaml.stringify(config))
  logger.debug("--------------------------------------------------------------")

  return config
}

/**
 * ***asynchronously*** run a TextMate Grammar tool
 *
 * @param config - a fully configured configuration instance
 * @returns a Promise to be finalized
 */
export async function runTMGTool(config : BaseConfig ) {

  if (config.initialFiles.length < 1) {
    console.log("No document specified to trace while parsing")
    process.exit(0)
  }

  await ScopeActions.runActionsStartingWith(
    'initialize', 'lpic', [], 0, undefined, config.parallel
  )

  await ScopeActions.runActionsStartingWith(
    'run', 'lpic', config.initialFiles, 0, undefined, config.parallel
  )

  await ScopeActions.runActionsStartingWith(
    'finalize', 'lpic', [], 0, undefined, config.parallel
  )
}
