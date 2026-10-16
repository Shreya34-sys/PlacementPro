/**
 * Phase 6: Target Code Generation (Assembly) Viewer
 * Genuine GCC x86_64 assembly viewer with instruction tooltips and copy option.
 */

export class AssemblyViewer {
  constructor(codeElId, metaElId, copyBtnId, tooltipId) {
    this.codeEl = document.getElementById(codeElId);
    this.metaEl = document.getElementById(metaElId);
    this.copyBtn = document.getElementById(copyBtnId);
    this.tooltip = document.getElementById(tooltipId);
    this.rawAssembly = '';

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => {
        if (this.rawAssembly) {
          navigator.clipboard.writeText(this.rawAssembly).then(() => {
            const orig = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => (this.copyBtn.textContent = orig), 2000);
          });
        }
      });
    }
  }

  setData(assemblyData) {
    if (!assemblyData || assemblyData.status === 'unavailable') {
      this.rawAssembly = '';
      if (this.codeEl) {
        this.codeEl.textContent = assemblyData ? assemblyData.reason : 'Assembly generation unavailable.';
      }
      if (this.metaEl) {
        this.metaEl.textContent = 'GCC -S -fverbose-asm | Status: Unavailable';
      }
      return;
    }

    this.rawAssembly = assemblyData.rawAssembly || '';

    if (this.metaEl) {
      this.metaEl.innerHTML = `
        <span><strong>Target:</strong> ${assemblyData.targetArchitecture || 'Unavailable'}</span> •
        <span><strong>Toolchain:</strong> ${assemblyData.compilerVersion || 'Unavailable'}</span> •
        <span><strong>Total Lines:</strong> ${assemblyData.totalLines || 0}</span>
      `;
    }

    if (this.codeEl) {
      this.codeEl.innerHTML = '';
      const lines = assemblyData.parsedLines || [];

      lines.forEach((l) => {
        const lineDiv = document.createElement('div');
        lineDiv.style.display = 'flex';
        lineDiv.style.gap = '12px';
        lineDiv.style.padding = '1px 4px';
        lineDiv.style.borderRadius = 'var(--radius-sm)';

        const numSpan = document.createElement('span');
        numSpan.style.color = 'var(--muted-text)';
        numSpan.style.width = '35px';
        numSpan.style.textAlign = 'right';
        numSpan.style.userSelect = 'none';
        numSpan.textContent = l.lineNumber;

        const contentSpan = document.createElement('span');
        contentSpan.style.flex = '1';
        contentSpan.style.whiteSpace = 'pre';

        if (l.isLabel) {
          contentSpan.style.fontWeight = 'bold';
          contentSpan.style.color = 'var(--primary-blue)';
        } else if (l.isComment) {
          contentSpan.style.color = 'var(--secondary-text)';
          contentSpan.style.fontStyle = 'italic';
        } else if (l.isDirective) {
          contentSpan.style.color = '#7C3AED';
        }

        contentSpan.textContent = l.rawText;

        if (l.explanation) {
          lineDiv.title = `Instruction '${l.mnemonic}': ${l.explanation}`;
          lineDiv.style.cursor = 'help';
          lineDiv.addEventListener('mouseenter', () => {
            lineDiv.style.backgroundColor = 'var(--light-blue)';
          });
          lineDiv.addEventListener('mouseleave', () => {
            lineDiv.style.backgroundColor = 'transparent';
          });
        }

        lineDiv.appendChild(numSpan);
        lineDiv.appendChild(contentSpan);
        this.codeEl.appendChild(lineDiv);
      });
    }
  }
}
