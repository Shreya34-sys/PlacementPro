/**
 * Phase 2: Syntax Analysis AST Tree Visualizer
 * Interactive hierarchical syntax tree with expand/collapse and source range highlighting.
 */

export class AstViewer {
  constructor(containerId, onNodeClick) {
    this.container = document.getElementById(containerId);
    this.onNodeClick = onNodeClick;
    this.astData = null;
  }

  setAst(astResult) {
    this.astData = astResult && astResult.ast ? astResult.ast : null;
    this.errors = astResult ? astResult.errors || [] : [];
    this.render();
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = '';

    if (!this.astData) {
      this.container.innerHTML = `
        <div style="text-align: center; color: var(--secondary-text); padding: 40px;">
          <p>No Abstract Syntax Tree available. Please compile a valid C program.</p>
        </div>
      `;
      return;
    }

    // Controls bar: Expand All, Collapse All
    const toolbar = document.createElement('div');
    toolbar.style.display = 'flex';
    toolbar.style.alignItems = 'center';
    toolbar.style.justifyContent = 'space-between';
    toolbar.style.marginBottom = '12px';
    toolbar.innerHTML = `
      <div style="display: flex; gap: 8px;">
        <button class="btn btn-secondary btn-sm" id="btn-ast-expand">Expand All</button>
        <button class="btn btn-secondary btn-sm" id="btn-ast-collapse">Collapse All</button>
      </div>
      <div style="font-size: 11px; color: var(--secondary-text);">
        Click any syntax node to inspect and highlight its source code range in Monaco.
      </div>
    `;
    this.container.appendChild(toolbar);

    toolbar.querySelector('#btn-ast-expand').addEventListener('click', () => {
      this.container.querySelectorAll('.ast-tree-children').forEach((el) => (el.style.display = 'block'));
    });
    toolbar.querySelector('#btn-ast-collapse').addEventListener('click', () => {
      this.container.querySelectorAll('.ast-tree-children').forEach((el, idx) => {
        if (idx > 0) el.style.display = 'none';
      });
    });

    const treeRoot = this.renderNode(this.astData, true);
    this.container.appendChild(treeRoot);
  }

  renderNode(node, isRoot = false) {
    // The lightweight C parser can emit an empty placeholder for unsupported
    // constructs (for example, declarations in some loop forms). Ignore those
    // entries so one malformed AST child cannot abort the entire compilation UI.
    if (!node || typeof node !== 'object') return null;

    const nodeEl = document.createElement('div');
    nodeEl.className = 'ast-tree-node';

    const header = document.createElement('div');
    header.className = 'ast-node-header';

    const children = Array.isArray(node.children) ? node.children.filter((child) => child && typeof child === 'object') : [];
    const hasChildren = children.length > 0;
    const toggleIcon = hasChildren ? '▼ ' : '• ';

    header.innerHTML = `
      <span class="ast-toggle" style="cursor: pointer; font-size: 10px;">${toggleIcon}</span>
      <span class="ast-node-type">${this.escapeHtml(node.type)}</span>
      <span class="ast-node-name">${this.escapeHtml(node.name || '')}</span>
      <span class="ast-node-badge">L${node.startLine || 1}:${node.startCol || 1}</span>
    `;

    // Click on node header highlights source code in editor
    header.addEventListener('click', (e) => {
      // Toggle children if clicking arrow or header
      if (hasChildren && (e.target.classList.contains('ast-toggle') || e.ctrlKey)) {
        const childContainer = nodeEl.querySelector('.ast-tree-children');
        if (childContainer) {
          const isHidden = childContainer.style.display === 'none';
          childContainer.style.display = isHidden ? 'block' : 'none';
          header.querySelector('.ast-toggle').textContent = isHidden ? '▼ ' : '▶ ';
        }
      }

      if (this.onNodeClick && node.startLine) {
        this.onNodeClick(node.startLine, node.startCol, node.endLine || node.startLine, node.endCol || node.startCol + 4);
      }
    });

    nodeEl.appendChild(header);

    if (hasChildren) {
      const childrenContainer = document.createElement('div');
      childrenContainer.className = 'ast-tree-children';
      for (const child of children) {
        const childElement = this.renderNode(child, false);
        if (childElement) childrenContainer.appendChild(childElement);
      }
      nodeEl.appendChild(childrenContainer);
    }

    return nodeEl;
  }

  escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
