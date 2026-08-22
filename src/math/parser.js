/**
 * Safe Mathematical Expression Lexer, AST Parser & Fast Native Code Compiler
 * Compiles user formulas into high-speed zero-allocation JavaScript functions.
 */

export class MathParser {
  /**
   * Tokenizes a mathematical string.
   */
  static tokenize(input) {
    const tokens = [];
    let i = 0;
    const clean = input.trim();

    while (i < clean.length) {
      const char = clean[i];

      if (/\s/.test(char)) {
        i++;
        continue;
      }

      if (/[0-9.]/.test(char)) {
        let numStr = '';
        while (i < clean.length && /[0-9.]/.test(clean[i])) {
          numStr += clean[i++];
        }
        tokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (i < clean.length && /[a-zA-Z0-9_]/.test(clean[i])) {
          ident += clean[i++];
        }
        tokens.push({ type: 'IDENTIFIER', value: ident.toLowerCase() });
        continue;
      }

      if ('+-*/^%(),'.includes(char)) {
        tokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      throw new Error(`Unexpected character in formula: '${char}' at index ${i}`);
    }

    return tokens;
  }

  /**
   * Parses tokens into an Abstract Syntax Tree (AST).
   */
  static parse(tokens) {
    let current = 0;

    function peek() {
      return tokens[current];
    }

    function consume(expectedValue) {
      const tok = tokens[current];
      if (!tok) throw new Error('Unexpected end of expression');
      if (expectedValue && tok.value !== expectedValue) {
        throw new Error(`Expected '${expectedValue}', found '${tok.value}'`);
      }
      current++;
      return tok;
    }

    function expression() {
      return additive();
    }

    function additive() {
      let node = multiplicative();
      while (peek() && (peek().value === '+' || peek().value === '-')) {
        const op = consume().value;
        const right = multiplicative();
        node = { type: 'BINARY_OP', op, left: node, right };
      }
      return node;
    }

    function multiplicative() {
      let node = power();
      while (peek() && (peek().value === '*' || peek().value === '/' || peek().value === '%')) {
        const op = consume().value;
        const right = power();
        node = { type: 'BINARY_OP', op, left: node, right };
      }
      return node;
    }

    function power() {
      let node = unary();
      while (peek() && peek().value === '^') {
        consume('^');
        const right = unary();
        node = { type: 'BINARY_OP', op: '^', left: node, right };
      }
      return node;
    }

    function unary() {
      if (peek() && peek().value === '-') {
        consume('-');
        return { type: 'UNARY_OP', op: '-', operand: unary() };
      }
      if (peek() && peek().value === '+') {
        consume('+');
        return unary();
      }
      return primary();
    }

    function primary() {
      const tok = peek();
      if (!tok) throw new Error('Unexpected end of formula');

      if (tok.type === 'NUMBER') {
        consume();
        return { type: 'NUMBER', value: tok.value };
      }

      if (tok.type === 'IDENTIFIER') {
        consume();
        const name = tok.value;

        // Function calls
        if (peek() && peek().value === '(') {
          consume('(');
          const args = [];
          if (peek() && peek().value !== ')') {
            args.push(expression());
            while (peek() && peek().value === ',') {
              consume(',');
              args.push(expression());
            }
          }
          consume(')');
          return { type: 'FUNCTION_CALL', name, args };
        }

        // Constants
        if (name === 'pi') return { type: 'NUMBER', value: Math.PI };
        if (name === 'e') return { type: 'NUMBER', value: Math.E };

        return { type: 'VARIABLE', name };
      }

      if (tok.value === '(') {
        consume('(');
        const node = expression();
        consume(')');
        return node;
      }

      throw new Error(`Unexpected token '${tok.value}'`);
    }

    const ast = expression();
    if (current < tokens.length) {
      throw new Error(`Unexpected token '${tokens[current].value}'`);
    }
    return ast;
  }

  /**
   * Compiles AST into a safe, ultra-fast JavaScript code string without allocations.
   */
  static astToCode(node) {
    const validVars = new Set(['x', 'y', 'z', 't', 'a', 'b', 'c', 'd', 'sigma', 'rho', 'beta']);
    const allowedMathFns = new Set([
      'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
      'sinh', 'cosh', 'tanh', 'exp', 'log', 'log10', 'sqrt',
      'cbrt', 'abs', 'floor', 'ceil', 'round', 'min', 'max', 'sign', 'pow'
    ]);

    switch (node.type) {
      case 'NUMBER':
        return `${Number(node.value)}`;

      case 'VARIABLE':
        if (validVars.has(node.name)) {
          return node.name;
        }
        return `(params.${node.name} !== undefined ? params.${node.name} : 0)`;

      case 'UNARY_OP':
        return `(-(${this.astToCode(node.operand)}))`;

      case 'BINARY_OP': {
        const l = this.astToCode(node.left);
        const r = this.astToCode(node.right);
        switch (node.op) {
          case '+': return `(${l} + ${r})`;
          case '-': return `(${l} - ${r})`;
          case '*': return `(${l} * ${r})`;
          case '/': return `(${l} / (${r} || 1e-10))`;
          case '%': return `(${l} % ${r})`;
          case '^': return `Math.pow(${l}, ${r})`;
          default: throw new Error(`Unknown operator ${node.op}`);
        }
      }

      case 'FUNCTION_CALL': {
        const fnName = node.name;
        if (!allowedMathFns.has(fnName)) {
          throw new Error(`Disallowed function: '${fnName}'`);
        }
        const argsCode = node.args.map(a => this.astToCode(a)).join(', ');
        return `Math.${fnName}(${argsCode})`;
      }

      default:
        throw new Error(`Unknown AST node type: ${node.type}`);
    }
  }

  /**
   * Safely compiles a formula into a zero-allocation machine-speed function.
   * @param {string} formulaStr
   * @returns {Function} (x, y, z, t, a, b, c, d, params) => number
   */
  static compile(formulaStr) {
    const tokens = this.tokenize(formulaStr);
    const ast = this.parse(tokens);
    const code = this.astToCode(ast);

    // Construct high-speed isolated evaluator function
    // Signature: (x, y, z, t, a, b, c, d, params)
    const compiledFn = new Function('x', 'y', 'z', 't', 'a', 'b', 'c', 'd', 'params', `
      "use strict";
      return ${code};
    `);

    return compiledFn;
  }
}
