
import yaml

class DocumentCache :

  # class methods and variables

  documents = {}

  def hasDocument(aPath) :
    return aPath in DocumentCache.documents

  def getDocument(aPath) :
    if aPath in DocumentCache.documents :
      return DocumentCache.documents[aPath]
    return None

  def loadFromFile(aPath) :
    doc = Document()
    doc.loadFromFile(aPath)
    DocumentCache.documents[aPath] = doc
    return doc

  def loadFromStr(docName, docStr) :
    doc = Document()
    doc.loadFromStr(docName, docStr)
    DocumentCache.documents[docName] = doc
    return doc

  def parse(docName, startingScope) :
    if docName in DocumentCache.documents :
      theDoc = DocumentCache.documents[docName]
      theDoc.parse(startingScope)

class DocumentIter :

  def __init__(self, aDoc, startLine=None, endLine=None) :
    if startLine == None : startLine = 0
    if endLine   == None : endLine   = len(aDoc.docLines)

    self.theDoc    = aDoc
    self.docLines  = aDoc.docLines
    self.startLine = startLine
    self.endLine   = endLine
    self.index     = startLine

  def __iter__(self) :
    self.index   = self.startLine
    return self

  def __next__(self) :

    if self.endLine <= self.index :
      raise StopIteration
    curLine = self.docLines[self.index]
    self.index += 1
    return curLine

class ScopedDocument :
  def __init__(self, aDoc, aScope, startLine=None, endLine=None) :
    if startLine == None : startLine = 0
    if endLine   == None : endLine   = len(aDoc.docLines)
    if startLine < 0 : startLine = 0
    if len(aDoc.docLines) < endLine : endLine = len(aDoc.docLines)
    self.scope  = aScope
    self.theDoc = aDoc
    self.startLine = startLine
    self.endLine   = endLine

  def getDocIter(self, startLine=None, endLine=None) :
    if startLine == None : startLine = self.startLine
    if endLine   == None : endLine   = self.endLine
    if startLine < self.startLine : startLine = self.startLine
    if self.endLine < endLine     : endLine   = self.endLine
    return self.theDoc.getDocIter(startLine=startLine, endLine=endLine)

  def parse(self) :
    pass

class Document :
  # Class variables and definitions

  def removeComment(aLine) :
    parts = aLine.split('%')
    newLine = []
    while True :
      if len(parts) < 1 : break
      firstPart = parts.pop(0)
      newLine.append(firstPart)
      if not firstPart.endswith('\\') : break
    return "%".join(newLine)

  # Instance variables and definitions

  def __init__(self) :
    self.filePath = None
    self.docName  = None
    self.docLines = []

  def loadFromFile(self, aPath) :
    self.filePath = aPath
    with open(aPath) as docFile :
      self.refreshFromStr(aPath, docFile.read())

  def refreshFromStr(self, aDocName, aDocStr) :
    self.docName  = aDocName
    self.docLines = aDocStr.splitlines()

  def update(self, startLine, endLine, updateStr) :
    pass

  def getDocIter(self, startLine=None, endLine=None) :
    return DocumentIter(self, startLine=startLine, endLine=endLine)

  def getScopedDoc(self, aScope, startLine=None, endLine=None) :
    return ScopedDocument(self, aScope, startLine=startLine, endLine=endLine)

  def parse(self, startingScope) :
      theDocLines = self.getDocIter()
      openScopes = { startingScope : True }
      for aLine in theDocLines :
        print(aLine)
        curScopes = list(openScopes.keys()) # the open scopes for *this* line
        for aScope in curScopes :
          aMatch = Grammar.matchUsing(aLine, aScope)
          if aMatch :
            pass

