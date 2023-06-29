/**
 * Document cache
 * 
 * We implement a simple Documents Cache...
 * 
 * @module
 */

import * as fsp  from "fs/promises"
import * as path from "path"
import * as yaml from "yaml"

import { Cfgr                 } from "./configurator.js"
import { Logging, ValidLogger } from "./logging.js"

const logger : ValidLogger = Logging.getLogger('lpic')

/*
function readTestFile(testFile) {
  return new Promise((resolve, reject) => {
    fsp.readFile(
      path.join(process.cwd(), testFile),
      (error, data) => error ? reject(error) : resolve(data));
  })
}
*/

/**
 * Class: Documents.Document
 * 
 * A representation of a single document
 */
class Document {
  filePath : string = ""
  docName  : string = ""
  docLines : Array<string> = []

  /**
   * Function: constructor
   * 
   * Does nothing at the moment...
   */
  constructor() {
    // do nothing at the moment
  }

  /**
   * Function: refreshFromStr
   * 
   * Refresh this document from a document string
   * 
   * Parameters:
   * 
   * aDocName - TODO This is WRONG we should not change the name of this document here!
   * 
   * aDocStr - A string version of the document's current value
   */
  refreshFromStr(aDocName: string, aDocStr : string) {
    this.docName = aDocName
    this.docLines = aDocStr.split('\n')
  }

  /**
   * Function: loadFromFile
   * 
   * Load a document from a file in the file-system
   * 
   * TODO: we should NOT use the current <refreshFromString>
   * 
   * Parameters:
   * 
   * aPath - A path to the file
   */
  async loadFromFile(aPath: string) {
    logger.debug(`loading document from ${aPath}`)
    this.filePath = Cfgr.normalizePath(aPath)
    const aDocStr = await fsp.readFile(this.filePath, "utf8")
    this.refreshFromStr(aPath, aDocStr)
  }
}

/** 
 * Class: Documents.DocumentCache
 * 
 * A cache of documents
 */
class DocumentCache {

  /**
   * Property: documents
   * 
   * A mapping of documents names to cached <Documents.Document>
   */
  static documents : Map<string, Document> = new Map()

  /**
   * Function: hasDocument
   * 
   * Returns:
   * 
   * true if the given path exists in the document cache
   * 
   * Parameters:
   * 
   * aPath - the name of the document to find in the cache
   * 
   */
  static hasDocument(aPath: string) {
    return DocumentCache.documents.has(aPath)
  }

  /** 
   * Function: getDocument
   *
   * Returns:
   *
   * the <Documents.Document> associated with the document name OR undefined if
   * there is no document with the given name
   *
   * Parameters:
   * 
   * aPath - the name of the document to find in the cache
   * 
   */
  static getDocument(aPath: string) {
    return DocumentCache.documents.get(aPath)
  }

  /**
   * Function: loadFromFile
   *
   * Loads the document from a file in the file-system
   *
   * Returns:
   *
   * the loaded <Documents.Document> or undefined if the document could not be
   * loaded.
   * 
   * Parameters:
   * 
   * aPath - the path to the document to load
   */
  static async loadFromFile(aPath:string) {
    const doc = new Document()
    await doc.loadFromFile(aPath)
    DocumentCache.documents.set(aPath, doc)
    return doc
  }

  /**
   * Function: loadFromStr
   * 
   * Loads the document from a string
   * 
   * Returns:
   * 
   * the document
   * 
   * Parameters:
   * 
   * docName - a name for the document in the cache
   * 
   * docStr - the document as a simple string
   */
  static loadFromStr(docName:string, docStr:string) {
    const doc = new Document()
    doc.refreshFromStr(docName, docStr)
    DocumentCache.documents.set(docName, doc)
    return doc
  }

}

/**
 * Interface: Exports
 * 
 * Exports:
 * 
 * DocumentCache - the document cache
 */
export { Document, DocumentCache }