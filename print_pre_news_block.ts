import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("preNewsAutoCloseEnabled")) {
    console.log(`Line ${index + 1}:`);
    let start = line.indexOf("preNewsAutoCloseEnabled");
    let from = Math.max(0, start - 100);
    let to = Math.min(line.length, start + 1200);
    console.log(`[CONTEXT]: ${line.substring(from, to)}`);
  }
});
