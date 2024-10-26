class Node {
  constructor(type, left = null, right = null, value = null) {
    this.type = type;
    this.left = left;
    this.right = right;
    this.value = value;
  }
}

function tokenize(ruleString) {
  const regex = /'[^']*'|\(|\)|\w+|>=|<=|!=|>|<|=|AND|OR/gi;
  return ruleString.match(regex) || [];
}

function createRule(ruleString) {
  const tokens = tokenize(ruleString);
  let index = 0;

  function parseExpression() {
    if (index >= tokens.length) {
      throw new Error("Unexpected end of input");
    }

    if (
      tokens[index].toUpperCase() === "AND" ||
      tokens[index].toUpperCase() === "OR"
    ) {
      const operator = tokens[index++].toUpperCase();
      const right = parseExpression();
      return new Node("operator", null, right, operator);
    }

    if (tokens[index] === "(") {
      index++;
      const expr = parseExpression();
      if (index >= tokens.length || tokens[index] !== ")") {
        throw new Error("Missing closing parenthesis");
      }
      index++; // Skip closing parenthesis

      if (
        index < tokens.length &&
        (tokens[index].toUpperCase() === "AND" ||
          tokens[index].toUpperCase() === "OR")
      ) {
        const operator = tokens[index++].toUpperCase();
        const right = parseExpression();
        return new Node("operator", expr, right, operator);
      }

      return expr;
    } else {
      const left = tokens[index++];
      if (index >= tokens.length) {
        throw new Error("Unexpected end of input");
      }
      const operator = tokens[index++];
      if (![">", "<", ">=", "<=", "=", "!="].includes(operator)) {
        throw new Error(`Invalid comparison operator: ${operator}`);
      }
      if (index >= tokens.length) {
        throw new Error("Unexpected end of input");
      }
      const right = tokens[index++];
      const operand = new Node("operand", null, null, {
        left,
        operator,
        right,
      });

      if (
        index < tokens.length &&
        (tokens[index].toUpperCase() === "AND" ||
          tokens[index].toUpperCase() === "OR")
      ) {
        const logicalOperator = tokens[index++].toUpperCase();
        const rightExpr = parseExpression();
        return new Node("operator", operand, rightExpr, logicalOperator);
      }

      return operand;
    }
  }

  const ast = parseExpression();
  if (index < tokens.length) {
    throw new Error("Unexpected tokens after parsing");
  }
  return ast;
}

function combineRules(ruleStrings) {
  if (ruleStrings.length === 0) {
    throw new Error("No rules to combine");
  }

  const asts = ruleStrings.map((ruleString) => createRule(ruleString));

  if (asts.length === 1) {
    return asts[0];
  }

  return asts.reduce(
    (combined, ast) => new Node("operator", combined, ast, "AND")
  );
}

function evaluateRule(ast, data) {
  function evaluate(node) {
    if (!node) {
      throw new Error("Invalid node: undefined or null");
    }

    if (node.type === "operator") {
      const left = evaluate(node.left);
      const right = evaluate(node.right);
      return node.value === "AND" ? left && right : left || right;
    } else if (node.type === "operand") {
      const { left, operator, right } = node.value;
      const leftValue = data[left];

      if (leftValue === undefined) {
        throw new Error(`Undefined attribute: ${left}`);
      }

      let rightValue;
      if (right.startsWith("'") && right.endsWith("'")) {
        rightValue = right.slice(1, -1);
      } else if (!isNaN(right)) {
        rightValue = Number(right);
      } else {
        rightValue = data[right];
        if (rightValue === undefined) {
          throw new Error(`Undefined attribute: ${right}`);
        }
      }

      switch (operator) {
        case ">":
          return leftValue > rightValue;
        case "<":
          return leftValue < rightValue;
        case ">=":
          return leftValue >= rightValue;
        case "<=":
          return leftValue <= rightValue;
        case "=":
          return leftValue === rightValue;
        case "!=":
          return leftValue !== rightValue;
        default:
          throw new Error(`Unsupported operator: ${operator}`);
      }
    } else {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }

  return evaluate(ast);
}

function modifyRule(ast, path, newValue) {
  if (path.length === 0) {
    return newValue;
  }

  const [current, ...rest] = path;
  const newNode = new Node(ast.type, ast.left, ast.right, ast.value);

  if (current === "left") {
    newNode.left = modifyRule(ast.left, rest, newValue);
  } else if (current === "right") {
    newNode.right = modifyRule(ast.right, rest, newValue);
  } else if (current === "value") {
    if (rest.length === 0) {
      newNode.value = newValue;
    } else {
      newNode.value = { ...ast.value, [rest[0]]: newValue };
    }
  } else {
    throw new Error(`Invalid path: ${path.join(".")}`);
  }

  return newNode;
}

function validateAttributes(ast, allowedAttributes) {
  function validate(node) {
    if (node.type === "operator") {
      validate(node.left);
      validate(node.right);
    } else if (node.type === "operand") {
      const { left } = node.value;
      if (!allowedAttributes.includes(left)) {
        throw new Error(`Invalid attribute: ${left}`);
      }
    } else {
      throw new Error(`Invalid node type: ${node.type}`);
    }
  }

  validate(ast);
}

module.exports = {
  Node,
  createRule,
  combineRules,
  evaluateRule,
  modifyRule,
  validateAttributes,
};
