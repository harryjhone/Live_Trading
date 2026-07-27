import * as fs from 'fs';

const settingsContent = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');
const lines = settingsContent.split('\n');

for (let i = 855; i < 945; i++) {
  if (lines[i] !== undefined) {
    console.log(`Line ${i + 1}: ${lines[i]}`);
  }
}
