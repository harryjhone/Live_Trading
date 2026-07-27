import * as fs from 'fs';

const serverContent = fs.readFileSync('server.ts', 'utf8');
const lines = serverContent.split('\n');

lines.forEach((line, index) => {
  if (line.includes("/api/config/update")) {
    const pos = line.indexOf("/api/config/update");
    // Find where the mapping "state.config.balance =" or similar occurs after "api/config/update"
    const subStr = line.substring(pos);
    const searchIndex = subStr.indexOf("state.config.");
    console.log(`Line ${index + 1}:`);
    console.log(`First mapping occurrence index inside endpoint: ${searchIndex}`);
    if (searchIndex !== -1) {
      console.log(`[CONTEXT]: ... ${subStr.substring(searchIndex - 100, searchIndex + 1500)} ...`);
    }
  }
});
