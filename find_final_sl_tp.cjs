const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

// Search for variables finalSl and finalTp in server.ts
const keywords = ['finalSl', 'finalTp', 'riskDistance', 'rSize'];
keywords.forEach(kw => {
  let start = 0;
  console.log(`\n=== Matches for "${kw}": ===`);
  let matches = 0;
  while (true) {
    const pos = content.indexOf(kw, start);
    if (pos === -1 || matches >= 15) break;
    const sliceStart = Math.max(0, pos - 100);
    const sliceEnd = Math.min(content.length, pos + kw.length + 150);
    console.log(`[pos ${pos}]: ... ${content.slice(sliceStart, sliceEnd)} ...`);
    start = pos + kw.length;
    matches++;
  }
});
