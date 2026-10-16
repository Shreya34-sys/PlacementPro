'use strict';

const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const pool = require('../../config/db');
const worker = require('./worker.client');
const tokenAnalyzer = require('./token-analyzer');
const astGenerator = require('./ast-generator');
const semanticAnalyzer = require('./semantic-analyzer');
const irExtractor = require('./ir-extractor');
const optimizationComparator = require('./optimization-comparator');
const assemblyAnalyzer = require('./assembly-analyzer');
const { parseDiagnostics } = require('./diagnostics');
const sampleExercises = require('./sampleExercises');

const MAX_SOURCE_BYTES = 65536;
const SUPPORTED_STANDARDS = ['c90', 'c99', 'c11', 'c17', 'c23'];
const SUPPORTED_OPTIMIZATIONS = ['-O0', '-O1', '-O2', '-O3'];

class CompilerService {
  constructor() {
    this.activeJobs = new Map();
  }

  async getCompilerInfo() {
    let workerOnline = false;
    let toolchain = null;
    let errorMsg = null;

    // Check if original C-Visualize backend service is running externally
    const originalServiceUrl = process.env.ORIGINAL_COMPILER_SERVICE_URL;
    if (originalServiceUrl) {
      try {
        const resp = await fetch(`${originalServiceUrl.replace(/\/+$/, '')}/api/v1/compiler/info`, {
          signal: AbortSignal.timeout(2000)
        });
        if (resp.ok) {
          const body = await resp.json();
          if (body && body.data) {
            return {
              ...body.data,
              serviceMode: 'Connected to original C-Visualize backend service (Reverse Proxy Adapter)',
              workerOnline: body.data.workerOnline ?? true
            };
          }
        }
      } catch (_) {}
    }

    try {
      toolchain = await worker.info();
      workerOnline = true;
    } catch (err) {
      errorMsg = err.message;
    }

    return {
      compiler: 'gcc',
      workerOnline,
      version: toolchain ? toolchain.version : 'Unavailable',
      targetArchitecture: toolchain ? toolchain.target : 'x86_64-linux-gnu (Docker sandbox)',
      supportedStandards: toolchain ? toolchain.supportedStandards : SUPPORTED_STANDARDS,
      supportedOptimizations: SUPPORTED_OPTIMIZATIONS,
      isolation: 'One disposable Docker container per job (network=none, read-only root, UID 10001)',
      limits: {
        maxSourceBytes: MAX_SOURCE_BYTES,
        maxExecutionTimeMs: 5000,
        maxOutputBytes: 524288
      },
      statusMessage: workerOnline
        ? `Isolated GCC Worker ready: GCC ${toolchain.version} (${toolchain.target})`
        : `Compiler worker is currently offline or unconfigured: ${errorMsg}. Host execution refused.`
    };
  }

  async compileAndVisualize({
    sourceCode,
    standard = 'c17',
    optimization = '-O0',
    userId = null,
    projectId = null,
    sourceVersionId = null
  }) {
    if (typeof sourceCode !== 'string' || sourceCode.trim().length === 0) {
      const err = new Error('C source code is required.');
      err.status = 400;
      throw err;
    }

    const sourceBytes = Buffer.byteLength(sourceCode, 'utf8');
    if (sourceBytes > MAX_SOURCE_BYTES) {
      const err = new Error(`Source code exceeds maximum limit of ${MAX_SOURCE_BYTES} bytes (received ${sourceBytes} bytes).`);
      err.status = 413;
      throw err;
    }

    const std = (standard || 'c17').toLowerCase();
    const opt = (optimization || '-O0');

    if (!SUPPORTED_STANDARDS.includes(std)) {
      const err = new Error(`Unsupported C standard '${std}'. Choose from: ${SUPPORTED_STANDARDS.join(', ')}.`);
      err.status = 400;
      throw err;
    }

    if (!SUPPORTED_OPTIMIZATIONS.includes(opt)) {
      const err = new Error(`Unsupported optimization level '${opt}'. Choose from: ${SUPPORTED_OPTIMIZATIONS.join(', ')}.`);
      err.status = 400;
      throw err;
    }

    const jobId = uuidv4();
    const sourceHash = crypto.createHash('sha256').update(sourceCode, 'utf8').digest('hex');
    const startTime = Date.now();

    // PHASE 1: LEXICAL ANALYSIS (Real Tokenizer)
    const lexicalArtifact = tokenAnalyzer.analyze(sourceCode);

    // PHASE 2: SYNTAX ANALYSIS (Real AST Generator)
    const syntaxArtifact = astGenerator.generate(sourceCode);

    // Persist initial job record in MySQL
    try {
      await pool.query(
        `INSERT INTO compiler_jobs (id, user_id, source_code, compiler_name, optimization_level, language_standard, status)
         VALUES (?, ?, ?, 'gcc', ?, ?, 'compiling')`,
        [jobId, userId, sourceCode, opt, std]
      );
    } catch (dbErr) {
      console.warn('[CompilerService] Could not persist initial job to compiler_jobs:', dbErr.message);
    }

    try {
      await pool.query(
        `INSERT INTO compilation_jobs (id, user_id, project_id, source_version_id, compiler_name, optimization_level, language_standard, status)
         VALUES (?, ?, ?, ?, 'gcc', ?, ?, 'compiling')`,
        [jobId, userId, projectId || null, sourceVersionId || null, opt, std]
      );
    } catch (dbErr) {
      console.warn('[CompilerService] Could not persist initial job to compilation_jobs:', dbErr.message);
    }

    // Call Real GCC Worker or Original Service Proxy
    let versionInfo;
    let gccResult;
    try {
      if (originalServiceUrl) {
        try {
          const resp = await fetch(`${originalServiceUrl.replace(/\/+$/, '')}/api/v1/compile`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceCode, standard: std, optimization: opt }),
            signal: AbortSignal.timeout(15000)
          });
          if (resp.ok) {
            const externalData = await resp.json();
            if (externalData && externalData.success && externalData.data) {
              return externalData.data;
            }
          }
        } catch (_) {
          // If original service is unreachable, proceed to isolated worker
        }
      }

      versionInfo = await worker.info();
      const workerResponse = await worker.compile({
        jobId,
        sourceCode,
        standard: std,
        optimization: opt
      });
      gccResult = {
        ...workerResponse,
        diagnostics: parseDiagnostics(workerResponse.rawStderr || '', 'program.c')
      };
    } catch (workerErr) {
      // Fail-closed handling: If worker is offline or unconfigured, never run on host
      const durationMs = Date.now() - startTime;
      try {
        await pool.query(
          `UPDATE compiler_jobs SET status = 'failed', duration_ms = ? WHERE id = ?`,
          [durationMs, jobId]
        );
      } catch (_) {}

      // Re-throw with status code preserved
      const err = new Error(`Isolated compiler worker failed or is unavailable: ${workerErr.message}`);
      err.status = workerErr.status || 503;
      err.code = workerErr.code || 'WORKER_UNAVAILABLE';
      throw err;
    }

    // PHASE 3: SEMANTIC ANALYSIS (Symbol table + real GCC diagnostics)
    const semanticArtifact = semanticAnalyzer.analyze(syntaxArtifact, gccResult.diagnostics);

    // PHASE 4: INTERMEDIATE CODE GENERATION (GCC GIMPLE IR)
    const irArtifact = irExtractor.extract(gccResult.gimple, versionInfo.version);

    // PHASE 5: CODE OPTIMIZATION (GCC Optimization Pass Comparison)
    const optArtifact = optimizationComparator.compare(
      gccResult.gimple,
      gccResult.optimizedGimple,
      gccResult.optimizationRemarks,
      opt
    );

    // PHASE 6: TARGET CODE GENERATION (GCC Assembly)
    const targetCodeArtifact = assemblyAnalyzer.analyze(gccResult.assembly, {
      targetArchitecture: versionInfo.target,
      compilerVersion: versionInfo.version,
      flags: [`-std=${std}`, opt, '-S', '-fverbose-asm']
    });

    // Supporting Build Stages: Preprocessing & Linking
    const preprocessingArtifact = {
      status: gccResult.preprocessing ? 'success' : 'unavailable',
      content: gccResult.preprocessing ? gccResult.preprocessing.full : '',
      summary: gccResult.preprocessing ? gccResult.preprocessing.summary : 'Preprocessing unavailable',
      producingTool: `GCC -std=${std} -E -dD (GNU Preprocessor)`,
      explanation: 'The C Preprocessor processes directives (#include, #define), strips comments, and expands macros.'
    };

    const linkingArtifact = {
      status: gccResult.linkingSuccess ? 'success' : 'failed',
      executableProduced: gccResult.linkingSuccess,
      diagnostics: (gccResult.diagnostics || []).filter(
        (d) => d.phase === 'Linking Stage' || d.category === 'Linker Error'
      ),
      producingTool: 'GNU ld Linker (invoked via GCC)',
      explanation: 'The Linker combines compiled object files with C runtime libraries to produce the executable binary.'
    };

    const isCompilationSuccess = Boolean(gccResult.success);
    const hasSyntaxErrors = (gccResult.diagnostics || []).some(
      (d) => d.phase === 'Syntax Analysis' && d.severity === 'error'
    );
    const hasSemanticErrors = (gccResult.diagnostics || []).some(
      (d) => d.phase === 'Semantic Analysis' && d.severity === 'error'
    );

    const provenance = {
      jobId,
      sourceHash,
      compiler: versionInfo,
      settings: { standard: std, optimization: opt }
    };

    for (const art of [lexicalArtifact, syntaxArtifact, semanticArtifact, irArtifact, optArtifact, targetCodeArtifact]) {
      if (art) art.provenance = provenance;
    }

    const phases = {
      lexical: {
        number: 1,
        name: 'Lexical Analysis',
        status: lexicalArtifact.status || 'success',
        producingTool: lexicalArtifact.producingTool,
        artifact: lexicalArtifact
      },
      syntax: {
        number: 2,
        name: 'Syntax Analysis',
        status: hasSyntaxErrors ? 'failed' : 'success',
        producingTool: syntaxArtifact.producingTool,
        artifact: syntaxArtifact
      },
      semantic: {
        number: 3,
        name: 'Semantic Analysis',
        status: hasSemanticErrors ? 'failed' : 'success',
        producingTool: semanticArtifact.producingTool,
        artifact: semanticArtifact
      },
      intermediate: {
        number: 4,
        name: 'Intermediate Code Generation',
        status: isCompilationSuccess && irArtifact.status === 'success' ? 'success' : 'blocked',
        producingTool: irArtifact.producingTool,
        artifact: irArtifact
      },
      optimization: {
        number: 5,
        name: 'Code Optimization',
        status: isCompilationSuccess && optArtifact.status === 'success' ? 'success' : 'blocked',
        producingTool: optArtifact.producingTool,
        artifact: optArtifact
      },
      target_code: {
        number: 6,
        name: 'Target Code Generation',
        status: isCompilationSuccess && targetCodeArtifact.status === 'success' ? 'success' : 'blocked',
        producingTool: targetCodeArtifact.producingTool,
        artifact: targetCodeArtifact
      }
    };

    const supporting = {
      preprocessing: preprocessingArtifact,
      linking: linkingArtifact
    };

    const durationMs = Date.now() - startTime;
    const overallStatus = isCompilationSuccess ? 'compiled' : 'failed';

    if (gccResult.linkingSuccess) {
      this.activeJobs.set(jobId, { createdAt: Date.now(), userId });
    } else {
      this.activeJobs.delete(jobId);
    }

    // Persist final job and artifacts in MySQL
    try {
      await pool.query(
        `UPDATE compiler_jobs
         SET status = ?, exit_code = ?, duration_ms = ?, compiler_version = ?, target_architecture = ?
         WHERE id = ?`,
        [overallStatus, gccResult.exitCode, durationMs, versionInfo.version, versionInfo.target, jobId]
      );
    } catch (_) {}

    try {
      await pool.query(
        `UPDATE compilation_jobs
         SET status = ?, exit_code = ?, duration_ms = ?, compiler_version = ?, target_architecture = ?, completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [overallStatus, gccResult.exitCode, durationMs, versionInfo.version, versionInfo.target, jobId]
      );
    } catch (_) {}

    try {
      const artifactsToSave = [
        ['lexical', 'tokens', lexicalArtifact, phases.lexical.status, lexicalArtifact.producingTool],
        ['syntax', 'ast', syntaxArtifact, phases.syntax.status, syntaxArtifact.producingTool],
        ['semantic', 'symbol_table', semanticArtifact, phases.semantic.status, semanticArtifact.producingTool],
        ['intermediate', 'gimple_ir', irArtifact, phases.intermediate.status, irArtifact.producingTool],
        ['optimization', 'optimization_diff', optArtifact, phases.optimization.status, optArtifact.producingTool],
        ['target_code', 'assembly', targetCodeArtifact, phases.target_code.status, targetCodeArtifact.producingTool]
      ];

      for (const [phaseName, artifactType, artObj, status, producingTool] of artifactsToSave) {
        const jsonStr = JSON.stringify(artObj);
        await pool.query(
          `INSERT INTO compiler_artifacts (job_id, phase_name, artifact_type, artifact_json, status, producing_tool)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [jobId, phaseName, artifactType, jsonStr, status, producingTool || 'gcc']
        ).catch(() => {});

        await pool.query(
          `INSERT INTO compilation_artifacts (compilation_job_id, phase_name, artifact_type, artifact_reference_or_json, status, producing_tool)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [jobId, phaseName, artifactType, jsonStr, status, producingTool || 'gcc']
        ).catch(() => {});
      }
    } catch (persistErr) {
      console.warn('[CompilerService] Error persisting artifacts to database:', persistErr.message);
    }

    return {
      jobId,
      sourceHash,
      status: overallStatus,
      success: isCompilationSuccess,
      compiler: versionInfo,
      settings: { standard: std, optimization: opt },
      durationMs,
      diagnostics: gccResult.diagnostics || [],
      rawStderr: gccResult.rawStderr || '',
      rawStdout: gccResult.rawStdout || '',
      phases,
      supporting
    };
  }

  async executeProgram(jobId, { stdin = '', timeoutMs = 5000, userId = null } = {}) {
    // Check if original C-Visualize backend service can execute this job
    const originalServiceUrl = process.env.ORIGINAL_COMPILER_SERVICE_URL;
    if (originalServiceUrl) {
      try {
        const resp = await fetch(`${originalServiceUrl.replace(/\/+$/, '')}/api/v1/compilations/${jobId}/run`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stdin, timeoutMs }),
          signal: AbortSignal.timeout(timeoutMs + 2000)
        });
        if (resp.ok) {
          const externalRun = await resp.json();
          if (externalRun && externalRun.data) {
            return externalRun.data;
          }
        }
      } catch (_) {
        // Fall back to worker execution
      }
    }

    const jobData = this.activeJobs.get(jobId);
    if (!jobData) {
      const err = new Error('Compiled binary not found or expired. Please compile the program first.');
      err.status = 404;
      throw err;
    }

    if (jobData.userId && userId && jobData.userId !== userId) {
      const err = new Error('Access denied to this compilation job.');
      err.status = 403;
      throw err;
    }

    const execResult = await worker.run({ jobId, stdin, timeoutMs });

    // Persist in MySQL
    try {
      await pool.query(
        `INSERT INTO compiler_execution_results (job_id, stdin, stdout, stderr, exit_code, duration_ms, termination_reason)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          jobId,
          stdin,
          execResult.stdout,
          execResult.stderr,
          execResult.exitCode,
          execResult.durationMs,
          execResult.terminationReason || 'normal'
        ]
      ).catch(() => {});

      await pool.query(
        `INSERT INTO execution_results (compilation_job_id, stdout, stderr, exit_code, execution_duration_ms, termination_reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          jobId,
          execResult.stdout,
          execResult.stderr,
          execResult.exitCode,
          execResult.durationMs,
          execResult.terminationReason || 'normal'
        ]
      ).catch(() => {});
    } catch (err) {
      console.warn('[CompilerService] Failed to persist execution result:', err.message);
    }

    return {
      jobId,
      ...execResult
    };
  }

  async getJob(jobId, userId = null) {
    let [jobs] = await pool.query('SELECT * FROM compiler_jobs WHERE id = ?', [jobId]).catch(() => [[]]);
    let tableName = 'compiler';
    if (!jobs || jobs.length === 0) {
      [jobs] = await pool.query('SELECT * FROM compilation_jobs WHERE id = ?', [jobId]).catch(() => [[]]);
      tableName = 'compilation';
    }
    if (!jobs || jobs.length === 0) return null;
    const job = jobs[0];

    if (job.user_id && userId && job.user_id !== userId) {
      const err = new Error('Access denied to this compilation job.');
      err.status = 403;
      throw err;
    }

    let artifacts = [];
    let results = [];
    if (tableName === 'compiler') {
      [artifacts] = await pool.query('SELECT * FROM compiler_artifacts WHERE job_id = ?', [jobId]).catch(() => [[]]);
      [results] = await pool.query('SELECT * FROM compiler_execution_results WHERE job_id = ? ORDER BY id DESC', [jobId]).catch(() => [[]]);
    } else {
      [artifacts] = await pool.query('SELECT * FROM compilation_artifacts WHERE compilation_job_id = ?', [jobId]).catch(() => [[]]);
      [results] = await pool.query('SELECT * FROM execution_results WHERE compilation_job_id = ? ORDER BY id DESC', [jobId]).catch(() => [[]]);
    }

    return {
      ...job,
      artifacts: (artifacts || []).map((a) => {
        try {
          const raw = a.artifact_json || a.artifact_reference_or_json;
          return { ...a, artifact: typeof raw === 'string' ? JSON.parse(raw) : raw };
        } catch (_) {
          return a;
        }
      }),
      results: results || []
    };
  }

  async cancelJob(jobId) {
    try {
      await worker.cancel(jobId);
    } catch (_) {}
    this.activeJobs.delete(jobId);
    return { success: true, message: 'Sandbox cancellation requested.' };
  }

  async recordExerciseAttempt(userId, exerciseId, { jobId = null, status = 'in_progress', testResults = null } = {}) {
    const id = uuidv4();
    await pool.query(
      `INSERT INTO compiler_exercise_attempts (id, user_id, exercise_id, job_id, status, test_results_json)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE job_id = VALUES(job_id), status = VALUES(status), test_results_json = VALUES(test_results_json), updated_at = NOW()`,
      [id, userId, exerciseId, jobId, status, testResults ? JSON.stringify(testResults) : null]
    );
    return { id, userId, exerciseId, status };
  }

  async getExerciseAttempts(userId) {
    if (!userId) return [];
    const [rows] = await pool.query(
      `SELECT * FROM compiler_exercise_attempts WHERE user_id = ? ORDER BY updated_at DESC`,
      [userId]
    );
    return rows.map((r) => {
      try {
        return { ...r, testResults: JSON.parse(r.test_results_json) };
      } catch (_) {
        return r;
      }
    });
  }

  getExercises() {
    return sampleExercises.EXERCISES;
  }

  getExerciseById(id) {
    return sampleExercises.getExerciseById(id);
  }
}

module.exports = new CompilerService();
