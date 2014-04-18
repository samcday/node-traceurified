import { setupCoverageTest } from "./common";

var code = `() => 123;`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1,
            "2": 0
        },
        "b": {},
        "f": {
            "1": 0
        },
        "fnMap": {
            "1": {
                "name": "(anonymous_1)",
                "line": 1,
                "loc": {
                    "start": {
                        "line": 1,
                        "column": 0,
                        "source": "file.js"
                    },
                    "end": {
                        "line": 1,
                        "column": 6
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
                    "line": 1,
                    "column": 10,
                    "source": "file.js"
                }
            },
            "2": {  // 123 expression
                "start": {
                    "line": 1,
                    "column": 6,
                    "source": "file.js"
                },
                "end": {
                    "line": 1,
                    "column": 9,
                    "source": "file.js"
                }
            }
        },
        "branchMap": {}
    }
}

describe("Basic arrow fn", setupCoverageTest.bind(null, code, expectedCoverage));
