
import copy
import importlib
import os
import sys
import yaml

from tmGrammars.grammar import Grammar

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
    with open(fConfigPath, 'r') as fConfigFile :
      fConfig = yaml.safe_load(fConfigFile)
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
          return
      except Exception as err :
        print(repr(err))
        return
    print("")

  if cliArgs['loadGrammar'] :
    for aGrammar in cliArgs['loadGrammar'] :
      if verbose : print(f"Loading grammar from {aGrammar}")
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

  return verbose