import { setupCoverageTest } from "./common";

var code = `function *foo() {
  process.cwd();
}
foo().next();`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1,
            "2": 1,
            "3": 1
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
                        "column": 16
                    }
                }
            }
        },
        "statementMap": {
            "1": {  // generator function expression
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
                    "column": 13,
                    "source": "file.js"
                }
            }
        },
        "branchMap": {}
    }
}

describe("Basic generator", setupCoverageTest.bind(null, code, expectedCoverage));
