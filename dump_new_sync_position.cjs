const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'positions.forEach(pos=>{';
const index = content.indexOf(targetStr);
if (index !== -1) {
  console.log(content.slice(index, index + 3500));
} else {
  console.log('Not found');
}
