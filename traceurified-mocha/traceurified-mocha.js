var modulesDir = require("path").join(process.cwd(), "node_modules");

var traceurified = require("traceurified")(function(file) {
  // TODO: this needs to be configurable somehow.
  return !file.startsWith(modulesDir) || file.startsWith(modulesDir + "/di");
});

if (process.env.npm_config_coverage) {
  var istanbul = require("istanbul");
  var MozillaParseTreeTransformer = require("./MozillaParseTreeTransformer");

  

  var instrumenter = new istanbul.Instrumenter();
  // var store = istanbul.Store.create("memory");

  process.on("exit", function() {
    // console.log(global.__coverage__);
    // translateCoverage(global.__coverage__);

    // console.log(JSON.stringify(global.__coverage__["/Users/samday/src/confstats-connect/lib/cacher.js"], undefined, 2));

    // var collector = new istanbul.Collector();
    // collector.add(global.__coverage__);
    // var report = istanbul.Report.create("html", {
    //     dir: __dirname + "/reports",
    //     // sourceStore: store
    // });
    // report.writeReport(collector, true);
  })
}
