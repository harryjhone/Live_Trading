import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

console.log(`Total lines: ${lines.length}`);
lines.forEach((line, index) => {
  if (line.length > 1000) {
    console.log(`Line ${index + 1}: length = ${line.length}, starts with: "${line.substring(0, 150)}..."`);
  }
});
