"use strict";

function Traceurified(filter) {
  var chain = require("stack-chain");
  var traceur = require("traceur");
  var sourcemap = require("source-map");
  var fs = require("fs");
  var Module = require("module");

  var SourceMapConsumer = sourcemap.SourceMapConsumer;
  var SourceMapGenerator = sourcemap.SourceMapGenerator;
  var ErrorReporter = traceur.util.ErrorReporter;
  var FromOptionsTransformer = traceur.codegeneration.FromOptionsTransformer;
  var Parser = traceur.syntax.Parser;
  var SourceFile = traceur.syntax.SourceFile;
  var TreeWriter = traceur.outputgeneration.TreeWriter;

  Traceurified.traceur = traceur;
  Traceurified.sourceMaps = {};
  Traceurified.ast = {};
  Traceurified.processedAst = {};
  Traceurified.postProcessors = [];

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

  Traceurified.compile = function(filename, content) {
    var sourceFile = new SourceFile(filename, content);
    var parser = new Parser(sourceFile);
    var es6Tree = parser.parseModule();
    var reporter = new ErrorReporter();
    var transformer = new FromOptionsTransformer(reporter);
    var es5Tree = transformer.transform(es6Tree);
    if (reporter.hadError())
      throw new Error("Error transforming " + filename);
    var sourceMapGenerator = new SourceMapGenerator({ file: filename });
    var options = { sourceMapGenerator: sourceMapGenerator };
    var src = TreeWriter.write(es5Tree, options);

    return {
      code: src,
      es5Ast: es5Tree,
      es6Ast: es6Tree,
      sourceMap: options.sourceMap
    };
  };

  function requireCompile(filename) {
    var original = fs.readFileSync(filename, "utf-8");

    var result = Traceurified.compile(filename, original);
    var src = result.code;
    
    Traceurified.ast[filename] = result.es6Ast;
    Traceurified.processedAst[filename] = result.es5Ast;
    Traceurified.sourceMaps[filename] = new SourceMapConsumer(result.sourceMap);

    Traceurified.postProcessors.forEach(function(postFn) {
      var res = postFn(filename, original);
      if (res) {
        src = res;
      }
    });

    return src;
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

module.exports = Traceurified;