/**
 * Phase 5: Code Optimization Comparator Viewer
 * Shows before-and-after diff between unoptimized and optimized GCC GIMPLE IR.
 */

export class OptimizationViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
  }

  setData(optData) {
    if (!this.container) return;
    this.container.innerHTML = '';

    if (!optData || optData.status === 'unavailable') {
      this.container.innerHTML = `
        <div style="text-align: center; color: var(--secondary-text); padding: 40px;">
          <p>${optData ? optData.reason : 'Optimization artifacts unavailable.'}</p>
        </div>
      `;
      return;
    }

    const metrics = optData.instructionMetrics || { unoptimizedLines: 0, optimizedLines: 0, reductionPercent: 0 };
    const transformations = optData.detectedTransformations || [];

    // Render Metrics
    const metricsHtml = `
      <div class="opt-metrics-grid">
        <div class="opt-metric-card">
          <div class="opt-metric-val">${optData.optLevel || '-O0'}</div>
          <div class="opt-metric-label">Selected Optimization Level</div>
        </div>
        <div class="opt-metric-card">
          <div class="opt-metric-val">${metrics.reductionPercent}%</div>
          <div class="opt-metric-label">Instruction Line Reduction</div>
        </div>
        <div class="opt-metric-card">
          <div class="opt-metric-val">${optData.basicBlockCount || 0}</div>
          <div class="opt-metric-label">Control Flow Basic Blocks (&lt;bb&gt;)</div>
        </div>
      </div>
    `;

    // Render Observed Transformations
    let transHtml = `
      <div style="background: var(--main-bg); border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 14px; margin-bottom: 16px;">
        <h4 style="font-size: 13px; font-weight: 600; margin-bottom: 8px;">Observed Transformations from GCC Artifacts:</h4>
    `;

    transformations.forEach((t) => {
      transHtml += `
        <div style="display: flex; gap: 8px; margin-bottom: 6px; font-size: 12px;">
          <span class="badge badge-success" style="height: fit-content;">Observed</span>
          <div>
            <strong>${this.escapeHtml(t.type)}:</strong> ${this.escapeHtml(t.description)}
          </div>
        </div>
      `;
    });
    transHtml += `</div>`;

    // Render Side-by-Side Diff
    const diffHtml = `
      <div class="diff-container">
        <div class="diff-pane">
          <div class="diff-title">Baseline Unoptimized GIMPLE (-O0)</div>
          <pre class="code-pre" style="max-height: 400px;">${this.escapeHtml(optData.unoptimized || 'None')}</pre>
        </div>
        <div class="diff-pane">
          <div class="diff-title">Optimized GIMPLE (${optData.optLevel || '-O2'} -fdump-tree-optimized)</div>
          <pre class="code-pre" style="max-height: 400px;">${this.escapeHtml(optData.optimized || 'None')}</pre>
        </div>
      </div>
    `;

    this.container.innerHTML = metricsHtml + transHtml + diffHtml;
  }

  escapeHtml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
