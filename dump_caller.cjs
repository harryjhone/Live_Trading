const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetIndex = 102733;
console.log(content.slice(targetIndex - 1000, targetIndex + 1000));
