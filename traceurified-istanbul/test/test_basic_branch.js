import { setupCoverageTest } from "./common";

var code = `if(true) console.log("true"); else console.log("false");`;
var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
            "1": 1,
            "2": 1,
            "3": 0
        },
        "b": {
            "1": [1, 0]
        },
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
                    "column": 56,
                    "source": "file.js"
                }
            },
            "2": {
                "start": {
                    "line": 1,
                    "column": 9,
                    "source": "file.js"
                },
                "end": {
                    "line": 1,
                    "column": 29,
                    "source": "file.js"
                }
            },
            "3": {
                "start": {
                    "line": 1,
                    "column": 35,
                    "source": "file.js"
                },
                "end": {
                    "line": 1,
                    "column": 56,
                    "source": "file.js"
                }
            }
        },
        "branchMap": {
            "1": {
                "line": 1,
                "type": "if",
                "locations": [{
                    "start": {
                        "line": 1,
                        "column": 0
                    },
                    "end": {
                        "line": 1,
                        "column": 0
                    }
                }, {
                    "start": {
                        "line": 1,
                        "column": 0
                    },
                    "end": {
                        "line": 1,
                        "column": 0
                    }
                }]
            }
        }
    }
};

describe("Basic branch", setupCoverageTest.bind(null, code, expectedCoverage));
