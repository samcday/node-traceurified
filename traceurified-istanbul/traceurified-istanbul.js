var estraverse = require("estraverse");
var traceurified = require("traceurified");
var MozillaParseTreeTransformer = require("./MozillaParseTreeTransformer");

function prepareAst(ast) {
  estraverse.traverse(ast, {
    enter: function(node, parent) {
      // Istanbul doesn't really like it when a FunctionExpression has a body
      // with no location information.
      if (node.type === "FunctionExpression" && node.body.type === "BlockStatement" && !node.body.loc) {
        node.body.loc = node.loc;
      }
    },
    leave: function(node, parent) {

    }
  });
}

/**
 * Takes an input Traceur-format AST and outputs a cleaned up SpiderMonkey AST,
 * ready to be fed into Istanbul.
 */
exports.prepareAst = function(filename, ast) {
  var mozillaAst = new MozillaParseTreeTransformer().transformAny(ast);
  prepareAst(mozillaAst);
  return mozillaAst;
}

exports.postProcessor = function(filename, original, compiled) {
  var ast = traceurified.processedAst[filename];
  var mozillaAst = new MozillaParseTreeTransformer().transformAny(ast);

  prepareAst(mozillaAst);

  try {
    var instrumentedCode = instrumenter.instrumentASTSync(mozillaAst, filename);
    // store.set(filename, original);
    return instrumentedCode;
  } catch(e) {
    console.log("Error while instrumenting " + filename);
    throw e;
  }
};
