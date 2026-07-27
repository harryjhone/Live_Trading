import React, { useState } from "react";
import { FullAppState, SymbolType } from "../types";
import { Settings, Save, AlertTriangle, Play, Pause, AlertOctagon, Info, Sparkles, CheckSquare, Square, Check, ToggleLeft, ToggleRight, MessageSquare, Send, Download, Upload, Database, RefreshCw, Layers, Link, LineChart, Users, Bell } from "lucide-react";

import MT5ConnectorView from "./MT5ConnectorView";
import BacktestingView from "./BacktestingView";
import SaaSAdminView from "./SaaSAdminView";
import SubscriberBillingView from "./SubscriberBillingView";
import { VisualToggle } from "./VisualToggle";

interface SettingsViewProps {
  state: FullAppState;
  onUpdateConfig: (data: any) => Promise<void>;
  onResetState: () => Promise<void>;
  onRefresh?: () => Promise<void>;
  onRestartWalkthrough?: () => void;
  onSwitchTenant?: (tenantId: string) => Promise<void>;
  initialTab?: "general" | "backtest" | "mt5" | "subscriber" | "profile" | "billing" | "admin" | "notifications";
  soundAlertsEnabled?: boolean;
  onToggleSoundAlerts?: (val: boolean) => void;
  onPlayTestSound?: (type: "entry" | "sl" | "tp") => void;
  theme?: "dark" | "light";
}

export default function SettingsView({ 
  state, 
  onUpdateConfig, 
  onResetState, 
  onRefresh, 
  onRestartWalkthrough,
  onSwitchTenant,
  initialTab,
  soundAlertsEnabled,
  onToggleSoundAlerts,
  onPlayTestSound,
  theme
}: SettingsViewProps) {
  const [isSuperAdmin] = useState<boolean>(() => {
    return localStorage.getItem("quant_is_super_admin") === "true";
  });

  const [activeTab, setActiveTab] = useState<"general" | "backtest" | "mt5" | "subscriber" | "notifications">(() => {
    if (initialTab === "profile" || initialTab === "billing" || initialTab === "admin") {
      return "subscriber";
    }
    return (initialTab as any) || "general";
  });

  React.useEffect(() => {
    if (initialTab) {
      if (initialTab === "profile" || initialTab === "billing" || initialTab === "admin") {
        setActiveTab("subscriber");
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab]);

  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);

  // Config state keys mapping to local state for editable inputs
  const [balance, setBalance] = useState<number>(state.config.balance || 1000);
  const [riskMode, setRiskMode] = useState<"PERCENT" | "FIXED">((state.config.riskMode as any) === "DYNAMIC" ? "FIXED" : (state.config.riskMode || "FIXED"));
  const [profitLockTightness, setProfitLockTightness] = useState<"CONSERVATIVE" | "STANDARD" | "WIDE" | "OFF">(state.config.profitLockTightness || "STANDARD");
  const [virtualSlTpEnabled, setVirtualSlTpEnabled] = useState<boolean>(state.config.virtualSlTpEnabled !== false);
  const [riskPerTrade, setRiskPerTrade] = useState<number>(state.config.riskPerTrade || 1.0);
  const [lotSize, setLotSize] = useState<number>(state.config.lotSize || 0.1);
  const [leverage, setLeverage] = useState<number>(state.config.leverage || 500);
  const [maxDailyDrawdown, setMaxDailyDrawdown] = useState<number>(state.config.maxDailyDrawdown || 5.0);
  const [displayTimeframe, setDisplayTimeframe] = useState<"M1" | "M5" | "M15" | "H1" | "H4" | "D1">(state.config.displayTimeframe || "M15");
  const [scannerTargetMode, setScannerTargetMode] = useState<"ALL_MONITORED" | "DISPLAY_ONLY">(state.config.scannerTargetMode || "ALL_MONITORED");

  // Array of timeframes for checkbox lists
  const [executionTimeframes, setExecutionTimeframes] = useState<string[]>(state.config.executionTimeframes || ["M15"]);
  
  // Map of enabled pairs
  const [enabledPairs, setEnabledPairs] = useState<Record<SymbolType, boolean>>(
    state.config.enabledPairs || {
      BTCUSD: true,
      EURUSD: true,
      GBPUSD: true,
      AAPL: true,
      SPX500: true,
      XAUUSD: true
    }
  );

  // Active Strategies list
  const [activeStrategies, setActiveStrategies] = useState<string[]>(state.config.activeStrategies || ["EMA_CROSS", "TIME_RANGE"]);
  
  // Trading Scheduled Days
  const [tradingDays, setTradingDays] = useState<string[]>(state.config.tradingDays || ["MON", "TUE", "WED", "THU", "FRI"]);

  // Pre-News Automated Exits
  const [preNewsAutoCloseEnabled, setPreNewsAutoCloseEnabled] = useState<boolean>(!!state.config.preNewsAutoCloseEnabled);
  const [preNewsAutoCloseMinutes, setPreNewsAutoCloseMinutes] = useState<number>(state.config.preNewsAutoCloseMinutes || 30);
  const [preNewsAutoClosePct, setPreNewsAutoClosePct] = useState<number>(state.config.preNewsAutoClosePct || 100);

  // Index ATR-Trailing Stop-Loss
  const [indexAtrTrailingLockEnabled, setIndexAtrTrailingLockEnabled] = useState<boolean>(!!state.config.indexAtrTrailingLockEnabled);
  const [indexAtrTrailingLockMultiplier, setIndexAtrTrailingLockMultiplier] = useState<number>(state.config.indexAtrTrailingLockMultiplier || 2.0);

  // Pyramiding Enable
  const [pyramidingEnabled, setPyramidingEnabled] = useState<boolean>(!!state.config.pyramidingEnabled);
  
  // Alerts
  const [telegramAlertsEnabled, setTelegramAlertsEnabled] = useState<boolean>(state.config.telegramAlertsEnabled);
  
  // Bot Pause Switch
  const [botPaused, setBotPaused] = useState<boolean>(state.config.botPaused);

  const [enabledBlockers, setEnabledBlockers] = useState<Record<string, boolean>>(() => {
    return state.config.enabledBlockers || {
      "news-lock": true,
      "session-lock": true,
      "hour-blackout": true,
      "day-cooldown": true,
      "strategy-chop-guard": true,
      "chop-gate": true,
      "cooldown": true,
      "open-lock": true,
      "daily-drawdown-lock": true,
      "exposure-cap-lock": true,
      "spike-guard": true,
      "htf-trend-alignment": true,
      "dynamic-pattern-safeguard": false,
      "msb-retest-safeguard": false,
      "order-block-imbalance": false
    };
  });

  // Telegram Signal Gateway state variables
  const [telegramReceiverToken, setTelegramReceiverToken] = useState<string>(state.config.telegramReceiverToken || "");
  const [telegramReceiverChatId, setTelegramReceiverChatId] = useState<string>(state.config.telegramReceiverChatId || "");
  const [telegramReceiverActive, setTelegramReceiverActive] = useState<boolean>(!!state.config.telegramReceiverActive);
  const [telegramAutoMirror, setTelegramAutoMirror] = useState<boolean>(!!state.config.telegramAutoMirror);

  // Live tester simulation helper state
  const [testMessageText, setTestMessageText] = useState<string>("🔔 Telegram Signal: BUY Gold @ 2351.55 SL=2320 TP=2410");
  const [testPosting, setTestPosting] = useState<boolean>(false);
  const [testSuccess, setTestSuccess] = useState<boolean>(false);

  // MT5 server config elements
  const [mt5Server, setMt5Server] = useState<string>(state.mt5Config.server || "VantageGlobal-Demo");
  const [mt5Login, setMt5Login] = useState<string>(state.mt5Config.login || "84920211");
  const [mt5Password, setMt5Password] = useState<string>(state.mt5Config.password || "");
  const [mt5Port, setMt5Port] = useState<number>(state.mt5Config.port || 3001);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>("");
  const [pairAlert, setPairAlert] = useState<string>("");

  // Auto-sync configuration and trade ledger state to the browser session for persistent redeployments
  const [autoSyncState, setAutoSyncState] = useState<boolean>(() => {
    return localStorage.getItem("quant_terminal_autosync") !== "false";
  });

  const [hasBackupToRestore, setHasBackupToRestore] = useState<boolean>(false);

  React.useEffect(() => {
    localStorage.setItem("quant_terminal_autosync", autoSyncState ? "true" : "false");
  }, [autoSyncState]);

  React.useEffect(() => {
    if (autoSyncState && state && (state.trades.length > 0 || state.config.balance !== 1000)) {
      localStorage.setItem("quant_terminal_production_state_v1", JSON.stringify(state));
    }
  }, [state, autoSyncState]);

  React.useEffect(() => {
    const backupStr = localStorage.getItem("quant_terminal_production_state_v1");
    if (backupStr) {
      try {
        const backupData = JSON.parse(backupStr);
        // If server trades array is empty but browser has saved trades, we can restore it!
        if (state.trades.length === 0 && backupData.trades && backupData.trades.length > 0) {
          setHasBackupToRestore(true);
        } else {
          setHasBackupToRestore(false);
        }
      } catch (e) {
        // ignore
      }
    }
  }, [state]);

  const handleAutoRestoreBackup = async () => {
    setSubmitting(true);
    setMessage("Restoring from browser session storage...");
    try {
      const backupStr = localStorage.getItem("quant_terminal_production_state_v1");
      if (!backupStr) return;
      const backupData = JSON.parse(backupStr);

      const res = await fetch("/api/state/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ importedState: backupData })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessage("Configuration & previous trades fully restored successfully.");
          setHasBackupToRestore(false);
          if (onRefresh) {
            await onRefresh();
          }
        } else {
          setMessage("Auto-restoration failed on server.");
        }
      } else {
        setMessage("Transmission failed.");
      }
    } catch (err: any) {
      setMessage(`Restoration error: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportStateJson = () => {
    try {
      const exportPayload = {
        config: state.config,
        trades: state.trades,
        signals: state.signals,
        telegramAlerts: state.telegramAlerts,
        mt5Config: state.mt5Config
      };
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `quant_terminal_production_backup_${new Date().toISOString().split("T")[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setMessage("Configuration & trade ledger downloaded.");
      setTimeout(() => setMessage(""), 4000);
    } catch (err) {
      setMessage("Failed to export state file.");
    }
  };

  const handleImportStateJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const targetFile = e.target.files?.[0];
    if (!targetFile) return;

    fileReader.onload = async (event) => {
      try {
        const fileContent = event.target?.result as string;
        const parsedData = JSON.parse(fileContent);
        
        if (!parsedData.config && !parsedData.trades) {
          alert("Invalid backup schema. File must contain config or trades records.");
          return;
        }

        setSubmitting(true);
        setMessage("Uploading and processing state backup...");
        const res = await fetch("/api/state/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ importedState: parsedData })
        });

        if (res.ok) {
          const resData = await res.json();
          if (resData.success) {
            setMessage("Backup file applied and production ledger successfully synced.");
            if (onRefresh) {
              await onRefresh();
            }
          } else {
            setMessage("Server error processing state file restore.");
          }
        } else {
          setMessage("Handshake failed during state transmission.");
        }
      } catch (err: any) {
        alert(`Error parsing backup file: ${err.message || err}`);
      } finally {
        setSubmitting(false);
      }
    };
    fileReader.readAsText(targetFile);
  };

  // Activity tracking timestamp to prevent background poll overwriting what user is actively working on
  const lastActivityRef = React.useRef<number>(0);

  const recordActivity = () => {
    lastActivityRef.current = Date.now();
  };

  // Sync state reactively when prop state changes, but ONLY if there was no user activity in the last 4 seconds
  React.useEffect(() => {
    if (Date.now() - lastActivityRef.current < 4000) {
      return;
    }
    setBalance(state.config.balance || 1000);
    setRiskMode((state.config.riskMode as any) === "DYNAMIC" ? "FIXED" : (state.config.riskMode || "FIXED"));
    setProfitLockTightness(state.config.profitLockTightness || "STANDARD");
    setVirtualSlTpEnabled(state.config.virtualSlTpEnabled !== false);
    setRiskPerTrade(state.config.riskPerTrade || 1.0);
    setLotSize(state.config.lotSize || 0.1);
    setLeverage(state.config.leverage || 500);
    setMaxDailyDrawdown(state.config.maxDailyDrawdown || 5.0);
    setDisplayTimeframe(state.config.displayTimeframe || "M15");
    setScannerTargetMode(state.config.scannerTargetMode || "ALL_MONITORED");
    setExecutionTimeframes(state.config.executionTimeframes || ["M15"]);
    setEnabledPairs(state.config.enabledPairs || {
      BTCUSD: true,
      EURUSD: true,
      GBPUSD: true,
      AAPL: true,
      SPX500: true,
      XAUUSD: true
    });
    setActiveStrategies(state.config.activeStrategies || ["EMA_CROSS", "TIME_RANGE"]);
    setTradingDays(state.config.tradingDays || ["MON", "TUE", "WED", "THU", "FRI"]);
    setTelegramAlertsEnabled(state.config.telegramAlertsEnabled);
    setBotPaused(state.config.botPaused);
    setTelegramReceiverToken(state.config.telegramReceiverToken || "");
    setTelegramReceiverChatId(state.config.telegramReceiverChatId || "");
    setTelegramReceiverActive(!!state.config.telegramReceiverActive);
    setTelegramAutoMirror(!!state.config.telegramAutoMirror);
    setEnabledBlockers(state.config.enabledBlockers || {
      "news-lock": true,
      "session-lock": true,
      "hour-blackout": true,
      "day-cooldown": true,
      "strategy-chop-guard": true,
      "chop-gate": true,
      "cooldown": true,
      "open-lock": true,
      "daily-drawdown-lock": true,
      "exposure-cap-lock": true,
      "spike-guard": true,
      "htf-trend-alignment": true,
      "dynamic-pattern-safeguard": false,
      "msb-retest-safeguard": false,
      "order-block-imbalance": false
    });
    setMt5Server(state.mt5Config.server || "VantageGlobal-Demo");
    setMt5Login(state.mt5Config.login || "84920211");
    setMt5Password(state.mt5Config.password || "");
    setMt5Port(state.mt5Config.port || 3001);
    setPreNewsAutoCloseEnabled(!!state.config.preNewsAutoCloseEnabled);
    setPreNewsAutoCloseMinutes(state.config.preNewsAutoCloseMinutes || 30);
    setPreNewsAutoClosePct(state.config.preNewsAutoClosePct || 100);
    setIndexAtrTrailingLockEnabled(!!state.config.indexAtrTrailingLockEnabled);
    setIndexAtrTrailingLockMultiplier(state.config.indexAtrTrailingLockMultiplier || 2.0);
    setPyramidingEnabled(!!state.config.pyramidingEnabled);
  }, [state]);

  // Unified dynamic update function supporting both on-change and on-blur triggers
  const submitUpdate = async (overrides: any = {}) => {
    setSubmitting(true);
    try {
      let targetBalance = overrides.balance !== undefined ? Number(overrides.balance) : Number(balance);
      let autoTopUpTriggered = false;
      while (targetBalance < 1000) {
        targetBalance += 10000;
        autoTopUpTriggered = true;
      }
      if (autoTopUpTriggered) {
        setBalance(targetBalance);
      }

      const payload = {
        balance: targetBalance,
        riskMode: overrides.riskMode !== undefined ? overrides.riskMode : riskMode,
        profitLockTightness: overrides.profitLockTightness !== undefined ? overrides.profitLockTightness : profitLockTightness,
        virtualSlTpEnabled: overrides.virtualSlTpEnabled !== undefined ? overrides.virtualSlTpEnabled : virtualSlTpEnabled,
        riskPerTrade: overrides.riskPerTrade !== undefined ? Number(overrides.riskPerTrade) : Number(riskPerTrade),
        lotSize: overrides.lotSize !== undefined ? Number(overrides.lotSize) : Number(lotSize),
        leverage: overrides.leverage !== undefined ? Number(overrides.leverage) : Number(leverage),
        maxDailyDrawdown: overrides.maxDailyDrawdown !== undefined ? Number(overrides.maxDailyDrawdown) : Number(maxDailyDrawdown),
        displayTimeframe: overrides.displayTimeframe !== undefined ? overrides.displayTimeframe : displayTimeframe,
        executionTimeframes: overrides.executionTimeframes !== undefined ? overrides.executionTimeframes : executionTimeframes,
        scannerTargetMode: overrides.scannerTargetMode !== undefined ? overrides.scannerTargetMode : scannerTargetMode,
        enabledPairs: overrides.enabledPairs !== undefined ? overrides.enabledPairs : enabledPairs,
        activeStrategies: overrides.activeStrategies !== undefined ? overrides.activeStrategies : activeStrategies,
        tradingDays: overrides.tradingDays !== undefined ? overrides.tradingDays : tradingDays,
        telegramAlertsEnabled: overrides.telegramAlertsEnabled !== undefined ? overrides.telegramAlertsEnabled : telegramAlertsEnabled,
        botPaused: overrides.botPaused !== undefined ? overrides.botPaused : botPaused,
        telegramReceiverToken: overrides.telegramReceiverToken !== undefined ? overrides.telegramReceiverToken : telegramReceiverToken,
        telegramReceiverChatId: overrides.telegramReceiverChatId !== undefined ? overrides.telegramReceiverChatId : telegramReceiverChatId,
        telegramReceiverActive: overrides.telegramReceiverActive !== undefined ? overrides.telegramReceiverActive : telegramReceiverActive,
        telegramAutoMirror: overrides.telegramAutoMirror !== undefined ? overrides.telegramAutoMirror : telegramAutoMirror,
        enabledBlockers: overrides.enabledBlockers !== undefined ? overrides.enabledBlockers : enabledBlockers,
        preNewsAutoCloseEnabled: overrides.preNewsAutoCloseEnabled !== undefined ? overrides.preNewsAutoCloseEnabled : preNewsAutoCloseEnabled,
        preNewsAutoCloseMinutes: overrides.preNewsAutoCloseMinutes !== undefined ? Number(overrides.preNewsAutoCloseMinutes) : Number(preNewsAutoCloseMinutes),
        preNewsAutoClosePct: overrides.preNewsAutoClosePct !== undefined ? Number(overrides.preNewsAutoClosePct) : Number(preNewsAutoClosePct),
        indexAtrTrailingLockEnabled: overrides.indexAtrTrailingLockEnabled !== undefined ? overrides.indexAtrTrailingLockEnabled : indexAtrTrailingLockEnabled,
        indexAtrTrailingLockMultiplier: overrides.indexAtrTrailingLockMultiplier !== undefined ? Number(overrides.indexAtrTrailingLockMultiplier) : Number(indexAtrTrailingLockMultiplier),
        pyramidingEnabled: overrides.pyramidingEnabled !== undefined ? overrides.pyramidingEnabled : pyramidingEnabled,
        server: overrides.server !== undefined ? overrides.server : mt5Server,
        login: overrides.login !== undefined ? overrides.login : mt5Login,
        password: overrides.password !== undefined ? overrides.password : mt5Password,
        port: overrides.port !== undefined ? Number(overrides.port) : Number(mt5Port)
      };
      await onUpdateConfig(payload);
    } catch (err) {
      console.error("Error setting dynamic configuration parameter:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage("");

    try {
      lastActivityRef.current = 0; // Clear activity immediately so the returned state from server is accepted
      let targetBalance = Number(balance);
      let autoTopUpTriggered = false;
      while (targetBalance < 1000) {
        targetBalance += 10000;
        autoTopUpTriggered = true;
      }
      if (autoTopUpTriggered) {
        setBalance(targetBalance);
      }

      await onUpdateConfig({
        balance: targetBalance,
        riskMode,
        profitLockTightness,
        virtualSlTpEnabled,
        riskPerTrade: Number(riskPerTrade),
        lotSize: Number(lotSize),
        leverage: Number(leverage),
        maxDailyDrawdown: Number(maxDailyDrawdown),
        displayTimeframe,
        executionTimeframes,
        scannerTargetMode,
        enabledPairs,
        activeStrategies,
        tradingDays,
        telegramAlertsEnabled,
        botPaused,
        telegramReceiverToken,
        telegramReceiverChatId,
        telegramReceiverActive,
        telegramAutoMirror,
        enabledBlockers,
        preNewsAutoCloseEnabled,
        preNewsAutoCloseMinutes: Number(preNewsAutoCloseMinutes),
        preNewsAutoClosePct: Number(preNewsAutoClosePct),
        indexAtrTrailingLockEnabled,
        indexAtrTrailingLockMultiplier: Number(indexAtrTrailingLockMultiplier),
        pyramidingEnabled,
        server: mt5Server,
        login: mt5Login,
        password: mt5Password,
        port: Number(mt5Port)
      });
      setMessage("Operator parameters successfully saved.");
      setTimeout(() => setMessage(""), 3500);
    } catch (err) {
      setMessage("Error updating operator configs.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetClick = () => {
    setShowResetConfirmModal(true);
  };

  const handleConfirmReset = async () => {
    setShowResetConfirmModal(false);
    setSubmitting(true);
    setMessage("");
    try {
      await onResetState();
      setMessage("Database successfully wiped and reset.");
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setMessage("Error performing database reset.");
    } finally {
      setSubmitting(false);
    }
  };

  const togglePair = (pair: SymbolType) => {
    recordActivity();
    const willEnable = !enabledPairs[pair];
    if (willEnable) {
      const activeCount = Object.values(enabledPairs).filter(Boolean).length;
      if (activeCount >= 20) {
        setPairAlert("Asset Restriction: A maximum of 20 active assets can be chosen/enabled at any single time.");
        setTimeout(() => setPairAlert(""), 6000);
        return;
      }
    }
    setPairAlert("");
    const updated = {
      ...enabledPairs,
      [pair]: willEnable
    };
    setEnabledPairs(updated);
    submitUpdate({ enabledPairs: updated });
  };

  const toggleExecutionTimeframe = (tf: string) => {
    recordActivity();
    let nextTfs: string[];
    if (executionTimeframes.includes(tf)) {
      nextTfs = executionTimeframes.filter((t) => t !== tf);
    } else {
      nextTfs = [...executionTimeframes, tf];
    }
    setExecutionTimeframes(nextTfs);
    submitUpdate({ executionTimeframes: nextTfs });
  };

  const toggleActiveStrategy = (stratId: string) => {
    recordActivity();
    let nextStrats: string[];
    if (activeStrategies.includes(stratId)) {
      nextStrats = activeStrategies.filter((s) => s !== stratId);
    } else {
      nextStrats = [...activeStrategies, stratId];
    }
    setActiveStrategies(nextStrats);
    submitUpdate({ activeStrategies: nextStrats });
  };

  const toggleBlocker = (blockerId: string) => {
    recordActivity();
    const nextVal = enabledBlockers[blockerId] === false ? true : false;
    const nextBlockers = { ...enabledBlockers, [blockerId]: nextVal };
    setEnabledBlockers(nextBlockers);
    submitUpdate({ enabledBlockers: nextBlockers });
  };

  const toggleTradingDay = (day: string) => {
    recordActivity();
    let nextDays: string[];
    if (tradingDays.includes(day)) {
      nextDays = tradingDays.filter((d) => d !== day);
    } else {
      nextDays = [...tradingDays, day];
    }
    setTradingDays(nextDays);
    submitUpdate({ tradingDays: nextDays });
  };

  const allPairs: SymbolType[] = [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD",
    "BTCUSD", "ETHUSD", "SOLUSD", "BNBUSD",
    "AAPL", "TSLA", "MSFT", "NVDA",
    "XAUUSD", "USOIL", "XAGUSD", "NGAS",
    "SPX500", "NDX100", "DJI30", "GER40"
  ];
  const allTimeframes = ["M1", "M5", "M15", "H1", "H4", "D1"];
  const allStrategies = (state.strategies && state.strategies.length > 0)
    ? state.strategies.filter((s) => !s.deleted).map((s) => ({ id: s.id, name: s.name }))
    : [
        { id: "TIME_RANGE", name: "Time-Range Breakout" },
        { id: "EMA_CROSS", name: "Dual EMA Cross" }
      ];
  const allDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left">
      {/* Settings Header */}
      <div className="border-b border-zinc-900 pb-4 space-y-1">
        <h3 className="font-display text-xl font-black text-white flex items-center gap-2.5">
          <Settings className="h-5.5 w-5.5 text-emerald-400" />
          System Settings Area
        </h3>
        <p className="text-xs text-zinc-400">
          Configure risk parameters, simulate execution performance, link external broker platforms, backtest custom algorithms, and manage enterprise subscription details.
        </p>
      </div>

      {/* Custom Tabbed Child Menus Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-zinc-950/60 p-2 text-zinc-300 rounded-xl border border-zinc-900">
        <button
          type="button"
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
            activeTab === "general"
              ? "bg-zinc-900 text-white border-zinc-800 shadow"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/30 border-transparent"
          }`}
        >
          <Settings className="h-3.5 w-3.5 text-emerald-400" />
          General Sizing & Config
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("mt5")}
          className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
            activeTab === "mt5"
              ? "bg-zinc-900 text-white border-zinc-800 shadow"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/30 border-transparent"
          }`}
        >
          <Link className="h-3.5 w-3.5 text-emerald-400" />
          MT5 Broker Gateway
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("backtest")}
          className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
            activeTab === "backtest"
              ? "bg-zinc-900 text-white border-zinc-800 shadow"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/30 border-transparent"
          }`}
        >
          <LineChart className="h-3.5 w-3.5 text-emerald-400" />
          Algorithmic Backtester
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("subscriber")}
          className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
            activeTab === "subscriber"
              ? "bg-zinc-900 text-white border-zinc-800 shadow shadow-amber-500/5 hover:border-zinc-750"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/30 border-transparent"
          }`}
        >
          <Users className={`h-3.5 w-3.5 ${isSuperAdmin ? "text-amber-500" : "text-emerald-400"}`} />
          {isSuperAdmin ? "Super Admin Console" : "Subscription & Billing"}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-4 py-2 text-[11px] font-black uppercase tracking-wider rounded-lg border transition-all cursor-pointer ${
            activeTab === "notifications"
              ? "bg-zinc-900 text-white border-zinc-800 shadow"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/30 border-transparent"
          }`}
          id="tab-settings-notifications"
        >
          <Bell className="h-3.5 w-3.5 text-emerald-400" />
          Notifications & Sounds
        </button>
      </div>

      {activeTab === "general" && (
        <>
          <form onSubmit={handleSave} className="space-y-6">
        
        {/* BOT_PAUSED Halt Switch */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-0.5">
            <span className="text-sm font-semibold text-white block">Automated Auto-Trader Global Halt Switch (`BOT_PAUSED`)</span>
            <p className="text-xs text-zinc-400">
              Activating halt stops strategy scans instantly. Keep on standby to suspend all automated signal generations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className={`text-xs font-mono font-bold leading-none tracking-wider ${botPaused ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
              {botPaused ? "ENGINE HALTED" : "ENGINE RUNNING"}
            </span>
            <VisualToggle
              checked={!botPaused}
              onChange={(checked) => {
                recordActivity();
                const nextVal = !checked;
                setBotPaused(nextVal);
                submitUpdate({ botPaused: nextVal });
              }}
              size="md"
            />
          </div>
        </div>

        {/* Section 1: Sizing Details (Capital, Risk, Lots, Leverage) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
              Equity & Sizing Architecture
            </span>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Capital input */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Trading capital (USD)</label>
                    <button
                      type="button"
                      onClick={() => {
                        recordActivity();
                        const isCurrentlyInfinite = balance >= 999999999999;
                        const nextVal = isCurrentlyInfinite ? 100000 : 999999999999;
                        setBalance(nextVal);
                        submitUpdate({ balance: nextVal });
                      }}
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded border transition-all ${
                        balance >= 999999999999 
                          ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 font-bold" 
                          : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      {balance >= 999999999999 ? "∞ Infinite Active" : "Set Infinite (∞)"}
                    </button>
                  </div>
                  <input
                    type={balance >= 999999999999 ? "text" : "number"}
                    value={balance >= 999999999999 ? "Infinite (∞)" : balance}
                    disabled={balance >= 999999999999}
                    onChange={(e) => {
                      recordActivity();
                      const val = Number(e.target.value) || 0;
                      setBalance(val);
                    }}
                    onBlur={() => submitUpdate()}
                    className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden hover:border-zinc-805 disabled:opacity-80 disabled:cursor-not-allowed"
                  />
                  <span className="text-[9px] text-sky-400 flex items-center gap-1">
                    <span>🛡️</span>
                    <span>{balance >= 999999999999 ? "Infinite capital protection active" : "Auto-top up active: Adds $10,000 if drops below $1,000"}</span>
                  </span>
                </div>

                {/* Risk Sizing Mode Toggle */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Risk sizing multiplier</label>
                  <select
                    value={riskMode}
                    onChange={(e) => {
                      recordActivity();
                      const val = e.target.value as "PERCENT" | "FIXED";
                      setRiskMode(val);
                      submitUpdate({ riskMode: val });
                    }}
                    className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden hover:border-zinc-850 cursor-pointer"
                  >
                    <option value="PERCENT">% Balance Relative</option>
                    <option value="FIXED">Fixed Contract Size</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Sizing values dynamically enabled dependent on Sizing Mode */}
                {riskMode === "PERCENT" ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Risk Level per Position (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="10.0"
                      value={riskPerTrade}
                      onChange={(e) => {
                        recordActivity();
                        setRiskPerTrade(Number(e.target.value) || 0);
                      }}
                      onBlur={() => submitUpdate()}
                      className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Lot Size (Standard Units)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      max="50.0"
                      value={lotSize}
                      onChange={(e) => {
                        recordActivity();
                        setLotSize(Number(e.target.value) || 0);
                      }}
                      onBlur={() => submitUpdate()}
                      className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden"
                    />
                  </div>
                )}

                {/* Leverage level dropdown - Supporting up to 1000x */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Broker Leverage Sizing</label>
                  <select
                    value={leverage}
                    onChange={(e) => {
                      recordActivity();
                      const val = Number(e.target.value);
                      setLeverage(val);
                      submitUpdate({ leverage: val });
                    }}
                    className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden hover:border-zinc-805 cursor-pointer"
                  >
                    <option value="10">10x Multiplier</option>
                    <option value="25">25x Multiplier</option>
                    <option value="50">50x Margins (Core)</option>
                    <option value="100">100x Pro Multiplier</option>
                    <option value="500">500x Extreme leverage</option>
                    <option value="1000">1000x Maximum leverage</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
              Risk Safeguards & Trailing Stops
            </span>

            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Max Daily Drawdown Target (%)</label>
                <input
                  type="number"
                  step="0.5"
                  min="1.0"
                  max="25.0"
                  value={maxDailyDrawdown}
                  onChange={(e) => {
                    recordActivity();
                    setMaxDailyDrawdown(Number(e.target.value) || 0);
                  }}
                  onBlur={() => submitUpdate()}
                  className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden"
                />
                <span className="text-[10px] text-zinc-500 font-sans tracking-wide">
                  Global protection protocol limits: active strategies block trade generation immediately when daily floating loss delta exceeds this capital percentage.
                </span>
              </div>

              <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      Virtual / Stealth SL/TP Guard
                      <span className="bg-emerald-500/15 text-emerald-400 px-1 py-0.2 rounded text-[8px] font-semibold">RECOMMENDED</span>
                    </label>
                    <span className="text-[10px] text-zinc-500 font-sans tracking-wide pr-4">
                      Keeps original SL/TP on the server but submits them as 0 to physical MT5. Bypasses broker StopLevel and 10016 errors entirely!
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      recordActivity();
                      const val = !virtualSlTpEnabled;
                      setVirtualSlTpEnabled(val);
                      submitUpdate({ virtualSlTpEnabled: val });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      virtualSlTpEnabled ? "bg-emerald-500" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        virtualSlTpEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-3 border-t border-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      Pre-News Automated Exits
                    </label>
                    <span className="text-[10px] text-zinc-500 font-sans tracking-wide pr-4">
                      Automatically close a percentage of active positions before high-impact news releases.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      recordActivity();
                      const val = !preNewsAutoCloseEnabled;
                      setPreNewsAutoCloseEnabled(val);
                      submitUpdate({ preNewsAutoCloseEnabled: val });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      preNewsAutoCloseEnabled ? "bg-emerald-500" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        preNewsAutoCloseEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {preNewsAutoCloseEnabled && (
                  <div className="grid grid-cols-2 gap-4 mt-2 pl-2 border-l-2 border-emerald-500/30">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Minutes Before Release</label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={preNewsAutoCloseMinutes}
                        onChange={(e) => {
                          recordActivity();
                          setPreNewsAutoCloseMinutes(Number(e.target.value) || 0);
                        }}
                        onBlur={() => submitUpdate()}
                        className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white outline-hidden"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Position % to Close</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={preNewsAutoClosePct}
                        onChange={(e) => {
                          recordActivity();
                          setPreNewsAutoClosePct(Number(e.target.value) || 0);
                        }}
                        onBlur={() => submitUpdate()}
                        className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white outline-hidden"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5 pt-3 border-t border-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      Dynamic Pyramid Scaling
                    </label>
                    <span className="text-[10px] text-zinc-500 font-sans tracking-wide pr-4">
                      Enable adding secondary scaled positions when a trade moves favorably by more than 1.0R and the ITME anti-thesis score is low (&le; 30).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      recordActivity();
                      const val = !pyramidingEnabled;
                      setPyramidingEnabled(val);
                      submitUpdate({ pyramidingEnabled: val });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      pyramidingEnabled ? "bg-emerald-500" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        pyramidingEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 pt-3 border-t border-zinc-900/40">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col gap-0.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                      Index ATR-Trailing Stop-Loss
                    </label>
                    <span className="text-[10px] text-zinc-500 font-sans tracking-wide pr-4">
                      Lock in profits on indices using a dynamic trailing stop based on Average True Range.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      recordActivity();
                      const val = !indexAtrTrailingLockEnabled;
                      setIndexAtrTrailingLockEnabled(val);
                      submitUpdate({ indexAtrTrailingLockEnabled: val });
                    }}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      indexAtrTrailingLockEnabled ? "bg-emerald-500" : "bg-zinc-800"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        indexAtrTrailingLockEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {indexAtrTrailingLockEnabled && (
                  <div className="flex flex-col gap-1 mt-2 pl-2 border-l-2 border-emerald-500/30 max-w-xs">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">ATR Multiplier Threshold</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="10.0"
                      value={indexAtrTrailingLockMultiplier}
                      onChange={(e) => {
                        recordActivity();
                        setIndexAtrTrailingLockMultiplier(Number(e.target.value) || 0);
                      }}
                      onBlur={() => submitUpdate()}
                      className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-1.5 font-mono text-xs text-white outline-hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Section 2: Asset Pair enablement \& Scanners execution timeframes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Trading Pairs Enabling/Disabling */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Target Trading Pairs (Enable/Disable)
              </span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[10px] text-zinc-500 font-mono">Max 20 asset classes optimized</span>
                <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                  Object.values(enabledPairs).filter(Boolean).length >= 20 
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10"
                }`}>
                  {Object.values(enabledPairs).filter(Boolean).length}/20 SELECTED
                </span>
              </div>
            </div>

            {pairAlert && (
              <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/35 text-rose-400 rounded-lg flex items-center gap-2 font-medium">
                <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
                {pairAlert}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {(() => {
                const PAIR_METADATA: Record<SymbolType, { name: string; category: string; desc: string; color: string }> = {
                  // Forex
                  EURUSD: { name: "EURUSD", category: "Major Forex", desc: "Euro / US Dollar", color: "from-blue-500/10 to-blue-500/5 text-blue-400 border-blue-500/20" },
                  GBPUSD: { name: "GBPUSD", category: "Major Forex", desc: "Pound / US Dollar", color: "from-blue-500/10 to-blue-500/5 text-blue-400 border-blue-500/20" },
                  USDJPY: { name: "USDJPY", category: "Major Forex", desc: "US Dollar / Japanese Yen", color: "from-blue-500/10 to-blue-500/5 text-blue-400 border-blue-500/20" },
                  AUDUSD: { name: "AUDUSD", category: "Major Forex", desc: "Aussie / US Dollar", color: "from-blue-500/10 to-blue-500/5 text-blue-400 border-blue-500/20" },
                  // Crypto
                  BTCUSD: { name: "BTCUSD", category: "Crypto Currency", desc: "Bitcoin / US Dollar", color: "from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20" },
                  ETHUSD: { name: "ETHUSD", category: "Crypto Currency", desc: "Ethereum / US Dollar", color: "from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20" },
                  SOLUSD: { name: "SOLUSD", category: "Crypto Currency", desc: "Solana / US Dollar", color: "from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20" },
                  BNBUSD: { name: "BNBUSD", category: "Crypto Currency", desc: "BNB / US Dollar", color: "from-amber-500/10 to-amber-500/5 text-amber-400 border-amber-500/20" },
                  // Stocks
                  AAPL: { name: "AAPL", category: "Equities / Stocks", desc: "Apple Inc. Equity", color: "from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20" },
                  TSLA: { name: "TSLA", category: "Equities / Stocks", desc: "Tesla Inc. Equity", color: "from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20" },
                  MSFT: { name: "MSFT", category: "Equities / Stocks", desc: "Microsoft Corp. Equity", color: "from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20" },
                  NVDA: { name: "NVDA", category: "Equities / Stocks", desc: "NVIDIA Corp. Equity", color: "from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20" },
                  // Commodities
                  XAUUSD: { name: "XAUUSD", category: "Commodities", desc: "Gold Spot vs USD", color: "from-yellow-500/10 to-yellow-500/5 text-yellow-400 border-yellow-500/20" },
                  USOIL: { name: "USOIL", category: "Commodities", desc: "Crude Oil Brent vs USD", color: "from-yellow-500/10 to-yellow-500/5 text-yellow-400 border-yellow-500/20" },
                  XAGUSD: { name: "XAGUSD", category: "Commodities", desc: "Silver Spot vs USD", color: "from-yellow-500/10 to-yellow-500/5 text-yellow-400 border-yellow-500/20" },
                  NGAS: { name: "NGAS", category: "Commodities", desc: "Natural Gas vs USD", color: "from-yellow-500/10 to-yellow-500/5 text-yellow-400 border-yellow-500/20" },
                  // Indices
                  SPX500: { name: "SPX500", category: "Global Indices", desc: "S&P 500 Stock Index", color: "from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20" },
                  NDX100: { name: "NDX100", category: "Global Indices", desc: "NASDAQ 100 Stock Index", color: "from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20" },
                  DJI30: { name: "DJI30", category: "Global Indices", desc: "Dow Jones 30 Index", color: "from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20" },
                  GER40: { name: "GER40", category: "Global Indices", desc: "DAX 40 Stock Index", color: "from-emerald-500/10 to-emerald-500/5 text-emerald-400 border-emerald-500/20" }
                };

                return allPairs.map((pair) => {
                  const isEnabled = enabledPairs[pair];
                  const meta = PAIR_METADATA[pair] || { name: pair, category: "Asset", desc: "", color: "from-zinc-500/10 to-zinc-500/5 text-zinc-400" };
                  return (
                    <button
                      key={pair}
                      type="button"
                      onClick={() => togglePair(pair)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                        isEnabled
                          ? "bg-gradient-to-br from-zinc-950 to-zinc-900 border-emerald-500/30 ring-1 ring-emerald-500/10 text-white shadow-sm"
                          : "bg-zinc-950/20 border-zinc-900/60 opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs uppercase leading-none">{pair}</span>
                          <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm bg-gradient-to-r ${meta.color} border`}>
                            {meta.category}
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500 line-clamp-1 select-none leading-none">
                          {meta.desc}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {/* Toggle Pill */}
                        <VisualToggle checked={isEnabled} onChange={() => {}} asDiv={true} size="sm" />
                      </div>
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Timeframe settings and scan checklists */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
              Chart Display & Scan Scopes
            </span>

            <div className="space-y-4">
              {/* Default display timeframe */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Default Dashboard Chart Display Timeframe</label>
                <select
                  value={displayTimeframe}
                  onChange={(e) => {
                    recordActivity();
                    const val = e.target.value as "M1" | "M5" | "M15" | "H1" | "H4" | "D1";
                    setDisplayTimeframe(val);
                    submitUpdate({ displayTimeframe: val });
                  }}
                  className="rounded-lg border border-zinc-850 bg-zinc-900 px-3 py-2 text-xs text-zinc-200 outline-hidden hover:border-zinc-805 cursor-pointer"
                >
                  <option value="M1">M1 (Scalper Standard)</option>
                  <option value="M5">M5 (Tactical Momentum)</option>
                  <option value="M15">M15 (Active Scanner Core)</option>
                  <option value="H1">H1 (Hourly Anchor)</option>
                  <option value="H4">H4 (Strategic Swing)</option>
                  <option value="D1">D1 (Daily Macro)</option>
                </select>
              </div>

              {/* Strategy Scan Target Scope Selector */}
              <div className="space-y-1.5 pt-1">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                  Strategy Scan & Trade Execution Scope
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      recordActivity();
                      setScannerTargetMode("ALL_MONITORED");
                      submitUpdate({ scannerTargetMode: "ALL_MONITORED" });
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      scannerTargetMode === "ALL_MONITORED"
                        ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                        : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-white"
                    }`}
                  >
                    <span className="text-[11px] font-bold block">All Monitored Pool</span>
                    <span className="text-[9px] opacity-75 mt-0.5 leading-normal">
                      Execute signals on any selected timeframes from the monitor pool below.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      recordActivity();
                      setScannerTargetMode("DISPLAY_ONLY");
                      submitUpdate({ scannerTargetMode: "DISPLAY_ONLY" });
                    }}
                    className={`flex flex-col text-left p-2.5 rounded-lg border transition-all cursor-pointer ${
                      scannerTargetMode === "DISPLAY_ONLY"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-white"
                    }`}
                  >
                    <span className="text-[11px] font-bold block">Default Display Only</span>
                    <span className="text-[9px] opacity-75 mt-0.5 leading-normal">
                      Scan and execute signals exclusively on the default display timeframe.
                    </span>
                  </button>
                </div>
              </div>

              {/* Checkboxes for timeframes auto trader scans */}
              <div className={`space-y-2 pt-1 transition-all duration-300 ${scannerTargetMode === "DISPLAY_ONLY" ? "opacity-35 select-none pointer-events-none" : ""}`}>
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Timeframes Bot Scanners Actively Monitor
                  </label>
                  {scannerTargetMode === "DISPLAY_ONLY" && (
                    <span className="text-[9px] font-sans text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">
                      Bypassed / INACTIVE
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {allTimeframes.map((tf) => {
                    const active = executionTimeframes.includes(tf);
                    return (
                      <button
                        key={tf}
                        type="button"
                        onClick={() => toggleExecutionTimeframe(tf)}
                        className={`px-3 py-1.5 rounded text-[11px] font-mono font-black border transition-all cursor-pointer ${
                          active
                            ? "bg-sky-500/10 border-sky-500/30 text-sky-400"
                            : "bg-zinc-900 border-zinc-850 text-zinc-500 hover:text-white"
                        }`}
                      >
                        {tf}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Section: Dynamic Trade Blocker Safeguards Control Panel */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-900 pb-2">
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Dynamic Trade Blocker Safeguards List
              </span>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Enable or disable systemic execution filters, timeline locks, and state boundaries time-to-time. Active conditions prevent trade execution.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  recordActivity();
                  const allOn = {
                    "news-lock": true,
                    "session-lock": true,
                    "hour-blackout": true,
                    "day-cooldown": true,
                    "strategy-chop-guard": true,
                    "chop-gate": true,
                    "cooldown": true,
                    "open-lock": true,
                    "daily-drawdown-lock": true,
                    "exposure-cap-lock": true,
                    "spike-guard": true,
                    "htf-trend-alignment": true,
                    "dynamic-pattern-safeguard": true,
                    "msb-retest-safeguard": true,
                    "order-block-imbalance": true
                  };
                  setEnabledBlockers(allOn);
                  submitUpdate({ enabledBlockers: allOn });
                }}
                className="px-2.5 py-1 text-[10px] font-mono font-bold rounded border border-zinc-850 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                Enable All
              </button>
              <button
                type="button"
                onClick={() => {
                  recordActivity();
                  const allOff = {
                    "news-lock": false,
                    "session-lock": false,
                    "hour-blackout": false,
                    "day-cooldown": false,
                    "strategy-chop-guard": false,
                    "chop-gate": false,
                    "cooldown": false,
                    "open-lock": false,
                    "daily-drawdown-lock": false,
                    "exposure-cap-lock": false,
                    "spike-guard": false,
                    "htf-trend-alignment": false,
                    "dynamic-pattern-safeguard": false,
                    "msb-retest-safeguard": false,
                    "order-block-imbalance": false
                  };
                  setEnabledBlockers(allOff);
                  submitUpdate({ enabledBlockers: allOff });
                }}
                className="px-2.5 py-1 text-[10px] font-mono font-bold rounded border border-zinc-850 bg-zinc-900 text-zinc-400 hover:text-white cursor-pointer"
              >
                Disable All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                id: "news-lock",
                name: "News Velocity Lock",
                desc: "Prevents execution within 30 minutes before and after high-impact macro news events."
              },
              {
                id: "session-lock",
                name: "Session transition boundary filter",
                desc: "Halt strategy triggers 30 minutes around UTC session transition boundaries."
              },
              {
                id: "hour-blackout",
                name: "Worst bleeding hour blackout",
                desc: "Blocks new trade setups during historically designated worst performing risk hours."
              },
              {
                id: "day-cooldown",
                name: "Worst performing day cooldown",
                desc: "Halt automated entries on designated low probability optimized weekday profiles."
              },
              {
                id: "strategy-chop-guard",
                name: "Strategy chop guard override",
                desc: "Bypasses strategy signals under sideways regimes to prevent capital erosion."
              },
              {
                id: "chop-gate",
                name: "Chop Gate general filter",
                desc: "System-wide protocol blocking breakout signals inside ranging market phases."
              },
              {
                id: "cooldown",
                name: "Frequency Cooldown Guard",
                desc: "Imposes minimum spacing timeframes between subsequent trade triggers on local assets."
              },
              {
                id: "open-lock",
                name: "Same Concurrent Trade (Open Lock)",
                desc: "Strictly prevents multiple concurrent trades on the same asset and timeframe across all strategies."
              },
              {
                id: "daily-drawdown-lock",
                name: "Max Daily Drawdown Guard",
                desc: "Strictly halts execution if overall daily closed and floating losses violate the daily drawdown threshold."
              },
              {
                id: "exposure-cap-lock",
                name: "Maximum Exposure Cap Guard",
                desc: "Caps total global simultaneous open trades to a safe maximum (4) to control portfolio leverage."
              },
              {
                id: "spike-guard",
                name: "Volatility Spike Gate",
                desc: "Filters and suspends new order entries when rapid flash spikes or price gapping increase slippage danger."
              },
              {
                id: "htf-trend-alignment",
                name: "HTF Trend Alignment Guard",
                desc: "Enforces 15 minute & 1H EMA 50/100 trend alignment: permits LONGs only when both timeframes are bullish (EMA 50 > 100), and SHORTs only when both are bearish (EMA 50 < 100). Blocks trades during divergence."
              },
              {
                id: "dynamic-pattern-safeguard",
                name: "Pattern Gate",
                desc: "• BULLISH CROSS (Bullish Engulfing):\n  - First candle is bearish\n  - Second candle is bullish\n  - The bullish candle's body engulfs the bearish candle's body\n  - Signals potential bullish reversal\n\n• BEARISH CROSS (Bearish Engulfing):\n  - First candle is bullish\n  - Second candle is bearish\n  - The bearish candle's body engulfs the bullish candle's body\n  - Signals potential bearish reversal"
              },
              {
                id: "msb-retest-safeguard",
                name: "Market Structure Break + Retest Guard",
                desc: "• BUY ENTRY RETEST:\n  - Price forms a higher low, then closes cleanly above the previous swing high breakout level (BOS).\n  - Retreat low retests within 0.25-0.5 ATR of the broken level.\n  - Rejection candle prints a lower wick >= 1.5x body size or a strong engulfing body.\n\n• SELL ENTRY RETEST:\n  - Price forms a lower high, then closes cleanly below the previous swing low breakout level (BOS).\n  - retracement high retests within 0.25-0.5 ATR of the broken level.\n  - Rejection candle prints an upper wick >= 1.5x body size or a strong engulfing body."
              },
              {
                id: "order-block-imbalance",
                name: "Order Block Imbalance Filter (SMC)",
                desc: "Strictly filters signal entry targets: validates and permits executions only if the underlying order block (OB) is immediately accompanied by a Fair Value Gap (FVG) imbalance on the current or higher timeframe, proving strong institutional sponsorship."
              }
            ].map((blocker) => {
              const isEnabled = enabledBlockers[blocker.id] !== false;
              return (
                <div
                  key={blocker.id}
                  onClick={() => toggleBlocker(blocker.id)}
                  className={`flex items-start justify-between p-3.5 rounded-lg border transition-all cursor-pointer ${
                    isEnabled
                      ? "bg-zinc-900/40 border-zinc-850 text-white hover:border-zinc-800"
                      : "bg-zinc-950/20 border-zinc-900/60 text-zinc-500 hover:border-zinc-850"
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold leading-none">{blocker.name}</span>
                      <span className={`inline-block px-1 py-0.25 text-[8px] font-mono rounded select-none ${
                        isEnabled
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}>
                        {isEnabled ? "ARMED & ENGAGED" : "BYPASSED & DEACTIVATED"}
                      </span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-tight whitespace-pre-line">
                      {blocker.desc}
                    </p>
                  </div>
                  <div className="flex items-center pt-0.5">
                    <VisualToggle checked={isEnabled} onChange={() => {}} asDiv={true} size="sm" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Active Algorithmic Strategies checklists */}
        <div className={`rounded-xl border p-5 space-y-4 ${
          theme === "light" 
            ? "border-slate-200 bg-slate-50/50" 
            : "border-zinc-900 bg-zinc-950/40"
        }`}>
          <span className={`text-xs font-bold uppercase tracking-wider block border-b pb-2 ${
            theme === "light" 
              ? "text-slate-800 border-slate-200" 
              : "text-white border-zinc-900"
          }`}>
            Active Algorithmic Detectors (Trigger Auto-Trading)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {allStrategies.map((strat) => {
              const active = activeStrategies.includes(strat.id);
              return (
                <button
                  key={strat.id}
                  type="button"
                  onClick={() => toggleActiveStrategy(strat.id)}
                  className={`flex flex-col text-left p-4 rounded-lg border transition-all cursor-pointer ${
                    active
                      ? theme === "light"
                        ? "bg-[#5B4CFF] border-[#5B4CFF] text-white shadow"
                        : "bg-zinc-900/60 border-zinc-700 text-white shadow"
                      : theme === "light"
                        ? "bg-white border-slate-200 text-slate-500 hover:bg-slate-100 hover:border-slate-300"
                        : "bg-zinc-950/40 border-zinc-900 text-zinc-550 hover:border-zinc-850"
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-bold">{strat.name}</span>
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      active 
                        ? theme === "light" 
                          ? "bg-emerald-300 border border-emerald-500/30" 
                          : "bg-emerald-400 animate-pulse" 
                        : "bg-zinc-850 dark:bg-zinc-800"
                    }`} />
                  </div>
                  <span className={`text-[9.5px] mt-1 font-mono ${
                    active 
                      ? theme === "light" 
                        ? "text-indigo-100" 
                        : "text-zinc-400" 
                      : "text-zinc-500"
                  }`}>ID: {strat.id}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Telegram signals generated to MT5 automatically module settings */}
        {state.activeTenantId === "tenant-harry" ? (
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-5">
            <div className="border-b border-zinc-900 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-left">
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  Telegram Signal Receiver Gateway & MT5 Auto-Mirror Router
                </span>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  Establish listener threads that subscribe to a specified Telegram Channel or Bot chat. Extracted orders are matched against active broker criteria and injected into the MT5 bridge queue instantly.
                </p>
              </div>
              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-black tracking-widest uppercase font-mono ${
                  telegramReceiverActive 
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                    : "bg-zinc-900 text-zinc-500 border border-zinc-800"
                }`}>
                  {telegramReceiverActive ? "Listener Online" : "Listener Silent"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
              {/* Left Col: Core Gateway Credentials */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Listener Bot API Token</label>
                  <input
                    type="text"
                    value={telegramReceiverToken}
                    onChange={(e) => {
                      recordActivity();
                      setTelegramReceiverToken(e.target.value);
                    }}
                    onBlur={() => submitUpdate()}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden focus:border-zinc-700"
                    placeholder="e.g. botXXXXXX:XXXXXX..."
                  />
                  <span className="text-[9px] text-zinc-500 font-sans leading-relaxed">
                    Your Master HTTP API Token issued by @BotFather. This endpoint is used by MT5 client terminal to polling synchronization queues.
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Inbound Channel Handle / Chat ID</label>
                  <input
                    type="text"
                    value={telegramReceiverChatId}
                    onChange={(e) => {
                      recordActivity();
                      setTelegramReceiverChatId(e.target.value);
                    }}
                    onBlur={() => submitUpdate()}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden focus:border-zinc-700"
                    placeholder="e.g. @ChannelName status"
                  />
                  <span className="text-[9px] text-zinc-500 font-sans leading-relaxed">
                    Target identifier of the channel emitting original alerts. Standard identifier: <strong>@QuantTerminal_Alerts</strong>.
                  </span>
                </div>
              </div>

              {/* Right Col: Active States & Direct Webhook Integration */}
              <div className="space-y-4">
                {/* Active Toggle 1: telegramReceiverActive */}
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-900 bg-zinc-950/20">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-xs font-bold text-white">Enable Telegram Signal Receiver Gateway</span>
                    <p className="text-[10px] text-zinc-500 leading-snug">
                      Turn on the web listener script to receive external Webhook API signals from Telegram servers.
                    </p>
                  </div>
                  <VisualToggle
                    checked={telegramReceiverActive}
                    onChange={(nextVal) => {
                      recordActivity();
                      setTelegramReceiverActive(nextVal);
                      submitUpdate({ telegramReceiverActive: nextVal });
                    }}
                    size="sm"
                  />
                </div>

                {/* Active Toggle 2: telegramAutoMirror */}
                <div className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-900 bg-zinc-950/20">
                  <div className="flex flex-col gap-0.5 text-left">
                    <span className="text-xs font-bold text-white">Auto-Execute Signals directly to MT5 Queue</span>
                    <p className="text-[10px] text-zinc-500 leading-snug">
                      Instantly create mirror orders inside the broker execution queue upon receiving a parsed message tag.
                    </p>
                  </div>
                  <VisualToggle
                    checked={telegramAutoMirror}
                    onChange={(nextVal) => {
                      recordActivity();
                      setTelegramAutoMirror(nextVal);
                      submitUpdate({ telegramAutoMirror: nextVal });
                    }}
                    size="sm"
                  />
                </div>
              </div>
            </div>

            {/* Inline Live Simulator Diagnostic Module */}
            <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-900 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
                  Live Telemetry Webhook Tester
                </span>
                <span className="text-[9px] text-zinc-500 font-mono">POST /api/telegram/receiver/post</span>
              </div>
              <p className="text-xs text-zinc-400 text-left w-full">
                Test parsing and automatic order translation immediately. Submit a plain-text trade signal below to simulate a real incoming broadcast from the chat channel.
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={testMessageText}
                  onChange={(e) => setTestMessageText(e.target.value)}
                  className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 font-mono text-xs text-zinc-300 outline-hidden focus:border-zinc-700"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!testMessageText.trim()) return;
                    setTestPosting(true);
                    try {
                      const res = await fetch("/api/telegram/receiver/post", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: testMessageText, chatId: telegramReceiverChatId })
                      });
                      if (res.ok) {
                        setTestSuccess(true);
                        setTimeout(() => setTestSuccess(false), 3000);
                      }
                    } catch (e) {
                      console.error("Test broadcast failed", e);
                    } finally {
                      setTestPosting(false);
                    }
                  }}
                  disabled={testPosting}
                  className="py-2 px-3.5 rounded-lg bg-zinc-800 hover:bg-zinc-750 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  id="btn-test-parse-route"
                >
                  <Send className="h-3.5 w-3.5 text-emerald-400" />
                  {testPosting ? "Publishing..." : testSuccess ? "Signal Routed!" : "Test Parse & Route"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-emerald-900/30 bg-emerald-950/5 p-6 space-y-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-900 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-sky-400 animate-pulse"></span>
                  <span className="text-sm font-bold text-white uppercase tracking-wider block">
                    Automated Telegram Signals Router
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Connect your terminal to get instant algorithmic buy and sell signals routed directly from our trading desk.
                </p>
              </div>
              <div className="flex items-center">
                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase font-mono">
                  Sync Enabled
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Step 1: Join the Official Channel
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Our proprietary algorithms publish institutional-grade quantitative trading alerts to our community channel. Join now to track raw updates and receive hot trade alerts:
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
                    <div className="flex-1 bg-zinc-900 border border-zinc-850 px-3 py-2 rounded-lg font-mono text-xs text-white flex items-center justify-between">
                      <span className="text-sky-400 font-bold">@QuantTerminal_Alerts</span>
                      <span className="text-[10px] text-zinc-500">Public Channel Link</span>
                    </div>
                    <a
                      href="https://t.me/QuantTerminal_Alerts"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2 px-4 rounded-lg bg-sky-500 hover:bg-sky-450 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-center select-none shadow-md shadow-sky-500/10"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Join Telegram Channel
                    </a>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-900/60">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block tracking-wider">
                    Step 2: Broker Configuration & Verification
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Once you set up your MT5 account on the <strong className="text-emerald-400 font-medium">MT5 Connection</strong> tab, the terminal will instantly synchronize. Any alerts generated inside the Telegram channel will be automatically mirrored across into your individual broker workspace queue in real-time.
                  </p>
                </div>
              </div>

              {/* Graphical info block / Right column */}
              <div className="bg-zinc-900/40 p-4.5 rounded-xl border border-zinc-900 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <Database className="h-4 w-4 text-emerald-400" />
                    <span>Real-time Mirroring</span>
                  </div>
                  <ul className="text-[10.5px] text-zinc-400 space-y-1.5 list-disc pl-3">
                    <li>Zero-latency routing pipelines</li>
                    <li>Automatic lot size and risk matching</li>
                    <li>Saves you from manual operation copy errors</li>
                  </ul>
                </div>
                
                <div className="text-[10px] text-zinc-500 bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-850/50 font-mono flex items-center gap-2">
                  <Info className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <span>Signals automatically execute according to your custom risk targets.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Schedules Days, Alert Systems, and MT5 parameters */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Sched days \& Alerts */}
          <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block border-b border-zinc-900 pb-2">
              Schedules & Channels
            </span>

            <div className="space-y-4">
              {/* Active Scheduled Days */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Trading active days</label>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {allDays.map((day) => {
                    const active = tradingDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleTradingDay(day)}
                        className={`text-[9px] font-bold px-1.5 py-1 rounded transition-all border cursor-pointer ${
                          active
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold"
                            : "bg-zinc-900 border-zinc-850 text-zinc-650 hover:text-white"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Alert Toggle */}
              <div className="flex items-center justify-between py-2 border-t border-zinc-900/40 pt-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-white">Channel Alerts Broadcast</span>
                  <p className="text-[9.5px] text-zinc-500 leading-tight">Transmit auto-trader actions to Telegram on launch.</p>
                </div>

                <VisualToggle
                  checked={telegramAlertsEnabled}
                  onChange={(nextVal) => {
                    recordActivity();
                    setTelegramAlertsEnabled(nextVal);
                    submitUpdate({ telegramAlertsEnabled: nextVal });
                  }}
                  size="sm"
                />
              </div>
            </div>
          </div>

          {/* MT5 EA Connector Endpoint configuration parameters */}
          <div className="lg:col-span-2 rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-2 gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                MT5 VPS Connector Socket Parameters (MQL5 EA Endpoint)
              </span>
              <button
                type="button"
                id="reset-mt5-demo-settings-btn"
                onClick={async () => {
                  recordActivity();
                  setMt5Server("MetaQuotes-Demo");
                  setMt5Login("50873114");
                  setMt5Password("BrokerPassword159");
                  setMt5Port(3001);
                  setSubmitting(true);
                  try {
                    await onUpdateConfig({
                      server: "MetaQuotes-Demo",
                      login: "50873114",
                      password: "BrokerPassword159",
                      port: 3001
                    });
                    setMessage("✓ Metatrader default demo account details restored successfully!");
                    setTimeout(() => setMessage(""), 4000);
                  } catch (err) {
                    console.error("Error setting dynamic configuration parameter:", err);
                  } finally {
                    setSubmitting(false);
                  }
                }}
                className="py-1 px-2.5 bg-gradient-to-r from-emerald-500/10 to-emerald-500/25 border border-emerald-500/30 hover:border-emerald-500/50 hover:bg-emerald-500/30 text-emerald-400 rounded text-[10px] font-mono font-bold transition-all cursor-pointer inline-flex items-center gap-1 self-start"
              >
                RESET TO DEFAULT DEMO ⚡
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Broker Server name</label>
                <input
                  type="text"
                  value={mt5Server}
                  onChange={(e) => {
                    recordActivity();
                    setMt5Server(e.target.value);
                  }}
                  onBlur={() => submitUpdate()}
                  className="rounded-lg border border-zinc-855 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden focus:border-zinc-700"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Trading Login Account ID</label>
                <input
                  type="text"
                  value={mt5Login}
                  onChange={(e) => {
                    recordActivity();
                    setMt5Login(e.target.value);
                  }}
                  onBlur={() => submitUpdate()}
                  className="rounded-lg border border-zinc-855 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden focus:border-zinc-700"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Trading Password</label>
                <input
                  type="password"
                  value={mt5Password}
                  onChange={(e) => {
                    recordActivity();
                    setMt5Password(e.target.value);
                  }}
                  onBlur={() => submitUpdate()}
                  className="rounded-lg border border-zinc-855 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden focus:border-zinc-700"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-zinc-400 uppercase font-bold">Local VPS Gateway port</label>
                <input
                  type="number"
                  value={mt5Port}
                  onChange={(e) => {
                    recordActivity();
                    setMt5Port(Number(e.target.value) || 0);
                  }}
                  onBlur={() => submitUpdate()}
                  className="rounded-lg border border-zinc-855 bg-zinc-900 px-3 py-2 font-mono text-xs text-white outline-hidden focus:border-zinc-700"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Action Bottom Submit Bar */}
        <div className="flex items-center justify-between border-t border-zinc-900 pt-5">
          <span className="text-xs font-bold font-sans text-emerald-400 transition-all">
            {message ? (
              <span className="flex items-center gap-1.5">
                <Check className="h-4 w-4" /> {message}
              </span>
            ) : ""}
          </span>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow transition-colors cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {submitting ? "Applying parameters..." : "Apply Operator Configuration Settings"}
          </button>
        </div>

      </form>

      {/* Production vs Development Environment State Safeguards */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-md p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-zinc-800 pb-3">
          <div>
            <h4 className="font-display text-sm font-black text-emerald-400 flex items-center gap-1.5 uppercase tracking-wide leading-none">
              <Database className="h-5 w-5 text-emerald-500" />
              Environment Separation & State Safeguards
            </h4>
            <p className="text-[11px] text-zinc-400 mt-1">
              Prevent server recycles, rebuilds, and terminal redeployments (republishing) from losing your active configurations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${autoSyncState ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            <span className="text-[10px] font-mono text-zinc-300 font-bold uppercase tracking-wider">
              {autoSyncState ? "Auto-Sync: Live" : "Auto-Sync: Disabled"}
            </span>
          </div>
        </div>

        {hasBackupToRestore && (
          <div className="p-3 bg-emerald-950/20 border border-emerald-900/40 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fadeIn">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <RefreshCw className="h-3.5 w-3.5 text-emerald-400 animate-spin" />
                Dormant Production Backup Detected
              </span>
              <p className="text-[10.5px] text-zinc-300">
                The terminal appeared to restart/republish with a fresh starting state. Restoring will apply prior trades & configurations!
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoRestoreBackup}
              className="py-1.5 px-3.5 text-[11px] font-black uppercase tracking-wider rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-all cursor-pointer active:scale-95"
            >
              Restore Previous Session
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Radio/Checkbox for Auto-Sync to Browser Session */}
          <div className="rounded-lg border border-zinc-850 bg-zinc-900/40 p-4 space-y-2">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAutoSyncState(!autoSyncState)}
                className="mt-0.5"
              >
                {autoSyncState ? (
                  <CheckSquare className="h-5 w-5 text-emerald-500" />
                ) : (
                  <Square className="h-5 w-5 text-zinc-650" />
                )}
              </button>
              <div className="space-y-0.5">
                <span className="font-bold text-white block text-xs">Auto-Sync browser storage</span>
                <p className="text-[10.5px] text-zinc-400">
                  Keeps an active mirror of configuration and trade registers in secure client storage to handle code updates with zero friction.
                </p>
              </div>
            </div>
          </div>

          {/* Backup Action triggers */}
          <div className="rounded-lg border border-zinc-850 bg-zinc-900/40 p-4 flex flex-col justify-center gap-3">
            <span className="font-bold text-white block text-xs leading-none">Manual Data Transfer</span>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={handleExportStateJson}
                className="py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <Download className="h-3 w-3 text-zinc-400" />
                Export JSON State
              </button>

              <label className="py-1.5 px-3 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white border border-zinc-700 text-[10.5px] font-black uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer active:scale-95">
                <Upload className="h-3 w-3 text-zinc-400" />
                Import Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportStateJson}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Platform Onboarding Walkthrough */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/10 backdrop-blur-md p-5 space-y-3.5 shadow-sm">
        <h4 className="font-display text-sm font-black text-slate-800 dark:text-white flex items-center gap-1.5 uppercase tracking-wide leading-none">
          <Sparkles className="h-5 w-5 text-[#5B4CFF] dark:text-emerald-400" />
          Interactive Onboarding Tutorial Walkthrough
        </h4>
        <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans">
          First time using the platform or need a refresher? Relaunch the step-by-step interactive guidance walkthrough to see high-fidelity highlights, quick-actions tips, and tutorial instructions.
        </p>
        <button
          type="button"
          onClick={onRestartWalkthrough}
          className="py-2.5 px-4 font-sans font-bold text-xs rounded-lg border border-[#5B4CFF] bg-[#5B4CFF] hover:bg-[#4b3ce0] text-white transition-all cursor-pointer flex items-center gap-2"
        >
          <Sparkles className="h-4 w-4 text-emerald-100 font-bold animate-pulse" />
          Launch Interactive Tour Walks
        </button>
      </div>

      {/* Emergency Operations Area */}
      <div className="rounded-xl border border-rose-950/20 bg-rose-950/5 p-5 space-y-3">
        <h4 className="font-display text-sm font-black text-rose-400 flex items-center gap-1.5 uppercase tracking-wide leading-none">
          <AlertOctagon className="h-5 w-5 text-rose-500" />
          Emergency Operations Desk
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed font-sans">
          Wiping the session database will terminate physical positions, discard accumulated breakout histories, and reset mock simulation balances back to Infinite (∞).
        </p>
        <button
          onClick={handleResetClick}
          className="py-2.5 px-4 font-sans font-bold text-xs rounded-lg border border-rose-900/50 bg-rose-955/10 hover:bg-rose-955/30 text-rose-450 text-rose-400 transition-all cursor-pointer"
        >
          Reset Session Database
        </button>
      </div>

      {/* Reset State Confirmation Modal Overlay */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertTriangle className="h-6 w-6" />
              <h4 className="font-display text-base font-bold text-white">Confirm Global Flush Wiping</h4>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              Are you absolutely sure you want to sweep all simulated trading statistics, restore starting equity, and flush the diagnostic logs back to standard configurations?
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="py-2 px-4 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-850 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="py-2 px-4 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow cursor-pointer"
              >
                Yes, Wipe and Reset
              </button>
            </div>
          </div>
        </div>
      )}

    </>
  )}

      {activeTab === "mt5" && (
        <MT5ConnectorView state={state} onUpdateConfig={onUpdateConfig} theme={theme} />
      )}

      {activeTab === "backtest" && (
        <BacktestingView theme={theme} state={state} />
      )}

      {activeTab === "subscriber" && (
        isSuperAdmin ? (
          <SaaSAdminView
            state={state}
            onRefresh={onRefresh || (() => {})}
            onSwitchTenant={onSwitchTenant || (() => {})}
            initialTab={
              initialTab === "admin" 
                ? "admin-registry" 
                : initialTab === "billing" 
                  ? "secure-billing" 
                  : "tenant-billing"
            }
          />
        ) : (
          <SubscriberBillingView
            state={state}
            onRefresh={onRefresh || (() => {})}
          />
        )
      )}

      {activeTab === "notifications" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-900 bg-zinc-950/40 p-6 space-y-6">
            <div className="flex items-start justify-between border-b border-zinc-900 pb-5">
              <div className="space-y-1">
                <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-indigo-400" />
                  Terminal Audio Notifications
                </h4>
                <p className="text-xs text-zinc-400 font-sans max-w-2xl leading-relaxed">
                  Manage live audio feed settings. When enabled, the terminal plays an auditory signal to keep you instantly updated on crucial trade activities without checking your screen.
                </p>
              </div>
            </div>

            {/* Switch Toggle Option */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-xl bg-zinc-900/40 border border-zinc-900/60 hover:bg-zinc-900/60 transition-all duration-200">
              <div className="space-y-1">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-200 block">Trade Execution Sound Alerts</span>
                <span className="text-[11px] text-zinc-400 block max-w-xl font-sans leading-normal">
                  Play distinct sound loops on trade entry, stop-loss triggers, or take-profit fills. Perfect for passive or multi-screen active operators.
                </span>
              </div>
              
              <div className="flex items-center shrink-0">
                  <VisualToggle
                    checked={!!soundAlertsEnabled}
                    onChange={(nextVal) => onToggleSoundAlerts?.(nextVal)}
                    size="sm"
                    id="toggle-trade-audio-alerts"
                  />
              </div>
            </div>

            {/* Test Audio Sandbox */}
            <div className="space-y-4 pt-2">
              <div className="border-t border-zinc-900/60 my-4" />
              <div className="space-y-1">
                <h5 className="text-xs font-black uppercase tracking-widest text-zinc-300">Sandbox Audio Diagnostics</h5>
                <p className="text-[11px] text-zinc-500 font-sans">
                  Instantly test your terminal's synthesized audio profile outputs below. Please ensure your browser audio limits are unmuted.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => onPlayTestSound?.("entry")}
                  className="flex items-center justify-between p-4.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 hover:text-white text-xs font-extrabold transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse group-hover:scale-125 transition" />
                    <span className="font-mono text-[10px] uppercase tracking-wider">Test Entry Chime</span>
                  </div>
                  <Play className="h-3 w-3 text-zinc-500 group-hover:text-emerald-400 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => onPlayTestSound?.("tp")}
                  className="flex items-center justify-between p-4.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 hover:text-white text-xs font-extrabold transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse group-hover:scale-125 transition" />
                    <span className="font-mono text-[10px] uppercase tracking-wider">Test Take Profit Hit</span>
                  </div>
                  <Play className="h-3 w-3 text-zinc-500 group-hover:text-indigo-400 transition" />
                </button>

                <button
                  type="button"
                  onClick={() => onPlayTestSound?.("sl")}
                  className="flex items-center justify-between p-4.5 rounded-lg border border-zinc-900 bg-zinc-950 hover:bg-zinc-900 text-zinc-200 hover:text-white text-xs font-extrabold transition-all group cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse group-hover:scale-125 transition" />
                    <span className="font-mono text-[10px] uppercase tracking-wider">Test Stop Loss Trigger</span>
                  </div>
                  <Play className="h-3 w-3 text-zinc-500 group-hover:text-rose-500 transition" />
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
