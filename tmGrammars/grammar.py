
import copy
import glob
import importlib.resources
import json
import os
#import pprint
import yaml

from tmGrammars.scopeActions import ScopeActions

# see:
#  https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide
#  https://macromates.com/manual/en/language_grammars

class Grammar :

  # Class variables and definitions

  repository = {}
  scopes2patterns = {}
  scopes2rules = {}
  deletedScopes = []
  baseScopes = {}

  def addPatternsToRepository(aName, aScope, patterns) :
    #print(f"adding {aName} to repository")
    if aName in Grammar.repository :
      print(f"WARNING: Duplicate pattern name {aName} in repository.")
      print("  last pattern wins! (This may not be what you want)")
      print("")
    Grammar.repository[aName] = patterns
    if aScope :
      Grammar.scopes2patterns[aScope] = aName

  def loadFromDict(gDict) :

    # deal with the grammar's repository
    if 'repository' in gDict :
      for aPatternName, aPattern in gDict['repository'].items() :
        aPatternScope = None
        if 'name' in aPattern: aPatterScope = aPattern['name']
        Grammar.addPatternsToRepository(aPatternName, aPatternScope, aPattern)
  
    # deal with the grammar's base scope/pattern
    scopeName = None
    if 'scopeName' in gDict :
      scopeName = gDict['scopeName']
    if 'patterns' in gDict :
      Grammar.addPatternsToRepository(
        scopeName, scopeName, {
          'patterns' : gDict['patterns']
        }
      )
      if scopeName :
        Grammar.repository[scopeName]['name'] = scopeName
      else :
        print("WARNING: loading a grammer with no scope! ")
        print("  this means that this grammar can not be directly used!")
        print("")
  
    # deal with the grammar's info
    info = {}
    if 'fileTypes' in gDict :
      info['fileTypes'] = gDict['fileTypes']
    if 'foldingStartMarker' in gDict :
      info['foldingStartMarker'] = gDict['foldingStartMarker']
    if 'foldingStopMarker' in gDict :
      info['foldingStopMarker'] = gDict['foldingStopMarker']
    if 'firstLineMatch' in gDict :
      info['firstLineMatch'] = gDict['firstLineMatch']
    info['scopeName'] = scopeName
    Grammar.baseScopes[scopeName] = info

  def loadFromFile(aGrammarPath) :
    try :
      with open(aGrammarPath) as grammarFile :
        grammarDict = json.loads(grammarFile.read())
        Grammar.loadFromDict(grammarDict)
    except Exception as err :
      print(repr(err))
      print(f"  trying to load {aGramamrPath}")

  def loadFromResourceDir(aGrammarPackage, aGrammarFile) :
    syntaxDir = importlib.resources.files(aGrammarPackage)
    foundGrammar = False
    for aSyntaxFile in syntaxDir.iterdir() :
      if not aSyntaxFile.name.startswith(aGrammarFile)   : continue
      if not aSyntaxFile.name.endswith('tmGrammar.json') : continue
      try :
        with importlib.resources.as_file(aSyntaxFile) as syntaxFile :
          syntaxStr = syntaxFile.read_text()
          syntaxDict = json.loads(syntaxStr)
          Grammar.loadFromDict(syntaxDict)
          foundGrammar = True
      except Exception as err :
        print(repr(err))
        print(f"  trying to load {aGrammarPackage}:{aGrammarFile}")
    if not foundGrammar :
      print(f"Could not find grammar: {aGrammarPackage}:{aGrammarFile}")

  def collectPatternReferences() :
    repo = Grammar.repository
    patRefs = {}
    for aScope in Grammar.baseScopes.keys() :
      patRefs[aScope] = True
    for aName, aPattern in repo.items() :
      #print(aName)
      if 'patterns' in aPattern :
        for aSubPattern in aPattern['patterns'] :
          if 'include' in aSubPattern :
            aPatRef = aSubPattern['include']
            if aPatRef == '$self' : continue
            #print(f"  {aPatRef}")
            patRefs[aPatRef] = True
    return sorted(patRefs.keys())

  def checkRepository() :
    patRefs = Grammar.collectPatternReferences()
    repo    = Grammar.repository
    missingPats = []
    extraPats   = []
    for aName in patRefs :
      aName = aName.lstrip('#')
      if aName not in repo :
        missingPats.append(aName)
    for aName in repo :
      if aName not in patRefs and f"#{aName}" not in patRefs :
        extraPats.append(aName)
    return missingPats, extraPats, patRefs

  def addScopeRules(aScope, aRule, patternName=None) :
    if 'name' in aRule :
      if aRule['name'] != aScope :
        ruleName = aRule['name']
        newRule = {
          'name' : ruleName
        }
        someActions = ScopeActions.getAllActions(ruleName)
        if someActions :
          actions = {}
          for anAction in someActions :
            actions[anAction.scope] = anAction
          newRule['actions'] = actions

        if patternName : newRule['pattern'] = patternName
        if 'begin' in aRule :
          newRule['begin'] = aRule['begin']
          if 'beginCaptures' in aRule :
            newRule['beginCaptures'] = aRule['beginCaptures']
        if 'match' in aRule :
          newRule['match'] = aRule['match']
          if 'captures' in aRule : 
            newRule['captures'] = aRule['captures']
        Grammar.scopes2rules[aScope]['rules'].append(newRule)
        return
    if 'end' in aRule : 
      anEndRule = {
        'match' : aRule['end']
      }
      if 'endCaptures' in aRule :
        anEndRule['captures'] = aRule['endCaptures']
      Grammar.scopes2rules[aScope]['endRules'].append(anEndRule)
    if 'patterns' in aRule :
      for aPattern in aRule['patterns'] :
        Grammar.addScopeRules(aScope, aPattern)
    if 'include' in aRule :
      includeKey = aRule['include'].lstrip('#')
      if includeKey in Grammar.repository :
        Grammar.addScopeRules(
          aScope, Grammar.repository[includeKey], includeKey
        )

  def addScope(aScope, howFound, aRule=None) :
    s2r = Grammar.scopes2rules
    newRule = {
      'found'    : howFound,
      'endRules' : [],
      'rules'    : []
    }
    someActions = ScopeActions.getAllActions(aScope)
    if someActions :
      actions = {}
      for anAction in someActions :
        actions[anAction.scope] = anAction
      newRule['actions'] = actions
    if aScope not in s2r : s2r[aScope] = newRule
    if aRule : Grammar.addScopeRules(aScope, aRule)

  def collectRules() :
    # base case
    for aKey, aRule in Grammar.repository.items() :
      Grammar._collectRules(aRule)
    return Grammar.scopes2rules

  def _collectRules(aRule) :
    if 'name' in aRule :
      Grammar.addScope(aRule['name'], 'rule.name', aRule)
      #return
    if 'include' in aRule and aRule['include'][0] not in '#$' :
      Grammar.addScope(aRule['include'], 'include.name')
    for aCapKey in ['captures', 'beginCaptures', 'endCaptures'] :
      if aCapKey in aRule : 
        for aKey, aCapture in aRule[aCapKey].items() :
          if 'name' in aCapture :
            Grammar.addScope(aCapture['name'], f'{aCapKey}.name')
    if 'patterns' in aRule :
      for aPattern in aRule['patterns'] :
        Grammar._collectRules(aPattern)

  def collectScopePaths() :
    return sorted(Grammar.scopes2rules.keys())

  def pruneRules() :
    # base case
    scopes2delete = []
    s2r = Grammar.scopes2rules
    for aScope, scopeRules in s2r.items() :
      rules2delete = []
      for ruleIndex, aRule in enumerate(scopeRules['rules']) :
        if 'actions' not in aRule : rules2delete.append(ruleIndex)
      rules2delete.reverse()
      for anIndex in rules2delete : del scopeRules['rules'][anIndex]
      if len(scopeRules['rules']) < 1 and 'actions' not in scopeRules :
        scopes2delete.append(aScope)
    for aScope in scopes2delete :
      del s2r[aScope]
    Grammar.deletedScopes = scopes2delete

  def checkRuleForAction(aRule) :
    if 'name' in aRule :
      if aRule['name'] in Grammar.scopes2rules :
        return Grammar.scopeHasAction(aRule['name'])
      for aCaptureKey in ['captures', 'beginCaptures'] :
        if aCaptureKey in aRule :
          for aKey, aCapture in aRule[aCaptureKey] :
            if Grammar.checkRuleForAction(aCapture) :
              return True
    return False

  def scopeHasAction(aScope) :
    aRule = Grammar.scopes2rules[aScope]
    if 'actions' in aRule : return True
    someRules = []
    someRules.extend(aRule['endRules'])
    someRules.extend(aRule['rules'])
    for aSubRule in someRules :
      if Grammar.checkRuleForAction(aSubRule) :
        return True
    return False

  def saveToDict(aScope) :
    if aScope not in Grammar.baseScopes :
      return None
    gDict = Grammar.baseScopes[aScope]
    gDict['patterns'] = [
      { 'include' : aScope }
    ]
    gDict['repository'] = copy.deepcopy(Grammar.repository)
    return gDict

  def savedToFile(aScope, aGrammarPath) :
    grammarDict = Grammar.saveToDict(aScope)
    if grammarDict :
      grammarStr = json.dumps(grammarDict, indent=2) 
      with open(aGrammarPath, 'w') as grammarFile :
        grammarFile.write(grammarStr)
        grammarFile.write("\n")
      return True
    return False

  def matchUsing(aLine, aScope) :
    if aScope not in Grammar.scopes2patterns : return None
    aPattern = Grammar.scopes2patterns[aScope]
    if aPattern not in Grammar.repository : return None
    aRule = Gramamr.repository[aPattern]

  def printPatternReferences() :
    theReferences = Grammar.collectPatternReferences()
    print("--patterns---------------------------------------------------")
    if theReferences : print(yaml.dump(theReferences))
    print("-------------------------------------------------------------")

  def printCheckRepositoryReport() :
    missingPatterns, extraPatterns, patternReferences = Grammar.checkRepository()
    print("")
    print("--missing patterns-------------------------------------------")
    if missingPatterns   : print(yaml.dump(missingPatterns))
    else : print("")
    print("--extra patterns---------------------------------------------")
    if extraPatterns     : print(yaml.dump(extraPatterns))
    else : print("")
    print("--patterns---------------------------------------------------")
    if patternReferences : print(yaml.dump(patternReferences))
    else : print("")
    print("-------------------------------------------------------------")

  def printScopePaths() :
    thePaths = Grammar.collectScopePaths()
    print("---scope paths-----------------------------------------------")
    if thePaths : print(yaml.dump(thePaths))
    print("-------------------------------------------------------------")

  def printRules() :
    theRules = Grammar.scopes2rules
    print("--rules------------------------------------------------------")
    if theRules : print(yaml.dump(theRules))
    print("-------------------------------------------------------------")

  def printGrammar() :
    print("--repository ------------------------------------------------")
    if Grammar.repository      : print(yaml.dump(Grammar.repository))
    print("--scopes 2 patterns_-----------------------------------------")
    if Grammar.scopes2patterns : print(yaml.dump(Grammar.scopes2patterns))
    print("--base scopes------------------------------------------------")
    if Grammar.baseScopes      : print(yaml.dump(Grammar.baseScopes))
    print("-------------------------------------------------------------")
