/**
 * Phase 3: Semantic Analysis Symbol Table Viewer
 * Displays symbols across nested scopes, data types, and semantic diagnostics.
 */

export class SymbolTableViewer {
  constructor(tableBodyId, diagnosticsContainerId, onSymbolClick) {
    this.tableBody = document.getElementById(tableBodyId);
    this.diagContainer = document.getElementById(diagnosticsContainerId);
    this.onSymbolClick = onSymbolClick;
    this.symbols = [];
  }

  setData(semanticData) {
    this.symbols = semanticData && semanticData.allSymbols ? semanticData.allSymbols : [];
    this.diagnostics = semanticData && semanticData.semanticDiagnostics ? semanticData.semanticDiagnostics : [];
    this.render();
  }

  render() {
    if (this.tableBody) {
      this.tableBody.innerHTML = '';
      if (this.symbols.length === 0) {
        this.tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--secondary-text); padding: 24px;">No symbols declared in this program.</td></tr>`;
      } else {
        this.symbols.forEach((sym) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="font-family: var(--font-mono); font-weight: 600; color: var(--primary-blue);">${this.escapeHtml(sym.name)}</td>
            <td><span class="badge ${sym.category === 'Function' ? 'badge-primary' : 'badge-secondary'}">${sym.category}</span></td>
            <td style="font-family: var(--font-mono);">${this.escapeHtml(sym.dataType)}</td>
            <td>${this.escapeHtml(sym.scopeName || 'Global')}</td>
            <td style="font-family: var(--font-mono); color: var(--secondary-text);">Line ${sym.line || 1}</td>
            <td><span class="badge ${sym.status === 'Initialized' || sym.status === 'Defined' ? 'badge-success' : 'badge-warning'}">${sym.status || 'Active'}</span></td>
          `;

          tr.addEventListener('click', () => {
            if (this.onSymbolClick && sym.line) {
              this.onSymbolClick(sym.line, sym.column || 1);
            }
          });

          this.tableBody.appendChild(tr);
        });
      }
    }

    if (this.diagContainer) {
      this.diagContainer.innerHTML = '';
      if (this.diagnostics.length > 0) {
        const title = document.createElement('h4');
        title.style.fontSize = '13px';
        title.style.fontWeight = '600';
        title.style.marginTop = '16px';
        title.style.marginBottom = '8px';
        title.textContent = 'GCC Semantic Diagnostics:';
        this.diagContainer.appendChild(title);

        this.diagnostics.forEach((d) => {
          const card = document.createElement('div');
          card.style.background = d.severity === 'error' ? 'var(--error-bg)' : 'var(--warning-bg)';
          card.style.border = `1px solid ${d.severity === 'error' ? 'var(--error-border)' : 'var(--warning-border)'}`;
          card.style.borderRadius = 'var(--radius-md)';
          card.style.padding = '10px 12px';
          card.style.marginBottom = '8px';
          card.style.fontSize = '12px';
          card.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
              <strong style="color: ${d.severity === 'error' ? 'var(--error)' : 'var(--warning)'};">${d.category || 'Diagnostic'} (Line ${d.line}:${d.column})</strong>
              <span class="badge ${d.severity === 'error' ? 'badge-error' : 'badge-warning'}">${d.severity}</span>
            </div>
            <div style="font-family: var(--font-mono); margin-bottom: 6px;">${this.escapeHtml(d.message)}</div>
            <div style="color: var(--secondary-text); font-size: 11px;">${this.escapeHtml(d.explanation || '')}</div>
          `;
          card.addEventListener('click', () => {
            if (this.onSymbolClick && d.line) {
              this.onSymbolClick(d.line, d.column || 1);
            }
          });
          this.diagContainer.appendChild(card);
        });
      }
    }
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
