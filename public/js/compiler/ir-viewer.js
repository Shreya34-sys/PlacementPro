/**
 * Phase 4: Intermediate Code Generation (GIMPLE) Viewer
 * Genuine GCC GIMPLE intermediate representation viewer with copy and breakdown.
 */

export class IrViewer {
  constructor(codeElId, metaElId, copyBtnId) {
    this.codeEl = document.getElementById(codeElId);
    this.metaEl = document.getElementById(metaElId);
    this.copyBtn = document.getElementById(copyBtnId);
    this.rawCode = '';

    if (this.copyBtn) {
      this.copyBtn.addEventListener('click', () => {
        if (this.rawCode) {
          navigator.clipboard.writeText(this.rawCode).then(() => {
            const orig = this.copyBtn.textContent;
            this.copyBtn.textContent = 'Copied!';
            setTimeout(() => (this.copyBtn.textContent = orig), 2000);
          });
        }
      });
    }
  }

  setData(irData) {
    if (!irData || irData.status === 'unavailable') {
      this.rawCode = '';
      if (this.codeEl) {
        this.codeEl.textContent = irData ? irData.reason : 'Intermediate representation unavailable.';
      }
      if (this.metaEl) {
        this.metaEl.textContent = 'GCC -fdump-tree-gimple | Status: Unavailable';
      }
      return;
    }

    this.rawCode = irData.code || '';
    if (this.codeEl) {
      this.codeEl.textContent = this.rawCode;
    }

    if (this.metaEl) {
      this.metaEl.innerHTML = `
        <span><strong>Producing Tool:</strong> ${irData.producingTool || 'GCC GIMPLE Dump'}</span> •
        <span><strong>Functions:</strong> ${(irData.functions || []).length}</span> •
        <span><strong>Temporaries:</strong> ${(irData.temporaryVariables || []).length}</span>
      `;
    }
  }
}
