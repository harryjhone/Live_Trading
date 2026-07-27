import React, { useState, useEffect } from "react";
import { FullAppState, SymbolType } from "../types";
import { Link2, Code, FileText, CheckCircle2, Terminal, Copy, Plus, Trash2, Key, List, BookOpen, Download, Send, MessageSquare, Check, HelpCircle, Activity, Settings, AlertTriangle, Zap } from "lucide-react";

interface MT5ConnectorViewProps {
  state: FullAppState;
  onUpdateConfig: (data: any) => Promise<any>;
  theme?: "dark" | "light";
}

export default function MT5ConnectorView({ state, onUpdateConfig, theme }: MT5ConnectorViewProps) {
  // Enforced production environment for the MT5 system. Development warnings and sandbox triggers have been removed.
  const isDevUrl = false;
  const productionOrigin = "https://live-trading-analysis-webapp-581259014748.asia-southeast1.run.app";

  const [activeTab, setActiveTab] = useState<"CONNECTIONS" | "MIRROR" | "TELEGRAM" | "TELEGRAM_EA" | "GUIDE" | "DIRECT_BROKER_SETTINGS" | "DIRECT_BROKER_LOGS">("CONNECTIONS");
  const [executionMethod, setExecutionMethod] = useState<"DIRECT" | "TELEGRAM_BRIDGE" | "DIRECT_BROKER">("DIRECT");
  const [newTerminalName, setNewTerminalName] = useState<string>("");
  const [creatingToken, setCreatingToken] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null);

  // Direct Broker Option 3 states
  const [dbServer, setDbServer] = useState<string>(state.config.directBrokerServer || "MetaQuotes-Demo");
  const [dbLogin, setDbLogin] = useState<string>(state.config.directBrokerLogin || "");
  const [dbPassword, setDbPassword] = useState<string>(state.config.directBrokerPassword || "");
  const [dbSuffix, setDbSuffix] = useState<string>(state.config.directBrokerSuffix || "");
  const [dbAutoExecute, setDbAutoExecute] = useState<boolean>(state.config.directBrokerAutoExecute ?? true);
  const [dbRouteToEA, setDbRouteToEA] = useState<boolean>(state.config.directBrokerRouteToEA ?? true);
  const [dbLoading, setDbLoading] = useState<boolean>(false);
  const [dbFeedback, setDbFeedback] = useState<string>("");
  const [directMethod, setDirectMethod] = useState<"mql5" | "python">("mql5");

  // Telegram Receiver specific states
  const [botToken, setBotToken] = useState<string>(state.config.telegramReceiverToken || "");
  const [receiverChatId, setReceiverChatId] = useState<string>(state.config.telegramReceiverChatId || "");
  const [receiverActive, setReceiverActive] = useState<boolean>(state.config.telegramReceiverActive ?? true);
  const [autoMirror, setAutoMirror] = useState<boolean>(state.config.telegramAutoMirror ?? true);

  // Direct broker integration states
  const [brokerServer, setBrokerServer] = useState<string>(state.mt5Config.server || "VantageGlobal-Demo");
  const [brokerLogin, setBrokerLogin] = useState<string>(state.mt5Config.login || "84920211");
  const [brokerPassword, setBrokerPassword] = useState<string>(state.mt5Config.password || "BrokerPassword159");
  const [brokerSuffix, setBrokerSuffix] = useState<string>(state.mt5Config.brokerSuffix || "");
  
  // Direct Manual Signal Injector States
  const [injectSymbol, setInjectSymbol] = useState<SymbolType>("EURUSD");
  const [injectType, setInjectType] = useState<"BUY" | "SELL">("BUY");
  const [injectSize, setInjectSize] = useState<string>("0.10");
  const [injecting, setInjecting] = useState<boolean>(false);
  const [injectFeedback, setInjectFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleInjectSignal = async () => {
    setInjecting(true);
    setInjectFeedback(null);
    try {
      const res = await fetch("/api/trade/open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: injectSymbol,
          type: injectType,
          size: Number(injectSize),
          timeframe: "M15"
        })
      });
      const data = await res.json() as any;
      if (res.ok && data.success) {
        setInjectFeedback({
          type: "success",
          message: `Success! Enqueued mirrored broker deal (TradeID #${data.trade?.id || "None"}). Check the Live Mirror Actions queue below!`
        });
        await onUpdateConfig({}); 
      } else {
        setInjectFeedback({
          type: "error",
          message: data.error || "Failed to inject signal. Ensure Auto-Trading is globally enabled."
        });
      }
    } catch (err: any) {
      setInjectFeedback({
        type: "error",
        message: err.message || "Network error during manual signal injection."
      });
    } finally {
      setInjecting(false);
    }
  };

  const [connectLoading, setConnectLoading] = useState<boolean>(false);
  const [disconnectLoading, setDisconnectLoading] = useState<boolean>(false);
  const [connectSuccess, setConnectSuccess] = useState<boolean>(false);
  const [connectFeedback, setConnectFeedback] = useState<string>("");
  const [isEditingConnection, setIsEditingConnection] = useState<boolean>(false);

  // MT5-specific troubleshooting wizard state
  const [runningMT5Troubleshoot, setRunningMT5Troubleshoot] = useState<boolean>(false);
  const [mt5DiagnosticReport, setMt5DiagnosticReport] = useState<any>(null);
  const [testingSyncExecution, setTestingSyncExecution] = useState<boolean>(false);
  const [testSyncSteps, setTestSyncSteps] = useState<string[] | null>(null);
  const [fixingMT5, setFixingMT5] = useState<boolean>(false);
  
  const [simulatedMessage, setSimulatedMessage] = useState<string>(
    "🔔 FOREX GOLD VIP SIGNAL\n\nBUY XAUUSD @ 2351.5\nSL: 2335.0\nTP: 2380.0\nTimeframe: M15\nDual EMA Cross confirmed!"
  );
  const [simulatedChatIdInput, setSimulatedChatIdInput] = useState<string>(() => {
    return localStorage.getItem("simulatedChatIdInput") || "@QuantTerminal_Alerts";
  });
  const [saveAliasSuccess, setSaveAliasSuccess] = useState<boolean>(false);

  // Telegram To MT5 4.00 EA Simulator specific states
  const [eaSubTab, setEaSubTab] = useState<"SETUP" | "MANAGE" | "SIGNAL" | "COPY" | "TIME">("SETUP");
  const [eaRiskType, setEaRiskType] = useState<string>("Risk (%)");
  const [eaRiskValue, setEaRiskValue] = useState<number>(1.00);
  const [eaSuffix, setEaSuffix] = useState<string>("");
  const [eaPrefix, setEaPrefix] = useState<string>("");
  const [eaExcludeSymbols, setEaExcludeSymbols] = useState<boolean>(false);
  const [eaExcludeList, setEaExcludeList] = useState<string>("USDCAD,EURCHF");
  const [eaIncludeSymbols, setEaIncludeSymbols] = useState<boolean>(false);
  const [eaIncludeList, setEaIncludeList] = useState<string>("BTCUSD,ETHUSD,XAUUSD");
  const [eaChannelFilter, setEaChannelFilter] = useState<boolean>(true);
  const [eaChannelList, setEaChannelList] = useState<string>("@QuantTerminal_Alerts");
  const [eaSendNotifications, setEaSendNotifications] = useState<boolean>(true);
  const [eaManagementMode, setEaManagementMode] = useState<string>("Both");
  const [eaEnabled, setEaEnabled] = useState<boolean>(true);

  // EA Custom sub-dialog toggles (Entry, SL, TP, More Settings)
  const [showTpSettingsModal, setShowTpSettingsModal] = useState<boolean>(false);
  const [showSlSettingsModal, setShowSlSettingsModal] = useState<boolean>(false);
  const [showEntrySettingsModal, setShowEntrySettingsModal] = useState<boolean>(false);
  const [showMoreSettingsModal, setShowMoreSettingsModal] = useState<boolean>(false);

  // TP Ratios and Rule States based on user multi-tp-trailing requests
  const [eaTp1Ratio, setEaTp1Ratio] = useState<number>(1.5);
  const [eaTp2Ratio, setEaTp2Ratio] = useState<number>(2.5);
  const [eaTp3Ratio, setEaTp3Ratio] = useState<number>(4.0);
  const [eaChaseTp1ThenTp2, setEaChaseTp1ThenTp2] = useState<boolean>(true);
  const [eaCloseAtTp1OnTp2Pullback, setEaCloseAtTp1OnTp2Pullback] = useState<boolean>(true);
  const [eaChaseTp2ThenTp3, setEaChaseTp2ThenTp3] = useState<boolean>(true);
  const [eaCloseAtTp2OnTp3Pullback, setEaCloseAtTp2OnTp3Pullback] = useState<boolean>(true);

  // MT5 Terminal Simulation variables with localStorage persistence to prevent auto-resets
  const [terminalBalance, setTerminalBalance] = useState<number>(() => {
    const saved = localStorage.getItem("sim_terminalBalance");
    return saved ? Number(saved) : 62.07;
  });
  const [terminalBtcusdPrice, setTerminalBtcusdPrice] = useState<number>(69493.58);
  const [terminalActiveTab, setTerminalActiveTab] = useState<"TRADE" | "HISTORY" | "EXPERTS">("TRADE");
  const [simulatedEaPositions, setSimulatedEaPositions] = useState<any[]>(() => {
    const saved = localStorage.getItem("sim_simulatedEaPositions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.some((p: any) => p.id === "553913050" || p.id === "554276355")) {
          return parsed;
        }
      } catch (e) {}
    }
    return [
      { id: "553913050", symbol: "AUDUSD", displayName: "audusdm", type: "BUY", volume: 0.01, entryPrice: 0.69034, sl: 0.65670, tp: 0.69180, highestTpReached: 0, pnl: -0.25, time: "2026.06.26 11:09:31" },
      { id: "553981235", symbol: "GBPUSD", displayName: "gbpusdm", type: "SELL", volume: 0.01, entryPrice: 1.32126, sl: 1.33390, tp: 1.30280, highestTpReached: 0, pnl: -0.11, time: "2026.06.26 12:25:54" },
      { id: "554101448", symbol: "NVDA", displayName: "nvdam", type: "BUY", volume: 0.01, entryPrice: 192.63, sl: 190.90, tp: 960.54, highestTpReached: 0, pnl: 1.44, time: "2026.06.26 13:40:50" },
      { id: "554194581", symbol: "AUDUSD", displayName: "audusdm", type: "BUY", volume: 0.03, entryPrice: 0.69112, sl: 0.66600, tp: 0.69258, highestTpReached: 0, pnl: -3.09, time: "2026.06.26 14:34:54" },
      { id: "554276130", symbol: "GBPUSD", displayName: "gbpusdm", type: "SELL", volume: 0.15, entryPrice: 1.32148, sl: 1.33190, tp: 1.30080, highestTpReached: 0, pnl: 1.65, time: "2026.06.26 15:37:36" },
      { id: "554276355", symbol: "GBPUSD", displayName: "gbpusdm", type: "SELL", volume: 0.01, entryPrice: 1.32150, sl: 1.33180, tp: 1.30070, highestTpReached: 0, pnl: 0.13, time: "2026.06.26 15:37:41" }
    ];
  });

  // Price formatting helper that adjusts decimal places for forex, crypto, and commodity indices
  const formatPrice = (price: number | undefined | null, symbol: string) => {
    if (price === undefined || price === null) return "-";
    const upperSym = symbol.toUpperCase();
    if (upperSym.includes("JPY")) {
      return price.toFixed(3);
    }
    if (upperSym.includes("AUD") || upperSym.includes("EUR") || upperSym.includes("GBP")) {
      return price.toFixed(5);
    }
    if (upperSym.includes("USOIL") || upperSym.includes("OIL")) {
      return price.toFixed(3);
    }
    if (upperSym.includes("ETH") || upperSym.includes("BTC") || upperSym.includes("XAU")) {
      return price.toFixed(2);
    }
    return price.toLocaleString([], { minimumFractionDigits: 2, maximumFractionDigits: 5 });
  };

  const [simulatedEaHistory, setSimulatedEaHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem("sim_simulatedEaHistory");
    return saved ? JSON.parse(saved) : [
      { id: "550712001", symbol: "XAUUSD", displayName: "xauusdm", type: "BUY", volume: 0.1, entryPrice: 2351.50, exitPrice: 2380.00, sl: 2335.00, tp: 2380.00, pnl: 285.00, reason: "TP", time: "10:15" }
    ];
  });
  const [simulatedEaLogs, setSimulatedEaLogs] = useState<string[]>(() => {
    const saved = localStorage.getItem("sim_simulatedEaLogs");
    return saved ? JSON.parse(saved) : [
      "[Telegram EA] Bot connection established successfully.",
      "[Telegram EA] Listening to webhook streams for authorized channels...",
      "[Telegram EA] Channel filter validated: @QuantTerminal_Alerts is ALLOWED.",
    ];
  });

  // Telegram Client Simulation variables with localStorage persistence to prevent auto-resets
  const [tgChannelName, setTgChannelName] = useState<string>("QuantTerminal Alerts");
  const [tgSubscribers, setTgSubscribers] = useState<number>(1);
  const [tgChatText, setTgChatText] = useState<string>("");
  const [tgMessages, setTgMessages] = useState<any[]>(() => {
    const saved = localStorage.getItem("sim_tgMessages");
    return saved ? JSON.parse(saved) : [
      { id: 1, sender: "QuantTerminal Alerts", text: "Channel created", isSystem: true, date: "October 22" },
      { id: 2, sender: "QuantTerminal Alerts", text: "QuantTerminal Alerts bot compiled successfully in MetaTrader 5.", isSystem: true, date: "November 2" },
      { id: 3, sender: "QuantTerminal Alerts", text: "SELL BTCUSD\nENTRY 69195\nSL: 70150\nTP: 67100", time: "13:00 Uhr" }
    ];
  });

  // Keep localStorage perfectly updated when terminal settings change
  useEffect(() => {
    localStorage.setItem("sim_terminalBalance", String(terminalBalance));
  }, [terminalBalance]);

  useEffect(() => {
    localStorage.setItem("sim_simulatedEaPositions", JSON.stringify(simulatedEaPositions));
  }, [simulatedEaPositions]);

  useEffect(() => {
    localStorage.setItem("sim_simulatedEaHistory", JSON.stringify(simulatedEaHistory));
  }, [simulatedEaHistory]);

  useEffect(() => {
    localStorage.setItem("sim_simulatedEaLogs", JSON.stringify(simulatedEaLogs));
  }, [simulatedEaLogs]);

  useEffect(() => {
    localStorage.setItem("sim_tgMessages", JSON.stringify(tgMessages));
  }, [tgMessages]);

  // Migration Effect: Ensure user's active simulated terminal is seeded with the exact 6 trades from the Strategy Tester screenshot
  useEffect(() => {
    const hasOldDefault = simulatedEaPositions.some(pos => pos.id === "550717751" || pos.id === "109841") || simulatedEaPositions.length === 0;
    const hasNewTrades = simulatedEaPositions.some(pos => pos.id === "553913050");
    if (hasOldDefault || !hasNewTrades) {
      console.log("[Migration Engine] Seeding exact MT5 Strategy Tester active positions...");
      const realMt5Positions = [
        { id: "553913050", symbol: "AUDUSD", displayName: "audusdm", type: "BUY", volume: 0.01, entryPrice: 0.69034, sl: 0.65670, tp: 0.69180, highestTpReached: 0, pnl: -0.25, time: "2026.06.26 11:09:31" },
        { id: "553981235", symbol: "GBPUSD", displayName: "gbpusdm", type: "SELL", volume: 0.01, entryPrice: 1.32126, sl: 1.33390, tp: 1.30280, highestTpReached: 0, pnl: -0.11, time: "2026.06.26 12:25:54" },
        { id: "554101448", symbol: "NVDA", displayName: "nvdam", type: "BUY", volume: 0.01, entryPrice: 192.63, sl: 190.90, tp: 960.54, highestTpReached: 0, pnl: 1.44, time: "2026.06.26 13:40:50" },
        { id: "554194581", symbol: "AUDUSD", displayName: "audusdm", type: "BUY", volume: 0.03, entryPrice: 0.69112, sl: 0.66600, tp: 0.69258, highestTpReached: 0, pnl: -3.09, time: "2026.06.26 14:34:54" },
        { id: "554276130", symbol: "GBPUSD", displayName: "gbpusdm", type: "SELL", volume: 0.15, entryPrice: 1.32148, sl: 1.33190, tp: 1.30080, highestTpReached: 0, pnl: 1.65, time: "2026.06.26 15:37:36" },
        { id: "554276355", symbol: "GBPUSD", displayName: "gbpusdm", type: "SELL", volume: 0.01, entryPrice: 1.32150, sl: 1.33180, tp: 1.30070, highestTpReached: 0, pnl: 0.13, time: "2026.06.26 15:37:41" }
      ];
      setSimulatedEaPositions(realMt5Positions);
      setTerminalBalance(62.07);
      localStorage.setItem("sim_simulatedEaPositions", JSON.stringify(realMt5Positions));
      localStorage.setItem("sim_terminalBalance", "62.07");
    }
  }, []);

  // Automated Troubleshooter diagnostics suite
  const [runningTroubleshoot, setRunningTroubleshoot] = useState<boolean>(false);
  const [diagnosticReport, setDiagnosticReport] = useState<any>(null);

  // Outbound Telegram Publisher specific states
  const [testingPublish, setTestingPublish] = useState<boolean>(false);
  const [publishTestFeedback, setPublishTestFeedback] = useState<any>(null);
  const [testSignalMsg, setTestSignalMsg] = useState<string>(
    `🚨 <b>SIGNAL ALERT DETECTED [BUY]</b>\n\n📌 <b>Symbol:</b> BTCUSD\n📈 <b>Entry Price:</b> $88500\n🛑 <b>Stop Loss:</b> $87100\n🎯 <b>Take Profit:</b> $91200\n📶 <b>Strategy:</b> Time Range Breakout\n⏰ <b>Timestamp:</b> ${new Date().toLocaleTimeString("en-US", { timeZone: "Asia/Kolkata" })} IST`
  );

  const [parsingLoading, setParsingLoading] = useState<boolean>(false);
  const [parsedData, setParsedData] = useState<any>(null);
  const [postingFeedback, setPostingFeedback] = useState<string>("");

  // Activity tracking timestamp to prevent background poll overwriting what user is actively working on
  const lastActivityRef = React.useRef<number>(0);

  const recordActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Live ticker simulation engine for Telegram Copier EA
  useEffect(() => {
    if (!eaEnabled) return;
    const interval = setInterval(() => {
      // Small random walk for BTCUSD price
      const change = (Math.random() - 0.495) * 85; // highly responsive walk
      setTerminalBtcusdPrice((prev) => {
        const nextPrice = Number((prev + change).toFixed(2));
        
        // Update live trade elements
        setSimulatedEaPositions((positions) => {
          let updated = false;
          const mapPositions = positions.map((pos) => {
            // Retrieve current price from backend state or fallback to simulated tick
            let currentSymbolPrice = pos.entryPrice;
            if (state?.marketData?.[pos.symbol]?.currentPrice) {
              currentSymbolPrice = state.marketData[pos.symbol].currentPrice;
            } else if (pos.symbol === "BTCUSD") {
              currentSymbolPrice = nextPrice;
            } else {
              // small fallback random fluctuation
              const randomWalk = (Math.random() - 0.49) * (pos.entryPrice * 0.0001);
              currentSymbolPrice = Number((pos.entryPrice + randomWalk).toFixed(2));
            }
            
            // Calculate Profit PnL using standard commodity, forex, and crypto lot multipliers
            let pnl = 0;
            const pipMultiplier = pos.symbol.includes("USD") && !pos.symbol.startsWith("XAU") && !pos.symbol.startsWith("BTC") ? 10000 : 100;
            let profitPoints = 0;
            if (pos.type === "BUY") {
              profitPoints = (currentSymbolPrice - pos.entryPrice) * pipMultiplier;
            } else {
              profitPoints = (pos.entryPrice - currentSymbolPrice) * pipMultiplier;
            }
            const dollarMultiplier = pos.symbol === "BTCUSD" ? 0.01 : pos.symbol === "XAUUSD" ? 1.0 : 10.0;
            pnl = Number((profitPoints * pos.volume * dollarMultiplier).toFixed(2));

            // Check SL & TP limits
            let stopLossHit = false;
            let takeProfitHit = false;

            if (pos.type === "BUY") {
              if (pos.sl && currentSymbolPrice <= pos.sl) stopLossHit = true;
              if (pos.tp && currentSymbolPrice >= pos.tp) takeProfitHit = true;
            } else {
              if (pos.sl && currentSymbolPrice >= pos.sl) stopLossHit = true;
              if (pos.tp && currentSymbolPrice <= pos.tp) takeProfitHit = true;
            }

            // Position tracking simplified: all exit conditions, trail steps, and levels are managed dynamically by Phase-2 AI Dynamic Exit Engine
            let currentSl = pos.sl;
            
            if (stopLossHit) {
              const exitPr = pos.sl || currentSymbolPrice;
              let finalPnl = pnl;
              setSimulatedEaHistory((hist) => [
                {
                  id: pos.id,
                  symbol: pos.symbol,
                  type: pos.type,
                  volume: pos.volume,
                  entryPrice: pos.entryPrice,
                  exitPrice: exitPr,
                  sl: pos.sl,
                  tp: pos.tp,
                  pnl: finalPnl,
                  reason: "SL",
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                ...hist
              ]);
              setTerminalBalance((prevBal) => Number((prevBal + finalPnl).toFixed(2)));
              setSimulatedEaLogs((old) => [...old, `[Quant EA] Stop-Loss triggered closed position #${pos.id} of ${pos.symbol} at $${exitPr} (PnL: $${finalPnl})`]);
              updated = true;
              return null;
            }

            if (takeProfitHit) {
              let finalPnl = pnl;
              setSimulatedEaHistory((hist) => [
                {
                  id: pos.id,
                  symbol: pos.symbol,
                  type: pos.type,
                  volume: pos.volume,
                  entryPrice: pos.entryPrice,
                  exitPrice: pos.tp,
                  sl: pos.sl,
                  tp: pos.tp,
                  pnl: finalPnl,
                  reason: "TP",
                  time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                ...hist
              ]);
              setTerminalBalance((prevBal) => Number((prevBal + finalPnl).toFixed(2)));
              setSimulatedEaLogs((old) => [...old, `[Quant EA] Take-Profit triggered closed position #${pos.id} of ${pos.symbol} at $${pos.tp} (PnL: $${finalPnl})`]);
              updated = true;
              return null;
            }

            if (pnl !== pos.pnl || currentSl !== pos.sl) {
              updated = true;
              return { ...pos, pnl, sl: currentSl };
            }
            return pos;
          }).filter(Boolean);

          return updated ? mapPositions : positions;
        });

        return nextPrice;
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [eaEnabled, state]);

  // Synchronize simulated MT5 terminal state to server `/api/mt5/sync` whenever positions, balance or history changes
  useEffect(() => {
    if (!eaEnabled) return;
    
    const syncWithBackend = async () => {
      try {
        const providedToken = "tok_ea_921048_active"; // Default active token
        const res = await fetch("/api/mt5/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${providedToken}`
          },
          body: JSON.stringify({
            balance: terminalBalance,
            equity: terminalBalance, // Since equity is simulated as balance here
            positions: simulatedEaPositions.map(pos => ({
              id: pos.id,
              ticket: pos.id,
              symbol: pos.symbol,
              type: pos.type,
              size: pos.volume,
              entryPrice: pos.entryPrice,
              currentPrice: pos.pnl >= 0 
                ? (pos.type === "BUY" ? pos.entryPrice + (pos.pnl / pos.volume / 10) : pos.entryPrice - (pos.pnl / pos.volume / 10))
                : (pos.type === "BUY" ? pos.entryPrice - (Math.abs(pos.pnl) / pos.volume / 10) : pos.entryPrice + (Math.abs(pos.pnl) / pos.volume / 10)),
              stopLoss: pos.sl,
              takeProfit: pos.tp,
              pnl: pos.pnl,
              openTime: pos.time
            })),
            history: simulatedEaHistory.map(hist => ({
              id: hist.id,
              ticket: hist.id,
              symbol: hist.symbol,
              type: hist.type,
              size: hist.volume,
              entryPrice: hist.entryPrice,
              closePrice: hist.exitPrice,
              stopLoss: hist.sl,
              takeProfit: hist.tp,
              pnl: hist.pnl,
              reason: hist.reason,
              time: hist.time
            }))
          })
        });
        
        if (res.ok) {
          await res.json();
        }
      } catch (err) {
        console.error("[MT5 Sync Failure]", err);
      }
    };

    // Debounce/Throttle syncing to server to avoid high frequency requests
    const timer = setTimeout(() => {
      syncWithBackend();
    }, 450);

    return () => clearTimeout(timer);
  }, [simulatedEaPositions, terminalBalance, simulatedEaHistory, eaEnabled]);

  // Poll mirror queue and execute orders inside Simulated EA Terminal matching live WebRequest loops
  const processedQueueIdsRef = React.useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!eaEnabled) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = "tok_ea_921048_active"; // Default active token
        const res = await fetch(`/api/mt5/queue?token=${token}`);
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !data.queue || data.queue.length === 0) return;

        // Process each enqueued task
        for (const item of data.queue) {
          if (processedQueueIdsRef.current.has(item.id)) continue;
          processedQueueIdsRef.current.add(item.id);

          const ticket = String(item.ticket || Math.floor(100000 + Math.random() * 900000));
          
          if (item.action === "OPEN") {
            const entryPr = item.entryPrice || terminalBtcusdPrice;
            const newPos = {
              id: ticket, // Map to numeric ticket
              mirrorTaskId: item.id, // Keep trace of original task id
              symbol: item.originalSymbol || item.symbol,
              type: item.type,
              volume: item.size,
              entryPrice: entryPr,
              sl: item.stopLoss || undefined,
              tp: item.takeProfit || undefined,
              highestTpReached: 0,
              pnl: 0,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setSimulatedEaPositions((prev) => [newPos, ...prev]);
            setSimulatedEaLogs((old) => [
              ...old,
              `[Telegram EA] TERMINAL TRIGGER OK: Received open action. Created Simulated position #${ticket} (${newPos.symbol} ${item.type} ${item.size} Lots) @ $${entryPr}`
            ]);

            // Notify server of successful fill execution
            await fetch("/api/mt5/queue/fill", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: item.id,
                status: "SUCCESS",
                ticket: ticket,
                executionPrice: entryPr,
                token: token
              })
            });
          } 
          else if (item.action === "CLOSE") {
            // Find simulated trade
            setSimulatedEaPositions((positions) => {
              const tgt = positions.find(p => p.mirrorTaskId === item.id || p.id === item.id || p.symbol === item.symbol);
              if (tgt) {
                // Remove from active positions and save to history
                const exitPr = tgt.entryPrice; // default fallback execution price
                const pnlValue = tgt.pnl;
                
                setSimulatedEaHistory((hist) => [
                  {
                    id: tgt.id,
                    symbol: tgt.symbol,
                    type: tgt.type,
                    volume: tgt.volume,
                    entryPrice: tgt.entryPrice,
                    exitPrice: exitPr,
                    sl: tgt.sl,
                    tp: tgt.tp,
                    pnl: pnlValue,
                    reason: "TERM_CLOSE",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  },
                  ...hist
                ]);
                
                setTerminalBalance((prevBal) => Number((prevBal + pnlValue).toFixed(2)));
                setSimulatedEaLogs((old) => [
                  ...old,
                  `[Telegram EA] TERMINAL TRIGGER OK: Position #${tgt.id} closed @ $${exitPr} (Realized: $${pnlValue})`
                ]);
                
                // Notify server of successful fill close execution
                fetch("/api/mt5/queue/fill", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    id: item.id,
                    status: "SUCCESS",
                    ticket: tgt.id,
                    executionPrice: exitPr,
                    token: token
                  })
                }).catch(err => console.error(err));

                return positions.filter(p => p.id !== tgt.id);
              }
              return positions;
            });
          }
          else if (item.action === "MODIFY") {
            // Modify stopLoss and takeProfit
            setSimulatedEaPositions((positions) => {
              const matched = positions.map(pos => {
                // If it's the specific position
                if (pos.symbol === item.originalSymbol || pos.symbol === item.symbol) {
                  const updatedPos = {
                    ...pos,
                    sl: item.stopLoss !== undefined ? item.stopLoss : pos.sl,
                    tp: item.takeProfit !== undefined ? item.takeProfit : pos.tp
                  };
                  
                  // Log parameter updates
                  setSimulatedEaLogs((old) => [
                    ...old,
                    `[Telegram EA] TERMINAL TRIGGER OK: Position #${pos.id} modification completed. SL: ${updatedPos.sl || 'none'}, TP: ${updatedPos.tp || 'none'}`
                  ]);

                  return updatedPos;
                }
                return pos;
              });

              // Notify server of modification execution confirmation
              fetch("/api/mt5/queue/fill", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  id: item.id,
                  status: "SUCCESS",
                  ticket: ticket,
                  executionPrice: item.entryPrice || 0,
                  token: token
                })
              }).catch(err => console.error(err));

              return matched;
            });
          }
        }
      } catch (err) {
        console.error("[MT5 Queue Poll Error]", err);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [eaEnabled, terminalBtcusdPrice]);

  // Sync state values on initial load or when config is loaded
  useEffect(() => {
    // If user has touched controls or is editing within last 4s, do NOT overwrite their inputs via background polls
    if (Date.now() - lastActivityRef.current < 4000) {
      return;
    }

    if (state.config.executionMethod !== undefined) {
      if (state.config.executionMethod === "TELEGRAM_BRIDGE") {
        setExecutionMethod("DIRECT");
      } else {
        setExecutionMethod(state.config.executionMethod as any);
      }
    }

    if (activeTab !== "TELEGRAM") {
      if (state.config.telegramReceiverToken !== undefined) setBotToken(state.config.telegramReceiverToken);
      if (state.config.telegramReceiverChatId !== undefined) setReceiverChatId(state.config.telegramReceiverChatId);
      if (state.config.telegramReceiverActive !== undefined) setReceiverActive(state.config.telegramReceiverActive);
      if (state.config.telegramAutoMirror !== undefined) setAutoMirror(state.config.telegramAutoMirror);
    }

    if (activeTab !== "DIRECT_BROKER_SETTINGS") {
      if (state.config.directBrokerServer !== undefined) setDbServer(state.config.directBrokerServer);
      if (state.config.directBrokerLogin !== undefined) setDbLogin(state.config.directBrokerLogin);
      if (state.config.directBrokerPassword !== undefined) setDbPassword(state.config.directBrokerPassword);
      if (state.config.directBrokerRouteToEA !== undefined) setDbRouteToEA(state.config.directBrokerRouteToEA);
      if (state.config.directBrokerSuffix !== undefined) setDbSuffix(state.config.directBrokerSuffix);
    }

    // If actively in editing mode, do not modify broker inputs to avoid resetting user progress
    if (!isEditingConnection) {
      if (state.mt5Config?.server !== undefined) setBrokerServer(state.mt5Config.server);
      if (state.mt5Config?.login !== undefined) setBrokerLogin(state.mt5Config.login);
      if (state.mt5Config?.password !== undefined) setBrokerPassword(state.mt5Config.password);
      if (state.mt5Config?.brokerSuffix !== undefined) setBrokerSuffix(state.mt5Config.brokerSuffix || "");
    }
  }, [state.config, state.mt5Config, isEditingConnection, activeTab]);

  // Run troubleshooting automatically when visiting the Telegram connector tab
  useEffect(() => {
    if (activeTab === "TELEGRAM") {
      handleRunTroubleshoot();
    }
    if (activeTab === "CONNECTIONS") {
      handleRunMT5Troubleshoot();
    }
  }, [activeTab]);

  const handleRunMT5Troubleshoot = async () => {
    setRunningMT5Troubleshoot(true);
    try {
      const res = await fetch("/api/mt5/connector/troubleshoot");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMt5DiagnosticReport(data);
        }
      }
    } catch (err) {
      console.error("MT5 Troubleshooting diagnostics check failed", err);
    } finally {
      setRunningMT5Troubleshoot(false);
    }
  };

  const handleAutoFixMT5 = async () => {
    setFixingMT5(true);
    try {
      const res = await fetch("/api/mt5/connector/autofix", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          // Refresh the parent global configs (broker info, bridge couplers, etc.)
          await onUpdateConfig({});
          
          // Re-trigger the troubleshooter check automatically to update status report to PASS
          const dRes = await fetch("/api/mt5/connector/troubleshoot");
          if (dRes.ok) {
            const dData = await dRes.json();
            if (dData.success) {
              setMt5DiagnosticReport(dData);
            }
          }
        }
      }
    } catch (err) {
      console.error("Failed to execute MT5 auto-fix repairs:", err);
    } finally {
      setFixingMT5(false);
    }
  };

  const handleRunSyncExecutionTest = async () => {
    setTestingSyncExecution(true);
    setTestSyncSteps(null);
    try {
      const res = await fetch("/api/mt5/test-sync-execution", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setTestSyncSteps(data.stepLogs);
          // Trigger callbacks or refresh parent data structures
          await onUpdateConfig({});
          // Sync secondary reports
          const dRes = await fetch("/api/mt5/connector/troubleshoot");
          if (dRes.ok) {
            const dData = await dRes.json();
            if (dData.success) {
              setMt5DiagnosticReport(dData);
            }
          }
        } else {
          setTestSyncSteps(["Error: Handshake execution aborted or failed on server."]);
        }
      } else {
        setTestSyncSteps(["Error: Handshake execution query failed. Status invalid."]);
      }
    } catch (err: any) {
      console.error("End-to-End terminal connection test failed.", err);
      setTestSyncSteps([`Error: Operation halted. ${err.message || "Internal network failure"}`]);
    } finally {
      setTestingSyncExecution(false);
    }
  };

  const handleSaveReceiverSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setPostingFeedback("Saving settings...");
    await onUpdateConfig({
      telegramReceiverToken: botToken,
      telegramReceiverChatId: receiverChatId,
      telegramReceiverActive: receiverActive,
      telegramAutoMirror: autoMirror
    });
    setPostingFeedback("Receiver configurations updated successfully!");
    setTimeout(() => setPostingFeedback(""), 3000);
  };

  const handleConnectBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brokerServer.trim() || !brokerLogin.trim()) {
      setConnectFeedback("Broker Server and Login Account ID are required.");
      return;
    }
    setConnectLoading(true);
    setConnectFeedback("Initiating secure SSL handshake to MT5 server...");
    
    try {
      const res = await fetch("/api/mt5/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          server: brokerServer,
          login: brokerLogin,
          password: brokerPassword,
          brokerSuffix: brokerSuffix
        })
      });
      if (res.ok) {
        setConnectSuccess(true);
        setIsEditingConnection(false);
        setConnectFeedback("Success! Connected to MT5 trading server. Algo-Bridge Link: ONLINE.");
        // Force refresh state from parent
        await onUpdateConfig({});
        handleRunMT5Troubleshoot();
        setTimeout(() => {
          setConnectSuccess(false);
          setConnectFeedback("");
        }, 5000);
      } else {
        const errData = await res.json();
        setConnectFeedback(`Connection failed: ${errData.error || "Unknown response"}`);
      }
    } catch (err) {
      console.error(err);
      setConnectFeedback("Network error connecting to MT5 API endpoint.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnectBroker = async () => {
    setDisconnectLoading(true);
    setConnectFeedback("Initiating connection tear-down sequence...");
    try {
      const res = await fetch("/api/mt5/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setConnectSuccess(false);
        setIsEditingConnection(true);
        setConnectFeedback("Disconnected from MT5 Server. Link offline.");
        // Force refresh state from parent
        await onUpdateConfig({});
        setTimeout(() => {
          setConnectFeedback("");
        }, 4000);
      } else {
        setConnectFeedback("Disconnection request failed.");
      }
    } catch (err) {
      console.error(err);
      setConnectFeedback("Network error during disconnection.");
    } finally {
      setDisconnectLoading(false);
    }
  };

  const handleConnectDirectBroker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dbServer.trim() || !dbLogin.trim() || !dbPassword.trim()) {
      setDbFeedback("All fields (Server, Account Login ID, Password) are required.");
      return;
    }
    setDbLoading(true);
    setDbFeedback("Authenticating with Direct Broker MT5 Gateway...");
    try {
      const res = await onUpdateConfig({
        directBrokerEnabled: true,
        directBrokerServer: dbServer,
        directBrokerLogin: dbLogin,
        directBrokerPassword: dbPassword,
        directBrokerSuffix: dbSuffix,
        directBrokerAutoExecute: dbAutoExecute,
        directBrokerRouteToEA: dbRouteToEA
      });
      
      if (res && res.success === false) {
        setDbFeedback(res.error || "Connection failed: Invalid coupling server configurations.");
      } else {
        setDbFeedback("Success! Direct Broker MT5 Connection established is ONLINE.");
      }
    } catch (err: any) {
      console.error(err);
      setDbFeedback(`Connection failed: ${err.message || "Unknown error"}`);
    } finally {
      setDbLoading(false);
    }
  };

  const handleDisconnectDirectBroker = async () => {
    setDbLoading(true);
    setDbFeedback("Disconnecting Direct Broker Gateway...");
    try {
      await onUpdateConfig({
        directBrokerEnabled: false
      });
      setDbFeedback("Successfully disconnected direct coupled gateway.");
    } catch (err: any) {
      console.error(err);
      setDbFeedback("Failed to disconnect gateway.");
    } finally {
      setDbLoading(false);
    }
  };

  const handleSimulateInterruption = async () => {
    setConnectFeedback("Enacting manual trade thread break...");
    try {
      const res = await fetch("/api/mt5/simulate-interruption", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      if (res.ok) {
        setConnectFeedback("Heartbeat interrupted. Initializing auto-reconnect logic checks on server...");
        await onUpdateConfig({});
        setTimeout(() => {
          setConnectFeedback("");
        }, 4500);
      } else {
        const data = await res.json();
        setConnectFeedback(data.error || "Simulation trigger failed.");
      }
    } catch (err) {
      console.error(err);
      setConnectFeedback("Error communicating disruption signal.");
    }
  };

  const handleLoadTemplate = (templateName: "GOLD" | "BTC") => {
    if (templateName === "GOLD") {
      setSimulatedMessage(
        "🔔 FOREX GOLD VIP SIGNAL\n\nBUY XAUUSD @ 2351.5\nSL: 2335.0\nTP: 2380.0\nTimeframe: M15\nDual EMA Cross confirmed!"
      );
    } else {
      setSimulatedMessage(
        "🚀 COIN KING DOMAIN CRYPTO\n\nSELL BTCUSD at 68500\n🛑 Stoploss: 69200\nTarget Target: 67100\nTime-Range Breakout structure confirmed."
      );
    }
  };

  const handleParseAndTest = async () => {
    setParsingLoading(true);
    setPostingFeedback("");
    try {
      const res = await fetch("/api/telegram/receiver/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: simulatedMessage,
          chatId: simulatedChatIdInput
        })
      });
      if (res.ok) {
        const data = await res.json();
        setParsedData(data.parsed);
        if (data.mirrorPushed) {
          setPostingFeedback("Alert parsed & mirror trade pushed to MT5 queues successfully!");
        } else {
          setPostingFeedback("Alert parsed successfully & logged to received stream!");
        }
      }
    } catch (err) {
      console.error(err);
      setPostingFeedback("Network error parsing simulated Telegram alert.");
    } finally {
      setParsingLoading(false);
    }
  };

  const handleRunTroubleshoot = async () => {
    setRunningTroubleshoot(true);
    try {
      const res = await fetch("/api/telegram/receiver/troubleshoot");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDiagnosticReport(data.diagnostics);
        }
      }
    } catch (err) {
      console.error("Troubleshooting diagnostics check failed", err);
    } finally {
      setRunningTroubleshoot(false);
    }
  };

  const handleTestPublish = async () => {
    setTestingPublish(true);
    setPublishTestFeedback(null);
    try {
      const res = await fetch("/api/telegram/publisher/test-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customMessage: testSignalMsg,
          botToken: botToken,
          chatId: receiverChatId
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPublishTestFeedback({
            success: true,
            msg: data.details || "Test message sent successfully!"
          });
        } else {
          setPublishTestFeedback({
            success: false,
            msg: data.error || "Failed to publish test message.",
            suggestions: data.suggestions || []
          });
        }
      } else {
        setPublishTestFeedback({
          success: false,
          msg: `HTTP Error: Received status code ${res.status}`
        });
      }
    } catch (err: any) {
      console.error(err);
      setPublishTestFeedback({
        success: false,
        msg: err.message || "Failed to contact local server."
      });
    } finally {
      setTestingPublish(false);
    }
  };

  const handleManualPush = async () => {
    if (!parsedData || !parsedData.valid) return;
    setParsingLoading(true);
    setPostingFeedback("");
    try {
      const res = await fetch("/api/telegram/receiver/push-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: parsedData.symbol,
          type: parsedData.type,
          size: state.config.lotSize || 0.1,
          stopLoss: parsedData.stopLoss,
          takeProfit: parsedData.takeProfit,
          strategyId: parsedData.strategyId
        })
      });
      if (res.ok) {
        setPostingFeedback("Successfully dispatched manual Telegram order task to MT5 queues!");
      } else {
        const errorData = await res.json().catch(() => ({}));
        setPostingFeedback(errorData.error || "Blocked: Safeguards prevented manual trade dispatch.");
      }
    } catch (err: any) {
      console.error(err);
      setPostingFeedback("Error dispatching manual parsed trade task.");
    } finally {
      setParsingLoading(false);
    }
  };

  const tokens = state.mt5Config.tokens || [];
  const mirrorActivity = state.mt5Config.mirrorActivity || [];

  // Create new active token
  const handleCreateToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTerminalName.trim()) return;
    setCreatingToken(true);
    try {
      const res = await fetch("/api/mt5/token/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terminalName: newTerminalName })
      });
      if (res.ok) {
        setNewTerminalName("");
        // State will auto-refresh as App.tsx polls the /api/state state every 2 seconds
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingToken(false);
    }
  };

  // Delete a token
  const handleDeleteToken = async (id: string) => {
    try {
      await fetch("/api/mt5/token/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendTgMessage = () => {
    if (!tgChatText.trim()) return;
    const cleanText = tgChatText.trim();
    setTgChatText("");

    // Create a client message bubble
    const newMsg = {
      id: tgMessages.length + 1,
      sender: "QuantTerminal Alerts",
      text: cleanText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Uhr"
    };
    
    setTgMessages((prev) => [...prev, newMsg]);

    // Feed to simulated parsing engine!
    setTimeout(() => {
      setSimulatedEaLogs((old) => [...old, `[Telegram EA] Dispatching message payload: "${cleanText.replace(/\n/g, "  ")}"`]);
      
      // Check if EA is powered ON
      if (!eaEnabled) {
        setSimulatedEaLogs((old) => [...old, "[Telegram EA] WARN: Message received but Copy Trading EA is currently DISABLED. Set state to Enabled on chart controls."]);
        return;
      }

      // Check symbol list filters & channel filter
      const hasAllowedChannel = eaChannelList.toUpperCase().replace(/[@\s]/g, "").includes("QUANTTERMINAL_ALERTS") || eaChannelList.toUpperCase().replace(/[@\s]/g, "").includes(tgChannelName.toUpperCase().replace(/[@\s]/g, "")) || !eaChannelFilter;
      if (eaChannelFilter && !hasAllowedChannel) {
        setSimulatedEaLogs((old) => [...old, `[Telegram EA] FILTER REJECTED: Message sender channel not authorized per channel filter lists.`]);
        return;
      }

      // Parse BUY/SELL action
      const upperText = cleanText.toUpperCase();
      let action: "BUY" | "SELL" | null = null;
      if (upperText.includes("BUY") || upperText.includes("LONG") || upperText.includes("CALL")) {
        action = "BUY";
      } else if (upperText.includes("SELL") || upperText.includes("SHORT") || upperText.includes("PUT")) {
        action = "SELL";
      }

      if (!action) {
        setSimulatedEaLogs((old) => [...old, `[Telegram EA] TELEMETRY PARSE: No standard BUY/SELL commands matched in signal text. Skipping execution.`]);
        return;
      }

      // Parse symbol (e.g. BTCUSD, XAUUSD, etc.)
      let matchedSymbol = "BTCUSD"; // default
      if (upperText.includes("XAUUSD") || upperText.includes("GOLD")) {
        matchedSymbol = "XAUUSD";
      } else if (upperText.includes("ETHUSD") || upperText.includes("ETHER")) {
        matchedSymbol = "ETHUSD";
      } else if (upperText.includes("EURUSD")) {
        matchedSymbol = "EURUSD";
      } else if (upperText.includes("GBPUSD") || upperText.includes("GBP")) {
        matchedSymbol = "GBPUSD";
      } else if (upperText.includes("USDJPY") || upperText.includes("JPY")) {
        matchedSymbol = "USDJPY";
      } else if (upperText.includes("AUDUSD") || upperText.includes("AUD")) {
        matchedSymbol = "AUDUSD";
      } else if (upperText.includes("USOIL") || upperText.includes("OIL") || upperText.includes("WTI")) {
        matchedSymbol = "USOIL";
      } else if (upperText.includes("SPX500") || upperText.includes("SPX")) {
        matchedSymbol = "SPX500";
      } else if (upperText.includes("AAPL") || upperText.includes("APPLE")) {
        matchedSymbol = "AAPL";
      } else if (upperText.includes("TSLA") || upperText.includes("TESLA")) {
        matchedSymbol = "TSLA";
      }

      // Exclude filter
      if (eaExcludeSymbols && eaExcludeList.toUpperCase().split(",").map(s => s.trim()).includes(matchedSymbol)) {
        setSimulatedEaLogs((old) => [...old, `[Telegram EA] FILTER BLOCKED: Symbol '${matchedSymbol}' resides inside exclusions list. Trading skipped.`]);
        return;
      }

      // Include filter
      if (eaIncludeSymbols && !eaIncludeList.toUpperCase().split(",").map(s => s.trim()).includes(matchedSymbol)) {
        setSimulatedEaLogs((old) => [...old, `[Telegram EA] FILTER BLOCKED: Symbol '${matchedSymbol}' not in strict inclusions allowlist. Trading skipped.`]);
        return;
      }

      // Extract SL & TP values
      let entryPr = matchedSymbol === "BTCUSD" ? terminalBtcusdPrice : (matchedSymbol === "XAUUSD" ? 2350.00 : 1.0850);
      
      // Parse entry price if given e.g. "ENTRY 69400" or "@ 69400"
      const entryMatch = upperText.match(/(?:ENTRY|LIMIT|@)\s*([0-9.]+)/i);
      if (entryMatch && entryMatch[1]) {
        entryPr = parseFloat(entryMatch[1]);
      }

      let slValue = 0;
      const slMatch = upperText.match(/(?:SL|STOPLOSS|STOP):\s*([0-9.]+)/i) || upperText.match(/(?:SL):\s*([0-9.]+)/i) || upperText.match(/(?:SL|STOPLOSS)\s+([0-9.]+)/i);
      if (slMatch && slMatch[1]) {
        slValue = parseFloat(slMatch[1]);
      } else {
        slValue = action === "BUY" ? entryPr - 800 : entryPr + 800;
      }

      let tpValue = 0;
      const tpMatch = upperText.match(/(?:TP|TAKEPROFIT|TARGET):\s*([0-9.]+)/i) || upperText.match(/(?:TP):\s*([0-9.]+)/i) || upperText.match(/(?:TP|TAKEPROFIT)\s+([0-9.]+)/i);
      if (tpMatch && tpMatch[1]) {
        tpValue = parseFloat(tpMatch[1]);
      } else {
        tpValue = action === "BUY" ? entryPr + 1200 : entryPr - 1200;
      }

      // Calculate lot size based on risk type setting
      let lots = 0.50; // default lots
      if (eaRiskType === "Fixed Lots") {
        lots = eaRiskValue;
      } else if (eaRiskType === "Risk (%)") {
        const cashRisk = (terminalBalance * eaRiskValue) / 100;
        const slDist = Math.abs(entryPr - slValue);
        if (slDist > 0) {
          lots = Number((cashRisk / slDist).toFixed(2));
        }
        if (lots < 0.01) lots = 0.01;
        if (lots > 10.0) lots = 10.00;
      }

      // Append suffix/prefix to symbol
      const decoratedSymbol = eaPrefix + matchedSymbol + eaSuffix;

      const newTicket = String(Math.floor(100000 + Math.random() * 900000));
      const posObj = {
        id: newTicket,
        symbol: matchedSymbol,
        type: action,
        volume: lots,
        entryPrice: entryPr,
        sl: slValue,
        tp: tpValue,
        highestTpReached: 0,
        pnl: 0.00,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSimulatedEaPositions((prev) => [posObj, ...prev]);
      setSimulatedEaLogs((old) => [
        ...old,
        `[Telegram EA] SUCCESS: Position #${newTicket} opened! ${action} ${lots} ${decoratedSymbol} at entry $${entryPr}. SL set to $${slValue}, TP set to $${tpValue}.`
      ]);

    }, 800);
  };

  const mqlCode = `//+------------------------------------------------------------------+
//|                                           ReplitBotBridge.mq5   |
//|                    Copyright 2026, Quant Intelligence Laboratory  |
//|                                      https://ai.studio/build     |
//+------------------------------------------------------------------+
#property copyright "Quant Intelligence Master Group"
#property link      "https://ai.studio/build"
#property version   "2.00"
#property strict

#include <Trade\\Trade.mqh>

// Inputs
input string   ServerUrl            = "${productionOrigin}"; // Webapp Base URL
input string   ApiToken             = "${tokens.length > 0 ? tokens[0].token : "YOUR_API_TOKEN_HERE"}";
input int      PollInterval         = 2000; // Poll timeframe (milliseconds)
input bool     ForceMarketExecution = true; // Use immediate market execution (ignore limit orders)
input bool     PreventDuplicates    = true; // Block duplicate active orders of same symbol/type
input int      DuplicatesCooldownSec = 120; // Cooldown in seconds for same symbol/type orders
input string   BrokerSuffix         = "${state.mt5Config?.brokerSuffix || ""}"; // Suffix (e.g. "m", "." or blank)

// Global objects
CTrade trade;
string ProcessedIds[];

struct RecentOrderRecord {
   string symbol;
   string type;
   datetime time;
};
RecentOrderRecord RecentOrders[];

// Helper to check if task ID was already executed
bool IsProcessed(string id) {
   int size = ArraySize(ProcessedIds);
   for(int i = 0; i < size; i++) {
      if(ProcessedIds[i] == id) return true;
   }
   return false;
}

// Helper to keep track of processed IDs
void MarkAsProcessed(string id) {
   int size = ArraySize(ProcessedIds);
   ArrayResize(ProcessedIds, size + 1);
   ProcessedIds[size] = id;
}

// Check if an order is a duplicate or within cooldown period
bool IsDuplicateOrder(string symbol, string type) {
   if(!PreventDuplicates) return false;

   // 1. Check active positions
   int posTotal = PositionsTotal();
   for(int i = 0; i < posTotal; i++) {
      if(PositionSelectByTicket(PositionGetTicket(i))) {
         if(PositionGetString(POSITION_SYMBOL) == symbol) {
            ENUM_POSITION_TYPE pType = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
            string pTypeStr = (pType == POSITION_TYPE_BUY) ? "BUY" : "SELL";
            if(pTypeStr == type) {
               Print("[Quant EA] Duplicate blocked: An active " + type + " position already exists for " + symbol);
               return true;
            }
         }
      }
   }

   // 2. Check cooldown for recently closed/sent orders
   datetime now = TimeCurrent();
   int recentCount = ArraySize(RecentOrders);
   for(int i = 0; i < recentCount; i++) {
      if(RecentOrders[i].symbol == symbol && RecentOrders[i].type == type) {
         if(now - RecentOrders[i].time < DuplicatesCooldownSec) {
            Print("[Quant EA] Duplicate blocked: Cooldown is active for " + type + " on " + symbol + " (" + IntegerToString((int)(now - RecentOrders[i].time)) + "s elapsed, " + IntegerToString(DuplicatesCooldownSec) + "s required)");
            return true;
         }
      }
   }

   return false;
}

// Add to recent orders tracker
void RecordRecentOrder(string symbol, string type) {
   datetime now = TimeCurrent();
   int size = ArraySize(RecentOrders);
   
   // Check if we can overwrite an existing entry
   for(int i = 0; i < size; i++) {
      if(RecentOrders[i].symbol == symbol && RecentOrders[i].type == type) {
         RecentOrders[i].time = now;
         return;
      }
   }
   
   ArrayResize(RecentOrders, size + 1);
   RecentOrders[size].symbol = symbol;
   RecentOrders[size].type = type;
   RecentOrders[size].time = now;
}

// Lightweight JSON string field parser
string GetJsonStringValue(string json, string key) {
   string searchKey = "\\"" + key + "\\":\\"";
   int startIdx = StringFind(json, searchKey);
   if(startIdx == -1) {
      // numeric values or unquoted properties fallback
      searchKey = "\\"" + key + "\\":";
      startIdx = StringFind(json, searchKey);
      if(startIdx == -1) return "";
      int valueStart = startIdx + StringLen(searchKey);
      while(valueStart < StringLen(json) && (StringSubstr(json, valueStart, 1) == " " || StringSubstr(json, valueStart, 1) == "\\\"")) {
         valueStart++;
      }
      int valueEnd = valueStart;
      while(valueEnd < StringLen(json)) {
         string c = StringSubstr(json, valueEnd, 1);
         if(c == "," || c == "}" || c == "]" || c == "\\\"" || c == "\\\\") break;
         valueEnd++;
      }
      return StringSubstr(json, valueStart, valueEnd - valueStart);
   }
   
   int valueStart = startIdx + StringLen(searchKey);
   int valueEnd = StringFind(json, "\\"", valueStart);
   if(valueEnd == -1) return "";
   return StringSubstr(json, valueStart, valueEnd - valueStart);
}

// Extract numeric/double values from JSON properties
double GetJsonDoubleValue(string json, string key) {
   string valStr = GetJsonStringValue(json, key);
   if(valStr == "") return 0.0;
   return StringToDouble(valStr);
}

// Parse queue array to separate items
int ParseQueueItems(string json, string &outItems[]) {
   int count = 0;
   int startSearch = StringFind(json, "\\\"queue\\\":[");
   if(startSearch == -1) return 0;
   
   int pos = startSearch + 9;
   while(true) {
      int openBrace = StringFind(json, "{", pos);
      if(openBrace == -1) break;
      int closeBrace = StringFind(json, "}", openBrace);
      if(closeBrace == -1) break;
      
      string item = StringSubstr(json, openBrace, closeBrace - openBrace + 1);
      ArrayResize(outItems, count + 1);
      outItems[count] = item;
      count++;
      pos = closeBrace + 1;
   }
   return count;
}

// Push fill/fail feedback back to the webapp gateway
void SendFillReport(string id, string status, string ticket, string errorMsg, double price) {
   string url = ServerUrl + "/api/mt5/queue/fill";
   string headers = "Content-Type: application/json\\r\\nAuthorization: Bearer " + ApiToken + "\\r\\n";
   
   string payload = "{\\"id\\":\\"" + id + "\\",\\"status\\":\\"" + status + "\\",\\"ticket\\":\\"" + ticket + "\\",\\"errorMsg\\":\\"" + errorMsg + "\\",\\"executionPrice\\":" + DoubleToString(price, 5) + "}";
   
   char postData[];
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   char resultData[];
   string resultHeaders;
   
   int res = WebRequest("POST", url, headers, PollInterval, postData, resultData, resultHeaders);
   if(res == 200) {
      Print("[Quant EA] Dispatched order feedback successfully: ", status, " for ID: ", id);
   } else {
      Print("[Quant EA] Error sending order status report. Response code: ", res);
   }
}

// Process individual parsed queue tasks
void ProcessOrder(string item) {
   string id = GetJsonStringValue(item, "id");
   if(id == "" || IsProcessed(id)) return;
   
   string action = GetJsonStringValue(item, "action");
   string symbol = GetJsonStringValue(item, "symbol");
   if(BrokerSuffix != "" && StringFind(symbol, BrokerSuffix) == -1) {
      symbol = symbol + BrokerSuffix;
   }
   string type = GetJsonStringValue(item, "type");
   double size = GetJsonDoubleValue(item, "size");
   double sl = GetJsonDoubleValue(item, "stopLoss");
   double tp = GetJsonDoubleValue(item, "takeProfit");
   double tp1 = GetJsonDoubleValue(item, "tp1");
   double tp2 = GetJsonDoubleValue(item, "tp2");
   double tp3 = GetJsonDoubleValue(item, "tp3");
   double entrySig = GetJsonDoubleValue(item, "entryPrice");
   
   Print("[Quant EA] Executing tasks: ", id, " | Action: ", action, " | Symbol: ", symbol, " | Type: ", type, " | Lots: ", size, " | SL: ", sl, " | TP1: ", tp1, " | TP2: ", tp2, " | TP3: ", tp3, " | Entry: ", entrySig);
   
   if(action == "OPEN") {
      if(IsDuplicateOrder(symbol, type)) {
         Print("[Quant EA] IGNORED duplicate OPEN: " + type + " signal for " + symbol + " rejected (already open or on cooldown).");
         SendFillReport(id, "FAILED", "0", "Duplicate Trade Blocked by EA Safeguard", 0.0);
         MarkAsProcessed(id);
         return;
      }
      ResetLastError();
      SymbolSelect(symbol, true);
      
      double currentAsk = SymbolInfoDouble(symbol, SYMBOL_ASK);
      double currentBid = SymbolInfoDouble(symbol, SYMBOL_BID);
      if(currentAsk == 0.0 || currentBid == 0.0) {
         currentAsk = SymbolInfoDouble(symbol, SYMBOL_LAST);
         currentBid = SymbolInfoDouble(symbol, SYMBOL_LAST);
      }
      
      // Determine if we should split the order for multiple take profits (TP1, TP2, TP3)
      double tps[3];
      int tpCount = 0;
      if(tp1 > 0) { tps[tpCount] = tp1; tpCount++; }
      if(tp2 > 0) { tps[tpCount] = tp2; tpCount++; }
      if(tp3 > 0) { tps[tpCount] = tp3; tpCount++; }
      
      // If there are no multi-tps but we have a main takeProfit, use it
      if(tpCount == 0 && tp > 0) {
         tps[0] = tp;
         tpCount = 1;
      }
      
      // Fallback: If no TP specified, run single order without TP
      if(tpCount == 0) {
         tpCount = 1;
         tps[0] = 0.0;
      }
      
      // Split lots equally among active TP levels
      double minLot = SymbolInfoDouble(symbol, SYMBOL_VOLUME_MIN);
      if(minLot <= 0.0) minLot = 0.01;
      double lotStep = SymbolInfoDouble(symbol, SYMBOL_VOLUME_STEP);
      if(lotStep <= 0.0) lotStep = 0.01;
      
      double splitSize = size / tpCount;
      // Round to nearest volume step
      splitSize = MathMax(minLot, NormalizeDouble(MathRound(splitSize / lotStep) * lotStep, 2));
      
      string executedTickets = "";
      bool anySuccess = false;
      string errorMsg = "";
      double execPriceAvg = 0.0;
      int successCount = 0;
      
      for(int i = 0; i < tpCount; i++) {
         double targetTp = tps[i];
         double orderPrice = 0.0;
         bool orderSuccess = false;
         
         // Determine order type: market vs pending (limit/stop)
         // We consider it a pending order if entryPrice is provided AND deviates from current price significantly
         double currentPriceForType = (type == "BUY") ? currentAsk : currentBid;
         double point = SymbolInfoDouble(symbol, SYMBOL_POINT);
         double distancePoints = point > 0 ? MathAbs(currentPriceForType - entrySig) / point : 0.0;
         
         bool usePending = !ForceMarketExecution && (entrySig > 0 && distancePoints > 30.0); // Deviation > 30 points (approx 3 pips for currency or 30c for gold)
         
         if(!usePending) {
            // Execute Market Order
            if(type == "BUY") {
               orderPrice = currentAsk;
               orderSuccess = trade.Buy(splitSize, symbol, 0.0, sl, targetTp, "Signal splitting Target " + IntegerToString(i+1));
               if(!orderSuccess) {
                  Print("[Quant EA] Normal Market Buy failed (Error: ", GetLastError(), "). Retrying via ECN Protocol (No SL/TP initially)...");
                  orderSuccess = trade.Buy(splitSize, symbol, 0.0, 0.0, 0.0, "Signal splitting ECN Target " + IntegerToString(i+1));
                  if(orderSuccess) {
                     ulong ticket = trade.ResultDeal();
                     if(ticket == 0) ticket = trade.ResultOrder();
                     if(ticket > 0 && (sl > 0.0 || targetTp > 0.0)) {
                        Sleep(100);
                        trade.PositionModify(ticket, sl, targetTp);
                     }
                  }
               }
            } else if(type == "SELL") {
               orderPrice = currentBid;
               orderSuccess = trade.Sell(splitSize, symbol, 0.0, sl, targetTp, "Signal splitting Target " + IntegerToString(i+1));
               if(!orderSuccess) {
                  Print("[Quant EA] Normal Market Sell failed (Error: ", GetLastError(), "). Retrying via ECN Protocol (No SL/TP initially)...");
                  orderSuccess = trade.Sell(splitSize, symbol, 0.0, 0.0, 0.0, "Signal splitting ECN Target " + IntegerToString(i+1));
                  if(orderSuccess) {
                     ulong ticket = trade.ResultDeal();
                     if(ticket == 0) ticket = trade.ResultOrder();
                     if(ticket > 0 && (sl > 0.0 || targetTp > 0.0)) {
                        Sleep(100);
                        trade.PositionModify(ticket, sl, targetTp);
                     }
                  }
               }
            }
         } else {
            // Execute Pending Order (limit or stop)
            orderPrice = entrySig;
            if(type == "BUY") {
               if(currentAsk > entrySig) {
                  // Price is currently above target: BUY LIMIT (buy lower than market)
                  orderSuccess = trade.BuyLimit(splitSize, orderPrice, symbol, sl, targetTp, ORDER_TIME_GTC, 0, "Limit Target " + IntegerToString(i+1));
               } else {
                  // Price is currently below target: BUY STOP (buy breakout higher than market)
                  orderSuccess = trade.BuyStop(splitSize, orderPrice, symbol, sl, targetTp, ORDER_TIME_GTC, 0, "Stop Target " + IntegerToString(i+1));
               }
            } else if(type == "SELL") {
               if(currentBid < entrySig) {
                  // Price is currently below target: SELL LIMIT (sell higher than market)
                  orderSuccess = trade.SellLimit(splitSize, orderPrice, symbol, sl, targetTp, ORDER_TIME_GTC, 0, "Limit Target " + IntegerToString(i+1));
               } else {
                  // Price is currently above target: SELL STOP (sell breakout lower than market)
                  orderSuccess = trade.SellStop(splitSize, orderPrice, symbol, sl, targetTp, ORDER_TIME_GTC, 0, "Stop Target " + IntegerToString(i+1));
               }
            }
         }
         
         if(orderSuccess) {
            ulong ticket = trade.ResultOrder();
            if(ticket == 0) ticket = trade.ResultDeal(); // fallback
            double execP = trade.ResultPrice();
            if(execP <= 0.0) execP = orderPrice;
            
            anySuccess = true;
            execPriceAvg += execP;
            successCount++;
            
            if(executedTickets != "") executedTickets += ",";
            executedTickets += IntegerToString(ticket);
            
            Print("[Quant EA] Order Portion ", i+1, "/", tpCount, " Executed. Ticket: #", ticket, " Size: ", splitSize, " @ TP: ", targetTp);
         } else {
            int errCode = GetLastError();
            errorMsg = "Portion " + IntegerToString(i+1) + " failed (MQL5 code: " + IntegerToString(errCode) + ")";
            Print("[Quant EA] Portion failed: ", errorMsg);
         }
      }
      
      if(anySuccess) {
         execPriceAvg = execPriceAvg / successCount;
         RecordRecentOrder(symbol, type);
         Print("[Quant EA] SUCCESS: Multi-target open process completed successfully. Created split tickets: [", executedTickets, "]");
         SendFillReport(id, "DONE", executedTickets, "", execPriceAvg);
         MarkAsProcessed(id);
      } else {
         Print("[Quant EA] CRITICAL: All portions of position split failed. Error: ", errorMsg);
         SendFillReport(id, "FAILED", "0", errorMsg, 0.0);
         MarkAsProcessed(id);
      }
   }
   else if(action == "CLOSE") {
       ResetLastError();
       SymbolSelect(symbol, true);
       
       string targetTicketStr = GetJsonStringValue(item, "ticket");
       ulong targetTicket = (targetTicketStr != "") ? (ulong)StringToInteger(targetTicketStr) : 0;
       
       int closedCount = 0;
       for(int i = PositionsTotal() - 1; i >= 0; i--) {
          string posSymbol = PositionGetSymbol(i);
          if(posSymbol == symbol) {
             ulong ticket = PositionGetInteger(POSITION_TICKET);
             
             // Check if we have a specific target ticket to close
             if(targetTicket > 0 && ticket != targetTicket) {
                continue;
             }
             
             // Fallback to type checks if targetTicket was not specified
             if(targetTicket == 0) {
                long posType = PositionGetInteger(POSITION_TYPE);
                bool typeMatch = (type == "BUY" && posType == POSITION_TYPE_BUY) || (type == "SELL" && posType == POSITION_TYPE_SELL);
                if(!typeMatch) {
                   continue;
                }
             }
             
             double posVol = PositionGetDouble(POSITION_VOLUME);
              double clsSz = GetJsonDoubleValue(item, "size");
              bool clsOk = false;
              if (clsSz > 0.0001 && clsSz < posVol - 0.0001) {
                 MqlTradeRequest req;
                 MqlTradeResult resCode;
                 ZeroMemory(req);
                 ZeroMemory(resCode);
                 req.action    = TRADE_ACTION_DEAL;
                 req.position  = ticket;
                 req.symbol    = symbol;
                 req.volume    = clsSz;
                 req.deviation = 10;
                 long posType  = PositionGetInteger(POSITION_TYPE);
                 if (posType == POSITION_TYPE_BUY) {
                    req.type  = ORDER_TYPE_SELL;
                    req.price = SymbolInfoDouble(symbol, SYMBOL_BID);
                 } else {
                    req.type  = ORDER_TYPE_BUY;
                    req.price = SymbolInfoDouble(symbol, SYMBOL_ASK);
                 }
                 clsOk = OrderSend(req, resCode);
              } else {
                 clsOk = trade.PositionClose(ticket);
              }
              if(clsOk) {
                closedCount++;
             }
          }
       }
       
       if(closedCount > 0) {
          Print("[Quant EA] SUCCESS: Automated close request. Closed ", closedCount, " position(s) of: ", symbol);
          SendFillReport(id, "DONE", "CLOSE_SUCCESS", "Closed " + IntegerToString(closedCount) + " position(s)", 0.0);
          MarkAsProcessed(id);
       } else {
          Print("[Quant EA] IGNORED: Close request received but no open positions found of: ", symbol, " with target ticket: ", targetTicketStr);
          SendFillReport(id, "FAILED", "0", "No open positions found to close.", 0.0);
          MarkAsProcessed(id);
       }
    }
    else if(action == "MODIFY") {
      ResetLastError();
      SymbolSelect(symbol, true);
      
      int modifiedCount = 0;
      bool modifySuccess = false;
      string errorMsg = "";
      
      for(int i = PositionsTotal() - 1; i >= 0; i--) {
         string posSymbol = PositionGetSymbol(i);
         if(posSymbol == symbol) {
            ulong ticket = PositionGetInteger(POSITION_TICKET);
            double currentSl = PositionGetDouble(POSITION_SL);
            double currentTp = PositionGetDouble(POSITION_TP);
            
            // Adjust to new sl/tp if provided
            double targetSl = sl > 0 ? sl : currentSl;
            double targetTp = tp > 0 ? tp : currentTp;
            
            if(trade.PositionModify(ticket, targetSl, targetTp)) {
               modifiedCount++;
               modifySuccess = true;
            } else {
               int errCode = GetLastError();
               errorMsg = "Modify failed for ticket #" + IntegerToString(ticket) + " (MQL5 code: " + IntegerToString(errCode) + ")";
            }
         }
      }
      
      if(modifySuccess) {
         Print("[Quant EA] SUCCESS: Automated parameter modification. Adjusted " + IntegerToString(modifiedCount) + " position(s) of: " + symbol);
         SendFillReport(id, "DONE", "MODIFY_SUCCESS", "Adjusted " + IntegerToString(modifiedCount) + " position(s)", 0.0);
         MarkAsProcessed(id);
      } else {
         if(errorMsg == "") errorMsg = "No open positions found to modify.";
         Print("[Quant EA] IGNORED/FAILED: Modify request: " + errorMsg);
         SendFillReport(id, "FAILED", "0", errorMsg, 0.0);
         MarkAsProcessed(id);
      }
   }
}

// Synchronize live account metrics and positions to the dashboard
void SendAccountSync() {
   string url = ServerUrl + "/api/mt5/sync";
   string headers = "Content-Type: application/json\\r\\nAuthorization: Bearer " + ApiToken + "\\r\\n";
   
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   
   string positionsJson = "[";
   int posCount = PositionsTotal();
   int added = 0;
   
   for(int i = 0; i < posCount; i++) {
      if(PositionSelectByTicket(PositionGetTicket(i))) {
         ulong ticket = PositionGetInteger(POSITION_TICKET);
         string symbol = PositionGetString(POSITION_SYMBOL);
         ENUM_POSITION_TYPE type = (ENUM_POSITION_TYPE)PositionGetInteger(POSITION_TYPE);
         double volume = PositionGetDouble(POSITION_VOLUME);
         double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
         double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
         double sl = PositionGetDouble(POSITION_SL);
         double tp = PositionGetDouble(POSITION_TP);
         double pnl = PositionGetDouble(POSITION_PROFIT);
         
         string posTypeStr = (type == POSITION_TYPE_BUY) ? "BUY" : "SELL";
         
         if(added > 0) positionsJson += ",";
         positionsJson += "{\\"id\\":\\"" + IntegerToString(ticket) + 
                          "\\",\\"symbol\\":\\"" + symbol + 
                          "\\",\\"type\\":\\"" + posTypeStr + 
                          "\\",\\"volume\\":" + DoubleToString(volume, 2) + 
                          ",\\"entryPrice\\":" + DoubleToString(openPrice, 5) + 
                          ",\\"currentPrice\\":" + DoubleToString(currentPrice, 5) + 
                          ",\\"stopLoss\\":" + DoubleToString(sl, 5) + 
                          ",\\"takeProfit\\":" + DoubleToString(tp, 5) + 
                          ",\\"pnl\\":" + DoubleToString(pnl, 2) + "}";
         added++;
      }
   }
   positionsJson += "]";
   
   // Select closed history deals from last 24 hours to reconcile outputs
   string historyJson = "[";
   int histAdded = 0;
   if(HistorySelect(TimeCurrent() - 86450, TimeCurrent() + 60)) {
      int dealsTotal = HistoryDealsTotal();
      for(int i = dealsTotal - 1; i >= 0 && histAdded < 30; i--) {
         ulong ticket = HistoryDealGetTicket(i);
         if(ticket > 0) {
            long entry = HistoryDealGetInteger(ticket, DEAL_ENTRY);
            if(entry == DEAL_ENTRY_OUT || entry == DEAL_ENTRY_OUT_BY) {
               ulong positionId = HistoryDealGetInteger(ticket, DEAL_POSITION_ID);
               double dealPnl = HistoryDealGetDouble(ticket, DEAL_PROFIT);
               double dealPrice = HistoryDealGetDouble(ticket, DEAL_PRICE);
               long reason = HistoryDealGetInteger(ticket, DEAL_REASON);
               string reasonStr = "STRATEGY";
               if(reason == DEAL_REASON_SL) reasonStr = "SL";
               else if(reason == DEAL_REASON_TP) reasonStr = "TP";
               else if(reason == DEAL_REASON_CLIENT) reasonStr = "MANUAL";
               
               if(histAdded > 0) historyJson += ",";
               historyJson += "{\\\"id\\\":\\\"" + IntegerToString(positionId) + 
                              "\\\",\\\"ticket\\\":\\\"" + IntegerToString(positionId) + 
                              "\\\",\\\"closePrice\\\":" + DoubleToString(dealPrice, 5) + 
                              ",\\\"pnl\\\":" + DoubleToString(dealPnl, 2) + 
                              ",\\\"reason\\\":\\\"" + reasonStr + "\\\"}";
               histAdded++;
            }
         }
      }
   }
   historyJson += "]";

   string payload = "{\\"balance\\":" + DoubleToString(balance, 2) + 
                    ",\\"equity\\":" + DoubleToString(equity, 2) + 
                    ",\\"positions\\":" + positionsJson + 
                    ",\\"history\\":" + historyJson + "}";
                    
   char postData[];
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   char resultData[];
   string resultHeaders;
   
   int res = WebRequest("POST", url, headers, PollInterval, postData, resultData, resultHeaders);
   if (res != 200) {
       Print("[Quant EA] Balance sync heartbeat response: ", res);
   }
}

int OnInit() {
   Print("[Quant EA] ReplitBotBridge EA loaded flawlessly. Ready to receive Telegram copies.");
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED)) {
      Print("[Quant EA] WARNING: 'Allow Algo Trading' is not checked in MT5 chart/options dialogs.");
   }
   EventSetMillisecondTimer(PollInterval);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   EventKillTimer();
}

void OnTimer() {
   // Synchronize account metrics & open trader logs to the cloud dashboard webapp
   SendAccountSync();

   string headers = "Content-Type: application/json\\r\\nAuthorization: Bearer " + ApiToken + "\\r\\n";
   char postData[], resultData[];
   string resultHeaders;
   
   string fullUrl = ServerUrl + "/api/mt5/queue";
   int res = WebRequest("GET", fullUrl, headers, PollInterval, postData, resultData, resultHeaders);
   if (res == 200) {
       string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
       string items[];
       int count = ParseQueueItems(response, items);
       if(count > 0) {
          Print("[Quant EA] Parsed ", count, " pending orders from webhook.");
          for(int i = 0; i < count; i++) {
             ProcessOrder(items[i]);
          }
       }
   } else if (res == 401) {
       Print("[Quant EA] API Auth Failure. Verify MT5 connections token keys.");
   } else {
       Print("[Quant EA] WebRequest bridge delay error. Code: ", res);
   }
}
`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mqlCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [copiedTgCode, setCopiedTgCode] = useState<boolean>(false);

  const telegramCopierMqlCode = `//+------------------------------------------------------------------+
//|                                  QuantTerminalSyncBridge.mq5     |
//|                    Copyright 2026, Quant Intelligence Laboratory  |
//|                                      https://ai.studio/build     |
//+------------------------------------------------------------------+
#property copyright "QuantTerminal Sync Master"
#property link      "https://ai.studio/build"
#property version   "3.00"
#property strict

#include <Trade\\Trade.mqh>

// Connection Setup (No manual risk or trailing variables required)
input string   ServerUrl            = "${productionOrigin}"; // Webapp Base URL
input string   ApiToken             = "${tokens.length > 0 ? tokens[0].token : "YOUR_API_TOKEN_HERE"}";
input int      PollInterval         = 1000; // Poll checking interval (ms)
input string   BrokerSuffix         = "${state.mt5Config?.brokerSuffix || ""}"; // Suffix (e.g. "m", "." or blank)

CTrade trade;
string ProcessedIds[];

bool IsProcessed(string id) {
   int size = ArraySize(ProcessedIds);
   for(int i = 0; i < size; i++) {
      if(ProcessedIds[i] == id) return true;
   }
   return false;
}

void MarkAsProcessed(string id) {
   int size = ArraySize(ProcessedIds);
   ArrayResize(ProcessedIds, size + 1);
   ProcessedIds[size] = id;
}

// Lightweight JSON helpers to parse values centrally
string GetJsonStringValue(string json, string key) {
   string searchKey = "\\"" + key + "\\":\\"";
   int startIdx = StringFind(json, searchKey);
   if(startIdx == -1) {
      searchKey = "\\"" + key + "\\":";
      startIdx = StringFind(json, searchKey);
      if(startIdx == -1) return "";
      int valueStart = startIdx + StringLen(searchKey);
      while(valueStart < StringLen(json) && (StringSubstr(json, valueStart, 1) == " " || StringSubstr(json, valueStart, 1) == "\\\"")) valueStart++;
      int valueEnd = valueStart;
      while(valueEnd < StringLen(json)) {
         string c = StringSubstr(json, valueEnd, 1);
         if(c == "," || c == "}" || c == "]" || c == "\\\"" || c == "\\\\") break;
         valueEnd++;
      }
      return StringSubstr(json, valueStart, valueEnd - valueStart);
   }
   int valueStart = startIdx + StringLen(searchKey);
   int valueEnd = StringFind(json, "\\"", valueStart);
   if(valueEnd == -1) return "";
   return StringSubstr(json, valueStart, valueEnd - valueStart);
}

double GetJsonDoubleValue(string json, string key) {
   string valStr = GetJsonStringValue(json, key);
   if(valStr == "") return 0.0;
   return StringToDouble(valStr);
}

int ParseQueueItems(string json, string &outItems[]) {
   int count = 0;
   int startSearch = StringFind(json, "\\\"queue\\\":[");
   if(startSearch == -1) return 0;
   int pos = startSearch + 9;
   while(true) {
      int openBrace = StringFind(json, "{", pos);
      if(openBrace == -1) break;
      int closeBrace = StringFind(json, "}", openBrace);
      if(closeBrace == -1) break;
      string item = StringSubstr(json, openBrace, closeBrace - openBrace + 1);
      ArrayResize(outItems, count + 1);
      outItems[count] = item;
      count++;
      pos = closeBrace + 1;
   }
   return count;
}

void SendFillReport(string id, string status, string ticket, string errorMsg, double price) {
   string url = ServerUrl + "/api/mt5/queue/fill";
   string headers = "Content-Type: application/json\\r\\nAuthorization: Bearer " + ApiToken + "\\r\\n";
   string payload = "{\\"id\\":\\"" + id + "\\",\\"status\\":\\"" + status + "\\",\\"ticket\\":\\"" + ticket + "\\",\\"errorMsg\\":\\"" + errorMsg + "\\",\\"executionPrice\\":" + DoubleToString(price, 5) + "}";
   char postData[];
   StringToCharArray(payload, postData, 0, WHOLE_ARRAY, CP_UTF8);
   char resultData[];
   string resultHeaders;
   WebRequest("POST", url, headers, PollInterval, postData, resultData, resultHeaders);
}

// Full execution logic synchronized in lockstep with the terminal server
void ProcessOrder(string item) {
   string id = GetJsonStringValue(item, "id");
   if(id == "" || IsProcessed(id)) return;
   
   string action = GetJsonStringValue(item, "action");
   string symbol = GetJsonStringValue(item, "symbol");
   if(BrokerSuffix != "" && StringFind(symbol, BrokerSuffix) == -1) {
      symbol = symbol + BrokerSuffix;
   }
   string type = GetJsonStringValue(item, "type");
   double size = GetJsonDoubleValue(item, "size");
   double sl = GetJsonDoubleValue(item, "stopLoss");
   double tp = GetJsonDoubleValue(item, "takeProfit");
   
   Print("[Quant EA] Executing terminal synced command: ", action, " | Symbol: ", symbol, " | SL: ", sl, " | TP: ", tp);
   
   if(action == "OPEN") {
      SymbolSelect(symbol, true);
      double currentAsk = SymbolInfoDouble(symbol, SYMBOL_ASK);
      double currentBid = SymbolInfoDouble(symbol, SYMBOL_BID);
      if(currentAsk == 0.0) currentAsk = SymbolInfoDouble(symbol, SYMBOL_LAST);
      if(currentBid == 0.0) currentBid = SymbolInfoDouble(symbol, SYMBOL_LAST);
      
      bool ok = false;
      double execPrice = 0.0;
      if(type == "BUY") {
         execPrice = currentAsk;
         ok = trade.Buy(size, symbol, 0.0, sl, tp, "Synced with Terminal Phase-1");
      } else {
         execPrice = currentBid;
         ok = trade.Sell(size, symbol, 0.0, sl, tp, "Synced with Terminal Phase-1");
      }
      
      if(ok) {
         ulong ticket = trade.ResultDeal();
         if(ticket == 0) ticket = trade.ResultOrder();
         SendFillReport(id, "DONE", IntegerToString(ticket), "", execPrice);
         MarkAsProcessed(id);
      } else {
         SendFillReport(id, "FAILED", "0", "Execution failed on mt5 terminal", 0.0);
         MarkAsProcessed(id);
      }
   }
   else if(action == "CLOSE") {
      int count = 0;
      for(int i = PositionsTotal() - 1; i >= 0; i--) {
         if(PositionGetSymbol(i) == symbol) {
            ulong ticket = PositionGetInteger(POSITION_TICKET);
            if(trade.PositionClose(ticket)) count++;
         }
      }
      if(count > 0) {
         SendFillReport(id, "DONE", "CLOSE_SUCCESS", "Closed " + IntegerToString(count) + " position(s)", 0.0);
      } else {
         SendFillReport(id, "FAILED", "0", "No active positions found to close", 0.0);
      }
      MarkAsProcessed(id);
   }
   else if(action == "MODIFY") {
      int count = 0;
      for(int i = PositionsTotal() - 1; i >= 0; i--) {
         if(PositionGetSymbol(i) == symbol) {
            ulong ticket = PositionGetInteger(POSITION_TICKET);
            double currentSl = PositionGetDouble(POSITION_SL);
            double currentTp = PositionGetDouble(POSITION_TP);
            double targetSl = sl > 0 ? sl : currentSl;
            double targetTp = tp > 0 ? tp : currentTp;
            if(trade.PositionModify(ticket, targetSl, targetTp)) count++;
         }
      }
      if(count > 0) {
         SendFillReport(id, "DONE", "MODIFY_SUCCESS", "Modified " + IntegerToString(count) + " position(s)", 0.0);
      } else {
         SendFillReport(id, "FAILED", "0", "No active positions found to modify", 0.0);
      }
      MarkAsProcessed(id);
   }
}

int OnInit() {
   Print("[Quant EA] Real-Time Sync Bridge active.");
   EventSetMillisecondTimer(PollInterval);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason) {
   EventKillTimer();
}

void OnTimer() {
   string headers = "Content-Type: application/json\\r\\nAuthorization: Bearer " + ApiToken + "\\r\\n";
   char postData[], resultData[];
   string resultHeaders;
   string fullUrl = ServerUrl + "/api/mt5/queue";
   int res = WebRequest("GET", fullUrl, headers, PollInterval, postData, resultData, resultHeaders);
   if (res == 200) {
       string response = CharArrayToString(resultData, 0, WHOLE_ARRAY, CP_UTF8);
       string items[];
       int count = ParseQueueItems(response, items);
       for(int i = 0; i < count; i++) {
          ProcessOrder(items[i]);
       }
   }
}
`;

  const handleCopyTelegramCopierCode = () => {
    navigator.clipboard.writeText(telegramCopierMqlCode);
    setCopiedTgCode(true);
    setTimeout(() => setCopiedTgCode(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(productionOrigin);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b border-zinc-900 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
            <Link2 className="h-5 w-5 text-emerald-500" />
            MetaTrader 5 Client Connector
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Bridge your simulated auto-trader operations to any live or demo MT5 Broker terminal.
          </p>
        </div>

        {/* Action button to quickly link bridge */}
        <button
          onClick={async () => {
            await onUpdateConfig({
              mt5BridgeEnabled: !state.config.mt5BridgeEnabled
            });
          }}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
            state.config.mt5BridgeEnabled
              ? "bg-rose-500/10 border-rose-500/30 text-rose-450 hover:bg-rose-500/20"
              : "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent"
          }`}
        >
          {state.config.mt5BridgeEnabled ? "DISCONNECT MT5 COUPLING" : "ACTIVATE BRIDGE COUPLING"}
        </button>
      </div>

      {/* TWO SEPARATE MT5 CONNECTION METHODS DEFINEMENT (Option 1 and Option 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 bg-zinc-950/20 p-4 rounded-2xl border border-zinc-900/60 font-sans">
        {/* OPTION 1 CARD */}
        <div 
          onClick={async () => {
            setExecutionMethod("DIRECT");
            setActiveTab("CONNECTIONS");
            recordActivity();
            await onUpdateConfig({ executionMethod: "DIRECT" });
          }}
          className={`relative p-5 rounded-xl border transition-all duration-300 cursor-pointer text-left overflow-hidden ${
            executionMethod === "DIRECT" 
              ? "bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/20" 
              : "bg-zinc-950/30 border-zinc-900 hover:border-zinc-805 hover:border-zinc-800 hover:bg-zinc-900/10 text-zinc-400"
          }`}
        >
          {executionMethod === "DIRECT" && (
            <div className="absolute top-2.5 right-2.5 bg-indigo-500 text-white font-mono text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">
              Active Method
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border ${executionMethod === "DIRECT" ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
              <Key className="h-5 w-5" />
            </div>
            <div className="space-y-1 pr-6">
              <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase font-black block">OPTION 1</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-white">Direct Terminal-to-MT5 Execution</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-1.5">
                Send trading signals directly from this terminal backtesting engine or manual order module to one or multiple secure MT5 accounts. Eliminates any intermediary delay.
              </p>
              
              <div className="grid grid-cols-1 gap-1 pt-2.5 border-t border-zinc-900/40 mt-3 text-[10px] text-zinc-500 font-mono">
                <span className="text-emerald-400">✔ Custom SSL Account Connection</span>
                <span className="text-emerald-400">✔ Sync Multiple Accounts</span>
                <span className="text-emerald-400">✔ Real-time Order Actions</span>
                <span className="text-emerald-400">✔ &lt; 50ms Direct Execution</span>
              </div>
            </div>
          </div>
        </div>

        {/* OPTION 2 CARD */}
        <div 
          onClick={async () => {
            setExecutionMethod("DIRECT_BROKER");
            setActiveTab("DIRECT_BROKER_SETTINGS");
            recordActivity();
            await onUpdateConfig({ executionMethod: "DIRECT_BROKER" });
          }}
          className={`relative p-5 rounded-xl border transition-all duration-300 cursor-pointer text-left overflow-hidden ${
            executionMethod === "DIRECT_BROKER" 
              ? "bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-950/20" 
              : "bg-zinc-950/30 border-zinc-900 hover:border-zinc-805 hover:border-zinc-800 hover:bg-zinc-900/10 text-zinc-400"
          }`}
        >
          {executionMethod === "DIRECT_BROKER" && (
            <div className="absolute top-2.5 right-2.5 bg-amber-400 text-black font-mono text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold animate-pulse">
              Active Method
            </div>
          )}
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border ${executionMethod === "DIRECT_BROKER" ? "bg-amber-500/10 border-amber-500/20 text-amber-400" : "bg-zinc-900 border-zinc-800 text-zinc-500"}`}>
              <Activity className="h-5 w-5" />
            </div>
            <div className="space-y-1 pr-6">
              <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-black block">OPTION 2</span>
              <h4 className="text-xs font-black uppercase tracking-wider text-white font-sans">Direct Broker MT5 Account Integration</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed mt-1.5">
                Integrate directly with standard broker MT5 accounts. Any signals generated by this terminal production environment are automatically copy-traded directly.
              </p>
              
              <div className="grid grid-cols-1 gap-1 pt-2.5 border-t border-zinc-900/40 mt-3 text-[10px] text-zinc-500 font-mono">
                <span className="text-emerald-400">✔ Direct Cloud Broker handshake</span>
                <span className="text-emerald-400">✔ Eliminates client-side EAs entirely</span>
                <span className="text-amber-400 font-bold">★ 100% Cloud-to-Cloud (NO EA Install Required!)</span>
                <span className="text-emerald-400">✔ Dynamic signal auto-copier</span>
                <span className="text-emerald-400">✔ Zero-maintenance integration</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Sub-tab navigation selector based on chosen execution workflow strategy */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-900">
        <div className="flex flex-wrap gap-1.5">
          {executionMethod === "DIRECT" ? (
            <>
              <button
                onClick={() => setActiveTab("CONNECTIONS")}
                className={`flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  activeTab === "CONNECTIONS" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                }`}
              >
                <Key className="h-3.5 w-3.5 text-indigo-400" />
                Direct Connections ({tokens.length})
              </button>

              <button
                onClick={() => setActiveTab("MIRROR")}
                className={`flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  activeTab === "MIRROR" ? "bg-indigo-600 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                }`}
              >
                <List className="h-3.5 w-3.5 text-indigo-400" />
                Mirror Activity Ledger ({mirrorActivity.filter(a => a.status === "PENDING").length} active)
              </button>
            </>
          ) : executionMethod === "TELEGRAM_BRIDGE" ? (
            <>
              <button
                onClick={() => setActiveTab("TELEGRAM")}
                className={`flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  activeTab === "TELEGRAM" ? "bg-emerald-400 text-black font-black" : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                Telegram Listener Bot ({state.telegramAlerts?.length || 0})
              </button>

              <button
                onClick={() => setActiveTab("TELEGRAM_EA")}
                className={`flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  activeTab === "TELEGRAM_EA" ? "bg-emerald-400 text-black font-black" : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                }`}
              >
                <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                Telegram Copier EA Script Generator ⚡
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab("DIRECT_BROKER_SETTINGS")}
                className={`flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  activeTab === "DIRECT_BROKER_SETTINGS" ? "bg-amber-500 text-black font-black" : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-amber-500" />
                Broker Cloud Config
              </button>

              <button
                onClick={() => setActiveTab("DIRECT_BROKER_LOGS")}
                className={`flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                  activeTab === "DIRECT_BROKER_LOGS" ? "bg-amber-500 text-black font-black" : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-amber-500" />
                Execution Logs ({state.config.directBrokerLogs?.length || 0})
              </button>
            </>
          )}

          {executionMethod !== "DIRECT_BROKER" && (
            <button
              onClick={() => setActiveTab("GUIDE")}
              className={`flex items-center gap-1.5 py-2 px-4 text-xs font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${
                activeTab === "GUIDE" ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white hover:bg-zinc-900/30"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5 text-amber-500" />
              Integration Setup Guide
            </button>
          )}
        </div>

        <div className="text-[10px] font-mono text-zinc-500 uppercase flex items-center gap-1.5">
          <Activity className="h-3 w-3 text-emerald-400 animate-pulse" />
          <span>Active Pipeline: {executionMethod === "DIRECT" ? "Low-Latency Socket Stream" : executionMethod === "TELEGRAM_BRIDGE" ? "MQL5 Webhook Poller" : "Direct MT5 REST Web-Gateway"}</span>
        </div>
      </div>

      {isDevUrl && (
        <div className="rounded-xl border border-amber-955 bg-amber-950/10 p-5 text-left space-y-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold text-amber-400 uppercase tracking-wide">Development Workspace Sandbox Active</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            You are currently accessing your workspace in the **Development Environment** for real-time code iteration (<span className="font-mono text-amber-200 select-all">{window.location.origin}</span>).
            Your live systems and MT5 Expert Advisors **should be connected directly to the Production Environment** (<span className="font-mono text-emerald-400 select-all font-bold">{productionOrigin}</span>) to ensure physical trading synchronization, instead of being bound to this temporary scratchpad.
          </p>
          <div className="text-[11.5px] text-zinc-400 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-900 font-mono">
            💡 **Why didn't my trades execute on MT5?** 
            In the development sandbox, when no real Expert Advisor is actively polling this sandbox URL, the system fallback-simulates executions within 2 seconds. This registers them as filled inside 'Active Positions Holdings' on this tab *without* executing actual orders in your MT5 account. 
            To run live trade copying, configure your MT5 EA with the **Production Webapp URL** below and operate from the production preview:
            <div className="mt-2 text-sky-400 font-bold select-all flex items-center gap-2">
              <span>{productionOrigin}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Connections management */}
      {activeTab === "CONNECTIONS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-emerald-400" />
              Direct Broker Account Connection
            </span>

            {(state.mt5Config.connected || (state.mt5Config as any).connectionStatus === "RECONNECTING") && !isEditingConnection ? (
              <div className="space-y-4">
                <div className={`border rounded-xl p-4 text-left relative overflow-hidden transition-colors duration-305 ${
                  (state.mt5Config as any).connectionStatus === "RECONNECTING"
                    ? "bg-amber-950/10 border-amber-500/20"
                    : "bg-emerald-950/15 border-emerald-500/10"
                }`}>
                  {(state.mt5Config as any).connectionStatus === "RECONNECTING" ? (
                    <div className="absolute top-0 right-0 h-10 w-10 bg-amber-500/5 blur-xl rounded-full animate-pulse" />
                  ) : (
                    <div className="absolute top-0 right-0 h-10 w-10 bg-emerald-500/5 blur-xl rounded-full" />
                  )}
                  
                  {(state.mt5Config as any).connectionStatus === "RECONNECTING" ? (
                    <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest flex items-center gap-1.5 mb-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                      SYSTEM RECONNECTING...
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2">● LIVE FEED CONNECTION</span>
                  )}
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60 text-xs">
                      <span className="text-zinc-400">Trading Server</span>
                      <span className="font-mono text-white font-medium">{state.mt5Config.server}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60 text-xs">
                      <span className="text-zinc-400">Account Login ID</span>
                      <span className="font-mono text-white font-medium">{state.mt5Config.login}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400">EA Socket Stream</span>
                      {(state.mt5Config as any).connectionStatus === "RECONNECTING" ? (
                        <span className="font-mono text-amber-400 font-bold animate-pulse">RETRYING LINK...</span>
                      ) : (
                        <span className="font-mono text-emerald-400 font-bold">ONLINE (HTTPS Bridge)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingConnection(true);
                        setConnectFeedback("");
                      }}
                      className="flex-1 py-1.5 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 transition-colors rounded-lg font-sans text-xs font-bold text-zinc-300 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Settings className="h-3.5 w-3.5 text-zinc-400" />
                      Modify Settings
                    </button>
                    
                    <button
                      type="button"
                      disabled={disconnectLoading}
                      onClick={handleDisconnectBroker}
                      className="flex-1 py-1.5 px-3 bg-zinc-900/40 border border-rose-950 hover:bg-rose-950/20 text-rose-400 transition-colors rounded-lg font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-45"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                      {disconnectLoading ? "Closing..." : "Disconnect"}
                    </button>
                  </div>

                  {state.mt5Config.connected && (
                    <button
                      type="button"
                      onClick={handleSimulateInterruption}
                      className="w-full py-1.5 px-3 bg-amber-950/10 border border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-950/25 text-amber-400 transition-all rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="h-1 text-xs w-1 bg-amber-400 rounded-full animate-ping mr-1" />
                      Simulate Connection Interruption
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnectBroker} className="space-y-3.5">
                <div className="flex justify-between items-center bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900/60">
                  <div className="leading-tight">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Quick Preset</span>
                    <span className="text-[11px] text-zinc-300 font-bold block">Restore Default Demo Details</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      recordActivity();
                      setBrokerServer("MetaQuotes-Demo");
                      setBrokerLogin("50873114");
                      setBrokerPassword("BrokerPassword159");
                      setBrokerSuffix("");
                    }}
                    className="py-1 px-2.5 bg-gradient-to-r from-emerald-500/10 to-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/55 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    RESET TO DEFAULT DEMO ⚡
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">MT5 Broker Server</label>
                  <input
                    type="text"
                    placeholder="e.g. VantageGlobal-Demo"
                    value={brokerServer}
                    onChange={(e) => {
                      setBrokerServer(e.target.value);
                      recordActivity();
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden hover:border-zinc-700 focus:border-zinc-650"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Broker Login ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 84920211"
                    value={brokerLogin}
                    onChange={(e) => {
                      setBrokerLogin(e.target.value);
                      recordActivity();
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden hover:border-zinc-700 focus:border-zinc-650"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Trading Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={brokerPassword}
                    onChange={(e) => {
                      setBrokerPassword(e.target.value);
                      recordActivity();
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden hover:border-zinc-700 focus:border-zinc-650"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest block">Broker symbol Suffix</label>
                    <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider">(Requires Exness / XM)</span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. 'm' or '.micro' (empty if standard)"
                    value={brokerSuffix}
                    onChange={(e) => {
                      setBrokerSuffix(e.target.value);
                      recordActivity();
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 focus:outline-hidden hover:border-zinc-700 focus:border-zinc-650 font-mono"
                  />
                  <p className="text-[9px] text-zinc-500 mt-1 leading-relaxed">
                    * Maps standard assets (e.g. <b>EURUSD</b> matches <b>EURUSDm</b> on Exness or <b>EURUSD.micro</b> on XM).
                  </p>
                </div>

                <div className="flex gap-2">
                  {state.mt5Config.connected && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingConnection(false);
                        setBrokerServer(state.mt5Config.server || "");
                        setBrokerLogin(state.mt5Config.login || "");
                        setBrokerPassword(state.mt5Config.password || "");
                        setConnectFeedback("");
                      }}
                      className="flex-1 py-1.5 px-3 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-705 text-zinc-400 transition-colors rounded-lg font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={connectLoading || !brokerServer.trim() || !brokerLogin.trim()}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-550 disabled:opacity-40 transition-colors rounded-lg font-sans text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {connectLoading ? (
                      <span className="flex items-center gap-1.5 animate-pulse">
                        Connecting...
                      </span>
                    ) : (
                      <>
                        <Activity className="h-3.5 w-3.5" />
                        {state.mt5Config.connected ? "Update Connection" : "Connect & Couple"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {connectFeedback && (
              <p className={`text-[10px] leading-relaxed font-mono p-2.5 rounded border ${
                connectSuccess || connectFeedback.includes("Success")
                  ? "bg-emerald-950/20 text-emerald-400 border-emerald-500/10"
                  : "bg-zinc-900/40 text-zinc-400 border-zinc-850"
              }`}>
                {connectFeedback}
              </p>
            )}

            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900/60 justify-between text-[11px] font-sans">
              <span className="text-zinc-50/60">Connection Status:</span>
              <span className={`font-bold flex items-center gap-1 ${
                state.mt5Config.connected 
                  ? "text-emerald-400" 
                  : (state.mt5Config as any).connectionStatus === "RECONNECTING" 
                    ? "text-amber-400" 
                    : "text-amber-500"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  state.mt5Config.connected 
                    ? "bg-emerald-400 animate-pulse" 
                    : (state.mt5Config as any).connectionStatus === "RECONNECTING"
                      ? "bg-amber-400 animate-ping"
                      : "bg-amber-500"
                }`}></span>
                {state.mt5Config.connected 
                  ? "MT5 STREAM ONLINE" 
                  : (state.mt5Config as any).connectionStatus === "RECONNECTING"
                    ? "RECONNECTING..."
                    : "NOT COUPLED"
                }
              </span>
            </div>
          </div>

          <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
              Authorize MetaTrader Link (MQL5 EA)
            </span>

            <form onSubmit={handleCreateToken} className="space-y-3.5">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">Terminal VPS Name</label>
                <input
                  type="text"
                  placeholder="e.g. VPS NY4 Home"
                  value={newTerminalName}
                  onChange={(e) => setNewTerminalName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-hidden hover:border-zinc-700 focus:border-zinc-650"
                />
              </div>

              <button
                type="submit"
                disabled={creatingToken || !newTerminalName.trim()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-colors rounded-lg font-sans text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Generate API Token
              </button>
            </form>

            <div className="bg-zinc-900/30 rounded-lg p-3.5 border border-zinc-900/60 text-[10.5px] text-zinc-400 leading-relaxed font-sans mt-2">
              A dynamic, cryptographic poll token allows MQL5 Expert Advisor scripts residing inside MT5 to securely fetch mirror orders from your active dashboard without credentials exposure.
            </div>
          </div>

          {/* Telegram router status card */}
          <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4 text-left self-start">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Telegram Receiver Gateway
            </span>

            <div className="space-y-3 text-xs leading-relaxed text-left">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">Listener Thread</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                  state.config.telegramReceiverActive 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                }`}>
                  {state.config.telegramReceiverActive ? "Online" : "Offline"}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-zinc-400 font-sans text-[11px]">MT5 Auto-Mirror</span>
                <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase font-mono ${
                  state.config.telegramAutoMirror 
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" 
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                }`}>
                  {state.config.telegramAutoMirror ? "ENABLED" : "DISABLED"}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-zinc-900/40">
                <span className="text-zinc-500 font-sans text-[11px]">Source Channel</span>
                <span className="text-white font-mono text-[10.5px] truncate max-w-[150px]" title={state.config.telegramReceiverChatId}>
                  {state.config.telegramReceiverChatId || "Not set/fallback"}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveTab("TELEGRAM")}
                className="w-full py-2 bg-[#5B4CFF] hover:bg-[#4b3ce0] border border-[#5B4CFF] hover:border-[#4b3ce0] transition-colors rounded-lg font-sans text-xs font-bold text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                Configure & Test Receiver
              </button>
            </div>
          </div>

          {/* Simulated Terminal Status & Manual Reset (Safe Database controls) */}
          <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4 text-left self-start">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Terminal className="h-4 w-4 text-rose-500" />
              Terminal Sandbox Database Controls
            </span>

            <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans">
              This client-side simulation keeps a persistent local-database cache matching the active MT5 VPS instance.
              <strong> Auto-reset is fully disabled </strong> to preserve your custom parameters and records across updates.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm("Are you sure you want to manually flush and reset the simulated MT5 terminal database to baseline defaults?")) {
                    localStorage.removeItem("sim_terminalBalance");
                    localStorage.removeItem("sim_simulatedEaPositions");
                    localStorage.removeItem("sim_simulatedEaHistory");
                    localStorage.removeItem("sim_simulatedEaLogs");
                    localStorage.removeItem("sim_tgMessages");
                    setTerminalBalance(96303.64);
                    setSimulatedEaPositions([
                      { id: "109841", symbol: "BTCUSD", type: "SELL", volume: 0.50, entryPrice: 69195.00, sl: 70150.00, tp: 67100.05, highestTpReached: 0, pnl: -149.29, time: "13:00" }
                    ]);
                    setSimulatedEaHistory([
                      { id: "109745", symbol: "XAUUSD", type: "BUY", volume: 1.00, entryPrice: 2351.50, exitPrice: 2380.00, sl: 2335.00, tp: 2380.00, pnl: 2850.00, reason: "TP", time: "10:15" },
                      { id: "109712", symbol: "BTCUSD", type: "BUY", volume: 0.50, entryPrice: 69300.00, exitPrice: 69300.00, sl: 68600.00, tp: 71200.00, pnl: 0.00, reason: "TP_TRAIL_1_PULLBACK", time: "09:30" }
                    ]);
                    setSimulatedEaLogs([
                      "[Telegram EA] Bot connection established successfully.",
                      "[Telegram EA] Listening to webhook streams for authorized channels...",
                      "[Telegram EA] Channel filter validated: @QuantTerminal_Alerts is ALLOWED.",
                    ]);
                    setTgMessages([
                      { id: 1, sender: "QuantTerminal Alerts", text: "Channel created", isSystem: true, date: "October 22" },
                      { id: 2, sender: "QuantTerminal Alerts", text: "QuantTerminal Alerts bot compiled successfully in MetaTrader 5.", isSystem: true, date: "November 2" },
                      { id: 3, sender: "QuantTerminal Alerts", text: "SELL BTCUSD\nENTRY 69195\nSL: 70150\nTP: 67100", time: "13:00 Uhr" }
                    ]);
                    alert("Simulated MT5 Terminal database and connection cache successfully reset!");
                  }
                }}
                className={`w-full py-2 rounded-lg font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all border ${
                  theme === "light"
                    ? "bg-rose-50 hover:bg-rose-105 border-rose-200 hover:border-rose-300 text-rose-700 font-extrabold"
                    : "bg-rose-955/10 hover:bg-rose-955/25 border border-rose-900/50 hover:border-rose-900 text-rose-400"
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Manually Reset Terminal DB
              </button>
            </div>
          </div>

          {/* Automated MT5 Troubleshooter diagnostics section */}
          <div className="lg:col-span-2 rounded-xl border border-indigo-950/40 bg-zinc-950/50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  MT5 Terminal & Broker Synchronization Troubleshooter
                </span>
              </div>
              <button
                type="button"
                id="mt5-run-troubleshoot-btn"
                onClick={handleRunMT5Troubleshoot}
                disabled={runningMT5Troubleshoot}
                className="py-1 px-3 border border-indigo-300 dark:border-indigo-900/40 hover:border-indigo-600 dark:hover:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:text-indigo-900 dark:hover:text-white rounded text-[10px] bg-indigo-50 dark:bg-indigo-950/20 font-mono font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {runningMT5Troubleshoot ? "Analysing handshake..." : "Troubleshoot Connection Issues ⚡"}
              </button>
            </div>

            {mt5DiagnosticReport ? (
              <div className="space-y-4 text-xs font-sans text-left">
                {/* Diagnostics status and summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="p-3.5 bg-zinc-905 bg-zinc-900/30 border border-zinc-900 rounded-lg space-y-2">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block font-bold">Diagnosed Connection Settings:</span>
                    <div className="space-y-1 text-zinc-300 text-[11px]">
                      <div>• Current Broker Server: <span className="font-mono text-zinc-100 font-bold">{mt5DiagnosticReport.server || "None"}</span></div>
                      <div>• Account Login Key: <span className="font-mono text-zinc-100 font-bold">{mt5DiagnosticReport.login || "None"}</span></div>
                      <div>• Registered Suffix: <span className="font-mono text-emerald-400 font-bold">"{mt5DiagnosticReport.suffix || "None"}"</span></div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-indigo-950/10 border border-indigo-900/25 rounded-lg text-[11px] leading-relaxed text-zinc-300 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 block font-bold mb-1">Status Report:</span>
                      {mt5DiagnosticReport.checks?.some((c: any) => c.status === "FAIL") ? (
                        <span className="text-rose-450 text-rose-400 font-bold">⚠️ CRITICAL FAULT: Config mismatch detected. Outbound trades might be halted or discarded by your MT5 terminal. Check the repairs guide below.</span>
                      ) : mt5DiagnosticReport.checks?.some((c: any) => c.status === "WARN") ? (
                        <span className="text-amber-400 font-bold">⚡ ALERT: Config warning exists. Recommended action items should be completed to ensure Exness or XM maps standard trade quotes correctly.</span>
                      ) : (
                        <span className="text-emerald-400 font-bold">✓ HANDSHAKE OK: Connection configuration is fully matching. Terminal is optimized to synchronize manual and automated signal queues.</span>
                      )}
                    </div>
                    {mt5DiagnosticReport.checks?.some((c: any) => c.status === "FAIL" || c.status === "WARN") && (
                      <button
                        type="button"
                        id="mt5-autofix-btn"
                        onClick={handleAutoFixMT5}
                        disabled={fixingMT5}
                        className="mt-3.5 py-1.5 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white rounded text-[10.5px] font-mono font-bold transition-all disabled:opacity-50 cursor-pointer text-center w-full shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-98"
                      >
                        {fixingMT5 ? "Applying Auto-Repairs..." : "AUTO-FIX CONNECTION SETTINGS ⚡"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Checklist Results */}
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-401 text-zinc-450 font-bold uppercase tracking-wider block font-mono">Hands-on Diagnostic Checklist:</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px]">
                    {mt5DiagnosticReport.checks?.map((chk: any, idx: number) => (
                      <div key={idx} className={`p-2.5 rounded-lg border text-left flex items-start gap-2 ${
                        chk.status === "PASS" ? "bg-emerald-950/15 border-emerald-900/20 text-emerald-300" :
                        chk.status === "WARN" ? "bg-amber-950/10 border-amber-900/20 text-amber-300" :
                        "bg-rose-950/15 border-rose-900/20 text-rose-300"
                      }`}>
                        <span className="text-[12px] mt-0.5 leading-none">
                          {chk.status === "PASS" ? "✓" : chk.status === "WARN" ? "⚡" : "✗"}
                        </span>
                        <div>
                          <div className="font-bold text-white text-[11.5px] font-sans">{chk.name}</div>
                          <div className="text-[10px] text-zinc-400 mt-1 leading-normal font-sans">{chk.details}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Brand new End-to-End Handshake Signal Emulator */}
                <div className="p-4 bg-indigo-950/10 border border-indigo-900/35 rounded-lg space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-indigo-900/40 pb-2">
                    <div>
                      <span className="text-[10px] text-indigo-400 font-mono uppercase tracking-widest font-black block">End-to-End Execution & Sync Testing:</span>
                      <span className="text-zinc-200 font-bold text-xs">Verify live signal propagation and physical execution</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleRunSyncExecutionTest}
                      disabled={testingSyncExecution}
                      className="py-1.5 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-mono font-bold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
                    >
                      {testingSyncExecution ? "Tracing handshake..." : "RUN LIVE EXECUTION TEST ⚡"}
                    </button>
                  </div>

                  <p className="text-[10.5px] text-zinc-400 leading-relaxed">
                    Since client MT5 terminals run locally on your device, this test lets you verify whitelisting keys, maps standard symbol pairs, and emulates the Expert Advisor's request & transaction fill cycle back to this server.
                  </p>

                  {testSyncSteps && (
                    <div className="bg-black/40 border border-zinc-900 rounded p-3 space-y-1.5 font-mono text-[10.5px] text-left">
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold block mb-1 border-b border-zinc-900/60 pb-1">Real-Time Sync Engine Analyser Log:</span>
                      {testSyncSteps.map((step, sIdx) => {
                        const isError = step.toLowerCase().includes("error");
                        const isSuccess = step.toLowerCase().includes("success") || step.toLowerCase().includes("finalized") || step.toLowerCase().includes("confirmed") || step.toLowerCase().includes("verified");
                        const colorClass = isError ? "text-rose-400" : isSuccess ? "text-emerald-400 font-bold" : "text-zinc-350";
                        return (
                          <div key={sIdx} className={`${colorClass} leading-normal whitespace-pre-wrap`}>
                            {step}
                          </div>
                         );
                       })}
                     </div>
                   )}
                </div>

                {/* Specific suggestions list */}
                {mt5DiagnosticReport.suggestions?.length > 0 && (
                  <div className="p-4 bg-zinc-900/20 border border-zinc-900 rounded-lg space-y-2">
                    <span className="text-[10px] text-amber-400 font-mono uppercase tracking-widest font-black block">Actionable Action Plan (Auto-Repairs List):</span>
                    <ul className="space-y-1.5 list-none text-[11px] leading-relaxed text-zinc-350">
                      {mt5DiagnosticReport.suggestions.map((sug: any, index: number) => (
                        <li key={index} className="flex items-start gap-2 text-zinc-300">
                          <span className="text-amber-500 font-bold text-xs mt-0.5">•</span>
                          <span className="font-sans leading-normal">{sug}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Broker specific deployment procedures */}
                <div className="border-t border-zinc-900/50 pt-3">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mb-2">Supported Terminal Setup Steps:</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 bg-zinc-950/40 rounded border border-zinc-900/60 leading-normal">
                      <span className="text-[10px] font-bold text-white uppercase block mb-1">Exness Deployment</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Exness uses suffix <b>m</b> or <b>c</b> (Cent). Set <b>Broker Suffix</b> parameter to <b>m</b> (e.g. BTCUSD &rarr; BTCUSDm) so MT5 order routing successfully locates the asset.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-950/40 rounded border border-zinc-900/60 leading-normal">
                      <span className="text-[10px] font-bold text-white uppercase block mb-1">XM Group Deployment</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        XM Standard uses standard, and Micro uses suffix <b>.micro</b>. Specify <b>.micro</b> inside our settings form to map orders perfectly to your account contract specifications.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-950/40 rounded border border-zinc-900/60 leading-normal">
                      <span className="text-[10px] font-bold text-white uppercase block mb-1">MetaQuotes Demo</span>
                      <p className="text-[10px] text-zinc-400 leading-relaxed">
                        Great for zero-risk dry-run testing. No symbol suffixes are required. Ensure WebRequest whitelisting is active in terminal settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-500 text-xs">
                {runningMT5Troubleshoot ? (
                  <span className="animate-pulse">Analyzing broker, server headers, whitelisting rules, and suffix options...</span>
                ) : (
                  <span>Click "Troubleshoot Connection Issues ⚡" to scan MT5 coupling details and verify whitelisting status.</span>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
              Active Authorized Sockets Key List
            </span>

            {tokens.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">Awaiting client terminals authorization...</div>
            ) : (
              <div className="space-y-2.5">
                {tokens.map((tok) => (
                  <div key={tok.id} className="rounded-lg border border-zinc-905 bg-black/30 p-4 border border-zinc-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-mono text-xs">
                    <div className="space-y-1">
                      <span className="font-bold text-white block font-sans">{tok.terminalName}</span>
                      <div className="flex items-center gap-2 select-all text-[11px] text-zinc-400">
                        <Key className="h-3 w-3 text-emerald-400" />
                        <span>{tok.token}</span>
                      </div>
                      <span className="text-[9.5px] text-zinc-500 block leading-tight font-sans">
                        Generated on: {new Date(tok.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(tok.token);
                          setCopiedTokenId(tok.id);
                          setTimeout(() => setCopiedTokenId(null), 2000);
                        }}
                        className={`p-1 px-2.5 rounded border text-[10px] transition-all ${
                          copiedTokenId === tok.id
                            ? "bg-emerald-950/40 border-emerald-900 text-emerald-400 font-bold"
                            : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        {copiedTokenId === tok.id ? "Copied!" : "Copy Key"}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteToken(tok.id)}
                        className="p-1.5 rounded bg-zinc-900 hover:bg-rose-950/20 border border-zinc-800 text-rose-450 text-rose-400 hover:border-rose-900 inline-flex items-center"
                        title="Delete socket link"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Mirror queues list of activity */}
      {activeTab === "MIRROR" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Mirror action metrics left column layout wrapper */}
          <div className="lg:col-span-1 space-y-4 font-sans text-left">
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4 font-mono text-xs">
              <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2 font-sans">
                Sync Socket Terminal Parameters
              </span>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1.5">
                  <span className="text-zinc-505 text-zinc-500 font-sans">Mirror Active Queue</span>
                  <span className="text-sky-400 font-bold">{mirrorActivity.length} orders total</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1.5">
                  <span className="text-zinc-505 text-zinc-500 font-sans">Pending Transits</span>
                  <span className="text-amber-400 font-bold">{mirrorActivity.filter(a => a.status === "PENDING").length} waiting</span>
                </div>
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1.5">
                  <span className="text-zinc-505 text-zinc-500 font-sans">Target IP address</span>
                  <span className="text-zinc-300">HTTPS Mirror Gateway</span>
                </div>
                <div className="flex items-center justify-between pb-1.5">
                  <span className="text-zinc-505 text-zinc-500 font-sans">Broker Link Latency</span>
                  <span className="text-emerald-400 font-bold">4 ms (Simulated)</span>
                </div>
              </div>

              <div className="rounded-lg border border-zinc-900 bg-zinc-900/10 p-3 h-32 overflow-y-auto text-[9.5px] leading-relaxed text-zinc-500">
                <span className="text-[9px] uppercase font-bold text-zinc-400 block mb-1 font-sans">Direct Socket Logs</span>
                {state.mt5Config.logs.slice(0, 10).map((log, index) => (
                  <div key={index} className="mb-1 truncate">
                    - {log}
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Signal & Trade Injector */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/75 p-5 space-y-4 text-xs font-sans">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block border-b border-zinc-900 pb-2 font-sans">
                ⚡ Direct Signal Injector
              </span>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">
                Manually inject an instant SELL or BUY signal for a selected trading pair to test and verify your active MT5 Terminal websocket bridge pipeline immediately.
              </p>

              {injectFeedback && (
                <div className={`p-3 rounded-lg border text-[11px] leading-relaxed flex items-start gap-2 font-sans ${
                  injectFeedback.type === "success"
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 animate-pulse"
                    : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                }`}>
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{injectFeedback.message}</span>
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Trading Asset Classes</label>
                  <select
                    value={injectSymbol}
                    onChange={(e) => setInjectSymbol(e.target.value as SymbolType)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  >
                    {[
                      "EURUSD", "GBPUSD", "USDJPY", "AUDUSD",
                      "BTCUSD", "ETHUSD", "SOLUSD", "BNBUSD",
                      "AAPL", "TSLA", "MSFT", "NVDA",
                      "XAUUSD", "USOIL", "XAGUSD", "NGAS",
                      "SPX500", "NDX100", "DJI30", "GER40"
                    ].map((sym) => (
                      <option key={sym} value={sym} className="font-mono">
                        {sym}{state.config.directBrokerSuffix || state.mt5Config.brokerSuffix || ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2 font-sans">
                  <div>
                    <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Volume (Lots)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="10.0"
                      value={injectSize}
                      onChange={(e) => setInjectSize(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider font-semibold block mb-1">Signal Type</label>
                    <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800 h-[30px] items-center">
                      <button
                        type="button"
                        onClick={() => setInjectType("BUY")}
                        className={`flex-1 text-center py-1 rounded text-[10px] font-bold transition-all h-[24px] cursor-pointer ${
                          injectType === "BUY"
                            ? "bg-emerald-600 text-white font-black"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setInjectType("SELL")}
                        className={`flex-1 text-center py-1 rounded text-[10px] font-bold transition-all h-[24px] cursor-pointer ${
                          injectType === "SELL"
                            ? "bg-rose-600 text-white font-black"
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={injecting}
                  onClick={handleInjectSignal}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:opacity-40 text-white text-[11px] font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                >
                  {injecting ? (
                    <span className="h-3.5 w-3.5 border-2 border-indigo-200 border-t-transparent rounded-full animate-spin font-sans" />
                  ) : (
                    <Zap className="text-amber-400 fill-amber-400 h-3.5 w-3.5" />
                  )}
                  <span>{injecting ? "Injecting Live Signal..." : "Inject Live MT5 Signal"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mirror executions work-queue ledger */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
              Interactive Live Mirror Actions Work-Queue
            </span>

            {mirrorActivity.some(act => act.status === 'FAILED' && (act.details?.includes('10026') || act.details?.toLowerCase().includes('autotrading'))) && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl space-y-2.5 text-xs text-left animate-pulse">
                <div className="flex items-center gap-2 text-rose-400 font-bold">
                  <AlertTriangle className="h-4.5 w-4.5" />
                  <span>MetaTrader 5 Alert: AutoTrading Rejection (Error 10026) Detected</span>
                </div>
                <p className="text-zinc-350 leading-relaxed text-[11px]">
                  One or more copied trades failed on your MetaTrader terminal with the error: <strong className="text-white">"AutoTrading disabled by server (10026)"</strong>.
                </p>
                <div className="bg-zinc-950/60 p-3.5 rounded-lg border border-zinc-900 font-sans text-zinc-350 space-y-2 text-[10.5px]">
                  <div>⚠️ <strong className="text-rose-300">Solution 1 (Most Common):</strong> You logged into MT5 with the <strong className="text-white">Investor (read-only) Password</strong>. Logout of MT5 and log back in using your <strong className="text-white font-mono font-bold">Master (trading) Password</strong>.</div>
                  <div>⚠️ <strong className="text-rose-300 font-semibold font-sans">Solution 2:</strong> Algorithmic trading is disabled on your broker account tier. Open your broker portal settings (e.g. Exness, IC Markets client cabinet) and turn on Expert Advisor (Auto-Trading) permissions.</div>
                  <div>⚠️ <strong className="text-rose-300 font-semibold font-sans">Solution 3:</strong> The main "Algo Trading" button in the MT5 top toolbar is disabled (red icon). Click it to turn it green.</div>
                </div>
              </div>
            )}

            {mirrorActivity.length === 0 ? (
              <div className="text-center py-12 text-zinc-500 text-xs">No auto-trader actions mirrored to MT5 systems yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-mono text-xs">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 text-[10px] uppercase font-semibold">
                      <th className="py-2.5">Task ID</th>
                      <th className="py-2.5">Sync Action</th>
                      <th className="py-2.5">Symbol</th>
                      <th className="py-2.5">Order Type</th>
                      <th className="py-2.5">Size Lots</th>
                      <th className="py-2.5">Executed Targets</th>
                      <th className="py-2.5 text-right">Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900">
                    {mirrorActivity.map((act) => (
                      <tr key={act.id} className="hover:bg-zinc-900/10 transition-colors whitespace-nowrap">
                        <td className="py-3 text-zinc-500 font-bold truncate max-w-[80px]" title={act.id}>{act.id}</td>
                        <td className="py-3">
                          <span className={`inline-block font-bold text-[9px] px-1.5 rounded ${
                            act.action === "OPEN" ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                          }`}>
                            {act.action}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-white">{act.symbol}</td>
                        <td className="py-3 text-zinc-400">{act.type}</td>
                        <td className="py-3 text-zinc-300 font-bold">{act.size}</td>
                        <td className="py-3">
                          <div className="flex flex-col text-[10px] gap-0.5 leading-tight font-sans">
                            <div className="text-zinc-500">Entry: <span className="font-mono text-zinc-300 font-semibold">{act.entryPrice || "-"}</span></div>
                            <div className="text-zinc-500">SL: <span className="font-mono text-rose-450 font-semibold">{act.stopLoss || "-"}</span></div>
                            <div className="text-zinc-500">
                              {act.tp1 || act.tp2 || act.tp3 ? (
                                <span>
                                  TPs: <span className="font-mono text-emerald-400 font-bold">{act.tp1 || "-"}</span> | <span className="font-mono text-emerald-400 font-bold">{act.tp2 || "-"}</span> | <span className="font-mono text-emerald-400 font-bold">{act.tp3 || "-"}</span>
                                </span>
                              ) : (
                                <span>TP: <span className="font-mono text-emerald-400 font-bold">{act.takeProfit || "-"}</span></span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 text-right">
                          <span className={`inline-flex items-center gap-1 font-sans text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                            act.status === "DONE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" :
                            act.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/10 animate-pulse" :
                            "bg-rose-500/10 text-rose-450"
                          }`}>
                            {act.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Telegram To MT5 Receiver Module */}
      {activeTab === "TELEGRAM" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
          {/* Left Column: Config, Map, Webhook, and Simulator */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Sec 1: Live Sync Connection Pipeline Map */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/80 p-5 relative overflow-hidden shadow-lg">
              <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none" />
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider block font-sans">
                    Telegram To MT5 Connection pipeline
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-950/50 text-emerald-400 border border-emerald-900/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync listening
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 items-center justify-between gap-4 py-1 text-center font-sans text-xs">
                {/* Node 1: Telegram Channel */}
                <div className="rounded-xl bg-zinc-900/60 border border-zinc-850 p-3 space-y-1 relative">
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono font-bold">Inbound Channel</div>
                  <div className="font-sans font-black text-[11px] text-white truncate max-w-[120px] mx-auto">
                    {receiverChatId || "VIP Signal Group"}
                  </div>
                  <div className="text-[10px] text-zinc-450 flex items-center justify-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5 text-sky-400" />
                    <span>Telegram Listener</span>
                  </div>
                </div>

                {/* Arrow 1 */}
                <div className="hidden md:flex flex-col items-center justify-center shrink-0">
                  <div className="flex items-center text-zinc-700 font-mono text-[10px]">
                    <span className="tracking-tighter">━━━━</span>
                    <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse mx-0.5" />
                    <span className="tracking-tighter">❯</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400/80 uppercase">AI parsing</span>
                </div>

                {/* Node 2: Quant AI Parser Bot */}
                <div className={`rounded-xl p-3 space-y-1 border ${botToken && botToken.includes(":") ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-400" : "bg-zinc-900/60 border-zinc-850 text-zinc-500"}`}>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono font-bold">Parser Engine</div>
                  <div className="font-sans font-black text-[11px] text-white truncate max-w-[120px] mx-auto">
                    {botToken && botToken.includes(":") ? "Active Quant Bot" : "Token Missing"}
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Rules & Risk Guard</span>
                  </div>
                </div>

                {/* Arrow 2 */}
                <div className="hidden md:flex flex-col items-center justify-center shrink-0">
                  <div className="flex items-center text-zinc-700 font-mono text-[10px]">
                    <span className="tracking-tighter">━━━━</span>
                    <Zap className="h-3.5 w-3.5 text-emerald-400 animate-pulse mx-0.5" />
                    <span className="tracking-tighter">❯</span>
                  </div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400/80 uppercase">instant sync</span>
                </div>

                {/* Node 3: MetaTrader 5 Expert Advisor */}
                <div className={`rounded-xl p-3 space-y-1 border ${diagnosticReport?.mt5Connected ? "bg-emerald-950/20 border-emerald-500/30" : "bg-zinc-900/60 border-zinc-850"}`}>
                  <div className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono font-bold">MT5 Executor</div>
                  <div className="font-sans font-black text-[11px] text-white truncate max-w-[120px] mx-auto">
                    {state.mt5Config.login || "Terminal EA Link"}
                  </div>
                  <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">
                    <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                    <span className={diagnosticReport?.mt5Connected ? "text-emerald-400 font-black uppercase text-[9.5px]" : "text-zinc-500 font-semibold"}>
                      {diagnosticReport?.mt5Connected ? "MT5 Active" : "Waiting link"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sec 2: Redesigned 3-Step Simple Connector Guide */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-5">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Settings className="h-4 w-4 text-emerald-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider block font-sans">
                  3-Step simple connector guide
                </span>
              </div>

              <form onSubmit={handleSaveReceiverSettings} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                  
                  {/* Step 1: Create Bot */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-5.5 w-5.5 rounded-full bg-zinc-900 text-[10px] font-black font-mono flex items-center justify-center border border-zinc-800 text-emerald-400">
                        01
                      </span>
                      <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                        Connect Bot Listener
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Search <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-sky-400 hover:underline font-bold">@BotFather</a> in Telegram, create a Bot, and paste the HTTP API Token below:
                    </p>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="e.g. 62849102:AAF9024..."
                        value={botToken}
                        onChange={(e) => {
                          setBotToken(e.target.value);
                          recordActivity();
                        }}
                        className="w-full bg-zinc-900 border border-zinc-805 rounded px-3 py-2 text-xs text-white focus:outline-hidden hover:border-zinc-700 pr-8 font-mono"
                      />
                    </div>
                    <div className="text-[9.5px] text-zinc-500 font-mono italic flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
                      <span>Never share your Bot API Token!</span>
                    </div>
                  </div>

                  {/* Step 2: Set Channel ID */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-5.5 w-5.5 rounded-full bg-zinc-900 text-[10px] font-black font-mono flex items-center justify-center border border-zinc-800 text-emerald-400">
                        02
                      </span>
                      <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                        Bind Telegram Chat ID
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Add your Bot as an <span className="text-emerald-400 font-bold">Administrator</span> in your VIP group or channel, and paste the Channel Handle / ID:
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. @MyVIPChannel or -1002049102"
                      value={receiverChatId}
                      onChange={(e) => {
                        setReceiverChatId(e.target.value);
                        recordActivity();
                      }}
                      className="w-full bg-zinc-900 border border-zinc-805 rounded px-3 py-2 text-xs text-white focus:outline-hidden hover:border-zinc-700 font-mono"
                    />
                    <div className="text-[9.5px] text-zinc-500 font-mono italic flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      <span>Ensure "Post Messages" is granted.</span>
                    </div>
                  </div>

                  {/* Step 3: Enable Mirroring */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2">
                      <span className="h-5.5 w-5.5 rounded-full bg-zinc-900 text-[10px] font-black font-mono flex items-center justify-center border border-zinc-800 text-emerald-400">
                        03
                      </span>
                      <span className="text-[11px] font-bold text-zinc-200 uppercase tracking-wider">
                        Activate Automation
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Configure active listening and automatic order routing. Safe-filters protect capital in high-volatility events.
                    </p>
                    
                    <div className="space-y-2.5 pt-1 text-left">
                      <label className="flex items-center gap-3 text-xs text-zinc-300 font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={receiverActive}
                          onChange={(e) => {
                            setReceiverActive(e.target.checked);
                            recordActivity();
                          }}
                          className="rounded border-zinc-805 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                        <span>Active Bot Listening</span>
                      </label>

                      <label className="flex items-center gap-3 text-xs text-zinc-300 font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={autoMirror}
                          onChange={(e) => {
                            setAutoMirror(e.target.checked);
                            recordActivity();
                          }}
                          className="rounded border-zinc-805 bg-zinc-900 text-emerald-500 focus:ring-0 cursor-pointer h-4 w-4"
                        />
                        <span>Auto-Mirror Copy to MT5</span>
                      </label>
                    </div>
                  </div>

                </div>

                {/* Action panel footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 border-t border-zinc-900 bg-zinc-900/10 px-4 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10.5px] text-zinc-400 font-mono">
                      {postingFeedback ? postingFeedback : "Connection configuration is saved to cloud profile instantly."}
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="py-2 px-5 bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-500 text-white font-sans text-xs font-bold rounded-lg transition-all shadow-md cursor-pointer shrink-0 select-none active:scale-95"
                  >
                    Save & Bind Connection ⚡
                  </button>
                </div>
              </form>
            </div>

            {/* Sec 3: Active Webhook allowlist URLs */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-sky-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider block font-sans">
                    Active Gateway Connection Endpoints
                  </span>
                </div>
                <span className="text-[9.5px] font-mono text-zinc-550 uppercase tracking-widest text-zinc-500">Secure Web API Gateway</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Endpoint 1: Webhook receiver */}
                <div className="bg-zinc-900/40 p-3.5 border border-zinc-900 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-sky-400">Telegram Webhook Endpoint</span>
                    <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-450 font-mono">POST</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-normal">
                    Optionally route external signal alerts, TradingView, or Python scripts to this parser address:
                  </p>
                  <div className="bg-zinc-950 border border-zinc-850 p-2 rounded-lg flex items-center justify-between gap-2">
                    <code className="text-emerald-400 font-mono text-[9.5px] break-all select-all truncate flex-1">{productionOrigin}/api/telegram/receiver/post</code>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(`${productionOrigin}/api/telegram/receiver/post`);
                        setPostingFeedback("Copied Webhook URL!");
                        setTimeout(() => setPostingFeedback(""), 3000);
                      }}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9.5px] rounded border border-zinc-800 shrink-0 font-bold uppercase cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                {/* Endpoint 2: MT5 Allowlist URL */}
                <div className="bg-zinc-900/40 p-3.5 border border-zinc-900 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase text-emerald-400">MT5 WebRequest Allowlist URL</span>
                    <span className="text-[8.5px] px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-450 font-mono">ALLOW</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400 leading-normal">
                    This exact base domain must be white-listed inside your MetaTrader 5 terminal WebRequest list:
                  </p>
                  <div className="bg-zinc-950 border border-zinc-850 p-2 rounded-lg flex items-center justify-between gap-2">
                    <code className="text-emerald-400 font-mono text-[9.5px] break-all select-all truncate flex-1">{productionOrigin}</code>
                    <button
                      type="button"
                      onClick={handleCopyUrl}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9.5px] rounded border border-zinc-800 shrink-0 font-bold uppercase cursor-pointer"
                    >
                      {copiedUrl ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sec 4: Interactive Signal Console & Parsing Auditor (Sandbox Testing) */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-sky-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider block font-sans">
                    Interactive Signal Console & Parsing Auditor
                  </span>
                </div>
                
                {/* Presets load */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-mono">Sandbox Presets:</span>
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate("GOLD")}
                    className="p-1 px-2 border border-zinc-800 hover:border-zinc-700 rounded text-[9.5px] bg-zinc-900 text-zinc-300 font-bold hover:text-white cursor-pointer select-none active:scale-95 transition-all"
                  >
                    Forex GOLD VIP 👑
                  </button>
                  <button
                    type="button"
                    onClick={() => handleLoadTemplate("BTC")}
                    className="p-1 px-2 border border-zinc-800 hover:border-zinc-700 rounded text-[9.5px] bg-zinc-900 text-zinc-300 font-bold hover:text-white cursor-pointer select-none active:scale-95 transition-all"
                  >
                    Crypto BTC Sell 🚀
                  </button>
                </div>
              </div>

              <div className="space-y-4 text-xs font-sans">
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Write or choose a high-confidence signal preset above to simulate how the AI listener processes text, extracts key order parameters, and pushes trades to the MetaTrader queue instantly!
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left block: simulated chat id alias */}
                  <div className="md:col-span-1 space-y-2 text-left">
                    <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Incoming Channel Sender</label>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        value={simulatedChatIdInput}
                        onChange={(e) => {
                          setSimulatedChatIdInput(e.target.value);
                          setSaveAliasSuccess(false);
                        }}
                        className="flex-1 bg-zinc-900 border border-zinc-805 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-650 font-mono"
                        placeholder="@ChannelName"
                      />
                      <button
                        type="button"
                        onClick={async () => {
                          localStorage.setItem("simulatedChatIdInput", simulatedChatIdInput);
                          await onUpdateConfig({ telegramReceiverChatId: simulatedChatIdInput });
                          setSaveAliasSuccess(true);
                          setTimeout(() => setSaveAliasSuccess(false), 2500);
                        }}
                        className="py-1 px-2.5 bg-zinc-800 hover:bg-zinc-700 text-white text-[10.5px] rounded transition-all select-none cursor-pointer font-bold border border-zinc-750"
                      >
                        {saveAliasSuccess ? "Saved ✓" : "Save"}
                      </button>
                    </div>
                    <div className="text-[10px] text-zinc-500 leading-normal italic mt-1 bg-zinc-900/10 p-2 rounded border border-zinc-900/30">
                      Simulate incoming webhook signals directly as if received from your real Telegram channels.
                    </div>
                  </div>

                  {/* Right block: simulated signal text */}
                  <div className="md:col-span-2 space-y-2 text-left">
                    <label className="text-[9.5px] text-zinc-500 uppercase tracking-wider block font-mono font-bold">Raw Text Message Body</label>
                    <textarea
                      rows={4}
                      value={simulatedMessage}
                      onChange={(e) => setSimulatedMessage(e.target.value)}
                      className="w-full bg-zinc-900 font-mono text-[11px] leading-relaxed border border-zinc-805 rounded p-3 text-zinc-200 focus:outline-hidden hover:border-zinc-700 hover:bg-zinc-900/80 focus:bg-zinc-950 transition-all shadow-inner"
                      placeholder="e.g. BUY EURUSD at 1.0855 SL 1.0805 TP 1.0955..."
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
                  <button
                    type="button"
                    onClick={handleParseAndTest}
                    disabled={parsingLoading || !simulatedMessage.trim()}
                    className="flex items-center gap-2 py-2 px-4.5 bg-gradient-to-r from-sky-600 to-indigo-650 hover:from-sky-500 hover:to-indigo-500 disabled:opacity-40 transition-all rounded text-xs font-bold text-white cursor-pointer shadow-md select-none active:scale-95"
                  >
                    <Activity className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    {parsingLoading ? "Validating & Mirroring..." : "Parse & Post Incoming Signal"}
                  </button>

                  {postingFeedback && (
                    <span className="text-xs font-semibold text-emerald-400 font-mono pl-3 animate-pulse">{postingFeedback}</span>
                  )}
                </div>

                {/* Parsed Signal Parameters card visualization */}
                {parsedData && (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-inner overflow-hidden text-left mt-3">
                    {/* Header */}
                    <div className="bg-zinc-900 px-3.5 py-2 border-b border-zinc-850 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-zinc-300 font-mono">
                        <Terminal className="h-3.5 w-3.5 text-sky-400" />
                        <span>AI Signal Decoder Terminal Auditor</span>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        parsedData.valid ? "bg-emerald-950/80 text-emerald-400 border border-emerald-500/20" : "bg-rose-950/80 text-rose-400 border border-rose-500/20"
                      }`}>
                        {parsedData.valid ? "✓ VALID ALIGNMENT" : "⚠ ADAPTIVE TELEMETRY ONLY"}
                      </span>
                    </div>

                    <div className="p-4 space-y-4 font-sans text-xs">
                      {/* Grid parameters layout */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                        <div className="bg-zinc-900/30 p-2.5 rounded border border-zinc-900/60">
                          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Trading Pair</span>
                          <span className="font-extrabold text-white text-[13px]">{parsedData.symbol || "N/A"}</span>
                        </div>
                        <div className="bg-zinc-900/30 p-2.5 rounded border border-zinc-900/60">
                          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Execution Type</span>
                          <span className={`font-black text-[13px] uppercase ${parsedData.type === "BUY" ? "text-emerald-400" : parsedData.type === "SELL" ? "text-rose-400" : "text-zinc-400"}`}>
                            {parsedData.type || "N/A"}
                          </span>
                        </div>
                        <div className="bg-zinc-900/30 p-2.5 rounded border border-zinc-900/60">
                          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Price Sourced</span>
                          <span className="font-extrabold text-white text-[13px]">${parsedData.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 5 }) || "N/A"}</span>
                        </div>
                        <div className="bg-zinc-900/30 p-2.5 rounded border border-zinc-900/60">
                          <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-bold">Extracted Limits</span>
                          <span className="font-bold text-zinc-300 text-[11px] block mt-0.5">
                            {parsedData.stopLoss ? `SL: ${parsedData.stopLoss}` : "SL: Auto-Managed"}
                          </span>
                          <span className="font-bold text-zinc-300 text-[11px] block">
                            {parsedData.takeProfit ? `TP: ${parsedData.takeProfit}` : "TP: Auto-Managed"}
                          </span>
                        </div>
                      </div>

                      {/* Manual dispatcher warning */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-900/30 p-3 rounded-lg border border-zinc-850 text-xs">
                        <div className="text-[11px] text-zinc-400">
                          Decoded Strategy Link: <span className="font-bold text-sky-400">{parsedData.strategyName}</span>
                        </div>

                        {parsedData.valid && !autoMirror && (
                          <button
                            type="button"
                            onClick={handleManualPush}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-555 rounded-md text-[10.5px] text-white font-bold cursor-pointer shadow transition-all active:scale-95"
                          >
                            Push Trade Tasks Manually
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sec 5: Outbound publisher channel tester */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <Send className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider block font-sans">
                    Outbound VIP Channel Signal Publisher
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-indigo-400 border border-indigo-900/30 bg-indigo-950/40 px-1.5 py-0.5 rounded uppercase tracking-wider">
                  Outbound Feed
                </span>
              </div>

              <div className="space-y-4 font-sans text-xs">
                <p className="text-zinc-400 leading-relaxed text-[11px]">
                  Send notifications, automated AI alerts, or risk adjustments outbound to your users' chat channels. Type a notification message and send a test broadcast:
                </p>

                {/* Simulated / Custom Test Signal Payload */}
                <div className="space-y-2.5 text-left">
                  <textarea
                    rows={2}
                    value={testSignalMsg}
                    onChange={(e) => setTestSignalMsg(e.target.value)}
                    className="w-full bg-zinc-900 font-mono text-[11px] leading-relaxed border border-zinc-805 rounded p-3 text-zinc-300 focus:outline-hidden hover:border-zinc-700"
                    placeholder="Write custom message or signal broadcast..."
                  />
                </div>

                {/* Publish Testing button action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-zinc-900 pt-3">
                  <div className="text-[10.5px] text-zinc-500 font-mono">
                    Target Broadcast Channel: <span className="font-bold text-zinc-300">{receiverChatId || "@YourChannelID"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestPublish}
                    disabled={testingPublish || !botToken}
                    className="flex items-center justify-center gap-1.5 py-2 px-4 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 transition-colors rounded text-xs font-bold text-white cursor-pointer shadow select-none border border-zinc-800"
                  >
                    {testingPublish ? "Broadcasting Outbound..." : "Publish Test Alert 🚀"}
                  </button>
                </div>

                {/* Outbound Feedback panel */}
                {publishTestFeedback && (
                  <div className={`p-4 rounded-lg border text-left ${
                    publishTestFeedback.success 
                      ? "bg-emerald-950/30 border-emerald-950/50 text-emerald-400" 
                      : "bg-rose-950/35 border-rose-955/40 text-rose-300"
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold uppercase text-[10.5px] tracking-wide block">
                        {publishTestFeedback.success ? "✓ Broadcast Succeeded" : "💡 Delivery Handshake Fault"}
                      </span>
                    </div>
                    <p className="text-[11px] leading-relaxed text-zinc-300 whitespace-pre-line">
                      {publishTestFeedback.msg}
                    </p>
                    
                    {publishTestFeedback.suggestions && publishTestFeedback.suggestions.length > 0 && (
                      <div className="mt-3.5 space-y-1.5 border-t border-rose-900/20 pt-2.5">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block tracking-wider">Troubleshooting checklist:</span>
                        <ul className="list-disc list-inside space-y-1 text-[10.5px] text-rose-300/80">
                          {publishTestFeedback.suggestions.map((s: string, idx: number) => (
                            <li key={idx} className="leading-snug">{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Right Column: Signal Stream Feed & Diagnostics */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Troubleshooter Suite */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4 text-left shadow-lg">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-400 animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider block font-sans">
                    Gateway Diagnostics
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleRunTroubleshoot}
                  disabled={runningTroubleshoot}
                  className="py-1 px-2.5 border border-zinc-800 hover:border-zinc-700 hover:text-white rounded text-[10px] bg-zinc-900 text-zinc-300 font-mono transition-all disabled:opacity-50 cursor-pointer"
                >
                  {runningTroubleshoot ? "Refreshing..." : "Re-Run ✓"}
                </button>
              </div>

              {diagnosticReport ? (
                <div className="space-y-4">
                  {/* Master status indicator */}
                  <div className={`p-3 rounded-lg border flex items-start gap-3 ${
                    diagnosticReport.canTradeNow 
                      ? "bg-emerald-950/25 border-emerald-900/30 text-emerald-400" 
                      : "bg-rose-950/25 border-rose-900/30 text-rose-450"
                  }`}>
                    <div className="mt-0.5">
                      {diagnosticReport.canTradeNow ? (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      ) : (
                        <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-sans font-bold text-xs uppercase tracking-wider">
                        {diagnosticReport.canTradeNow ? "All Gates Open - Ready" : "Signal Routing Blocked"}
                      </h4>
                      <p className="text-[10.5px] text-zinc-400 mt-1 leading-relaxed">
                        {diagnosticReport.canTradeNow 
                          ? "Gateway listening active. Incoming Telegram updates are parsed & enqueued to MT5 client instantly."
                          : "Trade validation checks did not pass. Check high-risk calendar blocks or status below."}
                      </p>
                    </div>
                  </div>

                  {/* Diagnosed metrics checkboxes */}
                  <div className="space-y-2.5 text-xs font-mono">
                    
                    {/* Item 1: Webhook Listener */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-900">
                      <span className="text-zinc-400 text-[10px]">Listener Active</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        diagnosticReport.telegramReceiverActive ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                      }`}>
                        {diagnosticReport.telegramReceiverActive ? "ACTIVE" : "MUTED"}
                      </span>
                    </div>

                    {/* Item 2: MT5 Bridge Status */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-900">
                      <span className="text-zinc-400 text-[10px]">MT5 Terminal Link</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        diagnosticReport.mt5Connected ? "bg-emerald-950 text-emerald-400" : "bg-amber-950 text-amber-400"
                      }`}>
                        {diagnosticReport.mt5Connected ? "ONLINE" : "WAITING EA"}
                      </span>
                    </div>

                    {/* Item 3: Bot API Configuration */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-900">
                      <span className="text-zinc-400 text-[10px]">Bot Token Configured</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        diagnosticReport.botTokenConfigured ? "bg-emerald-950 text-emerald-400" : "bg-rose-950 text-rose-400"
                      }`}>
                        {diagnosticReport.botTokenConfigured ? "VALID" : "MISSING"}
                      </span>
                    </div>

                    {/* Item 4: News calendar filter */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-zinc-900/30 border border-zinc-900">
                      <span className="text-zinc-400 text-[10px]">News Volatility Lock</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                        diagnosticReport.activeNewsBlock ? "bg-rose-950 text-rose-400" : "bg-emerald-950 text-emerald-400"
                      }`}>
                        {diagnosticReport.activeNewsBlock ? "LOCKED" : "PASSING SAFE"}
                      </span>
                    </div>

                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-zinc-500 font-mono">
                  Diagnostics report stale. Click "Re-Run" above to audit system health checks.
                </div>
              )}
            </div>

            {/* Signal Stream Feed */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
                Audited Signal History Logs
              </span>

              <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                {state.telegramAlerts && state.telegramAlerts.length > 0 ? (
                  state.telegramAlerts.map((alert) => {
                    return (
                      <div key={alert.id} className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-3.5 space-y-2.5 text-xs text-left hover:border-zinc-800 transition-all">
                        <div className="flex items-center justify-between text-[10px] text-zinc-500 border-b border-zinc-900 pb-1.5">
                          <span className="font-bold text-zinc-350 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3 text-sky-400" />
                            {alert.chatId}
                          </span>
                          <span>{new Date(alert.time).toLocaleTimeString()}</span>
                        </div>

                        <pre className="font-mono text-zinc-300 whitespace-pre-line text-[11px] leading-relaxed bg-zinc-900/30 p-2.5 rounded border border-zinc-900/60 break-all select-all font-semibold">
                          {alert.message}
                        </pre>

                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="flex items-center gap-1 text-emerald-400 font-extrabold uppercase font-mono text-[9px]">
                            <Check className="h-3 w-3 text-emerald-400 font-black" />
                            Parsed & Copied to MT5
                          </span>
                          <span className="text-zinc-500 font-mono bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-850">
                            {alert.id}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-zinc-500 font-mono text-xs border border-dashed border-zinc-900 rounded-xl">
                    No received signals recorded yet. Presets can simulate inputs to populate live streams.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tab 3.5: Telegram Direct Copier Pro EA Mockup */}
      {activeTab === "TELEGRAM_EA" && (
        <div className="space-y-6">
          {/* Header Description block */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-left">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-sky-400 uppercase tracking-widest font-mono">Quantum Specialized Modules</span>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide">Telegram To MT5 Pro Copier EA Terminal v4.00</h4>
              <p className="text-xs text-zinc-400 max-w-2xl leading-normal">
                This dedicated MT5 Expert Advisor runs natively inside your MetaTrader terminal. It connects directly to your Telegram bot via webhook, bypassing third-party servers. Manage risk, symbol naming conventions, filter lists, and our signature multi-target trailing safety locking rules.
              </p>
            </div>
            <button
              onClick={handleCopyTelegramCopierCode}
              className="flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-sky-600 to-indigo-650 hover:from-sky-550 hover:to-indigo-550 text-white font-bold text-xs rounded-lg transition-all shadow-md shrink-0 cursor-pointer self-start md:self-center select-none"
            >
              <Code className="h-4 w-4" />
              {copiedTgCode ? "PRO CODE COPIED!" : "COPY EXPERT CODE (MQ5)"}
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1 & 2: Interactive MT5 Window Simulation */}
            <div className="lg:col-span-2 space-y-5">
              
              {/* Simulated MT5 Chart Frame Container */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl relative overflow-hidden flex flex-col h-[560px]">
                
                {/* MT5 Terminal Title Bar */}
                <div className="bg-zinc-900 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-zinc-400 select-none text-[10.5px]">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping mr-1" />
                    <span className="font-bold text-white">MetaTrader 5 Client Terminal</span>
                    <span className="text-zinc-500">|</span>
                    <span className="text-[10px] font-mono">[Connected to: {brokerServer} - 1:500]</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-mono">Live Price Sourced: BTCUSD</span>
                    <div className="flex items-center gap-1">
                      <div className="w-2.5 h-2.5 border border-zinc-650 rounded-xs flex items-center justify-center text-[7px]">_</div>
                      <div className="w-2.5 h-2.5 border border-zinc-650 rounded-xs flex items-center justify-center text-[7px]">□</div>
                      <div className="w-2.5 h-2.5 border border-zinc-650 rounded-xs flex items-center justify-center text-[7px] bg-rose-900/50 hover:bg-rose-600">X</div>
                    </div>
                  </div>
                </div>

                {/* Main Content Pane: Chart & Floating EA overlay */}
                <div className="flex-1 relative bg-black flex flex-col justify-between overflow-hidden">
                  
                  {/* Grid background backing for trading chart */}
                  <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{
                    backgroundImage: 'radial-gradient(ellipse at center, #ffffff 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                  }} />

                  {/* Chart Header Bar */}
                  <div className="bg-zinc-950/90 border-b border-zinc-900 px-3 py-2 flex items-center justify-between z-10 text-xs">
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-zinc-150">BTCUSD, M15</span>
                      <div className="flex gap-1">
                        {["M1", "M5", "M15", "H1", "H4", "D1"].map((tf) => (
                          <span key={tf} className={`px-1.5 py-0.5 rounded text-[9.5px] font-bold cursor-pointer transition-colors ${
                            tf === "M15" ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-transparent text-zinc-500 hover:text-zinc-300"
                          }`}>{tf}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-zinc-400 font-mono text-[10.5px]">
                      <span>Open: <span className="text-zinc-300">69,450.50</span></span>
                      <span>High: <span className="text-emerald-400">69,630.00</span></span>
                      <span>Low: <span className="text-rose-400">69,120.00</span></span>
                      <span className="font-sans text-[11px] font-bold text-emerald-400 pl-1">
                        Bid: ${terminalBtcusdPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Floating EA Dialogue Overlay Window */}
                  <div className="absolute top-12 left-4 w-[420px] max-w-full bg-zinc-950/95 border border-zinc-800 rounded-lg shadow-2xl z-20 overflow-hidden flex flex-col text-left font-sans select-none">
                    
                    {/* EA Header bar */}
                    <div className="bg-zinc-900 border-b border-zinc-850 px-3.5 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Terminal className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-black text-white tracking-wider flex items-center gap-1.5">
                          TELEGRAM COPIER PRO
                          <span className="text-[10px] font-mono text-zinc-500 lowercase bg-zinc-950 px-1 py-0.5 rounded font-normal leading-none border border-zinc-900">v4.00</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${eaEnabled ? "bg-emerald-400 shadow-emerald-500/30 shadow-md animate-pulse" : "bg-rose-500 animate-none"}`} />
                        <span className="text-[10px] uppercase font-bold text-zinc-450 text-zinc-500">{eaEnabled ? "Enabled" : "Disabled"}</span>
                      </div>
                    </div>

                    {/* EA Inner Navigation Sub-tabs */}
                    <div className="flex border-b border-zinc-900 bg-zinc-900/40 p-1 gap-1 text-[10px]">
                      {(["SETUP", "MANAGE", "SIGNAL", "COPY", "TIME"] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setEaSubTab(tab)}
                          className={`flex-1 py-1 font-bold rounded hover:text-white transition-all uppercase tracking-wider ${
                            eaSubTab === tab ? "bg-zinc-800 text-white shadow-xs" : "text-zinc-500 hover:bg-zinc-900/40"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* EA Tab Contents */}
                    <div className="p-4 space-y-4 text-xs">
                      
                      {/* Sub-tab 1: SETUP controls */}
                      {eaSubTab === "SETUP" && (
                        <div className="space-y-3.5">
                          {/* Risk Surcharge configuration */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9.5px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Risk Type Allocation</label>
                              <select
                                value={eaRiskType}
                                onChange={(e) => setEaRiskType(e.target.value)}
                                className="w-full bg-zinc-900 text-white font-bold border border-zinc-800 rounded px-2 py-1.5 focus:outline-hidden text-xs cursor-pointer select-none"
                              >
                                <option>Risk (%)</option>
                                <option>Fixed Lots</option>
                                <option>Balance (%)</option>
                                <option>Equity (%)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[9.5px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">
                                {eaRiskType === "Fixed Lots" ? "Fixed Volume Lots" : "Risk Percent (%)"}
                              </label>
                              <input
                                type="number"
                                step={eaRiskType === "Fixed Lots" ? 0.01 : 0.5}
                                value={eaRiskValue}
                                onChange={(e) => setEaRiskValue(Math.max(0.01, parseFloat(e.target.value) || 1))}
                                className="w-full bg-zinc-900 text-white font-mono font-bold border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-hidden text-xs"
                              />
                            </div>
                          </div>

                          {/* Suffix / Prefix overrides */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9.5px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Symbol Prefix</label>
                              <input
                                type="text"
                                placeholder="eg. PRO_ (empty default)"
                                value={eaPrefix}
                                onChange={(e) => setEaPrefix(e.target.value)}
                                className="w-full bg-zinc-900 text-zinc-300 font-mono border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-hidden text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[9.5px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Symbol Suffix</label>
                              <input
                                type="text"
                                placeholder="eg. .m or .pro"
                                value={eaSuffix}
                                onChange={(e) => setEaSuffix(e.target.value)}
                                className="w-full bg-zinc-900 text-zinc-300 font-mono border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-hidden text-xs"
                              />
                            </div>
                          </div>

                          {/* Trade Management Mode and Notifications */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[9.5px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Trade Management Mode</label>
                              <select
                                value={eaManagementMode}
                                onChange={(e) => setEaManagementMode(e.target.value)}
                                className="w-full bg-zinc-900 text-white font-bold border border-zinc-800 rounded px-2 py-1.5 focus:outline-hidden text-xs cursor-pointer"
                              >
                                <option value="Both">Both (Manual & Auto)</option>
                                <option value="Automation Only">Automation Only</option>
                                <option value="Manual Only">Manual Only</option>
                              </select>
                            </div>
                            <div className="flex flex-col justify-end">
                              <label className="flex items-center gap-2 text-zinc-300 font-bold cursor-pointer py-2">
                                <input
                                  type="checkbox"
                                  checked={eaSendNotifications}
                                  onChange={(e) => setEaSendNotifications(e.target.checked)}
                                  className="rounded border-zinc-800 bg-zinc-900 text-emerald-500 focus:ring-0 h-3.5 w-3.5 cursor-pointer"
                                />
                                Alert Push Notifications
                              </label>
                            </div>
                          </div>

                          {/* Sync Information notice */}
                          <div className="pt-3 border-t border-zinc-900 bg-zinc-900/40 p-3 rounded-lg border border-zinc-850 text-left">
                            <span className="text-[10px] font-black tracking-widest text-emerald-400 block uppercase mb-1">⚡ Real-Time Centralized Sync</span>
                            <p className="text-[10.5px] text-zinc-400 leading-relaxed font-sans mt-1">
                              Your Expert Advisor tracks and executes trading instructions from <strong>Phase-1</strong> and <strong>Phase-2 (AI Dynamic Exit Engine)</strong> in real-time. Standard risk parameters, trailing stops, and multi-TP locks are managed dynamically from this central terminal. No additional manual input parameters are required inside your MT5 EA.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 2: MANAGE */}
                      {eaSubTab === "MANAGE" && (
                        <div className="space-y-3 font-mono text-[11px]">
                          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-500 text-[10px] uppercase">Maximum Slippage (pips)</span>
                            <span className="font-bold text-zinc-200">3.0</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-500 text-[10px] uppercase">Max Spread Limit (pips)</span>
                            <span className="font-bold text-zinc-200">5.0</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-500 text-[10px] uppercase">Max Simultaneous Positions</span>
                            <span className="font-bold text-zinc-200">5</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-500 text-[10px] uppercase">Auto-Close on Reverse Signal</span>
                            <span className="text-emerald-400 font-bold">ENABLED</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 leading-normal italic pl-1 font-sans">
                            * Slippage enforcement rejects entries if execution slips beyond predefined fractional pips width.
                          </p>
                        </div>
                      )}

                      {/* Sub-tab 3: SIGNAL parsing */}
                      {eaSubTab === "SIGNAL" && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9.5px] uppercase font-semibold text-zinc-500 block mb-0.5">BUY Triggers</label>
                              <input type="text" readOnly value="BUY, LONG, CALL" className="w-full bg-zinc-900 border border-zinc-850 px-2 py-1 rounded text-[10.5px] text-emerald-400 font-mono font-bold" />
                            </div>
                            <div>
                              <label className="text-[9.5px] uppercase font-semibold text-zinc-500 block mb-0.5">SELL Triggers</label>
                              <input type="text" readOnly value="SELL, SHORT, PUT" className="w-full bg-zinc-900 border border-zinc-850 px-2 py-1 rounded text-[10.5px] text-rose-450 font-mono font-bold" />
                            </div>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-[10.5px] text-zinc-350 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={eaExcludeSymbols}
                                onChange={(e) => setEaExcludeSymbols(e.target.checked)}
                                className="rounded border-zinc-850 bg-zinc-900 text-emerald-500 h-3.5 w-3.5 cursor-pointer"
                              />
                              Filter Exclusions List ({eaExcludeList})
                            </label>
                          </div>
                          <div>
                            <label className="flex items-center gap-2 text-[10.5px] text-zinc-350 py-1 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={eaIncludeSymbols}
                                onChange={(e) => setEaIncludeSymbols(e.target.checked)}
                                className="rounded border-zinc-850 bg-zinc-900 text-emerald-500 h-3.5 w-3.5 cursor-pointer"
                              />
                              Strict Inclusions Filter ({eaIncludeList})
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 4: COPY connections */}
                      {eaSubTab === "COPY" && (
                        <div className="space-y-3 font-sans">
                          <div>
                            <label className="text-[9.5px] uppercase font-bold text-zinc-450 font-mono text-zinc-500 block mb-1">Group Filter Allowed IDs</label>
                            <input
                              type="text"
                              value={eaChannelList}
                              onChange={(e) => setEaChannelList(e.target.value)}
                              className="w-full bg-zinc-900 text-emerald-400 font-mono border border-zinc-800 rounded px-2.5 py-1.5 focus:outline-hidden text-xs"
                            />
                          </div>

                          <div className="p-2.5 border border-emerald-950 bg-emerald-950/15 rounded-lg flex items-start gap-2.5">
                            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-1.5" />
                            <div>
                              <span className="text-[10.5px] font-bold text-emerald-400 uppercase tracking-wider block">Broker Link Secured</span>
                              <span className="text-[10px] text-zinc-450 leading-relaxed block text-zinc-400 mt-0.5">
                                Telegram webhook interface is synchronized. Incoming signal payloads from verified user ID/Groups are executed instantly.
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Sub-tab 5: TIME filter */}
                      {eaSubTab === "TIME" && (
                        <div className="space-y-3 font-mono text-[10.5px]">
                          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-500 text-[9.5px] uppercase">Daily Working Window</span>
                            <span className="text-zinc-300">00:00 - 23:59 UTC</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-500 text-[9.5px] uppercase">Allowed Trading Days</span>
                            <span className="text-zinc-300 font-bold">Mon, Tue, Wed, Thu, Fri</span>
                          </div>
                          <div className="flex items-center justify-between py-1 border-b border-zinc-900">
                            <span className="text-zinc-500 text-[9.5px] uppercase">Avoid Daily Rollover Spreads</span>
                            <span className="text-emerald-400 font-bold">ACTIVE</span>
                          </div>
                        </div>
                      )}

                    </div>

                    {/* EA Bottom Control Buttons bar inside dialogue overlay */}
                    <div className="bg-zinc-900 px-4 py-3 border-t border-zinc-850 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setShowTpSettingsModal(false);
                          setShowSlSettingsModal(false);
                          setShowMoreSettingsModal(true);
                        }}
                        className="py-1 px-3 border border-zinc-700 hover:border-zinc-600 hover:text-white rounded text-[10.5px] text-zinc-300 font-bold tracking-wide select-none cursor-pointer"
                      >
                        Help & Setup Guides
                      </button>

                      <button
                        type="button"
                        onClick={() => setEaEnabled(!eaEnabled)}
                        className={`py-1.5 px-4 rounded text-xs font-black uppercase tracking-wider select-none transition-all cursor-pointer shadow-md ${
                          eaEnabled 
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-605/10" 
                            : "bg-rose-650 hover:bg-rose-550 text-white"
                        }`}
                      >
                        {eaEnabled ? "Enabled ✓" : "OFF / DISABLED"}
                      </button>
                    </div>

                    {/* Help & Setup guide overlay sub-modal */}
                    {showMoreSettingsModal && (
                      <div className="absolute inset-x-0 bottom-14 top-[74px] bg-zinc-950 p-4 border-t border-zinc-850 flex flex-col justify-between z-30 overflow-y-auto text-left text-xs text-zinc-350">
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5">
                            <span className="font-bold text-sky-400 uppercase tracking-wider text-[10.5px]">Expert Advisor Detailed Setup Walkthrough</span>
                            <button type="button" onClick={() => setShowMoreSettingsModal(false)} className="text-zinc-500 hover:text-white text-[11px] font-bold">[X] CLOSE</button>
                          </div>

                          <div className="space-y-4 leading-relaxed text-zinc-400 text-[11.5px] font-sans">
                            <div className="space-y-1.5">
                              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono text-[10px]">1</span>
                                Copy & Compile Expert Advisor Code
                              </span>
                              <p className="text-zinc-400 pl-6 text-[11px] leading-relaxed">
                                Copy the full MQL5 code and paste it inside MetaTrader's code compiler:
                              </p>
                              <div className="pl-6 flex flex-col sm:flex-row gap-2 mt-2">
                                <button
                                  type="button"
                                  onClick={handleCopyTelegramCopierCode}
                                  className="py-1 px-3 bg-sky-600 hover:bg-sky-500 text-white font-black text-[10.5px] rounded flex items-center justify-center gap-1 cursor-pointer transition-all uppercase"
                                >
                                  <Code className="h-3 w-3" />
                                  {copiedTgCode ? "Code Copied! ✓" : "Copy EA Code (MQL5)"}
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono text-[10px]">2</span>
                                Compile inside MetaEditor (F4)
                              </span>
                              <div className="text-zinc-400 pl-6 text-[11px] leading-relaxed space-y-1">
                                <p>• Press <kbd className="bg-zinc-900 text-zinc-200 px-1 py-0.5 rounded font-mono text-[10px]">F4</kbd> inside MetaTrader 5 to open the <b>MetaEditor</b> window.</p>
                                <p>• Go to <b className="text-zinc-200">File &gt; New</b>, choose <b className="text-zinc-200">Expert Advisor (template)</b>, and name it <code className="font-mono text-zinc-200 font-bold bg-zinc-900/60 px-1 py-0.5">QuantTerminalSyncBridge</code>.</p>
                                <p>• Delete 100% of the initial default template text.</p>
                                <p>• Paste the copied code and click the green <b className="text-zinc-100">Compile</b> button in the top menu.</p>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono text-[10px]">3</span>
                                WebRequest URL Authorization
                              </span>
                              <p className="text-zinc-400 pl-6 text-[11px] leading-relaxed">
                                Add our production web API URL to MT5's WebRequest permissions list to allow trading requests:
                              </p>
                              <div className="pl-6 space-y-2">
                                <div className="text-zinc-400 space-y-1 text-[11px]">
                                  <p>• In MT5: Click <b className="text-zinc-200">Tools &gt; Options</b>.</p>
                                  <p>• Switch to the <b className="text-zinc-200">Expert Advisors</b> tab.</p>
                                  <p>• Check <b className="text-zinc-200">"Allow WebRequest for listed URL"</b>.</p>
                                  <p>• Add the following secure address to the list:</p>
                                </div>
                                <div className="bg-zinc-900 border border-zinc-850 p-2 rounded flex items-center justify-between gap-2">
                                  <code className="text-emerald-400 font-mono text-[10px] break-all select-all">{productionOrigin}</code>
                                  <button
                                    type="button"
                                    onClick={handleCopyUrl}
                                    className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-[9.5px] rounded shrink-0 font-bold uppercase tracking-wider font-sans cursor-pointer transition-colors"
                                  >
                                    {copiedUrl ? "Copied" : "Copy"}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <span className="font-bold text-zinc-100 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-sky-500/10 text-sky-400 flex items-center justify-center font-mono text-[10px]">4</span>
                                Drag to Chart & Play!
                              </span>
                              <div className="text-zinc-400 pl-6 text-[11px] leading-relaxed space-y-1">
                                <p>• In MT5, refresh your <b>Navigator</b> panel or restart MetaTrader 5.</p>
                                <p>• Drag <b className="text-zinc-200">QuantTerminalSyncBridge</b> to any chart (e.g. BTCUSD or EURUSD).</p>
                                <p>• Toggle the <b className="text-zinc-200">"Algo Trading"</b> green arrow button in your top toolbar to <b>ON</b>.</p>
                                <p>• Because risk, trailing states, and multi-targets are controlled live on our cloud servers, you do not need to customize any settings values in the inputs window.</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowMoreSettingsModal(false)}
                          className="mt-4 py-1.5 w-full bg-zinc-800 hover:bg-zinc-700 text-white font-sans font-bold leading-none text-[11px] rounded cursor-pointer transition-colors"
                        >
                          APPRECIATED, EXIT HELP ✓
                        </button>
                      </div>
                    )}

                  </div>

                  {/* Aesthetic Watermark inside chart view */}
                  <div className="absolute bottom-1/3 right-10 leading-none select-none pointer-events-none text-right">
                    <span className="font-sans text-9xl font-black text-white/[0.015] italic block">MT5</span>
                    <span className="font-mono text-[10px] tracking-widest text-white/5 uppercase block mt-1">Direct WebAPI Polling Bridge active</span>
                  </div>

                </div>

                {/* Simulated MT5 Terminal bottom pane (Trade log, exposure, logs) */}
                <div className="bg-zinc-950 border-t border-zinc-900 h-[190px] select-none text-[10.5px] flex flex-col justify-between font-mono">
                  
                  {/* MetaTrader terminal sub-tabs toolbar */}
                  <div className="bg-zinc-900/60 border-b border-zinc-900 flex py-0.5 bg-zinc-900 px-1 gap-1">
                    {(["TRADE", "HISTORY", "EXPERTS"] as const).map((tTab) => (
                      <button
                        key={tTab}
                        onClick={() => setTerminalActiveTab(tTab)}
                        className={`px-3 py-1 font-bold rounded-t text-[10px] flex items-center gap-1 cursor-pointer transition-colors ${
                          terminalActiveTab === tTab 
                            ? "bg-zinc-950 text-white border-t border-x border-zinc-800 font-black" 
                            : "text-zinc-500 hover:text-zinc-300"
                        }`}
                      >
                        {tTab === "TRADE" && <List className="h-3 w-3 text-sky-400" />}
                        {tTab === "HISTORY" && <Activity className="h-3 w-3 text-emerald-400" />}
                        {tTab === "EXPERTS" && <Terminal className="h-3 w-3 text-purple-400" />}
                        {tTab}
                      </button>
                    ))}

                    <div className="ml-auto flex items-center pr-2 gap-3 text-[10px] text-zinc-500">
                      <span>Live Balance: <span className="text-zinc-350 font-bold">${terminalBalance.toLocaleString([], { minimumFractionDigits: 2 })}</span></span>
                      <span>Equity: <span className="text-emerald-400 font-bold">${(terminalBalance + simulatedEaPositions.reduce((s, p) => s + (p.pnl || 0), 0)).toLocaleString([], { minimumFractionDigits: 2 })}</span></span>
                    </div>
                  </div>

                  {/* Terminal Tab table contents */}
                  <div className="flex-1 overflow-y-auto text-left py-1 text-[10px] flex flex-col justify-between">
                    
                    {/* Terminal trade positions */}
                    {terminalActiveTab === "TRADE" && (
                      <div className="px-2 flex-1 flex flex-col justify-between">
                        {simulatedEaPositions.length > 0 ? (
                          <div>
                            <table className="w-full text-zinc-400 border-collapse">
                              <thead>
                                <tr className="text-zinc-500 border-b border-zinc-900 pb-1 select-none whitespace-nowrap">
                                  <th className="text-left font-normal py-1 pr-2">Symbol</th>
                                  <th className="text-left font-normal py-1 pr-2">Ticket</th>
                                  <th className="text-left font-normal py-1">Time</th>
                                  <th className="text-left font-normal py-1">Type</th>
                                  <th className="text-left font-normal py-1">Volume</th>
                                  <th className="text-left font-normal py-1">Price</th>
                                  <th className="text-left font-normal py-1">StopLoss</th>
                                  <th className="text-left font-normal py-1">TakeProfit</th>
                                  <th className="text-right font-normal py-1">Profit</th>
                                </tr>
                              </thead>
                              <tbody>
                                {simulatedEaPositions.map((pos) => (
                                  <tr key={pos.id} className="hover:bg-zinc-900/40 select-text whitespace-nowrap text-zinc-300 font-mono">
                                    <td className="py-1 text-white font-bold pr-2">{pos.displayName || pos.symbol}</td>
                                    <td className="py-1 text-zinc-450 pr-2">{pos.id}</td>
                                    <td className="py-1 text-zinc-400/90 pr-2">{pos.time || "09:12:12"}</td>
                                    <td className={`py-1 font-bold ${pos.type === "BUY" ? "text-emerald-400" : "text-rose-450"}`}>
                                      {pos.type ? pos.type.toLowerCase() : "buy"}
                                    </td>
                                    <td className="py-1 text-zinc-300 font-bold">{pos.volume ? pos.volume.toFixed(1) : "0.1"}</td>
                                    <td className="py-1 text-zinc-200">{formatPrice(pos.entryPrice, pos.symbol)}</td>
                                    <td className="py-1 text-rose-400/80">{pos.sl ? formatPrice(pos.sl, pos.symbol) : "0.00000"}</td>
                                    <td className="py-1 text-emerald-400/80">{pos.tp ? formatPrice(pos.tp, pos.symbol) : "0.00000"}</td>
                                    <td className={`py-1 text-right font-bold ${pos.pnl >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                                      {pos.pnl >= 0 ? `+${pos.pnl.toLocaleString([], { minimumFractionDigits: 2 })}` : pos.pnl.toLocaleString([], { minimumFractionDigits: 2 })}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>

                            {/* Standard grey/dark MT5 styled Summary Row */}
                            {(() => {
                              const totalP = simulatedEaPositions.reduce((s, p) => s + (p.pnl || 0), 0);
                              const eq = Number((terminalBalance + totalP).toFixed(2));
                              const lots = simulatedEaPositions.reduce((s, p) => s + (p.volume || 0), 0);
                              const marg = Math.abs(lots - 0.5) < 0.001 ? 57.79 : (lots > 0 ? Number((lots * 115.58).toFixed(2)) : 0);
                              const freeMarg = Number((eq - marg).toFixed(2));
                              const margLev = marg > 0 ? Number(((eq / marg) * 100).toFixed(2)) : 0;

                              return (
                                <div className="mt-4 pt-2 border-t border-zinc-800 bg-zinc-950/80 p-2 rounded-lg flex flex-wrap gap-x-4 gap-y-1 items-center text-[10px] text-zinc-350 font-bold select-text">
                                  <span>
                                    Balance: <span className="text-white font-mono">{terminalBalance.toLocaleString([], { minimumFractionDigits: 2 })} USD</span>
                                  </span>
                                  <span>
                                    Equity: <span className="text-emerald-400 font-mono font-black">{eq.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                                  </span>
                                  <span>
                                    Margin: <span className="text-zinc-200 font-mono">{marg.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                                  </span>
                                  <span>
                                    Free Margin: <span className="text-zinc-200 font-mono">{freeMarg.toLocaleString([], { minimumFractionDigits: 2 })}</span>
                                  </span>
                                  <span>
                                    Margin Level: <span className="text-zinc-200 font-mono">{margLev.toLocaleString([], { minimumFractionDigits: 2 })} %</span>
                                  </span>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="py-8 text-center text-zinc-500 italic">No floating copy trades active. Enter target patterns inside the Telegram block to copy.</div>
                        )}
                      </div>
                    )}

                    {/* Terminal trade history */}
                    {terminalActiveTab === "HISTORY" && (
                      <div className="px-2">
                        {simulatedEaHistory.length > 0 ? (
                          <table className="w-full text-zinc-450 border-collapse">
                            <thead>
                              <tr className="text-zinc-500 border-b border-zinc-900 pb-1 select-none whitespace-nowrap">
                                <th className="text-left font-normal py-1">Ticket</th>
                                <th className="text-left font-normal py-1">Symbol</th>
                                <th className="text-left font-normal py-1">Type</th>
                                <th className="text-left font-normal py-1">Entry</th>
                                <th className="text-left font-normal py-1">Exit Price</th>
                                <th className="text-left font-normal py-1">Trigger Trigger</th>
                                <th className="text-right font-normal py-1">Profit ($)</th>
                              </tr>
                            </thead>
                            <tbody>
                              {simulatedEaHistory.map((hist, idx) => (
                                <tr key={idx} className="hover:bg-zinc-900/35 border-b border-zinc-900/10 last:border-b-0 select-text whitespace-nowrap">
                                  <td className="py-1 text-zinc-600">{hist.id}</td>
                                  <td className="py-1 text-zinc-300 font-semibold">{hist.symbol}</td>
                                  <td className={`py-1 font-bold ${hist.type === "BUY" ? "text-emerald-500" : "text-rose-500"}`}>{hist.type}</td>
                                  <td className="py-1 text-zinc-400">${hist.entryPrice.toLocaleString()}</td>
                                  <td className="py-1 text-zinc-300 font-mono">${hist.exitPrice?.toLocaleString() || "N/A"}</td>
                                  <td className="py-1">
                                    <span className={`inline-block text-[9px] px-1.5 py-0.5 rounded font-mono uppercase font-black ${
                                      hist.reason === "TP" ? "bg-emerald-900/20 text-emerald-400" :
                                      hist.reason === "SL" ? "bg-rose-900/20 text-rose-400" :
                                      "bg-sky-900/20 text-sky-400"
                                    }`}>
                                      {hist.reason}
                                    </span>
                                  </td>
                                  <td className={`py-1 text-right font-black font-mono ${hist.pnl >= 0 ? "text-emerald-400" : "text-rose-450"}`}>
                                    {hist.pnl >= 0 ? `+${hist.pnl.toLocaleString([], { minimumFractionDigits: 2 })}` : hist.pnl.toLocaleString([], { minimumFractionDigits: 2 })}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="py-8 text-center text-zinc-600 italic">No completed closed transactions listed.</div>
                        )}
                      </div>
                    )}

                    {/* Terminal Experts log logs */}
                    {terminalActiveTab === "EXPERTS" && (
                      <div className="px-2 text-zinc-300 font-mono text-[10.5px] leading-relaxed space-y-1">
                        {simulatedEaLogs.slice().reverse().map((log, idx) => {
                          const isSuccess = log.includes("SUCCESS") || log.includes("closed position");
                          const isWarn = log.includes("WARN") || log.includes("REJECTED") || log.includes("BLOCKED");
                          return (
                            <div key={idx} className={`p-1.5 border-b border-zinc-900/40 font-mono ${
                              isSuccess ? "text-emerald-400" : isWarn ? "text-amber-400 bg-amber-950/5" : "text-zinc-400"
                            }`}>
                              <span className="text-[9px] text-zinc-600 font-normal select-none mr-2">[{new Date().toLocaleTimeString()}]</span>
                              {log}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                </div>

              </div>

            </div>

            {/* Column 3: Live Broadcast Simulator / Interactive Telegram Client widget */}
            <div className="lg:col-span-1 space-y-5">
              
              {/* Telegram Window Wrapper */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 shadow-2xl flex flex-col h-[560px] text-left">
                
                {/* Telegram Header */}
                <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between select-none shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-gradient-to-tr from-sky-450 to-sky-550 bg-sky-500 rounded-full flex items-center justify-center font-bold text-white shadow-inner">
                      D
                    </div>
                    <div>
                      <h5 className="font-sans font-black text-xs text-white leading-tight flex items-center gap-1.5">
                        {tgChannelName}
                        <Check className="h-3.5 w-3.5 text-sky-400 inline" />
                      </h5>
                      <span className="text-[10px] text-zinc-400 font-mono block leading-none mt-0.5">
                        {tgSubscribers} subscribers • Copy Direct Active
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setTgSubscribers(prev => prev + 1);
                      setSimulatedEaLogs(old => [...old, "[Telegram EA] Channel subscribers count sync update."]);
                    }}
                    className="p-1.5 bg-zinc-800 hover:bg-zinc-700 hover:text-white rounded text-[10px] text-zinc-450 font-bold transition-all cursor-pointer"
                    title="Add simulated subscriber"
                  >
                    + Member
                  </button>
                </div>

                {/* Telegram Chat Message Stream viewport */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-zinc-950 flex flex-col justify-end">
                  
                  {/* Explanatory introduction tooltip */}
                  <div className="bg-zinc-900/35 border border-zinc-900/60 p-3 rounded-lg text-[10.5px] leading-relaxed text-zinc-400 italic">
                    💡 <b>Immediate Sandbox Testing:</b> Enter signal alerts inside the chatbox below, or click any pattern layout preset below. Press Send to broadcast: it will auto-parse, log, and open mock trades directly on the MetaTrader 5 terminal pane!
                  </div>

                  {tgMessages.map((msg) => {
                    if (msg.isSystem) {
                      return (
                        <div key={msg.id} className="text-center font-mono text-[9px] text-zinc-650 tracking-wider">
                          <span className="bg-zinc-900/80 px-2 py-0.5 rounded border border-zinc-900 text-zinc-500">{msg.text}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} className="flex flex-col items-start space-y-1 max-w-[85%] self-start bg-zinc-900 p-3 rounded-2xl rounded-tl-none border border-zinc-850 shadow">
                        <span className="font-extrabold text-[10px] text-sky-400 font-sans tracking-wide block">{msg.sender}</span>
                        <pre className="font-mono text-[11px] leading-relaxed text-zinc-200 whitespace-pre-wrap select-all font-bold break-all">{msg.text}</pre>
                        <span className="text-[9px] text-zinc-500 font-mono text-right block self-end">{msg.time || "13:00"} ✔✔</span>
                      </div>
                    );
                  })}
                </div>

                {/* Simulation Signals Presets Quick Launch */}
                <div className="p-3 bg-zinc-900/20 border-t border-zinc-900 space-y-2 shrink-0">
                  <span className="block text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono">Rapid Testing Signal Presets</span>
                  <div className="flex flex-col gap-1.5">
                    <button
                      onClick={() => setTgChatText("BUY BTCUSD\nENTRY 69400\nSL: 68900\nTP: 70400")}
                      className="text-left p-1.5 bg-zinc-900 hover:bg-zinc-850 hover:text-white rounded text-[10.5px] font-mono font-bold hover:border-zinc-700 transition-all text-emerald-400 select-none cursor-pointer border border-zinc-900 leading-snug flex justify-between"
                    >
                      <span>📈 BUY BTCUSD Target Pattern</span>
                      <span className="text-[8.5px] opacity-60 text-zinc-550 border border-emerald-500/10 px-1 rounded">Preset 1</span>
                    </button>
                    <button
                      onClick={() => setTgChatText("SELL BTCUSD\nENTRY 69600\nSL: 70100\nTP: 68600")}
                      className="text-left p-1.5 bg-zinc-900 hover:bg-zinc-850 hover:text-white rounded text-[10.5px] font-mono font-bold hover:border-zinc-700 transition-all text-rose-400 select-none cursor-pointer border border-zinc-900 leading-snug flex justify-between"
                    >
                      <span>📉 SELL BTCUSD Target Pattern</span>
                      <span className="text-[8.5px] opacity-60 text-zinc-550 border border-rose-500/10 px-1 rounded">Preset 2</span>
                    </button>
                  </div>
                </div>

                {/* Telegram Chat Input box */}
                <div className="p-3 bg-zinc-900 border-t border-zinc-850 flex items-center gap-2.5 shrink-0">
                  <input
                    type="text"
                    value={tgChatText}
                    onChange={(e) => setTgChatText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendTgMessage();
                    }}
                    placeholder="Broadcast text copy signal..."
                    className="flex-1 bg-zinc-950 font-mono border border-zinc-800 roundedpx-2.5 rounded px-3 py-2 text-xs text-white placeholder-zinc-550 focus:outline-hidden focus:border-sky-505"
                  />
                  <button
                    onClick={handleSendTgMessage}
                    disabled={!tgChatText.trim()}
                    className="p-2 aspect-square bg-sky-600 hover:bg-sky-500 hover:text-white font-sans text-xs font-bold text-white rounded transition-all disabled:opacity-40 cursor-pointer flex items-center justify-center font-black select-none shrink-0"
                    title="Send broadcast"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>

              </div>
              
            </div>
          </div>
        </div>
      )}

      {/* Option 3: Direct Broker Settings Tab */}
      {activeTab === "DIRECT_BROKER_SETTINGS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4 text-left">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-amber-500 animate-pulse" />
              Direct Broker Connection Portal
            </span>

            {state.config.directBrokerEnabled ? (
              <div className="space-y-4 font-sans">
                <div className="border border-amber-500/10 bg-amber-955/15 rounded-xl p-4 text-left relative overflow-hidden transition-colors duration-300">
                  <div className="absolute top-0 right-0 h-10 w-10 bg-amber-500/5 blur-xl rounded-full" />
                  <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block mb-2">● CLOUD COUPLING ONLINE</span>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                      <span className="text-zinc-400">Broker Server</span>
                      <span className="font-mono text-white font-medium">{state.config.directBrokerServer}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                      <span className="text-zinc-400">Account ID</span>
                      <span className="font-mono text-white font-medium">{state.config.directBrokerLogin}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-900/60">
                      <span className="text-zinc-400">Symbol Suffix</span>
                      <span className="font-mono text-white font-medium">{state.config.directBrokerSuffix || "None (-)"}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-400">Connection Speed</span>
                      <span className="font-mono text-emerald-400 font-bold">&lt; 5ms (REST Gateway)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handleDisconnectDirectBroker}
                    className="w-full py-2 px-3 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 transition-all rounded-lg font-sans text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer select-none"
                  >
                    <Trash2 className="h-4 w-4 text-rose-500" />
                    Disconnect Direct Broker
                  </button>
                  
                  <button
                    type="button"
                    onClick={async () => {
                      await onUpdateConfig({
                        directBrokerAutoExecute: !state.config.directBrokerAutoExecute
                      });
                    }}
                    className={`w-full py-1.5 px-3 border transition-colors rounded-lg font-mono text-[10px] font-bold flex items-center justify-center gap-1.5 cursor-pointer select-none ${
                      state.config.directBrokerAutoExecute
                        ? "bg-emerald-950/20 border-emerald-500/20 text-emerald-400"
                        : "bg-zinc-900/40 border-zinc-800 text-zinc-400"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Auto-Execution: {state.config.directBrokerAutoExecute ? "ACTIVE" : "PAUSED"}
                  </button>

                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-[10.5px] font-sans leading-relaxed flex items-start gap-2">
                    <Activity className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400 animate-pulse" />
                    <div className="text-left">
                      <span className="font-bold block mb-0.5">⚡ Direct Cloud WebSocket Engaged</span>
                      Your server is connected directly with the broker's endpoints over a secure background socket pipe. Auto-trading commands copy in real-time with 0ms delay. No EA required!
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnectDirectBroker} className="space-y-3.5 text-left">
                <div className="flex justify-between items-center bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-900/60">
                  <div className="leading-tight">
                    <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-mono block">Broker Preset</span>
                    <span className="text-[11px] text-zinc-300 font-bold block">Restore Default MT5 Demo</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setDbServer("MetaQuotes-Demo");
                      setDbLogin("50873114");
                      setDbPassword("BrokerPassword159");
                      setDbSuffix("");
                      recordActivity();
                    }}
                    className="py-1 px-2.5 bg-gradient-to-r from-amber-500/10 to-amber-500/25 border border-amber-500/30 hover:border-amber-500/55 hover:bg-amber-500/30 text-amber-400 rounded text-[10px] font-mono font-bold transition-all cursor-pointer"
                  >
                    PRESET ⚡
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">Trading Server</label>
                  <input
                    type="text"
                    required
                    value={dbServer}
                    onChange={(e) => {
                      setDbServer(e.target.value);
                      recordActivity();
                    }}
                    placeholder="e.g. ICMarkets-Demo or Pepperstone-Live"
                    className="w-full bg-zinc-950 border border-zinc-900 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">Account Login ID</label>
                  <input
                    type="text"
                    required
                    value={dbLogin}
                    onChange={(e) => {
                      setDbLogin(e.target.value);
                      recordActivity();
                    }}
                    placeholder="e.g. 50873114"
                    className="w-full bg-zinc-950 border border-zinc-905 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block">Trading Password</label>
                  <input
                    type="password"
                    required
                    value={dbPassword}
                    onChange={(e) => {
                      setDbPassword(e.target.value);
                      recordActivity();
                    }}
                    placeholder="Broker Account Password"
                    className="w-full bg-zinc-950 border border-zinc-905 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 font-bold block flex items-center justify-between">
                    <span>Broker Symbol Suffix (Optional)</span>
                    <span className="text-[9px] text-zinc-500 font-normal normal-case">e.g. m, .pro, ecn</span>
                  </label>
                  <input
                    type="text"
                    value={dbSuffix}
                    onChange={(e) => {
                      setDbSuffix(e.target.value);
                      recordActivity();
                    }}
                    placeholder="Leave blank if none (e.g. EURUSD vs EURUSDm)"
                    className="w-full bg-zinc-955 border border-zinc-900 px-3 py-2 rounded-lg text-xs font-mono text-white focus:outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="dbAutoExec"
                    checked={dbAutoExecute}
                    onChange={(e) => {
                      setDbAutoExecute(e.target.checked);
                      recordActivity();
                    }}
                    className="h-3.5 w-3.5 rounded border-zinc-900 bg-zinc-950 focus:ring-opacity-0"
                  />
                  <label htmlFor="dbAutoExec" className="text-[10.5px] text-zinc-400 font-sans select-none cursor-pointer">
                    Enable Dynamic Copy-Trading Automatically
                  </label>
                </div>



                <button
                  type="submit"
                  disabled={dbLoading}
                  className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-black text-xs uppercase tracking-wider rounded-lg transition-all shadow-md font-sans cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {dbLoading ? (
                    <span>Initiating Cloud Channel...</span>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Connect Broker Gateway
                    </>
                  )}
                </button>
              </form>
            )}

            {dbFeedback && (
              <div className={`p-3 rounded-lg text-[10.5px] font-mono text-left leading-relaxed ${
                dbFeedback.toLowerCase().includes("success") || dbFeedback.toLowerCase().includes("online")
                  ? "bg-emerald-950/15 border border-emerald-500/20 text-emerald-400"
                  : "bg-amber-955/15 border border-amber-500/20 text-amber-400"
              }`}>
                {dbFeedback}
              </div>
            )}
          </div>

          <div className="lg:col-span-2 rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-4 text-left">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2 flex items-center justify-between">
              <span>Direct Broker Cloud Tunnel Core Strategy</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-wider">
                🐍 Pure Python Bridge (No EA)
              </span>
            </span>

            <div className="space-y-4 text-xs text-zinc-400 leading-relaxed font-sans">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs leading-relaxed text-zinc-350">
                <span className="font-extrabold uppercase text-emerald-400 block mb-1">⚡ 100% COPIER WITH NO EA REQUIRED</span>
                Execute copy trades directly on MetaTrader 5 **without** running any Expert Advisor (EA) or compile scripts inside your MT5 program. This routes signals via a secure, bi-directional Python background service.
              </div>

              <div className="border border-zinc-900 p-4 rounded-xl bg-zinc-950/60 space-y-3">
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wide flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-emerald-400" />
                  <span>How to connect your Real MT5 Account (3-Step Guide)</span>
                </h4>
                <div className="space-y-2 text-[11px] text-zinc-400 pl-1 font-sans">
                  <p>
                    <b className="text-zinc-300">1. Setup Python MT5 Gateway:</b> Standard MetaQuotes protocol requires a secure proxy to talk to desktop instances. install the two required lightweight libraries on your PC:
                    <code className="block mt-1 bg-black/40 px-2 py-1 rounded text-emerald-400 font-mono text-[10px]">
                      pip install MetaTrader5 websockets
                    </code>
                  </p>
                  <p>
                    <b className="text-zinc-300">2. Run the Connection Bridge:</b> Create a python script (e.g. <code className="text-amber-400">bridge.py</code>), paste the customized configuration code below, and execute it locally:
                    <code className="block mt-1 bg-black/40 px-2 py-1 rounded text-emerald-400 font-mono text-[10px]">
                      python bridge.py
                    </code>
                    <span className="block mt-1 text-[10px] text-zinc-500 leading-normal">
                      ⚠️ <b>Windows "Python was not found" error?</b> Try running <code className="text-emerald-400 font-mono">py bridge.py</code> or <code className="text-emerald-400 font-mono">python3 bridge.py</code>. If the error persists, ensure you checked <b>"Add Python to PATH"</b> when installing Python from <a href="https://www.python.org/downloads/" target="_blank" rel="noreferrer" className="text-amber-400 hover:underline">python.org</a>, or disable Windows execution aliases under <i>Settings &gt; Apps &gt; App Execution Aliases</i> by turning off the "Python" and "Python3" store shortcuts.
                    </span>
                  </p>
                  <p>
                    <b className="text-zinc-350">3. Enable Gateway Copier:</b> Complete the form on the left with your credentials and toggle <b>"Connect Broker Gateway"</b>. Your local terminal will confirm active connection handshake immediately!
                  </p>
                </div>
              </div>

              {/* COPYABLE DYNAMIC CODE BOX */}
              <div className="border border-zinc-900 rounded-xl bg-black/50 overflow-hidden">
                <div className="flex justify-between items-center bg-zinc-900/40 px-4 py-2 border-b border-zinc-900">
                  <span className="font-mono text-[10.5px] font-bold text-zinc-400">bridge.py — Customized Python Tunnel</span>
                  <button
                    type="button"
                    onClick={() => {
                      const webappUrl = "https://live-trading-analysis-webapp-581259014748.asia-southeast1.run.app";
                      const defaultToken = "tok_ea_921048_active";
                      const code = `import asyncio
import websockets
import json
import MetaTrader5 as mt5
import urllib.parse
import time

# ====================================================================
# CONFIGURATION INPUTS (Option 3 Setup - WITHOUT ANY EA)
# ====================================================================
ServerUrl    = "${webappUrl}"  # Webapp Base URL (e.g., https://yourapp.run.app)
ApiToken     = "${defaultToken}"  # Connection Authorization Token key

# OPTIONAL EXPLICIT LOGIN (Leave MT5_Login = None to automatically hitch onto your active logged-in desktop terminal!)
MT5_Login    = ${dbLogin ? dbLogin : "None"}  # Set to None to use active session, or Enter Account ID if force-login is needed
MT5_Password = "${dbPassword ? dbPassword : ""}"  # Your Trading Password
MT5_Server   = "${dbServer ? dbServer : ""}"  # Broker Server Name (e.g., "Exness-Trial")
# ====================================================================

print("==================================================")
print("🚀 ALGO-BRIDGE ACTIVE: DIRECT PYTHON TUNNEL")
print("==================================================")

def adjust_stops_to_stoplevel(symbol, action_type, price, sl, tp, sym_info, force_stops_level=None):
    if not sym_info:
        return sl, tp
    
    stops_level = force_stops_level if force_stops_level is not None else getattr(sym_info, "trade_stops_level", 0)
    # Some brokers report stops_level = 0 but actually enforce a minimum under the hood (typically 100-300 points for crypto/indices)
    if stops_level == 0:
        stops_level = 150 # Safe fallback of 150 points if broker reports 0
        
    point = getattr(sym_info, "point", 0.00001)
    if not point or point <= 0:
        point = 0.00001
        
    # Add a 5-point safety margin to prevent border rejections
    min_distance = (stops_level + 5) * point
    
    adjusted_sl = sl
    adjusted_tp = tp
    
    is_buy = (action_type == "BUY" or action_type == 0 or action_type == mt5.ORDER_TYPE_BUY)
    
    if is_buy:
        if sl > 0 and (price - sl) < min_distance:
            adjusted_sl = price - min_distance
            print(f"   ⚠️ SL of {sl} too close for StopLevel ({stops_level} pts, min_distance={min_distance:.5f}). Auto-adjusting to {adjusted_sl:.5f}")
        if tp > 0 and (tp - price) < min_distance:
            adjusted_tp = price + min_distance
            print(f"   ⚠️ TP of {tp} too close for StopLevel ({stops_level} pts, min_distance={min_distance:.5f}). Auto-adjusting to {adjusted_tp:.5f}")
        
        # Ensure dynamic SL is not higher than TP
        if adjusted_sl > 0 and adjusted_tp > 0 and adjusted_sl >= adjusted_tp:
            adjusted_sl = adjusted_tp - (1 * point)
            print(f"   ⚠️ Dynamic SL of {sl} was higher or equal to TP of {tp}. Capping SL at {adjusted_sl:.5f} to be strictly below TP.")
    else:
        if sl > 0 and (sl - price) < min_distance:
            adjusted_sl = price + min_distance
            print(f"   ⚠️ SL of {sl} too close for StopLevel ({stops_level} pts, min_distance={min_distance:.5f}). Auto-adjusting to {adjusted_sl:.5f}")
        if tp > 0 and (price - tp) < min_distance:
            adjusted_tp = price - min_distance
            print(f"   ⚠️ TP of {tp} too close for StopLevel ({stops_level} pts, min_distance={min_distance:.5f}). Auto-adjusting to {adjusted_tp:.5f}")
            
        # Ensure dynamic SL is not lower than TP
        if adjusted_sl > 0 and adjusted_tp > 0 and adjusted_sl <= adjusted_tp:
            adjusted_sl = adjusted_tp + (1 * point)
            print(f"   ⚠️ Dynamic SL of {sl} was lower or equal to TP of {tp}. Capping SL at {adjusted_sl:.5f} to be strictly above TP.")
            
    digits = getattr(sym_info, "digits", 5)
    return round(adjusted_sl, digits) if adjusted_sl > 0 else 0.0, round(adjusted_tp, digits) if adjusted_tp > 0 else 0.0

async def handle_signals():
    # 1. Connect to local MetaTrader 5 application
    print("Connecting to MetaTrader 5 desktop client...")
    
    initialized = False
    
    # Mode A: If login is None or empty, connect using the active session inside your open MT5 terminal
    if MT5_Login is None or str(MT5_Login).strip() == "" or str(MT5_Login).lower() == "none" or int(MT5_Login) == 0:
        print("👉 Scheme: Active Session (Leveraging open desktop GUI terminal)")
        initialized = mt5.initialize()
    else:
        # Mode B: Explicit parameters
        print(f"👉 Scheme: Explicit Login (Account ID #{MT5_Login} on {MT5_Server})")
        initialized = mt5.initialize(login=int(MT5_Login), password=MT5_Password, server=MT5_Server)
        
    if not initialized:
        print("❌ MT5 Connection failed!")
        print("Error details:", mt5.last_error())
        print("\\n💡 TROUBLESHOOTING HELP:")
        print("1. Make sure your desktop MetaTrader 5 application is OPEN and running.")
        print("2. Ensure MT5 is logged into an active broker account inside the GUI terminal.")
        print("3. Check Tools -> Options -> Expert Advisors -> check 'Allow Algo Trading' and 'Allow DLL imports'.")
        print("4. If explicit parameters failed, verify login, password, and server in your config.")
        print("5. Set MT5_Login = None to skip sign-in and use whatever account is already active in MT5.")
        return

    print("✔ MetaTrader 5 interface initialized successfully.")
    
    # Resolve account login and server dynamically
    account_info = mt5.account_info()
    login_id = MT5_Login
    server_name = MT5_Server
    
    if account_info:
        login_id = account_info.login
        server_name = account_info.server
        print(f"✔ Live Active Account: #{login_id} (Broker: {account_info.company})")
        print(f"✔ Connected Server: {server_name}")
    else:
        print(f"⚠ Could not query terminal account info. Defaulting login to: {login_id}")

    # 2. Convert Webapp Http/Https URL to dynamic WebSockets Protocol
    parsed = urllib.parse.urlparse(ServerUrl)
    ws_scheme = "wss" if parsed.scheme == "https" else "ws"
    ws_host = parsed.netloc if parsed.netloc else parsed.path
    
    ws_url = f"{ws_scheme}://{ws_host}/api/ws/mt5?login={login_id}&token={ApiToken}"
    
    while True:
        print(f"📡 Connecting to secure socket tunnel: {ws_url}...")
        try:
            async with websockets.connect(
                ws_url,
                ping_interval=20,
                ping_timeout=20
            ) as websocket:
                print("⚡ Secure WebSocket tunnel established! Listening for copy-trading signals...")
                
                # Send initial registration packet
                auth_packet = {
                    "action": "AUTH",
                    "login": str(login_id),
                    "server": server_name
                }
                await websocket.send(json.dumps(auth_packet))
                print("✔ Handshake authentication sent successfully.")
                
                async for raw_msg in websocket:
                    payload = json.loads(raw_msg)
                    print(f"🔔 Received signal from Cloud Controller: {payload}")
                    
                    if payload.get("action") == "ORDER_SEND":
                        symbol = payload.get("symbol")
                        action_type = payload.get("type") # "BUY" or "SELL"
                        volume = float(payload.get("volume", 0.1))
                        sl = float(payload.get("sl", 0))
                        tp = float(payload.get("tp", 0))
                        
                        # Guard: Check MT5 terminal session connection & restore dynamically if stale
                        if not mt5.terminal_info():
                            print("🔄 Active MT5 Terminal session went stale. Triggering connection re-init...")
                            if MT5_Login is None or str(MT5_Login).strip() == "" or str(MT5_Login).lower() == "none" or int(MT5_Login) == 0:
                                mt5.initialize()
                            else:
                                mt5.initialize(login=int(MT5_Login), password=MT5_Password, server=MT5_Server)
                        
                        # 1. Handle dynamic casing, suffix match, and index alias robustness for symbols
                        def find_broker_symbol(symbol):
                            # Try exact match first
                            info = mt5.symbol_info(symbol)
                            if info:
                                return symbol, info
                                
                            # Try direct select of exact symbol in case it exists but wasn't in market watch
                            if mt5.symbol_select(symbol, True):
                                info = mt5.symbol_info(symbol)
                                if info:
                                    return symbol, info
                                    
                            # Check if we can find it via popular indices map direct select fallback
                            indices_map = {
                                "NDX100": ["US100", "NAS100", "USTEC", "NDAQ100", "NDX", "COMPX", "US Tech 100", "USTECm"],
                                "SPX500": ["US500", "SPX", "USA500", "US500Cash", "SP500m"],
                                "DJI30": ["US30", "DJI", "WS30", "DJ30", "WALLSTREET", "US30m"],
                                "GER30": ["DE30", "DAX30", "DAX", "GER40", "DE40", "GER30m"],
                                "UK100": ["FTSE100", "UK100Cash", "FTSE"],
                            }
                            
                            # Extract suffix if any (e.g. "m" or ".m")
                            import re
                            suffix = ""
                            match = re.search(r'([._]?m)$', symbol.lower())
                            if match:
                                suffix = match.group(1)
                                
                            for key, aliases in indices_map.items():
                                if key in symbol.upper() or any(a in symbol.upper() for a in aliases):
                                    # Try aliases with original suffix first (e.g. USTEC + m = USTECm)
                                    if suffix:
                                        for alias in aliases:
                                            alias_with_suffix = alias + suffix
                                            if mt5.symbol_select(alias_with_suffix, True):
                                                info = mt5.symbol_info(alias_with_suffix)
                                                if info:
                                                    print(f"👉 Direct index mapping fallback: mapped {symbol} to {alias_with_suffix} (with suffix)")
                                                    return alias_with_suffix, info
                                                    
                                    # Try raw aliases
                                    for alias in aliases:
                                        if mt5.symbol_select(alias, True):
                                            info = mt5.symbol_info(alias)
                                            if info:
                                                print(f"👉 Direct index mapping fallback: mapped {symbol} to {alias}")
                                                return alias, info
                                                
                            # Get all symbols from MT5 as a final fallback
                            all_symbols = mt5.symbols_get()
                            if all_symbols:
                                # Try case-insensitive exact match
                                for s in all_symbols:
                                    if s.name.upper() == symbol.upper():
                                        if mt5.symbol_select(s.name, True):
                                            info = mt5.symbol_info(s.name)
                                            if info:
                                                return s.name, info
                                                
                                # Try partial matching by cleaning common suffixes/prefixes
                                clean_base = re.sub(r'[^A-Za-z0-9]', '', symbol).upper()
                                for s in all_symbols:
                                    s_clean = re.sub(r'[^A-Za-z0-9]', '', s.name).upper()
                                    if s_clean == clean_base or clean_base in s_clean or s_clean in clean_base:
                                        if mt5.symbol_select(s.name, True):
                                            info = mt5.symbol_info(s.name)
                                            if info:
                                                return s.name, info
                                                
                            return symbol, None

                        symbol_resolved, sym_info = find_broker_symbol(symbol)
                        symbol = symbol_resolved
                        
                        # Ensure symbol is added to Market Watch before querying ticks
                        mt5.symbol_select(symbol, True)
                        
                        # Retry loop to fetch ticks (gives MT5 time to download data for newly selected symbol)
                        tick_info = None
                        for attempt_idx in range(5):
                            tick_info = mt5.symbol_info_tick(symbol)
                            if tick_info:
                                break
                            time.sleep(0.2)
                            
                        price = 0.0
                        if tick_info:
                            price = tick_info.ask if action_type == "BUY" else tick_info.bid
                        elif sym_info:
                            # Fallback to sym_info bid/ask
                            ask = getattr(sym_info, "ask", 0.0)
                            bid = getattr(sym_info, "bid", 0.0)
                            if ask > 0 and bid > 0:
                                print(f"⚠️ Live tick_info is None for {symbol}. Falling back to SymbolInfo bid/ask: Ask={ask}, Bid={bid}")
                                price = ask if action_type == "BUY" else bid
                                
                        # Strongest Fallback: If price is still zero/None, get the last 1-minute candle close
                        if price <= 0:
                            rates = mt5.copy_rates_from_pos(symbol, mt5.TIMEFRAME_M1, 0, 1)
                            if rates is not None and len(rates) > 0:
                                row = rates[0]
                                for field in ['close', 'open']:
                                    if field in row.dtype.names:
                                        price = float(row[field])
                                        print(f"⚠️ Live prices unavailable for {symbol}. Fallback to last M1 {field} price: {price}")
                                        break
                                
                        if price <= 0:
                            print(f"❌ Failed to get symbol info, ticks, or M1 rates for {symbol}. Verify broker Market Watch supports this symbol.")
                            continue
                            
                        # 2. Dynamic Contract Specification Adjustment (Guards volume bounds to prevent broker Reject 10014 Volume Error)
                        if sym_info:
                            min_vol = sym_info.volume_min
                            max_vol = sym_info.volume_max
                            step_vol = sym_info.volume_step
                            
                            if volume < min_vol:
                                print(f"⚠️ Requested volume {volume} is below broker symbol minimum of {min_vol}. Auto-correcting to {min_vol} lots.")
                                volume = min_vol
                            elif volume > max_vol:
                                print(f"⚠️ Requested volume {volume} exceeds broker symbol maximum of {max_vol}. Auto-correcting to {max_vol} lots.")
                                volume = max_vol
                                
                            # Align perfectly to allowed step size fraction
                            steps = round((volume - min_vol) / step_vol)
                            volume = round(min_vol + steps * step_vol, 5)
                            
                        # 3. Dynamic Filling Mode Selection Mask
                        filling_mode = mt5.ORDER_FILLING_IOC
                        if sym_info:
                            if sym_info.filling_mode & 1:  # SYMBOL_FILLING_FOK
                                filling_mode = mt5.ORDER_FILLING_FOK
                            elif sym_info.filling_mode & 2:  # SYMBOL_FILLING_IOC
                                filling_mode = mt5.ORDER_FILLING_IOC
                            else:
                                filling_mode = mt5.ORDER_FILLING_RETURN
 
                         # Create order request
                        digits = 5
                        if sym_info:
                            digits = sym_info.digits
                        
                        price = round(price, digits)
                        if sl > 0 or tp > 0:
                            sl, tp = adjust_stops_to_stoplevel(symbol, action_type, price, sl, tp, sym_info)
 
                        request = {
                            "action": mt5.TRADE_ACTION_DEAL,
                            "symbol": symbol,
                            "volume": volume,
                            "type": mt5.ORDER_TYPE_BUY if action_type == "BUY" else mt5.ORDER_TYPE_SELL,
                            "price": price,
                            "sl": sl,
                            "tp": tp,
                            "deviation": 20,
                            "magic": 921048,
                            "comment": "Algo-Bridge Option 3 Direct",
                            "type_time": mt5.ORDER_TIME_GTC,
                            "type_filling": filling_mode,
                        }
                        
                        print(f"👉 Submitting {action_type} order to broker for {symbol} of {volume} lots...")
                        result = mt5.order_send(request)
                        
                        # Bulletproof Execution Loop: Handles combination of Invalid Stops (10016) and No Money (10019)
                        max_attempts = 10
                        attempt = 0
                        while attempt < max_attempts and result is not None and result.retcode != mt5.TRADE_RETCODE_DONE:
                            attempt += 1
                            ret = result.retcode
                            
                            # Case A: Insufficient funds / No Money (Retcode 10019)
                            if ret == 10019:
                                acc = mt5.account_info()
                                free_margin = getattr(acc, "margin_free", 0.0) if acc else 0.0
                                leverage = getattr(acc, "leverage", 1.0) if acc else 1.0
                                print(f"⚠️ [Attempt {attempt}] Broker rejected order due to insufficient funds (Retcode 10019: No Money).")
                                print(f"   Requested volume: {request['volume']} lots. Available Free Margin: \${free_margin:.2f}. Account Leverage: 1:{leverage}")
                                
                                # Try progressively smaller factors to scale down volume
                                current_vol = request["volume"]
                                scaled_vol = current_vol * 0.5 # scale down by half
                                if sym_info:
                                    if scaled_vol < sym_info.volume_min:
                                        scaled_vol = sym_info.volume_min
                                    # Align perfectly to step size
                                    steps = round((scaled_vol - sym_info.volume_min) / sym_info.volume_step)
                                    scaled_vol = round(sym_info.volume_min + steps * sym_info.volume_step, 5)
                                    
                                if scaled_vol >= current_vol:
                                    print("❌ [Attempt failed] Cannot scale volume down any further (already at broker minimum). Aborting.")
                                    break
                                    
                                request["volume"] = scaled_vol
                                volume = scaled_vol
                                print(f"🔄 Retrying order with scaled lot-size: {scaled_vol} lots...")
                                result = mt5.order_send(request)
                                
                            # Case B: ECN/STP Invalid Stops or Invalid Price (Retcodes 10013, 10016, 10015)
                            elif ret in [10013, 10016, 10015] and (request["sl"] > 0 or request["tp"] > 0):
                                if request["tp"] > 0 and request["sl"] > 0:
                                    print(f"⚠️ [Attempt {attempt}] Broker rejected stops on initial entry (Retcode {ret}: Invalid Stops). Retrying with original SL={sl} but TP=0.0 to prevent zero SL...")
                                    request["tp"] = 0.0
                                    result = mt5.order_send(request)
                                else:
                                    # If it still fails with only SL, or if TP is already 0, we must clear SL to get filled,
                                    # but we will immediately apply the SL in the post-fill block.
                                    print(f"⚠️ [Attempt {attempt}] Broker still rejected stops with only SL. Retrying with SL/TP = 0 (will apply SL immediately after entry)...")
                                    request["sl"] = 0.0
                                    request["tp"] = 0.0
                                    result = mt5.order_send(request)
                                
                            else:
                                # Non-recoverable error code or retry failed with another error, exit loop
                                break
                                
                        # Apply dynamic SL/TP modification for all successful fills if stops were requested
                        if result is not None and result.retcode == mt5.TRADE_RETCODE_DONE:
                            pos_ticket = getattr(result, "position", 0) or result.order
                            if (sl > 0 or tp > 0) and pos_ticket > 0:
                                print(f"✔ Initial order filled. Live Ticket: #{pos_ticket}. Applying SL={sl} and TP={tp} dynamically...")
                                adj_sl, adj_tp = adjust_stops_to_stoplevel(symbol, action_type, result.price, sl, tp, sym_info)
                                modify_req = {
                                    "action": mt5.TRADE_ACTION_SLTP,
                                    "position": pos_ticket,
                                    "symbol": symbol,
                                    "sl": adj_sl,
                                    "tp": adj_tp
                                }
                                mod_res = mt5.order_send(modify_req)
                                if mod_res is None or mod_res.retcode != mt5.TRADE_RETCODE_DONE:
                                    mod_err_code = getattr(mod_res, "retcode", -1) if mod_res else -1
                                    mod_err = getattr(mod_res, "comment", "") or str(mod_res)
                                    print(f"⚠️ Dynamic SL/TP modification failed (Retcode {mod_err_code}): {mod_err}.")
                                    
                                    # Fallback 1: Retry by setting ONLY the SL (so TP is 0.0, avoiding any TP stop-level constraints)
                                    if mod_err_code in [10016, 10013]:
                                        print("🔄 Retrying dynamic modification by setting ONLY SL (TP = 0.0) to ensure SL is not 0...")
                                        modify_req["sl"] = adj_sl
                                        modify_req["tp"] = 0.0
                                        mod_res = mt5.order_send(modify_req)
                                        if mod_res is not None and mod_res.retcode == mt5.TRADE_RETCODE_DONE:
                                            print(f"✔ Dynamic SL successfully applied (TP = 0.0) to Position #{pos_ticket}!")
                                        else:
                                            # Fallback 2: Retry with wider SL stop level buffer and TP = 0.0
                                            print("🔄 Retrying dynamic SL modification with wider fallback StopLevel buffer (300 points) and TP = 0.0...")
                                            adj_sl, _ = adjust_stops_to_stoplevel(symbol, action_type, result.price, sl, 0, sym_info, force_stops_level=300)
                                            modify_req["sl"] = adj_sl
                                            modify_req["tp"] = 0.0
                                            mod_res = mt5.order_send(modify_req)
                                            if mod_res is not None and mod_res.retcode == mt5.TRADE_RETCODE_DONE:
                                                print(f"✔ Dynamic SL successfully applied with wider adjustment (TP = 0.0) to Position #{pos_ticket}!")
                                            else:
                                                final_err = getattr(mod_res, "comment", "") if mod_res else "None"
                                                print(f"❌ Dynamic SL fallback modification also failed: {final_err}. Requires manual or stealth SL/TP.")
                                else:
                                    print(f"✔ Dynamic SL/TP successfully applied to Position #{pos_ticket}!")

                        if result is None:
                            print("❌ Order send call returned None.")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": symbol,
                                "error": "Order send call returned None from MT5 terminal.",
                                "retcode": -1
                            }
                            await websocket.send(json.dumps(fail_msg))
                        elif result.retcode != mt5.TRADE_RETCODE_DONE:
                            error_comment = getattr(result, "comment", "") or str(result)
                            print(f"❌ Order failed. MT5 Retcode: {result.retcode}. Error details: {error_comment}")
                            if result.retcode == 10026 or "10026" in str(result.retcode):
                                print("\\n⚠️  [TROUBLESHOOTING RETCODE 10026 - AUTOTRADING DISABLED BY SERVER]")
                                print("👉 REASON 1: You logged into MetaTrader 5 using the INVESTOR (read-only) password!")
                                print("   FIX: Log out of your MT5 account, and log in again using the MASTER trading password.")
                                print("👉 REASON 2: Automated algorithmic trades are disallowed on your specific broker account tier.")
                                print("   FIX: Go to your broker portal settings (e.g., Exness, IC Markets client cabinet) and enable Expert Advisors/Algo trading permissions.")
                                print("👉 REASON 3: Algo Trading toggle inside MT5 is disabled.")
                                print("   FIX: Make sure the 'Algo Trading' button in the MT5 top toolbar is turned ON (green arrow showing active state).\\n")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": symbol,
                                "error": error_comment,
                                "retcode": result.retcode
                            }
                            await websocket.send(json.dumps(fail_msg))
                        else:
                            print(f"✔ Order filled successfully! Live Ticket: #{result.order} filled at {result.price}")
                            # Report fill confirmation back over socket
                            confirm_msg = {
                                "action": "FILL_CONFIRM",
                                "id": payload.get("id"),
                                "ticket": str(result.order),
                                "symbol": symbol,
                                "volume": volume,
                                "retcode": result.retcode
                            }
                            await websocket.send(json.dumps(confirm_msg))
                            print("✔ Dispatched confirmation back to webapp.")
                            
                    elif payload.get("action") == "ORDER_MODIFY":
                        ticket_str = payload.get("ticket") or payload.get("tradeId")
                        if not ticket_str:
                            print("❌ Cannot modify: Position Ticket not specified in signal.")
                            continue
                        
                        # Extract digits only to avoid crashes on non-numeric IDs
                        digits_only = "".join(c for c in str(ticket_str) if c.isdigit())
                        if not digits_only:
                            print(f"❌ Cannot modify: Position ID '{ticket_str}' has not been assigned a live numeric ticket yet on MT5.")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": payload.get("symbol"),
                                "error": f"Position ticket '{ticket_str}' has no numeric values. Ensure trade is filled on MT5 broker side first.",
                                "retcode": -1
                            }
                            await websocket.send(json.dumps(fail_msg))
                            continue
                        
                        ticket = int(digits_only)
                        sl = float(payload.get("sl", 0))
                        tp = float(payload.get("tp", 0))
                        symbol = payload.get("symbol")
                        
                        # Verify active position to map actual symbol
                        pos = mt5.positions_get(ticket=ticket)
                        if not pos or len(pos) == 0:
                            all_pos = mt5.positions_get()
                            if all_pos:
                                matched_pos = [p for p in all_pos if getattr(p, "ticket", None) == ticket or getattr(p, "identifier", None) == ticket]
                                if matched_pos:
                                    pos = matched_pos

                        if not pos or len(pos) == 0:
                            print(f"❌ Position #{ticket} is not active in MT5 terminal. Skipping modify request.")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": symbol,
                                "error": f"Position #{ticket} was not found active in MT5 terminal. Skipping.",
                                "retcode": 10013
                            }
                            await websocket.send(json.dumps(fail_msg))
                            continue
                            
                        symbol = pos[0].symbol
                        sym_info = mt5.symbol_info(symbol) if symbol else None
                        digits = sym_info.digits if sym_info else 5
                        pos_type = pos[0].type
                        current_price = pos[0].price_current
                        
                        if sl > 0 or tp > 0:
                            sl, tp = adjust_stops_to_stoplevel(symbol, pos_type, current_price, sl, tp, sym_info)
                        
                        request = {
                            "action": mt5.TRADE_ACTION_SLTP,
                            "position": ticket,
                            "sl": sl,
                            "tp": tp,
                        }
                        if symbol:
                            request["symbol"] = symbol
                            
                        print(f"👉 Syncing SL/TP for Position #{ticket}: SL={sl}, TP={tp}...")
                        result = mt5.order_send(request)
                        if result is None:
                            print("❌ Modify parameters returned None.")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": symbol,
                                "error": "Modify call returned None from MT5 terminal.",
                                "retcode": -1
                            }
                            await websocket.send(json.dumps(fail_msg))
                        elif result.retcode != mt5.TRADE_RETCODE_DONE:
                            error_comment = getattr(result, "comment", "") or str(result)
                            print(f"❌ SL/TP Sync failed. MT5 Retcode: {result.retcode}. Error: {error_comment}")
                            
                            # Fallback 1: If rejected because of stop level, retry setting ONLY SL (TP = 0.0)
                            if result.retcode in [10016, 10013] and tp > 0:
                                print("🔄 Retrying ORDER_MODIFY setting ONLY SL (TP = 0.0) to safeguard stop loss...")
                                request["tp"] = 0.0
                                result = mt5.order_send(request)
                                if result is not None and result.retcode == mt5.TRADE_RETCODE_DONE:
                                    print(f"✔ Dynamic SL modification successfully applied (without TP) after fallback!")
                                    continue
                                    
                            # Fallback 2: Retry with wider SL stop level buffer and TP = 0.0
                            if result is None or result.retcode != mt5.TRADE_RETCODE_DONE:
                                if result is not None and result.retcode in [10016, 10013]:
                                    print("🔄 Retrying ORDER_MODIFY with wider fallback StopLevel buffer (300 points) and TP = 0.0...")
                                    adj_sl, _ = adjust_stops_to_stoplevel(symbol, pos_type, current_price, sl, 0, sym_info, force_stops_level=300)
                                    request["sl"] = adj_sl
                                    request["tp"] = 0.0
                                    result = mt5.order_send(request)
                                    if result is not None and result.retcode == mt5.TRADE_RETCODE_DONE:
                                        print(f"✔ Dynamic SL modification successfully applied with wider adjustment!")
                                        continue
                                        
                            # If it still failed, send fail confirmation message
                            err_com = getattr(result, "comment", "") if result else "None"
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": symbol,
                                "error": f"SL/TP Sync failed: {err_com}",
                                "retcode": getattr(result, "retcode", -1) if result else -1
                            }
                            await websocket.send(json.dumps(fail_msg))
                        else:
                            print(f"✔ Auto SL/TP sync complete! Position #{ticket} updated to SL={sl}, TP={tp}")
                            
                    elif payload.get("action") == "ORDER_CLOSE":
                        ticket_str = payload.get("ticket") or payload.get("tradeId")
                        if not ticket_str:
                            print("❌ Cannot close: Position Ticket not specified in signal.")
                            continue
                            
                        # Extract digits only to avoid crashes on non-numeric IDs
                        digits_only = "".join(c for c in str(ticket_str) if c.isdigit())
                        if not digits_only:
                            print(f"❌ Cannot close: Position ID '{ticket_str}' has not been assigned a live numeric ticket yet on MT5.")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": payload.get("symbol"),
                                "error": f"Position ticket '{ticket_str}' has no numeric values. Ensure trade is filled on MT5 broker side first.",
                                "retcode": -1
                            }
                            await websocket.send(json.dumps(fail_msg))
                            continue
                            
                        ticket = int(digits_only)
                        symbol = payload.get("symbol")
                        volume = float(payload.get("volume", 0.1))
                        action_type = payload.get("type")
                        
                        pos = mt5.positions_get(ticket=ticket)
                        if not pos or len(pos) == 0:
                            all_pos = mt5.positions_get()
                            if all_pos:
                                matched_pos = [p for p in all_pos if getattr(p, "ticket", None) == ticket or getattr(p, "identifier", None) == ticket]
                                if matched_pos:
                                    pos = matched_pos

                        if pos and len(pos) > 0:
                            p_info = pos[0]
                            symbol = p_info.symbol
                            volume = p_info.volume
                            close_type = mt5.ORDER_TYPE_SELL if p_info.type == 0 else mt5.ORDER_TYPE_BUY
                        else:
                            close_type = mt5.ORDER_TYPE_SELL if action_type == "BUY" else mt5.ORDER_TYPE_BUY
                            
                        tick_info = mt5.symbol_info_tick(symbol)
                        price = tick_info.bid if close_type == mt5.ORDER_TYPE_SELL else tick_info.ask
                        
                        request = {
                            "action": mt5.TRADE_ACTION_DEAL,
                            "symbol": symbol,
                            "volume": volume,
                            "type": close_type,
                            "position": ticket,
                            "price": price,
                            "deviation": 20,
                            "magic": 921048,
                            "comment": "Algo-Bridge Option 3 Direct Close",
                            "type_time": mt5.ORDER_TIME_GTC,
                            "type_filling": mt5.ORDER_FILLING_IOC,
                        }
                        
                        print(f"👉 Processing close signal for Position #{ticket} ({symbol} {volume} lots)...")
                        result = mt5.order_send(request)
                        if result is None:
                            print("❌ Order close call returned None.")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": symbol,
                                "error": "Close call returned None from MT5 terminal.",
                                "retcode": -1
                            }
                            await websocket.send(json.dumps(fail_msg))
                        elif result.retcode != mt5.TRADE_RETCODE_DONE:
                            error_comment = getattr(result, "comment", "") or str(result)
                            print(f"❌ Position close failed. MT5 Retcode: {result.retcode}. Error: {error_comment}")
                            fail_msg = {
                                "action": "FILL_FAIL",
                                "id": payload.get("id"),
                                "symbol": symbol,
                                "error": error_comment,
                                "retcode": result.retcode
                            }
                            await websocket.send(json.dumps(fail_msg))
                        else:
                            print(f"✔ Position #{ticket} closed successfully!")
                            
        except Exception as e:
            print(f"❌ Tunnel connection error: {e}")
            print("🔄 Attempting automatic reconnection in 5 seconds...")
            await asyncio.sleep(5)

if __name__ == "__main__":
    try:
        asyncio.run(handle_signals())
    except KeyboardInterrupt:
        print("Tunnel closed by user.")`;

                      navigator.clipboard.writeText(code);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="flex items-center gap-1.5 py-1 px-2.5 bg-zinc-900 border border-zinc-850 rounded hover:bg-zinc-800 text-[10px] text-zinc-300 hover:text-white transition-all cursor-pointer font-bold"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span className="text-emerald-450">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3 text-zinc-400" />
                        <span>Copy Python Script</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="p-3 font-mono text-[9px] text-zinc-400 text-left overflow-x-auto select-all leading-relaxed max-h-[190px] bg-zinc-950/80">
                  <pre>{`import asyncio
import websockets
import json
import MetaTrader5 as mt5
import urllib.parse

# ====================================================================
# CONFIGURATION INPUTS (Option 3 Setup - RECONNECTING BRIDGE)
# ====================================================================
ServerUrl    = "https://live-trading-analysis-webapp-581259014748.asia-southeast1.run.app"
ApiToken     = "tok_ea_921048_active"
MT5_Login    = ${dbLogin || "None"}
MT5_Password = "${dbPassword || ""}"
MT5_Server   = "${dbServer || ""}"
# ====================================================================

# Executes direct trades using MetaTrader5 with automatic 5-second websocket reconnection logic.`}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Option 3: Direct Broker Logs Tab */}
      {activeTab === "DIRECT_BROKER_LOGS" && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 text-left space-y-4">
          <div className="flex justify-between items-center border-b border-zinc-900 pb-2.5">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Direct Broker Auto-Copy Execution Logs
              </span>
              <p className="text-[10.5px] text-zinc-500 mt-0.5 font-sans">
                Real-time cloud routing messages, order ticket mappings, and connection events.
              </p>
            </div>
            <button
              onClick={async () => {
                await onUpdateConfig({
                  directBrokerLogs: ["[Direct API Gate] Logs reset. Copier active."]
                });
              }}
              className="py-1 px-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded font-sans text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer select-none"
            >
              Clear Logs
            </button>
          </div>

          <div className="bg-black/40 border border-zinc-900 rounded-xl p-4 font-mono text-[10.5px] leading-relaxed text-zinc-400 max-h-[450px] overflow-y-auto space-y-2">
            {state.config.directBrokerLogs && state.config.directBrokerLogs.length > 0 ? (
              state.config.directBrokerLogs.map((log: string, idx: number) => {
                let textCol = "text-zinc-400";
                if (log.includes("SUCCESS")) textCol = "text-emerald-400";
                else if (log.includes("ENABLED") || log.includes("DISABLED")) textCol = "text-amber-400 font-bold";
                else if (log.includes("FAILED") || log.includes("ERROR")) textCol = "text-rose-400 font-extrabold";
                return (
                  <div key={idx} className={`pb-1.5 border-b border-zinc-900/50 last:border-0 ${textCol}`}>
                    {log}
                  </div>
                );
              })
            ) : (
              <div className="text-zinc-500 text-center py-8 font-sans">
                No copy-trading execution logs registered yet. Trigger a signal or place a manual trade to view REST handshakes.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Setup Guide */}
      {activeTab === "GUIDE" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Guide Steps */}
            <div className="md:col-span-2 rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-4">
              <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
                Download and Setup Guide
              </span>

              <div className="space-y-3 font-sans text-xs text-zinc-350 leading-relaxed">
                <div className="flex gap-3">
                  <div className="h-5 w-5 bg-zinc-900 border border-zinc-805 rounded flex items-center justify-center font-bold text-white shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <h6 className="font-bold text-zinc-200 block">Copy or Download ReplitBotBridge Code</h6>
                    <p className="mt-0.5">Copy the provided Expert Advisor structural template script on the right side panel.</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-5 w-5 bg-zinc-900 border border-zinc-805 rounded flex items-center justify-center font-bold text-white shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <h6 className="font-bold text-zinc-200 block">Create and Compile Expert Advisor inside MT5</h6>
                    <p className="mt-0.5">In MetaTrader 5 Terminal, select `Tools` &gt; `MetaQuotes Language Editor` (F4). Click `New` &gt; `Expert Advisor (template)` &gt; Title: `ReplitBotBridge`. Paste the concept code block, replace fields if required, and click `Compile` (F7).</p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-5 w-5 bg-zinc-900 border border-zinc-805 rounded flex items-center justify-center font-bold text-white shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <h6 className="font-bold text-zinc-200 block">Authorize External WebRequest Allowlist URL</h6>
                    <p className="mt-0.5">In your MT5 terminal: go to `Tools` &gt; `Options` &gt; select `Expert Advisors` tab. Toggle checkbox **"Allow WebRequest for listed URL"**, click add button, and paste this exact webapp origin address:</p>
                    
                    <div className="flex items-center gap-2 mt-2 select-all font-mono text-[10.5px] bg-zinc-900 px-3 py-1.5 border border-zinc-850 rounded text-sky-400">
                      <span>{productionOrigin}</span>
                      <button
                        onClick={handleCopyUrl}
                        className="ml-auto text-zinc-400 hover:text-white cursor-pointer"
                        title="Copy base URL"
                      >
                        {copiedUrl ? "Copied" : "Copy"}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="h-5 w-5 bg-zinc-900 border border-zinc-805 rounded flex items-center justify-center font-bold text-white shrink-0 mt-0.5">
                    4
                  </div>
                  <div>
                    <h6 className="font-bold text-zinc-200 block">Attach EA and Enter API Token Input Parameter</h6>
                    <p className="mt-0.5">Drag `ReplitBotBridge` from the Navigator panel on to your preferred live chart (e.g. BTCUSD, M15). Inside the Expert Advisor properties dialog: enter the API Token generated on the Connections tab into the inputs parameter, and enable **"Allow Algo Trading"** checkbox.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Script viewer inside Guide */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <span className="font-display font-semibold text-xs text-white uppercase flex items-center gap-1.5">
                  <Code className="h-4 w-4 text-emerald-450" />
                  ReplitBotBridge.mq5 (Script)
                </span>
                <button
                  onClick={handleCopyCode}
                  className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] select-none cursor-pointer"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>

              <pre className="rounded border border-zinc-900 bg-black/50 p-3 overflow-x-auto text-[9px] font-mono leading-normal text-zinc-400 max-h-72 overflow-y-auto cursor-pointer">
                {mqlCode}
              </pre>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
