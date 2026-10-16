'use strict';

const path = require('path');
const fs = require('fs');
const { exec, execFile } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

class WorkerManager {
  constructor() {
    this.compilerDir = process.env.COMPILER_DIR || path.resolve(__dirname, '..', '..', '..', 'Compiler-main');
    this.composeFiles = ['docker-compose.yml', 'docker-compose.security-test.yml'];
  }

  getWorkerUrl() {
    return (process.env.COMPILER_WORKER_URL || 'http://127.0.0.1:6060').replace(/\/+$/, '');
  }

  getWorkerToken() {
    return process.env.COMPILER_WORKER_TOKEN || '';
  }

  async checkHealth(timeoutMs = 3000) {
    const token = this.getWorkerToken();
    try {
      const res = await fetch(`${this.getWorkerUrl()}/health`, {
        method: 'GET',
        headers: token ? { authorization: `Bearer ${token}` } : {},
        signal: AbortSignal.timeout(timeoutMs)
      });
      if (!res.ok) return { healthy: false, status: res.status };
      const data = await res.json().catch(() => null);
      return { healthy: Boolean(data?.success), status: res.status, data };
    } catch (err) {
      return { healthy: false, error: err.message };
    }
  }

  async isDockerAvailable() {
    try {
      await execPromise('docker --version');
      return true;
    } catch (_) {
      return false;
    }
  }

  async startWorker() {
    if (!fs.existsSync(this.compilerDir)) {
      throw new Error(`Compiler directory not found at: ${this.compilerDir}`);
    }

    const token = this.getWorkerToken();
    const cmd = `docker compose -f docker-compose.yml -f docker-compose.security-test.yml up compiler-worker -d`;

    const env = {
      ...process.env,
      COMPILER_WORKER_TOKEN: token,
      WORKER_TOKEN: token
    };

    const { stdout, stderr } = await execPromise(cmd, {
      cwd: this.compilerDir,
      env
    });

    // Poll for health up to 15 seconds
    const maxWaitMs = 15000;
    const intervalMs = 1000;
    const start = Date.now();

    while (Date.now() - start < maxWaitMs) {
      const health = await this.checkHealth(2000);
      if (health.healthy) {
        return { success: true, stdout, stderr, health: health.data };
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }

    return { success: false, stdout, stderr, warning: 'Worker started but health check timed out.' };
  }

  async stopWorker() {
    if (!fs.existsSync(this.compilerDir)) {
      throw new Error(`Compiler directory not found at: ${this.compilerDir}`);
    }

    const cmd = `docker compose -f docker-compose.yml -f docker-compose.security-test.yml stop compiler-worker`;
    const { stdout, stderr } = await execPromise(cmd, { cwd: this.compilerDir });
    return { success: true, stdout, stderr };
  }

  async getStatus() {
    const health = await this.checkHealth(2000);
    const dockerOk = await this.isDockerAvailable();
    let composePs = null;

    if (dockerOk && fs.existsSync(this.compilerDir)) {
      try {
        const { stdout } = await execPromise('docker compose -f docker-compose.yml -f docker-compose.security-test.yml ps --format json', {
          cwd: this.compilerDir
        });
        composePs = stdout ? JSON.parse(`[${stdout.trim().split('\n').join(',')}]`) : [];
      } catch (_) {}
    }

    return {
      dockerAvailable: dockerOk,
      workerOnline: health.healthy,
      workerUrl: this.getWorkerUrl(),
      healthData: health.data || null,
      containers: composePs
    };
  }

  async ensureWorkerRunning() {
    try {
      const currentHealth = await this.checkHealth(2000);
      if (currentHealth.healthy) {
        console.log(`[Compiler Worker] Worker is already online & healthy at ${this.getWorkerUrl()}`);
        return true;
      }

      console.log(`[Compiler Worker] Worker is offline. Attempting to start isolated Docker worker...`);
      const dockerAvailable = await this.isDockerAvailable();
      if (!dockerAvailable) {
        console.warn(`[Compiler Worker] Docker is not detected or not running. Compilation will operate in fail-closed mode.`);
        return false;
      }

      const result = await this.startWorker();
      if (result.success) {
        console.log(`[Compiler Worker] Isolated GCC worker started successfully at ${this.getWorkerUrl()}`);
        return true;
      } else {
        console.warn(`[Compiler Worker] Startup completed with warning:`, result.warning || result.stderr);
        return false;
      }
    } catch (err) {
      console.warn(`[Compiler Worker] Could not auto-start worker: ${err.message}. Compilation will run in fail-closed mode.`);
      return false;
    }
  }
}

module.exports = new WorkerManager();
