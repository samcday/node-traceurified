var estraverse = require("estraverse");
var traceurified = require("traceurified");
var traceur = traceurified.traceur;
var MozillaParseTreeTransformer = require("./MozillaParseTreeTransformer");

var ParseTreeVisitor = traceur.System.get(traceur.System.map.traceur + "/src/syntax/ParseTreeVisitor").ParseTreeVisitor;

/**
 * Traverses both the original ES6 parse tree and the transformed tree to
 * fix up the source locations, so that Istanbul reports correctly.
 */
function prepareAst(filename, es5Ast, es6Ast) {
  // Locations of all generators, indexed in order that we saw them.
  var generatorPositions = [];

  var visitor = new ParseTreeVisitor();
  visitor.visitFunctionDeclaration = function(tree) {
    if ((tree.functionKind.type === "*" || tree.functionKind.value === "async") && tree.location && tree.location.start.source.name === filename) {
      generatorPositions.push({
        gen: {
          start: {
            line: tree.location.start.line + 1,
            column: tree.location.start.column,
            source: filename
          },
          end: {
            line: tree.location.end.line + 1,
            column: tree.location.end.column,
            source: filename
          }
        },
        body: {
          start: {
            line: tree.functionBody.location.start.line + 1,
            column: tree.functionBody.location.start.column,
            source: filename
          },
          end: {
            line: tree.functionBody.location.end.line + 1,
            column: tree.functionBody.location.end.column,
            source: filename
          }
        }
      });
    }
  }

  visitor.visitAny(es6Ast);

  // Visit all the nodes in the original tree first. Save off some info on
  // where things are.

  var functionStack = [];
  var generatorIdx = 0;
  estraverse.traverse(es5Ast, {
    enter: function(node, parent) {
      // Nuke location info that doesn't match our expected source file.
      // These kinds of nodes are ones that are being entirely conjured up by
      // a Traceur transformation pass.
      if (node.loc && node.loc.start.source !== filename) {
        delete node.loc;
      }

      // Some functions are generators. We don't know which ones. Every time we
      // enter a function, we insert a dummy element on the functionStack.
      // If we later discover this is a generator, we replace the top of the 
      // stack with the index of the generator.
      if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
        functionStack.push(-1);
      }

      // If this node is a call to $traceurRuntime.generatorWrap, we just
      // entered a generator function. Mark this one on the stack, 
      if (node.type === "CallExpression" &&
          node.callee.type === "MemberExpression" &&
          node.callee.object.name === "$traceurRuntime" &&
          (node.callee.property.name === "generatorWrap" ||
           node.callee.property.name === "asyncWrap")) {
        functionStack.pop();
        functionStack.push(generatorIdx++);
      }

      // Istanbul doesn't really like it when a FunctionExpression has a body
      // with no location information.
      if (node.type === "FunctionExpression" && node.body.type === "BlockStatement" && !node.body.loc) {
        node.body.loc = node.loc;
      }

      // Attach location info to expressions that assign to $ctx.returnValue. These
      // are return statements for generators and aync functions.
      if (node.type === "ExpressionStatement" &&
          node.expression.type === "AssignmentExpression" &&
          node.expression.left.type === "MemberExpression" && 
          node.expression.left.object.name === "$ctx" &&
          node.expression.left.property.name === "returnValue") {
          node.loc = JSON.parse(JSON.stringify(node.expression.right.loc));
          // TODO: properly figure out where the return statement in original
          // source began.
          node.loc.start.column -= 7;
      }
    },
    leave: function(node, parent) {
      if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
        var generatorIdx = functionStack.pop();
        if (generatorIdx > -1) {
          node.loc = generatorPositions[generatorIdx].gen;
          node.body.loc = generatorPositions[generatorIdx].body;
        }
      }
    }
  });
}

/**
 * Takes an input Traceur-format AST and outputs a cleaned up SpiderMonkey AST,
 * ready to be fed into Istanbul.
 */
exports.prepareAst = function(filename, es5Ast, es6Ast) {
  var mozillaAst = new MozillaParseTreeTransformer().transformAny(es5Ast);
  prepareAst(filename, mozillaAst, es6Ast);
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
