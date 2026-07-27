import * as fs from 'fs';

const content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

const target = "activeTab === \"general\"";
const idx = content.indexOf(target);
if (idx !== -1) {
  console.log(`Found activeTab === "general" at index ${idx}:`);
  // Let's find the closing brace for that block
  let openBraces = 0;
  let closedIndex = -1;
  for (let i = idx; i < content.length; i++) {
    if (content[i] === '(' && content[i+1] === '<') {
      openBraces = 1;
      for (let j = i + 1; j < content.length; j++) {
        if (content[j] === '<' && content[j+1] !== '/') {
          openBraces++;
        } else if (content[j] === '<' && content[j+1] === '/') {
          openBraces--;
          if (openBraces === 0) {
            closedIndex = j;
            break;
          }
        }
      }
      break;
    }
  }
  console.log(`Matching end is at index ${closedIndex}:`);
  if (closedIndex !== -1) {
    console.log(content.slice(closedIndex - 300, closedIndex + 100));
  }
} else {
  console.log("Could not find activeTab === 'general'");
}
