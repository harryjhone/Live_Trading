const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'function getAssetDefaults';
const index = content.indexOf(targetStr);
if (index !== -1) {
  console.log(content.slice(index, index + 1500));
} else {
  console.log('Not found');
}
