"use strict";

// Outstanding questions:
//  * How will source mapping the stack traces work in a sandbox? Must investigate.

exports.entrypoint = function(module, filename) {
  // Check if a .traceurified-dist file exists in same dir as given module.
  // If so, skip compilation step.
  // Take output (compiled on the fly or statically compiled) and push it into a sandbox.
};

exports.hook = function(filterFn) {
  // Patch require, files that match given filter function will be compiled with Traceur on the fly.
};
