import { expect } from "chai";

import { Instrumenter } from "istanbul";
import { parseES6, transformToES5 } from "traceurified";
import { es6Transformer, prepareAst } from "../traceurified-istanbul";

export function setupCoverageTest(code, expectedCoverage, debug) {
  it("should report coverage correctly", () => {
    var es6Ast = parseES6("file.js", code);
    es6Transformer("file.js", es6Ast);
    var es5Ast = transformToES5("file.js", es6Ast);
    prepareAst("file.js", es5Ast, es6Ast);

    if (debug) {
      console.log(JSON.stringify(es5Ast, null, 2));
      console.log(require("escodegen").generate(es5Ast));
    }

    var coverageVar = `__traceurifiedIstanbulCov_${Date.now()}`
    var instrumenter = new Instrumenter({coverageVariable: coverageVar, noAutoWrap: true, debug: debug, walkDebug: debug});
    var instrumented = instrumenter.instrumentASTSync(es5Ast, "file.js", code);

    eval(instrumented);

    if (debug) {
      console.log("Coverage: ", JSON.stringify(global[coverageVar], null, 2));
    }

    expect(global[coverageVar]).to.deep.equal(expectedCoverage);
  });
}