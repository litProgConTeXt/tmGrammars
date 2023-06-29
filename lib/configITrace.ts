/**
 * Tracing configuration (interface)
 *
 * ConfigClass provides a collection of (example) Type-Safe (TypeScript) Config
 * class for the LPiC projects.
 * 
 * @module
 */

/**
 * Interface: ConfigClass.TraceConfig
 * 
 * The configuration used by the `tmgt` TextMate Grammar Tracing tool.
 */
export interface ITraceConfig {

  traceLinesInclude : Array<RegExp>
  traceLinesExclude : Array<RegExp>

  traceActionsInclude : Array<RegExp>
  traceActionsExclude : Array<RegExp>

  traceScopesInclude : Array<RegExp>
  traceScopesExclude : Array<RegExp>

  traceStructuresInclude : Array<RegExp>
  traceStructuresExclude : Array<RegExp>
}

export function addITraceConfig(aConfigInstance : any) : ITraceConfig {
  Object.defineProperty(aConfigInstance, 'traceLinesInclude', [])
  Object.defineProperty(aConfigInstance, 'traceLinesExclude', [])

  Object.defineProperty(aConfigInstance, 'traceActionsInclude', [])
  Object.defineProperty(aConfigInstance, 'traceActionsExclude', [])

  Object.defineProperty(aConfigInstance, 'traceScopesInclude', [])
  Object.defineProperty(aConfigInstance, 'traceScopesExclude', [])

  Object.defineProperty(aConfigInstance, 'traceStructuresInclude', [])
  Object.defineProperty(aConfigInstance, 'traceStructuresExclude', [])

  return aConfigInstance
}