import * as fs from 'fs';

const content = fs.readFileSync('line106_formatted.txt', 'utf8');
const lines = content.split('\n');

const terms = ["scale", "pyramid", "thesis"];

terms.forEach(term => {
  console.log(`\nSearching for: "${term}"`);
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(term.toLowerCase())) {
      console.log(`Line ${index + 1}: ${line.trim().substring(0, 160)}`);
    }
  });
});
