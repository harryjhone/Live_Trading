import * as fs from 'fs';

const typesContent = fs.readFileSync('src/types.ts', 'utf8');
const lines = typesContent.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes("pyramid") || line.toLowerCase().includes("news") || line.toLowerCase().includes("config")) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
