var estraverse = require("estraverse");
var traceurified = require("traceurified");
var traceur = traceurified.traceur;

var ParseTreeVisitor = traceur.System.get(traceur.System.map.traceur + "/src/syntax/ParseTreeVisitor").ParseTreeVisitor;
var ParseTreeFactory = traceur.System.get(traceur.System.map.traceur + "/src/codegeneration/ParseTreeFactory");
var ParseTreeType = traceur.System.get(traceur.System.map.traceur + "/src/syntax/trees/ParseTreeType");

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

function addMeta(tree, key, value) {
  if (!tree._meta) {
    tree._meta = {};
  }
  tree._meta[key] = value;
  return value;
}

/**
 * Traverse the ES6 tree, add some additional metadata that we use to fix the
 * ES5 tree up with later.
 */
function transformEs6Tree(filename, tree) {
  var visitor = new ParseTreeVisitor();

  function visitFunction(tree) {
    if (tree.isGenerator() || tree.isAsyncFunction()) {
      var marker = ParseTreeFactory.createExpressionStatement(ParseTreeFactory.createStringLiteral("traceurified-istanbul"));
      addMeta(marker, "generator", {
        gen: convertLocationNode(tree.location),
        body: convertLocationNode(tree.functionBody.location)
      });
      tree.functionBody.statements.unshift(marker);
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
    addMeta(tree.expression, "yieldPos", convertLocationNode(tree.location));
    ParseTreeVisitor.prototype.visitYieldExpression.call(this, tree);
  };

  visitor.visitFormalParameter = function(tree) {
    if (tree.parameter.initialiser) {
      addMeta(tree.parameter.initialiser, "defaultInitialiser", {
        expr: convertLocationNode(tree.parameter.initialiser.location),
        param: convertLocationNode(tree.location)
      });
    }

    // ParseTreeVisitor.prototype.visitFormalParameter.apply(this, tree);
  };

  visitor.visitArrowFunctionExpression = function(tree) {
    var isBlock = tree.functionBody.type === ParseTreeType.FUNCTION_BODY,
        funcLoc = convertLocationNode(tree.location),
        exprLoc = convertLocationNode(tree.functionBody.location);

    if (exprLoc.end.line === funcLoc.end.line &&
        exprLoc.end.column > funcLoc.end.column) {
      funcLoc.end.column = exprLoc.end.column;
    }

    tree.functionBody._meta = {
      fromArrow: {
        func: funcLoc,
        expr: exprLoc,
        isBlock: isBlock
      }
    };
    ParseTreeVisitor.prototype.visitArrowFunctionExpression.call(this, tree);
  };

  visitor.visitArrayComprehension = function(tree) {
    addMeta(tree.expression, "comprehension", true);
  };

  visitor.visitClassDeclaration = function(tree) {
    addMeta(tree, "isClass", true);
    tree.elements.forEach(function(element) {
      addMeta(element, "inClass", true);
      addMeta(element.functionBody, "inClass", true);
    });
    ParseTreeVisitor.prototype.visitClassExpression.call(this, tree);
  };

  visitor.visitAny(tree);
}

/**
 * Fixes up the generated ES5 tree based on metadata we added to the original
 * tree that should *hopefully* have made it through the transformation process.
 */
function fixEs5Tree(filename, es5Ast) {
  var functionStack = [];

  estraverse.traverse(es5Ast, {
    enter: function(node, parent) {
      // Nuke location info that doesn't match our expected source file.
      // These kinds of nodes are ones that are being entirely conjured up by
      // a Traceur transformation pass.
      if (node.loc && node.loc.start.source !== filename) {
        delete node.loc;
      }

      // We keep track of the functions we're currently inside.
      if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
        functionStack.push(node);
      }

      if (node._meta && node._meta.comprehension) {
        parent.loc = node.loc;
        parent._meta = node._meta;
      }

      // Did we just find a generator marker?
      if (node._meta && node._meta.generator) {
        // The generator we're inside of is the second-from-last in our stack.
        // This is because generator bodies are wrapped inside a traceur runtime
        // function wrapper first.
        var gen = functionStack[functionStack.length - 2];
        gen.loc = node._meta.generator.gen;
        gen.body.loc = node._meta.generator.body;
      }

      if (node._meta && node._meta.yieldPos) {
        parent.loc = node._meta.yieldPos;
      }

      if (node._meta && node._meta.fromArrow) {
        var arrowFn = functionStack[functionStack.length - 1];
        arrowFn.loc = node._meta.fromArrow.func;

        if (node.type !== "BlockStatement") {
          arrowFn.body.loc = parent.loc = node._meta.fromArrow.expr;
        }
      }

      if (node._meta && node._meta.defaultInitialiser) {
        // Parent is the conditional expression.
        var initialiser = node._meta.defaultInitialiser;
        parent.loc = initialiser.param;
        parent.consequent.loc = JSON.parse(JSON.stringify(initialiser.expr));
        // TODO: temporary dirty hack. Fix me!
        parent.consequent.loc.end.line = parent.consequent.loc.start.line;
        parent.consequent.loc.end.column = parent.consequent.loc.start.column - 1;
        parent.alternate.loc = JSON.parse(JSON.stringify(initialiser.expr));
      }
    },
    leave: function(node, parent) {
      if (node.type === "FunctionExpression" || node.type === "FunctionDeclaration") {
        functionStack.pop();
      }

      if (node._meta && node._meta.comprehension) {
        parent.loc = node.loc;
      }

      // // Istanbul doesn't really like it when a FunctionExpression has a body
      // // with no location information.
      if (node.type === "FunctionExpression" && node.body.type === "BlockStatement" && !node.body.loc) {
        // delete node.loc;
        node.body.loc = node.loc;
      }
    }
  });
}

exports.es5Transformer = function(instrumenter, filename, ast) {
  if (filename.indexOf("/test/") > -1) return;
  try {
    fixEs5Tree(filename, ast);

    var instrumentedCode = instrumenter.instrumentASTSync(ast, filename);
    // return instrumentedCode;
    instrumenter.traceurifiedInstrumented[filename] = instrumentedCode;
  } catch(e) {
    console.log("Error while instrumenting " + filename);
    throw e;
  }
};

exports.es6Transformer = function(filename, tree) {
  if (filename.indexOf("/test/") > -1) return;

  transformEs6Tree(filename, tree);
}

exports.postProcessor = function(instrumenter, filename) {
  return instrumenter.traceurifiedInstrumented[filename];
}

if (process.env.npm_config_coverage) {
  var istanbul = require("istanbul");
  var instrumenter = new istanbul.Instrumenter({noAutoWrap: true});
  instrumenter.traceurifiedInstrumented = [];

  // traceurified.postProcessors.push(exports.postProcessor);
  traceurified.es6Transformers.push(exports.es6Transformer);
  traceurified.es5Transformers.push(exports.es5Transformer.bind(null, instrumenter));
  traceurified.postProcessors.push(exports.postProcessor.bind(null, instrumenter));

  process.on("exit", function() {
    var collector = new istanbul.Collector();

    collector.add(global.__coverage__);
    var report = istanbul.Report.create("html", {
        dir: process.cwd() + "/reports"
    });
    report.writeReport(collector, true);
  });
}
