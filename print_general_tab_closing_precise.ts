import * as fs from 'fs';

const content = fs.readFileSync('src/components/SettingsView.tsx', 'utf8');

console.log(content.slice(73000, 76500));
