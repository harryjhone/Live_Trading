import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');
const line1 = lines[0];

const startPos = 83000;
const endPos = 90000;

const subStr = line1.substring(startPos, endPos);
const formatted = subStr
  .replace(/;/g, ';\n')
  .replace(/{/g, '{\n')
  .replace(/}/g, '\n}\n');

fs.writeFileSync('loop_processing_part2_formatted.txt', formatted);
console.log("Successfully wrote loop_processing_part2_formatted.txt. Formatted length:", formatted.length);
