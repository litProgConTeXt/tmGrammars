/**
 * Structures
 * 
 * ### Intended use
 * 
 * Our structures are each a dictionary keyed by the "unchanging" attributes of
 * a given token. Each node in a structure may have doubly linked weak-pointers
 * (dictionary keys) for parent/child and previous/next (in a given parent/child
 * level).
 *
 * Our structures are essentially workspace based (to allow for the _whole_
 * ConTeXt document structure). This means that all nodes need to reference the
 * containing document URI.
 *
 * We always have a "checkPoint" structure which contains the points at which
 * the (re)parsing of a changed/updated document should (re)start. These check
 * points contain (deep copies of) the "previous" VSCode ruleStack. These check
 * points are indexed by the document URI and line number.
 *
 * @module
 */

import * as yaml from "yaml"

import { Logging, ValidLogger } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')

/**
 * Class: Structures.SNode
 * 
 * ????
 */
class SNode {
  constructor() {

  }
}

/**
 * Class: Structures.Structure
 * 
 * ???
 */
class Structure {
  constructor() {

  }
}

/**
 * Class: Structures.Structures
 * 
 */
class Structures {

  /**
   * Property: structs
   *
   * The (internal) mapping of structure names to structure objects
   */
  static structs : Map<string, any> = new Map()

  /**
   * Function: newStructure
   *
   * Get the named structure object, creating it if it does not already exist in
   * the <structs> mapping.
   * 
   * Parameters: 
   * 
   * aStructureKey - the name used to refer to this structure
   * 
   * aStructureValue - the structure object associated to the given name
   */
  static newStructure(aStructureKey : string, aStructureValue : any) {
    if (!Structures.structs.has(aStructureKey)) {
      Structures.structs.set(aStructureKey, aStructureValue)
    }
    return Structures.structs.get(aStructureKey)
  }

  /**
   * Function: getStructure
   *
   * Get the named structure object
   *
   * Parameters:
   *
   * aStructureKey - the name used to refer to this structure
   *
   * Returns:
   *
   * the specified structure object or undefined. <See the return value of
   * Map.get:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/get#return_value>
   */
  static getStructure(aStructureKey : string) {
    return Structures.structs.get(aStructureKey)
  }

  /**
   * Function: getStructureNames
   * 
   * Return the array of the names of the currently known structures.
   */
  static getStructureNames() {
    return Object.keys(Structures.structs).sort()
  }

  /**
   * Function: logStructure
   *
   * Stringify the given structure (using YAML) and log it at the `debug` level
   * using the Pino <Logging> logger for this tool.
   * 
   * Parameters:
   * 
   * aStructureName - the name of the structure to log
   */
  static logStructure(aStructureName : string){
    if (!Structures.structs.has(aStructureName)) return
    logger.debug("--structure--------------------------------------------------")
    logger.debug(aStructureName)
    logger.debug("-------------------------")
    logger.debug(yaml.stringify(Structures.structs.get(aStructureName)))
  }

  /**
   * Function: printStructure
   * 
   * Stringified the given structure (using YAML) and send it to the console.log
   * 
   * Parameters:
   * 
   * aStructureName - the name of the structure to send to the console
   */
  static printStructure(aStructureName: string){
    if (!Structures.structs.has(aStructureName)) return
    console.log("--structure--------------------------------------------------")
    console.log(aStructureName)
    console.log("-------------------------")
    console.log(yaml.stringify(Structures.structs.get(aStructureName)))
  }

  /**
   * Function: printAllStructures
   *
   * Stringify all known structures (using YAML) and send the result to the
   * console.
   */
  static printAllStructures() {
    for (const aStructureName of Object.keys(Structures.structs).sort()) {
      Structures.printStructure(aStructureName)
    }
  }
}

/**
 * Interface: Structures.Exports
 * 
 * Exports:
 * 
 * SNode - ??
 * 
 * Structures - The (global) interface to all known structures.
 */
export { SNode, Structures }