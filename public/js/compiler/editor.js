/**
 * Monaco Code Editor Integration with Fallback & Diagnostic Highlighting
 */

export class EditorManager {
  constructor(containerId, fallbackTextareaId) {
    this.containerId = containerId;
    this.fallbackTextareaId = fallbackTextareaId;
    this.editor = null;
    this.fallbackEl = document.getElementById(fallbackTextareaId);
    this.currentTheme = 'c-visualize-light'; // White and Blue theme default
    this.fontSize = 13;
    this.decorations = [];
    this.changeListeners = new Set();
  }

  async init(initialCode = '') {
    if (window.monaco) {
      this.createMonacoInstance(initialCode);
      return;
    }

    // Try loading Monaco from CDN with timeout
    try {
      await this.loadMonacoScript();
      this.createMonacoInstance(initialCode);
    } catch (err) {
      console.warn('[EditorManager] Monaco CDN unavailable, using accessible fallback textarea:', err.message);
      this.setupFallback(initialCode);
    }
  }

  loadMonacoScript() {
    return new Promise((resolve, reject) => {
      const loaderScript = document.createElement('script');
      loaderScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs/loader.min.js';
      loaderScript.crossOrigin = 'anonymous';

      const timeout = setTimeout(() => {
        reject(new Error('Monaco loader timeout'));
      }, 4000);

      loaderScript.onload = () => {
        clearTimeout(timeout);
        window.require.config({
          paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs' },
        });
        window.require(['vs/editor/editor.main'], () => {
          resolve();
        });
      };

      loaderScript.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('Failed to load Monaco script'));
      };

      document.head.appendChild(loaderScript);
    });
  }

  createMonacoInstance(initialCode) {
    const container = document.getElementById(this.containerId);
    if (!container) return;

    if (this.fallbackEl) {
      this.fallbackEl.style.display = 'none';
    }

    window.monaco.editor.defineTheme('c-visualize-light', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#FFFFFF',
        'editorLineNumber.foreground': '#94A3B8',
        'editorLineNumber.activeForeground': '#475569',
        'editor.lineHighlightBackground': '#F8FAFC',
        'editor.selectionBackground': '#DBEAFE',
        'editor.inactiveSelectionBackground': '#EFF6FF',
        'editorCursor.foreground': '#2563EB',
        'editorIndentGuide.background1': '#E2E8F0',
        'editorIndentGuide.activeBackground1': '#94A3B8',
      },
    });
    this.editor = window.monaco.editor.create(container, {
      value: initialCode,
      language: 'c',
      theme: this.currentTheme,
      fontSize: this.fontSize,
      lineHeight: 22,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
      lineNumbers: 'on',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      tabSize: 4,
      insertSpaces: true,
      bracketPairColorization: { enabled: true },
      matchBrackets: 'always',
      guides: { indentation: true, bracketPairs: true },
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      renderWhitespace: 'selection',
      padding: { top: 12, bottom: 12 },
    });
    this.editor.onDidChangeModelContent(() => this.notifyCodeChanged());
  }

  setupFallback(initialCode) {
    if (this.fallbackEl) {
      this.fallbackEl.style.display = 'block';
      this.fallbackEl.value = initialCode;
      this.fallbackEl.style.fontSize = `${this.fontSize}px`;
      this.fallbackEl.addEventListener('input', () => this.notifyCodeChanged());
    }
  }

  getCode() {
    if (this.editor) {
      return this.editor.getValue();
    }
    return this.fallbackEl ? this.fallbackEl.value : '';
  }

  setCode(newCode) {
    if (this.editor) {
      this.editor.setValue(newCode);
    } else if (this.fallbackEl) {
      this.fallbackEl.value = newCode;
      this.notifyCodeChanged();
    }
  }

  onChange(listener) {
    this.changeListeners.add(listener);
    return () => this.changeListeners.delete(listener);
  }

  notifyCodeChanged() {
    for (const listener of this.changeListeners) listener(this.getCode());
  }

  setTheme(themeName) {
    this.currentTheme = themeName;
    if (this.editor && window.monaco) {
      window.monaco.editor.setTheme(themeName);
    }
  }

  setFontSize(size) {
    this.fontSize = Math.max(10, Math.min(24, size));
    if (this.editor) {
      this.editor.updateOptions({ fontSize: this.fontSize });
    } else if (this.fallbackEl) {
      this.fallbackEl.style.fontSize = `${this.fontSize}px`;
    }
  }

  increaseFont() {
    this.setFontSize(this.fontSize + 1);
  }

  decreaseFont() {
    this.setFontSize(this.fontSize - 1);
  }

  resetFont() {
    this.setFontSize(13);
  }

  /**
   * Jump to line and highlight source range when clicking a token, AST node, or diagnostic.
   */
  highlightSourceRange(startLine, startCol = 1, endLine = null, endCol = null) {
    const eLine = endLine || startLine;
    const eCol = endCol || startCol + 1;

    if (this.editor && window.monaco) {
      this.editor.revealRangeInCenter({
        startLineNumber: startLine,
        startColumn: startCol,
        endLineNumber: eLine,
        endColumn: eCol,
      });

      this.editor.setSelection({
        startLineNumber: startLine,
        startColumn: startCol,
        endLineNumber: eLine,
        endColumn: eCol,
      });

      this.editor.focus();
    } else if (this.fallbackEl) {
      // Find character offset in fallback textarea
      const lines = this.fallbackEl.value.split('\n');
      let offset = 0;
      for (let i = 0; i < startLine - 1 && i < lines.length; i++) {
        offset += lines[i].length + 1;
      }
      offset += Math.max(0, startCol - 1);
      this.fallbackEl.focus();
      this.fallbackEl.setSelectionRange(offset, offset + 1);
    }
  }

  /**
   * Set GCC diagnostic markers (red squiggles for errors, yellow for warnings).
   */
  setDiagnosticMarkers(diagnostics = []) {
    if (!this.editor || !window.monaco) return;

    const model = this.editor.getModel();
    if (!model) return;

    const markers = diagnostics.map((d) => ({
      severity:
        d.severity === 'error'
          ? window.monaco.MarkerSeverity.Error
          : d.severity === 'warning'
          ? window.monaco.MarkerSeverity.Warning
          : window.monaco.MarkerSeverity.Info,
      message: `[GCC] ${d.message}${d.suggestion ? `\nTip: ${d.suggestion}` : ''}`,
      startLineNumber: d.line || 1,
      startColumn: d.column || 1,
      endLineNumber: d.line || 1,
      endColumn: (d.column || 1) + 5,
    }));

    window.monaco.editor.setModelMarkers(model, 'gcc', markers);
  }

  clearDiagnosticMarkers() {
    if (this.editor && window.monaco) {
      const model = this.editor.getModel();
      if (model) {
        window.monaco.editor.setModelMarkers(model, 'gcc', []);
      }
    }
  }
}
