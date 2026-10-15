const fs = require('fs');
let js = fs.readFileSync('public/js/admindash.js', 'utf8');

const target = "document.getElementById('openProctoringBtn')?.addEventListener('click', () => adminPage('/pages/proctoring.html'));";
const addition = `  document.getElementById('openMarketStoreBtn')?.addEventListener('click', () => {
    const rag = document.getElementById('rag-market-ai');
    if (rag) {
      rag.scrollIntoView({ behavior: 'smooth', block: 'center' });
      document.getElementById('aiPromptInput')?.focus();
    }
  });`;

if (js.includes(target) && !js.includes('openMarketStoreBtn')) {
  js = js.replace(target, target + '\n' + addition);
  fs.writeFileSync('public/js/admindash.js', js, 'utf8');
  console.log('Successfully added openMarketStoreBtn handler to admindash.js');
} else {
  console.log('Target not found or already added');
}
