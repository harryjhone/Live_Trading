const fs = require('fs');
const content = fs.readFileSync('server.ts', 'utf8');

const targetStr = 'calculateAndApplyCombinationSLTP(trade);';
const index = content.indexOf(targetStr);
if (index !== -1) {
  const searchPart = content.slice(Math.max(0, index - 30000), index);
  // Find all functions, async functions, arrow functions
  const regex = /(?:async\s+)?function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s*)?\([^)]*\)\s*=>/g;
  const matches = [...searchPart.matchAll(regex)];
  if (matches.length > 0) {
    console.log("Found function declarations in the preceding block:");
    for (const match of matches) {
      console.log(`- ${match[0]} (offset: ${match.index})`);
    }
    const lastMatch = matches[matches.length - 1];
    console.log(`\nLast function before match: ${lastMatch[0]}`);
    console.log(searchPart.slice(lastMatch.index, lastMatch.index + 800));
  } else {
    console.log("No function found in the preceding 30000 characters.");
  }
} else {
  console.log('Not found');
}
