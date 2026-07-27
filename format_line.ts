import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

function formatCodeLine(lineIndex: number, termToFind?: string) {
  let line = lines[lineIndex];
  if (!line) return "Line not found";
  
  // Format by putting newlines after symbols to make it readable
  let formatted = line
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}\n')
    .replace(/&&/g, '\n  && ')
    .replace(/\|\|/g, '\n  || ');

  if (termToFind) {
    const linesFormatted = formatted.split('\n');
    const matched = linesFormatted.filter(l => l.includes(termToFind));
    return `Matches for "${termToFind}" on Line ${lineIndex + 1}:\n` + matched.join('\n');
  }

  return `Formatted Line ${lineIndex + 1}:\n` + formatted;
}

// Let's find any line with "preNewsAutoCloseEnabled"
const preNewsLines: number[] = [];
lines.forEach((l, i) => {
  if (l.includes("preNewsAutoCloseEnabled")) {
    preNewsLines.push(i);
  }
});

let output = "=== PRE-NEWS AUTO CLOSE LINES ===\n";
preNewsLines.forEach(idx => {
  output += `\n--- LINE ${idx + 1} ---\n`;
  output += formatCodeLine(idx);
});

// Let's find any line with "pyramidingEnabled"
const pyramidLines: number[] = [];
lines.forEach((l, i) => {
  if (l.includes("pyramidingEnabled")) {
    pyramidLines.push(i);
  }
});

output += "\n=== PYRAMIDING LINES ===\n";
pyramidLines.forEach(idx => {
  output += `\n--- LINE ${idx + 1} ---\n`;
  output += formatCodeLine(idx);
});

fs.writeFileSync('formatted_extracted.txt', output);
console.log("Successfully wrote formatted_extracted.txt");
