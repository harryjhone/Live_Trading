const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const regex = /DYNAMIC_TRAIL/gi;
let match;
while ((match = regex.exec(content)) !== null) {
  const pos = match.index;
  console.log(`\n=== DYNAMIC_TRAIL at ${pos} ===`);
  console.log(content.slice(pos - 300, pos + 1200));
}
