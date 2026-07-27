import * as fs from 'fs';

const content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

const target = "</form>";
let idx = 0;
while (true) {
  idx = content.indexOf(target, idx);
  if (idx === -1) break;
  console.log(`Found </form> at index ${idx}:`);
  console.log(content.slice(idx - 200, idx + 200));
  console.log("===============================");
  idx += target.length;
}
