/**
 * Safe Mathematical Expression Lexer, AST Parser & Fast Native Code Compiler
 * Supports Standard ASCII formulas and LaTeX strings from visual math fields.
 */

const ALLOWED_MATH_FNS = new Set([
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'exp', 'log', 'log10', 'sqrt',
  'cbrt', 'abs', 'floor', 'ceil', 'round', 'min', 'max', 'sign', 'pow'
]);

export class MathParser {
  /**
   * Converts LaTeX syntax (from MathLive) into standard parsable math expression.
   */
  static latexToExpression(latex) {
    if (!latex) return '0';
    let s = latex.trim();

    // 1. Remove LaTeX spacing and delimiters
    s = s.replace(/\\left/g, '').replace(/\\right/g, '');
    s = s.replace(/\\,/g, ' ').replace(/\\;/g, ' ').replace(/\\quad/g, ' ').replace(/\\!/g, '');
    s = s.replace(/\\lvert/g, '|').replace(/\\rvert/g, '|');

    // 2. Handle wrappers: \operatorname{...}, \text{...}, \mathrm{...}
    s = s.replace(/\\operatorname\{([^}]+)\}/g, '$1');
    s = s.replace(/\\text\{([^}]+)\}/g, '$1');
    s = s.replace(/\\mathrm\{([^}]+)\}/g, '$1');

    // 3. Handle trig powers: \sin^2(x) -> (sin(x))^2
    s = s.replace(/\\(sin|cos|tan|asin|acos|atan|sinh|cosh|tanh)\^([0-9]+|\{[0-9]+\})\s*(\([^)]+\)|[a-zA-Z0-9]+)/g, '($1($3))^$2');

    // 4. Normalize multiplication and constants
    s = s.replace(/\\cdot/g, '*').replace(/\\times/g, '*');
    s = s.replace(/\\pi/g, 'pi');
    s = s.replace(/\\theta/g, 'theta');

    // 5. Convert |A| to abs(A)
    const barCount = (s.match(/\|/g) || []).length;
    if (barCount >= 2 && barCount % 2 === 0) {
      s = s.replace(/\|([^|]+)\|/g, 'abs($1)');
    }

    // 6. Convert \frac{A}{B} recursively
    while (s.includes('\\frac')) {
      const fracIdx = s.indexOf('\\frac');
      const firstOpen = s.indexOf('{', fracIdx);
      if (firstOpen === -1) break;

      const firstClose = this.findMatchingBrace(s, firstOpen);
      if (firstClose === -1) break;

      const secondOpen = s.indexOf('{', firstClose);
      if (secondOpen === -1 || secondOpen !== firstClose + 1) break;

      const secondClose = this.findMatchingBrace(s, secondOpen);
      if (secondClose === -1) break;

      const num = s.slice(firstOpen + 1, firstClose);
      const den = s.slice(secondOpen + 1, secondClose);
      s = s.slice(0, fracIdx) + `((${num}) / (${den}))` + s.slice(secondClose + 1);
    }

    // 7. Convert \sqrt{A} recursively
    while (s.includes('\\sqrt')) {
      const sqrtIdx = s.indexOf('\\sqrt');
      const firstOpen = s.indexOf('{', sqrtIdx);
      if (firstOpen === -1) break;

      const firstClose = this.findMatchingBrace(s, firstOpen);
      if (firstClose === -1) break;

      const inner = s.slice(firstOpen + 1, firstClose);
      s = s.slice(0, sqrtIdx) + `sqrt(${inner})` + s.slice(firstClose + 1);
    }

    // 8. Replace standard LaTeX math functions
    const fnMap = {
      '\\arcsin': 'asin', '\\arccos': 'acos', '\\arctan': 'atan',
      '\\asin': 'asin', '\\acos': 'acos', '\\atan': 'atan',
      '\\sinh': 'sinh', '\\cosh': 'cosh', '\\tanh': 'tanh',
      '\\sin': 'sin', '\\cos': 'cos', '\\tan': 'tan',
      '\\log': 'log10', '\\ln': 'log', '\\exp': 'exp',
      '\\abs': 'abs', '\\min': 'min', '\\max': 'max',
      '\\sgn': 'sign', '\\sign': 'sign'
    };

    for (const [tex, fn] of Object.entries(fnMap)) {
      s = s.split(tex).join(fn);
    }

    // 9. Convert remaining curly braces to parentheses
    s = s.replace(/\{/g, '(').replace(/\}/g, ')');

    // 10. Remove any leftover backslashes
    s = s.replace(/\\/g, '');

    return s;
  }

  static findMatchingBrace(str, openIdx) {
    let depth = 0;
    for (let i = openIdx; i < str.length; i++) {
      if (str[i] === '{') depth++;
      else if (str[i] === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
    return -1;
  }

  /**
   * Tokenizes a mathematical string with automatic implicit multiplication insertion.
   */
  static tokenize(input) {
    const rawTokens = [];
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
        rawTokens.push({ type: 'NUMBER', value: parseFloat(numStr) });
        continue;
      }

      if (/[a-zA-Z_]/.test(char)) {
        let ident = '';
        while (i < clean.length && /[a-zA-Z0-9_]/.test(clean[i])) {
          ident += clean[i++];
        }
        rawTokens.push({ type: 'IDENTIFIER', value: ident });
        continue;
      }

      if ('+-*/^%(),'.includes(char)) {
        rawTokens.push({ type: 'OPERATOR', value: char });
        i++;
        continue;
      }

      throw new Error(`Unexpected character in formula: '${char}' at index ${i}`);
    }

    // Insert implicit multiplication operators between adjacent tokens
    const tokens = [];
    for (let j = 0; j < rawTokens.length; j++) {
      const curr = rawTokens[j];
      tokens.push(curr);

      if (j < rawTokens.length - 1) {
        const next = rawTokens[j + 1];

        // 1. Number followed by Identifier or '(' (e.g. 2x, 2(x))
        if (curr.type === 'NUMBER' && (next.type === 'IDENTIFIER' || (next.type === 'OPERATOR' && next.value === '('))) {
          tokens.push({ type: 'OPERATOR', value: '*' });
        }
        // 2. ')' followed by Number, Identifier, or '(' (e.g. (x)(y), (x)2, (x)y)
        else if (curr.type === 'OPERATOR' && curr.value === ')' && (next.type === 'NUMBER' || next.type === 'IDENTIFIER' || (next.type === 'OPERATOR' && next.value === '('))) {
          tokens.push({ type: 'OPERATOR', value: '*' });
        }
        // 3. Identifier (NOT a math function) followed by '(' (e.g. x(1-x), a(x+y))
        else if (curr.type === 'IDENTIFIER' && !ALLOWED_MATH_FNS.has(curr.value.toLowerCase()) && (next.type === 'OPERATOR' && next.value === '(')) {
          tokens.push({ type: 'OPERATOR', value: '*' });
        }
        // 4. Single-letter variables followed by another Identifier or Number (e.g. a b, x 2)
        else if (curr.type === 'IDENTIFIER' && curr.value.length === 1 && !ALLOWED_MATH_FNS.has(curr.value.toLowerCase()) && (next.type === 'IDENTIFIER' || next.type === 'NUMBER')) {
          tokens.push({ type: 'OPERATOR', value: '*' });
        }
      }
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
      if (peek() && peek().value === '^') {
        consume('^');
        const right = power(); // Right-associative via recursion
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
        if (ALLOWED_MATH_FNS.has(name.toLowerCase()) && peek() && peek().value === '(') {
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
          return { type: 'FUNCTION_CALL', name: name.toLowerCase(), args };
        }

        // Constants
        if (name.toLowerCase() === 'pi') return { type: 'NUMBER', value: Math.PI };
        if (name.toLowerCase() === 'e') return { type: 'NUMBER', value: Math.E };

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
   * Scans AST and extracts all free parameter variables (excluding coordinates x, y, z, t).
   */
  static extractVariables(node, vars = new Set()) {
    if (!node) return vars;
    const reserved = new Set(['x', 'y', 'z', 't', 'pi', 'e']);

    if (node.type === 'VARIABLE') {
      if (!reserved.has(node.name.toLowerCase())) {
        vars.add(node.name);
      }
    } else if (node.type === 'BINARY_OP') {
      this.extractVariables(node.left, vars);
      this.extractVariables(node.right, vars);
    } else if (node.type === 'UNARY_OP') {
      this.extractVariables(node.operand, vars);
    } else if (node.type === 'FUNCTION_CALL') {
      if (node.args) {
        node.args.forEach(arg => this.extractVariables(arg, vars));
      }
    }

    return vars;
  }

  /**
   * Compiles AST into safe, high-performance JavaScript code.
   */
  static astToCode(node, declaredLocals = new Set()) {
    const validCoordVars = new Set(['x', 'y', 'z', 't']);

    switch (node.type) {
      case 'NUMBER':
        return `${Number(node.value)}`;

      case 'VARIABLE': {
        const lower = node.name.toLowerCase();
        if (validCoordVars.has(lower) || declaredLocals.has(node.name) || declaredLocals.has(lower)) {
          return lower;
        }
        return `(params.${node.name} !== undefined ? params.${node.name} : (params.${lower} !== undefined ? params.${lower} : 1))`;
      }

      case 'UNARY_OP':
        return `(-(${this.astToCode(node.operand, declaredLocals)}))`;

      case 'BINARY_OP': {
        const l = this.astToCode(node.left, declaredLocals);
        const r = this.astToCode(node.right, declaredLocals);
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
        if (!ALLOWED_MATH_FNS.has(fnName)) {
          throw new Error(`Disallowed function: '${fnName}'`);
        }
        const argsCode = node.args.map(a => this.astToCode(a, declaredLocals)).join(', ');
        return `Math.${fnName}(${argsCode})`;
      }

      default:
        throw new Error(`Unknown AST node type: ${node.type}`);
    }
  }

  /**
   * Compiles formula string (LaTeX or standard math) into executable JS function.
   * Signature: (x, y, z, t, params) => number
   */
  static compile(formulaStr) {
    const expr = formulaStr.includes('\\') ? this.latexToExpression(formulaStr) : formulaStr;
    const tokens = this.tokenize(expr);
    const ast = this.parse(tokens);
    const code = this.astToCode(ast);
    const freeVars = Array.from(this.extractVariables(ast));

    const compiledFn = new Function('x', 'y', 'z', 't', 'params', `
      "use strict";
      return ${code};
    `);

    compiledFn.freeVars = freeVars;
    compiledFn.rawExpression = expr;
    return compiledFn;
  }

  /**
   * Compiles an array of multi-line equations into a unified zero-allocation system evaluator.
   * Signature: (x, y, z, t, params) => [nextX, nextY, nextZ]
   */
  static compileSystem(equations) {
    if (!equations || equations.length === 0) {
      throw new Error('At least one equation is required');
    }

    // Validate that targets are unique and core coordinates are present
    const seenTargets = new Set();
    for (const eq of equations) {
      const target = (eq.target || 'x').trim().toLowerCase();
      if (seenTargets.has(target)) {
        throw new Error(`Duplicate equation target '${target}' is not allowed`);
      }
      seenTargets.add(target);
    }

    if (!seenTargets.has('x') || !seenTargets.has('y')) {
      throw new Error("System must define at least 'x' and 'y' coordinates");
    }

    const declaredLocals = new Set(['x', 'y', 'z', 't']);
    const allFreeVars = new Set();
    let codeBody = '';

    for (let i = 0; i < equations.length; i++) {
      const eq = equations[i];
      const target = (eq.target || 'x').trim();
      const rawFormula = eq.latex || eq.formula || '0';
      const expr = rawFormula.includes('\\') ? this.latexToExpression(rawFormula) : rawFormula;

      const tokens = this.tokenize(expr);
      const ast = this.parse(tokens);
      const eqCode = this.astToCode(ast, declaredLocals);

      const freeVars = this.extractVariables(ast);
      for (const v of freeVars) {
        if (!declaredLocals.has(v) && !declaredLocals.has(v.toLowerCase())) {
          allFreeVars.add(v);
        }
      }

      if (target === 'x') {
        codeBody += `  next_x = ${eqCode};\n`;
      } else if (target === 'y') {
        codeBody += `  next_y = ${eqCode};\n`;
      } else if (target === 'z') {
        codeBody += `  next_z = ${eqCode};\n`;
      } else if (declaredLocals.has(target)) {
        codeBody += `  ${target} = ${eqCode};\n`;
      } else {
        codeBody += `  let ${target} = ${eqCode};\n`;
        declaredLocals.add(target);
      }
    }

    const compiledFn = new Function('x', 'y', 'z', '_time', 'params', `
      "use strict";
      let t = _time;
      let next_x = x;
      let next_y = y;
      let next_z = z;
${codeBody}
      return [next_x, next_y, next_z];
    `);

    compiledFn.freeVars = Array.from(allFreeVars);
    compiledFn.hasZ = codeBody.includes('next_z =');
    return compiledFn;
  }
}
