import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("preNewsAutoCloseEnabled")) {
    console.log(`\n=================================================`);
    console.log(`Found "preNewsAutoCloseEnabled" on Line ${index + 1}`);
    console.log(`=================================================`);
    const start = Math.max(0, index - 10);
    const end = Math.min(lines.length - 1, index + 30);
    for (let i = start; i <= end; i++) {
      const marker = i === index ? '>>> ' : '    ';
      console.log(`${marker}${i + 1}: ${lines[i]}`);
    }
  }
});
