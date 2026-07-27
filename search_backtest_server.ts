import * as fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf8');

const targets = ['backtest', 'historical', 'yahoo', 'fetchHistory'];
targets.forEach(target => {
  let idx = 0;
  while (true) {
    const pos = content.toLowerCase().indexOf(target.toLowerCase(), idx);
    if (pos === -1) break;
    console.log(`Found "${target}" at character position ${pos}`);
    console.log(content.substring(Math.max(0, pos - 100), Math.min(content.length, pos + 250)));
    console.log("\n------------------------------------\n");
    idx = pos + target.length;
  }
});
