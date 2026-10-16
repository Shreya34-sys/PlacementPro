/**
 * API Client for C-Visualize REST API
 */
// The backend serves the frontend in production. During local frontend-only
// development (for example VS Code Live Server on :3000), send API calls to
// the local backend instead of the static file server.
const API_BASE = (() => {
  const { protocol, hostname, port } = window.location;
  if (port === '3000') return `${protocol}//${hostname}:5050/api/v1`;
  return '/api/v1';
})();

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('c_visualize_token') || null;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('c_visualize_token', token);
    } else {
      localStorage.removeItem('c_visualize_token');
    }
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options,
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const body = await response.text();
      let data;
      if (contentType.includes('application/json')) {
        try {
          data = JSON.parse(body);
        } catch {
          throw new Error(`The API returned invalid JSON (HTTP ${response.status}).`);
        }
      } else {
        const preview = body.replace(/\s+/g, ' ').trim().slice(0, 120);
        throw new Error(`Expected a JSON response from ${url}, but received ${contentType || 'an unknown content type'} (HTTP ${response.status})${preview ? `: ${preview}` : '.'}`);
      }
      if (!response.ok) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }
      return data;
    } catch (err) {
      console.error(`[API Error] ${endpoint}:`, err);
      throw err;
    }
  }

  // Auth endpoints
  async register(username, email, password) {
    const res = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    if (res.data && res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async login(username, password) {
    const res = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    if (res.data && res.data.token) {
      this.setToken(res.data.token);
    }
    return res.data;
  }

  async logout() {
    this.setToken(null);
    return { success: true };
  }

  async getMe() {
    if (!this.token) return null;
    try {
      const res = await this.request('/auth/me');
      return res.data.user;
    } catch (e) {
      this.setToken(null);
      return null;
    }
  }

  // Compiler endpoints
  async compile(sourceCode, standard = 'c17', optimization = '-O0', projectId = null, sourceVersionId = null) {
    return this.request('/compile', {
      method: 'POST',
      body: JSON.stringify({
        sourceCode,
        standard,
        optimization,
        projectId,
        sourceVersionId,
      }),
    });
  }

  async run(jobId, stdin = '', timeoutMs = 5000) {
    return this.request(`/compilations/${jobId}/run`, {
      method: 'POST',
      body: JSON.stringify({ stdin, timeoutMs }),
    });
  }

  async cancel(jobId) {
    return this.request(`/compilations/${jobId}/cancel`, { method: 'POST' });
  }

  async getCompilation(jobId) {
    return this.request(`/compilations/${jobId}`);
  }

  async getArtifacts(jobId) {
    return this.request(`/compilations/${jobId}/artifacts`);
  }

  async getHealth() {
    return this.request('/health');
  }

  async getCompilerInfo() {
    return this.request('/compiler/info');
  }

  // Project endpoints
  async getProjects() {
    return this.request('/projects');
  }

  async createProject(projectName, description, initialSource, languageStandard) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify({ projectName, description, initialSource, languageStandard }),
    });
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`);
  }

  async saveProjectVersion(projectId, sourceCode, languageStandard) {
    return this.request(`/projects/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify({ sourceCode, languageStandard }),
    });
  }
}

export const api = new ApiClient();
