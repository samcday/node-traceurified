// TODO: do we want to track computed property name assignements as an 
// individual statement? Can't think of why this would be useful.

import { setupCoverageTest } from "./common";

var code = `var [foo, bar] = [123, 321];`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1
        },
        "b": {},
        "f": {},
        "fnMap": {},
        "statementMap": {
          "1": {
            "start": {
              "line": 1,
              "column": 4,
              "source": "file.js"
            },
            "end": {
              "line": 1,
              "column": 44,
              "source": "file.js"
            }
          }
        },
        "branchMap": {}
    }
}

describe.only("Computed property name", setupCoverageTest.bind(null, code, expectedCoverage, true));
