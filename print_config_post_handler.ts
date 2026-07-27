import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("/api/config")) {
    console.log(`Line ${index + 1}:`);
    const pos = line.indexOf("/api/config");
    const start = Math.max(0, pos - 100);
    const end = Math.min(line.length, pos + 2500);
    console.log(`[CONTEXT]: ... ${line.substring(start, end)} ...`);
  }
});
