const fs = require('fs');
const path = require('path');

const originalCompilerHtmlPath = path.resolve('..', 'Compiler-main', 'frontend', 'compiler.html');
const targetPracticeHtmlPath = path.resolve(__dirname, '..', 'public', 'pages', 'compiler-practice.html');
const targetCompilerHtmlPath = path.resolve(__dirname, '..', 'public', 'compiler.html');

console.log('Reading read-only original file from:', originalCompilerHtmlPath);
const originalHtml = fs.readFileSync(originalCompilerHtmlPath, 'utf8');

// Update asset paths to point to /css/compiler/ and /js/compiler/
let integratedHtml = originalHtml
  .replace(/href="css\//g, 'href="/css/compiler/')
  .replace(/src="js\//g, 'src="/js/compiler/');

// Add Back to Theory button in header-actions and sidebar-nav
const backToTheoryBtn = `
      <div class="header-actions">
        <a href="/study-reader?subject=compiler-design" class="btn btn-secondary btn-sm" id="btn-back-to-theory" style="display:inline-flex; align-items:center; gap:6px; text-decoration:none; color:#2563EB; font-weight:600; padding: 4px 10px; border-radius: 6px; border: 1px solid #BFDBFE; background: #EFF6FF;" title="Back to Compiler Design Theory in PlacementPro">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Back to Theory
        </a>
      </div>`;

integratedHtml = integratedHtml.replace('<div class="header-actions"></div>', backToTheoryBtn);

// Also add a clean navigation link in the sidebar under WORKSPACE
const sidebarBackToTheory = `
        <div class="sidebar-section-label">WORKSPACE</div>
        <a href="/study-reader?subject=compiler-design" class="sidebar-nav-item" style="text-decoration:none; color: #2563EB; font-weight: 600;" id="sidebar-back-to-theory" title="Return to Compiler Design Theory"><span class="nav-glyph" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg></span><span class="nav-label">Back to Theory</span></a>`;

integratedHtml = integratedHtml.replace('<div class="sidebar-section-label">WORKSPACE</div>', sidebarBackToTheory);

// Write to PlacementPro public pages
fs.writeFileSync(targetPracticeHtmlPath, integratedHtml, 'utf8');
fs.writeFileSync(targetCompilerHtmlPath, integratedHtml, 'utf8');

console.log('Successfully written exact C-Visualize UI to:');
console.log(' -', targetPracticeHtmlPath);
console.log(' -', targetCompilerHtmlPath);
