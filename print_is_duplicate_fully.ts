import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const line237 = lines[236]; // Line 237 (0-indexed is 236)
const startPos = line237.indexOf("function isDuplicateSignalOrTrade");
if (startPos !== -1) {
  console.log(`Found "isDuplicateSignalOrTrade" at position ${startPos}`);
  const endPos = line237.indexOf("const BASE_PRICES");
  const subStr = line237.substring(startPos, endPos !== -1 ? endPos : startPos + 3000);
  
  const formatted = subStr
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}\n');
  fs.writeFileSync('isDuplicateSignalOrTrade_formatted.txt', formatted);
  console.log("Successfully wrote isDuplicateSignalOrTrade_formatted.txt");
} else {
  console.log("Could not find function isDuplicateSignalOrTrade in line 237");
}
