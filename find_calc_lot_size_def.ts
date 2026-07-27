import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  let pos = line.indexOf("calculateBaseLotSize");
  while (pos !== -1) {
    if (line.substring(0, pos).includes("function") || line.substring(pos).includes("function") || line.includes("function calculateBaseLotSize")) {
      console.log(`Potential Definition at Line ${index + 1} position ${pos}:`);
    } else {
      console.log(`Occurrence at Line ${index + 1} position ${pos}:`);
    }
    const start = Math.max(0, pos - 150);
    const end = Math.min(line.length, pos + 400);
    console.log(`[CONTEXT]: ... ${line.substring(start, end)} ...`);
    pos = line.indexOf("calculateBaseLotSize", pos + 1);
  }
});
