var istanbul = require("istanbul");
var traceur = require("traceur");
var fs = require("fs");
var util = require("util");

    var ErrorReporter = traceur.util.ErrorReporter;
    var FromOptionsTransformer = traceur.codegeneration.FromOptionsTransformer;
    var Parser = traceur.syntax.Parser;
    var SourceFile = traceur.syntax.SourceFile;
    var TreeWriter = traceur.outputgeneration.TreeWriter;
    var SourceMapConsumer = require('source-map').SourceMapConsumer;

 function compile(filename) {
        traceur.options.modules = "commonjs";
        traceur.options.experimental =  true;
        var contents = fs.readFileSync(filename, "utf-8");
        var sourceFile = new SourceFile(filename, contents);
        var parser = new Parser(sourceFile);
        var srcTree = parser.parseModule();
        var reporter = new ErrorReporter();
        var transformer = new FromOptionsTransformer(reporter);
        var tree = transformer.transform(srcTree);
        // console.log(srcTree.scriptItemList[0])
        // console.log(util.inspect(tree,{depth:10}));
        // console.log(JSON.stringify(srcTree,null,2));
        // console.log(JSON.stringify(tree,null,2));
        // console.log(tree.scriptItemList[1].expression.expression)
        // process.exit();
        if (reporter.hadError())
        throw new Error("Error transforming " + filename);

        var sourceMapGenerator = new traceur.outputgeneration.SourceMapGenerator({ file: filename });
        var options = { sourceMapGenerator: sourceMapGenerator };
        var src = TreeWriter.write(tree, options);
        var sourceMap = new SourceMapConsumer(options.sourceMap);
        // sourceMap.eachMapping(function(mapping) {
        //     console.log(mapping);
        // }, null, SourceMapConsumer.ORIGINAL_ORDER);
        // process.exit();
        // console.log(options.sourceMap);
        // process.exit();
        return {original: contents, code: src, map: sourceMap, ast: tree};
    }

var compiled = compile("./es6.js");
var byLine = compiled.code.split("\n");
var originalByLine = compiled.original.split("\n");

function translateLoc(map, loc) {
    var startPos = map.originalPositionFor({line: loc.start.line, column: loc.start.column});
    loc.start.line = startPos.line;
    loc.start.column = startPos.column;
    var endPos = map.originalPositionFor({line: loc.end.line, column: loc.end.column});
    if (endPos.source !== "./es6.js") {
        console.warn("PANIC! " + JSON.stringify(loc.end) + " doesn't match. " + JSON.stringify(endPos));
    }
    loc.end.line = endPos.line;
    loc.end.column = endPos.column;
}

function translateCoverage(covFile) {
    Object.keys(covFile.fnMap).forEach(function(id) {
        var fnMap = covFile.fnMap[id];
        var pos = compiled.map.originalPositionFor({line: fnMap.loc.start.line, column: fnMap.loc.start.column});
        if (pos.source !== "./es6.js") {
            delete covFile.fnMap[id];
            delete covFile.f[id];
            return;
        }
        translateLoc(compiled.map, fnMap.loc);
        fnMap.line = fnMap.loc.start.line;
    });

    Object.keys(covFile.statementMap).forEach(function(id) {
        var statement = covFile.statementMap[id];
        var pos = compiled.map.originalPositionFor({line: statement.start.line, column: statement.start.column});

        var startColDelta = 0;

        if (pos.source !== "./es6.js") {
            var line = byLine[statement.start.line-1];
            if (line.substring(statement.start.column).startsWith("return")) {
                statement.start.column += "return".length;
                pos = compiled.map.originalPositionFor({line: statement.start.line, column: statement.start.column});
            }
            else if (line.substring(statement.start.column).startsWith("(function")) {
                statement.start.column++;
                pos = compiled.map.originalPositionFor({line: statement.start.line, column: statement.start.column});
            }
        }

        if (pos.source !== "./es6.js") {
            // console.log("Nope.", statement.start, "'" + byLine[statement.start.line-1].substring(statement.start.column) + "'");
            // Scan to the end of the line, or the end of the current statement
            // and try to find the original source mapping.
            // var tryColumn = statement.start.column;
            // var endCol = (statement.start.line === statement.end.line) ? statement.end.column : 2 >> 32;
            // // console.log("FUCK.", endCol);
            // endCol = Math.min(endCol, byLine[statement.start.line-1].length);
            // // console.log(statement.start.line, byLine[statement.start.line-1], endCol);
            // var foundAlt = false;
            // while (tryColumn < endCol) {
            //     tryColumn++;
            //     pos = compiled.map.originalPositionFor({line: statement.start.line, column: tryColumn});
            //     if (pos.source === "./es6.js") {
            //         // console.log("FOUND IT!", pos);
            //         // console.log(originalByLine[pos.line-1]);
            //         // console.log("'" +originalByLine[pos.line-1].substring(pos.column - 1- "yield".length, pos.column-1)+"'")
            //         if (originalByLine[pos.line-1].substring(pos.column - 1- "yield".length, pos.column-1) === "yield") {
            //             console.log("FOUND IT!", statement);
            //             console.log(compiled.map.originalPositionFor({line: statement.end.line, column: statement.end.column}));
            //             statement.start.column = tryColumn;
            //             foundAlt = true;
            //             startColDelta = "yield".length + 1;
            //             break;
            //         }
            //         if (originalByLine[pos.line-1].substring(pos.column - 1- "await".length, pos.column-1) === "await") {
            //             console.log("FOUND IT!", statement);
            //             console.log(compiled.map.originalPositionFor({line: statement.end.line, column: statement.end.column}));
            //             statement.start.column = tryColumn;
            //             foundAlt = true;
            //             startColDelta = "await".length + 1;
            //             break;
            //         }
            //         // break;
            //     }
            // }
            // if (!foundAlt) {
                delete covFile.statementMap[id];
                delete covFile.s[id];
                return;
            // }
        }

        console.log("'"+originalByLine[pos.line-1].substring(pos.column - "yield ".length, pos.column)+"'");
        if (originalByLine[pos.line-1].substring(pos.column - "yield ".length, pos.column) === "yield ") {
            startColDelta = -6;
        }

        translateLoc(compiled.map, statement);
        statement.start.column += startColDelta;
    });

    Object.keys(covFile.branchMap).forEach(function(id) {
        var branch = covFile.branchMap[id];

        var keep = branch.locations.every(function(loc) {
            var pos = compiled.map.originalPositionFor({line: loc.start.line, column: loc.start.column});
            if (pos.source !== "./es6.js") {
                return false;
            }
            translateLoc(compiled.map, loc);
            return true;
        });

        if (!keep) {
            delete covFile.branchMap[id];
            delete covFile.b[id];
            return;
        }

        branch.line = branch.locations[0].start.line;
    });
}

// console.log(compiled.code);
// console.log(compiled.original);
// var c = 0;
// compiled.map.eachMapping(function() {
//     c++;
// });
// console.log(c);

console.log(compiled.map.originalPositionFor({line: 2, column: 1}));
// console.log(compiled.map.generatedPositionFor({line: 1, column: 6, source: "./es6.js"}));
// return;

var instrumenter = new istanbul.Instrumenter();

var instrumentedCode = instrumenter.instrumentSync(compiled.code, "./es6.js");

eval(instrumentedCode);
eval(instrumenter.instrumentSync(compiled.code, "./es6-compiled.js"));
// eval(instrumenter.instrumentSync(fs.readFileSync("vanilla.js", "utf8"), "vanilla.js"));


setTimeout(function() {
    var store = istanbul.Store.create("memory");

    store.set("./es6-compiled.js", compiled.code);

    translateCoverage(global.__coverage__["./es6.js"]);
    store.set("./es6.js", compiled.original);
    store.set("vanilla.js", fs.readFileSync("vanilla.js", "utf8"));

    // console.log(JSON.stringify(global.__coverage__["./es6-compiled.js"], undefined, 2));
    // console.log(JSON.stringify(global.__coverage__["./es6.js"], undefined, 2));

    var collector = new istanbul.Collector();
    collector.add(global.__coverage__);
    var report = istanbul.Report.create("html", {
        dir: __dirname + "/reports",
        sourceStore: store
    });
    report.writeReport(collector, true);
}, 100);
