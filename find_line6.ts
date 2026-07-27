import * as fs from 'fs';

const content = fs.readFileSync('formatted_extracted.txt', 'utf8');
const lines = content.split('\n');

let found = false;
let startLine = 0;
lines.forEach((l, i) => {
  if (l.includes("--- LINE 6 ---")) {
    found = true;
    startLine = i;
  }
});

if (found) {
  console.log(`Found "--- LINE 6 ---" at line ${startLine + 1}`);
  const endLine = Math.min(lines.length - 1, startLine + 100);
  for (let i = startLine; i <= endLine; i++) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
} else {
  console.log("Could not find --- LINE 6 ---");
}
