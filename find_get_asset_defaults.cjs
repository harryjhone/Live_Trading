const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const regex = /getAssetDefaults/g;
let match;
while ((match = regex.exec(content)) !== null) {
  const pos = match.index;
  console.log(`Match at ${pos}: ... ${content.slice(Math.max(0, pos - 150), Math.min(content.length, pos + 250))} ...`);
}
