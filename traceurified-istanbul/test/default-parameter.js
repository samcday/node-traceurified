import { setupCoverageTest } from "./common";

var code = `function foo(val = 123) {
  process.cwd();
}
foo();`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1,
            "2": 1,
            "3": 1
        },
        "b": {
            "1": [
                0, 1
            ]
        },
        "f": {
            "1": 1
        },
        "fnMap": {
            "1": {
                "name": "foo",
                "line": 1,
                "loc": {
                    "start": {
                        "line": 1,
                        "column": 0,
                        "source": "file.js"
                    },
                    "end": {
                        "line": 1,
                        "column": 24
                    }
                }
            }
        },
        "statementMap": {
            "1": {  // function expression
                "start": {
                    "line": 1,
                    "column": 0,
                    "source": "file.js"
                },
                "end": {
                    "line": 3,
                    "column": 1,
                    "source": "file.js"
                }
            },
            "2": {  // process.cwd();
                "start": {
                    "line": 2,
                    "column": 2,
                    "source": "file.js"
                },
                "end": {
                    "line": 2,
                    "column": 16,
                    "source": "file.js"
                }
            },
            "3": {  // foo().next();
                "start": {
                    "line": 4,
                    "column": 0,
                    "source": "file.js"
                },
                "end": {
                    "line": 4,
                    "column": 6,
                    "source": "file.js"
                }
            }
        },
        "branchMap": {
            "1": {
                "line": 1,
                "locations": [
                  {
                    "end": {
                      "column": 18,
                      "line": 1,
                      "source": "file.js"
                    },
                    "start": {
                      "column": 19,
                      "line": 1,
                      "source": "file.js"
                    }
                  },
                  {
                    "end": {
                      "column": 22,
                      "line": 1,
                      "source": "file.js"
                    },
                    "start": {
                      "column": 19,
                      "line": 1,
                      "source": "file.js"
                    }
                  }
                ],
                "type": "cond-expr"
            }
        }
    }
}

describe.only("Default parameter", setupCoverageTest.bind(null, code, expectedCoverage, true));
