import { expect } from "chai";

import { Instrumenter } from "istanbul";
import { compile } from "traceurified";
import { prepareAst } from "../traceurified-istanbul";

export function setupCoverageTest(code, expectedCoverage, debug) {
  it("should report coverage correctly", () => {
    var result = compile("file.js", code);
    var ast = prepareAst("file.js", result.es5Ast, result.es6Ast);

    if (debug) {
      console.log(JSON.stringify(ast, null, 2));
      console.log(require("escodegen").generate(ast));
    }

    var coverageVar = `__traceurifiedIstanbulCov_${Date.now()}`
    var instrumenter = new Instrumenter({coverageVariable: coverageVar, noAutoWrap: true, debug: debug, walkDebug: debug});
    var instrumented = instrumenter.instrumentASTSync(ast, "file.js", code);

    eval(instrumented);

    expect(global[coverageVar]).to.deep.equal(expectedCoverage);
  });
}