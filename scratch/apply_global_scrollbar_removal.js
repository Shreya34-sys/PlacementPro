/**
 * PlacementPro - Global Cross-Browser Scrollbar Removal & Horizontal Overflow Fixer
 * 1. Links /css/style.css into all HTML pages
 * 2. Prepends @import '/css/style.css'; to all CSS files
 * 3. Neutralizes custom visible scrollbar blocks in existing CSS
 * 4. Ensures zero horizontal overflow across Desktop, Tablet, and Mobile
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');
const cssDir = path.join(publicDir, 'css');
const pagesDir = path.join(publicDir, 'pages');

console.log('--- Step 1: Updating CSS stylesheets ---');

// 1. Process all CSS files
const cssFiles = fs.readdirSync(cssDir).filter(f => f.endsWith('.css') && f !== 'style.css');

for (const file of cssFiles) {
  const filePath = path.join(cssDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // Prepend @import '/css/style.css'; if not present
  if (!content.includes('/css/style.css')) {
    content = `@import '/css/style.css';\n` + content;
    modified = true;
    console.log(`+ Added @import '/css/style.css' to ${file}`);
  }

  // Remove visible scrollbar widths and tracks (e.g. scrollbar-width: thin; or 8px webkit scrollbars)
  if (content.includes('scrollbar-width: thin') || content.includes('scrollbar-color:')) {
    content = content.replace(/scrollbar-width:\s*thin;?/g, 'scrollbar-width: none !important;');
    content = content.replace(/scrollbar-color:[^;]+;/g, 'scrollbar-width: none !important;');
    modified = true;
    console.log(`+ Neutralized visible scrollbar-width in ${file}`);
  }

  // If file contains custom scrollbar track/thumb styling (e.g. interviews.css, stddash.css)
  if (content.includes('::-webkit-scrollbar') && !content.includes('display: none !important')) {
    // Replace custom scrollbar rules with hidden scrollbars
    content = content.replace(/::-webkit-scrollbar\s*\{[^}]+\}/g, '::-webkit-scrollbar { display: none !important; width: 0 !important; height: 0 !important; background: transparent !important; }');
    content = content.replace(/::-webkit-scrollbar-track\s*\{[^}]+\}/g, '::-webkit-scrollbar-track { display: none !important; background: transparent !important; }');
    content = content.replace(/::-webkit-scrollbar-thumb\s*\{[^}]+\}/g, '::-webkit-scrollbar-thumb { display: none !important; background: transparent !important; }');
    modified = true;
    console.log(`+ Overrode webkit-scrollbar blocks in ${file}`);
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
}

console.log('\n--- Step 2: Ensuring <link rel="stylesheet" href="/css/style.css"> in HTML pages ---');

// 2. Process all HTML files
const htmlFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.html'));

for (const file of htmlFiles) {
  const filePath = path.join(pagesDir, file);
  let html = fs.readFileSync(filePath, 'utf8');

  if (!html.includes('/css/style.css')) {
    // Insert <link rel="stylesheet" href="/css/style.css"> right before the first <link rel="stylesheet"
    const match = html.match(/<link\s+rel=["']stylesheet["']/i);
    if (match) {
      const idx = match.index;
      html = html.slice(0, idx) + `<link rel="stylesheet" href="/css/style.css">\n    ` + html.slice(idx);
      fs.writeFileSync(filePath, html, 'utf8');
      console.log(`+ Added style.css link to ${file}`);
    } else if (html.includes('</head>')) {
      html = html.replace('</head>', `    <link rel="stylesheet" href="/css/style.css">\n</head>`);
      fs.writeFileSync(filePath, html, 'utf8');
      console.log(`+ Added style.css link before </head> in ${file}`);
    }
  }
}

console.log('\nGlobal scrollbar removal and stylesheet synchronization completed successfully!');
