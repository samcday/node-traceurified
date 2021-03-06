// TODO: class support isn't great yet.

import { setupCoverageTest } from "./common";

var code = `class Foo {}`;

var expectedCoverage = {
    "file.js": {
        "path": "file.js",
        "s": {
        },
        "b": {},
        "f": {
            "1": 0
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
            }
        },
        "statementMap": {
        },
        "branchMap": {}
    }
}

describe("Basic class", setupCoverageTest.bind(null, code, expectedCoverage));
