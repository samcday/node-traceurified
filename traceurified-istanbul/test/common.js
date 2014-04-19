import { expect } from "chai";

import { Instrumenter } from "istanbul";
import { parseES6, transformToES5 } from "traceurified";
import { es6Transformer, es5Transformer } from "../traceurified-istanbul";

import { createHash } from "crypto";

function sha1(str) {
  var hash = createHash("sha1");
  hash.update(str);
  return hash.digest("hex");
}

export function setupCoverageTest(code, expectedCoverage, debug) {
  it("should report coverage correctly", () => {
    var es6Ast = parseES6("file.js", code);

    es6Transformer("file.js", es6Ast);

    if (debug) {
      console.log("ES6 AST", JSON.stringify(es6Ast, null, 2));
    }

    var coverageVar = `__traceurifiedIstanbulCov_${sha1(code)}`
    var instrumenter = new Instrumenter({coverageVariable: coverageVar, noAutoWrap: true, debug: debug, walkDebug: debug});
    instrumenter.traceurifiedInstrumented = [];

    var es5Ast = transformToES5("file.js", es6Ast);

    if (debug) {
      console.log("ES5 AST", JSON.stringify(es5Ast, null, 2));
    }

    es5Transformer(instrumenter, "file.js", es5Ast);

    eval(instrumenter.traceurifiedInstrumented["file.js"]);

    if (debug) {
      console.log("Coverage: ", JSON.stringify(global[coverageVar], null, 2));
    }

    expect(global[coverageVar]).to.deep.equal(expectedCoverage);
  });
}