/**
 * Runner
 *
 * @module
 */

import * as yaml from "yaml"

import { Cfgr                  } from "./configurator.js"
import { BaseConfig            } from "./configBase.js"
import { Builders              } from "./builders.js"
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
export async function setupTMGTool(
  progName    : string,
  progDesc    : string,
  progVersion : string,
  configClass : any
) : Promise<any> {

  console.log(`Logger       level: ${logger.level}`)
  console.log(`Logger logFilePath: ${logger.logFilePath}`)

  var config : BaseConfig = <BaseConfig> new configClass()
  var context : Map<string, string> = new Map()
  context.set('configBaseName', progName)
  Cfgr.updateDefaults(config, context)
  Cfgr.parseCliOptions(config, progName, progDesc, progVersion)
  await Cfgr.loadConfigFiles(config, [])

  logger.debug("--------------------------------------------------------------")
  logger.debug(yaml.stringify(config))
  logger.debug("--------------------------------------------------------------")

  if (config.loadActions && 0 < config.loadActions.length) {
    logger.debug("\n--loading actions----------------------------------------")
    await Promise.all(config.loadActions.map( async (anActionsPath : string) => {
      logger.debug(`starting to load actions from [${anActionsPath}]`)
      await ScopeActions.theScopeActions.loadActionsFrom(anActionsPath, config)
      logger.debug(`finished loading actions from [${anActionsPath}]`)
    }))
    logger.debug("---------------------------------------------------------")
  }
  
  if (config.loadBuilders && 0 < config.loadBuilders.length) {
    logger.debug("\n--loading builders---------------------------------------")
    await Promise.all(config.loadBuilders.map( async (aBuildersPath : string) => {
      logger.debug(`starting to load builders from [${aBuildersPath}]`)
      await Builders.theBuilders.loadBuildersFrom(aBuildersPath, config)
      logger.debug(`finished loading builders from [${aBuildersPath}]`)
    }))
    logger.debug("---------------------------------------------------------")
  }

  if (config.loadGrammars && 0 < config.loadGrammars.length) {
    logger.debug("\n--loading grammars---------------------------------------")
    await Promise.all(config.loadGrammars.map( async (aGrammarPath : string) => {
      logger.debug(`starting to load grammar from [${aGrammarPath}]`)
      await Grammars.theGrammars.loadGrammarFrom(aGrammarPath)
      logger.debug(`finished loading grammar from [${aGrammarPath}]`)
    }))     
    logger.debug("---------------------------------------------------------")
  }

  return config
}  


export function loadRunner(config : BaseConfig) {
  /*
  ////////////////////////////////////////////////////////////////////////////
  // remove pathPrefix from the remaining command line arguments
  
  var pathPrefix    = config['path']
  var pathPrefixLen = 0
  
  if (pathPrefix && !pathPrefix.endsWith(path.sep)) {
    pathPrefix = pathPrefix+path.sep
  }
  if (pathPrefix) pathPrefixLen = pathPrefix.length
  
  const initFiles = []
  for (var aPath of cliArgs.args) {
    if (pathPrefix && aPath.startsWith(pathPrefix)) {
      aPath = aPath.substring(pathPrefixLen)
    }
    initFiles.push(aPath)
  }
  config['initialFiles'] = initFiles
  
  try {
    if (funcObj['preRunFunc']) funcObj['preRunFunc'](config)
  } catch (err) {
    console.log("Failed to run preRunFunc!")
    console.log(err)
  }
  
  if (verbose) {
    console.log("\n--config---------------------------------------------------")
    console.log(yaml.stringify(config))
    console.log("-----------------------------------------------------------")
  }
  
  if (config['save']) {
    const savePath = config['save']
    const lcSavePath = savePath.toLowerCase()
    // ensure the follow DO NOT get saved...
    if (config['save'])         delete config['save']
    if (config['verbose'])      delete config['verbose']
    if (config['config'])       delete config['config']
    if (config['initialFiles']) delete config['initialFiles']
    // now save everything else!
    try {
      if (funcObj['preSaveFunc']) funcObj['preSaveFunc'](config)
    } catch(err) {
      console.log("Failed to run preSaveFunc!")
      console.log(err)
    }
    var configStr = ""
    if (lcSavePath.endsWith('yaml') || lcSavePath.endsWith('yml')) {
      configStr = yaml.stringify(config)
    } else if (lcSavePath.endsWith('toml')) {
      configStr = toml.stringify(config, {
        'newline' : '\n',
        'indent'  : 2
      })
    } else if (lcSavePath.endsWith('json')) {
      configStr = JSON.stringify(config, null, 2)
    }
    await fsp.writeFile(savePath, configStr, {
      'encoding' : 'utf8',
      'mode'     : 0o644
    })
    process.exit(0)
  }
  */
}

/**
 * ***asynchronously*** run a TextMate Grammar tool
 *
 * @param config - a fully configured configuration instance
 * @returns a Promise which when fulfilled means that the tool has run
 * successfully.
 */
export async function runTMGTool(config : BaseConfig ) {

  if (config.initialFiles.length < 1) {
    console.log("No document specified to trace while parsing")
    process.exit(0)
  }

  await ScopeActions.theScopeActions.runActionsStartingWith(
    'initialize', 'lpic', [], 0, undefined, config.parallel
  )

  await ScopeActions.theScopeActions.runActionsStartingWith(
    'run', 'lpic', config.initialFiles, 0, undefined, config.parallel
  )

  await ScopeActions.theScopeActions.runActionsStartingWith(
    'finalize', 'lpic', [], 0, undefined, config.parallel
  )
}
