/**
 * Main Application Orchestrator for C-Visualize
 */
import { EditorManager } from './editor.js';
import { PhaseVisualizer } from './phase-visualizer.js';
import { TokenViewer } from './token-viewer.js';
import { AstViewer } from './ast-viewer.js';
import { SymbolTableViewer } from './symbol-table.js';
import { IrViewer } from './ir-viewer.js';
import { OptimizationViewer } from './optimization-viewer.js';
import { AssemblyViewer } from './assembly-viewer.js';
import { ErrorAnalyzer } from './error-analyzer.js';
import { OutputConsole } from './output-console.js';
import { ProjectManager } from './project-manager.js';
import { AuthManager } from './auth.js';
import { CompilerController } from './compiler.js';
import { SAMPLE_PROGRAMS } from './samples.js';

document.addEventListener('DOMContentLoaded', async () => {
  const topControls = document.querySelector('.header-controls');
  const actionButtons = document.querySelector('.editor-action-bar .action-buttons');
  if (topControls && actionButtons) topControls.appendChild(actionButtons);

  // 1. Initialize Monaco Editor with default sample
  const editorManager = new EditorManager('monaco-editor-container', 'fallback-textarea');
  await editorManager.init(SAMPLE_PROGRAMS[0].sourceCode);

  // 2. Initialize Phase Visualizer and Sub-Viewers
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

  // 3. Initialize Project and Auth Managers
  let refreshSidebarProjects = async () => {};
  const projectManager = new ProjectManager(editorManager, (proj) => {
    const projNameEl = document.getElementById('current-project-name');
    if (projNameEl) projNameEl.textContent = proj.project_name;
    const sidebarProject = document.getElementById('sidebar-current-project');
    if (sidebarProject) sidebarProject.textContent = `${proj.project_name}.c`;
    refreshSidebarProjects();
  });

  const authManager = new AuthManager('auth-user-section');
  await authManager.init();
  const account = document.getElementById('sidebar-account');
  if (account && authManager.currentUser) {
    const username = authManager.currentUser.username;
    account.innerHTML = '<span class="account-avatar" aria-hidden="true"></span><span class="account-copy"><strong></strong><small>Signed in</small></span>';
    account.querySelector('.account-avatar').textContent = username.slice(0, 1).toUpperCase();
    account.querySelector('strong').textContent = username;
  }
  refreshSidebarProjects = async () => {
    const list = document.getElementById('sidebar-project-list');
    if (!list) return;
    list.replaceChildren();
    if (!authManager.currentUser) {
      const empty = document.createElement('a');
      empty.className = 'sidebar-empty-projects';
      empty.textContent = 'Saved projects are unavailable in guest mode';
      list.appendChild(empty);
      return;
    }
    try {
      const response = await api.getProjects();
      const projects = response.data || [];
      if (!projects.length) {
        const empty = document.createElement('button');
        empty.className = 'sidebar-empty-projects';
        empty.textContent = 'No saved projects yet · Create one';
        empty.addEventListener('click', () => projectManager.promptNewProject());
        list.appendChild(empty);
        return;
      }
      projects.slice(0, 12).forEach((project) => {
        const item = document.createElement('button');
        item.className = 'project-entry saved-project-entry';
        item.type = 'button';
        item.title = project.project_name;
        const file = document.createElement('span');
        file.className = 'file-glyph';
        file.textContent = 'C';
        const name = document.createElement('span');
        name.className = 'project-entry-label';
        name.textContent = project.project_name;
        item.append(file, name);
        item.addEventListener('click', async () => {
          try {
            const result = await api.getProject(project.id);
            projectManager.currentProject = result.data;
            const source = result.data.latestVersion?.source_code;
            if (source != null) editorManager.setCode(source);
            list.querySelectorAll('.saved-project-entry').forEach((entry) => entry.classList.toggle('active', entry === item));
            projectManager.onProjectLoaded?.(result.data);
          } catch (error) { alert(`Could not open project: ${error.message}`); }
        });
        list.appendChild(item);
      });
    } catch {
      const empty = document.createElement('span');
      empty.className = 'sidebar-empty-projects';
      empty.textContent = 'Projects unavailable';
      list.appendChild(empty);
    }
  };
  await refreshSidebarProjects();

  // Keep compiler environment details without showing service health badges.
  const targetStatus = document.getElementById('target-status');
  try {
    const compilerResult = await api.getCompilerInfo();
    const info = compilerResult.data;
    if (targetStatus) targetStatus.textContent = info?.targetArchitecture || 'Unavailable';
    const shortVersion = document.getElementById('gcc-version-short');
    if (shortVersion) shortVersion.textContent = info?.version || 'GCC';
  } catch {
    if (targetStatus) targetStatus.textContent = 'Unavailable';
  }

  // 4. Initialize Compiler Controller
  const compilerController = new CompilerController({
    editorManager,
    phaseVisualizer,
    tokenViewer,
    astViewer,
    symbolTableViewer,
    irViewer,
    optimizationViewer,
    assemblyViewer,
    errorAnalyzer,
    outputConsole,
    compileBtnId: 'btn-compile-visualize',
    runBtnId: 'btn-run-program',
    statusBadgeId: 'compilation-status-badge',
  });

  // 5. Populate Sample Programs Selector
  const sampleSelect = document.getElementById('select-sample-program');
  if (sampleSelect) {
    sampleSelect.innerHTML = '<option value="">-- Choose Sample Program --</option>';
    SAMPLE_PROGRAMS.forEach((prog) => {
      const opt = document.createElement('option');
      opt.value = prog.id;
      opt.textContent = `${prog.title} (${prog.category})`;
      sampleSelect.appendChild(opt);
    });

    sampleSelect.addEventListener('change', (e) => {
      const selected = SAMPLE_PROGRAMS.find((p) => p.id === e.target.value);
      if (selected) {
        editorManager.setCode(selected.sourceCode);
        outputConsole.setStdin(selected.defaultStdin || '');
        outputConsole.clear();
        const sampleDescEl = document.getElementById('sample-description-banner');
        if (sampleDescEl) {
          sampleDescEl.style.display = 'block';
          sampleDescEl.innerHTML = `
            <strong>${selected.title}:</strong> ${selected.learningObjective}
            <span style="display:block; font-size:11px; color:var(--secondary-text); margin-top:2px;">Expected: ${selected.expectedBehavior}</span>
          `;
        }
      }
    });
  }

  // 6. Font Size Controls
  document.getElementById('btn-font-dec')?.addEventListener('click', () => editorManager.decreaseFont());
  document.getElementById('btn-font-inc')?.addEventListener('click', () => editorManager.increaseFont());
  document.getElementById('btn-font-reset')?.addEventListener('click', () => editorManager.resetFont());

  // 7. Theme Controls
  document.getElementById('select-editor-theme')?.addEventListener('change', (e) => {
    editorManager.setTheme(e.target.value);
  });

  // 8. Project Actions
  document.getElementById('btn-new-project')?.addEventListener('click', () => projectManager.promptNewProject());
  document.getElementById('btn-open-project')?.addEventListener('click', () => projectManager.promptOpenProject());
  document.getElementById('btn-save-project')?.addEventListener('click', () => projectManager.saveCurrentVersion());

  // Sidebar and output dock controls.
  const shell = document.querySelector('.app-container');
  if (localStorage.getItem('c_visualize_sidebar_collapsed') === 'true') shell?.classList.add('sidebar-collapsed');
  const toggleSidebar = () => {
    if (window.matchMedia('(max-width: 820px)').matches) shell?.classList.toggle('sidebar-open');
    else {
      shell?.classList.toggle('sidebar-collapsed');
      localStorage.setItem('c_visualize_sidebar_collapsed', String(shell?.classList.contains('sidebar-collapsed')));
    }
  };
  document.getElementById('sidebar-toggle')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-toggle-top')?.addEventListener('click', toggleSidebar);
  document.getElementById('sidebar-projects')?.addEventListener('click', () => projectManager.promptOpenProject());
  document.getElementById('sidebar-new-project')?.addEventListener('click', () => projectManager.promptNewProject());
  document.getElementById('sidebar-save-project')?.addEventListener('click', () => projectManager.saveCurrentVersion());
  document.querySelectorAll('[data-sidebar-action="compiler"]').forEach((button) => button.addEventListener('click', () => {
    document.querySelector('.panel-editor')?.classList.add('mobile-active');
    document.querySelector('.panel-visualizer')?.classList.remove('mobile-active');
    document.querySelector('.panel-output')?.classList.remove('mobile-active');
    document.querySelectorAll('.mobile-nav-btn').forEach((tab) => tab.classList.toggle('active', tab.dataset.targetPanel === 'editor'));
    shell?.classList.remove('sidebar-open');
  }));
  document.querySelectorAll('[data-output-tab]').forEach((tab) => tab.addEventListener('click', () => {
    const target = tab.dataset.outputTab;
    document.querySelectorAll('.output-tab').forEach((item) => {
      const selected = item === tab;
      item.classList.toggle('active', selected);
      item.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll('.output-pane').forEach((pane) => pane.classList.toggle('active', pane.id === target));
  }));
  document.getElementById('output-collapse')?.addEventListener('click', (event) => {
    const collapsed = shell?.classList.toggle('output-collapsed');
    const workspace = document.querySelector('.workspace-main');
    if (collapsed) workspace?.style.removeProperty('grid-template-rows');
    event.currentTarget.textContent = collapsed ? '⌃' : '⌄';
    event.currentTarget.title = collapsed ? 'Expand output panel' : 'Collapse output panel';
    event.currentTarget.setAttribute('aria-label', event.currentTarget.title);
  });
  const resizeHandle = document.getElementById('output-resize-handle');
  resizeHandle?.addEventListener('pointerdown', (event) => {
    if (window.matchMedia('(max-width: 820px)').matches) return;
    const workspace = document.querySelector('.workspace-main');
    if (!workspace) return;
    shell?.classList.remove('output-collapsed');
    const button = document.getElementById('output-collapse');
    if (button) { button.textContent = '⌄'; button.title = 'Collapse output panel'; button.setAttribute('aria-label', button.title); }
    resizeHandle.setPointerCapture(event.pointerId);
    const setSize = (clientY) => {
      const bounds = workspace.getBoundingClientRect();
      const height = Math.max(130, Math.min(bounds.height - 260, bounds.bottom - clientY));
      workspace.style.gridTemplateRows = `minmax(230px, 1fr) ${height}px`;
    };
    setSize(event.clientY);
    const move = (moveEvent) => setSize(moveEvent.clientY);
    const stop = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', stop);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', stop, { once: true });
  });
  document.getElementById('sidebar-history')?.addEventListener('click', () => {
    alert('Compilation history is not available in this version.');
  });

  // 9. Mobile Responsive Tabs
  const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
  mobileNavBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      mobileNavBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const target = btn.dataset.targetPanel;
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('mobile-active'));

      if (target === 'editor') {
        document.querySelector('.panel-editor')?.classList.add('mobile-active');
      } else if (target === 'visualizer') {
        document.querySelector('.panel-visualizer')?.classList.add('mobile-active');
      } else if (target === 'output') {
        document.querySelector('.panel-output')?.classList.add('mobile-active');
      }
    });
  });

  // Automatically perform initial compilation on startup for immediate wow factor
  setTimeout(() => {
    compilerController.compileAndVisualize();
  }, 600);
});
