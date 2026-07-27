import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

for (let i = 0; i < 25; i++) {
  console.log(`Line ${i + 1}: length = ${lines[i] ? lines[i].length : 'undefined'}`);
}
