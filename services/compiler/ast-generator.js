/**
 * Authentic C Abstract Syntax Tree (AST) Generator
 * Parses C tokens according to ISO C grammar rules into an interactive AST.
 */

const tokenAnalyzer = require('./token-analyzer');

class AstParser {
  constructor(tokens, sourceCode) {
    // Filter out comments and preprocessor directives for syntax parsing
    this.tokens = tokens.filter((t) => t.type !== 'COMMENT' && t.type !== 'PREPROCESSOR');
    this.allTokens = tokens;
    this.sourceCode = sourceCode;
    this.pos = 0;
    this.errors = [];
  }

  peek(offset = 0) {
    if (this.pos + offset < this.tokens.length) {
      return this.tokens[this.pos + offset];
    }
    return { type: 'EOF', value: '', line: 9999, column: 1 };
  }

  next() {
    const t = this.peek();
    this.pos++;
    return t;
  }

  match(type, value = null) {
    const t = this.peek();
    if (t.type === type && (value === null || t.value === value)) {
      return this.next();
    }
    return null;
  }

  expect(type, value = null, context = '') {
    const t = this.match(type, value);
    if (!t) {
      const current = this.peek();
      const expectedStr = value ? `'${value}'` : type;
      const err = `Expected ${expectedStr}${context ? ` in ${context}` : ''}, but found '${current.value}' at line ${current.line}, col ${current.column}`;
      this.errors.push({
        message: err,
        line: current.line,
        column: current.column,
      });
      return null;
    }
    return t;
  }

  isTypeSpecifier(token) {
    if (!token) return false;
    const types = ['void', 'char', 'short', 'int', 'long', 'float', 'double', 'signed', 'unsigned', 'bool', '_Bool', 'struct', 'union', 'enum', 'auto', 'const'];
    return (token.type === 'KEYWORD' && types.includes(token.value)) || (token.type === 'IDENTIFIER' && token.value.endsWith('_t'));
  }

  parse() {
    const root = {
      type: 'TranslationUnit',
      name: 'Source File',
      startLine: 1,
      startCol: 1,
      endLine: 1,
      endCol: 1,
      children: [],
      explanation: 'Root container representing the entire C translation unit after preprocessing.',
      producingTool: 'c-visualize-ast-engine (ISO C Frontend)',
    };

    while (this.pos < this.tokens.length) {
      try {
        const node = this.parseExternalDeclaration();
        if (node) {
          root.children.push(node);
          if (node.endLine > root.endLine) root.endLine = node.endLine;
        } else {
          // Advance on unparseable token to prevent infinite loop
          this.pos++;
        }
      } catch (err) {
        this.errors.push({ message: err.message, line: this.peek().line, column: this.peek().column });
        this.pos++;
      }
    }

    return {
      ast: root,
      errors: this.errors,
      producingTool: 'c-visualize-ast-engine (C Grammar Frontend)',
      status: this.errors.length === 0 ? 'success' : 'partial',
    };
  }

  parseExternalDeclaration() {
    const startToken = this.peek();

    // Check for type specifier
    if (this.isTypeSpecifier(startToken)) {
      let returnType = this.next().value;
      
      // Handle struct/union/enum
      if (['struct', 'union', 'enum'].includes(returnType) && this.peek().type === 'IDENTIFIER') {
        returnType += ' ' + this.next().value;
      }

      // Handle pointers (e.g. char*, int**)
      while (this.peek().value === '*') {
        returnType += this.next().value;
      }

      const identToken = this.match('IDENTIFIER');
      if (!identToken) {
        // Struct definition without variable or semicolon
        if (this.peek().value === '{') {
          return this.parseCompoundStatement();
        }
        if (this.peek().value === ';') {
          this.next();
          return {
            type: 'TypeDeclaration',
            name: returnType,
            startLine: startToken.line,
            startCol: startToken.column,
            endLine: startToken.line,
            endCol: startToken.column + returnType.length,
            children: [],
            explanation: `Type declaration '${returnType}'`,
          };
        }
        return null;
      }

      // Check if function definition / declaration: ident followed by '('
      if (this.peek().value === '(') {
        return this.parseFunctionDefinition(returnType, identToken);
      }

      // Variable declaration at file scope
      return this.parseVariableDeclarationTail(returnType, identToken);
    }

    // Direct statement or unrecognized construct
    return null;
  }

  parseFunctionDefinition(returnType, identToken) {
    this.next(); // Consume '('
    const params = [];
    while (this.peek().value !== ')' && this.peek().type !== 'EOF') {
      if (this.peek().value === 'void' && this.peek(1).value === ')') {
        this.next();
        break;
      }
      if (this.isTypeSpecifier(this.peek())) {
        let pType = this.next().value;
        while (this.peek().value === '*') pType += this.next().value;
        const pName = this.peek().type === 'IDENTIFIER' ? this.next().value : '';
        // array parameters e.g. int arr[]
        let isArray = false;
        if (this.peek().value === '[') {
          this.next();
          if (this.peek().value === ']') this.next();
          isArray = true;
        }
        params.push({
          type: 'Parameter',
          paramType: pType + (isArray ? '[]' : ''),
          name: pName || '(unnamed)',
          startLine: identToken.line,
          startCol: identToken.column,
          endLine: identToken.line,
          endCol: identToken.column,
          explanation: `Function argument '${pName || 'arg'}' of type '${pType}'`,
        });
      }
      if (this.peek().value === ',') {
        this.next();
      } else {
        break;
      }
    }
    this.expect('PUNCTUATION', ')', 'parameter list');

    // If followed by ';', it is a function prototype declaration
    if (this.peek().value === ';') {
      const semi = this.next();
      return {
        type: 'FunctionDeclaration',
        name: identToken.value,
        returnType,
        parameters: params,
        startLine: identToken.line,
        startCol: identToken.column,
        endLine: semi.line,
        endCol: semi.column,
        children: params,
        explanation: `Function prototype declaration for '${identToken.value}' returning '${returnType}'`,
      };
    }

    // Otherwise it is a function definition with body
    if (this.peek().value === '{') {
      const body = this.parseCompoundStatement();
      return {
        type: 'FunctionDefinition',
        name: identToken.value,
        returnType,
        parameters: params,
        startLine: identToken.line,
        startCol: identToken.column,
        endLine: body.endLine,
        endCol: body.endCol,
        children: [
          {
            type: 'ParameterList',
            name: `Parameters (${params.length})`,
            children: params,
            startLine: identToken.line,
            startCol: identToken.column,
            endLine: identToken.line,
            endCol: identToken.column,
            explanation: `Formal parameter list for function '${identToken.value}'`,
          },
          body,
        ],
        explanation: `Definition of function '${identToken.value}' returning '${returnType}' with stack frame setup.`,
      };
    }

    return null;
  }

  parseCompoundStatement() {
    const openBrace = this.expect('PUNCTUATION', '{', 'block');
    const startLine = openBrace ? openBrace.line : this.peek().line;
    const startCol = openBrace ? openBrace.column : this.peek().column;
    const statements = [];

    while (this.peek().value !== '}' && this.peek().type !== 'EOF') {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      } else {
        this.pos++;
      }
    }

    const closeBrace = this.match('PUNCTUATION', '}');
    const endLine = closeBrace ? closeBrace.line : startLine;
    const endCol = closeBrace ? closeBrace.column : startCol;

    return {
      type: 'CompoundStatement',
      name: `Block { ... } (${statements.length} statements)`,
      startLine,
      startCol,
      endLine,
      endCol,
      children: statements,
      explanation: 'A compound statement creating a local scope for variable lifetimes.',
    };
  }

  parseStatement() {
    const token = this.peek();

    // Nested block { ... }
    if (token.value === '{') {
      return this.parseCompoundStatement();
    }

    // Return statement
    if (token.type === 'KEYWORD' && token.value === 'return') {
      const retToken = this.next();
      let expr = null;
      if (this.peek().value !== ';') {
        expr = this.parseExpression();
      }
      const semi = this.match('PUNCTUATION', ';');
      return {
        type: 'ReturnStatement',
        name: `return`,
        startLine: retToken.line,
        startCol: retToken.column,
        endLine: semi ? semi.line : (expr ? expr.endLine : retToken.line),
        endCol: semi ? semi.column : (expr ? expr.endCol : retToken.column + 6),
        children: expr ? [expr] : [],
        explanation: 'Exits current function and passes return value back in %rax/%eax register.',
      };
    }

    // If statement
    if (token.type === 'KEYWORD' && token.value === 'if') {
      const ifToken = this.next();
      this.expect('PUNCTUATION', '(', 'if condition');
      const condition = this.parseExpression();
      this.expect('PUNCTUATION', ')', 'if condition');
      const thenBranch = this.parseStatement();
      let elseBranch = null;
      if (this.peek().value === 'else') {
        this.next(); // consume 'else'
        elseBranch = this.parseStatement();
      }
      return {
        type: 'IfStatement',
        name: 'if (...)',
        startLine: ifToken.line,
        startCol: ifToken.column,
        endLine: elseBranch ? elseBranch.endLine : (thenBranch ? thenBranch.endLine : ifToken.line),
        endCol: elseBranch ? elseBranch.endCol : (thenBranch ? thenBranch.endCol : ifToken.column),
        children: [
          { type: 'Condition', name: 'Test Condition', children: condition ? [condition] : [] },
          { type: 'ThenBranch', name: 'Then Block', children: thenBranch ? [thenBranch] : [] },
          ...(elseBranch ? [{ type: 'ElseBranch', name: 'Else Block', children: [elseBranch] }] : []),
        ],
        explanation: 'Conditional branch statement generating conditional jump instructions (je, jne).',
      };
    }

    // While loop
    if (token.type === 'KEYWORD' && token.value === 'while') {
      const whileToken = this.next();
      this.expect('PUNCTUATION', '(', 'while condition');
      const condition = this.parseExpression();
      this.expect('PUNCTUATION', ')', 'while condition');
      const body = this.parseStatement();
      return {
        type: 'WhileStatement',
        name: 'while (...)',
        startLine: whileToken.line,
        startCol: whileToken.column,
        endLine: body ? body.endLine : whileToken.line,
        endCol: body ? body.endCol : whileToken.column,
        children: [
          { type: 'Condition', name: 'Loop Condition', children: condition ? [condition] : [] },
          { type: 'Body', name: 'Loop Body', children: body ? [body] : [] },
        ],
        explanation: 'While loop testing condition before every iteration.',
      };
    }

    // For loop
    if (token.type === 'KEYWORD' && token.value === 'for') {
      const forToken = this.next();
      this.expect('PUNCTUATION', '(', 'for init');
      let init = null;
      if (this.isTypeSpecifier(this.peek())) {
        const t = this.next().value;
        const id = this.next();
        init = this.parseVariableDeclarationTail(t, id);
      } else if (this.peek().value !== ';') {
        init = this.parseExpression();
        this.match('PUNCTUATION', ';');
      } else {
        this.match('PUNCTUATION', ';');
      }

      let test = null;
      if (this.peek().value !== ';') {
        test = this.parseExpression();
      }
      this.match('PUNCTUATION', ';');

      let update = null;
      if (this.peek().value !== ')') {
        update = this.parseExpression();
      }
      this.expect('PUNCTUATION', ')', 'for header');

      const body = this.parseStatement();

      return {
        type: 'ForStatement',
        name: 'for (...)',
        startLine: forToken.line,
        startCol: forToken.column,
        endLine: body ? body.endLine : forToken.line,
        endCol: body ? body.endCol : forToken.column,
        children: [
          { type: 'Init', name: 'Initialization', children: init ? [init] : [] },
          { type: 'Condition', name: 'Loop Test', children: test ? [test] : [] },
          { type: 'Update', name: 'Step Update', children: update ? [update] : [] },
          { type: 'Body', name: 'Loop Body', children: body ? [body] : [] },
        ],
        explanation: 'For loop iterating through initialization, test, step update, and body.',
      };
    }

    // Variable declaration inside block
    if (this.isTypeSpecifier(token)) {
      let vType = this.next().value;
      while (this.peek().value === '*') vType += this.next().value;
      const vIdent = this.match('IDENTIFIER');
      if (vIdent) {
        return this.parseVariableDeclarationTail(vType, vIdent);
      }
    }

    // Expression statement
    const expr = this.parseExpression();
    if (expr) {
      const semi = this.match('PUNCTUATION', ';');
      return {
        type: 'ExpressionStatement',
        name: `Expression: ${expr.name || expr.value || ''}`,
        startLine: expr.startLine,
        startCol: expr.startCol,
        endLine: semi ? semi.line : expr.endLine,
        endCol: semi ? semi.column : expr.endCol,
        children: [expr],
        explanation: 'Evaluation of expression for side-effects followed by semicolon.',
      };
    }

    // Empty statement ';'
    if (token.value === ';') {
      const semi = this.next();
      return {
        type: 'EmptyStatement',
        name: '; (Empty)',
        startLine: semi.line,
        startCol: semi.column,
        endLine: semi.line,
        endCol: semi.column,
        children: [],
        explanation: 'Empty null statement.',
      };
    }

    return null;
  }

  parseVariableDeclarationTail(varType, identToken) {
    let arraySize = null;
    if (this.peek().value === '[') {
      this.next();
      if (this.peek().value !== ']') {
        arraySize = this.parseExpression();
      }
      this.expect('PUNCTUATION', ']', 'array dimension');
    }

    let initializer = null;
    if (this.peek().value === '=') {
      this.next(); // consume '='
      initializer = this.parseExpression();
    }

    // Support comma separated variables e.g. int a = 1, b = 2;
    const additionalVars = [];
    while (this.peek().value === ',') {
      this.next();
      let nextType = varType;
      while (this.peek().value === '*') nextType += this.next().value;
      const nextId = this.match('IDENTIFIER');
      if (nextId) {
        let nextInit = null;
        if (this.peek().value === '=') {
          this.next();
          nextInit = this.parseExpression();
        }
        additionalVars.push({
          type: 'VariableDeclaration',
          name: nextId.value,
          varType: nextType,
          children: nextInit ? [nextInit] : [],
          startLine: nextId.line,
          startCol: nextId.column,
          endLine: nextInit ? nextInit.endLine : nextId.line,
          endCol: nextInit ? nextInit.endCol : nextId.column + nextId.value.length,
          explanation: `Declaration of variable '${nextId.value}' of type '${nextType}'`,
        });
      }
    }

    const semi = this.match('PUNCTUATION', ';');
    const primaryNode = {
      type: 'VariableDeclaration',
      name: `${varType} ${identToken.value}${arraySize ? '[]' : ''}`,
      identifier: identToken.value,
      varType: varType + (arraySize ? '[]' : ''),
      startLine: identToken.line,
      startCol: identToken.column,
      endLine: semi ? semi.line : (initializer ? initializer.endLine : identToken.line),
      endCol: semi ? semi.column : (initializer ? initializer.endCol : identToken.column),
      children: initializer ? [initializer] : [],
      explanation: `Allocates stack memory for variable '${identToken.value}' of type '${varType}'.`,
    };

    if (additionalVars.length > 0) {
      return {
        type: 'DeclarationList',
        name: `Declarations (${1 + additionalVars.length})`,
        startLine: primaryNode.startLine,
        startCol: primaryNode.startCol,
        endLine: semi ? semi.line : primaryNode.endLine,
        endCol: semi ? semi.column : primaryNode.endCol,
        children: [primaryNode, ...additionalVars],
        explanation: 'Multiple variable declarations in a single statement.',
      };
    }

    return primaryNode;
  }

  parseExpression() {
    return this.parseAssignment();
  }

  parseAssignment() {
    let left = this.parseLogicalOr();
    if (this.peek().value === '=' || ['+=', '-=', '*=', '/=', '%='].includes(this.peek().value)) {
      const opToken = this.next();
      const right = this.parseAssignment();
      return {
        type: 'AssignmentExpression',
        name: `${opToken.value}`,
        operator: opToken.value,
        startLine: left.startLine,
        startCol: left.startCol,
        endLine: right ? right.endLine : opToken.line,
        endCol: right ? right.endCol : opToken.column,
        children: [left, right],
        explanation: `Assignment operator '${opToken.value}' writes computed right-hand value into left-hand memory location.`,
      };
    }
    return left;
  }

  parseLogicalOr() {
    let left = this.parseLogicalAnd();
    while (this.peek().value === '||') {
      const op = this.next();
      const right = this.parseLogicalAnd();
      left = {
        type: 'BinaryExpression',
        name: '||',
        operator: '||',
        startLine: left.startLine,
        startCol: left.startCol,
        endLine: right ? right.endLine : op.line,
        endCol: right ? right.endCol : op.column,
        children: [left, right],
        explanation: 'Short-circuit logical OR operation.',
      };
    }
    return left;
  }

  parseLogicalAnd() {
    let left = this.parseEquality();
    while (this.peek().value === '&&') {
      const op = this.next();
      const right = this.parseEquality();
      left = {
        type: 'BinaryExpression',
        name: '&&',
        operator: '&&',
        startLine: left.startLine,
        startCol: left.startCol,
        endLine: right ? right.endLine : op.line,
        endCol: right ? right.endCol : op.column,
        children: [left, right],
        explanation: 'Short-circuit logical AND operation.',
      };
    }
    return left;
  }

  parseEquality() {
    let left = this.parseRelational();
    while (['==', '!='].includes(this.peek().value)) {
      const op = this.next();
      const right = this.parseRelational();
      left = {
        type: 'BinaryExpression',
        name: op.value,
        operator: op.value,
        startLine: left.startLine,
        startCol: left.startCol,
        endLine: right ? right.endLine : op.line,
        endCol: right ? right.endCol : op.column,
        children: [left, right],
        explanation: `Equality check operator '${op.value}'.`,
      };
    }
    return left;
  }

  parseRelational() {
    let left = this.parseAdditive();
    while (['<', '>', '<=', '>='].includes(this.peek().value)) {
      const op = this.next();
      const right = this.parseAdditive();
      left = {
        type: 'BinaryExpression',
        name: op.value,
        operator: op.value,
        startLine: left.startLine,
        startCol: left.startCol,
        endLine: right ? right.endLine : op.line,
        endCol: right ? right.endCol : op.column,
        children: [left, right],
        explanation: `Relational comparison operator '${op.value}'.`,
      };
    }
    return left;
  }

  parseAdditive() {
    let left = this.parseMultiplicative();
    while (['+', '-'].includes(this.peek().value)) {
      const op = this.next();
      const right = this.parseMultiplicative();
      left = {
        type: 'BinaryExpression',
        name: op.value,
        operator: op.value,
        startLine: left.startLine,
        startCol: left.startCol,
        endLine: right ? right.endLine : op.line,
        endCol: right ? right.endCol : op.column,
        children: [left, right],
        explanation: `Arithmetic operation '${op.value}'.`,
      };
    }
    return left;
  }

  parseMultiplicative() {
    let left = this.parseUnary();
    while (['*', '/', '%'].includes(this.peek().value)) {
      const op = this.next();
      const right = this.parseUnary();
      left = {
        type: 'BinaryExpression',
        name: op.value,
        operator: op.value,
        startLine: left.startLine,
        startCol: left.startCol,
        endLine: right ? right.endLine : op.line,
        endCol: right ? right.endCol : op.column,
        children: [left, right],
        explanation: `Multiplicative arithmetic operation '${op.value}'.`,
      };
    }
    return left;
  }

  parseUnary() {
    const t = this.peek();
    if (['!', '~', '+', '-', '++', '--', '*', '&', 'sizeof'].includes(t.value)) {
      const op = this.next();
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        name: `${op.value} (unary)`,
        operator: op.value,
        startLine: op.line,
        startCol: op.column,
        endLine: operand ? operand.endLine : op.line,
        endCol: operand ? operand.endCol : op.column,
        children: operand ? [operand] : [],
        explanation: `Unary operation '${op.value}' evaluated on operand.`,
      };
    }
    return this.parsePostfix();
  }

  parsePostfix() {
    let expr = this.parsePrimary();

    while (true) {
      // Function call: expr ( args )
      if (this.peek().value === '(') {
        this.next(); // consume '('
        const args = [];
        while (this.peek().value !== ')' && this.peek().type !== 'EOF') {
          const arg = this.parseExpression();
          if (arg) args.push(arg);
          if (this.peek().value === ',') {
            this.next();
          } else {
            break;
          }
        }
        const closeParen = this.expect('PUNCTUATION', ')', 'argument list');
        expr = {
          type: 'FunctionCall',
          name: `${expr.name || 'func'}(...)`,
          callee: expr,
          startLine: expr.startLine,
          startCol: expr.startCol,
          endLine: closeParen ? closeParen.line : expr.endLine,
          endCol: closeParen ? closeParen.column : expr.endCol,
          children: [expr, ...args],
          explanation: `Function call invocation passing ${args.length} argument(s) via calling convention.`,
        };
        continue;
      }

      // Array subscript: expr [ index ]
      if (this.peek().value === '[') {
        this.next();
        const index = this.parseExpression();
        const closeBracket = this.expect('PUNCTUATION', ']', 'array subscript');
        expr = {
          type: 'ArraySubscript',
          name: `${expr.name || 'arr'}[...]`,
          startLine: expr.startLine,
          startCol: expr.startCol,
          endLine: closeBracket ? closeBracket.line : expr.endLine,
          endCol: closeBracket ? closeBracket.column : expr.endCol,
          children: [expr, index],
          explanation: 'Array subscript indexing computing base address + index * sizeof(element).',
        };
        continue;
      }

      // Member access: expr.member or expr->member
      if (this.peek().value === '.' || this.peek().value === '->') {
        const op = this.next();
        const member = this.match('IDENTIFIER');
        expr = {
          type: 'MemberAccess',
          name: `${op.value}${member ? member.value : ''}`,
          operator: op.value,
          startLine: expr.startLine,
          startCol: expr.startCol,
          endLine: member ? member.line : op.line,
          endCol: member ? member.column + member.value.length : op.column,
          children: [expr],
          explanation: `Access struct/union field '${member ? member.value : ''}' with byte offset.`,
        };
        continue;
      }

      // Postfix ++ / --
      if (this.peek().value === '++' || this.peek().value === '--') {
        const op = this.next();
        expr = {
          type: 'PostfixExpression',
          name: op.value,
          operator: op.value,
          startLine: expr.startLine,
          startCol: expr.startCol,
          endLine: op.line,
          endCol: op.column + 2,
          children: [expr],
          explanation: `Postfix increment/decrement yielding old value then modifying variable.`,
        };
        continue;
      }

      break;
    }

    return expr;
  }

  parsePrimary() {
    const t = this.peek();

    // Parenthesized expression ( expr )
    if (t.value === '(') {
      this.next();
      const inner = this.parseExpression();
      this.expect('PUNCTUATION', ')', 'parentheses');
      return inner;
    }

    // Literals (numbers, strings, characters)
    if (t.type === 'NUMERIC_CONSTANT' || t.type === 'STRING_LITERAL' || t.type === 'CHAR_LITERAL') {
      const lit = this.next();
      return {
        type: 'Literal',
        literalType: lit.type,
        name: `${lit.value}`,
        value: lit.value,
        startLine: lit.line,
        startCol: lit.column,
        endLine: lit.line,
        endCol: lit.column + lit.length,
        children: [],
        explanation: `Literal constant '${lit.value}'.`,
      };
    }

    // Identifiers (variable, function name)
    if (t.type === 'IDENTIFIER') {
      const id = this.next();
      return {
        type: 'Identifier',
        name: id.value,
        startLine: id.line,
        startCol: id.column,
        endLine: id.line,
        endCol: id.column + id.length,
        children: [],
        explanation: `Identifier symbol reference '${id.value}'.`,
      };
    }

    return null;
  }
}

class AstGenerator {
  generate(sourceCode) {
    const tokenResult = tokenAnalyzer.analyze(sourceCode);
    const parser = new AstParser(tokenResult.tokens, sourceCode);
    return parser.parse();
  }
}

module.exports = new AstGenerator();
