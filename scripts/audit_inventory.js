const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const pagesDir = path.join(publicDir, 'pages');

const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

console.log('Found', htmlFiles.length, 'HTML pages in public/pages');

const inventory = [];

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
  
  // Extract links
  const links = [];
  const linkRegex = /<a\s+[^>]*href=["']([^"']*)["'][^>]*>(.*?)<\/a>/gis;
  let match;
  while ((match = linkRegex.exec(content)) !== null) {
    const rawTag = match[0];
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim() || (rawTag.match(/title=["']([^"']*)["']/) || [])[1] || 'icon/image';
    const id = (rawTag.match(/id=["']([^"']*)["']/) || [])[1];
    const onclick = (rawTag.match(/onclick=["']([^"']*)["']/) || [])[1];
    links.push({ href, text, id, onclick });
  }

  // Extract buttons
  const buttons = [];
  const btnRegex = /<button\s+([^>]*)>(.*?)<\/button>/gis;
  while ((match = btnRegex.exec(content)) !== null) {
    const rawAttrs = match[1];
    const id = (rawAttrs.match(/id=["']([^"']*)["']/) || [])[1];
    const type = (rawAttrs.match(/type=["']([^"']*)["']/) || [])[1] || 'button';
    const onclick = (rawAttrs.match(/onclick=["']([^"']*)["']/) || [])[1];
    const cls = (rawAttrs.match(/class=["']([^"']*)["']/) || [])[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim() || (rawAttrs.match(/title=["']([^"']*)["']/) || [])[1] || id || 'unlabeled button';
    buttons.push({ id, type, onclick, text, class: cls });
  }

  // Extract forms
  const forms = [];
  const formRegex = /<form\s+([^>]*)>(.*?)<\/form>/gis;
  while ((match = formRegex.exec(content)) !== null) {
    const rawAttrs = match[1];
    const body = match[2];
    const id = (rawAttrs.match(/id=["']([^"']*)["']/) || [])[1];
    const action = (rawAttrs.match(/action=["']([^"']*)["']/) || [])[1];
    const method = (rawAttrs.match(/method=["']([^"']*)["']/) || [])[1] || 'GET';
    
    // Inputs inside form
    const inputs = [];
    const inputRegex = /<(input|select|textarea)\s+([^>]*)\/?>/gis;
    let inMatch;
    while ((inMatch = inputRegex.exec(body)) !== null) {
      const tag = inMatch[1];
      const inAttrs = inMatch[2];
      const inName = (inAttrs.match(/name=["']([^"']*)["']/) || [])[1];
      const inId = (inAttrs.match(/id=["']([^"']*)["']/) || [])[1];
      const inType = (inAttrs.match(/type=["']([^"']*)["']/) || [])[1] || (tag === 'select' ? 'select' : 'text');
      const req = inAttrs.includes('required');
      inputs.push({ tag, name: inName, id: inId, type: inType, required: req });
    }
    forms.push({ id, action, method, inputs });
  }

  // Extract inputs outside forms
  const standaloneInputs = [];
  const topInputRegex = /<(input|select|textarea)\s+([^>]*)\/?>/gis;
  while ((match = topInputRegex.exec(content)) !== null) {
    const tag = match[1];
    const inAttrs = match[2];
    const inId = (inAttrs.match(/id=["']([^"']*)["']/) || [])[1];
    const inType = (inAttrs.match(/type=["']([^"']*)["']/) || [])[1] || tag;
    const cls = (inAttrs.match(/class=["']([^"']*)["']/) || [])[1];
    // check if it was inside a form
    let insideForm = false;
    for (const f of forms) {
      if (f.inputs.some(i => i.id === inId && inId)) insideForm = true;
    }
    if (!insideForm && inId) {
      standaloneInputs.push({ tag, id: inId, type: inType, class: cls });
    }
  }

  // Extract scripts
  const scripts = [];
  const scriptRegex = /<script\s+[^>]*src=["']([^"']*)["'][^>]*>/gis;
  while ((match = scriptRegex.exec(content)) !== null) {
    scripts.push(match[1]);
  }

  inventory.push({
    file,
    linkCount: links.length,
    buttonCount: buttons.length,
    formCount: forms.length,
    standaloneInputCount: standaloneInputs.length,
    links,
    buttons,
    forms,
    standaloneInputs,
    scripts
  });
});

fs.writeFileSync(path.join(__dirname, 'inventory_result.json'), JSON.stringify(inventory, null, 2));

console.log('--- SUMMARY OF PAGES & CONTROLS ---');
inventory.forEach(p => {
  console.log(
    p.file.padEnd(30),
    'Links:', String(p.linkCount).padStart(3),
    'Buttons:', String(p.buttonCount).padStart(3),
    'Forms:', String(p.formCount).padStart(2),
    'Inputs:', String(p.standaloneInputCount).padStart(2),
    'Scripts:', p.scripts.join(', ')
  );
});
