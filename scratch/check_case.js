const fs = require('fs');
const path = require('path');

function checkDir(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  for (const f of files) {
    if (f.name === 'node_modules' || f.name === '.git' || f.name === '.vercel') continue;
    const full = path.join(dir, f.name);
    if (f.isDirectory()) {
      checkDir(full);
    } else if (f.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      const matches = [...content.matchAll(/require\(['"](\.[^'"]+)['"]\)/g)];
      for (const m of matches) {
        const reqPath = m[1];
        const dirOfFile = path.dirname(full);
        let resolved = path.resolve(dirOfFile, reqPath);
        if (!fs.existsSync(resolved) && fs.existsSync(resolved + '.js')) resolved = resolved + '.js';
        if (!fs.existsSync(resolved) && fs.existsSync(path.join(resolved, 'index.js'))) resolved = path.join(resolved, 'index.js');
        if (fs.existsSync(resolved)) {
          const parentDir = path.dirname(resolved);
          const actualFiles = fs.readdirSync(parentDir);
          const baseName = path.basename(resolved);
          if (!actualFiles.includes(baseName)) {
            const matched = actualFiles.find(x => x.toLowerCase() === baseName.toLowerCase());
            console.log(`Case mismatch in ${path.relative(process.cwd(), full)}: required "${reqPath}" but disk has "${matched}"`);
          }
        }
      }
    }
  }
}

checkDir('.');
console.log('Case check complete.');
