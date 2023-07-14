
/**
 * TextMate grammars
*
* We implment a TextMate Grammar parser.
*
* Some of the javascript in this module has been adapted from the example given
* in the [using section of
* vscode-textmate](https://github.com/microsoft/vscode-textmate#using)
*
* We need to be aware of the problems with using [async
 *forEach](https://masteringjs.io/tutorials/fundamentals/async-foreach)
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

import { IConfig                       } from "./cfgrCollector.js"
import { TraceConfig                   } from "./configTrace.js"
import { DocumentCache                 } from "./documents.js"
import { ScopeActions                  } from "./scopeActions.js"
import { Structures                    } from "./structures.js"
import { Logging, ValidLogger          } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')

interface _vscodeOnigurma {
  createOnigScanner(patterns: string[]): vsctmTypes.OnigScanner,
  createOnigString(str: string): vsctmTypes.OnigString;
}

// A Global collection of loaded TextMate Grammars
export class Grammars {

  static theGrammars : Grammars = new Grammars()

  // the scope -> grammar mapping
  scope2grammar : Map<string, vsctmTypes.IRawGrammar> = new Map()

  // the orginal scope -> grammar mapping
  originalScope2grammar : Map<string, vsctmTypes.IRawGrammar> = new Map()

  // the set of loadedGrammars
  loadedGrammars : Set<string> = new Set()

  // internal array buffer containing the oniguruma library binaries
  _wasmBin : ArrayBuffer | undefined

  // internal reference to the oniguruma library interface
  _vscodeOnigurumaLib : any

  // The registry of vscode-textmate grammars
  registry : vsctmTypes.Registry | undefined

  // The initialization of the vscode-textmate grammar registery
  //
  // see: [VSCode-textmate](https://github.com/microsoft/vscode-textmate)
  //
  // @returns A Promise which when fulfilled means that the Grammars module has
  // been fully initialized and is ready for use.
  async initVSCodeTextMateGrammars() {
    logger.debug("LOADING vscode-textmate grammar registry")

    try {
      // try to find onig.wasm assuming we are in the development setup
      logger.trace(`this module dir: [${path.dirname(__filename)}]`)
      this._wasmBin = await fsp.readFile(
        path.join(
            path.dirname(__filename),
          '../../node_modules/vscode-oniguruma/release/onig.wasm'
        )
      )
    } catch (err) {
      try {
        // try to find onig.wasm assuming we are in the npm installed setup
        logger.trace("Trying to load onig.wasm from npm")
        this._wasmBin = await fsp.readFile(
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
          
    this._vscodeOnigurumaLib = oniguruma.loadWASM(this._wasmBin)
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
    const s2g = this.scope2grammar
    this.registry = new vsctm.Registry({
      onigLib: this._vscodeOnigurumaLib,
      loadGrammar: async function (scopeName : string ) {
        if (s2g.has(scopeName) ) {
          logger.trace(`FOUND scopeName [${scopeName}]`)
          const theGrammar = s2g.get(scopeName)
          logger.trace(theGrammar)
          return theGrammar
        }
        logger.warn(`Unknown scope name: ${scopeName}`);
        return null;
      }
    })

    logger.debug("LOADED vscode-textmate grammar registry")
  }

  /**
   * Given the first line of a document, choose the best base scope with which
   * to parse this document
   *
   * @param aDocPath - the document path/name in the DocumentCache
   * @param theFirstLine - the first line of the document used by the grammar to
   * deterimine if it understands this type of document.
   */
  chooseBaseScope(aDocPath : string, aFirstLine : string) {
    // start by checking first line matches...
    for (const [aBaseScope, aGrammar] of this.scope2grammar.entries()) {
      if (aGrammar['firstLineMatch']) {
        logger.trace(`Checking firstLineMatch for ${aBaseScope}`)
        if (aFirstLine.match(aGrammar['firstLineMatch'])) return aBaseScope
      }
    }
    // since none of the first line matches found a match...
    // ... move on to checking the file extension
    for (const [aBaseScope, aGrammar] of this.scope2grammar.entries()) {
      if (aGrammar['fileTypes']) {
        for (const [anIndex, aFileExt] of aGrammar['fileTypes'].entries()) {
          logger.trace(`Checking ${aBaseScope} file type (${aFileExt}) against [${aDocPath}]`)
          if (aDocPath.endsWith(aFileExt)) return aBaseScope
        }
      }
    }
    logger.warn("chooseBaseScope: no match found!")
  }

  /**
   * **asynchronously** trace the parse of a document using vscode-textmate
   * grammars 
   *
   * If the `config` configuration instance is undefined, then no tracing will
   * take place.
   *
   * @param aDocPath - the document path/name in the DocumentCache
   * @param config   - a configuration instance containing the tracing
   * configuration.
   *
   * @returns A Promise which when fulfilled means that the document provided
   * has been parsed and all known actions have been run for all scopes found
   * while parsing. The triggered actions normally store any data extracted from
   * the document in various named Structures in the Structures module.
   */
  async traceParseOf( aDocPath : string, config : IConfig ) {
    logger.trace(`traceParseOf docPath: [${aDocPath}]`)

    if (!config.implements(TraceConfig)) return

    const aCfgAny = <any>config
    var tConfig  = <TraceConfig>aCfgAny

    var traceObj = function (
      traceInclude : RegExp[], traceExclude : RegExp[], aStr : string
    ) { return false }

    if (
      tConfig.traceLinesInclude.length || 
      tConfig.traceLinesExclude.length ||
      tConfig.traceActionsInclude.length || 
      tConfig.traceActionsExclude.length ||
      tConfig.traceScopesInclude.length || 
      tConfig.traceScopesExclude.length ||
      tConfig.traceStructuresInclude.length || 
      tConfig.traceStructuresExclude.length
    ) {
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
    }

    const aDoc = await DocumentCache.theDocumentCache.loadFromFile(aDocPath, config)
    const aBaseScope = this.chooseBaseScope(aDoc.filePath, aDoc.docLines[0])
    if (!aBaseScope) {
      logger.warn("WARNING: Could not find the base scope for the document")
      logger.warn(`  ${aDoc.docName}`)
      return
    }
    if (!this.registry) {
      logger.warn("WARNING: NO grammar registry!")
      return
    }

    const aGrammar = await this.registry.loadGrammar(aBaseScope)
    if (!aGrammar) {
      logger.warn("WARNING: Could not load the requested grammar")
      logger.warn(`  ${aBaseScope}`)
      return
    }
    logger.trace("\n--TRACING--------------------------------------------------------")
    logger.trace(`${aDocPath} (using ${aBaseScope})`)
    logger.trace("-----------------------------------------------------------------")
    const scopesWithActions = ScopeActions.theScopeActions.getScopesWithActions()
    const structureNames    = Structures.theStructures.getStructureNames()
    let ruleStack           = vsctm.INITIAL
    var   lineNum           = -1
    for (const aLine of aDoc.docLines) {
      lineNum += 1
      const scopes2run : Map<string, string[]> = new Map()
      const lineTokens = aGrammar.tokenizeLine(aLine, ruleStack)
      const showLine   = traceObj(
        tConfig.traceLinesInclude, tConfig.traceLinesExclude, aLine
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
            tConfig.traceScopesInclude, tConfig.traceScopesExclude, aScope
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
        for (const [aScope, someTokens] of scopes2run.entries()) {
          const showScope  = traceObj(
            tConfig.traceScopesInclude, tConfig.traceScopesExclude, aScope
          )
          const showAction = traceObj(
            tConfig.traceActionsInclude, tConfig.traceActionsExclude, aScope
          )
          if (showLine && showScope && showAction) {
            logger.debug(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
            if (showLine && showScope) {
              logger.debug(`${aScope} :`)
              logger.debug(someTokens)
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
                tConfig.traceStructuresInclude,
                tConfig.traceStructuresExclude,
                aStructureName
              )) {
                  Structures.theStructures.logStructure(aStructureName)
                }
              }
            logger.debug("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
          }
        }
      }
      ruleStack = lineTokens.ruleStack;
    }
  }

  /**
   * **asynchoronously** load a grammar from a path in the file-system.
   *
   * @param aGrammarPath - the file-system path to the textmate grammar.
   *
   * @returns A Promise which when fulfilled means that the indicated text-mate
   * grammar has been loaded.
   */
  async loadGrammarFrom(aGrammarPath : string, config : IConfig) {
    logger.trace(`>>> loading grammar from ${aGrammarPath}`)
    var aGrammar : vsctmTypes.IRawGrammar
    
    if (aGrammarPath.endsWith('.json')) {
      if (this.loadedGrammars.has(aGrammarPath)) {
        logger.trace(`Warning you have already loaded ${aGrammarPath}`)
        return
      }
      aGrammarPath = config.normalizePath(aGrammarPath)
      if (this.loadedGrammars.has(aGrammarPath)) {
        logger.trace(`Warning you have already loaded ${aGrammarPath}`)
        return
      }
      
      this.loadedGrammars.add(aGrammarPath)
      logger.debug(`loading grammar from ${aGrammarPath}`)
      const aGrammarStr = await fsp.readFile(aGrammarPath, "utf8")
      aGrammar = JSON.parse(aGrammarStr)
    } else {
      logger.warn("At the moment we can ONLY load JSON Grammars!")
      return
    }
    if (aGrammar.scopeName) {
      logger.trace(`>>> scope name ${aGrammar.scopeName}`)
      const baseScope = aGrammar['scopeName']
      if (this.originalScope2grammar.has(baseScope)) {
        logger.warn(`WARNING: you are over-writing an existing ${baseScope} grammar`)
      }
      this.originalScope2grammar.set(baseScope, aGrammar)
    } else {
      logger.warn(">>> NO scope name")
    }
    logger.trace(this.originalScope2grammar)
    for (const [aScope, aGrammar] of this.originalScope2grammar.entries()) {
      this.scope2grammar.set(aScope, deepcopy(aGrammar))
    }
    logger.trace(this.scope2grammar)
  }

  // Get all known scopes defined by the loaded grammars.
  getKnownScopes() {
    const knownScopes : Set<string> = new Set()

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
      if (aRule.name)          knownScopes.add(aRule.name)
      //if (aRule.scopeName)   knownScopes.add(aRule.scopeName)
      if (aRule.contentName)   knownScopes.add(aRule.contentName)
      if (aRule.patterns)      addScopesFromPatterns(aRule.patterns)
      if (aRule.repository)    addScopesFromRepository(aRule.repository)
      if (aRule.captures)      addScopesFromCaptures(aRule.captures)
      if (aRule.beginCaptures) addScopesFromCaptures(aRule.beginCaptures)
      if (aRule.endCaptures)   addScopesFromCaptures(aRule.endCaptures)
    }
    for (const [aScope, aGrammar] of this.scope2grammar.entries()){
      knownScopes.add(aScope)
      addScopesFromPatterns(aGrammar.patterns)
      addScopesFromRepository(aGrammar.repository)
    }
    return Object.keys(knownScopes).sort()
  }

  //////////////////////////////////////////////////////////////////////////////

  /**
   * Print the given grammar
   * 
   * @param aBaseScope - the base scope of the grammar to be printed
   */
  printGrammar(aBaseScope : string) {
    if (!this.scope2grammar.has(aBaseScope)) return
    console.log("--grammar----------------------------------------------------")
    console.log(aBaseScope)
    console.log("---------------")
    console.log(this.scope2grammar.get(aBaseScope))
  }

  // Print all loaded grammars
  printAllGrammars() {
    for (const aBaseScope of Array.from(this.scope2grammar.keys()).sort()) {
      this.printGrammar(aBaseScope)
    }
    console.log("-------------------------------------------------------------")
  }
}
