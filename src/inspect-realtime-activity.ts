import fs from 'fs';

function findMT5Configs(obj: any): any[] {
  let results: any[] = [];
  if (!obj || typeof obj !== 'object') return results;
  
  if (obj.mt5Config) {
    results.push(obj.mt5Config);
  }
  
  for (const key of Object.keys(obj)) {
    results = results.concat(findMT5Configs(obj[key]));
  }
  return results;
}

async function inspect() {
  try {
    const raw = fs.readFileSync('./state_backup.json', 'utf8');
    const backup = JSON.parse(raw);
    const configs = findMT5Configs(backup);
    
    if (configs.length > 0) {
      const mt5Config = configs[0];
      console.log('--- MT5 CONFIG STACK ---');
      console.log(`Connected: ${mt5Config.connected}`);
      console.log(`Server: ${mt5Config.server}`);
      console.log(`Login: ${mt5Config.login}`);
      console.log(`Port: ${mt5Config.port}`);
      console.log(`EA Status: ${mt5Config.eaStatus}`);
      console.log(`Broker Suffix: "${mt5Config.brokerSuffix || ''}"`);
      
      console.log('\n--- ACTIVE TOKENS ---');
      console.log(JSON.stringify(mt5Config.tokens, null, 2));

      console.log('\n--- ALL CONNECTOR LOGS ---');
      const logs = mt5Config.logs || [];
      logs.slice(0, 25).forEach((log: string, idx: number) => {
        console.log(`${idx + 1}. ${log}`);
      });
    } else {
      console.log('No mt5Config block found.');
    }
  } catch (err: any) {
    console.error('Error during inspection:', err.message);
  }
}

inspect();
