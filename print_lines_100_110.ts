import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

for (let i = 99; i < 110; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i].substring(0, 200)}`);
  }
}
