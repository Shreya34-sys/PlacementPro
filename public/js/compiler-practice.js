/**
 * PlacementPro — C-Visualize Practice Client Application
 * Integrates real 6-phase compiler inspection, isolated execution, and practice exercises.
 */

import { api } from './compiler/api.js';
import { EditorManager } from './compiler/editor.js';
import { PhaseVisualizer } from './compiler/phase-visualizer.js';
import { TokenViewer } from './compiler/token-viewer.js';
import { AstViewer } from './compiler/ast-viewer.js';
import { SymbolTableViewer } from './compiler/symbol-table.js';
import { IrViewer } from './compiler/ir-viewer.js';
import { OptimizationViewer } from './compiler/optimization-viewer.js';
import { AssemblyViewer } from './compiler/assembly-viewer.js';
import { ErrorAnalyzer } from './compiler/error-analyzer.js';
import { OutputConsole } from './compiler/output-console.js';

let editorManager = null;
let currentExercise = null;
let allExercises = [];
let activeJobId = null;
let isCompiling = false;
let isRunning = false;

// Student Profile & Header Init
function initStudentProfile() {
  const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
  const userStr = localStorage.getItem('user');
  let user = null;
  if (userStr) {
    try { user = JSON.parse(userStr); } catch (_) {}
  }

  const navAvatar = document.getElementById('navAvatar');
  const navUserName = document.getElementById('navUserName');
  const menuUserName = document.getElementById('menuUserName');
  const menuUserEmail = document.getElementById('menuUserEmail');

  if (user) {
    const initials = (user.fullName || user.username || 'ST')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    if (navAvatar) navAvatar.textContent = initials;
    if (navUserName) navUserName.textContent = user.fullName || user.username || 'Student';
    if (menuUserName) menuUserName.textContent = user.fullName || user.username || 'Student';
    if (menuUserEmail) menuUserEmail.textContent = user.email || 'student@placementpro.edu';
  }

  // Profile dropdown trigger
  const profileTrigger = document.getElementById('profileTrigger');
  const profileMenu = document.getElementById('profileMenu');
  if (profileTrigger && profileMenu) {
    profileTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      profileMenu.classList.toggle('show');
    });
    document.addEventListener('click', () => {
      profileMenu.classList.remove('show');
    });
  }

  // Logout
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    });
  }

  // Theme toggle
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-theme');
    });
  }
}

// Check isolated compiler worker health & environment
async function checkWorkerHealth() {
  const banner = document.getElementById('workerStatusBanner');
  const dot = document.getElementById('workerStatusDot');
  const label = document.getElementById('workerStatusLabel');
  const text = document.getElementById('workerStatusText');
  const targetArch = document.getElementById('workerTargetArch');

  try {
    const res = await api.getCompilerInfo();
    const info = res.data;

    if (info && info.workerOnline) {
      if (banner) { banner.className = 'cp-worker-banner online'; }
      if (dot) { dot.style.background = '#10b981'; }
      if (label) { label.textContent = 'GCC Worker Online:'; }
      if (text) { text.textContent = `GCC ${info.version} sandbox ready. Real compilation & execution enabled.`; }
      if (targetArch) { targetArch.textContent = info.targetArchitecture || 'x86_64-linux-gnu'; }
    } else {
      if (banner) { banner.className = 'cp-worker-banner offline'; }
      if (dot) { dot.style.background = '#f59e0b'; }
      if (label) { label.textContent = 'GCC Worker Offline:'; }
      if (text) {
        text.textContent = 'Compiler Docker worker is not connected. Static Lexical & Syntax AST analysis is active; host GCC execution is refused for sandbox security.';
      }
      if (targetArch) { targetArch.textContent = 'Docker Container (Offline)'; }
    }
  } catch (err) {
    if (banner) { banner.className = 'cp-worker-banner offline'; }
    if (dot) { dot.style.background = '#f59e0b'; }
    if (label) { label.textContent = 'GCC Worker Standby:'; }
    if (text) { text.textContent = 'Worker service offline. Static lexical/syntax analysis and practice exercises remain active.'; }
    if (targetArch) { targetArch.textContent = 'Isolated Sandbox'; }
  }
}

// Load practice exercises from API
async function loadExercises() {
  const select = document.getElementById('exerciseSelect');
  if (!select) return;

  try {
    const res = await api.getExercises();
    allExercises = res.data || [];
  } catch (err) {
    console.warn('Could not fetch exercises from server, using built-in catalog:', err.message);
  }

  filterExercises('all');
}

function filterExercises(difficulty) {
  const select = document.getElementById('exerciseSelect');
  if (!select) return;

  select.innerHTML = '<option value="">-- Choose Practice Exercise --</option>';

  const filtered = difficulty === 'all'
    ? allExercises
    : allExercises.filter((e) => e.difficulty === difficulty);

  filtered.forEach((ex) => {
    const opt = document.createElement('option');
    opt.value = ex.id;
    opt.textContent = `${ex.title} (${ex.category})`;
    select.appendChild(opt);
  });

  // If currently selected exercise matches filter, keep it, else pick first
  if (filtered.length > 0) {
    const toSelect = currentExercise && filtered.some((e) => e.id === currentExercise.id)
      ? currentExercise.id
      : filtered[0].id;
    select.value = toSelect;
    selectExercise(toSelect);
  }
}

function selectExercise(exerciseId) {
  const ex = allExercises.find((e) => e.id === exerciseId);
  if (!ex) return;

  currentExercise = ex;

  // Update Problem Details Card
  const detailsCard = document.getElementById('problemDetailsCard');
  if (detailsCard) detailsCard.style.display = 'block';

  const badge = document.getElementById('exerciseDifficultyBadge');
  if (badge) {
    badge.className = `cp-problem-badge ${ex.difficulty || 'beginner'}`;
    badge.textContent = (ex.difficulty || 'beginner').toUpperCase();
  }

  const title = document.getElementById('exerciseTitle');
  if (title) title.textContent = ex.title;

  const category = document.getElementById('exerciseCategoryTag');
  if (category) category.textContent = `Category: ${ex.category || 'Core'}`;

  const statement = document.getElementById('exerciseStatement');
  if (statement) statement.textContent = ex.problemStatement || ex.learningObjective;

  const objective = document.getElementById('exerciseObjective');
  if (objective) objective.textContent = ex.learningObjective;

  const expected = document.getElementById('exerciseExpected');
  if (expected) expected.textContent = ex.expectedBehavior;

  const phaseFocus = document.getElementById('exercisePhaseFocus');
  if (phaseFocus) phaseFocus.textContent = ex.relevantPhase || 'All 6 Phases';

  const hintsList = document.getElementById('exerciseHintsList');
  if (hintsList) {
    hintsList.innerHTML = (ex.hints || ['Inspect the generated phase tabs sequentially.'])
      .map((h) => `<li>${h}</li>`)
      .join('');
  }

  // Load starter code into editor
  if (editorManager && ex.starterCode) {
    editorManager.setCode(ex.starterCode);
  }

  // Set default stdin
  const stdinInput = document.getElementById('console-stdin');
  if (stdinInput) {
    stdinInput.value = ex.defaultStdin || '';
  }

  // Reset status
  updateStatus('ready');
  activeJobId = null;
  const runBtn = document.getElementById('btn-run-program');
  if (runBtn) runBtn.disabled = true;

  // Clear output
  const stdout = document.getElementById('console-stdout');
  if (stdout) {
    stdout.textContent = `Loaded ${ex.title}.\nClick "Compile & Visualize" to scan tokens, generate AST, and run GCC pipeline.`;
  }
}

function updateStatus(status) {
  const badge = document.getElementById('compilation-status-badge');
  if (!badge) return;
  badge.className = `cp-status-pill ${status}`;
  badge.textContent = status.toUpperCase();
}

// Initialize Application
document.addEventListener('DOMContentLoaded', async () => {
  initStudentProfile();

  // 1. Initialize Code Editor
  editorManager = new EditorManager('monaco-editor-container', 'fallback-textarea');
  await editorManager.init();

  // 2. Initialize Phase Viewers
  const phaseVisualizer = new PhaseVisualizer();

  const tokenViewer = new TokenViewer(
    'tokens-table-body',
    'token-search-input',
    'token-categories',
    (sLine, sCol, eLine, eCol) => editorManager.highlightSourceRange(sLine, sCol, eLine, eCol)
  );

  const astViewer = new AstViewer('ast-svg-container', (sLine, sCol, eLine, eCol) =>
    editorManager.highlightSourceRange(sLine, sCol, eLine, eCol)
  );

  const symbolTableViewer = new SymbolTableViewer(
    'symbol-table-body',
    'semantic-diagnostics-container',
    (line, col) => editorManager.highlightSourceRange(line, col)
  );

  const irViewer = new IrViewer('ir-code-content', 'ir-metadata', 'btn-copy-ir');
  const optimizationViewer = new OptimizationViewer('optimization-diff-container');
  const assemblyViewer = new AssemblyViewer(
    'assembly-code-content',
    'assembly-metadata',
    'btn-copy-assembly',
    'assembly-tooltip'
  );

  const errorAnalyzer = new ErrorAnalyzer('diagnostics-list-container', (line, col) =>
    editorManager.highlightSourceRange(line, col)
  );

  const outputConsole = new OutputConsole(
    'console-stdout',
    'console-stderr',
    'console-stdin',
    'console-meta',
    'btn-clear-console'
  );

  // 3. Setup Phase Stepper Navigation Tabs
  const phaseTabs = document.querySelectorAll('.cp-phase-tab');
  phaseTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetPhase = tab.dataset.phase;
      phaseTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.cp-phase-pane').forEach((p) => p.classList.remove('active'));
      const targetPane = document.getElementById(`phase-${targetPhase}`);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 4. Setup Console Tabs
  const consoleTabs = document.querySelectorAll('.cp-output-tab');
  consoleTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab;
      consoleTabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.cp-console-pane').forEach((p) => p.classList.remove('active'));
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // 5. Setup Mobile Switcher
  const mobileBtns = document.querySelectorAll('.cp-mobile-btn');
  mobileBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.panel;
      mobileBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.cp-panel').forEach((p) => p.classList.remove('mobile-active'));
      const panel = document.getElementById(`panel-${target}`);
      if (panel) panel.classList.add('mobile-active');
    });
  });

  // 6. Setup Difficulty Filter Pills
  const diffPills = document.querySelectorAll('.cp-diff-pill');
  diffPills.forEach((pill) => {
    pill.addEventListener('click', () => {
      diffPills.forEach((p) => p.classList.remove('active'));
      pill.classList.add('active');
      filterExercises(pill.dataset.difficulty);
    });
  });

  // Exercise dropdown listener
  const exerciseSelect = document.getElementById('exerciseSelect');
  if (exerciseSelect) {
    exerciseSelect.addEventListener('change', (e) => {
      if (e.target.value) selectExercise(e.target.value);
    });
  }

  // Toggle problem card visibility
  const btnToggleProblem = document.getElementById('btnToggleProblemCard');
  const problemCard = document.getElementById('problemDetailsCard');
  if (btnToggleProblem && problemCard) {
    btnToggleProblem.addEventListener('click', () => {
      const isVisible = problemCard.style.display !== 'none';
      problemCard.style.display = isVisible ? 'none' : 'block';
      btnToggleProblem.querySelector('span').textContent = isVisible ? 'Show Objectives' : 'Hide Objectives';
    });
  }

  const problemCardHeader = document.getElementById('problemCardHeader');
  if (problemCardHeader && problemCard) {
    problemCardHeader.addEventListener('click', () => {
      const body = document.getElementById('problemCardBody');
      if (body) {
        body.style.display = body.style.display === 'none' ? 'block' : 'none';
      }
    });
  }

  // Copy code & reset code actions
  const btnCopyCode = document.getElementById('btn-copy-code');
  if (btnCopyCode) {
    btnCopyCode.addEventListener('click', () => {
      navigator.clipboard.writeText(editorManager.getCode());
      btnCopyCode.textContent = 'Copied!';
      setTimeout(() => { btnCopyCode.textContent = 'Copy'; }, 2000);
    });
  }

  const btnResetCode = document.getElementById('btn-reset-code');
  if (btnResetCode) {
    btnResetCode.addEventListener('click', () => {
      if (currentExercise && currentExercise.starterCode) {
        editorManager.setCode(currentExercise.starterCode);
        outputConsole.clear();
        updateStatus('ready');
      }
    });
  }

  // 7. Check Worker Health and Load Exercises
  await checkWorkerHealth();
  await loadExercises();

  // 8. Compile & Visualize Handler
  const compileBtn = document.getElementById('btn-compile-visualize');
  const runBtn = document.getElementById('btn-run-program');

  async function handleCompile() {
    if (isCompiling) return;
    const sourceCode = editorManager.getCode();
    if (!sourceCode || !sourceCode.trim()) {
      alert('Please enter or select a C program.');
      return;
    }

    isCompiling = true;
    activeJobId = null;
    if (runBtn) runBtn.disabled = true;
    updateStatus('compiling');
    compileBtn.disabled = true;
    compileBtn.innerHTML = `
      <svg style="width:13px; height:13px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span>Compiling...</span>
    `;

    const standard = document.getElementById('select-c-standard')?.value || 'c17';
    const optimization = document.getElementById('select-opt-level')?.value || '-O0';

    try {
      const res = await api.compile(sourceCode, standard, optimization);
      const data = res.data;

      activeJobId = data.success ? data.jobId : null;
      updateStatus(data.status || (data.success ? 'compiled' : 'failed'));

      // Render 6 Phases
      if (data.phases) {
        if (data.phases.lexical && data.phases.lexical.artifact) {
          tokenViewer.setTokens(data.phases.lexical.artifact.tokens || []);
        }
        if (data.phases.syntax && data.phases.syntax.artifact) {
          astViewer.setAst(data.phases.syntax.artifact);
        }
        if (data.phases.semantic && data.phases.semantic.artifact) {
          symbolTableViewer.setData(data.phases.semantic.artifact, data.diagnostics || []);
        }
        if (data.phases.intermediate && data.phases.intermediate.artifact) {
          irViewer.setData(data.phases.intermediate.artifact);
        }
        if (data.phases.optimization && data.phases.optimization.artifact) {
          optimizationViewer.setData(data.phases.optimization.artifact);
        }
        if (data.phases.target_code && data.phases.target_code.artifact) {
          assemblyViewer.setData(data.phases.target_code.artifact);
        }
      }

      // Preprocessing & Linking
      if (data.supporting) {
        const preprocPre = document.getElementById('preproc-code');
        if (preprocPre && data.supporting.preprocessing) {
          preprocPre.textContent = data.supporting.preprocessing.content || 'Preprocessing unavailable';
        }
        const linkingDiv = document.getElementById('linking-status-content');
        if (linkingDiv && data.supporting.linking) {
          const l = data.supporting.linking;
          linkingDiv.innerHTML = `
            <div style="font-size: 13px; font-weight: 600; color: ${l.executableProduced ? '#16a34a' : '#dc2626'}; margin-bottom: 6px;">
              ${l.executableProduced ? '✔ Executable Binary Generated Successfully' : '✖ Linking Failed'}
            </div>
            <p style="font-size: 12px; color: #64748b; margin: 0 0 8px 0;">${l.explanation}</p>
            <div style="font-size: 11px; font-family: monospace; color: #475569;">${l.producingTool}</div>
          `;
        }
      }

      // Diagnostics
      errorAnalyzer.setDiagnostics(data.diagnostics || []);

      // Build Log
      const buildLogEl = document.getElementById('console-build-log');
      if (buildLogEl) {
        buildLogEl.textContent = `[GCC Invocation]\nCommand: gcc -std=${standard} ${optimization} program.c -o program\nDuration: ${data.durationMs || 0}ms\nExit Code: ${data.status === 'compiled' ? 0 : 1}\n\n[GCC Output]\n${data.rawStderr || data.rawStdout || '(No compiler warnings or errors)'}`;
      }

      if (data.success && activeJobId) {
        if (runBtn) runBtn.disabled = false;
        outputConsole.setStdout?.('Compilation succeeded! Click "Run Program" to execute in the Docker sandbox.');
      } else {
        if (runBtn) runBtn.disabled = true;
        // Switch to diagnostics tab
        document.querySelector('.cp-output-tab[data-tab="diagnostics-pane"]')?.click();
      }

      // Record student attempt if logged in
      if (currentExercise && data.jobId) {
        api.recordAttempt(currentExercise.id, data.jobId, data.success ? 'compiled' : 'failed').catch(() => {});
      }
    } catch (err) {
      console.error('Compilation failed:', err);
      updateStatus('failed');

      // Fail-closed explanation
      const stdout = document.getElementById('console-stdout');
      if (stdout) {
        stdout.textContent = `Compilation Error: ${err.message}\n\nNote: If the isolated Docker worker is not started, host execution is safely refused to prevent untrusted code execution.`;
      }

      const buildLogEl = document.getElementById('console-build-log');
      if (buildLogEl) {
        buildLogEl.textContent = `[Error]\n${err.message}\nStatus Code: ${err.status || 500}`;
      }

      document.querySelector('.cp-output-tab[data-tab="build-log-pane"]')?.click();
    } finally {
      isCompiling = false;
      compileBtn.disabled = false;
      compileBtn.innerHTML = `
        <svg style="width:13px; height:13px; fill:currentColor;" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
        </svg>
        <span>Compile &amp; Visualize</span>
      `;
    }
  }

  if (compileBtn) compileBtn.addEventListener('click', handleCompile);

  // 9. Run Program Handler
  async function handleRun() {
    if (isRunning || !activeJobId) return;

    isRunning = true;
    runBtn.disabled = true;
    runBtn.innerHTML = `
      <svg style="width:13px; height:13px; animation: spin 1s linear infinite;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
        <path d="M12 2a10 10 0 0 1 10 10"></path>
      </svg>
      <span>Running...</span>
    `;

    const stdin = document.getElementById('console-stdin')?.value || '';

    try {
      document.querySelector('.cp-output-tab[data-tab="output-pane"]')?.click();
      const res = await api.run(activeJobId, stdin);
      const data = res.data;

      const stdout = document.getElementById('console-stdout');
      if (stdout) {
        stdout.textContent = data.stdout || '(Program produced no stdout output)';
      }

      const stderr = document.getElementById('console-stderr');
      if (stderr) {
        if (data.stderr && data.stderr.trim()) {
          stderr.style.display = 'block';
          stderr.textContent = data.stderr;
        } else {
          stderr.style.display = 'none';
        }
      }

      const meta = document.getElementById('console-meta');
      if (meta) {
        meta.textContent = `Exit Code: ${data.exitCode} • Time: ${data.durationMs}ms • Reason: ${data.terminationReason}`;
      }

      // Check test cases for practice
      if (currentExercise && currentExercise.testCases && currentExercise.testCases.length > 0) {
        const tc = currentExercise.testCases[0];
        const passed = (data.stdout || '').trim() === (tc.expectedOutput || '').trim();
        if (passed) {
          meta.innerHTML += ` • <strong style="color: #10b981;">✔ Test Case Passed</strong>`;
        }
        api.recordAttempt(currentExercise.id, activeJobId, passed ? 'passed' : 'failed', {
          passed,
          stdout: data.stdout,
          expected: tc.expectedOutput
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Execution error:', err);
      const stdout = document.getElementById('console-stdout');
      if (stdout) {
        stdout.textContent = `Execution Error: ${err.message}`;
      }
    } finally {
      isRunning = false;
      runBtn.disabled = false;
      runBtn.innerHTML = `
        <svg style="width:13px; height:13px; fill:currentColor;" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
        </svg>
        <span>Run Program</span>
      `;
    }
  }

  if (runBtn) runBtn.addEventListener('click', handleRun);
});
