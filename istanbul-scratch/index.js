var istanbul = require("istanbul");
var traceur = require("traceur");
var fs = require("fs");

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
        var tree = parser.parseModule();
        var reporter = new ErrorReporter();
        var transformer = new FromOptionsTransformer(reporter);
        tree = transformer.transform(tree);
        if (reporter.hadError())
        throw new Error("Error transforming " + filename);

        var sourceMapGenerator = new traceur.outputgeneration.SourceMapGenerator({ file: filename });
        var options = { sourceMapGenerator: sourceMapGenerator };
        var src = TreeWriter.write(tree, options);
        var sourceMap = new SourceMapConsumer(options.sourceMap);
        return {original: contents, code: src, map: sourceMap, ast: tree};
    }

var compiled = compile("es6.js");

function translateLoc(map, loc) {
    var startPos = map.originalPositionFor({line: loc.start.line, column: loc.start.column});
    loc.start.line = startPos.line;
    loc.start.column = startPos.column;
    var endPos = map.originalPositionFor({line: loc.end.line, column: loc.end.column});
    loc.end.line = endPos.line;
    loc.end.column = endPos.column;
}

function translateCoverage(covFile) {
    Object.keys(covFile.fnMap).forEach(function(id) {
        var fnMap = covFile.fnMap[id];
        var pos = compiled.map.originalPositionFor({line: fnMap.loc.start.line, column: fnMap.loc.start.column});
        if (pos.source !== "es6.js") {
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
        if (pos.source !== "es6.js") {
            delete covFile.statementMap[id];
            delete covFile.s[id];
        }
        translateLoc(compiled.map, statement);
    });

    Object.keys(covFile.branchMap).forEach(function(id) {
        var branch = covFile.branchMap[id];

        var keep = branch.locations.every(function(loc) {
            var pos = compiled.map.originalPositionFor({line: loc.start.line, column: loc.start.column});
            if (pos.source !== "es6.js") {
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
// console.log(compiled.map);
// var c = 0;
// compiled.map.eachMapping(function() {
//     c++;
// });
// console.log(c);

// console.log(compiled.map.originalPositionFor({line: 14, column: 16}));
// return;

var instrumenter = new istanbul.Instrumenter();

var instrumentedCode = instrumenter.instrumentSync(compiled.code, "es6.js");

eval(instrumentedCode);
eval(instrumenter.instrumentSync(fs.readFileSync("vanilla.js", "utf8"), "vanilla.js"));


setTimeout(function() {
    var store = istanbul.Store.create("memory");

    store.set("es6.js", compiled.code);

    translateCoverage(global.__coverage__["es6.js"]);
    store.set("es6.js", compiled.original);
    store.set("vanilla.js", fs.readFileSync("vanilla.js", "utf8"));

    console.log(JSON.stringify(global.__coverage__["es6.js"], undefined, 2));

    var collector = new istanbul.Collector();
    collector.add(global.__coverage__);
    var report = istanbul.Report.create("html", {
        dir: __dirname,
        sourceStore: store
    });
    report.writeReport(collector, true);
}, 100);