const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'async function fetchBatchLivePrices';
const index = content.indexOf(targetStr);
if (index !== -1) {
  // Let's print the next 4000 characters
  console.log(content.slice(index, index + 3500));
} else {
  console.log('Not found');
}
