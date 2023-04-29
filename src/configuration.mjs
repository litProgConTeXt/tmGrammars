
import fs    from "fs"
import { deepmerge } from "deepmerge-ts"
import os    from "os"
import path  from "path"
import toml  from "toml"
import yaml  from "yaml"

import { DocumentCache } from "./documents.mjs"
import { Grammars      } from "./grammars.mjs"
import { ScopeActions  } from "./scopeActions.mjs"

// Standard configuration for the LPiC projects

class Config {

  static addCliArgs(cliArgs) {
    cliArgs
      .option('-v, --verbose', 'Be verbose')
      .option('-c, --config <file>',  'Load a configuration file (YAML|TOML|JSON)')
      .option('-la, --loadActions <file...>', 'Load actions from a CommonJS module')
      .option('-lg, --loadGrammar <file...>', 'Load a grammar from the file system or a Python resource (JSON|PLIST)')
      .option('--prune',  'Prune unused patterns from grammar')
      .option('--actions', 'Show the actions')
      .option('--grammar <baseScope...>', 'Show the (raw) grammar')
      .option('--grammars', 'Show all (known raw) grammars')
      .option('-ta, --testActions <file>', 'Test the loaded actions using a document')
      .option('-tg, --testGrammars <file>', 'Test the loaded grammars using a document')
  }

  static normalizePath(aPath) {
    var pathPrefix = ""
    if (aPath.startsWith('~')) {
      pathPrefix = os.homedir()
      if (!aPath.startsWith('~/') && !aPath.startsWith('~\\') && aPath !== '~') {
        pathPrefix = path.dirname(pathPrefix)
      }
      aPath = aPath.replace(/^~/, '')
    } else if (aPath.startsWith('.')) {
      pathPrefix = process.cwd()
    }
    if (pathPrefix) {
      aPath = path.join(
        pathPrefix,
        aPath
      )
    }
    return path.normalize(aPath)
  }

  static async loadConfig(cliArgs, defaultConfig) {
    var config = {};
    if (defaultConfig) {
      config = deepmerge(config, defaultConfig) ;
    }
  
    const cliOpts = cliArgs.opts()
    const verbose = cliOpts.verbose ;
    if (verbose) {
      console.log("--command line config-------------------------------------")
      console.log(yaml.stringify(cliOpts))
      console.log("----------------------------------------------------------")
    }
  
    if (cliOpts.config) {
      const configText = fs.readFileSync(
        cliOpts.config, {encoding: 'utf8', flag: 'r'}
      );
      var fileConfig = {}
      const lcConfigPath = cliOpts.config.toLowerCase() ;
      if (lcConfigPath.endsWith('yaml') || lcConfigPath.endsWith('yml')) {
        fileConfig = yaml.parse(configText) ;
      } else if (lcConfigPath.endsWith('toml')) {
        fileConfig = toml.parse(configText) ;
      } else if (lcConfigPath.endsWith('json')) {
        fileConfig = JSON.parse(configText) ;
      }
      config = deepmerge(config, fileConfig) ;
    }
    
    config = deepmerge(config, cliOpts) ;
  
    if (verbose) {
      console.log("--command line config-------------------------------------")
      console.log(yaml.stringify(config))
      console.log("----------------------------------------------------------")
    }
  
    if (0 < config.loadActions.length) {
      await Promise.all(config.loadActions.map( async (anActionsPath) => {
        if (verbose) console.log(`starting to load actions from [${anActionsPath}]`)
        await ScopeActions.loadActionsFrom(anActionsPath, config.verbose).catch(err => console.log(err))
        if (verbose) console.log(`finished loading actions from [${anActionsPath}]`)
      }))
    }
  
    if (config['actions']) {
      ScopeActions.printActions()
      process.exit(0)
    }

    if (0 < config.loadGrammar.length) {
      await Promise.all(config.loadGrammar.map( async (aGrammarPath) => {
        if (verbose) console.log(`starting to load grammar from [${aGrammarPath}]`)
        await Grammars.loadGrammarFrom(aGrammarPath, config.verbose).catch(err => console.log(err))
        if (verbose) console.log(`finished loading grammar from [${aGrammarPath}]`)
      }))     
    }

    if (config['prune']) {
      const scopesWithActions = ScopeActions.getScopesWithActions()
      Grammars.pruneGrammars(scopesWithActions, config.verbose)
    }

    if (config['grammars']) {
      Grammars.printAllGrammars()
      process.exit(0)
    }

    if (config['grammar']) {
      config['grammar'].forEach(function(aBaseScope){
        Grammars.printGrammar(aBaseScope)
      })
      process.exit(0)
    }

    if (config['testActions']) {
      const aDocPath = config['testActions']
      const aDoc = await DocumentCache.loadFromFile(aDocPath)
      await Grammars.testActionsUsing(aDoc)
      process.exit(0)      
    }

    if (config['testGrammars']) {
      const aDocPath = config['testGrammars']
      const aDoc = await DocumentCache.loadFromFile(aDocPath)
      await Grammars.testGrammarsUsing(aDoc)
      process.exit(0)      
    }
  }
}

export { Config }
