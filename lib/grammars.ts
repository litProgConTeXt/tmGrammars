
/**
 * TextMate grammars
*
* We implment a TextMate Grammar parser.
*
* Some of the javascript in this module has been adapted from the example given
* in the <using section of vscode-textmate:
* https://github.com/microsoft/vscode-textmate#using>
*
* We need to be aware of the problems with using <async forEach:
* https://masteringjs.io/tutorials/fundamentals/async-foreach>
*
* @module
*/

import type * as vsctmTypes from "vscode-textmate"
import type * as vsctmTRG   from "vscode-textmate/release/rawGrammar"

import      deepcopy  from "deepcopy"
import * as fsp       from "fs/promises"
import * as path      from "path"
import * as vsctm     from "vscode-textmate"
import * as oniguruma from "vscode-oniguruma"
import * as yaml      from "yaml"

import { Cfgr                          } from "./configurator.js"
import { ITraceConfig, addITraceConfig } from "./configITrace.js"
import { DocumentCache                 } from "./documents.js"
import { ScopeActions                  } from "./scopeActions.js"
import { Structures                    } from "./structures.js"
import { Logging, ValidLogger          } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')

interface _vscodeOnigurma {
  createOnigScanner(patterns: string[]): vsctmTypes.OnigScanner,
  createOnigString(str: string): vsctmTypes.OnigString;
}

/** 
 * Class: Grammars.Grammars
 * 
 * A Global collection of loaded TextMate Grammars
 */
class Grammars {

  /**
   * Property: scope2grammar
   * 
   * 
   */
  static scope2grammar : Map<string, vsctmTypes.IRawGrammar> = new Map()

  /**
   * Property: orginalScope2grammar
   * 
   */
  static originalScope2grammar : Map<string, vsctmTypes.IRawGrammar> = new Map()

  /**
   * Property: loadedGrammars
   * 
   * 
   */
  static loadedGrammars : Map<string, boolean> = new Map()

  static _wasmBin : ArrayBuffer
  static _vscodeOnigurumaLib : any
  static registry : vsctmTypes.Registry

  static async _initGrammarsClass() {
    
    try {
      // try to find onig.wasm assuming we are in the development setup
      Grammars._wasmBin = await fsp.readFile(
        path.join(
            path.dirname(__filename),
          '../node_modules/vscode-oniguruma/release/onig.wasm'
        )
      )
    } catch (err) {
      try {
        // try to find onig.wasm assuming we are in the npm installed setup
        logger.trace("Trying to load onig.wasm from npm")
        Grammars._wasmBin = await fsp.readFile(
          path.join(
            path.dirname(__filename),
            '../../vscode-oniguruma/release/onig.wasm'
          )
        )
      } catch (error) {
        logger.fatal("Could not load the oniguruma WASM file...")
        process.exit(1)
      }
    }
          
    Grammars._vscodeOnigurumaLib = oniguruma.loadWASM(Grammars._wasmBin)
    .then(function() {
      return {
        createOnigScanner(patterns : string[]): vsctmTypes.OnigScanner {
          return new oniguruma.OnigScanner(patterns);
        },
        createOnigString(str : string) : vsctmTypes.OnigString {
          return new oniguruma.OnigString(str);
        }
      };
    });

    // Create a registry that can create a grammar from a scope name.
    Grammars.registry = new vsctm.Registry({
      onigLib: Grammars._vscodeOnigurumaLib,
      loadGrammar: function (scopeName : string ) : Promise<vsctmTypes.IRawGrammar | null | undefined> {
        return new Promise(
          () => {
            if (Grammars.scope2grammar.has(scopeName) ) {
              return Grammars.scope2grammar.get(scopeName)
            }
            logger.warn(`Unknown scope name: ${scopeName}`);
            return null;
        })
      }
    });
  }

  static chooseBaseScope(aDocPath : string, aFirstLine : string) {
    // start by checking first line matches...
    for (const [aBaseScope, aGrammar] of Object.entries(Grammars.scope2grammar)) {
      if (aGrammar['firstLineMatch']) {
        logger.trace(`Checking firstLineMatch for ${aBaseScope}`)
        if (aFirstLine.match(aGrammar['firstLineMatch'])) return aBaseScope
      }
    }
    // since none of the first line matches found a match...
    // ... move on to checking the file extension
    for (const [aBaseScope, aGrammar] of Object.entries(Grammars.scope2grammar)) {
      if (aGrammar['fileTypes']) {
        for (const [anIndex, aFileExt] of aGrammar['fileTypes'].entries()) {
          logger.trace(`Checking ${aBaseScope} file type (${aFileExt}) against [${aDocPath}]`)
          if (aDocPath.endsWith(aFileExt)) return aBaseScope
        }
      }
    }
    logger.warn("chooseBaseScope: no match found!")
  }

  static async traceParseOf(aDocPath : string, config : ITraceConfig | undefined) {
    var traceObj
    var traceOutput
    if (config && ('traceLinesInclude' in config)) {
      traceOutput = true
      traceObj = function (
        traceInclude : RegExp[], traceExclude : RegExp[], aStr : string
      ) {
        if (0 < traceExclude.length) {
          for (const aRegExp of traceExclude.values() ) {
            if (aStr.match(aRegExp)) {
              logger.debug(`[${aStr}] EXCLUDED by [${aRegExp}]`)
              return false
            }
          }
        }
        if (0 < traceInclude.length) {
          for (const aRegExp of traceInclude.values() ) {
            if (aStr.match(aRegExp)) {
              logger.debug(`[${aStr}] INCLUDED by [${aRegExp}]`)
              return true
            }
          }
          logger.debug("No match found in traceObj")
          return false
        }
        return true
      }
    } else {
      config = addITraceConfig({})
      traceOutput = false
      traceObj = function (
        traceInclude : RegExp[], traceExclude : RegExp[], aStr : string
      ) {
        return false
      }
    }

    if (!config) config = addITraceConfig({})
    
    const aDoc = await DocumentCache.loadFromFile(aDocPath)
    const aBaseScope = Grammars.chooseBaseScope(aDoc.filePath, aDoc.docLines[0])
    if (!aBaseScope) {
      logger.warn("WARNING: Could not find the base scope for the document")
      logger.warn(`  ${aDoc.docName}`)
      return
    }
    const aGrammar = await Grammars.registry.loadGrammar(aBaseScope)
    if (!aGrammar) {
      logger.warn("WARNING: Could not load the requested grammar")
      logger.warn(`  ${aBaseScope}`)
      return
    }
    logger.trace("\n--TRACING--------------------------------------------------------")
    logger.trace(`${aDocPath} (using ${aBaseScope})`)
    logger.trace("-----------------------------------------------------------------")
    const scopesWithActions = ScopeActions.getScopesWithActions()
    const structureNames    = Structures.getStructureNames()
    let ruleStack           = vsctm.INITIAL
    var   lineNum           = -1
    for (const aLine of aDoc.docLines) {
      lineNum += 1
      const scopes2run : Map<string, string[]> = new Map()
      const lineTokens = aGrammar.tokenizeLine(aLine, ruleStack)
      const showLine   = traceObj(
        config.traceLinesInclude, config.traceLinesExclude, aLine
      )
      if (showLine) {
        logger.debug(`\nTokenizing line[${lineNum}]: >>${aLine}<< (${aLine.length})`);
      }
      for (const aToken of lineTokens.tokens) {
        if (showLine) {
          logger.debug(` - token from ${aToken.startIndex} to ${aToken.endIndex} ` +
            `(${aLine.substring(aToken.startIndex, aToken.endIndex)}) ` +
            `with scopes:`
          );
        }
        for (const aScope of aToken.scopes) {
          const showScope  = traceObj(
            config.traceScopesInclude, config.traceScopesExclude, aScope
          )
          if (showLine && showScope) logger.debug(`     ${aScope}`)
          if (scopesWithActions.has(aScope)) {
            if (!scopes2run.has(aScope)) scopes2run.set(aScope, [])
            const theScope2run = scopes2run.get(aScope)
            if (theScope2run) theScope2run.push(
              aLine.substring(aToken.startIndex, aToken.endIndex)
            )
          }
        }
      }
      if (scopes2run) {
        for (const [aScope, someTokens] of Object.entries(scopes2run)) {
          const showScope  = traceObj(
            config.traceScopesInclude, config.traceScopesExclude, aScope
          )
          const showAction = traceObj(
            config.traceActionsInclude, config.traceActionsExclude, aScope
          )
          if (showLine && showScope && showAction) {
            logger.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
            if (showLine && showScope) {
              logger.debug(`${aScope} :`)
              logger.debug(yaml.stringify(someTokens))
            }
          }
          const someActions = scopesWithActions.get(aScope)
          if (someActions) {
            for (const anAction of someActions) {
              await anAction.run(aScope, someTokens, lineNum, aDoc)
            }
          }
          if (showLine && showScope && showAction) {
            for (const aStructureName of structureNames) {
              if (traceObj(
                config.traceStructuresInclude,
                config.traceStructuresExclude,
                aStructureName
              )) {
                  Structures.logStructure(aStructureName)
                }
              }
            logger.debug("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
          }
        }
      }
      ruleStack = lineTokens.ruleStack;
    }
  }

  static async loadGrammarFrom(aGrammarPath : string) {
    var aGrammar : vsctmTypes.IRawGrammar
    
    if (aGrammarPath.endsWith('.json')) {
      if (Grammars.loadedGrammars.has(aGrammarPath)) {
        logger.trace(`Warning you have already loaded ${aGrammarPath}`)
        return
      }
      aGrammarPath = Cfgr.normalizePath(aGrammarPath)
      if (Grammars.loadedGrammars.has(aGrammarPath)) {
        logger.trace(`Warning you have already loaded ${aGrammarPath}`)
        return
      }
      
      Grammars.loadedGrammars.set(aGrammarPath, true)
      logger.debug(`loading grammar from ${aGrammarPath}`)
      const aGrammarStr = await fsp.readFile(aGrammarPath, "utf8")
      aGrammar = JSON.parse(aGrammarStr)
    } else {
      logger.warn("At the moment we can ONLY load JSON Grammars!")
      return
    }
    if (aGrammar.scopeName) {
      const baseScope = aGrammar['scopeName']
      if (Grammars.originalScope2grammar.has(baseScope)) {
        logger.warn(`WARNING: you are over-writing an existing ${baseScope} grammar`)
      }
      Grammars.originalScope2grammar.set(baseScope, aGrammar)
    }
    for (const [aScope, aGrammar] of Object.entries(Grammars.originalScope2grammar)) {
      Grammars.scope2grammar.set(aScope, deepcopy(aGrammar))
    }
  }

  static getKnownScopes() {
    const knownScopes : Map<string, boolean> = new Map()

    function addScopesFromPatterns(somePatterns : vsctmTRG.IRawRule[]) {
      if (!somePatterns) return
      for (const aPattern of somePatterns) { addScopesFromRule(aPattern) }
    }
    function addScopesFromRepository(aRepository : vsctmTRG.IRawRepository) {
      if (!aRepository) return
      for (const [aKey, aValue] of Object.entries(aRepository)) {
        addScopesFromRule(aValue)
      }
    }
    function addScopesFromCaptures(someCaptures : vsctmTRG.IRawCaptures) {
      if (!someCaptures) return
      for (const [aKey, aValue] of Object.entries(someCaptures)) {
        addScopesFromRule(aValue)
      }
    }
    function addScopesFromRule(aRule : vsctmTRG.IRawRule) {
      if (!aRule) return
      if (aRule.name)          knownScopes.set(aRule.name, true)
      //if (aRule.scopeName)   knownScopes.set(aRule.scopeName, true)
      if (aRule.contentName)   knownScopes.set(aRule.contentName, true)
      if (aRule.patterns)      addScopesFromPatterns(aRule.patterns)
      if (aRule.repository)    addScopesFromRepository(aRule.repository)
      if (aRule.captures)      addScopesFromCaptures(aRule.captures)
      if (aRule.beginCaptures) addScopesFromCaptures(aRule.beginCaptures)
      if (aRule.endCaptures)   addScopesFromCaptures(aRule.endCaptures)
    }
    for (const [aScope, aGrammar] of Grammars.scope2grammar.entries()){
      knownScopes.set(aScope, true)
      addScopesFromPatterns(aGrammar.patterns)
      addScopesFromRepository(aGrammar.repository)
    }
    return Object.keys(knownScopes).sort()
  }


  //////////////////////////////////////////////////////////////////////////////

  static printGrammar(aBaseScope : string) {
    if (!Grammars.scope2grammar.has(aBaseScope)) return
    console.log("--grammar----------------------------------------------------")
    console.log(aBaseScope)
    console.log("---------------")
    console.log(yaml.stringify(Grammars.scope2grammar.get(aBaseScope)))
  }

  static printAllGrammars() {
    for (const aBaseScope of Object.keys(Grammars.scope2grammar).sort()) {
      Grammars.printGrammar(aBaseScope)
    }
    console.log("-------------------------------------------------------------")
  }
}

Grammars._initGrammarsClass().catch((err)=>console.log(err)).finally()

export { Grammars }