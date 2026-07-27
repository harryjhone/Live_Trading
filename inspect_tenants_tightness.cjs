const fs = require('fs');
if (fs.existsSync('state_backup.json')) {
  const data = JSON.parse(fs.readFileSync('state_backup.json', 'utf8'));
  const harry = data.tenants?.['tenant-harry'];
  if (harry) {
    console.log("=== Tenant Harry Config ===");
    console.log("Virtual SL/TP:", harry.state?.config?.virtualSlTpEnabled);
    console.log("Direct Broker Sync:", harry.state?.config?.directBrokerEnabled);
    console.log("MT5 Bridge Enabled:", harry.state?.config?.mt5BridgeEnabled);
    console.log("Active Optimizations:", harry.state?.config?.activeOptimizations);
    console.log("ITME Enabled:", harry.state?.config?.itmeEnabled);
    console.log("Exit Engine Mode:", harry.state?.config?.exitEngineMode);
    
    console.log("\n=== Open Trades ===");
    const openTrades = harry.state?.trades?.filter(t => t.status === 'OPEN');
    if (openTrades && openTrades.length > 0) {
      openTrades.forEach(t => {
        console.log(`Trade ID: ${t.id}`);
        console.log(`  Symbol: ${t.symbol}`);
        console.log(`  Type: ${t.type}`);
        console.log(`  Entry Price: ${t.entryPrice}`);
        console.log(`  SL: ${t.stopLoss}`);
        console.log(`  TP: ${t.takeProfit}`);
        console.log(`  Base SL: ${t.baseStopLoss}`);
        console.log(`  Base TP: ${t.baseTakeProfit}`);
        console.log(`  TP1/2/3/4: ${t.tp1} / ${t.tp2} / ${t.tp3} / ${t.tp4}`);
        console.log(`  isMt5Synced: ${t.isMt5Synced}`);
        console.log(`  highestTpReached: ${t.highestTpReached}`);
      });
    } else {
      console.log("No open trades found.");
    }
  } else {
    console.log("tenant-harry not found in state_backup.json");
  }
} else {
  console.log("state_backup.json does not exist.");
}
