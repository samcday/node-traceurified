var foo = function() {
  var promise,
      foo;
  return $traceurRuntime.asyncWrap(function($ctx) {
    while (true)
      switch ($ctx.state) {
        case 0:
          promise = Promise.resolve(123);
          foo = Promise.resolve(123);
          console.log("Sigh.");
          $ctx.state = 8;
          break;
        case 8:
          Promise.resolve(promise).then($ctx.createCallback(3), $ctx.errback);
          return;
        case 3:
          Promise.resolve(123).then($ctx.createCallback(-2), $ctx.errback);
          return;
        default:
          return $ctx.end();
      }
  }, this);
};
foo();

//# sourceMappingURL=es6.compiled.map
