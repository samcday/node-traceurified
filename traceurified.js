"use strict";

var path = require("path");

var defaultExtension = /\.es6\.js$/;
var defaultHookFilter = function(baseDir) {
  // Default hook filter matches all "*.es6.js" files in the base dir and below.
  // Ignore everything under node_modules in the base directory, though.
  var nodeModulesDir = path.resolve(path.dirname(baseDir), "node_modules");

  return function(filename) {
    return filename.indexOf(nodeModulesDir) === -1 && defaultExtension.test(filename);
  };
};

// Outstanding questions:
//  * How will source mapping the stack traces work in a sandbox? Must investigate.

exports.entrypoint = function(module, filename) {
  // Check if a .traceurified-dist file exists in same dir as given module.
  // If so, skip compilation step.
  // Take output (compiled on the fly or statically compiled) and push it into a sandbox.
};

// TODO: support a json file for setting traceur options.
exports.hook = function(filterFn, traceurOptions) {
  // Hook may only be called once in a Node.js instance.
  if (global.__traceurifiedHooked) {
    throw new Error("You can only use Traceurified.hook() once!");
  }

  // Patch require, files that match given filter function will be compiled with Traceur on the fly.
  var baseDir = path.dirname(module.parent.filename);

  if (!filterFn) {
    require("module")._extensions[".es6.js"] = require("module")._extensions[".js"];
    filterFn = defaultHookFilter(baseDir);
  }

  // Load the hook.
  require("./hook")(filterFn, traceurOptions);

  global.__traceurifiedHooked = true;
};
