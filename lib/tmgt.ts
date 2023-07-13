/**
 * TextMate Grammar Tracer
 *
 * The main entry point for loading grammars and tracing the parsing of ConTeXt
 * documents.
 *
 * @module
 */


import * as yaml from "yaml"

// The following two lines MUST be run befor ANY other lpic-modules
import { Logging, ValidLogger     } from "./logging.js"
const logger : ValidLogger = Logging.getLogger('lpic')

import { CfgrHelpers              } from "./cfgrHelpers.js"
import { BaseConfig               } from "./configBase.js"
import { BuildConfig              } from "./configBuild.js"
import { TraceConfig              } from "./configTrace.js"
import { Builders                 } from "./builders.js"
import { Grammars                 } from "./grammars.js"
import { ScopeActions             } from "./scopeActions.js"
import { Structures               } from "./structures.js"
import { setupTMGTool, runTMGTool } from "./runner.js"

async function runTool() {

  // We could clear the TraceConfig configuration meta-data as follows:
  //
  // IConfig.clearMetaData(TraceConfig)
  //
  // If this meta-data is cleared then all TraceConfig configuration will be
  // ignored... BUT anything assembled from TraceConfig will respond to the
  // TraceConfig interface.
  //
  const config = CfgrHelpers.assembleConfigFrom(
    BaseConfig, BuildConfig, TraceConfig
  )
  
  await setupTMGTool(
    'tmgt', 'CLI to manipulate textmate grammars', '0.0.1', config
  )

  const tConfig = <TraceConfig>config

  //loadRunner(config) 

  if (tConfig.showActions) {
    ScopeActions.theScopeActions.printActions()
    process.exit(0)
  }

  if (tConfig.showBuilders) {
    Builders.theBuilders.printBuilders()
    process.exit(0)
  }

  if (tConfig.showAllGrammars) {
    Grammars.theGrammars.printAllGrammars()
    process.exit(0)
  }

  if (0 < tConfig.showGrammars.length) {
    for (const aBaseScope of tConfig.showGrammars) {
      Grammars.theGrammars.printGrammar(aBaseScope)
    }
    process.exit(0)
  }

  await runTMGTool(config)
}

runTool()
  .catch((err : any) => logger.error(err))
  .finally()

 Logging.close()