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

import { Cfgr                     } from "./configurator.js"
import { BaseConfig               } from "./configBase.js"
import { TraceConfig as Config    } from "./configTrace.js"
import { Builders                 } from "./builders.js"
import { Grammars                 } from "./grammars.js"
import { ScopeActions             } from "./scopeActions.js"
import { Structures               } from "./structures.js"
import { setupTMGTool, runTMGTool } from "./runner.js"

async function runTool() {
  const config : Config = await <Config>(<unknown>setupTMGTool(
    'tmgt', 'CLI to manipulate textmate grammars', '0.0.1', Config
  ))

  //loadRunner(config) 

  if (config.showActions) {
    ScopeActions.theScopeActions.printActions()
    process.exit(0)
  }

  if (config.showBuilders) {
    Builders.theBuilders.printBuilders()
    process.exit(0)
  }

  if (config.showAllGrammars) {
    Grammars.theGrammars.printAllGrammars()
    process.exit(0)
  }

  if (0 < config.showGrammars.length) {
    for (const aBaseScope of config.showGrammars) {
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