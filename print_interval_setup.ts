import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const line470 = lines[469]; // 0-indexed index 469 is Line 470
console.log("Line 470 length:", line470.length);

// Format line 470 around setInterval
let pos = line470.indexOf("setInterval");
while (pos !== -1) {
  console.log(`Found setInterval at index ${pos}:`);
  const start = Math.max(0, pos - 150);
  const end = Math.min(line470.length, pos + 400);
  console.log(line470.substring(start, end));
  pos = line470.indexOf("setInterval", pos + 1);
}
