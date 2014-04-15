"use strict";

var traceur = require("traceur");
var chain = require("stack-chain");
var escodegen = require("escodegen");
var sourcemap = require("source-map");
var fs = require("fs");
var Module = require("module");
var MozillaParseTreeTransformer = require("./MozillaParseTreeTransformer");

var SourceMapConsumer = sourcemap.SourceMapConsumer;
var ErrorReporter = traceur.util.ErrorReporter;
var FromOptionsTransformer = traceur.codegeneration.FromOptionsTransformer;
var Parser = traceur.syntax.Parser;
var SourceFile = traceur.syntax.SourceFile;
var TreeWriter = traceur.outputgeneration.TreeWriter;

function Traceurified(filter) {
  // TODO: make options configurable.
  traceur.options.annotations = true;
  traceur.options.asyncFunctions = true;
  traceur.options.modules = "commonjs";

  var filters = [];
  var originalRequireJs = Module._extensions[".js"];

  // Rewrite callsites to:
  // * use source mapped positions, if available.
  // * filter out traceur eval frames.
  chain.filter.attach(function (error, frames) {
    return frames.filter(function (callSite, idx) {
      if (callSite.isEval() && idx > 0) {
        if (callSite.getEvalOrigin().indexOf("src/node/traceur.js") > -1) {
          return false;
        }
      }

      var filename = callSite.getFileName();
      if (!filename) {
        return true;
      }
      var sourceMap = Traceurified.sourceMaps[filename];
      if (!sourceMap) {
        return true;
      }

      var position = {
        source: filename,
        line: callSite.getLineNumber(),
        column: callSite.getColumnNumber()
      };

      var originalPosition = sourceMap.originalPositionFor(position);

      if (originalPosition && originalPosition.source) {
        // Patch callSite with the mapped values.
        Object.defineProperty(callSite, "getLineNumber", {
          value: function() {
            return originalPosition.line;
          }
        });
        Object.defineProperty(callSite, "getColumnNumber", {
          value: function() {
            return originalPosition.column;
          }
        });
      }

      return true;
    });
  });

  function shouldCompile(filename) {
    if (filters.length === 0) {
      return true;
    }
    for (var i = 0; i < filters.length; i++) {
      if (filters[i].call(null, filename)) {
        return true;
      }
    }
    return false;
  }

  Traceurified.parseES6 = function(filename, content) {
    var sourceFile = new SourceFile(filename, content);
    var parser = new Parser(sourceFile);
    var es6Tree = parser.parseModule();
    return es6Tree;
  };

  /**
   * Transforms given ES6 parse tree (in Traceur AST format), and converts it
   * into ES5 code. Returns a SpiderMonkey compatible parse tree.
   */
  Traceurified.transformToES5 = function(filename, es6Tree) {
    var reporter = new ErrorReporter();
    var transformer = new FromOptionsTransformer(reporter);
    var es5Tree = transformer.transform(es6Tree);
    if (reporter.hadError())
      throw new Error("Error transforming " + filename);

    var mozillaAst = new MozillaParseTreeTransformer().transformAny(es5Tree);

    return mozillaAst;
  };

  Traceurified.compile = function(filename, content, runProcessors) {
    var es6Tree = Traceurified.parseES6(filename, content);

    if (runProcessors) {
      Traceurified.es6Transformers.forEach(function(transformer) {
        var res = transformer(filename, es6Tree);
        if (res) {
          es6Tree = res;
        }
      });
    }

    var es5Tree = Traceurified.transformToES5(filename, es6Tree);

    if (runProcessors) {
      Traceurified.es5Transformers.forEach(function(transformer) {
        var res = transformer(filename, es5Tree);
        if (res) {
          es5Tree = res;
        }
      });
    }

    var result = escodegen.generate(es5Tree, {
      sourceMap: filename,
      sourceMapWithCode: true
    });

    return {
      sourceMap: JSON.stringify(result.map),
      source: result.code
    };

    // TODO: do we need to save off the es6/es5 trees?
    // Traceurified.ast[filename] = result.es6Ast;
    // Traceurified.processedAst[filename] = result.es5Ast;

    // return Traceurified.generateEs5Source(filename, es5Tree);
    // var result = Traceurified.generateEs5Source(filename, es5Tree);
    // var sourceMap = result.sourceMap;
    // var src = result.source;

    // return {
    //   code: src,
    //   es5Ast: es5Tree,
    //   es6Ast: es6Tree,
    //   sourceMap: options.sourceMap
    // };
  };

  function requireCompile(filename) {
    var original = fs.readFileSync(filename, "utf-8");

    try {
      var result = Traceurified.compile(filename, original, true);
    } catch (e) {
      console.log("Traceurified encountered an error processing " + filename);
      throw e;
    }

    var source = result.source;

    Traceurified.sourceMaps[filename] = new SourceMapConsumer(result.sourceMap);

    Traceurified.postProcessors.forEach(function(postProcessor) {
      var res = postProcessor(filename);
      if (res) {
        source = res;
      }
    });

    return source;
  }

  if (!filter) {
    filters = [];
  } else {
    filters.push(filter);
  }

  Module._extensions[".js"] = function(module, filename) {
    if (shouldCompile(filename)) {
      var source = requireCompile(filename);
      return module._compile(source, filename);
    }
    return originalRequireJs(module, filename);
  };

  return Traceurified;
}

Traceurified.traceur = traceur;
Traceurified.sourceMaps = {};
Traceurified.ast = {};
Traceurified.processedAst = {};
Traceurified.es6Transformers = [];
Traceurified.es5Transformers = [];
Traceurified.postProcessors = [];

module.exports = Traceurified;