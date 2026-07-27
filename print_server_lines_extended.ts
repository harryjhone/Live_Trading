import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

for (let i = 4; i < 75; i++) {
  if (lines[i] !== undefined) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
