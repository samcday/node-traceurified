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
            "3": 1,
            "4": 1
        },
        "b": {},
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
            "2": {  // default val = 123 initialisation
                "start": {
                    "line": 1,
                    "column": 12,
                    "source": "file.js"
                },
                "end": {
                    "line": 1,
                    "column": 21,
                    "source": "file.js"
                }
            },
            "3": {  // process.cwd();
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
            "4": {  // foo().next();
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
        "branchMap": {}
    }
}

describe.only("Default parameter", setupCoverageTest.bind(null, code, expectedCoverage, true));
