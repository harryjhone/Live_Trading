import * as fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf8');

const target = 'state.strategies.forEach';
let pos = -1;
let index = 0;

while ((pos = content.indexOf(target, index)) !== -1) {
  console.log(`Found "${target}" at character position ${pos}`);
  // Let's print some characters after it to see what's happening
  console.log(content.substring(pos, pos + 2500));
  index = pos + 1;
}
