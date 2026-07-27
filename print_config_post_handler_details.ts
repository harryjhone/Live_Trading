import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("/api/config/update")) {
    console.log(`Line ${index + 1}:`);
    const pos = line.indexOf("/api/config/update");
    // Print 1500 characters after the index
    const subStr = line.substring(pos, pos + 2500);
    const formatted = subStr
      .replace(/;/g, ';\n')
      .replace(/{/g, '{\n')
      .replace(/}/g, '\n}\n');
    fs.writeFileSync('config_update_handler_formatted.txt', formatted);
    console.log("Successfully wrote config_update_handler_formatted.txt");
  }
});
