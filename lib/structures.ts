/**
 * Structures
 *
 * The Structures module provides a **global** mapping from structure names to
 * the actual structures themselves.
 *
 * An individual structure can be any object registered with the Sturctures
 * global mapping.
 *
 * Individual structures are registered with the global mapping using the
 * `newStructure` function.
 *
 * @module
 */

import * as yaml from "yaml"

import { Logging, ValidLogger } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')

// The **global** collection of all registered Structures
export class Structures {

  // The (internal) mapping of structure names to structure objects
  static structs : Map<string, any> = new Map()

  // Does nothing... Not used
  constructor() {}

  /**
   * Get the named structure object, creating it if it does not already exist in
   * the `structs` mapping.
   *
   * @param aStructureKey - the name used to refer to this structure
   * @param aStructureValue - the structure object associated to the given name
   * 
   * @returns the named structure object or undefined. [See the return value
   * of
   * Map.get](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get#return_value)
   */
  static newStructure(aStructureKey : string, aStructureValue : any) {
    if (!Structures.structs.has(aStructureKey)) {
      Structures.structs.set(aStructureKey, aStructureValue)
    }
    return Structures.structs.get(aStructureKey)
  }

  /**
   * Get the named structure object
   *
   * @param aStructureKey - the name used to refer to this structure
   *
   * @returns the specified structure object or undefined. [See the return value
   * of
   * Map.get](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get#return_value)
   */
  static getStructure(aStructureKey : string) {
    return Structures.structs.get(aStructureKey)
  }

  // Return the array of the names of the currently known structures.
  static getStructureNames() {
    return Array.from(Structures.structs.keys()).sort()
  }

  /**
   * Stringify the given structure (using YAML) and log it at the `debug` level
   * using the logger for this tool.
   *
   * @param aStructureName - the name of the structure to log
   */
  static logStructure(aStructureName : string){
    if (!Structures.structs.has(aStructureName)) return
    logger.debug("--structure--------------------------------------------------")
    logger.debug(aStructureName)
    logger.debug("-------------------------")
    logger.debug(yaml.stringify(Structures.structs.get(aStructureName)))
  }

  // Stringify all known structures (using YAML) and log the result at the
  // `debug` level using the logger for this tool.
  static logAllStructures() {
    for (const aStructureName of Object.keys(Structures.structs).sort()) {
      Structures.logStructure(aStructureName)
    }
  }

  /**
   * Stringified the given structure (using YAML) and send it to the console.log
   *
   * @param aStructureName - the name of the structure to send to the console
   */
  static printStructure(aStructureName: string){
    if (!Structures.structs.has(aStructureName)) return
    console.log("--structure--------------------------------------------------")
    console.log(aStructureName)
    console.log("-------------------------")
    console.log(yaml.stringify(Structures.structs.get(aStructureName)))
  }

  // Stringify all known structures (using YAML) and send the result to the
  // console.
  static printAllStructures() {
    for (const aStructureName of Object.keys(Structures.structs).sort()) {
      Structures.printStructure(aStructureName)
    }
  }
}
