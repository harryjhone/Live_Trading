import * as fs from 'fs';

const content = fs.readFileSync('server.ts', 'utf8');

const target = 'function computeIndicators';
const pos = content.indexOf(target);
if (pos !== -1) {
  // Let's print 4000 characters from pos
  const segment = content.substring(pos, pos + 4000);
  console.log("COMPUTE INDICATORS:\n", segment);
} else {
  console.log("Could not find function computeIndicators");
}
