
import argparse
import yaml

from tmGrammars.grammar import Grammar
from tmGrammars.documents import DocumentCache
from tmGrammars.scopeActions import ScopeActions

def cli() :
  argParser  = argparse.ArgumentParser()
  argParser.add_argument('filePath', nargs='?',
    help="The base document to parse OR the tmGrammar syntax file to save")
  argParser.add_argument('--save', metavar="base.scope", default='',
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
  print(yaml.dump(cliArgs))
  filePath = cliArgs['filePath']
