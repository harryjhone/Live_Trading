import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  let pos = line.indexOf("getAssetDefaults");
  while (pos !== -1) {
    console.log(`Line ${index + 1} position ${pos}:`);
    const start = Math.max(0, pos - 100);
    const end = Math.min(line.length, pos + 300);
    console.log(`[CONTEXT]: ... ${line.substring(start, end)} ...`);
    pos = line.indexOf("getAssetDefaults", pos + 1);
  }
});
