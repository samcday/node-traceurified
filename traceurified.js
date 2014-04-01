"use strict";

module.exports = function(filter) {
    var chain = require("stack-chain");
    var traceur = require("traceur");
    var fs = require("fs");
    var Module = require("module");
    var SourceMapConsumer = require("source-map").SourceMapConsumer;

    var ErrorReporter = traceur.util.ErrorReporter;
    var FromOptionsTransformer = traceur.codegeneration.FromOptionsTransformer;
    var Parser = traceur.syntax.Parser;
    var SourceFile = traceur.syntax.SourceFile;
    var TreeWriter = traceur.outputgeneration.TreeWriter;

    var sourceMaps = {};
    var filters = [];
    var originalRequireJs = Module._extensions[".js"];

    // Rewrite callsites to:
    // * use source mapped positions, if available.
    // * filter out traceur eval frames.
    chain.filter.attach(function (error, frames) {
        return frames.filter(function (callSite) {
            if (callSite.isEval()) {
                if (callSite.getEvalOrigin().indexOf("src/node/traceur.js") > -1) {
                    return false;
                }
            }

            var filename = callSite.getFileName();
            if (!filename) {
                return true;
            }
            var sourceMap = sourceMaps[filename];
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

    function compile(filename) {
        traceur.options.modules = "commonjs";

        var contents = fs.readFileSync(filename, "utf-8");
        var sourceFile = new SourceFile(filename, contents);
        var parser = new Parser(sourceFile);
        var tree = parser.parseModule();
        var reporter = new ErrorReporter();
        var transformer = new FromOptionsTransformer(reporter);
        tree = transformer.transform(tree);
        if (reporter.hadError())
        throw new Error("Error transforming " + filename);

        var sourceMapGenerator = new traceur.outputgeneration.SourceMapGenerator({ file: filename });
        var options = { sourceMapGenerator: sourceMapGenerator };
        var src = TreeWriter.write(tree, options);
        sourceMaps[filename] = new SourceMapConsumer(options.sourceMap);
        return src;
    }

    if (!filter) {
        filters = [];
    } else {
        filters.push(filter);
    }

    Module._extensions[".js"] = function(module, filename) {
        if (shouldCompile(filename)) {
            var source = compile(filename);
            return module._compile(source, filename);
        }
        return originalRequireJs(module, filename);
    };
};
