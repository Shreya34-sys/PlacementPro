'use strict';

class WorkerClient {
  getWorkerUrl() {
    return (process.env.COMPILER_WORKER_URL || 'http://127.0.0.1:6060').replace(/\/+$/, '');
  }

  getWorkerToken() {
    return process.env.COMPILER_WORKER_TOKEN || '';
  }

  isConfigured() {
    return Boolean(this.getWorkerToken());
  }

  async request(route, payload = null, timeoutMs = 30000) {
    const workerToken = this.getWorkerToken();
    if (!workerToken) {
      const err = new Error('Compiler worker is not configured (COMPILER_WORKER_TOKEN missing). Refusing host-side compilation or execution for security.');
      err.status = 503;
      err.code = 'WORKER_UNCONFIGURED';
      throw err;
    }

    const url = `${this.getWorkerUrl()}${route}`;
    let response;
    try {
      response = await fetch(url, {
        method: payload ? 'POST' : 'GET',
        headers: {
          authorization: `Bearer ${workerToken}`,
          ...(payload ? { 'content-type': 'application/json' } : {})
        },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      const error = new Error(`Isolated compiler worker is unavailable (${cause.message}). Refusing host-side execution.`);
      error.status = 503;
      error.code = 'WORKER_UNAVAILABLE';
      error.cause = cause;
      throw error;
    }

    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) {
      const error = new Error(data?.error || `Compiler worker request failed with HTTP ${response.status}.`);
      error.status = response.status === 504 ? 504 : response.status >= 500 ? 503 : response.status;
      error.code = 'WORKER_ERROR';
      throw error;
    }

    return data.data !== undefined ? data.data : data;
  }

  info() {
    return this.request('/v1/info', {}, 30000);
  }

  compile(payload) {
    return this.request('/v1/compile', payload, 60000);
  }

  run(payload) {
    return this.request('/v1/run', payload, 15000);
  }

  cancel(jobId) {
    return this.request('/v1/cancel', { jobId }, 10000);
  }

  health() {
    return this.request('/health', null, 3000);
  }
}

module.exports = new WorkerClient();
