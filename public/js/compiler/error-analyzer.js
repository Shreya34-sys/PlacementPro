/**
 * Compiler Error Analyzer
 * Categorizes and explains GCC diagnostics with beginner-friendly explanations and source links.
 */

export class ErrorAnalyzer {
  constructor(containerId, onDiagnosticClick) {
    this.container = document.getElementById(containerId);
    this.onDiagnosticClick = onDiagnosticClick;
    this.diagnostics = [];
  }

  setDiagnostics(diagnostics = []) {
    this.diagnostics = diagnostics;
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    if (!this.diagnostics || this.diagnostics.length === 0) {
      this.container.innerHTML = `
        <div style="text-align: center; color: var(--success); padding: 18px; font-size: 13px; font-weight: 500;">
          <svg style="width: 20px; height: 20px; vertical-align: middle; margin-right: 6px; fill: var(--success);" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
          </svg>
          No compiler errors or warnings detected.
        </div>
      `;
      return;
    }

    this.diagnostics.forEach((d) => {
      const card = document.createElement('div');
      const isErr = d.severity === 'error';
      card.style.background = isErr ? 'var(--error-bg)' : 'var(--warning-bg)';
      card.style.border = `1px solid ${isErr ? 'var(--error-border)' : 'var(--warning-border)'}`;
      card.style.borderRadius = 'var(--radius-md)';
      card.style.padding = '12px';
      card.style.marginBottom = '10px';
      card.style.cursor = 'pointer';
      card.style.transition = 'transform var(--transition-fast)';

      card.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span class="badge ${isErr ? 'badge-error' : 'badge-warning'}">${d.severity.toUpperCase()}</span>
            <span style="font-weight: 600; font-size: 12px; color: ${isErr ? 'var(--error)' : 'var(--warning)'};">${d.category || 'Diagnostic'}</span>
          </div>
          <span style="font-family: var(--font-mono); font-size: 11px; color: var(--secondary-text);">Line ${d.line}:${d.column}</span>
        </div>

        <div style="font-family: var(--font-mono); font-size: 12px; color: var(--primary-text); margin-bottom: 8px; word-break: break-word;">
          ${this.escapeHtml(d.message)}
        </div>

        <div style="background: rgba(255, 255, 255, 0.7); border-radius: var(--radius-sm); padding: 8px; font-size: 11px; margin-bottom: 6px;">
          <strong>Educational Explanation:</strong> ${this.escapeHtml(d.explanation || '')}
        </div>

        ${
          d.suggestion
            ? `<div style="color: var(--primary-blue); font-size: 11px;">
                <strong>Suggested Fix:</strong> ${this.escapeHtml(d.suggestion)}
               </div>`
            : ''
        }

        <div style="margin-top: 6px; font-size: 10px; color: var(--muted-text); display: flex; justify-content: space-between;">
          <span>Phase: ${d.phase || 'Compilation'}</span>
          <span>Tool: ${d.producingTool || 'gcc'}</span>
        </div>
      `;

      card.addEventListener('click', () => {
        if (this.onDiagnosticClick && d.line) {
          this.onDiagnosticClick(d.line, d.column || 1);
        }
      });

      this.container.appendChild(card);
    });
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
