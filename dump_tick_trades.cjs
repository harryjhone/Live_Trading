const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'calculateAndApplyCombinationSLTP(trade);';
const index = content.indexOf(targetStr);
if (index !== -1) {
  // Let's print 4000 characters before and 1000 characters after
  console.log(content.slice(index - 3500, index + 1000));
} else {
  console.log('Not found');
}
