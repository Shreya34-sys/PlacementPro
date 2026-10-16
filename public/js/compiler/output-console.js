/**
 * Runtime Output Console & Interactive Stdin Manager
 */

export class OutputConsole {
  constructor(stdoutElId, stderrElId, stdinElId, metaElId, clearBtnId) {
    this.stdoutEl = document.getElementById(stdoutElId);
    this.stderrEl = document.getElementById(stderrElId);
    this.stdinEl = document.getElementById(stdinElId);
    this.metaEl = document.getElementById(metaElId);
    this.clearBtn = document.getElementById(clearBtnId);

    if (this.clearBtn) {
      this.clearBtn.addEventListener('click', () => this.clear());
    }
  }

  getStdin() {
    return this.stdinEl ? this.stdinEl.value : '';
  }

  setStdin(val) {
    if (this.stdinEl) {
      this.stdinEl.value = val;
    }
  }

  setExecutionResult(res) {
    if (this.stdoutEl) {
      this.stdoutEl.textContent = res.stdout || '(No standard output)';
    }

    if (this.stderrEl) {
      if (res.stderr && res.stderr.trim().length > 0) {
        this.stderrEl.style.display = 'block';
        this.stderrEl.textContent = res.stderr;
      } else {
        this.stderrEl.style.display = 'none';
        this.stderrEl.textContent = '';
      }
    }

    if (this.metaEl) {
      const isSuccess = res.exitCode === 0;
      const badgeClass = isSuccess ? 'badge-success' : 'badge-error';
      this.metaEl.innerHTML = `
        <span class="badge ${badgeClass}">Exit Code: ${res.exitCode}</span>
        <span>Duration: ${res.durationMs || 0} ms</span>
        <span>Reason: ${res.terminationReason || 'normal'}</span>
        ${res.outputTruncated ? '<span class="badge badge-warning">Output Truncated</span>' : ''}
      `;
    }
  }

  setBuildLog(data) {
    const logEl = document.getElementById('console-build-log');
    if (!logEl) return;
    const settings = data.settings || {};
    const phaseLines = Object.values(data.phases || {}).map((phase) =>
      `${phase.name}: ${phase.status}${phase.producingTool ? ` — ${phase.producingTool}` : ''}`
    );
    const lines = [
      `Build ${data.success ? 'succeeded' : 'failed'} (${data.durationMs ?? 0} ms)`,
      `Compiler: ${data.compiler?.version || 'version unavailable'}`,
      `Options: -std=${settings.standard || 'unknown'} ${settings.optimization || ''}`.trim(),
      `Job: ${data.jobId || 'unavailable'}`,
      ...phaseLines,
    ];
    if (data.rawStderr?.trim()) lines.push('', 'GCC output:', data.rawStderr.trim());
    logEl.textContent = lines.join('\n');
  }

  clear() {
    if (this.stdoutEl) this.stdoutEl.textContent = 'Compile the current source, then click Run Program to execute its GCC binary.';
    if (this.stderrEl) {
      this.stderrEl.style.display = 'none';
      this.stderrEl.textContent = '';
    }
    if (this.metaEl) this.metaEl.innerHTML = '';
    const buildLog = document.getElementById('console-build-log');
    if (buildLog) buildLog.textContent = 'Compile the current source to see build details.';
  }
}
