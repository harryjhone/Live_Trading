import * as fs from 'fs';
import * as path from 'path';

const appContent = fs.readFileSync('src/App.tsx', 'utf8');

const components = [
  'BacktestingView',
  'MT5ConnectorView',
  'SaaSAdminView',
  'UpdateLedgerView',
  'VisualToggle',
  'DisclaimerView'
];

components.forEach(comp => {
  const isImported = appContent.includes(comp);
  console.log(`${comp} is referenced in App.tsx: ${isImported}`);
});
