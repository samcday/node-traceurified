// A simple require("traceur") brings in the traceur runtime. Ick!
// What we do here is load the traceur dist into a sandbox.

var vm = require("vm");
var fs = require("fs");

var sandbox = null; // Lazily initialised.

exports.get = function() {
  if (sandbox) {
    return sandbox.traceur;
  }

  sandbox = vm.createContext();
  var traceurCode = fs.readFileSync(require.resolve("traceur/bin/traceur.js"));
  vm.runInContext(traceurCode, sandbox);
  return sandbox.traceur;
};

// Parses given code into ES6 syntax tree.
exports.parse = function(filename, content) {
  var traceur = exports.get();

  var sourceFile = new traceur.syntax.SourceFile(filename, content);
  var parser = new traceur.syntax.Parser(sourceFile);
  var es6Tree = parser.parseModule();
  return es6Tree;
};

// Takes an ES6 tree and transforms it to an ES5 equivalent.
// This is the main part of the "transpilation".
exports.transformToES5 = function(filename, tree) {
  var traceur = exports.get();

  var reporter = new traceur.util.ErrorReporter();
  var transformer = new traceur.codegeneration.FromOptionsTransformer(reporter);
  var es5Tree = transformer.transform(tree);
  if (reporter.hadError()) {
    throw new Error("Error transforming " + filename);
  }

  return es5Tree;
};
