import * as fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf8');

// Find occurrences of riskPerTrade!==void 0
const target = "riskPerTrade!==void 0";
const idx = content.indexOf(target);
if (idx !== -1) {
  console.log("Found settings patch:");
  console.log(content.slice(idx - 350, idx + 100));
} else {
  console.log("Could not find settings patch");
}
