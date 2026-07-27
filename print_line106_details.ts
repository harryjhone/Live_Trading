import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const line106 = lines[105]; // Line 106 (0-indexed is 105)

// Let's format line 106 by putting newlines after curly braces and semicolons
const formatted = line106
  .replace(/;/g, ';\n')
  .replace(/{/g, '{\n')
  .replace(/}/g, '\n}\n')
  .replace(/&&/g, '\n  && ')
  .replace(/\|\|/g, '\n  || ');

fs.writeFileSync('line106_formatted.txt', formatted);
console.log("Successfully wrote line106_formatted.txt. Formatted length:", formatted.length);
