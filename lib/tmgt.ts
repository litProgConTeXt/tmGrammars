/**
 * TextMate Grammar Tracer
 *
 * The main entry point for loading grammars and tracing the parsing of ConTeXt
 * documents.
 *
 * @module
 */


import * as yaml from "yaml"

import { Cfgr                     } from "./configurator.js"
import { BaseConfig               } from "./configBase.js"
import { TraceConfig as Config    } from "./configTrace.js"
import { Grammars                 } from "./grammars.js"
import { ScopeActions             } from "./scopeActions.js"
import { Structures               } from "./structures.js"
import { Logging, ValidLogger     } from "./logging.js"
import { setupTMGTool, runTMGTool } from "./runner.js"

const logger : ValidLogger = Logging.getLogger('lpic')
const config : Config = setupTMGTool(
  'tmgt', 'CLI to manipulate textmate grammars', '0.0.1', Config
)

if (config.showActions) {
  ScopeActions.printActions()
  process.exit(0)
}

if (config.showAllGrammars) {
  Grammars.printAllGrammars()
  process.exit(0)
}

if (0 < config.showGrammars.length) {
  for (const aBaseScope of config.showGrammars) {
    Grammars.printGrammar(aBaseScope)
  }
  process.exit(0)
}

runTMGTool(config).catch((err : any) => logger.error(err)).finally()
