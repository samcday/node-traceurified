import { setupCoverageTest } from "./common";

var code = `class Foo {}`;

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
                    "column": 15,
                    "source": "file.js"
                }
            },
            "2": {  // foo()
                "start": {
                    "line": 1,
                    "column": 8,
                    "source": "file.js"
                },
                "end": {
                    "line": 1,
                    "column": 13,
                    "source": "file.js"
                }
            }
        },
        "branchMap": {}
    }
}

describe.only("Basic class", setupCoverageTest.bind(null, code, expectedCoverage, true));
