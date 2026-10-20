const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const pagesDir = path.join(publicDir, 'pages');
const jsDir = path.join(publicDir, 'js');
const routesDir = path.join(__dirname, '../routes');
const controllersDir = path.join(__dirname, '../controllers');

const inventory = JSON.parse(fs.readFileSync(path.join(__dirname, 'inventory_result.json'), 'utf-8'));

// 1. Gather all JS code (public/js and subdirectories)
function getAllJsFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllJsFiles(fullPath));
    } else if (file.endsWith('.js')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allFrontendJs = getAllJsFiles(jsDir);
console.log('Found', allFrontendJs.length, 'frontend JS files');

// Read all frontend JS into memory
const jsContents = {};
allFrontendJs.forEach(f => {
  const rel = path.relative(publicDir, f).replace(/\\/g, '/');
  jsContents[rel] = fs.readFileSync(f, 'utf-8');
});

// Also read inline scripts in each HTML page
const pageInlineScripts = {};
inventory.forEach(p => {
  const content = fs.readFileSync(path.join(pagesDir, p.file), 'utf-8');
  const inlineScripts = [];
  const regex = /<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    inlineScripts.push(match[1]);
  }
  pageInlineScripts[p.file] = inlineScripts.join('\n');
});

// Categorize pages: Student vs Admin
const adminPageNames = [
  'admin-coding-builder.html',
  'admin-coding-monitor.html',
  'admin-coding-results.html',
  'admin-coding-rounds.html',
  'admin-exam-builder.html',
  'admin-exams.html',
  'admin-interviews.html',
  'admin-question-import.html',
  'admin-study-materials.html',
  'admindash.html',
  'adminlogin.html',
  'versant-admin.html',
  'proctoring.html'
];

// 2. Analyze every control
const auditResults = [];

inventory.forEach(p => {
  const isAdminPage = adminPageNames.includes(p.file);
  const role = isAdminPage ? 'Admin' : 'Student';
  const associatedScripts = p.scripts.map(s => s.replace(/^\//, '').split('?')[0]);
  const pageCombinedJs = [
    pageInlineScripts[p.file] || '',
    ...associatedScripts.map(s => jsContents[s] || '')
  ].join('\n');

  // Check links
  p.links.forEach(l => {
    const href = l.href.trim();
    let status = 'PASS';
    let issue = '';

    if (!href || href === '#' || href === 'javascript:void(0)' || href === 'javascript:;') {
      // Check if it has an id or onclick or class that is handled in JS
      const hasOnclick = Boolean(l.onclick);
      const idHandled = l.id && (pageCombinedJs.includes(l.id));
      if (!hasOnclick && !idHandled) {
        status = 'FAIL';
        issue = 'Dead link (# or javascript:void(0) without click handler or ID listener)';
      } else {
        status = 'PASS';
        issue = 'Action trigger link (handled via JS event listener or onclick)';
      }
    } else if (href.startsWith('http://') || href.startsWith('https://')) {
      status = 'PASS';
      issue = 'External URL or full origin';
    } else {
      // Relative or absolute path
      const cleanPath = href.split('?')[0].split('#')[0];
      // Role checking
      if (!isAdminPage && (cleanPath.startsWith('/admin') || cleanPath === '/admindash' || cleanPath === '/versant-admin' || cleanPath === '/proctoring')) {
        // Is this intentional for navigation to admin?
        issue = 'Student page links to Admin URL (will be blocked with 403 on port 5000 unless cross-port)';
      }
    }

    auditResults.push({
      role,
      page: p.file,
      type: 'Link',
      target: l.text || l.id || href,
      href,
      id: l.id || '',
      status,
      issue
    });
  });

  // Check buttons
  p.buttons.forEach(b => {
    const id = b.id || '';
    const onclick = b.onclick || '';
    const type = b.type || 'button';
    let status = 'PASS';
    let issue = '';

    const hasOnclick = Boolean(onclick);
    const hasId = Boolean(id);
    const idHandled = hasId && pageCombinedJs.includes(id);
    const isSubmitInForm = type === 'submit';

    if (!hasOnclick && !idHandled && !isSubmitInForm) {
      // Check if class handled
      let classHandled = false;
      if (b.class) {
        const classes = b.class.split(/\s+/);
        for (const c of classes) {
          if (c && pageCombinedJs.includes(c)) classHandled = true;
        }
      }
      if (!classHandled) {
        status = 'WARN';
        issue = 'Potential orphan button (no id listener, onclick, or submit form binding)';
      }
    }

    auditResults.push({
      role,
      page: p.file,
      type: 'Button',
      target: b.text || id || 'Button',
      href: '',
      id,
      status,
      issue
    });
  });

  // Check forms
  p.forms.forEach(f => {
    const id = f.id || '';
    const action = f.action || '';
    const method = f.method || 'GET';
    const hasId = Boolean(id);
    const idHandled = hasId && pageCombinedJs.includes(id);

    let status = 'PASS';
    let issue = '';
    if (!action && !idHandled) {
      status = 'FAIL';
      issue = 'Form has no action and no ID handler in page JS';
    }

    auditResults.push({
      role,
      page: p.file,
      type: 'Form',
      target: id || action || 'Form',
      href: action,
      id,
      status,
      issue
    });
  });
});

console.log('Total controls evaluated:', auditResults.length);
const fails = auditResults.filter(r => r.status === 'FAIL');
const warns = auditResults.filter(r => r.status === 'WARN');
console.log('Fails:', fails.length);
console.log('Warns:', warns.length);

if (fails.length > 0) {
  console.log('\n--- FAILURES ---');
  fails.forEach(f => console.log(`[${f.role}] ${f.page} -> ${f.type} "${f.target}" (id: ${f.id}, href: ${f.href}): ${f.issue}`));
}

if (warns.length > 0) {
  console.log('\n--- WARNINGS / ORPHAN CANDIDATES ---');
  warns.forEach(w => console.log(`[${w.role}] ${w.page} -> ${w.type} "${w.target}" (id: ${w.id}): ${w.issue}`));
}

fs.writeFileSync(path.join(__dirname, 'control_audit.json'), JSON.stringify(auditResults, null, 2));
