
import fs from "fs"

function readTestFile(testFile) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      path.join(__dirname, testFile),
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

  loadFromFile(aPath) {
    this.filePath = aPath
    readTestFile(aPath)
      .then(docStr => this.refreshFromStr(aPath, docStr))
      .catch(error => {
        console.log(`Could not read file: [${aPath}]`)
        console.log(error)
      })
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

  static loadFromFile(aPath) {
    const doc = new Document()
    doc.loadFromFile(aPath)
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