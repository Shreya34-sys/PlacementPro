'use strict';

function parseDiagnostics(stderr = '', filename = 'program.c') {
  const diagnostics = [];
  for (const rawLine of String(stderr).split(/\r?\n/)) {
    const match = rawLine.match(/^([^:\r\n]+):(\d+):(?:(\d+):)?\s*(warning|error|fatal error|note):\s*(.*)$/i);
    if (!match) {
      if (/undefined reference to|cannot find -l|ld returned/i.test(rawLine)) diagnostics.push({
        sourceFile: filename, line: 1, column: 1, severity: 'error', category: 'Linker Error', phase: 'Linking Stage',
        message: rawLine.trim(), explanation: 'The linker could not resolve a referenced symbol or library.', producingTool: 'GCC linker', rawLine,
      });
      continue;
    }
    const [, sourceFile, line, column, rawSeverity, message] = match;
    const severity = rawSeverity.toLowerCase().includes('error') ? 'error' : rawSeverity.toLowerCase().includes('warning') ? 'warning' : 'note';
    const text = message.toLowerCase();
    let phase = 'Semantic Analysis'; let category = severity === 'warning' ? 'Compiler Warning' : 'Semantic Error';
    if (text.includes('undefined reference') || text.includes('ld returned') || text.includes('cannot find -l')) { phase = 'Linking Stage'; category = 'Linker Error'; }
    else if (text.includes('expected') || text.includes('syntax') || text.includes('stray')) { phase = 'Syntax Analysis'; category = 'Syntax Error'; }
    else if (text.includes('no such file') || text.includes('#include')) { phase = 'Preprocessing'; category = 'Preprocessing Error'; }
    diagnostics.push({ sourceFile, line: Number(line), column: Number(column || 1), severity, phase, category, message: message.trim(), explanation: 'Diagnostic reported by GCC for this compilation.', producingTool: 'GCC', rawLine });
  }
  return diagnostics;
}

module.exports = { parseDiagnostics };
