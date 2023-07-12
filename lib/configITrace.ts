/**
 * Tracing configuration (interface)
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


import { BaseConfig } from "./configBase.js"

// The configuration used by the `tmgt` TextMate Grammar Tracing tool.
export interface ITraceConfig {

  // An array of regular expressions identifying input lines which should be
  // traced by the `tmgt` tool.
  traceLinesInclude : Array<RegExp>
  // An array of regular expressions identifying input lines which should NOT be
  // traced by the `tmgt` tool.
  traceLinesExclude : Array<RegExp>

  // An array of scoped actions which should be traced by the `tmgt` tool.
  traceActionsInclude : Array<RegExp>
  // An array of scoped actions which should NOT be traced by the `tmgt` tool.
  traceActionsExclude : Array<RegExp>

  // An array of scopes which should be traced by the `tmgt` tool.
  traceScopesInclude : Array<RegExp>
  // An array of scopes which should NOT be traced by the `tmgt` tool.
  traceScopesExclude : Array<RegExp>

  // An array of structures which should be traced by the `tmgt` tool.
  traceStructuresInclude : Array<RegExp>
  // An array of structures which should NOT be traced by the `tmgt` tool.
  traceStructuresExclude : Array<RegExp>
}

/**
 * Add the ITraceConfig properties to an existing configuration instance
 *
 * @param aConfigInstance - the initial configuration instance
 * @returns the configuration instance with the additional ITraceConfig
 * properties
 */
export function addITraceConfig<Config extends BaseConfig>(
  aConfigInstance : Config
) : ITraceConfig {
  const aCfgAny = <any>aConfigInstance

  if (!aCfgAny['traceLinesInclude'])
    Object.defineProperty(aConfigInstance, 'traceLinesInclude', [])

  if (!aCfgAny['traceLinesExclude'])
    Object.defineProperty(aConfigInstance, 'traceLinesExclude', [])

  if (!aCfgAny['traceActionsInclude'])
    Object.defineProperty(aConfigInstance, 'traceActionsInclude', [])

  if (!aCfgAny['traceActionsExclude'])
    Object.defineProperty(aConfigInstance, 'traceActionsExclude', [])

  if (!aCfgAny['traceScopesInclude'])
    Object.defineProperty(aConfigInstance, 'traceScopesInclude', [])

  if (!aCfgAny['traceScopesExclude'])
    Object.defineProperty(aConfigInstance, 'traceScopesExclude', [])

  if (!aCfgAny['traceStructuresInclude'])
    Object.defineProperty(aConfigInstance, 'traceStructuresInclude', [])

  if (!aCfgAny['traceStructuresExclude'])
    Object.defineProperty(aConfigInstance, 'traceStructuresExclude', [])

  return <ITraceConfig>aCfgAny // trust me ;-(
}