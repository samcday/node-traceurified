import { setupCoverageTest } from "./common";

var code = `async function foo() {
  console.log("Generator.");
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
                        "column": 21
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
            "2": {  // console.log("Generator");
                "start": {
                    "line": 2,
                    "column": 2,
                    "source": "file.js"
                },
                "end": {
                    "line": 2,
                    "column": 28,
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
        "branchMap": {}
    }
}

describe("Basic async", setupCoverageTest.bind(null, code, expectedCoverage));
