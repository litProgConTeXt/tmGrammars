/**
 * Tracing configuration
 *
 * ConfigClass provides a collection of (example) Type-Safe (TypeScript) Config
 * class for the LPiC projects.
 * 
 * @module
 */

import * as yaml from 'yaml'

import { Cfgr, appendStrArg, appendRegExpArg } from "./configurator.js"
import { BaseConfig                          } from "./configBase.js"

/**
 * Class: ConfigClass.TraceConfig
 * 
 * The configuration used by the `tmgt` TextMate Grammar Tracing tool.
 */
@Cfgr.klass()
export class TraceConfig extends BaseConfig {

  /**
   * Property: showActions
   * 
   * (configPath: showActions)
   * (cli: --actions)
   * 
   * Should the actions be listed? (Default: false)
   */
  @Cfgr.cliOption(
    'showActions',
    '--actions',
    'Show the actions',
    undefined
  )
  showActions : boolean = false

  /**
   * Property: showAllGrammars
   * 
   * (configPath: showAllGrammars)
   * (cli: -sag, --showAllGrammars)
   */
  @Cfgr.cliOption(
    'showAllGrammars',
    '-sag, --showAllGrammars',
    'Show all (known raw) grammars',
    undefined
  )
  showAllGrammars : boolean = false

  /**
   * Property: showGrammar
   * 
   * (configPath: showGrammar)
   * (cli: -sg, --showGrammar)
   * 
   * Show a specific grammar
   */
  @Cfgr.cliOption(
    'showGrammar',
    '-sa, --showGrammar <baseScope>',
    'Show the (raw) grammar',
    appendStrArg
  )
  showGrammars : Array<string> = []

  /**
   * Property: traceLinesInclude
   *
   * (configPath: trace.lines.include)
   * (cli: -tl, --traceLine)
   *
   * An array of regular expressions identifying input lines which should be
   * traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.lines.include',
    '-tl, --traceLine <regexp>',
    'Trace lines which match the specified regexp',
    appendRegExpArg
  )
  traceLinesInclude : Array<RegExp> = []

  /**
   * Property: traceLinesExclude
   *
   * (configPath: trace.lines.exclude)
   * (cli: -tlx, --tlExclude)
   *
   * An array of regular expressions identifying input lines which should not be
   * traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.lines.exclude',
    '-tlx, --tlExclude <regexp>',
    'Do not trace lines which match the specified regexp',
    appendRegExpArg
  )
  traceLinesExclude : Array<RegExp> = []

  /**
   * Property: traceActionsInclude
   *
   * (configPath: trace.actions.include)
   * (cli: -ta, --traceAction)
   *
   * An array of scoped actions which should be traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.actions.include',
    '-ta, --traceAction <action>',
    'Trace the specified action',
    appendRegExpArg
  )
  traceActionsInclude : Array<RegExp> = []

  /**
   * Property: traceActionsExclude
   *
   * (configPath: trace.actions.exclude)
   * (cli: -tax, --taExclude)
   *
   * An array of scoped actions which should not be traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.actions.exclude',
    '-tax, --taExclude <action>',
    'Do not trace the specified action',
    appendRegExpArg
  )
  traceActionsExclude : Array<RegExp> = []

  /**
   * Property: traceScopesInclude
   *
   * (configPath: trace.scopes.include)
   * (cli: -ts, --traceScope)
   *
   * An array of scopes which should be traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.scopes.include',
    '-ts, --traceScope <scope>',
    'Trace the specified scope',
    appendRegExpArg
  )
  traceScopesInclude : Array<RegExp> = []

  /**
   * Property: traceScopesExclude
   *
   * (configPath: trace.scopes.exnclude)
   * (cli: -tsx, --tsExclude)
   *
   * An array of scopes which should not be traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.scopes.exclude',
    '-tsx, --tsExclude <scope>',
    'Do not trace the specified scope',
    appendRegExpArg
  )
  traceScopesExclude : Array<RegExp> = []

  /**
   * Property: traceStructuresInclude
   *
   * (configPath: trace.structures.include)
   * (cli: -tS, --traceStructure)
   *
   * An array of structures which should be traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.structures.include',
    '-tS, --traceStructure <struct>',
    'Trace the specified structure',
    appendRegExpArg
  )
  traceStructuresInclude : Array<RegExp> = []

  /**
   * Property: traceStructuresExclude
   *
   * (configPath: trace.structures.exclude)
   * (cli: -tSx, --tSExclude)
   *
   * An array of structures which should not be traced by the `tmgt` tool.
   */
  @Cfgr.cliOption(
    'trace.structures.exclude',
    '-tSx, --tSExclude <struct>',
    'Do not trace the specified structure',
    appendRegExpArg
  )
  traceStructuresExclude : Array<RegExp> = []
}
