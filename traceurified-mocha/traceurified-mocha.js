var path = require("path");

var baseDir = process.cwd();
var modulesDir = path.join(baseDir, "node_modules");

var traceurified = require("traceurified")(function(file) {
  return file.startsWith(baseDir) && !file.startsWith(modulesDir);
  // TODO: this needs to be configurable somehow.
  return !file.startsWith(modulesDir) || file.startsWith(modulesDir + "/di");
});

