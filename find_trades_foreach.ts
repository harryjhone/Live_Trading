import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  ["state.trades", "trades"].forEach(term => {
    let pos = line.indexOf(term);
    while (pos !== -1) {
      if (line.substring(pos).includes("forEach") || line.substring(pos).includes("map") || line.substring(pos).includes("filter")) {
        console.log(`Line ${index + 1} at position ${pos} has ${term}:`);
        const start = Math.max(0, pos - 150);
        const end = Math.min(line.length, pos + 250);
        console.log(`[CONTEXT]: ... ${line.substring(start, end)} ...`);
      }
      pos = line.indexOf(term, pos + 1);
    }
  });
});
