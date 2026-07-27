import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("setInterval") || line.includes("syncLivePrices")) {
    console.log(`Line ${index + 1}: ${line.trim().substring(0, 160)}`);
  }
});
