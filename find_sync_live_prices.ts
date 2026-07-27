import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("syncLivePrices") && !line.includes("__name")) {
    console.log(`Line ${index + 1}: ${line.substring(0, 150)}`);
  }
});
