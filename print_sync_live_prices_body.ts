import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

// We know syncLivePrices starts at line 439 and ends on line 446
const subLines = lines.slice(438, 446);
const rawBody = subLines.join('\n');

// Format by putting newlines after curly braces and semicolons
const formatted = rawBody
  .replace(/;/g, ';\n')
  .replace(/{/g, '{\n')
  .replace(/}/g, '\n}\n');

fs.writeFileSync('syncLivePrices_formatted.txt', formatted);
console.log("Successfully wrote syncLivePrices_formatted.txt");
