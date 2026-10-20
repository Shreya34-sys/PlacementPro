const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID: uuidv4 } = require('crypto');
const config = require('../config/env');

class GccDriver {
  constructor() {
    this.gccPath = config.compiler.gccPath;
    this.versionInfo = null;
    this.versionPromise = this.initVersionInfo();
  }

  async initVersionInfo() {
    try {
      const [version, target] = await Promise.all([
        this.executeProcess(this.gccPath, ['-dumpfullversion', '-dumpversion']),
        this.executeProcess(this.gccPath, ['-dumpmachine']),
      ]);
      if (version.exitCode !== 0 || target.exitCode !== 0) throw new Error('GCC version or target query failed');
      const versionText = version.stdout.trim();
      const targetText = target.stdout.trim();
      if (!versionText || !targetText) throw new Error('GCC returned an empty version or target');
      this.versionInfo = {
        name: 'gcc',
        version: versionText,
        target: targetText,
        fullOutput: `GCC ${versionText}\nTarget: ${targetText}`,
      };
    } catch (err) {
      console.warn('[GccDriver] Failed to retrieve GCC version on startup:', err.message);
      this.versionInfo = null;
    }
  }

  getVersionInfo() {
    return this.versionInfo || { name: 'gcc', version: null, target: null, fullOutput: '' };
  }

  async ready() {
    await this.versionPromise;
    if (!this.versionInfo) throw new Error(`GCC is unavailable at configured path: ${this.gccPath}`);
    return this.versionInfo;
  }

  async getCapabilities() {
    const info = await this.ready();
    const standards = [];
    for (const standard of ['c90', 'c99', 'c11', 'c17', 'c23']) {
      const result = await this.executeProcess(this.gccPath, [`-std=${standard}`, '-x', 'c', '-fsyntax-only', '-'], {
        stdin: 'int main(void) { return 0; }\n', timeoutMs: 5000,
      });
      if (result.exitCode === 0) standards.push(standard);
    }
    return { ...info, supportedStandards: standards };
  }

  createTempDir() {
    const tempDir = path.join(os.tmpdir(), `c_visualize_${uuidv4()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    return tempDir;
  }

  cleanTempDir(dirPath) {
    try {
      if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true });
      }
    } catch (err) {
      console.warn('[GccDriver] Error cleaning temp directory:', err.message);
    }
  }

  executeProcess(cmd, args, options = {}) {
    return new Promise((resolve, reject) => {
      const timeoutMs = options.timeoutMs || 10000;
      let stdout = '';
      let stderr = '';
      let killed = false;
      let capturedBytes = 0;

      const proc = spawn(cmd, args, {
        cwd: options.cwd || process.cwd(),
        detached: process.platform !== 'win32',
        env: {
          ...process.env,
          // Ensure MinGW bin directory is in PATH
          PATH: path.dirname(this.gccPath) + path.delimiter + process.env.PATH,
        },
      });

      const timer = setTimeout(() => {
        killed = true;
        try {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/F', '/T', '/PID', proc.pid]);
          } else {
          this.killProcessTree(proc);
          }
        } catch (e) {
          this.killProcessTree(proc);
        }
      }, timeoutMs);

      if (options.stdin) {
        proc.stdin.write(options.stdin);
        proc.stdin.end();
      }

      proc.stdout.on('data', (chunk) => {
        const remaining = Math.max(0, config.compiler.maxOutputBytes - capturedBytes);
        const accepted = chunk.subarray(0, remaining);
        stdout += accepted.toString();
        capturedBytes += accepted.length;
        if (accepted.length < chunk.length) {
          killed = true;
          this.killProcessTree(proc);
        }
      });

      proc.stderr.on('data', (chunk) => {
        const remaining = Math.max(0, config.compiler.maxOutputBytes - capturedBytes);
        const accepted = chunk.subarray(0, remaining);
        stderr += accepted.toString();
        capturedBytes += accepted.length;
        if (accepted.length < chunk.length) {
          killed = true;
          this.killProcessTree(proc);
        }
      });

      proc.on('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });

      proc.on('close', (code) => {
        clearTimeout(timer);
        resolve({
          exitCode: code,
          stdout,
          stderr,
          timedOut: killed,
        });
      });
    });
  }

  killProcessTree(proc) {
    try {
      if (process.platform === 'win32') spawn('taskkill', ['/F', '/T', '/PID', proc.pid]);
      else process.kill(-proc.pid, 'SIGKILL');
    } catch (error) {
      try { proc.kill('SIGKILL'); } catch (ignored) {}
    }
  }

  /**
   * Run full multi-phase compilation pipeline generating all genuine GCC artifacts.
   */
  async compileSource(sourceCode, options = {}) {
    await this.ready();
    const std = options.standard || 'c17';
    const optLevel = options.optimization || '-O0';
    const workDir = this.createTempDir();
    const srcPath = path.join(workDir, 'program.c');
    const exePath = path.join(workDir, process.platform === 'win32' ? 'program.exe' : 'program');
    const asmPath = path.join(workDir, 'program.s');
    const preprocPath = path.join(workDir, 'program.i');

    fs.writeFileSync(srcPath, sourceCode, 'utf8');

    const result = {
      workDir,
      srcPath,
      exePath,
      success: false,
      diagnostics: [],
      rawStderr: '',
      rawStdout: '',
      preprocessing: null,
      gimple: null,
      optimizedGimple: null,
      optimizationRemarks: '',
      assembly: null,
      linkingSuccess: false,
      exitCode: null,
    };

    try {
      // 1. Generate Preprocessed source (gcc -E)
      const preprocRes = await this.executeProcess(
        this.gccPath,
        [`-std=${std}`, '-E', '-dD', 'program.c', '-o', 'program.i'],
        { cwd: workDir }
      );
      if (fs.existsSync(preprocPath)) {
        const rawPreproc = fs.readFileSync(preprocPath, 'utf8');
        // Truncate to relevant user portion (lines not starting with # 1 "..." system headers, or take tail)
        result.preprocessing = {
          full: rawPreproc.slice(0, 50000),
          summary: `Preprocessed with GCC -std=${std} -E`,
        };
      }

      // 2. Generate GIMPLE IR dump and Assembly (-fdump-tree-gimple, -S -fverbose-asm)
      const compileArgs = [
        `-std=${std}`,
        optLevel,
        '-fdump-tree-gimple',
        '-fdump-tree-optimized',
        '-fopt-info-all=opt_remarks.txt',
        '-S',
        '-fverbose-asm',
        'program.c',
        '-o',
        'program.s',
      ];

      const compileRes = await this.executeProcess(this.gccPath, compileArgs, {
        cwd: workDir,
        timeoutMs: 12000,
      });

      result.rawStderr = compileRes.stderr || '';
      result.rawStdout = compileRes.stdout || '';
      result.exitCode = compileRes.exitCode;
      result.diagnostics = this.parseDiagnostics(compileRes.stderr, 'program.c');

      // Check for GIMPLE dump file (pattern: program.c.*t.gimple)
      const filesInDir = fs.readdirSync(workDir);
      const gimpleFile = filesInDir.find((f) => f.includes('.gimple'));
      if (gimpleFile) {
        result.gimple = fs.readFileSync(path.join(workDir, gimpleFile), 'utf8');
      }

      // Check for optimized GIMPLE dump (pattern: program.c.*t.optimized)
      const optFile = filesInDir.find((f) => f.includes('.optimized'));
      if (optFile) {
        result.optimizedGimple = fs.readFileSync(path.join(workDir, optFile), 'utf8');
      }

      // Read optimization remarks if generated
      const optRemarksPath = path.join(workDir, 'opt_remarks.txt');
      if (fs.existsSync(optRemarksPath)) {
        result.optimizationRemarks = fs.readFileSync(optRemarksPath, 'utf8');
      }

      // Read Assembly
      if (fs.existsSync(asmPath)) {
        result.assembly = fs.readFileSync(asmPath, 'utf8');
      }

      // 3. Link Executable (gcc program.c -o program.exe)
      if (compileRes.exitCode === 0) {
        const linkRes = await this.executeProcess(
          this.gccPath,
          [`-std=${std}`, optLevel, 'program.c', '-o', path.basename(exePath), '-lm'],
          { cwd: workDir, timeoutMs: 12000 }
        );

        if (linkRes.exitCode === 0 && fs.existsSync(exePath)) {
          result.success = true;
          result.linkingSuccess = true;
        } else {
          result.success = false;
          result.linkingSuccess = false;
          result.rawStderr += '\n' + (linkRes.stderr || '');
          const linkDiags = this.parseDiagnostics(linkRes.stderr, 'program.c', 'linker');
          result.diagnostics.push(...linkDiags);
        }
      } else {
        result.success = false;
        result.linkingSuccess = false;
      }
    } catch (err) {
      result.success = false;
      result.rawStderr += `\nInternal Compiler Error: ${err.message}`;
    }

    return result;
  }

  /**
   * Parse GCC diagnostic output into structured diagnostic objects.
   */
  parseDiagnostics(stderr, filename = 'program.c', defaultCategory = null) {
    if (!stderr) return [];
    const lines = stderr.split(/\r?\n/);
    const diagnostics = [];

    const diagRegex = new RegExp(`^([^:\\r\\n]+):(\\d+):(?:(\\d+):)?\\s*(warning|error|fatal error|note):\\s*(.*)$`, 'i');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(diagRegex);
      if (match) {
        const [, file, lineNum, colNum, rawSeverity, message] = match;
        const severity = rawSeverity.toLowerCase().includes('error')
          ? 'error'
          : rawSeverity.toLowerCase().includes('warning')
          ? 'warning'
          : 'note';

        let category = defaultCategory;
        let phase = 'Semantic Analysis';

        // Categorize diagnostic based on content and phase
        const msgLower = message.toLowerCase();
        if (msgLower.includes('expected') || msgLower.includes('syntax') || msgLower.includes('before') || msgLower.includes('stray')) {
          category = 'Syntax Error';
          phase = 'Syntax Analysis';
        } else if (msgLower.includes('undeclared') || msgLower.includes('implicit declaration') || msgLower.includes('type') || msgLower.includes('incompatible') || msgLower.includes('too few arguments') || msgLower.includes('too many arguments')) {
          category = 'Semantic Error';
          phase = 'Semantic Analysis';
        } else if (msgLower.includes('undefined reference') || msgLower.includes('multiple definition') || msgLower.includes('ld returned')) {
          category = 'Linker Error';
          phase = 'Linking Stage';
        } else if (msgLower.includes('#include') || msgLower.includes('macro') || msgLower.includes('no such file')) {
          category = 'Preprocessing Error';
          phase = 'Preprocessing';
        } else if (severity === 'warning') {
          category = 'Compiler Warning';
          phase = 'Semantic Analysis';
        } else {
          category = 'Compilation Error';
        }

        // Beginner-friendly explanation and suggested fix
        const explanationInfo = this.getBeginnerExplanation(message, category);

        diagnostics.push({
          sourceFile: file,
          line: parseInt(lineNum, 10),
          column: colNum ? parseInt(colNum, 10) : 1,
          severity,
          category,
          phase,
          message: message.trim(),
          explanation: explanationInfo.explanation,
          suggestion: explanationInfo.suggestion,
          producingTool: 'gcc',
          rawLine: line,
        });
      } else if (line.includes('undefined reference to') || line.includes('cannot find -l')) {
        diagnostics.push({
          sourceFile: filename,
          line: 1,
          column: 1,
          severity: 'error',
          category: 'Linker Error',
          phase: 'Linking Stage',
          message: line.trim(),
          explanation: 'The compiler compiled the code into an object, but the linker could not find the definition of a referenced function or library.',
          suggestion: 'Ensure the function is defined or the required library is included (e.g., -lm for math.h).',
          producingTool: 'ld (GNU Linker)',
          rawLine: line,
        });
      }
    }

    return diagnostics;
  }

  getBeginnerExplanation(message, category) {
    const msg = message.toLowerCase();
    if (msg.includes("expected ';'")) {
      return {
        explanation: "A semicolon is missing at the end of the statement or declaration.",
        suggestion: "Add a semicolon ';' at the end of the statement on or immediately before this line.",
      };
    }
    if (msg.includes("expected ')'") || msg.includes("expected '}'") || msg.includes("expected ']'")) {
      return {
        explanation: "An opening parenthesis, bracket, or curly brace was not properly closed.",
        suggestion: "Check your opening and closing braces/parentheses to ensure they match.",
      };
    }
    if (msg.includes('undeclared')) {
      const varMatch = message.match(/'([^']+)'/);
      const varName = varMatch ? varMatch[1] : 'identifier';
      return {
        explanation: `The variable or identifier '${varName}' has not been declared in this scope before being used.`,
        suggestion: `Declare '${varName}' with its type (e.g. 'int ${varName};') before using it, or verify the spelling.`,
      };
    }
    if (msg.includes('implicit declaration of function')) {
      const fnMatch = message.match(/'([^']+)'/);
      const fnName = fnMatch ? fnMatch[1] : 'function';
      return {
        explanation: `The function '${fnName}' was called without prior declaration or prototype.`,
        suggestion: `Include the required header file (e.g. <stdio.h>, <stdlib.h>, <string.h>) or declare the function prototype before main().`,
      };
    }
    if (msg.includes('incompatible type') || msg.includes('assignment to') || msg.includes('passing argument')) {
      return {
        explanation: "You are attempting to assign or pass a value of one data type to a variable or parameter of an incompatible data type.",
        suggestion: "Check the expected type and use explicit type casting if appropriate, or adjust your variable types.",
      };
    }
    if (msg.includes('unused variable')) {
      return {
        explanation: "This variable was declared and possibly initialized, but its value is never used in the program.",
        suggestion: "Remove the variable if not needed, or make sure you are using it in calculations.",
      };
    }
    if (msg.includes('division by zero')) {
      return {
        explanation: "Division by zero is undefined in mathematics and causes a runtime crash or arithmetic exception.",
        suggestion: "Ensure the divisor expression cannot evaluate to 0.",
      };
    }
    return {
      explanation: "GCC detected an issue according to the C language standard.",
      suggestion: "Review the referenced line and column to ensure proper syntax and type consistency.",
    };
  }
}

module.exports = new GccDriver();
