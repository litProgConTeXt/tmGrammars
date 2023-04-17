
import argparse
import importlib
import os
import sys
import yaml

from tmGrammars.grammar import Grammar
from tmGrammars.documents import DocumentCache
from tmGrammars.scopeActions import ScopeActions

def cli() :
  argParser  = argparse.ArgumentParser()
  argParser.add_argument('filePath', nargs='?',
    help="The base document to parse OR the tmGrammar syntax file to save")

  argParser.add_argument('-c', '--config', metavar='configuration', default='',
    help="Load a configuration file (YAML)"
  )
  argParser.add_argument('-i', '--import', metavar='pyPackagePath',
    action='append',  default=[],
    help="Add a Python package to the Python sys.path"
  )
  argParser.add_argument('-la', '--loadActions', metavar="actionModule",
    action='append', default=[],
    help="Load actions from a Python module"
  )
  argParser.add_argument('-lg', '--loadGrammar', metavar="aGrammar",
    action='append', default=[],
    help="Load a grammar from the file system or a Python resource (JSON)"
  )
  argParser.add_argument('-s', '--save', metavar="base.scope", default='',
      help="Save a full tmLanguage syntax for use with VScode")

  argParser.add_argument('--check', action='store_true',
    help="Check the loaded grammar for missing and extra patterns"
  )
  argParser.add_argument('--prune', action='store_true',
    help="Prune unused patterns from grammar"
  )
  argParser.add_argument("--grammar", action='store_true',
    help="Show the currently loaded Grammar"
  )
  argParser.add_argument("--patterns", action='store_true',
    help="Show the patterns"
  )
  argParser.add_argument('--scopePaths', action='store_true',
    help="List the scopePaths found in the current grammar"
  )
  argParser.add_argument("--rules", action='store_true',
    help="Show the rules"
  )
  argParser.add_argument("--actions", action='store_true',
    help="Show the actions"
  )
  cliArgs = vars(argParser.parse_args())
  print("--command line config------------------------------------------")
  print(yaml.dump(cliArgs))

  if cliArgs['config'] :
    print(cliArgs['config'])
    config = {}
    configPath = os.path.abspath(os.path.expanduser(cliArgs['config'])) 
    with open(configPath, 'r') as configFile :
      config = yaml.safe_load(configFile)
    print(yaml.dump(config))
    if config :
      for aKey, aValue in config.items() :
        print(f"checking key {aKey}")
        if aKey not in cliArgs or not cliArgs[aKey] :
          cliArgs[aKey] = aValue
    
    print("--after loading config-----------------------------------------")
    print(yaml.dump(cliArgs))
    print("---------------------------------------------------------------")

  if cliArgs['import'] :
    for aPath in cliArgs['import'] :
      print(f"Adding {aPath} to Python sys.path")
      sys.path.append(os.path.abspath(os.path.expanduser(aPath)))
    #print(yaml.dump(sys.path))
    print("")

  if cliArgs['loadActions'] :
    for anActionModule in cliArgs['loadActions'] :
      print(f"Loading actions from {anActionModule}")
      try : 
        actions = importlib.import_module(anActionModule)
        if not actions :
          print("No actions loaded")
          return
      except Exception as err :
        print(repr(err))
        return
    print("")

  if cliArgs['actions'] :
    ScopeActions.printActions()
    return

  if cliArgs['loadGrammar'] :
    for aGrammar in cliArgs['loadGrammar'] :
      print(f"Loading grammar from {aGrammar}")
      if ':' in aGrammar :
        aPackage, aFile = aGrammar.split(':')
        try :
          Grammar.loadFromResourceDir(aPackage, aFile)
        except Exception as err :
          print(repr(err))
          return
      elif os.sep in aGrammar :
        aPath = os.path.abspath(os.path.expanduser(aGrammar))
        try : 
          Grammar.loadFromFile(aPath)
        except Exception as err :
          print(repr(err))
          return
    print("")

  Grammar.collectRules()
  if cliArgs['prune'] : Grammar.pruneRules()

  if cliArgs['patterns'] :
    Grammar.printPatternReferences()
    return

  if cliArgs['rules'] :
    Grammar.printRules()
    return

  if cliArgs['grammar'] :
    Grammar.printGrammar()
    return
  
  if cliArgs['check'] :
    Grammar.printCheckRepositoryReport()
    return

  if cliArgs['scopePaths'] :
    Grammar.printScopePaths()
    return

  filePath = cliArgs['filePath']

  if cliArgs['save'] : 
    if Grammar.savedToFile(cliArgs['save'], filePath) :
      print(f"Saved current syntax to the tmLanguage.json file:\n  {filePath}\n")
    else :
      print(f"base.scope [{cliArgs['save']}] not found in grammar\n")
    return

  if filePath == None :
    print("You MUST specify a filePath when extracting LPiC code")
    return
  
  print(f"Extracting LPiC code from:\n  {filePath}\n")
  doc = DocumentCache.loadFromFile(filePath)

  print("---document keys------------------------------------------")
  print(yaml.dump(list(DocumentCache.documents.keys())))
  print("---document-----------------------------------------------")
  print(yaml.dump(doc))
  print("----------------------------------------------------------")
