import * as fs from 'fs';

const content = fs.readFileSync('src/components/MT5ConnectorView.tsx', 'utf8');

// Search for mentions of 'python', 'import ', 'pip ', etc.
const keywords = ['import MetaTrader5', 'def ', 'ws://', 'wss://', 'python', '.py'];
keywords.forEach(keyword => {
  console.log(`\n=== KEYWORD: ${keyword} ===`);
  let idx = 0;
  let count = 0;
  while ((idx = content.indexOf(keyword, idx)) !== -1) {
    count++;
    console.log(`Match ${count} at ${idx}:`);
    console.log(content.slice(idx - 100, idx + 800));
    console.log('--------------------------------------------------');
    idx += keyword.length;
    if (count >= 5) break; // Limit matches per keyword to prevent spam
  }
});
