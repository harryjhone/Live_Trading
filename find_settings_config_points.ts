import * as fs from 'fs';

const settingsContent = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
const lines = settingsContent.split('\n');

const terms = ["pyramiding", "preNews", "scaling", "profile"];

terms.forEach(term => {
  console.log(`\nSearching for: "${term}"`);
  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(term.toLowerCase())) {
      console.log(`Line ${index + 1}: ${line.trim()}`);
    }
  });
});
