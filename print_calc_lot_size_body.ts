import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');
const line1 = lines[0];

const startPos = 6600;
const endPos = 7500;

const subStr = line1.substring(startPos, endPos);
const formatted = subStr
  .replace(/;/g, ';\n')
  .replace(/{/g, '{\n')
  .replace(/}/g, '\n}\n');

fs.writeFileSync('lot_size_function_formatted.txt', formatted);
console.log("Successfully wrote lot_size_function_formatted.txt");
