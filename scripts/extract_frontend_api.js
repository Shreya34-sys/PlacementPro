const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');
const jsDir = path.join(publicDir, 'js');
const pagesDir = path.join(publicDir, 'pages');

function getAllFiles(dir, ext) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, ext));
    } else if (file.endsWith(ext)) {
      results.push(fullPath);
    }
  });
  return results;
}

const allJs = getAllFiles(jsDir, '.js');
const allHtml = getAllFiles(pagesDir, '.html');
const allFrontendFiles = [...allJs, ...allHtml];

const endpointRegex = /(?:fetch|axios\.(?:get|post|put|delete|patch)|\$\.(?:ajax|get|post))\s*\(\s*[`'"](\/api\/[^`'"?#]+|api\/[^`'"?#]+)/g;

const calledEndpoints = new Set();
const endpointUsages = [];

allFrontendFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf-8');
  let match;
  while ((match = endpointRegex.exec(content)) !== null) {
    let ep = match[1];
    if (!ep.startsWith('/')) ep = '/' + ep;
    calledEndpoints.add(ep);
    endpointUsages.push({
      file: path.relative(publicDir, file).replace(/\\/g, '/'),
      endpoint: ep
    });
  }
  
  // also check template literals like `/api/.../${...}`
  const templateRegex = /[`'"](\/api\/[a-zA-Z0-9_\-\/]+)\$\{/g;
  while ((match = templateRegex.exec(content)) !== null) {
    let ep = match[1];
    calledEndpoints.add(ep + ':param');
    endpointUsages.push({
      file: path.relative(publicDir, file).replace(/\\/g, '/'),
      endpoint: ep + ':param'
    });
  }
});

console.log('Total unique API prefixes/endpoints called from frontend:', calledEndpoints.size);
Array.from(calledEndpoints).sort().forEach(ep => console.log(' -', ep));

fs.writeFileSync(path.join(__dirname, 'frontend_api_calls.json'), JSON.stringify(endpointUsages, null, 2));
