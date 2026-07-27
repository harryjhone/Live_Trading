const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const regex = /app\.post\(['"]\/api\/([^'"]+)/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Endpoint: /api/${match[1]}`);
}
