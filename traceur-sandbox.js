// A simple require("traceur") brings in the traceur runtime. Ick!
// What we do here is load the traceur dist into a sandbox.

var vm = require("vm");
var fs = require("fs");

var sandbox = null; // Lazily initialised.

exports.get = function() {
  if (sandbox) {
    return sandbox.traceur;
  }

  var traceurCode = fs.readFileSync(require.resolve("traceur/bin/traceur.js"));
  vm.runInContext(traceurCode, sandbox);
  delete exports.traceur;
  exports.traceur = sandbox.traceur;
  return sandbox.traceur;
};
