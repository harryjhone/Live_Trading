const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const regex = /async\s+function\s+saveStateToFirestore\b/g;
let match = regex.exec(content);
if (match) {
  const pos = match.index;
  console.log(content.slice(pos, pos + 3600));
}
