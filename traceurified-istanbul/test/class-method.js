// TODO: class support isn't great yet.

import { setupCoverageTest } from "./common";

var code = `class Foo {
  bar() {
    123;
  }
}`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 0
        },
        "b": {},
        "f": {
            "1": 0,
            "2": 0
        },
        "fnMap": {
            "1": {
                "name": "Foo",
                "line": 1,
                "loc": {
                    "start": {
                        "line": 1,
                        "column": 0,
                        "source": "file.js"
                    },
                    "end": {
                        "line": 1,
                        "column": 0
                    }
                }
            },
            "2": {
                "name": "(anonymous_2)",
                "line": 2,
                "loc": {
                    "start": {
                        "line": 2,
                        "column": 2,
                        "source": "file.js"
                    },
                    "end": {
                        "line": 2,
                        "column": 8
                    }
                }
            }
        },
        "statementMap": {
          "1": {
            "start": {
              "line": 3,
              "column": 4,
              "source": "file.js"
            },
            "end": {
              "line": 3,
              "column": 8,
              "source": "file.js"
            }
          }
        },
        "branchMap": {}
    }
}

describe("Basic class", setupCoverageTest.bind(null, code, expectedCoverage));
