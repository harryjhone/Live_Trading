const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const endpoints = ['/api/trade/attach-running', '/api/mt5/sync'];
for (const endpoint of endpoints) {
  const index = content.indexOf(endpoint);
  if (index !== -1) {
    console.log(`=== Endpoint ${endpoint} ===`);
    console.log(content.slice(index, index + 2500));
  } else {
    console.log(`Endpoint ${endpoint} not found`);
  }
}
