/**
 * Phase 1: Lexical Analysis Token Viewer
 * Interactive token table with search, category filtering, and source highlighting.
 */

export class TokenViewer {
  constructor(tableBodyId, searchInputId, filterContainerId, onTokenClick) {
    this.tableBody = document.getElementById(tableBodyId);
    this.searchInput = document.getElementById(searchInputId);
    this.filterContainer = document.getElementById(filterContainerId);
    this.onTokenClick = onTokenClick;

    this.tokens = [];
    this.activeCategory = 'ALL';
    this.searchTerm = '';

    if (this.searchInput) {
      this.searchInput.addEventListener('input', (e) => {
        this.searchTerm = e.target.value.toLowerCase();
        this.render();
      });
    }

    if (this.filterContainer) {
      this.filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('category-pill')) {
          this.filterContainer.querySelectorAll('.category-pill').forEach((p) => p.classList.remove('active'));
          e.target.classList.add('active');
          this.activeCategory = e.target.dataset.category;
          this.render();
        }
      });
    }
  }

  setTokens(tokenData) {
    this.tokens = tokenData && tokenData.tokens ? tokenData.tokens : [];
    this.render();
  }

  render() {
    if (!this.tableBody) return;
    this.tableBody.innerHTML = '';

    const filtered = this.tokens.filter((t) => {
      const matchCat = this.activeCategory === 'ALL' || t.type === this.activeCategory;
      const matchSearch =
        !this.searchTerm ||
        t.value.toLowerCase().includes(this.searchTerm) ||
        t.type.toLowerCase().includes(this.searchTerm);
      return matchCat && matchSearch;
    });

    if (filtered.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center; color: var(--secondary-text); padding: 24px;">No tokens match the filter.</td></tr>`;
      return;
    }

    filtered.forEach((t) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-family: var(--font-mono); color: var(--secondary-text);">${t.line}:${t.column}</td>
        <td><span class="badge ${this.getBadgeClass(t.type)}">${t.type}</span></td>
        <td class="token-val">${this.escapeHtml(t.value)}</td>
        <td style="color: var(--secondary-text); font-size: 11px;">${this.escapeHtml(t.explanation || '')}</td>
        <td><button class="btn btn-secondary btn-sm" title="Jump to line in editor">Jump</button></td>
      `;

      tr.addEventListener('click', () => {
        if (this.onTokenClick) {
          this.onTokenClick(t.line, t.column, t.line, t.column + (t.length || 1));
        }
      });

      this.tableBody.appendChild(tr);
    });
  }

  getBadgeClass(type) {
    switch (type) {
      case 'KEYWORD':
        return 'badge-primary';
      case 'IDENTIFIER':
        return 'badge-secondary';
      case 'OPERATOR':
        return 'badge-warning';
      case 'NUMERIC_CONSTANT':
      case 'STRING_LITERAL':
      case 'CHAR_LITERAL':
        return 'badge-success';
      case 'PREPROCESSOR':
        return 'badge-info';
      default:
        return 'badge-secondary';
    }
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
