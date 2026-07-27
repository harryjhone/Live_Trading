import * as fs from 'fs';

const content = fs.readFileSync('formatted_extracted.txt', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes("--- LINE")) {
    console.log(`Line ${index + 1}: ${line}`);
    // Print next 10 lines
    for (let i = 1; i <= 10; i++) {
      if (lines[index + i] !== undefined) {
        console.log(`  +${i}: ${lines[index + i]}`);
      }
    }
  }
});
