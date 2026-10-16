/**
 * Authentic Semantic Analyzer and Symbol Table Extractor
 * Constructs symbol tables across nested scopes and correlates real GCC diagnostics.
 */

class SemanticAnalyzer {
  analyze(ast, gccDiagnostics = []) {
    const symbolTables = [];
    const globalScope = {
      scopeName: 'Global Scope',
      level: 0,
      parent: null,
      symbols: {},
    };
    symbolTables.push(globalScope);

    let currentScope = globalScope;

    const traverse = (node) => {
      if (!node) return;

      if (node.type === 'FunctionDefinition') {
        // Register function in current (global) scope
        currentScope.symbols[node.name] = {
          name: node.name,
          category: 'Function',
          dataType: node.returnType,
          line: node.startLine,
          column: node.startCol,
          parameters: (node.parameters || []).map((p) => `${p.paramType} ${p.name}`),
          scope: currentScope.scopeName,
          status: 'Defined',
        };

        // Create new Function Scope
        const funcScope = {
          scopeName: `Function: ${node.name}()`,
          level: currentScope.level + 1,
          parent: currentScope.scopeName,
          symbols: {},
        };
        symbolTables.push(funcScope);
        const prevScope = currentScope;
        currentScope = funcScope;

        // Register parameters in function scope
        if (node.parameters) {
          for (const param of node.parameters) {
            currentScope.symbols[param.name] = {
              name: param.name,
              category: 'Parameter',
              dataType: param.paramType,
              line: param.startLine,
              column: param.startCol,
              scope: currentScope.scopeName,
              status: 'Initialized by caller',
            };
          }
        }

        // Traverse children inside function
        if (node.children) {
          for (const child of node.children) {
            traverse(child);
          }
        }

        currentScope = prevScope;
        return;
      }

      if (node.type === 'FunctionDeclaration') {
        currentScope.symbols[node.name] = {
          name: node.name,
          category: 'Function Prototype',
          dataType: node.returnType,
          line: node.startLine,
          column: node.startCol,
          parameters: (node.parameters || []).map((p) => `${p.paramType} ${p.name}`),
          scope: currentScope.scopeName,
          status: 'Declared',
        };
      }

      if (node.type === 'VariableDeclaration') {
        currentScope.symbols[node.name || node.identifier] = {
          name: node.name || node.identifier,
          category: 'Variable',
          dataType: node.varType || 'unknown',
          line: node.startLine,
          column: node.startCol,
          scope: currentScope.scopeName,
          status: node.children && node.children.length > 0 ? 'Initialized' : 'Uninitialized',
        };
      }

      if (node.type === 'CompoundStatement' && currentScope.level > 0 && node.name && !node.name.includes('Function')) {
        const blockScope = {
          scopeName: `Block Scope (Line ${node.startLine})`,
          level: currentScope.level + 1,
          parent: currentScope.scopeName,
          symbols: {},
        };
        symbolTables.push(blockScope);
        const prev = currentScope;
        currentScope = blockScope;

        if (node.children) {
          for (const child of node.children) {
            traverse(child);
          }
        }
        currentScope = prev;
        return;
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    const rootNode = (ast && ast.ast) ? ast.ast : ast;
    if (rootNode) {
      traverse(rootNode);
    }

    // Format symbol tables into flat readable rows
    const allSymbols = [];
    for (const scope of symbolTables) {
      for (const key of Object.keys(scope.symbols)) {
        const sym = scope.symbols[key];
        allSymbols.push({
          ...sym,
          scopeName: scope.scopeName,
          level: scope.level,
        });
      }
    }

    // Correlate with GCC semantic diagnostics
    const semanticDiagnostics = gccDiagnostics.filter(
      (d) => d.phase === 'Semantic Analysis' || d.category === 'Semantic Error' || d.category === 'Compiler Warning'
    );

    return {
      symbolTables,
      allSymbols,
      totalSymbols: allSymbols.length,
      scopeCount: symbolTables.length,
      semanticDiagnostics,
      producingTool: 'c-visualize-symbol-engine & gcc diagnostics',
      status: semanticDiagnostics.some((d) => d.severity === 'error') ? 'failed' : 'success',
    };
  }
}

module.exports = new SemanticAnalyzer();
