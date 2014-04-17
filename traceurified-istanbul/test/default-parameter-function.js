import { setupCoverageTest } from "./common";

var code = `function def() {
  return 123;
}

function foo(val = def()) {
  process.cwd();
}
foo();`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1,
            "2": 1,
            "3": 1,
            "4": 1,
            "5": 1
        },
        "b": {
            "1": [
                0, 1
            ]
        },
        "f": {
            "1": 1,
            "2": 1
        },
        "fnMap": {
            "1": {
                "name": "def",
                "line": 1,
                "loc": {
                    "start": {
                        "line": 1,
                        "column": 0,
                        "source": "file.js"
                    },
                    "end": {
                        "line": 1,
                        "column": 15
                    }
                }
            },
            "2": {
                "name": "foo",
                "line": 5,
                "loc": {
                    "start": {
                        "line": 5,
                        "column": 0,
                        "source": "file.js"
                    },
                    "end": {
                        "line": 5,
                        "column": 26
                    }
                }
            }
        },
        "statementMap": {
            "1": {  // def() function expression
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
            "2": {  // return 123;
                "start": {
                    "line": 2,
                    "column": 2,
                    "source": "file.js"
                },
                "end": {
                    "line": 2,
                    "column": 13,
                    "source": "file.js"
                }
            },
            "3": {  // foo() function expression
                "start": {
                    "line": 5,
                    "column": 0,
                    "source": "file.js"
                },
                "end": {
                    "line": 7,
                    "column": 1,
                    "source": "file.js"
                }
            },
            "4": {  // process.cwd();
                "start": {
                    "line": 6,
                    "column": 2,
                    "source": "file.js"
                },
                "end": {
                    "line": 6,
                    "column": 16,
                    "source": "file.js"
                }
            },
            "5": {  // foo();
                "start": {
                    "line": 8,
                    "column": 0,
                    "source": "file.js"
                },
                "end": {
                    "line": 8,
                    "column": 6,
                    "source": "file.js"
                }
            }
        },
        "branchMap": {
            "1": {
                "line": 5,
                "locations": [
                  {
                    "end": {
                      "column": 18,
                      "line": 5,
                      "source": "file.js"
                    },
                    "start": {
                      "column": 19,
                      "line": 5,
                      "source": "file.js"
                    }
                  },
                  {
                    "end": {
                      "column": 24,
                      "line": 5,
                      "source": "file.js"
                    },
                    "start": {
                      "column": 19,
                      "line": 5,
                      "source": "file.js"
                    }
                  }
                ],
                "type": "cond-expr"
            }
        }
    }
}

describe("Default parameter with default function expression", setupCoverageTest.bind(null, code, expectedCoverage));
