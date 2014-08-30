"use strict";

var vm = require("vm");
var fs = require("fs");
var Module = require("module");

var traceur = require("traceur");
var chain = require("stack-chain");
var escodegen = require("escodegen");
var sourcemap = require("source-map");
var MozillaParseTreeTransformer = require("traceur-mozilla-ast").MozillaParseTreeTransformer;

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

  function runInSandbox(source, filename, module) {
    // console.log(source);
    var ctx = vm.createContext({
      console: console,
      require: require,
      process: process,
      module: module,
      exports: module.exports,
    });
    vm.runInContext(fs.readFileSync(require.resolve("traceur/bin/traceur-runtime")), ctx);
    vm.runInContext(source, ctx, filename);
  }

  function requireCompile(filename) {
    var original = fs.readFileSync(filename, "utf-8");

    try {
      var result = Traceurified.compile(filename, original, true);
    } catch (e) {
      console.log("Traceurified encountered an error processing " + filename);
      throw e;
    }

    var source = result.source;

    Traceurified.rawSourceMaps[filename] = result.sourceMap;
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

  var isDebug = process.env.NODE_ENV !== "production",
      getCompileCache, saveCompileCache;

  if (isDebug) {
    var sha1 = require("sha1"),
        os = require("os"),
        path = require("path"),
        mkdirp = require("mkdirp").sync,
        tmpDir = path.join(os.tmpdir(), "traceurified-cache", sha1(module.parent.id));

    mkdirp(tmpDir);

    getCompileCache = function(filename) {
      var cachedPath = path.join(tmpDir, sha1(filename)),
          fileStat = fs.statSync(filename);

      var cachedStat;

      try {
        cachedStat = fs.statSync(cachedPath);
      } catch(err) {
        return;
      }

      if (fileStat.mtime <= cachedStat.mtime) {
        var cached = JSON.parse(fs.readFileSync(cachedPath, "utf8"));
        Traceurified.sourceMaps[filename] = new SourceMapConsumer(cached.map);
        return cached.source;
      }
    };

    saveCompileCache = function(filename, source) {
      fs.writeFileSync(path.join(tmpDir, sha1(filename)), JSON.stringify({
        source: source,
        map: Traceurified.rawSourceMaps[filename]
      }));
    };
  }

  Traceurified._totalCompileTime = 0;
  Module._extensions[".js"] = function(module, filename) {
    if (shouldCompile(filename)) {
      var start = Date.now();

      try {
        // Attempt to resolve this request from cache.
        // if (isDebug) {
        //   var cached = getCompileCache(filename);
        //   if (cached) {
        //     Traceurified._totalCompileTime += Date.now() - start;
        //     return module._compile(cached, filename);
        //   }
        // }

        var source = requireCompile(filename);
        Traceurified._totalCompileTime += Date.now() - start;
        if (isDebug) {
          saveCompileCache(filename, source);
        }

        return runInSandbox(source, filename, module);
      } finally {
      }
    }
    return originalRequireJs(module, filename);
  };

  return Traceurified;
}

Traceurified.traceur = traceur;
Traceurified.sourceMaps = {};
Traceurified.rawSourceMaps = {};
Traceurified.ast = {};
Traceurified.processedAst = {};
Traceurified.es6Transformers = [];
Traceurified.es5Transformers = [];
Traceurified.postProcessors = [];

module.exports = Traceurified;