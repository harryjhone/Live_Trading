import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("pyramidingEnabled")) {
    console.log(`Line ${index + 1}:`);
    let pos = line.indexOf("pyramidingEnabled");
    while (pos !== -1) {
      const start = Math.max(0, pos - 80);
      const end = Math.min(line.length, pos + 120);
      console.log(`  [MATCH]: ... ${line.substring(start, end)} ...`);
      pos = line.indexOf("pyramidingEnabled", pos + 1);
    }
  }
});
