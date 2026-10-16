/**
 * Authentic C Lexical Analyzer (Tokenizer)
 * Accurately analyzes C source code according to ISO C standard tokens.
 */

const KEYWORDS = new Set([
  'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do',
  'double', 'else', 'enum', 'extern', 'float', 'for', 'goto', 'if',
  'inline', 'int', 'long', 'register', 'restrict', 'return', 'short',
  'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union',
  'unsigned', 'void', 'volatile', 'while', '_Bool', '_Complex', '_Imaginary',
  '_Alignas', '_Alignof', '_Atomic', '_Generic', '_Noreturn', '_Static_assert',
  '_Thread_local', 'bool', 'true', 'false', 'typeof', 'constexpr'
]);

const MULTI_CHAR_OPERATORS = [
  '<<=', '>>=', '...', '==', '!=', '<=', '>=', '&&', '||',
  '++', '--', '<<', '>>', '->', '+=', '-=', '*=', '/=',
  '%=', '&=', '^=', '|='
];

const SINGLE_CHAR_OPERATORS = new Set([
  '+', '-', '*', '/', '%', '<', '>', '=', '!', '&', '|', '^', '~', '?'
]);

const PUNCTUATION = new Set([
  ';', '{', '}', '(', ')', '[', ']', ',', '.', ':'
]);

class TokenAnalyzer {
  analyze(sourceCode) {
    const tokens = [];
    let i = 0;
    let line = 1;
    let col = 1;
    const len = sourceCode.length;

    while (i < len) {
      const char = sourceCode[i];

      // Handle newlines
      if (char === '\n') {
        line++;
        col = 1;
        i++;
        continue;
      }
      if (char === '\r') {
        i++;
        continue;
      }

      // Handle whitespace
      if (/\s/.test(char)) {
        col++;
        i++;
        continue;
      }

      // Handle single-line comments //
      if (char === '/' && i + 1 < len && sourceCode[i + 1] === '/') {
        const startCol = col;
        let commentText = '//';
        i += 2;
        col += 2;
        while (i < len && sourceCode[i] !== '\n') {
          commentText += sourceCode[i];
          i++;
          col++;
        }
        tokens.push({
          type: 'COMMENT',
          value: commentText,
          line,
          column: startCol,
          length: commentText.length,
          explanation: 'Single-line comment ignored by the compiler syntax analysis.'
        });
        continue;
      }

      // Handle multi-line comments /* ... */
      if (char === '/' && i + 1 < len && sourceCode[i + 1] === '*') {
        const startLine = line;
        const startCol = col;
        let commentText = '/*';
        i += 2;
        col += 2;
        while (i < len && !(sourceCode[i] === '*' && i + 1 < len && sourceCode[i + 1] === '/')) {
          if (sourceCode[i] === '\n') {
            line++;
            col = 1;
          } else {
            col++;
          }
          commentText += sourceCode[i];
          i++;
        }
        if (i < len) {
          commentText += '*/';
          i += 2;
          col += 2;
        }
        tokens.push({
          type: 'COMMENT',
          value: commentText,
          line: startLine,
          column: startCol,
          length: commentText.length,
          explanation: 'Multi-line block comment ignored by the compiler syntax analysis.'
        });
        continue;
      }

      // Handle Preprocessor Directives (#include, #define, etc.)
      if (char === '#' && (col === 1 || this.isAtLineStart(sourceCode, i))) {
        const startCol = col;
        let directive = '#';
        i++;
        col++;
        while (i < len && /[a-zA-Z0-9_]/.test(sourceCode[i])) {
          directive += sourceCode[i];
          i++;
          col++;
        }
        // Consume the rest of directive line
        while (i < len && sourceCode[i] !== '\n' && sourceCode[i] !== '\r') {
          directive += sourceCode[i];
          i++;
          col++;
        }
        tokens.push({
          type: 'PREPROCESSOR',
          value: directive.trim(),
          line,
          column: startCol,
          length: directive.length,
          explanation: 'Preprocessor command processed before lexical and syntax analysis.'
        });
        continue;
      }

      // Handle String Literals
      if (char === '"') {
        const startCol = col;
        let strVal = '"';
        i++;
        col++;
        let escaped = false;
        while (i < len) {
          const c = sourceCode[i];
          strVal += c;
          i++;
          col++;
          if (escaped) {
            escaped = false;
          } else if (c === '\\') {
            escaped = true;
          } else if (c === '"') {
            break;
          } else if (c === '\n') {
            line++;
            col = 1;
          }
        }
        tokens.push({
          type: 'STRING_LITERAL',
          value: strVal,
          line,
          column: startCol,
          length: strVal.length,
          explanation: 'String constant stored in read-only data section (.rodata/.rdata).'
        });
        continue;
      }

      // Handle Character Literals
      if (char === "'") {
        const startCol = col;
        let charVal = "'";
        i++;
        col++;
        let escaped = false;
        while (i < len) {
          const c = sourceCode[i];
          charVal += c;
          i++;
          col++;
          if (escaped) {
            escaped = false;
          } else if (c === '\\') {
            escaped = true;
          } else if (c === "'") {
            break;
          }
        }
        tokens.push({
          type: 'CHAR_LITERAL',
          value: charVal,
          line,
          column: startCol,
          length: charVal.length,
          explanation: 'Single-character integer constant.'
        });
        continue;
      }

      // Handle Numbers (Integers, Hex, Floats)
      if (/[0-9]/.test(char) || (char === '.' && i + 1 < len && /[0-9]/.test(sourceCode[i + 1]))) {
        const startCol = col;
        let numVal = '';
        const isHex = char === '0' && i + 1 < len && /[xX]/.test(sourceCode[i + 1]);
        if (isHex) {
          numVal += sourceCode[i] + sourceCode[i + 1];
          i += 2;
          col += 2;
          while (i < len && /[0-9a-fA-F_]/.test(sourceCode[i])) {
            numVal += sourceCode[i];
            i++;
            col++;
          }
        } else {
          while (i < len && /[0-9a-zA-Z_.]/.test(sourceCode[i])) {
            numVal += sourceCode[i];
            i++;
            col++;
          }
        }
        tokens.push({
          type: 'NUMERIC_CONSTANT',
          value: numVal,
          line,
          column: startCol,
          length: numVal.length,
          explanation: 'Numeric constant representation in C.'
        });
        continue;
      }

      // Handle Multi-Character Operators
      let matchedMultiOp = false;
      for (const op of MULTI_CHAR_OPERATORS) {
        if (sourceCode.startsWith(op, i)) {
          tokens.push({
            type: 'OPERATOR',
            value: op,
            line,
            column: col,
            length: op.length,
            explanation: `Compound or multi-character C operator '${op}'.`
          });
          i += op.length;
          col += op.length;
          matchedMultiOp = true;
          break;
        }
      }
      if (matchedMultiOp) continue;

      // Handle Single-Character Operators
      if (SINGLE_CHAR_OPERATORS.has(char)) {
        tokens.push({
          type: 'OPERATOR',
          value: char,
          line,
          column: col,
          length: 1,
          explanation: `C operator '${char}'.`
        });
        i++;
        col++;
        continue;
      }

      // Handle Punctuation
      if (PUNCTUATION.has(char)) {
        tokens.push({
          type: 'PUNCTUATION',
          value: char,
          line,
          column: col,
          length: 1,
          explanation: `Delimiter or punctuation '${char}'.`
        });
        i++;
        col++;
        continue;
      }

      // Handle Identifiers and Keywords
      if (/[a-zA-Z_]/.test(char)) {
        const startCol = col;
        let ident = '';
        while (i < len && /[a-zA-Z0-9_]/.test(sourceCode[i])) {
          ident += sourceCode[i];
          i++;
          col++;
        }
        const isKeyword = KEYWORDS.has(ident);
        tokens.push({
          type: isKeyword ? 'KEYWORD' : 'IDENTIFIER',
          value: ident,
          line,
          column: startCol,
          length: ident.length,
          explanation: isKeyword
            ? `C reserved keyword '${ident}' with fixed language semantics.`
            : `User or library identifier '${ident}'.`
        });
        continue;
      }

      // Other unrecognized characters
      tokens.push({
        type: 'UNKNOWN',
        value: char,
        line,
        column: col,
        length: 1,
        explanation: `Unrecognized symbol '${char}'.`
      });
      i++;
      col++;
    }

    return {
      totalTokens: tokens.length,
      tokens,
      summary: {
        keywords: tokens.filter((t) => t.type === 'KEYWORD').length,
        identifiers: tokens.filter((t) => t.type === 'IDENTIFIER').length,
        operators: tokens.filter((t) => t.type === 'OPERATOR').length,
        constants: tokens.filter((t) => t.type === 'NUMERIC_CONSTANT' || t.type === 'STRING_LITERAL' || t.type === 'CHAR_LITERAL').length,
        punctuation: tokens.filter((t) => t.type === 'PUNCTUATION').length,
        preprocessor: tokens.filter((t) => t.type === 'PREPROCESSOR').length,
        comments: tokens.filter((t) => t.type === 'COMMENT').length,
      },
      producingTool: 'c-visualize-lexer (ISO C23 Lexical Specification)',
    };
  }

  isAtLineStart(source, index) {
    let j = index - 1;
    while (j >= 0) {
      if (source[j] === '\n') return true;
      if (!/\s/.test(source[j])) return false;
      j--;
    }
    return true;
  }
}

module.exports = new TokenAnalyzer();
