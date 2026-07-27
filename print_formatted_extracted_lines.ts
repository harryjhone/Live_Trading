import * as fs from 'fs';

const content = fs.readFileSync('formatted_extracted.txt', 'utf8');
const lines = content.split('\n');

for (let i = 0; i < 60; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i]}`);
  }
}
