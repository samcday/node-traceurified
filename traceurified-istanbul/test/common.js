import { expect } from "chai";

import { Instrumenter } from "istanbul";
import { parseES6, transformToES5 } from "traceurified";
import { es6Transformer, es5Transformer } from "../traceurified-istanbul";

export function setupCoverageTest(code, expectedCoverage, debug) {
  it("should report coverage correctly", () => {
    var es6Ast = parseES6("file.js", code);

    if (debug) {
      console.log("ES6 AST", JSON.stringify(es6Ast, null, 2));
    }

    es6Transformer("file.js", es6Ast);

    var coverageVar = `__traceurifiedIstanbulCov_${Date.now()}`
    var instrumenter = new Instrumenter({coverageVariable: coverageVar, noAutoWrap: true, debug: debug, walkDebug: debug});
    instrumenter.traceurifiedInstrumented = [];

    var es5Ast = transformToES5("file.js", es6Ast);
    es5Transformer(instrumenter, "file.js", es5Ast);

    if (debug) {
      console.log(JSON.stringify(es5Ast, null, 2));
      console.log(require("escodegen").generate(es5Ast));
    }

    eval(instrumenter.traceurifiedInstrumented["file.js"]);

    if (debug) {
      console.log("Coverage: ", JSON.stringify(global[coverageVar], null, 2));
    }

    expect(global[coverageVar]).to.deep.equal(expectedCoverage);
  });
}