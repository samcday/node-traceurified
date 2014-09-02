"use strict";

var vm = require("vm");
var fs = require("fs");
var Module = require("module");

var traceur = require("traceur");
var chain = require("stack-chain");
var escodegen = require("escodegen");
var sourcemap = require("source-map");

var SourceMapConsumer = sourcemap.SourceMapConsumer;
var TreeWriter = traceur.outputgeneration.TreeWriter;

function Traceurified(filter) {
  // TODO: make options configurable.
  traceur.options.annotations = true;
  traceur.options.asyncFunctions = true;
  traceur.options.modules = "commonjs";

  var filters = [];

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