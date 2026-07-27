const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'calculateAndApplyCombinationSLTP(trade);';
const index = content.indexOf(targetStr);
if (index !== -1) {
  // Let's print the preceding 2500 characters
  console.log(content.slice(Math.max(0, index - 3500), index));
} else {
  console.log('Not found');
}
