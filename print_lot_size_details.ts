import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const line247 = lines[246]; // Line 247 (0-indexed is 246)
let pos = line247.indexOf("calculateBaseLotSize");
if (pos !== -1) {
  console.log(`Found "calculateBaseLotSize" on Line 247 at position ${pos}`);
  const start = Math.max(0, pos - 100);
  const end = Math.min(line247.length, pos + 2500);
  const snippet = line247.substring(start, end);
  
  // Format the snippet
  const formatted = snippet
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}\n');
  console.log(formatted);
} else {
  console.log("Could not find calculateBaseLotSize on Line 247");
}
