/**
 * Core Compiler & Execution Controller
 */
import { api } from './api.js';

export class CompilerController {
  constructor({
    editorManager,
    phaseVisualizer,
    tokenViewer,
    astViewer,
    symbolTableViewer,
    irViewer,
    optimizationViewer,
    assemblyViewer,
    errorAnalyzer,
    outputConsole,
    compileBtnId,
    runBtnId,
    statusBadgeId,
  }) {
    this.editor = editorManager;
    this.visualizer = phaseVisualizer;
    this.tokenViewer = tokenViewer;
    this.astViewer = astViewer;
    this.symbolViewer = symbolTableViewer;
    this.irViewer = irViewer;
    this.optViewer = optimizationViewer;
    this.assemblyViewer = assemblyViewer;
    this.errorAnalyzer = errorAnalyzer;
    this.outputConsole = outputConsole;

    this.compileBtn = document.getElementById(compileBtnId);
    this.runBtn = document.getElementById(runBtnId);
    this.statusBadge = document.getElementById(statusBadgeId);

    this.currentJobId = null;
    this.compiledSource = null;
    this.isCompiling = false;
    this.isRunning = false;

    this.initEventListeners();
    this.editor.onChange?.(() => this.handleSourceChanged());
  }

  initEventListeners() {
    if (this.compileBtn) {
      this.compileBtn.addEventListener('click', () => this.compileAndVisualize());
    }
    if (this.runBtn) {
      this.runBtn.addEventListener('click', () => this.runProgram());
    }
  }

  getCompilerOptions() {
    const stdSelect = document.getElementById('select-c-standard');
    const optSelect = document.getElementById('select-opt-level');
    return {
      standard: stdSelect ? stdSelect.value : 'c17',
      optimization: optSelect ? optSelect.value : '-O0',
    };
  }

  async compileAndVisualize() {
    if (this.isCompiling) return;
    const sourceCode = this.editor.getCode();

    if (!sourceCode || sourceCode.trim().length === 0) {
      alert('Please enter or select a C program to compile.');
      return;
    }

    this.isCompiling = true;
    this.retireCurrentJob();
    if (this.runBtn) this.runBtn.disabled = true;
    this.outputConsole.clear();
    this.setCompileButtonLoading(true);
    this.updateStatusBadge('compiling');
    this.editor.clearDiagnosticMarkers();

    try {
      const opts = this.getCompilerOptions();
      const res = await api.compile(sourceCode, opts.standard, opts.optimization);
      const data = res.data;
      this.outputConsole.setBuildLog?.(data);

      // Discard a result if the user edited the source while GCC was working.
      // It must never become the active binary for different visible code.
      if (sourceCode !== this.editor.getCode()) {
        if (data.jobId) api.cancel(data.jobId).catch(() => {});
        this.currentJobId = null;
        this.compiledSource = null;
        if (this.runBtn) this.runBtn.disabled = true;
        this.outputConsole.clear();
        this.updateStatusBadge('changed');
        return;
      }

      this.currentJobId = data.success ? data.jobId : null;
      this.compiledSource = data.success ? sourceCode : null;

      // 1. Update Phase Tabs and Statuses
      this.visualizer.updatePhaseStatuses(data.phases, data.supporting);

      // 2. Populate Phase 1: Lexical Analysis
      if (data.phases.lexical && data.phases.lexical.artifact) {
        this.tokenViewer.setTokens(data.phases.lexical.artifact);
      }

      // 3. Populate Phase 2: Syntax Analysis
      if (data.phases.syntax && data.phases.syntax.artifact) {
        this.astViewer.setAst(data.phases.syntax.artifact);
      }

      // 4. Populate Phase 3: Semantic Analysis
      if (data.phases.semantic && data.phases.semantic.artifact) {
        this.symbolViewer.setData(data.phases.semantic.artifact);
      }

      // 5. Populate Phase 4: Intermediate Code Generation
      if (data.phases.intermediate && data.phases.intermediate.artifact) {
        this.irViewer.setData(data.phases.intermediate.artifact);
      }

      // 6. Populate Phase 5: Code Optimization
      if (data.phases.optimization && data.phases.optimization.artifact) {
        this.optViewer.setData(data.phases.optimization.artifact);
      }

      // 7. Populate Phase 6: Target Code Generation
      if (data.phases.target_code && data.phases.target_code.artifact) {
        this.assemblyViewer.setData(data.phases.target_code.artifact);
      }

      // 8. Populate Supporting Stage Views: Preprocessing and Linking
      const preprocCodeEl = document.getElementById('preproc-code');
      if (preprocCodeEl) {
        preprocCodeEl.textContent = data.supporting.preprocessing.content || '(No preprocessed source generated)';
      }
      const linkStatusEl = document.getElementById('linking-status-content');
      if (linkStatusEl) {
        linkStatusEl.innerHTML = `
          <div><strong>Linker Status:</strong> ${data.supporting.linking.status === 'success' ? '<span class="badge badge-success">Executable Created</span>' : '<span class="badge badge-error">Link Failed</span>'}</div>
          <div style="margin-top:6px;"><strong>Producing Tool:</strong> ${data.supporting.linking.producingTool}</div>
          <div style="margin-top:6px; color:var(--secondary-text);">${data.supporting.linking.explanation}</div>
        `;
      }

      // 9. Update Error Analyzer and Editor Squiggles
      this.errorAnalyzer.setDiagnostics(data.diagnostics);
      this.editor.setDiagnosticMarkers(data.diagnostics);

      // 10. Update Status Badge & Run Button
      if (data.success) {
        this.updateStatusBadge('compiled');
        if (this.runBtn) this.runBtn.disabled = false;
        // Make stdin easy to find for programs that call scanf. The input is
        // submitted with Run Program and the result is shown in the Output tab.
        if (/\bscanf\s*\(/.test(sourceCode)) this.selectOutputTab('terminal-pane');
      } else {
        this.updateStatusBadge('failed');
        if (this.runBtn) this.runBtn.disabled = true;
      }
    } catch (err) {
      console.error('[Compilation Error]', err);
      this.updateStatusBadge('failed');
      alert('Compilation error: ' + err.message);
    } finally {
      this.isCompiling = false;
      this.setCompileButtonLoading(false);
    }
  }

  async runProgram() {
    if (this.compiledSource !== this.editor.getCode()) {
      this.handleSourceChanged();
      return;
    }
    if (!this.currentJobId) {
      alert('Please compile the program before running.');
      return;
    }
    if (this.isRunning) return;

    this.isRunning = true;
    const runJobId = this.currentJobId;
    const runSource = this.compiledSource;
    const stdinData = this.outputConsole.getStdin();
    if (/\bscanf\s*\(/.test(runSource) && !stdinData.trim()) {
      this.isRunning = false;
      this.setRunButtonLoading(false);
      this.selectOutputTab('terminal-pane');
      const stdin = document.getElementById('console-stdin');
      stdin?.focus();
      if (this.outputConsole.stdoutEl) {
        this.outputConsole.stdoutEl.textContent = 'This program reads input with scanf. Enter all required values in Terminal / Input, then click Run Program again. Example: for n followed by n array values, enter n first, then all n values.';
      }
      return;
    }
    this.setRunButtonLoading(true);

    try {
      const res = await api.run(runJobId, stdinData);
      if (this.currentJobId === runJobId && this.editor.getCode() === runSource) {
        this.outputConsole.setExecutionResult(res.data);
        this.selectOutputTab('output-pane');
      }
    } catch (err) {
      console.error('[Execution Error]', err);
      if (this.currentJobId === runJobId && this.editor.getCode() === runSource) {
        this.outputConsole.setExecutionResult({
          stdout: '',
          stderr: `Execution failure: ${err.message}`,
          exitCode: -1,
          durationMs: 0,
          terminationReason: 'error',
        });
      }
    } finally {
      this.isRunning = false;
      this.setRunButtonLoading(false);
    }
  }

  selectOutputTab(targetId) {
    const tab = document.querySelector(`[data-output-tab="${targetId}"]`);
    if (tab) tab.click();
  }

  setCompileButtonLoading(loading) {
    if (!this.compileBtn) return;
    if (loading) {
      this.compileBtn.disabled = true;
      this.compileBtn.innerHTML = '<span class="spinner"></span> Compiling...';
    } else {
      this.compileBtn.disabled = false;
      this.compileBtn.innerHTML = `
        <svg style="width:14px; height:14px; fill:currentColor;" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
        </svg>
        Compile &amp; Visualize
      `;
    }
  }

  setRunButtonLoading(loading) {
    if (!this.runBtn) return;
    this.runBtn.disabled = loading || !this.currentJobId || this.compiledSource !== this.editor.getCode();
    if (loading) {
      this.runBtn.innerHTML = '<span class="spinner"></span> Running...';
    } else {
      this.runBtn.innerHTML = `
        <svg style="width:14px; height:14px; fill:currentColor;" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        Run Program
      `;
    }
  }

  updateStatusBadge(status) {
    if (!this.statusBadge) return;
    if (status === 'compiling') {
      this.statusBadge.className = 'badge badge-warning';
      this.statusBadge.textContent = 'Compiling...';
    } else if (status === 'compiled') {
      this.statusBadge.className = 'badge badge-success';
      this.statusBadge.textContent = 'Compilation Succeeded';
    } else if (status === 'failed') {
      this.statusBadge.className = 'badge badge-error';
      this.statusBadge.textContent = 'Compilation Failed';
    } else if (status === 'changed') {
      this.statusBadge.className = 'badge badge-warning';
      this.statusBadge.textContent = 'Source Changed · Compile Again';
    } else {
      this.statusBadge.className = 'badge badge-secondary';
      this.statusBadge.textContent = 'Ready';
    }
  }

  retireCurrentJob() {
    const previousJobId = this.currentJobId;
    this.currentJobId = null;
    this.compiledSource = null;
    if (previousJobId) api.cancel(previousJobId).catch(() => {});
  }

  handleSourceChanged() {
    this.retireCurrentJob();
    if (this.runBtn) this.runBtn.disabled = true;
    this.outputConsole.clear();
    this.updateStatusBadge('changed');
  }
}
