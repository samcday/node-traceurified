import { setupCoverageTest } from "./common";

var code = `() => 123;`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1
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
                        "column": 9
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
                    "column": 9,
                    "source": "file.js"
                }
            }
        },
        "branchMap": {}
    }
}

describe.only("Basic arrow fn", setupCoverageTest.bind(null, code, expectedCoverage, true));
