import { setupCoverageTest } from "./common";

var code = `[for (x of [0, 1, 2]) x]`;
var expectedCoverage = {
  "file.js": {
    "path": "file.js",
    "s": {
      "1": 1,
      "2": 3
    },
    "b": {},
    "f": {},
    "fnMap": {},
    "statementMap": {
      "1": {
        "start": {
          "line": 1,
          "column": 0,
          "source": "file.js"
        },
        "end": {
          "line": 1,
          "column": 24,
          "source": "file.js"
        }
      },
      "2": {
        "start": {
          "line": 1,
          "column": 22,
          "source": "file.js"
        },
        "end": {
          "line": 1,
          "column": 23,
          "source": "file.js"
        }
      }
    },
    "branchMap": {}
  }
};

describe("Array comprehension", setupCoverageTest.bind(null, code, expectedCoverage));
