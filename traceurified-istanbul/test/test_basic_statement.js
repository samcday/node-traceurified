import { expect } from "chai";

import { Instrumenter } from "istanbul";
import { compile } from "traceurified";
import { prepareAst } from "../traceurified-istanbul";

var code = `console.log("foo");`;
var expectedCoverage = {
  "file.js": {
    "path": "file.js",
    "s": {
      "1": 1
    },
    "b": {},
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
          "column": 19,
          "source": "file.js"
        }
      }
    },
    "branchMap": {}
  }
};

describe("Basic statement", function() {
  it("should report coverage correctly", function()  {
    var result = compile("file.js", code);
    var ast = prepareAst("file.js", result.es5Ast);

    var instrumenter = new Instrumenter({coverageVariable: "traceurifiedIstanbulCov", noAutoWrap: true});
    var instrumented = instrumenter.instrumentASTSync(ast, "file.js", code);

    eval(instrumented);

    expect(global.traceurifiedIstanbulCov).to.deep.equal(expectedCoverage);
  })
})
