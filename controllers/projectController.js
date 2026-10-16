'use strict';

const projectService = require('../services/compiler/project.service');

class ProjectController {
  async listProjects(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to access projects.' });
      }
      const projects = await projectService.getProjectsByUser(userId);
      res.json({ success: true, data: projects });
    } catch (err) {
      next(err);
    }
  }

  async createProject(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to create a project.' });
      }
      const { projectName, description, initialSource, languageStandard } = req.body;
      const project = await projectService.createProject(userId, {
        projectName,
        description,
        initialSource,
        languageStandard,
      });
      res.status(201).json({ success: true, data: project });
    } catch (err) {
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  }

  async getProject(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to access this project.' });
      }
      const projectId = parseInt(req.params.id, 10);
      const project = await projectService.getProjectById(projectId, userId);
      res.json({ success: true, data: project });
    } catch (err) {
      res.status(err.status || 404).json({ success: false, error: err.message });
    }
  }

  async updateProject(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to update this project.' });
      }
      const projectId = parseInt(req.params.id, 10);
      const { projectName, description } = req.body;
      const updated = await projectService.updateProject(projectId, userId, {
        projectName,
        description,
      });
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  }

  async deleteProject(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to delete this project.' });
      }
      const projectId = parseInt(req.params.id, 10);
      await projectService.deleteProject(projectId, userId);
      res.json({ success: true, message: 'Project deleted successfully.' });
    } catch (err) {
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  }

  async listVersions(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to view versions.' });
      }
      const projectId = parseInt(req.params.id, 10);
      const versions = await projectService.getVersions(projectId, userId);
      res.json({ success: true, data: versions });
    } catch (err) {
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  }

  async saveVersion(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to save version.' });
      }
      const projectId = parseInt(req.params.id, 10);
      const { sourceCode, languageStandard } = req.body;
      const newVersion = await projectService.saveNewVersion(projectId, userId, {
        sourceCode,
        languageStandard,
      });
      res.status(201).json({ success: true, data: newVersion });
    } catch (err) {
      res.status(err.status || 400).json({ success: false, error: err.message });
    }
  }

  async getVersion(req, res, next) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({ success: false, error: 'Sign in to view version.' });
      }
      const versionId = parseInt(req.params.id, 10);
      const version = await projectService.getVersionById(versionId, userId);
      res.json({ success: true, data: version });
    } catch (err) {
      res.status(err.status || 404).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ProjectController();
