import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  let pos = line.indexOf("preNewsAutoCloseEnabled");
  while (pos !== -1) {
    console.log(`Line ${index + 1} at char ${pos}:`);
    const start = Math.max(0, pos - 200);
    const end = Math.min(line.length, pos + 400);
    console.log(`[CONTEXT]: ... ${line.substring(start, end)} ...`);
    pos = line.indexOf("preNewsAutoCloseEnabled", pos + 1);
  }
});
