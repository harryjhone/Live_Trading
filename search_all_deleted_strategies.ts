import * as fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf8');

const targets = ['ALLIGATOR_SCALPER', 'MAYANK_SCALPING', 'LIQUIDITY_SWEEP'];

targets.forEach(target => {
  console.log(`\n=== SEARCHING FOR: ${target} ===`);
  let idx = 0;
  let count = 0;
  while ((idx = content.indexOf(target, idx)) !== -1) {
    count++;
    console.log(`Match ${count} at position ${idx}:`);
    const start = Math.max(0, idx - 150);
    const end = Math.min(content.length, idx + target.length + 350);
    console.log(content.slice(start, end));
    console.log('--------------------------------------------------');
    idx += target.length;
  }
});
