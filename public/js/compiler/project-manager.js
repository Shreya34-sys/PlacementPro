/**
 * Project and Version Manager
 */
import { api } from './api.js';

export class ProjectManager {
  constructor(editorManager, onProjectLoaded) {
    this.editorManager = editorManager;
    this.onProjectLoaded = onProjectLoaded;
    this.currentProject = null;
    this.modalEl = document.getElementById('project-modal');
    this.modalTitle = document.getElementById('project-modal-title');
    this.modalBody = document.getElementById('project-modal-body');
    this.modalCloseBtn = document.getElementById('project-modal-close');

    if (this.modalCloseBtn) {
      this.modalCloseBtn.addEventListener('click', () => this.closeModal());
    }
  }

  showModal(title, contentHtml) {
    if (!this.modalEl) return;
    this.modalTitle.textContent = title;
    this.modalBody.innerHTML = contentHtml;
    this.modalEl.classList.add('active');
  }

  closeModal() {
    if (this.modalEl) {
      this.modalEl.classList.remove('active');
    }
  }

  async promptNewProject() {
    const user = await api.getMe();
    if (!user) {
      alert('Project saving is unavailable in guest mode. You can still compile and run code.');
      return;
    }

    this.showModal(
      'Create New Project',
      `
      <div class="form-group">
        <label class="form-label">Project Name</label>
        <input type="text" id="new-proj-name" class="form-control" placeholder="e.g., Matrix Multiplication" />
      </div>
      <div class="form-group">
        <label class="form-label">Description (optional)</label>
        <textarea id="new-proj-desc" class="form-control" rows="3" placeholder="Brief project overview"></textarea>
      </div>
      <div style="display:flex; justify-content:flex-end; gap:8px;">
        <button class="btn btn-secondary" id="btn-cancel-proj">Cancel</button>
        <button class="btn btn-primary" id="btn-create-proj">Create Project</button>
      </div>
      `
    );

    document.getElementById('btn-cancel-proj').onclick = () => this.closeModal();
    document.getElementById('btn-create-proj').onclick = async () => {
      const name = document.getElementById('new-proj-name').value;
      const desc = document.getElementById('new-proj-desc').value;
      if (!name) return alert('Project name is required.');

      try {
        const curCode = this.editorManager.getCode();
        const project = await api.createProject(name, desc, curCode);
        this.currentProject = project.data;
        this.closeModal();
        if (this.onProjectLoaded) this.onProjectLoaded(this.currentProject);
        alert(`Project '${name}' created and saved!`);
      } catch (err) {
        alert('Failed to create project: ' + err.message);
      }
    };
  }

  async promptOpenProject() {
    const user = await api.getMe();
    if (!user) {
      alert('Please log in to browse your saved projects.');
      return;
    }

    try {
      const res = await api.getProjects();
      const projects = res.data || [];

      let listHtml = '';
      if (projects.length === 0) {
        listHtml = '<p style="color:var(--secondary-text); padding:20px; text-align:center;">No saved projects found. Create one first!</p>';
      } else {
        listHtml = '<div style="display:flex; flex-direction:column; gap:8px;">';
        projects.forEach((p) => {
          listHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; background:var(--secondary-bg); border:1px solid var(--border-color); border-radius:var(--radius-md);">
              <div>
                <strong>${p.project_name}</strong>
                <div style="font-size:11px; color:var(--secondary-text);">${p.description || 'No description'} • Updated ${new Date(p.updated_at).toLocaleDateString()}</div>
              </div>
              <button class="btn btn-primary btn-sm btn-load-proj" data-id="${p.id}">Open</button>
            </div>
          `;
        });
        listHtml += '</div>';
      }

      this.showModal('Open Project from MySQL', listHtml);

      this.modalBody.querySelectorAll('.btn-load-proj').forEach((btn) => {
        btn.onclick = async () => {
          const id = btn.dataset.id;
          try {
            const fullProj = await api.getProject(id);
            this.currentProject = fullProj.data;
            if (this.currentProject.latestVersion) {
              this.editorManager.setCode(this.currentProject.latestVersion.source_code);
            }
            this.closeModal();
            if (this.onProjectLoaded) this.onProjectLoaded(this.currentProject);
          } catch (e) {
            alert('Error loading project: ' + e.message);
          }
        };
      });
    } catch (err) {
      alert('Error fetching projects: ' + err.message);
    }
  }

  async saveCurrentVersion() {
    if (!this.currentProject) {
      return this.promptNewProject();
    }
    try {
      const curCode = this.editorManager.getCode();
      await api.saveProjectVersion(this.currentProject.id, curCode);
      alert(`Version saved successfully for '${this.currentProject.project_name}'!`);
    } catch (err) {
      alert('Failed to save version: ' + err.message);
    }
  }
}
