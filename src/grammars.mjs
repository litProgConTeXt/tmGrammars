
import fs        from "fs"
import vsctm     from "vscode-textmate"
import oniguruma from "vscode-oniguruma"

// Some of the javascript in this module has been adapted from the example:
//   https://github.com/microsoft/vscode-textmate#using

function readGrammarFile(grammarPath) {
  return new Promise((resolve, reject) => {
    fs.readFile(
      grammarPath,
      (error, data) => error ? reject(error) : resolve(data));
  })
}

class Grammar {
  static scope2grammar = {}
  static _wasmBin
  static vscodeOnigurumaLib
  static registry

  static _initGrammarClass() {
      
    Grammar._wasmBin = fs.readFileSync(path.join(
      __dirname, '../node_modules/vscode-oniguruma/release/onig.wasm')
    ).buffer

    Grammar.vscodeOnigurumaLib = oniguruma.loadWASM(wasmBin).then(() => {
      return {
        createOnigScanner(patterns) { return new oniguruma.OnigScanner(patterns); },
        createOnigString(s) { return new oniguruma.OnigString(s); }
      };
    });

    // Create a registry that can create a grammar from a scope name.
    Grammar.registry = new vsctm.Registry({
      onigLib: vscodeOnigurumaLib,
      loadGrammar: (scopeName) => {
        if (scopeName in scope2grammar ) {
          return readGrammarFile(scope2grammar[scopeName]['syntax'])
          .then(data => vsctm.parseRawGrammar(
            data.toString(), scope2grammar[scopeName]['syntax'])
          )
        }
        console.log(`Unknown scope name: ${scopeName}`);
        return null;
      }
    });
  }

}

Grammar._initGrammarClass()
