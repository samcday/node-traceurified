// TODO: do we want to track computed property name assignements as an 
// individual statement? Can't think of why this would be useful.

import { setupCoverageTest } from "./common";

var code = `var foo = "foo";
var object = { [foo]: "bar" };`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1,
            "2": 1
        },
        "b": {},
        "f": {
        },
        "fnMap": {
        },
        "statementMap": {
          "1": {
            "start": {
              "line": 1,
              "column": 4,
              "source": "file.js"
            },
            "end": {
              "line": 1,
              "column": 15,
              "source": "file.js"
            }
          },
          "2": {
            "start": {
              "line": 2,
              "column": 4,
              "source": "file.js"
            },
            "end": {
              "line": 2,
              "column": 29,
              "source": "file.js"
            }
          }
        },
        "branchMap": {}
    }
}

describe("Computed property name", setupCoverageTest.bind(null, code, expectedCoverage));
