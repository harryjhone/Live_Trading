import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const start = 4; // line 5
const end = 60;  // line 61

for (let i = start; i <= end; i++) {
  console.log(`${i + 1}: ${lines[i] ? lines[i].substring(0, 200) : 'undefined'}`);
}
