
import argparse
import importlib
import os
import sys
import yaml

import tmGrammars.configuration 
from tmGrammars.grammar import Grammar
from tmGrammars.documents import DocumentCache

def cli() :
  argParser  = argparse.ArgumentParser()
  argParser.add_argument('filePath', nargs='?',
    help="The base document to parse OR the tmGrammar syntax file to save"
  )
  tmGrammars.configuration.addArgParseArguments(argParser)
  argParser.add_argument('-s', '--save', metavar="base.scope", default='',
      help="Save a full tmLanguage syntax for use with VScode"
  )
  argParser.add_argument('--check', action='store_true',
    help="Check the loaded grammar for missing and extra patterns"
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

  cliArgs = vars(argParser.parse_args())
  tmGrammars.configuration.loadConfig(cliArgs)

  if cliArgs['patterns'] :
    Grammar.printPatternReferences()
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
