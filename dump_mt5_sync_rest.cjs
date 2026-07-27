const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetStr = '/api/mt5/sync';
const index = content.indexOf(targetStr);
if (index !== -1) {
  console.log(content.slice(index + 1500, index + 3500));
} else {
  console.log('Not found');
}
