import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const line6 = lines[5]; // Line 6 (0-indexed is 5)

// Format line 6 by putting newlines after curly braces and semicolons
const formatted = line6
  .replace(/;/g, ';\n')
  .replace(/{/g, '{\n')
  .replace(/}/g, '\n}\n');

fs.writeFileSync('line6_formatted.txt', formatted);
console.log("Successfully wrote line6_formatted.txt. Line length:", line6.length);
