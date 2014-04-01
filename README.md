# traceurified

Easily use Google's awesome-sauce [traceur-compiler](https://github.com/google/traceur-compiler) in your Node projects.

*bootstrap.js*
```
require("traceurify")(function() {
    return true; 
});

var app = require("./app");
app.go()
```

*app.js*
```
import {omggenerators} from "./lib";

export var go = function() {
    return omggenerators().next();
};
```

*lib.js*
```
export var omggenerators = function*() {
    yield 123;
}
```

This library will:

 * Patch your require() to compile your JS using Traceur on the fly.
 * Patch your Error stacks to be source-mapped and free of Traceur eval() frames.

The second point is the primary utility of this library.

## Installation

```
npm install traceurified
```

## API

```
require("traceurify")(function(file) {
    return true; 
});
```

The main (and only) API for this library. The function passed in is used as a filter to determine if the given `file` path should be compiled using Traceur, or intepreted as vanilla ES5.
