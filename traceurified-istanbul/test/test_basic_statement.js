import { setupCoverageTest } from "./common";

var code = `console.log("foo");`;
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
          "column": 0,
          "source": "file.js"
        },
        "end": {
          "line": 1,
          "column": 19,
          "source": "file.js"
        }
      }
    },
    "branchMap": {}
  }
};

describe("Basic statement", setupCoverageTest.bind(null, code, expectedCoverage));
