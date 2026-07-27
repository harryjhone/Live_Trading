const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const target = 'function getHistoryForTimeframe';
const idx = content.indexOf(target);
if (idx !== -1) {
  fs.writeFileSync('getHistory_def.txt', content.slice(idx, idx + 1000), 'utf8');
  console.log("Wrote definition of getHistoryForTimeframe to getHistory_def.txt");
} else {
  console.log("getHistoryForTimeframe function definition NOT found. Searching for general history fetchers.");
  // Let's list any function that contains 'History'
  const lines = content.split('\n');
  const matches = [];
  lines.forEach((line, idx) => {
    if (line.includes('function') && line.toLowerCase().includes('history')) {
      matches.push(`Line ${idx + 1}: ${line}`);
    }
  });
  fs.writeFileSync('getHistory_def.txt', matches.join('\n'), 'utf8');
}
