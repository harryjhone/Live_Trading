import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

const line255 = lines[254]; // Line 255 (0-indexed is 254)
const startPos = line255.indexOf("function getAssetDefaults");
if (startPos !== -1) {
  console.log(`Found "getAssetDefaults" at position ${startPos}`);
  // Let's find where the next function starts or some anchor
  const endPos = line255.indexOf("function executeTradeFromSignal");
  const subStr = line255.substring(startPos, endPos !== -1 ? endPos : startPos + 3500);
  
  const formatted = subStr
    .replace(/;/g, ';\n')
    .replace(/{/g, '{\n')
    .replace(/}/g, '\n}\n');
  fs.writeFileSync('getAssetDefaults_formatted.txt', formatted);
  console.log("Successfully wrote getAssetDefaults_formatted.txt");
} else {
  console.log("Could not find function getAssetDefaults in line 255");
}
