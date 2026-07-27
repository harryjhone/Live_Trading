import * as fs from 'fs';

const serverFile = 'server.ts';
let content = fs.readFileSync(serverFile, 'utf8');

console.log("Starting server.ts programmatic enhancement...");

// ==========================================
// 1. News Velocity "Active Basket Liquidation" (Priority 1)
// ==========================================
const target1 = "const tradesToCloseAndReverse=[];state.trades.forEach(trade=>{";
const replacement1 = `const tradesToCloseAndReverse=[];

      // ==========================================
      // ACTIVE BASKET LIQUIDATION (Priority 1)
      // ==========================================
      if (state.config.preNewsAutoCloseEnabled === true && Array.isArray(state.news)) {
        const upcomingHighImpactNews = state.news.filter(news => {
          if (news.importance !== "HIGH") return false;
          const newsTime = new Date(news.time).getTime();
          const nowTime = Date.now();
          const diffMin = (newsTime - nowTime) / 60000;
          return diffMin > 0 && diffMin <= (state.config.preNewsAutoCloseMinutes || 10);
        });

        if (upcomingHighImpactNews.length > 0) {
          upcomingHighImpactNews.forEach(news => {
            // Find all open trades correlated with this news currency
            const correlatedTrades = state.trades.filter(t => {
              if (t.status !== "OPEN") return false;
              // Correlated if news currency is USD (all Forex/USD pairs) or trade symbol contains news currency
              const isForex = !["SPX500", "NDX100", "DJI30", "GER40", "BTCUSD", "ETHUSD", "XAUUSD"].includes(t.symbol);
              const isCorrelated = news.currency === "USD" ? (isForex || t.symbol.includes("USD")) : t.symbol.includes(news.currency);
              return isCorrelated;
            });

            if (correlatedTrades.length > 0) {
              const newsTime = new Date(news.time).getTime();
              const diffMin = (newsTime - Date.now()) / 60000;
              const totalPnL = correlatedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
              
              const basketLogMsg = \`[News Velocity Guard] 🚨 ACTIVE BASKET LIQUIDATION TRIGGERED: Closing all \${news.currency}-correlated positions (\${correlatedTrades.length} trades) simultaneously \${diffMin.toFixed(1)} mins prior to high-impact news event: "\${news.event}". 8-Second close window enforced.\`;
              state.mt5Config.logs.unshift(basketLogMsg);

              correlatedTrades.forEach(t => {
                const marketAsset = state.marketData[t.symbol];
                const livePrice = marketAsset ? marketAsset.currentPrice : t.currentPrice;
                closeTrade(t.id, "NEWS_LOCK_AUTO_CLOSE", livePrice);
              });

              if (state.config.telegramAlertsEnabled) {
                pushTelegramAlert({
                  id: \`alert-basket-news-exit-\${Date.now()}\`,
                  time: new Date().toISOString(),
                  type: "SYSTEM",
                  message: \`🚨 <b>NEWS VELOCITY BASKET LIQUIDATION</b>\\n\\n🛡️ Closed <b>\${correlatedTrades.length} positions</b> (\${correlatedTrades.map(t=>t.symbol).join(", ")}) simultaneously to protect equity.\\n⏱️ Time left to news: <b>\${diffMin.toFixed(1)} minutes</b>\\n📢 News Event: <b>\${news.event} (\${news.currency})</b>\\n💰 Total Realized PnL: <b>$\${totalPnL.toFixed(2)}</b>\`,
                  deliveryStatus: "PENDING",
                  chatId: state.config.telegramReceiverChatId || ""
                });
              }
            }
          });
        }
      }

      state.trades.forEach(trade=>{`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log("Success: News Velocity Active Basket Liquidation (Replacement 1) applied.");
} else {
  console.error("Error: Target 1 not found in server.ts!");
}

// ==========================================
// 2. Asset-Class Specific Execution Profiles (Priority 2)
// ==========================================
// We want to find the exact getAssetDefaults function definition
const target2Start = "function getAssetDefaults(symbol,entryPrice,isBuy){";
const target2End = "return{slPrice:Number(slPrice.toFixed(decimals)),tpPrice:Number(tpPrice.toFixed(decimals)),slPercent,tpPercent,decimals}}";

const startIndex = content.indexOf(target2Start);
const endIndex = content.indexOf(target2End, startIndex);

if (startIndex !== -1 && endIndex !== -1) {
  const fullTarget2 = content.substring(startIndex, endIndex + target2End.length);
  
  const replacement2 = `function getAssetDefaults(symbol,entryPrice,isBuy){
  const s=String(symbol||"").toUpperCase();
  const decimals=s.includes("USD")&&!s.startsWith("XAU")&&!s.startsWith("BTC")?4:2;
  
  // Profile determination: Forex-Trend or Indices-Scalp
  const isIndex = s.includes("GER40") || s.includes("DE40") || s.includes("SPX") || s.includes("US500") || s.includes("NDX") || s.includes("US100") || s.includes("DJI") || s.includes("US30");

  let slPercent = .015;
  let tpPercent = .015;

  if (isIndex) {
    // Indices-Scalp execution profile: wide physical S/L with a tight, fast M5 take-profit
    slPercent = 0.035; // 3.5% wide catastrophic stop loss
    tpPercent = 0.0012; // 0.12% sniper-tight scalping take profit
    
    if (state && state.mt5Config && state.mt5Config.logs) {
      state.mt5Config.logs.unshift(\`[Indices-Scalp Profile Activated] Symbol: \${symbol}. Bypassed ATR. Wide physical S/L (3.5%) and tight sniper M5 TP (0.12%) enforced.\`);
    }
  } else {
    // Forex-Trend and other standard asset calibrations
    if(s.includes("EURUSD")||s.includes("GBPUSD")||s.includes("AUDUSD")||s.includes("USDJPY")||s.includes("USD")&&!s.startsWith("XAU")&&!s.startsWith("BTC")){
      slPercent=.0025;
      tpPercent=.003;
    }
    else if(s.includes("XAU")||s.includes("GOLD")){
      slPercent=12/entryPrice;
      tpPercent=12/entryPrice;
    }
    else if(s.includes("BTC")||s.includes("ETH")){
      slPercent=.015;
      tpPercent=.015;
    }
    else if(s.includes("AAPL")||s.includes("TSLA")||s.includes("NVDA")||s.includes("MSFT")){
      slPercent=.012;
      tpPercent=.012;
    }
  }

  const baseSlPercent=slPercent;
  const baseTpPercent=tpPercent;

  // For Indices-Scalp profile, we bypass ATR adaptive ranges
  if (!isIndex) {
    try{
      const history=getHistoryForTimeframe(symbol,"M15",entryPrice);
      if(history&&history.length>0){
        const latestBar=history[history.length-1];
        if(latestBar&&typeof latestBar.atr==="number"&&latestBar.atr>0){
          const currentAtr=latestBar.atr;
          const atrSlPercent=currentAtr*1.5/entryPrice;
          const atrTpPercent=currentAtr*2.5/entryPrice;
          slPercent=Math.max(baseSlPercent*.5,Math.min(baseSlPercent*1.5,atrSlPercent));
          tpPercent=Math.max(baseTpPercent*.15,Math.min(baseTpPercent*1.35,atrTpPercent));
          if(state&&state.mt5Config&&state.mt5Config.logs){
            state.mt5Config.logs.unshift(\`[Forex-Trend Profile Activated] Symbol: \${symbol}. Market Volatility ATR: \${currentAtr.toFixed(decimals)}. Adapted SL: \${(slPercent*100).toFixed(4)}% | Adapted TP: \${(tpPercent*100).toFixed(4)}%.\`);
          }
        }
      }
    } catch(err) {}
  }

  const slPrice=isBuy?entryPrice*(1-slPercent):entryPrice*(1+slPercent);
  const tpPrice=isBuy?entryPrice*(1+tpPercent):entryPrice*(1-tpPercent);
  return {
    slPrice:Number(slPrice.toFixed(decimals)),
    tpPrice:Number(tpPrice.toFixed(decimals)),
    slPercent,
    tpPercent,
    decimals
  };
}`;

  content = content.replace(fullTarget2, replacement2);
  console.log("Success: Asset-Class Specific Execution Profiles (Replacement 2) applied.");
} else {
  console.error("Error: Target 2 function getAssetDefaults boundaries not found!");
}

// ==========================================
// 3. Dynamic Pyramid Scaling (Priority 3)
// ==========================================
// We want to find the isDuplicateSignalOrTrade function definition and replace hasActivePosition check
const target3 = `if(state.trades&&state.trades.length>0){
const hasActivePosition=state.trades.some(t=>t.status==="OPEN"&&t.strategyId===strategyId&&t.symbol===symbol&&(t.timeframe||"M15")===timeframe);
if(hasActivePosition){
return{
duplicate:true,reason:"Duplicate Trade Prevention"
}

}

}`;

const replacement3 = `if(state.trades&&state.trades.length>0){
    const activeTrades=state.trades.filter(t=>t.status==="OPEN"&&t.symbol===symbol);
    if(activeTrades.length>0){
      let pyramidingAllowed = false;
      if (!!state.config.pyramidingEnabled) {
        // Check if all active trades qualify for pyramiding: in profit by >= 1.0R and ITME score <= 30
        const allQualify = activeTrades.every(t => {
          const entry = t.entryPrice;
          const sl = t.baseStopLoss || t.stopLoss || (t.type === "BUY" ? entry * 0.985 : entry * 1.015);
          const slDistance = Math.abs(entry - sl);
          const marketAsset = state.marketData[symbol];
          const currentPrice = marketAsset ? marketAsset.currentPrice : entry;
          const rMultiple = slDistance > 0 ? (t.type === "BUY" ? (currentPrice - entry) / slDistance : (entry - currentPrice) / slDistance) : 0;
          const itmeScore = t.itmeScore !== undefined ? t.itmeScore : 20; // default low score
          
          return rMultiple >= 1.0 && itmeScore <= 30;
        });

        if (allQualify) {
          pyramidingAllowed = true;
          if (state.mt5Config && state.mt5Config.logs) {
            state.mt5Config.logs.unshift(\`[Pyramiding Engine] Strong trend conviction confirmed on \${symbol}! Active position(s) are up > 1.0R with low ITME anti-thesis score (<=30). Bypassing duplicate blocker to add secondary scaled position.\`);
          }
        }
      }

      if (!pyramidingAllowed) {
        const hasActivePosition=state.trades.some(t=>t.status==="OPEN"&&t.strategyId===strategyId&&t.symbol===symbol&&(t.timeframe||"M15")===timeframe);
        if(hasActivePosition){
          return {
            duplicate:true,reason:"Duplicate Trade Prevention"
          };
        }
      }
    }
  }`;

// Note: remove some spacing differences from the minified representation if needed
const cleanTarget3 = target3.replace(/\s+/g, '');
const foundTargetIndex = content.replace(/\s+/g, '').indexOf(cleanTarget3);

if (foundTargetIndex !== -1) {
  // Let's do a more generic replacement or search for target3 in a flexible way
  // Find standard state.trades.some block
  const searchPattern = "const hasActivePosition=state.trades.some(t=>t.status===\\\"OPEN\\\"&&t.strategyId===strategyId&&t.symbol===symbol&&(t.timeframe||\\\"M15\\\")===timeframe);";
  // We can locate target3 via index
  let matchedSub = "";
  // Let's find index of "const hasActivePosition=state.trades.some"
  const someIndex = content.indexOf("const hasActivePosition=state.trades.some(t=>t.status===");
  if (someIndex !== -1) {
    const blockStart = content.lastIndexOf("if(state.trades&&", someIndex);
    const blockEnd = content.indexOf("}", content.indexOf("Duplicate Trade Prevention", someIndex)) + 1;
    // Let's ensure the closing bracket of the outer if is included
    const finalOuterBrace = content.indexOf("}", blockEnd);
    matchedSub = content.substring(blockStart, finalOuterBrace + 1);
    
    content = content.replace(matchedSub, replacement3);
    console.log("Success: Dynamic Pyramid Scaling (Replacement 3) applied.");
  } else {
    console.error("Error: Could not locate hasActivePosition block precisely!");
  }
} else {
  console.error("Error: Target 3 block not matched!");
}

// Write the modified file back
fs.writeFileSync(serverFile, content, 'utf8');
console.log("Finished server.ts programmatic enhancement.");
