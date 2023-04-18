
import copy
import importlib
import json
import os
import sys
import tomllib
import yaml

from tmGrammars.grammar import Grammar
from tmGrammars.scopeActions import ScopeActions

def addArgParseArguments(argParser) :
  argParser.add_argument('-v', '--verbose', action="store_true",
    help="Be verbose"
  )
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
  argParser.add_argument('--prune', action='store_true',
    help="Prune unused patterns from grammar"
  )
  argParser.add_argument("--rules", action='store_true',
    help="Show the rules"
  )
  argParser.add_argument("--actions", action='store_true',
    help="Show the actions"
  )

def mergeConfigData(configData, newConfigData, thePath) :
  """ This is a generic Python merge. It is a *deep* merge and handles
  both dictionaries and arrays """

  if type(configData) is None :
    print("ERROR(mergeConfigData): configData should NEVER be None ")
    print(f"ERROR(megeConfigData): Stopped merge at {thePath}")
    return

  if type(configData) != type(newConfigData) :
    print(f"ERROR(mergeConfigData): Incompatible types {type(configData)} and {type(newConfigData)} while trying to merge Config data at {thePath}")
    print(f"ERROR(mergeConfigData): Stopped merge at {thePath}")
    return

  if type(configData) is dict :
    for key, value in newConfigData.items() :
      if key not in configData :
        configData[key] = copy.deepcopy(value)
      elif type(configData[key]) is dict :
        mergeConfigData(configData[key], value, thePath+'.'+key)
      elif type(configData[key]) is list :
        for aValue in value :
          configData[key].append(copy.deepcopy(aValue))
      else :
        configData[key] = copy.deepcopy(value)
  elif type(configData) is list :
    for value in newConfigData :
      configData.append(copy.deepcopy(value))
  else :
    print("ERROR(mergeConfigData): configData MUST be either a dictionary or an array.")
    print(f"ERROR(mergeConfigData): Stoping merge at {thePath}")
    return

def loadConfig(cliArgs, defaultConfig={}) :
  newConfig = {}
  if defaultConfig : mergeConfigData(newConfig, defaultConfig, '.')

  verbose = cliArgs['verbose']
  #print("--command line config------------------------------------------")
  #print(yaml.dump(cliArgs))

  if cliArgs['config'] :
    #print(cliArgs['config'])
    fConfig = {}
    fConfigPath = os.path.abspath(os.path.expanduser(cliArgs['config']))
    try :
      with open(fConfigPath, 'r') as fConfigFile :
        if fConfigPath.endswith('.yaml') or fConfigPath.endswith('.yml') :
          fConfig = yaml.safe_load(fConfigFile)
        elif fConfigPath.endswith('.toml') :
          fConfig = tomllib.loads(fConfigFile.read())
        elif fConfigPath.endswith('.json') :
          fConfig = json.load(fConfigFile)
        else :
          print("Could not find corrrect configuration file format")
          print(f"  trying to open {cliArgs['config']}")
          sys.exit(-1)
    except Exception as err :
      print(repr(err))
      print(f"  trying to open {cliArgs['config']}")
      sys.exit(-1)
    
    #print(yaml.dump(config))
    mergeConfigData(newConfig, fConfig, '.')

    #print("--after loading config-----------------------------------------")
    #print(yaml.dump(cliArgs))
    #print("---------------------------------------------------------------")

  mergeConfigData(newConfig, cliArgs, '.')
  cliArgs = newConfig

  if cliArgs['import'] :
    for aPath in cliArgs['import'] :
      if verbose : print(f"Adding {aPath} to Python sys.path")
      sys.path.append(os.path.abspath(os.path.expanduser(aPath)))
    #print(yaml.dump(sys.path))
    print("")

  if cliArgs['loadActions'] :
    for anActionModule in cliArgs['loadActions'] :
      if verbose : print(f"Loading actions from {anActionModule}")
      try :
        actions = importlib.import_module(anActionModule)
        if not actions :
          print("No actions loaded")
          sys.exit(-1)
      except Exception as err :
        print(repr(err))
        sys.exit(-1)
    print("")

  if cliArgs['actions'] :
    ScopeActions.printActions()
    sys.exit(0)

  if cliArgs['loadGrammar'] :
    for aGrammar in cliArgs['loadGrammar'] :
      if verbose : print(f"Loading grammar from {aGrammar}")
      if ':' in aGrammar :
        aPackage, aFile = aGrammar.split(':')
        try :
          Grammar.loadFromResourceDir(aPackage, aFile)
        except Exception as err :
          print(repr(err))
          sys.exit(-1)
      elif os.sep in aGrammar :
        aPath = os.path.abspath(os.path.expanduser(aGrammar))
        try :
          Grammar.loadFromFile(aPath)
        except Exception as err :
          print(repr(err))
          sys.exit(-1)
    print("")

  Grammar.collectRules()
  if cliArgs['prune'] : Grammar.pruneRules()

  if cliArgs['rules'] :
    Grammar.printRules()
    sys.exit(0)

  return verbose