import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

// We know line 5 is the pre-news auto close block
// Let's print lines from 1 to 100 with their actual indices and content
for (let i = 0; i < 150; i++) {
  if (lines[i] !== undefined) {
    console.log(`${i + 1}: ${lines[i].substring(0, 150)}`);
  }
}
