import * as fs from 'fs';
import * as path from 'path';

function searchInFile(filePath: string, term: string) {
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(term.toLowerCase())) {
      console.log(`Found "${term}" in ${filePath} on line ${index + 1}: ${line.substring(0, 150)}`);
    }
  });
}

const terms = ["basket", "liquidation", "pyramiding", "asset-class", "profile"];

terms.forEach(term => {
  console.log(`\nSearching for: "${term}"`);
  searchInFile('server.ts', term);
  searchInFile('src/App.tsx', term);
  // Also search files in src/components
  const compDir = 'src/components';
  if (fs.existsSync(compDir)) {
    const files = fs.readdirSync(compDir);
    files.forEach(file => {
      searchInFile(path.join(compDir, file), term);
    });
  }
});
