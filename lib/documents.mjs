
import fsp  from "fs/promises"
import path from "path"
import yaml from "yaml"

import { Config }       from "./configuration.mjs"

function readTestFile(testFile) {
  return new Promise((resolve, reject) => {
    fsp.readFile(
      path.join(process.cwd(), testFile),
      (error, data) => error ? reject(error) : resolve(data));
  })
}

class Document {
  filePath
  docName
  docLines = []

  constructor() {
    // do nothing at the moment
  }

  refreshFromStr(aDocName, aDocStr) {
    this.docName = aDocName
    this.docLines = aDocStr.split('\n')
  }

  async loadFromFile(aPath, verbose) {
    if (verbose) console.log(`loading document from ${aPath}`)
    this.filePath = Config.normalizePath(aPath)
    const aDocStr = await fsp.readFile(this.filePath, "utf8")
    this.refreshFromStr(aPath, aDocStr)
  }
}

class DocumentCache {
  static documents = {}

  static hasDocument(aPath) {
    return DocumentCache.documents.hasOwnProperty(aPath)
  }

  static getDocument(aPath) {
    return DocumentCache.documents[aPath]
  }

  static async loadFromFile(aPath) {
    const doc = new Document()
    await doc.loadFromFile(aPath)
    DocumentCache.documents[aPath] = doc
    return doc
  }

  static loadFromStr(docName, docStr) {
    const doc = new Document()
    doc.loadFromStr(docName, docStr)
    DocumentCache.documents[aPath] = doc
    return doc
  }

}

export { DocumentCache }