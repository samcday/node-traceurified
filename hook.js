"use strict";

var fs = require("fs");
var sourcemap = require("source-map");

var sandboxedTraceur = require("./traceur-sandbox");
var MozillaParseTreeTransformer = require("traceur-mozilla-ast").MozillaParseTreeTransformer;

// function requireCompile(filename) {
//   var source = result.source;

//   Traceurified.rawSourceMaps[filename] = result.sourceMap;
//   Traceurified.sourceMaps[filename] = new SourceMapConsumer(result.sourceMap);

//   Traceurified.postProcessors.forEach(function(postProcessor) {
//     var res = postProcessor(filename);
//     if (res) {
//       source = res;
//     }
//   });

//   return source;
// }

// Traceurified.compile = function(filename, content, runProcessors) {
//     // TODO: do we need to save off the es6/es5 trees?
//   // Traceurified.ast[filename] = result.es6Ast;
//   // Traceurified.processedAst[filename] = result.es5Ast;

//   // return Traceurified.generateEs5Source(filename, es5Tree);
//   // var result = Traceurified.generateEs5Source(filename, es5Tree);
//   // var sourceMap = result.sourceMap;
//   // var src = result.source;

//   // return {
//   //   code: src,
//   //   es5Ast: es5Tree,
//   //   es6Ast: es6Tree,
//   //   sourceMap: options.sourceMap
//   // };
// };

function compileWithTraceur(module, filename, options) {
  var start = Date.now();

  var originalSource = fs.readFileSync(filename, "utf-8");

  try {
    // Reset the traceur options and override with user provided.
    var traceur = sandboxedTraceur.get();
    traceur.options.reset();
    traceur.options.setFromObject(options);

    // First, we parse the source as ES6.
    var es6Tree = sandboxedTraceur.parse(filename, originalSource);

    // TODO:
    // if (runProcessors) {
    //   Traceurified.es6Transformers.forEach(function(transformer) {
    //     var res = transformer(filename, es6Tree);
    //     if (res) {
    //       es6Tree = res;
    //     }
    //   });
    // }

    // Next, we transform this ES6 tree into ES5 code.
    var es5Tree = sandboxedTraceur.transformToES5(filename, es6Tree);

    var sourceMapGenerator = new traceur.outputgeneration.SourceMapGenerator({ file: filename });
    var outputCode = traceur.outputgeneration.TreeWriter.write(es5Tree, {
      sourceMapGenerator: sourceMapGenerator
    });

    var sourceMap = new sourcemap.SourceMapConsumer(sourceMapGenerator.toJSON());

    return [outputCode, sourceMap];

    // Now we convert the transformed ES5 tree from Traceur AST format to Spidermonkey AST.
    // var mozillaAst = new MozillaParseTreeTransformer().transformAny(es5Tree);

    // TODO:
    // if (runProcessors) {
    //   Traceurified.es5Transformers.forEach(function(transformer) {
    //     var res = transformer(filename, mozillaAst);
    //     if (res) {
    //       mozillaAst = res;
    //     }
    //   });
    // }

    // Now we generate source code from the Spidermonkey tree.
    // var result = escodegen.generate(mozillaAst, {
    //   sourceMap: filename,
    //   sourceMapWithCode: true
    // });

    // return {
    //   sourceMap: JSON.stringify(result.map),
    //   source: result.code
    // };
  } catch(e) {
    // TODO:
    throw e;
  }

  // try {
  //   // Attempt to resolve this request from cache.
  //   // if (isDebug) {
  //   //   var cached = getCompileCache(filename);
  //   //   if (cached) {
  //   //     Traceurified._totalCompileTime += Date.now() - start;
  //   //     return module._compile(cached, filename);
  //   //   }
  //   // }

  //   var source = requireCompile(filename);
  //   Traceurified._totalCompileTime += Date.now() - start;
  //   if (isDebug) {
  //     saveCompileCache(filename, source);
  //   }

  //   return runInSandbox(source, filename, module);
  // } finally {
  // }
}

module.exports = function(filterFn, traceurOptions) {
  var originalRequireJs = require("module")._extensions[".js"];

  require("module")._extensions[".js"] = function(module, filename) {
    if (filterFn(filename)) {
      var result = compileWithTraceur(module, filename, traceurOptions);
      console.log(result);
    }
    return originalRequireJs(module, filename);
  };
};
