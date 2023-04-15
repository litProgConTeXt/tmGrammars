
import copy
import importlib
import os
import pkgutil
import sys
import yaml

class ScopeAction :
  def __init__(self, scopeStr, actionFunc, kwsPacked, kwargsDict) :
    self.scope      = scopeStr
    self.func       = actionFunc
    self.packed     = kwsPacked
    self.kwargsDict = kwargsDict

  def __str__(self) :
    theMethod     = self.func
    theMethodName = theMethod.__module__+'.'+theMethod.__name__
    return f"{self.scope} : {self.func.__module__}.{self.func.__name__}"

  async def run(self) :
    if self.packed :
      return await func(self.kwargsDict)
    else :
      return await self.func(**self.kwargsDict)

class ScopeActions :

  # Class variables and definitions

  actions = {} # Class variable

  def addMethod(scopeStr, aFunc, packed=True, kwargsDict={}) :
    scopeParts = scopeStr.split('.')
    #print(yaml.dump(scopeParts))
    curScope = ScopeActions.actions
    for aScopePart in scopeParts :
      #print(aScopePart)
      if aScopePart not in curScope :
        curScope[aScopePart] = {}
      curScope = curScope[aScopePart]
    curScope['__action__'] = ScopeAction(
      scopeStr, aFunc, packed, copy.deepcopy(kwargsDict)
    )
    #print(yaml.dump(ScopeActions.actions))

  def method(scopeStr, packed=True, kwargsDict={}) :
    def decorator_scopeMethod(func) :
      ScopeActions.addMethod(
        scopeStr, func, packed=packed, kwargsDict=kwargsDict
      )
      return func
    return decorator_scopeMethod

  def getAction(scopeStr) :
    scopeParts = scopeStr.split('.')
    curScope = ScopeActions.actions
    for aPart in scopeParts :
      if aPart in curScope : curScope = curScope[aPart]
      else                 : return None
    if '__action__' not in curScope : return None
    return curScope['__action__']

  def hasAction(scopeStr) :
    return ScopeActions.getAction(scopeStr) is not None

  async def run(scopeStr) :
    return await ScopeActions.runTheAction(ScopeActions.getAction(scopeStr))

  def getAllActions(scopeStr) :
    actionsFound = []
    scopeParts = scopeStr.split('.')
    curScope = ScopeActions.actions
    for aPart in scopeParts :
      if aPart in curScope :
        curScope = curScope[aPart]
      else :
        return actionsFound
      if '__action__' in curScope :
        actionsFound.insert(0, curScope['__action__'])
    return actionsFound

  def hasAnyAction(scopeStr) :
    return 0 < len(ScopeActions.getAction(scopeStr))

  async def runMostSpecific(scopeStr) :
    someActions = ScopeActions.getAllActions(scopeStr)
    if someActions :
      return await ScopeActions.runTheAction(someActions[0])

  def loadActionsFromDir(aDir) :
    #Load/import all scope actions found in the aDir directory.

    if aDir.startswith('~') :
      aDir = os.path.expanduser(aDir)
    aPkgPath = os.path.basename(aDir)
    aSysPath = os.path.dirname(aDir)
    if aSysPath not in sys.path :
      sys.path.insert(0, aSysPath)

    for (_, module_name, _) in pkgutil.iter_modules([aDir]) :
      theModule = importlib.import_module(aPkgPath+'.'+module_name)

  def printActions() :
    actions = ScopeActions.actions
    print("--actions----------------------------------------------------")
    ScopeActions._printActions('', actions)
    print("-------------------------------------------------------------")

  def _printActions(baseScope, actions) :
    if '__action__' in actions :
      print(actions['__action__'])
      return
    for aPartKey in sorted(actions.keys()) :
      ScopeActions._printActions(
        baseScope+'.'+aPartKey,
        actions[aPartKey]
      )
