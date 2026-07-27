import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.toLowerCase().includes("scale") || line.toLowerCase().includes("pyramid") || line.toLowerCase().includes("thesis")) {
    console.log(`Line ${index + 1}: ${line.trim().substring(0, 150)}`);
  }
});
