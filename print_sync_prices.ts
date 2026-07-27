import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const start = 440;
const end = 470;

for (let i = start; i <= end; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i].substring(0, 150)}`);
  }
}
