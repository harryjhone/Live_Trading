import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');
const line1 = lines[0];

const pos = line1.indexOf("function fetchBatchLivePrices");
if (pos !== -1) {
  console.log(`Found "fetchBatchLivePrices" on Line 1 at position ${pos}`);
  const endPos = line1.indexOf("function", pos + 10);
  const subStr = line1.substring(pos, endPos !== -1 ? endPos : pos + 5000);
  const formatted = subStr
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}\n');
  fs.writeFileSync('fetchBatchLivePrices_formatted.txt', formatted);
  console.log("Successfully wrote fetchBatchLivePrices_formatted.txt");
} else {
  console.log("Could not find function fetchBatchLivePrices on Line 1");
}
