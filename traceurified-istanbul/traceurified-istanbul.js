var estraverse = require("estraverse");
var traceurified = require("traceurified");
var traceur = traceurified.traceur;
var MozillaParseTreeTransformer = require("./MozillaParseTreeTransformer");

var ParseTreeVisitor = traceur.System.get(traceur.System.map.traceur + "/src/syntax/ParseTreeVisitor").ParseTreeVisitor;

// Converts a Traceur source location item to a Spidermonkey AST one.
function convertLocationNode(location) {
  if (!location) {
    return undefined;
  }

  return {
      start: {
        line: location.start.line + 1,
        column: location.start.column,
        source: location.start.source.name,
      },
      end: {
        line: location.end.line + 1,
        column: location.end.column,
        source: location.end.source.name
      }
  };
}

/**
 * Traverses both the original ES6 parse tree and the transformed tree to
 * fix up the source locations, so that Istanbul reports correctly.
 */
function prepareAst(filename, es5Ast, es6Ast) {
  // Locations of all generators, indexed in order that we saw them.
  var generatorPositions = [];

  // Visit all the nodes in the original tree first. Save off some info on
  // where things are.

  var visitor = new ParseTreeVisitor();

  function visitFunction(tree) {
    if (tree.functionKind &&(tree.functionKind.type === "*" || tree.functionKind.value === "async") && tree.location && tree.location.start.source.name === filename) {
      generatorPositions.push({
        yields: [],
        gen: convertLocationNode(tree.location),
        body: convertLocationNode(tree.functionBody.location)
      });
    }
  }

  visitor.visitFunctionExpression = function(tree) {
    visitFunction(tree);
    ParseTreeVisitor.prototype.visitFunctionExpression.call(this, tree);
  };

  visitor.visitFunctionDeclaration = function(tree) {
    visitFunction(tree);
    ParseTreeVisitor.prototype.visitFunctionDeclaration.call(this, tree);
  };

  visitor.visitYieldExpression = function(tree) {
    var generatorInfo = generatorPositions[generatorPositions.length - 1];
    generatorInfo.yields.push({
      statement: convertLocationNode(tree.location),
      expr: convertLocationNode(tree.expression.location)
    });
    ParseTreeVisitor.prototype.visitYieldExpression.call(this, tree);
  };

  visitor.visitAny(es6Ast);

  var functionStack = [];
  var generatorIdx = 0;
  var yieldIdx = 0;
  var inGenerator = false;
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
        inGenerator = functionStack[functionStack.length - 1] > -1;
        functionStack.push(-1);
      }

      // If this node is a call to $traceurRuntime.generatorWrap, we just
      // entered a generator function.
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

      if (node.type === "ReturnStatement" && !node.loc && inGenerator) {
        var genInfo = generatorPositions[functionStack[functionStack.length - 2]];

        if (node.argument.loc && node.argument.loc.start.source === filename) {
          var yieldLoc = genInfo.yields[yieldIdx];
          var exprLoc = node.argument.loc;
          if (yieldLoc.expr.start.line === exprLoc.start.line && yieldLoc.expr.start.column === exprLoc.start.column) {
            node.loc = yieldLoc.statement;
          }
        }
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
        yieldIdx = 0;
        inGenerator = functionStack.length >= 2 && functionStack[functionStack.length - 2] > -1;
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
};

exports.postProcessor = function(filename, original, compiled) {
  var es5Ast = traceurified.processedAst[filename];
  var es6Ast = traceurified.ast[filename];
  var mozillaAst = exports.prepareAst(filename, es5Ast, es6Ast);

  try {
    var instrumentedCode = instrumenter.instrumentASTSync(mozillaAst, filename);
    // store.set(filename, original);
    return instrumentedCode;
  } catch(e) {
    console.log("Error while instrumenting " + filename);
    throw e;
  }
};

if (process.env.npm_config_coverage) {
  var istanbul = require("istanbul");
  traceurified.postProcessors.push(exports.postProcessor);
  var instrumenter = new istanbul.Instrumenter({noAutoWrap: true});

  process.on("exit", function() {
    var collector = new istanbul.Collector();

    // console.log(JSON.stringify(global.__coverage__, null, 2));
    collector.add(global.__coverage__);
    var report = istanbul.Report.create("html", {
        dir: process.cwd() + "/reports"
    });
    report.writeReport(collector, true);
  });
}
