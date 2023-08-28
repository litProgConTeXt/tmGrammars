/**
 * Runner
 *
 * @module
 */

import { IConfig               } from "./cfgrCollector.js"
import { CfgrHelpers           } from "./cfgrHelpers.js"
import { BaseConfig            } from "./configBase.js"
import { TraceConfig as Config } from "./configTrace.js"
import { Grammars              } from "./grammars.js"
import { ScopeActions          } from "./scopeActions.js"
import { Structures            } from "./structures.js"
import { Logging, ValidLogger  } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpil')

/**
 * setup a TextMate Grammar tool
 *
 * @param progName    - the name of this tool
 * @param progDesc    - a help(ful) description of this tool
 * @param progVersion - the version of this tool
 * @param configClass - the *class* of the configuration class for instantiation
 * @returns the fully configured configuration instance
 */
export async function setupTMGTool<Config extends IConfig>(
  progName    : string,
  progDesc    : string,
  progVersion : string,
  config      : Config
) : Promise<any> {

  console.log(`Logger       level: ${logger.level}`)
  console.log(`Logger logFilePath: ${logger.logFilePath}`)

  
  var context : Map<string, string> = new Map()
  context.set('configBaseName', progName)
  CfgrHelpers.updateDefaults(config, context)
  CfgrHelpers.parseCliOptions(config, progName, progDesc, progVersion)
  await CfgrHelpers.loadConfigFiles(config, [])
  
  logger.debug("--------------------------------------------------------------")
  logger.debug(config)
  logger.debug("--------------------------------------------------------------")

  if (!config.implements(BaseConfig)) return config
  
  var bConfig : BaseConfig = <BaseConfig><any>config  // trust me!
  if (bConfig.loadActions && 0 < bConfig.loadActions.length) {
    logger.debug("\n--loading actions----------------------------------------")
    await Promise.all(bConfig.loadActions.map( async (anActionsPath : string) => {
      logger.debug(`starting to load actions from [${anActionsPath}]`)
      await ScopeActions.theScopeActions.loadActionsFrom(anActionsPath, bConfig)
      logger.debug(`finished loading actions from [${anActionsPath}]`)
    }))
    logger.debug("---------------------------------------------------------")
  }
  
  if (bConfig.loadGrammars && 0 < bConfig.loadGrammars.length) {
    logger.debug("\n--loading grammars---------------------------------------")
    await Promise.all(bConfig.loadGrammars.map( async (aGrammarPath : string) => {
      logger.debug(`starting to load grammar from [${aGrammarPath}]`)
      await Grammars.theGrammars.loadGrammarFrom(aGrammarPath, bConfig)
      logger.debug(`finished loading grammar from [${aGrammarPath}]`)
    }))     
    logger.debug("---------------------------------------------------------")
  }

  return config
}  


export function loadRunner(config : IConfig) {
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
    console.log(config)
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
export async function runTMGTool(config : IConfig ) {

  await Grammars.theGrammars.initVSCodeTextMateGrammars()

  if (!config.implements(BaseConfig)) return

  const bConfig = <BaseConfig>config

  console.log(bConfig.initialFile)
  if (bConfig.initialFile.length < 1) {
    console.log("No document specified to trace while parsing")
    process.exit(0)
  }

  logger.warn('runTMGTool: initialize')
  await ScopeActions.theScopeActions.runActionsStartingWith(
    'initialize', 'lpil', [], 0, undefined, bConfig.parallel
  )

  logger.warn('runTMGTool: run')
  await ScopeActions.theScopeActions.runActionsStartingWith(
    'run', 'lpil', [bConfig.initialFile], 0, undefined, bConfig.parallel
  )

  logger.warn('runTMGTool: finalize')
  await ScopeActions.theScopeActions.runActionsStartingWith(
    'finalize', 'lpil', [], 0, undefined, bConfig.parallel
  )
}
