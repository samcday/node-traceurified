"use strict";
var fn = (function() {
  return console.log();
});
function foo() {
  return $traceurRuntime.generatorWrap(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          console.log("Hi.");
          true ? console.log("Hi.") : console.log("nuuu.");
          $ctx.state = 14;
          break;
        case 14:
          $ctx.state = 2;
          return true ? fn() : console.log("nuuu.");
        case 2:
          $ctx.maybeThrow();
          $ctx.state = 4;
          break;
        case 4:
          $ctx.state = 6;
          return 123;
        case 6:
          $ctx.maybeThrow();
          $ctx.state = 8;
          break;
        case 8:
          console.log("Hi. 2");
          $ctx.state = 16;
          break;
        case 16:
          $ctx.state = 10;
          return true ? fn() : null;
        case 10:
          $ctx.maybeThrow();
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, this);
}
var async = function() {
  var prom;
  return $traceurRuntime.asyncWrap(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          prom = new Promise((function(resolve) {
            return resolve();
          }));
          $ctx.state = 6;
          break;
        case 6:
          (prom).then($ctx.createCallback(-2), $ctx.createErrback(3));
          return;
        case 3:
          throw $ctx.err;
          $ctx.state = -2;
          break;
        default:
          return $ctx.end();
      }
  }, this);
};
async();
foo().next();
if (true) {
  true ? console.log("Hi.") : null;
} else {
  console.log("nuuu.");
}