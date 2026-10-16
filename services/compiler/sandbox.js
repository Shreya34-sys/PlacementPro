const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const config = require('../config/env');

class Sandbox {
  /**
   * Execute an arbitrary compiled binary with sandbox constraints.
   */
  async executeBinary(exePath, options = {}) {
    if (!fs.existsSync(exePath)) {
      throw new Error(`Executable not found at ${exePath}`);
    }

    const timeoutMs = options.timeoutMs || config.compiler.maxExecutionTimeMs;
    const maxOutputBytes = options.maxOutputBytes || config.compiler.maxOutputBytes;
    const stdinData = options.stdin || '';
    const cwd = path.dirname(exePath);

    return new Promise((resolve) => {
      const startTime = process.hrtime.bigint();
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let outputTruncated = false;
      let completed = false;
      let capturedBytes = 0;

      // Ensure directory is in path for mingw runtime dlls
      const env = {
        ...process.env,
        PATH: path.dirname(config.compiler.gccPath) + path.delimiter + process.env.PATH,
      };

      const proc = spawn(exePath, [], {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe'],
        detached: process.platform !== 'win32',
      });

      const timer = setTimeout(() => {
        if (!completed) {
          timedOut = true;
          this.terminateProcess(proc);
        }
      }, timeoutMs);

      // Pipe standard input
      if (stdinData) {
        try {
          proc.stdin.write(stdinData);
          proc.stdin.end();
        } catch (e) {
          // ignore broken pipe
        }
      } else {
        try {
          proc.stdin.end();
        } catch (e) {}
      }

      proc.stdout.on('data', (chunk) => {
        if (outputTruncated) return;
        const remaining = Math.max(0, maxOutputBytes - capturedBytes);
        const accepted = chunk.subarray(0, remaining);
        stdout += accepted.toString();
        capturedBytes += accepted.length;
        if (accepted.length < chunk.length) {
          outputTruncated = true;
          this.terminateProcess(proc);
        }
      });

      proc.stderr.on('data', (chunk) => {
        const remaining = Math.max(0, maxOutputBytes - capturedBytes);
        const accepted = chunk.subarray(0, remaining);
        stderr += accepted.toString();
        capturedBytes += accepted.length;
        if (accepted.length < chunk.length) {
          outputTruncated = true;
          this.terminateProcess(proc);
        }
      });

      proc.on('error', (err) => {
        completed = true;
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const durationMs = Number((endTime - startTime) / 1000000n);

        resolve({
          stdout,
          stderr: stderr + `\nProcess execution error: ${err.message}`,
          exitCode: -1,
          durationMs,
          timedOut: false,
          outputTruncated,
          terminationReason: 'spawn_error',
        });
      });

      proc.on('close', (code, signal) => {
        completed = true;
        clearTimeout(timer);
        const endTime = process.hrtime.bigint();
        const durationMs = Number((endTime - startTime) / 1000000n);

        let terminationReason = 'normal';
        if (timedOut) {
          terminationReason = 'timeout';
        } else if (outputTruncated) {
          terminationReason = 'output_limit';
        } else if (signal) {
          terminationReason = `signal_${signal}`;
        } else if (code !== 0) {
          terminationReason = `exit_code_${code}`;
        }

        resolve({
          stdout,
          stderr,
          exitCode: timedOut ? -1 : code,
          durationMs,
          timedOut,
          outputTruncated,
          terminationReason,
        });
      });
    });
  }

  terminateProcess(proc) {
    try {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/F', '/T', '/PID', proc.pid]);
      } else {
        process.kill(-proc.pid, 'SIGKILL');
      }
    } catch (e) {
      try {
        proc.kill();
      } catch (err) {}
    }
  }
}

module.exports = new Sandbox();
