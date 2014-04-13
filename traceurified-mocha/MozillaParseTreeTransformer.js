"use strict";

var traceur = require("traceur"),
    util    = require("util");

var ParseTreeTransformer = traceur.System.get(traceur.System.map.traceur + "/src/codegeneration/ParseTreeTransformer").ParseTreeTransformer;

function MozillaParseTreeTransformer() {
  this.createNode = function(tree, data) {
    if (tree.location) {
      data.loc = {
        start: {
          line: tree.location.start.line + 1,
          column: tree.location.start.column,
          source: tree.location.start.source.name
        },
        end: {
          line: tree.location.end.line + 1,
          column: tree.location.end.column,
          source: tree.location.end.source.name
        }
      }
    }
    return data;
  }
}

util.inherits(MozillaParseTreeTransformer, ParseTreeTransformer);
module.exports = MozillaParseTreeTransformer;

MozillaParseTreeTransformer.prototype.transformAny = function(tree) {
  if (!tree) {
    return;
  }

  if (tree.type === "identifier") {
    return this.transformIdentifier(tree);
  }

  // console.log(tree.type);

  return ParseTreeTransformer.prototype.transformAny.call(this, tree);
};

MozillaParseTreeTransformer.prototype.transformIdentifier = function(tree) {
  return this.createNode(tree, {
    type: "Identifier",
    name: tree.value
  });
};

MozillaParseTreeTransformer.prototype.transformScript = function(tree) {
  return this.createNode(tree, {
    type: "Program",
    body: this.transformList(tree.scriptItemList)
  });
};

MozillaParseTreeTransformer.prototype.transformFunctionDeclaration = function(tree) {
  return this.createNode(tree, {
    type: tree.type === "FUNCTION_EXPRESSION" ? "FunctionExpression" : "FunctionDeclaration",
    id: this.transformAny(tree.name),
    params: this.transformAny(tree.parameterList),
    body: this.transformAny(tree.functionBody)
  });
};

MozillaParseTreeTransformer.prototype.transformFunctionExpression = function(tree) {
  return this.transformFunctionDeclaration(tree);
};

MozillaParseTreeTransformer.prototype.transformFunctionBody = function(tree) {
  return this.createNode(tree, {
    type: "BlockStatement",
    body: this.transformList(tree.statements)
  });
};

MozillaParseTreeTransformer.prototype.transformBindingElement = function(tree) {
  return this.transformAny(tree.binding);
};

MozillaParseTreeTransformer.prototype.transformBindingIdentifier = function(tree) {
  return this.transformIdentifierExpression(tree);
};

MozillaParseTreeTransformer.prototype.transformFormalParameterList = function(tree) {
  return this.transformList(tree.parameters);
};

MozillaParseTreeTransformer.prototype.transformFormalParameter = function(tree) {
  return this.transformAny(tree.parameter);
};

MozillaParseTreeTransformer.prototype.transformUnaryExpression = function(tree) {
  return this.createNode(tree, {
    type: "UnaryExpression",
    operator: tree.operator.type,
    argument: this.transformAny(tree.operand)
  });;
};

MozillaParseTreeTransformer.prototype.transformExpressionStatement = function(tree) {
  return this.createNode(tree, {
    type: "ExpressionStatement",
    expression: this.transformAny(tree.expression)
  });;
};

MozillaParseTreeTransformer.prototype.transformLiteralExpression = function(tree) {
  var token = tree.literalToken;
  var value = token.processedValue, raw = token.value;
  if (token.type === "true" || token.type === "false") {
    value = Boolean(token.type);
    raw = token.type;
  }

  if (value === Number(value) && value < 0) {
    var newVal = Math.abs(value);

    return this.createNode(tree, {
      type: "UnaryExpression",
      operator: "-",
      argument: {
        type: "Literal",
        value: newVal,
        raw: String(newVal)
      }
    });
  }

  return this.createNode(tree, {
    type: "Literal",
    value: value,
    raw: raw
  });;
};

MozillaParseTreeTransformer.prototype.transformVariableStatement = function(tree) {
  return this.transformAny(tree.declarations);
};

MozillaParseTreeTransformer.prototype.transformVariableDeclarationList = function(tree) {
  return this.createNode(tree, {
    type: "VariableDeclaration",
    kind: tree.declarationType,
    declarations: this.transformList(tree.declarations)
  });;
};

MozillaParseTreeTransformer.prototype.transformVariableDeclaration = function(tree) {
  return this.createNode(tree, {
    type: "VariableDeclarator",
    id: this.transformAny(tree.lvalue),
    init: this.transformAny(tree.initialiser)
  });
};

MozillaParseTreeTransformer.prototype.transformExpressionStatement = function(tree) {
  return this.createNode(tree, {
    type: "ExpressionStatement",
    expression: this.transformAny(tree.expression)
  });
};

MozillaParseTreeTransformer.prototype.transformCallExpression = function(tree) {
  return this.createNode(tree, {
    type: "CallExpression",
    callee: this.transformAny(tree.operand),
    arguments: this.transformAny(tree.args)
  });
};

MozillaParseTreeTransformer.prototype.transformIdentifierExpression = function(tree) {
  return this.createNode(tree, {
    type: "Identifier",
    name: tree.identifierToken.value
  });
};

MozillaParseTreeTransformer.prototype.transformArgumentList = function(tree) {
  return this.transformList(tree.args);
};

MozillaParseTreeTransformer.prototype.transformBlock = function(tree) {
  return this.createNode(tree, {
    type: "BlockStatement",
    body: this.transformList(tree.statements)
  });
};

MozillaParseTreeTransformer.prototype.transformBinaryOperator = function(tree) {
  var left = this.transformAny(tree.left), right = this.transformAny(tree.right);
  return this.createNode(tree, {
    type: left.type === "Literal" ? "BinaryExpression" : "AssignmentExpression",
    left: left,
    right: right,
    operator: tree.operator.type,
  });
};

MozillaParseTreeTransformer.prototype.transformConditionalExpression = function(tree) {
  return this.createNode(tree, {
    type: "ConditionalExpression",
    test: this.transformAny(tree.condition),
    consequent: this.transformAny(tree.left),
    alternate: this.transformAny(tree.right)
  });
};

MozillaParseTreeTransformer.prototype.transformArrayLiteralExpression = function(tree) {
  return this.createNode(tree, {
    type: "ArrayExpression",
    elements: this.transformList(tree.elements)
  });
};

MozillaParseTreeTransformer.prototype.transformBreakStatement = function(tree) {
  return this.createNode(tree, {
    type: "BreakStatement",
    label: this.transformAny(tree.name)
  });
};

MozillaParseTreeTransformer.prototype.transformContinueStatement = function(tree) {
  return this.createNode(tree, {
    type: "ContinueStatement",
    label: this.transformAny(tree.name)
  });
};

MozillaParseTreeTransformer.prototype.transformDebuggerStatement = function(tree) {
  return this.createNode(tree, {
    type: "DebuggerStatement"
  });
};

MozillaParseTreeTransformer.prototype.transformEmptyStatement = function(tree) {
  return this.createNode(tree, {
    type: "EmptyStatement"
  });
};

MozillaParseTreeTransformer.prototype.transformDoWhileStatement = function(tree) {
  return this.createNode(tree, {
    type: "DoWhileStatement",
    body: this.transformAny(tree.body),
    test: this.transformAny(tree.condition)
  });
};

MozillaParseTreeTransformer.prototype.transformForInStatement = function(tree) {
  return this.createNode(tree, {
    type: "ForInStatement",
    left: this.transformAny(tree.initialiser),
    right: this.transformAny(tree.collection),
    body: this.transformAny(tree.body)
  });
};

MozillaParseTreeTransformer.prototype.transformForStatement = function(tree) {
  return this.createNode(tree, {
    type: "ForStatement",
    init: this.transformAny(tree.initialiser),
    test: this.transformAny(tree.condition),
    update: this.transformAny(tree.increment),
    body: this.transformAny(tree.body)
  });
};   

MozillaParseTreeTransformer.prototype.transformPostfixExpression = function(tree) {
  return this.createNode(tree, {
    type: "UpdateExpression",
    operator: tree.operator.type,
    argument: this.transformAny(tree.operand)
  });;
};

MozillaParseTreeTransformer.prototype.transformObjectLiteralExpression = function(tree) {
  return this.createNode(tree, {
    type: "ObjectExpression",
    properties: this.transformList(tree.propertyNameAndValues)
  });
};

MozillaParseTreeTransformer.prototype.transformGetAccessor = function(tree) {
  return this.transformPropertyNameAssignment(tree);
};

MozillaParseTreeTransformer.prototype.transformSetAccessor = function(tree) {
  return this.transformPropertyNameAssignment(tree);
};

MozillaParseTreeTransformer.prototype.transformMemberExpression = function(tree) {
  var computed = tree.type === "MEMBER_LOOKUP_EXPRESSION";
  return this.createNode(tree, {
    type: "MemberExpression",
    computed: computed,
    object: this.transformAny(tree.operand),
    property: computed ? this.transformAny(tree.memberExpression) : this.transformAny(tree.memberName)
  });
};

MozillaParseTreeTransformer.prototype.transformMemberLookupExpression = function(tree) {
  return this.transformMemberExpression(tree);
};

MozillaParseTreeTransformer.prototype.transformLiteralPropertyName = function(tree) {
  return this.transformAny(tree.literalToken);
};

MozillaParseTreeTransformer.prototype.transformIfStatement = function(tree) {
  return this.createNode(tree, {
    type: "IfStatement",
    test: this.transformAny(tree.condition),
    consequent: this.transformAny(tree.ifClause),
    alternate: this.transformAny(tree.elseClause)
  });
};

MozillaParseTreeTransformer.prototype.transformParenExpression = function(tree) {
  return this.transformAny(tree.expression);
};

MozillaParseTreeTransformer.prototype.transformLabelledStatement = function(tree) {
  return this.createNode(tree, {
    type: "LabeledStatement",
    label: this.transformAny(tree.name),
    body: this.transformAny(tree.statement)
  });
};

MozillaParseTreeTransformer.prototype.transformNewExpression = function(tree) {
  return this.createNode(tree, {
    type: "NewExpression",
    callee: this.transformAny(tree.operand),
    arguments: this.transformAny(tree.args) || []
  });
};

MozillaParseTreeTransformer.prototype.transformPropertyNameAssignment = function(tree) {
  var kind, value;

  var value = tree.value ? this.transformAny(tree.value) : {
    type: "FunctionExpression",
    params: this.transformAny(tree.parameterList) || [],
    body: this.transformAny(tree.body)
  };

  return this.createNode(tree, {
    type: "Property",
    key: this.transformAny(tree.name),
    value: value,
    kind: tree.type === "GET_ACCESSOR" ? "get" : tree.type === "SET_ACCESSOR" ? "set" : "init"
  });;
};

MozillaParseTreeTransformer.prototype.transformReturnStatement = function(tree) {
  return this.createNode(tree, {
    type: "ReturnStatement",
    argument: this.transformAny(tree.expression)
  });
};

MozillaParseTreeTransformer.prototype.transformSwitchStatement = function(tree) {
  return this.createNode(tree, {
    type: "SwitchStatement",
    discriminant: this.transformAny(tree.expression),
    cases: this.transformList(tree.caseClauses)
  });
};

MozillaParseTreeTransformer.prototype.transformCaseClause = function(tree) {
  return this.createNode(tree, {
    type: "SwitchCase",
    test: this.transformAny(tree.expression),
    consequent: this.transformList(tree.statements)
  });
};

MozillaParseTreeTransformer.prototype.transformDefaultClause = function(tree) {
  return this.transformCaseClause(tree);
};

MozillaParseTreeTransformer.prototype.transformThisExpression = function(tree) {
  return this.createNode(tree, {
    type: "ThisExpression"
  });
};

MozillaParseTreeTransformer.prototype.transformTryStatement = function(tree) {
  return this.createNode(tree, {
    type: "TryStatement",
    block: this.transformAny(tree.body),
    handlers: [this.transformAny(tree.catchBlock)],
    finalizer: this.transformAny(tree.finallyBlock)
  });
};

MozillaParseTreeTransformer.prototype.transformCatch = function(tree) {
  return this.createNode(tree, {
    type: "CatchClause",
    param: this.transformAny(tree.binding),
    body: this.transformAny(tree.catchBody)
  });
};

MozillaParseTreeTransformer.prototype.transformThrowStatement = function(tree) {
  return this.createNode(tree, {
    type: "ThrowStatement",
    argument: this.transformAny(tree.value)
  });
};

MozillaParseTreeTransformer.prototype.transformWhileStatement = function(tree) {
  return this.createNode(tree, {
    type: "WhileStatement",
    test: this.transformAny(tree.condition),
    body: this.transformAny(tree.body)
  });
};

MozillaParseTreeTransformer.prototype.transformFinally = function(tree) {
  return this.transformAny(tree.block);
};
