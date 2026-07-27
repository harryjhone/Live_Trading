import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("executeTradeFromSignal")) {
    console.log(`Line ${index + 1}:`);
    const pos = line.indexOf("executeTradeFromSignal");
    const start = Math.max(0, pos - 150);
    const end = Math.min(line.length, pos + 2000);
    console.log(`[CONTEXT]: ... ${line.substring(start, end)} ...`);
  }
});
