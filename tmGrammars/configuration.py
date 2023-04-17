
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

def loadConfig(cliArgs) :
  verbose = cliArgs['verbose']
  #print("--command line config------------------------------------------")
  #print(yaml.dump(cliArgs))

  if cliArgs['config'] :
    #print(cliArgs['config'])
    config = {}
    configPath = os.path.abspath(os.path.expanduser(cliArgs['config'])) 
    with open(configPath, 'r') as configFile :
      config = yaml.safe_load(configFile)
    #print(yaml.dump(config))
    if config :
      for aKey, aValue in config.items() :
        #print(f"checking key {aKey}")
        if aKey not in cliArgs or not cliArgs[aKey] :
          cliArgs[aKey] = aValue
    
    #print("--after loading config-----------------------------------------")
    #print(yaml.dump(cliArgs))
    #print("---------------------------------------------------------------")

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