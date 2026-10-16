'use strict';

const projectRepo = require('./repositories/project.repo');
const versionRepo = require('./repositories/version.repo');

class ProjectService {
  async createProject(userId, { projectName, description, initialSource = '', languageStandard = 'c17' }) {
    if (!projectName || projectName.trim().length === 0) {
      const err = new Error('Project name is required.');
      err.status = 400;
      throw err;
    }

    const project = await projectRepo.create({
      userId,
      projectName: projectName.trim(),
      description,
    });

    const defaultCode = initialSource || '#include <stdio.h>\n\nint main() {\n    printf("Hello, C-Visualize!\\n");\n    return 0;\n}\n';
    const version = await versionRepo.create({
      projectId: project.id,
      sourceCode: defaultCode,
      languageStandard,
    });

    return {
      ...project,
      currentVersion: version,
    };
  }

  async getProjectsByUser(userId) {
    return projectRepo.findByUserId(userId);
  }

  async getProjectById(projectId, userId) {
    const project = await projectRepo.findById(projectId);
    if (!project) {
      const err = new Error('Project not found.');
      err.status = 404;
      throw err;
    }
    if (project.user_id && String(project.user_id) !== String(userId)) {
      const err = new Error('Access denied: You do not have permission to view this project.');
      err.status = 403;
      throw err;
    }

    const versions = await versionRepo.findByProjectId(projectId);
    return {
      ...project,
      versions,
      latestVersion: versions[0] || null,
    };
  }

  async updateProject(projectId, userId, { projectName, description }) {
    await this.getProjectById(projectId, userId); // verifies ownership
    return projectRepo.update(projectId, userId, { projectName, description });
  }

  async deleteProject(projectId, userId) {
    await this.getProjectById(projectId, userId); // verifies ownership
    return projectRepo.delete(projectId, userId);
  }

  async saveNewVersion(projectId, userId, { sourceCode, languageStandard = 'c17' }) {
    await this.getProjectById(projectId, userId); // verifies ownership
    if (!sourceCode || typeof sourceCode !== 'string') {
      const err = new Error('Source code is required.');
      err.status = 400;
      throw err;
    }
    return versionRepo.create({
      projectId,
      sourceCode,
      languageStandard,
    });
  }

  async getVersions(projectId, userId) {
    await this.getProjectById(projectId, userId); // verifies ownership
    return versionRepo.findByProjectId(projectId);
  }

  async getVersionById(versionId, userId) {
    const version = await versionRepo.findById(versionId);
    if (!version) {
      const err = new Error('Version not found.');
      err.status = 404;
      throw err;
    }
    await this.getProjectById(version.project_id, userId); // verifies ownership
    return version;
  }
}

module.exports = new ProjectService();
