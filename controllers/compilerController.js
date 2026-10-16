'use strict';

const compilerService = require('../services/compiler/compilerService');
const projectService = require('../services/compiler/project.service');

class CompilerController {
  async getInfo(req, res, next) {
    try {
      const info = await compilerService.getCompilerInfo();
      res.status(200).json({
        success: true,
        data: info
      });
    } catch (err) {
      next(err);
    }
  }

  async compile(req, res) {
    try {
      const { sourceCode, standard, optimization, projectId, sourceVersionId } = req.body;
      const userId = req.user ? req.user.id : null;

      if ((projectId || sourceVersionId) && !userId) {
        return res.status(401).json({ success: false, error: 'Sign in before compiling a saved project version.' });
      }

      if (projectId || sourceVersionId) {
        if (projectId) await projectService.getProjectById(parseInt(projectId, 10), userId);
        if (sourceVersionId) {
          const version = await projectService.getVersionById(parseInt(sourceVersionId, 10), userId);
          if (projectId && String(version.project_id) !== String(projectId)) {
            return res.status(400).json({ success: false, error: 'Source version does not belong to the selected project.' });
          }
        }
      }

      const result = await compilerService.compileAndVisualize({
        sourceCode,
        standard,
        optimization,
        userId,
        projectId: projectId ? parseInt(projectId, 10) : null,
        sourceVersionId: sourceVersionId ? parseInt(sourceVersionId, 10) : null,
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'COMPILATION_ERROR'
      });
    }
  }

  async run(req, res) {
    try {
      const { id } = req.params;
      const { stdin, timeoutMs } = req.body;
      const userId = req.user ? req.user.id : null;

      const result = await compilerService.executeProgram(id, {
        stdin: stdin || '',
        timeoutMs: timeoutMs ? parseInt(timeoutMs, 10) : 5000,
        userId
      });

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'EXECUTION_ERROR'
      });
    }
  }

  async cancel(req, res) {
    try {
      const { id } = req.params;
      const result = await compilerService.cancelJob(id);
      res.status(200).json({
        success: true,
        message: 'Sandbox cancellation requested.',
        data: result
      });
    } catch (err) {
      res.status(err.status || 400).json({
        success: false,
        error: err.message
      });
    }
  }

  async getCompilation(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user ? req.user.id : null;

      const job = await compilerService.getJob(id, userId);
      if (!job) {
        return res.status(404).json({
          success: false,
          error: 'Compilation job not found.'
        });
      }

      res.status(200).json({
        success: true,
        data: job
      });
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message
      });
    }
  }

  async getExercises(req, res) {
    try {
      const exercises = compilerService.getExercises();
      res.status(200).json({
        success: true,
        data: exercises
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  async getExercise(req, res) {
    try {
      const { id } = req.params;
      const exercise = compilerService.getExerciseById(id);
      if (!exercise) {
        return res.status(404).json({
          success: false,
          error: `Exercise '${id}' not found.`
        });
      }
      res.status(200).json({
        success: true,
        data: exercise
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  async getAttempts(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required to view exercise attempts.'
        });
      }

      const attempts = await compilerService.getExerciseAttempts(userId);
      res.status(200).json({
        success: true,
        data: attempts
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }

  async recordAttempt(req, res) {
    try {
      const userId = req.user ? req.user.id : null;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: 'Authentication required to save exercise attempt.'
        });
      }

      const { exerciseId, jobId, status, testResults } = req.body;
      if (!exerciseId) {
        return res.status(400).json({
          success: false,
          error: 'exerciseId is required.'
        });
      }

      const attempt = await compilerService.recordExerciseAttempt(userId, exerciseId, {
        jobId,
        status: status || 'in_progress',
        testResults
      });

      res.status(200).json({
        success: true,
        data: attempt
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: err.message
      });
    }
  }
}

module.exports = new CompilerController();
