const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const target = 'function getHistoryForTimeframe';
const idx = content.indexOf(target);
if (idx !== -1) {
  fs.writeFileSync('getHistory_all.txt', content.slice(idx, idx + 2500), 'utf8');
  console.log("Wrote full function definition of getHistoryForTimeframe to getHistory_all.txt");
} else {
  console.log("getHistoryForTimeframe function definition NOT found.");
}
