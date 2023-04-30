

/*******************************************************************************
 *
 * Our structures are each a dictionary keyed by the "unchanging" attributes of
 * a given token. Each node in a structure may have doubly linked weak-pointers
 * (dictionary keys) for parent/child and previous/next (in a given parent/child
 * level).
 *
 * Our structures are essentially workspace based (to allow for the *whole*
 * ConTeXt document structure). This means that all nodes need to reference the
 * containing document URI.
 *
 * We always have a "checkPoint" structure which contains the points at which
 * the (re)parsing of a changed/updated document should (re)start. These check
 * points contain (deep copies of) the "previous" VSCode ruleStack. These check
 * points are indexed by the document URI and line number.
 *
 ******************************************************************************/

class SNode {
  constructor() {

  }
}

class Structure {
  constructor() {

  }


}

class Structures {

  static structs = {}

  static newStructure(aStructureKey, aStructureValue) {
    if (!Structures.structs[aStructureKey]) {
      Structures.structs[aStructureKey] = new Structure()
    }
    return Structures.structs[aStructureKey]
  }

  static getStructure(aStructureKey) {
    return Structures.structs[aStructureKey]
  }

  static getStructureNames() {
    return Object.keys(Structures.structs).sort()
  }

  static printStructure(aStructureName){
    if (!Structures.structs[aStructureName]) return
    console.log("--structure--------------------------------------------------")
    console.log(aStructureName)
    console.log("-------------------------")
    console.log(yaml.stringify(Structures.structs[aStructureName]))
  }

  static printAllStructures() {
    Object.keys(Structures.structs).sort().forEach(function(aStructureName){
      Structures.printStructure(aStructureName)
    })
  }
}

export { SNode, Structures }