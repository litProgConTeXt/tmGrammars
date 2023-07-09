/**
 * Tracing configuration
 *
 * The ConfigClasses provide a collection of Type-Safe (TypeScript)
 * Configuration class for the LPiC projects.
 * 
 * This class extends the BaseConfig with configuration for:
 * 
 *  - extensive tracing of the parsing and building processes
 * 
 * @module
 */

import * as yaml from 'yaml'

import { Cfgr, appendStrArg, appendRegExpArg } from "./configurator.js"
import { BaseConfig                          } from "./configBase.js"

// The configuration used by the `tmgt` TextMate Grammar Tracing tool.
@Cfgr.klass()
export class TraceConfig extends BaseConfig {

  /**
   * Should the actions be listed? (Default: false)
   * 
   * - **configPath:** showActions
   * - **cli:* --actions
   */
  @Cfgr.cliOption(
    'showActions',
    '--actions',
    'Show the actions',
    undefined
  )
  showActions : boolean = false

  /**
   * Should the actions be listed? (Default: false)
   * 
   * - **configPath:** showActions
   * - **cli:* --actions
   */
  @Cfgr.cliOption(
    'showBuilders',
    '--builders',
    'Show the builders',
    undefined
  )
  showBuilders : boolean = false

  /**
   * Should all grammars be shown? (Default: false)
   * 
   * - **configPath:* showAllGrammars
   * - **cli:* -sag, --showAllGrammars
   */
  @Cfgr.cliOption(
    'showAllGrammars',
    '-sag, --showAllGrammars',
    'Show all (known raw) grammars',
    undefined
  )
  showAllGrammars : boolean = false

  /**
   * Show a specific grammar
   * 
   * - **configPath:* showGrammar
   * - **cli:* -sg, --showGrammar
   */
  @Cfgr.cliOption(
    'showGrammar',
    '-sa, --showGrammar <baseScope>',
    'Show the (raw) grammar',
    appendStrArg
  )
  showGrammars : Array<string> = []

  /**
   * An array of regular expressions identifying input lines which should be
   * traced by the `tmgt` tool.
   *
   * - **configPath:* trace.lines.include
   * - **cli:* -tl, --traceLine
   */
  @Cfgr.cliOption(
    'trace.lines.include',
    '-tl, --traceLine <regexp>',
    'Trace lines which match the specified regexp',
    appendRegExpArg
  )
  traceLinesInclude : Array<RegExp> = []

  /**
   * An array of regular expressions identifying input lines which should not be
   * traced by the `tmgt` tool.
   *
   * - **configPath:* trace.lines.exclude
   * - **cli:* -tlx, --tlExclude
   */
  @Cfgr.cliOption(
    'trace.lines.exclude',
    '-tlx, --tlExclude <regexp>',
    'Do not trace lines which match the specified regexp',
    appendRegExpArg
  )
  traceLinesExclude : Array<RegExp> = []

  /**
   * An array of scoped actions which should be traced by the `tmgt` tool.
   *
   * - **configPath:* trace.actions.include
   * - **cli:* -ta, --traceAction
   */
  @Cfgr.cliOption(
    'trace.actions.include',
    '-ta, --traceAction <action>',
    'Trace the specified action',
    appendRegExpArg
  )
  traceActionsInclude : Array<RegExp> = []

  /**
   * An array of scoped actions which should not be traced by the `tmgt` tool.
   *
   * - **configPath:* trace.actions.exclude
   * - **cli:* -tax, --taExclude
   */
  @Cfgr.cliOption(
    'trace.actions.exclude',
    '-tax, --taExclude <action>',
    'Do not trace the specified action',
    appendRegExpArg
  )
  traceActionsExclude : Array<RegExp> = []

  /**
   * An array of scopes which should be traced by the `tmgt` tool.
   *
   * - **configPath:* trace.scopes.include
   * - **cli:* -ts, --traceScope
   */
  @Cfgr.cliOption(
    'trace.scopes.include',
    '-ts, --traceScope <scope>',
    'Trace the specified scope',
    appendRegExpArg
  )
  traceScopesInclude : Array<RegExp> = []

  /**
   * An array of scopes which should not be traced by the `tmgt` tool.
   *
   * - **configPath:* trace.scopes.exnclude
   * - **cli:* -tsx, --tsExclude
   */
  @Cfgr.cliOption(
    'trace.scopes.exclude',
    '-tsx, --tsExclude <scope>',
    'Do not trace the specified scope',
    appendRegExpArg
  )
  traceScopesExclude : Array<RegExp> = []

  /**
   * An array of structures which should be traced by the `tmgt` tool.
   *
   * - **configPath:* trace.structures.include
   * - **cli:* -tS, --traceStructure
   */
  @Cfgr.cliOption(
    'trace.structures.include',
    '-tS, --traceStructure <struct>',
    'Trace the specified structure',
    appendRegExpArg
  )
  traceStructuresInclude : Array<RegExp> = []

  /**
   * An array of structures which should not be traced by the `tmgt` tool.
   *
   * - **configPath:* trace.structures.exclude
   * - **cli:* -tSx, --tSExclude
   */
  @Cfgr.cliOption(
    'trace.structures.exclude',
    '-tSx, --tSExclude <struct>',
    'Do not trace the specified structure',
    appendRegExpArg
  )
  traceStructuresExclude : Array<RegExp> = []
}
