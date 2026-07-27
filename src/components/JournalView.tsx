import React, { useState, useEffect } from "react";
import { FullAppState, SymbolType, Trade } from "../types";
import {
  History,
  TrendingUp,
  TrendingDown,
  Scale,
  Smile,
  AlertTriangle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Edit2,
  Filter,
  Layers,
  List,
  MessageSquare,
  Percent,
  PlusCircle,
  RotateCcw,
  Search,
  ShieldCheck,
  Star,
  Zap,
  Brain,
  Sparkles
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

interface JournalViewProps {
  state: FullAppState;
  onRefresh?: () => Promise<void>;
  activeSubMenu?: "OVERVIEW" | "SETUPS" | "MISTAKES" | "PSYCHOLOGY" | "LOG";
  onSwitchSubMenu?: (tab: "OVERVIEW" | "SETUPS" | "MISTAKES" | "PSYCHOLOGY" | "LOG") => void;
}

// Submenus
type SubmenuType = "OVERVIEW" | "SETUPS" | "MISTAKES" | "PSYCHOLOGY" | "LOG";

// Enrichment data stored in local storage
interface JournalEnrichment {
  setupType: string;
  mistakeType: string;
  emotion: string;
  notes: string;
  rating: number; // 1-5
}

// Built-in synthetic ledger items to populate rich institutional journal
const SYNTHETIC_CLOSED_TRADES: Trade[] = [
  {
    id: "TRD-8409",
    symbol: "BTCUSD",
    type: "BUY",
    entryPrice: 67200.0,
    currentPrice: 68500.0,
    closePrice: 68500.0,
    size: 0.15,
    pnl: 195.0,
    strategyId: "HYBRID",
    strategyName: "Hybrid Volume Breakout",
    status: "CLOSED",
    openTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
    closeTime: new Date(Date.now() - 3 * 24 * 3600 * 1000 + 4 * 3600 * 1000).toISOString(),
    closeReason: "TP",
    regime: "TRENDING_BULL",
    mfe: 220.0,
    mae: -45.0
  },
  {
    id: "TRD-8392",
    symbol: "EURUSD",
    type: "SELL",
    entryPrice: 1.0854,
    currentPrice: 1.0822,
    closePrice: 1.0822,
    size: 1.00,
    pnl: 320.0,
    strategyId: "TIME_RANGE",
    strategyName: "London session opening bracket",
    status: "CLOSED",
    openTime: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    closeTime: new Date(Date.now() - 2 * 24 * 3600 * 1000 + 1.5 * 3600 * 1000).toISOString(),
    closeReason: "TP",
    regime: "RANGING_CHOP",
    mfe: 340.0,
    mae: -15.0
  },
  {
    id: "TRD-8381",
    symbol: "XAUUSD",
    type: "BUY",
    entryPrice: 2345.5,
    currentPrice: 2335.0,
    closePrice: 2335.0,
    size: 0.20,
    pnl: -210.0,
    strategyId: "MWDX",
    strategyName: "Multi-Timeframe Divergence",
    status: "CLOSED",
    openTime: new Date(Date.now() - 1.5 * 24 * 3600 * 1000).toISOString(),
    closeTime: new Date(Date.now() - 1.5 * 24 * 3600 * 1000 + 12 * 3600 * 1000).toISOString(),
    closeReason: "SL",
    regime: "TRENDING_BEAR",
    mfe: 35.0,
    mae: -210.0
  },
  {
    id: "TRD-8374",
    symbol: "SPX500",
    type: "BUY",
    entryPrice: 5190.0,
    currentPrice: 5150.0,
    closePrice: 5150.0,
    size: 5,
    pnl: -26.0,
    strategyId: "EMA_CROSS",
    strategyName: "1-Minute EMA Cross",
    status: "CLOSED",
    openTime: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    closeTime: new Date(Date.now() - 1 * 24 * 3600 * 1000 + 35 * 60 * 1000).toISOString(),
    closeReason: "SL",
    regime: "RANGING_CHOP",
    mfe: 12.0,
    mae: -32.0
  },
  {
    id: "TRD-8360",
    symbol: "GBPUSD",
    type: "SELL",
    entryPrice: 1.2642,
    currentPrice: 1.2611,
    closePrice: 1.2611,
    size: 1.50,
    pnl: 465.0,
    strategyId: "HYBRID",
    strategyName: "Hybrid Volume Breakout",
    status: "CLOSED",
    openTime: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
    closeTime: new Date(Date.now() - 5.5 * 3600 * 1000).toISOString(),
    closeReason: "TP",
    regime: "TRENDING_BEAR",
    mfe: 480.0,
    mae: -25.0
  },
  {
    id: "TRD-8351",
    symbol: "AAPL",
    type: "BUY",
    entryPrice: 184.2,
    currentPrice: 185.8,
    closePrice: 185.8,
    size: 30,
    pnl: 48.0,
    strategyId: "EMA_CROSS",
    strategyName: "1-Minute EMA Cross",
    status: "CLOSED",
    openTime: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    closeTime: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    closeReason: "MANUAL",
    regime: "ACCUMULATION",
    mfe: 75.0,
    mae: -5.0
  },
  {
    id: "TRD-8340",
    symbol: "XAUUSD",
    type: "BUY",
    entryPrice: 2356.2,
    currentPrice: 2354.2,
    closePrice: 2354.2,
    size: 0.25,
    pnl: -50.0,
    strategyId: "MWDX",
    strategyName: "Multi-Timeframe Divergence",
    status: "CLOSED",
    openTime: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
    closeTime: new Date(Date.now() - 17.5 * 3600 * 1000).toISOString(),
    closeReason: "MANUAL",
    regime: "RANGING_CHOP",
    mfe: 15.0,
    mae: -80.0
  }
];

// Seed initial Enrichment items for the synthetic ledger
const DEFAULT_ENRICHMENTS: Record<string, JournalEnrichment> = {
  "TRD-8409": {
    setupType: "A_PLUS",
    mistakeType: "NONE",
    emotion: "DISCIPLINED",
    notes: "Perfect confluence on 15m breakout after consolidation. Executed cleanly on H4 support. Held to full TP.",
    rating: 5
  },
  "TRD-8392": {
    setupType: "STANDARD",
    mistakeType: "NONE",
    emotion: "DISCIPLINED",
    notes: "London open expansion bracket strategy. Fast profit target reached within 90 minutes. High liquidity execution.",
    rating: 4
  },
  "TRD-8381": {
    setupType: "COUNTER",
    mistakeType: "MOVED_SL",
    emotion: "FEAR",
    notes: "Aggressive counter-trend entry on gold. Panic adjusted stop loss mid-session, expanding loss size unnecessarily.",
    rating: 2
  },
  "TRD-8374": {
    setupType: "FOMO",
    mistakeType: "CHASED",
    emotion: "FOMO",
    notes: "Chased SPX500 after rapid surge. Poor fill price leading to tight stop-out prior to market continuation. Need to await pullbacks.",
    rating: 1
  },
  "TRD-8360": {
    setupType: "A_PLUS",
    mistakeType: "NONE",
    emotion: "DISCIPLINED",
    notes: "Brilliant bearish trend persistence play. Correct volume validation confirmed sellers in control. Extremely clean execution.",
    rating: 5
  },
  "TRD-8351": {
    setupType: "STANDARD",
    mistakeType: "EARLY_EXIT",
    emotion: "FEAR",
    notes: "Took partial manual exit too early out of anxiety. The EMA line never crossed bearish. Left around 60% of the potential move on the table.",
    rating: 3
  },
  "TRD-8340": {
    setupType: "FOMO",
    mistakeType: "OVER_LEVERAGE",
    emotion: "GREED",
    notes: "High lot sizing under severe ranging conditions. Cut early once consolidation began dragging. Felt anxious.",
    rating: 2
  }
};

export default function JournalView({ state, onRefresh, activeSubMenu, onSwitchSubMenu }: JournalViewProps) {
  const [activeTab, setActiveTabInternal] = useState<SubmenuType>("OVERVIEW");

  useEffect(() => {
    if (activeSubMenu) {
      setActiveTabInternal(activeSubMenu);
    }
  }, [activeSubMenu]);

  const setActiveTab = (tab: SubmenuType) => {
    setActiveTabInternal(tab);
    onSwitchSubMenu?.(tab);
  };

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isWiped, setIsWiped] = useState<boolean>(() => {
    return localStorage.getItem("trading_journal_wiped") === "true";
  });

  // Helper to calculate direction-aware trade pips
  const getTradePipsValue = (trade: Trade) => {
    const entry = trade.entryPrice;
    const exit = trade.closePrice || trade.currentPrice;
    const isBuy = trade.type === "BUY";
    const diff = isBuy ? (exit - entry) : (entry - exit);
    
    let pipsVal = 0;
    if (trade.symbol.startsWith("BTC")) {
      pipsVal = diff;
    } else if (trade.symbol.startsWith("XAU")) {
      pipsVal = diff * 10;
    } else {
      pipsVal = diff * 10000;
    }
    return pipsVal;
  };

  const getTradePipsFormatted = (trade: Trade) => {
    const pipsVal = getTradePipsValue(trade);
    return `${pipsVal >= 0 ? "+" : ""}${pipsVal.toFixed(1)} pips`;
  };
  
  // Custom states for filtering and detail modal
  const [enrichments, setEnrichments] = useState<Record<string, JournalEnrichment>>(() => {
    const saved = localStorage.getItem("trading_journal_enrichments");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_ENRICHMENTS;
      }
    }
    return DEFAULT_ENRICHMENTS;
  });

  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [selectedTradeEnrichment, setSelectedTradeEnrichment] = useState<JournalEnrichment>({
    setupType: "STANDARD",
    mistakeType: "NONE",
    emotion: "DISCIPLINED",
    notes: "",
    rating: 3
  });

  // Filter criteria for LOG tab
  const [symbolFilter, setSymbolFilter] = useState<string>("ALL");
  const [outcomeFilter, setOutcomeFilter] = useState<string>("ALL");
  const [setupFilter, setSetupFilter] = useState<string>("ALL");
  const [emotionFilter, setEmotionFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    localStorage.setItem("trading_journal_enrichments", JSON.stringify(enrichments));
  }, [enrichments]);

  // Combine real closed trades with synthetic once on mount to have robust historical data
  // Only keep actual win and loss trades (pnl !== 0, status === "CLOSED") and remove all blocked/inactive operations
  const realClosed = state.trades.filter(t => t.status === "CLOSED" && t.pnl !== 0);
  const journalTrades = isWiped 
    ? [] 
    : [...realClosed, ...SYNTHETIC_CLOSED_TRADES.filter(st => !realClosed.some(rt => rt.id === st.id))]
        .filter(t => t.status === "CLOSED" && t.pnl !== 0);

  // Helper utils
  const getPnlColor = (pnl: number) => (pnl >= 0 ? "text-emerald-400" : "text-rose-400");
  const getPnlBg = (pnl: number) => (pnl >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10");

  const getSetupLabel = (key: string) => {
    switch (key) {
      case "A_PLUS": return "A+ Confluence";
      case "STANDARD": return "Standard Plan";
      case "FOMO": return "FOMO Chase";
      case "LATE": return "Late Breakout";
      case "COUNTER": return "Counter-Trend";
      default: return "Unspecified";
    }
  };

  const getMistakeLabel = (key: string) => {
    switch (key) {
      case "NONE": return "None (Perfect Rule Execution)";
      case "MOVED_SL": return "Prematurely Shifted SL";
      case "MOVED_TP": return "Moved Target Too Far";
      case "EARLY_EXIT": return "Anxious Early Exit";
      case "OVER_LEVERAGE": return "Exceeded Risk Leverage";
      case "CHASED": return "Chased Retrogression";
      default: return "Undocumented";
    }
  };

  const getEmotionLabel = (key: string) => {
    switch (key) {
      case "DISCIPLINED": return "Calm & Disciplined";
      case "FOMO": return "FOMO (Anxious Pull)";
      case "GREED": return "Greed (Impulsive Profit Target)";
      case "FEAR": return "Fear / Risk Hesitant";
      case "REVENGE": return "Revenge Entry Trigger";
      case "OVERCONFIDENT": return "Overconfident Drift";
      default: return "Neutral state";
    }
  };

  // Star Generator Utility
  const renderStars = (num: number, onClick?: (n: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            className={`h-4.5 w-4.5 ${onClick ? "cursor-pointer transition-transform hover:scale-125" : ""} ${
              i <= num ? "text-amber-400 fill-amber-400" : "text-zinc-700"
            }`}
            onClick={() => onClick && onClick(i)}
          />
        ))}
      </div>
    );
  };

  // Perform quantitative analytics based on filtered or combined list
  const totalRealized = journalTrades.reduce((sum, t) => sum + t.pnl, 0);
  const totalTradesCount = journalTrades.length;
  const winsCount = journalTrades.filter(t => t.pnl >= 0).length;
  const lossesCount = journalTrades.filter(t => t.pnl < 0).length;
  const winRate = totalTradesCount > 0 ? ((winsCount / totalTradesCount) * 100).toFixed(1) : "0.0";
  
  const grossProfit = journalTrades.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const grossLoss = Math.abs(journalTrades.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? "∞" : "0.00";

  const avgWin = winsCount > 0 ? grossProfit / winsCount : 0;
  const avgLoss = lossesCount > 0 ? grossLoss / lossesCount : 0;
  const rrRatio = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "0.00";

  // Expectancy calculation (WinRate * AvgWin) - (LossRate * AvgLoss)
  const rateW = winsCount / Math.max(1, totalTradesCount);
  const rateL = lossesCount / Math.max(1, totalTradesCount);
  const expectancyVal = (rateW * avgWin) - (rateL * avgLoss);

  // Maximum consecutive losses (Simple estimate or actual stream assessment)
  let maxConsecutiveLosses = 0;
  let tempConsec = 0;
  const sortedByTime = [...journalTrades].sort((a, b) => new Date(a.openTime).getTime() - new Date(b.openTime).getTime());
  sortedByTime.forEach((t) => {
    if (t.pnl < 0) {
      tempConsec += 1;
      if (tempConsec > maxConsecutiveLosses) maxConsecutiveLosses = tempConsec;
    } else {
      tempConsec = 0;
    }
  });

  // Calculate stats by Setup Type
  const setupStats = ["A_PLUS", "STANDARD", "FOMO", "LATE", "COUNTER"].map((key) => {
    const list = journalTrades.filter((t) => {
      const enrichment = enrichments[t.id];
      return enrichment ? enrichment.setupType === key : key === "STANDARD"; // Default falls back to Standard
    });
    const count = list.length;
    const wins = list.filter(t => t.pnl >= 0).length;
    const wr = count > 0 ? ((wins / count) * 100).toFixed(1) : "0.0";
    const netPnL = list.reduce((sum, t) => sum + t.pnl, 0);
    return { key, count, wr, netPnL };
  });

  // Calculate mistake financial damage leakage
  const mistakeLeakage = ["NONE", "MOVED_SL", "MOVED_TP", "EARLY_EXIT", "OVER_LEVERAGE", "CHASED"].map((key) => {
    const list = journalTrades.filter((t) => {
      const enrichment = enrichments[t.id];
      return enrichment ? enrichment.mistakeType === key : key === "NONE"; // Default to None
    });
    const count = list.length;
    const grossDeflict = list.reduce((sum, t) => sum + Math.min(0, t.pnl), 0);
    const totalPnl = list.reduce((sum, t) => sum + t.pnl, 0);
    return { key, count, damage: Math.abs(grossDeflict), totalPnl };
  });

  // Calculate psychology performance
  const psychologyPerformance = ["DISCIPLINED", "FOMO", "GREED", "FEAR", "REVENGE", "OVERCONFIDENT"].map((key) => {
    const list = journalTrades.filter((t) => {
      const enrichment = enrichments[t.id];
      return enrichment ? enrichment.emotion === key : key === "DISCIPLINED"; // Default
    });
    const count = list.length;
    const wins = list.filter(t => t.pnl >= 0).length;
    const wr = count > 0 ? ((wins / count) * 100).toFixed(1) : "0.0";
    const totalPnl = list.reduce((sum, t) => sum + t.pnl, 0);
    return { key, count, wr, totalPnl };
  });

  // AI Coaching states
  const [coachingReport, setCoachingReport] = useState<string>(() => {
    return localStorage.getItem("journal_coaching_report") || "";
  });
  const [coachingLoading, setCoachingLoading] = useState<boolean>(false);
  const [coachingKeyStatus, setCoachingKeyStatus] = useState<string>("unknown");
  const [coachingError, setCoachingError] = useState<string>("");

  const handleGenerateCoaching = async () => {
    setCoachingLoading(true);
    setCoachingError("");
    try {
      // Gather relevant notes from recent closed trades
      const recentNotes = sortedByTime.slice(-6).map((t) => {
        const e = enrichments[t.id];
        return {
          id: t.id,
          symbol: t.symbol,
          type: t.type,
          pnl: t.pnl,
          notes: e?.notes || "",
          emotion: e?.emotion || "DISCIPLINED"
        };
      });

      const response = await fetch("/api/ai/analyze-journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metrics: {
            winRate,
            profitFactor,
            totalTradesCount,
            rrRatio,
            expectancyVal,
            avgWin,
            avgLoss
          },
          setupStats,
          mistakeLeakage,
          psychologyPerformance,
          recentNotes
        })
      });

      if (!response.ok) {
        throw new Error("Server responded with error status: " + response.status);
      }

      const data = await response.json();
      setCoachingReport(data.text);
      if (data.keyStatus) {
        setCoachingKeyStatus(data.keyStatus);
      }
      localStorage.setItem("journal_coaching_report", data.text);
    } catch (err: any) {
      console.error("Coaching generation error: ", err);
      setCoachingError(err.message || "Failed to generate coaching suggestions");
    } finally {
      setCoachingLoading(false);
    }
  };

  // Handle clicked trade to edit
  const handleEditEnrichment = (trade: Trade) => {
    setSelectedTrade(trade);
    const exist = enrichments[trade.id] || {
      setupType: "STANDARD",
      mistakeType: "NONE",
      emotion: "DISCIPLINED",
      notes: "",
      rating: 3
    };
    setSelectedTradeEnrichment(exist);
  };

  const handleSaveEnrichment = () => {
    if (!selectedTrade) return;
    setEnrichments((prev) => ({
      ...prev,
      [selectedTrade.id]: selectedTradeEnrichment
    }));
    setSelectedTrade(null);
  };

  // Filtered Log list
  const filteredLogTrades = journalTrades.filter((t) => {
    const enrichment = enrichments[t.id] || {
      setupType: "STANDARD",
      mistakeType: "NONE",
      emotion: "DISCIPLINED",
      notes: "",
      rating: 3
    };

    if (symbolFilter !== "ALL" && t.symbol !== symbolFilter) return false;
    
    if (outcomeFilter === "WINS" && t.pnl < 0) return false;
    if (outcomeFilter === "LOSSES" && t.pnl >= 0) return false;

    if (setupFilter !== "ALL" && enrichment.setupType !== setupFilter) return false;
    if (emotionFilter !== "ALL" && enrichment.emotion !== emotionFilter) return false;

    if (searchQuery) {
      const s = searchQuery.toLowerCase();
      const matchText = `${t.id} ${t.symbol} ${t.strategyName} ${enrichment.notes}`.toLowerCase();
      if (!matchText.includes(s)) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Upper header section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between select-none border-b border-zinc-900 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-black text-white hover:text-emerald-400 font-display flex items-center gap-2.5 tracking-wider uppercase">
            <BookOpen className="h-5 w-5 text-emerald-400" />
            Institutional Trading Journal
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Audit rule confluences, mechanical mistakes, and behavioral biases to trace psychological alpha leakage.
          </p>
        </div>

        {/* Dynamic sub navigation buttons & reset */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-1.5 bg-zinc-950 p-1 border border-zinc-900 rounded-lg">
            {(["OVERVIEW", "SETUPS", "MISTAKES", "PSYCHOLOGY", "LOG"] as SubmenuType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-1.5 px-3 rounded text-[11px] font-bold uppercase transition-all tracking-wider ${
                  activeTab === tab
                    ? "bg-zinc-900 text-white border-b-2 border-emerald-500"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-950"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-1.5 py-1.5 px-3.5 rounded text-[11px] font-black uppercase bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-all font-sans cursor-pointer active:scale-95"
            title="Wipe or reset trading journal annotations"
          >
            <RotateCcw className="h-3.5 w-3.5 animate-pulse" />
            Reset Ledger
          </button>
        </div>
      </div>

      {showResetConfirm && (
        <div className="p-5 rounded-xl border border-rose-550/20 border-rose-500/20 bg-rose-500/5 text-left animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                DANGER: CLEAR JOURNALED ANNOTATIONS?
              </span>
              <p className="text-xs text-zinc-400 leading-normal max-w-2xl font-sans">
                This process will wipe out custom notes, emotional indicators, setup types, mistake analysis categories, and star scoring from local storage across your ledger workspace. This change is permanent.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  setEnrichments({});
                  localStorage.removeItem("trading_journal_enrichments");
                  setIsWiped(true);
                  localStorage.setItem("trading_journal_wiped", "true");
                  try {
                    await fetch("/api/state/reset", { method: "POST" });
                  } catch (e) {
                    console.error("API call to state reset failed", e);
                  }
                  if (onRefresh) {
                    await onRefresh();
                  }
                  setShowResetConfirm(false);
                }}
                className="py-2 px-3.5 rounded text-[11px] font-black uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white transition-all cursor-pointer active:scale-95"
              >
                Wipe to Blank
              </button>
              <button
                onClick={() => {
                  setEnrichments(DEFAULT_ENRICHMENTS);
                  localStorage.setItem("trading_journal_enrichments", JSON.stringify(DEFAULT_ENRICHMENTS));
                  setIsWiped(false);
                  localStorage.setItem("trading_journal_wiped", "false");
                  setShowResetConfirm(false);
                }}
                className="py-2 px-3.5 rounded text-[11px] font-extrabold uppercase tracking-wider bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-850 hover:border-zinc-700 transition-all cursor-pointer active:scale-95"
              >
                Restore Demo
              </button>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="py-2 px-3.5 rounded text-[11px] font-bold uppercase tracking-wider bg-zinc-950 text-zinc-500 hover:text-zinc-450 transition-all cursor-pointer active:scale-95"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERVIEW SUBMENU */}
      {activeTab === "OVERVIEW" && (
        <div className="space-y-6 select-none font-sans">
          {/* AI Cognitive Psychology Coach Banner */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden transition-all duration-300">
            <div className="absolute top-0 right-0 h-32 w-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-1 text-left">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Brain className="h-4 w-4 text-emerald-400 animate-pulse" />
                  Cognitive Performance Coach Active
                </span>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  AI Emotional & Alpha Leakage Audit
                </h3>
                <p className="text-xs text-zinc-400 leading-normal max-w-2xl font-sans">
                  Synchronize your active setups, psychological marks, and mechanical mistakes to synthesize institutional alpha protection coaching. Driven by Google Gemini.
                </p>
              </div>
              <div className="flex flex-col items-stretch sm:items-end gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleGenerateCoaching}
                  disabled={coachingLoading}
                  className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-black uppercase tracking-wider transition-all shadow-md cursor-pointer active:scale-95"
                >
                  {coachingLoading ? (
                    <>
                      <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Analyzing Habits...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Synthesize AI Audit
                    </>
                  )}
                </button>
                {coachingKeyStatus !== "unknown" && (
                  <span className="text-[9px] font-mono text-zinc-500 uppercase text-center sm:text-right">
                    API Link: {coachingKeyStatus === "active" ? "Connected (Secure Key)" : "Simulation Mode (Demo Output)"}
                  </span>
                )}
              </div>
            </div>

            {coachingError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono text-left">
                {coachingError}
              </div>
            )}

            {coachingReport && (
              <div className="mt-4 bg-zinc-950/60 rounded-xl border border-zinc-900/80 p-5 text-left relative animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="absolute top-3 right-3 flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coachingReport);
                    }}
                    className="py-1 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold text-zinc-400 hover:text-white uppercase transition-all cursor-pointer font-sans"
                  >
                    Copy Audit
                  </button>
                  <button
                    onClick={() => {
                      setCoachingReport("");
                      localStorage.removeItem("journal_coaching_report");
                    }}
                    className="py-1 px-2 rounded bg-zinc-905 bg-zinc-900 border border-zinc-805 border-zinc-800 text-[10px] font-bold text-zinc-500 hover:text-rose-455 hover:text-rose-400 transition-all cursor-pointer font-sans"
                    title="Dismiss prompt"
                  >
                    Dismiss
                  </button>
                </div>
                <div className="font-sans text-xs leading-relaxed text-zinc-350 text-zinc-300 whitespace-pre-wrap select-all pr-20">
                  {coachingReport}
                </div>
              </div>
            )}
          </div>

          {/* Main Key metrics row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            {/* Realized metrics */}
            <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:scale-[1.02] group">
              <div className="absolute top-0 right-0 h-12 w-12 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10" />
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                  Journalized Profit Factor
                </span>
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black leading-none">
                  HEALTHY
                </span>
              </div>
              <span className="font-mono text-3xl font-black text-white block tracking-tight">{profitFactor}</span>
              <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 text-xs font-mono">
                <span>Gross Profit:</span>
                <span className="text-emerald-400 font-bold">${grossProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Winrate */}
            <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] hover:scale-[1.02] group">
              <div className="absolute top-0 right-0 h-12 w-12 bg-blue-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-blue-500/10" />
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Percent className="h-3.5 w-3.5 text-blue-400" />
                  Overall Win Rate
                </span>
                <span className="text-[9.5px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded font-bold">
                  LEDGER
                </span>
              </div>
              <span className="font-mono text-3xl font-black text-white block tracking-tight">{winRate}%</span>
              <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 text-xs font-mono">
                <span>Wins / Losses count:</span>
                <span className="text-zinc-300 font-bold">{winsCount} Win / {lossesCount} Loss</span>
              </div>
            </div>

            {/* Hold Ratio (R-Expectancy) */}
            <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(234,179,8,0.05)] hover:scale-[1.02] group">
              <div className="absolute top-0 right-0 h-12 w-12 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10" />
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <Scale className="h-3.5 w-3.5 text-amber-500" />
                  Profit Expectancy
                </span>
                <span className="text-[9px] font-mono text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded font-black">
                  EXPECTANCY
                </span>
              </div>
              <span className="font-mono text-3xl font-black text-white block tracking-tight">{expectancyVal >= 0 ? "+" : ""}${expectancyVal.toFixed(1)}</span>
              <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 text-xs font-mono">
                <span>Expectancy per trade:</span>
                <span className={expectancyVal >= 0 ? "text-emerald-400 font-bold" : "text-rose-450 text-rose-400 font-bold"}>
                  {expectancyVal >= 0 ? "POSITIVE" : "NEGATIVE EDGE"}
                </span>
              </div>
            </div>

            {/* Risk Reward ratio */}
            <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(161,161,170,0.05)] hover:scale-[1.02] group">
              <div className="absolute top-0 right-0 h-12 w-12 bg-zinc-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-zinc-500/10" />
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-zinc-400" />
                  Win/Loss Ratio
                </span>
                <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-bold">
                  RISK UNITS
                </span>
              </div>
              <span className="font-mono text-3xl font-black text-white block tracking-tight">{rrRatio}x</span>
              <div className="mt-4 flex items-center justify-between text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 text-xs font-mono">
                <span>Avg Win vs Loss size:</span>
                <span className="text-zinc-300 font-bold">${avgWin.toFixed(0)} vs ${avgLoss.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Core Analytics Blocks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Visual Balance Progression Timeline */}
            <div className="lg:col-span-2 rounded-xl border border-zinc-900 bg-[#0c0d0f]/60 p-5 space-y-4 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs uppercase font-extrabold tracking-wider text-white flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Simulated P&L Accumulation Curve
                  </span>
                  <span className="text-[10px] text-zinc-500 block">Sequential compounding performance steps inside the ledger window</span>
                </div>
                <div className="text-right">
                  <span className="font-mono text-lg font-black block text-emerald-400">
                    {totalRealized >= 0 ? "+" : ""}${totalRealized.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                  </span>
                </div>
              </div>

              {/* Dynamic visual graph made in CSS elements for ultimate robustness */}
              <div className="relative h-48 bg-zinc-950/40 rounded-lg border border-zinc-900/60 p-4 flex flex-col justify-between">
                {/* Horizontal reference lines */}
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-zinc-900/60 z-0 pointer-events-none flex items-center justify-start">
                  <span className="text-[9px] font-mono text-zinc-650 bg-zinc-950 px-1 ml-2 relative -top-2.5">EQUILIBRIUM BEP</span>
                </div>

                {/* Vertical bars indicating trade outcomes */}
                <div className="flex items-end justify-between h-36 w-full px-2 z-10">
                  {sortedByTime.map((t, idx) => {
                    const isWinner = t.pnl >= 0;
                    const maxPnl = Math.max(...journalTrades.map(i => Math.abs(i.pnl)), 100);
                    const heightPercent = Math.min(100, (Math.abs(t.pnl) / maxPnl) * 100);
                    return (
                      <div key={t.id} className="flex flex-col items-center flex-1 h-full px-1 group cursor-pointer relative justify-center">
                        {/* Tooltip on Hover */}
                        <div className="absolute bottom-full opacity-0 group-hover:opacity-100 bg-zinc-900 border border-zinc-800 text-white rounded p-2 text-[10px] font-mono z-30 transition-opacity pointer-events-none whitespace-nowrap mb-1">
                          <p className="font-bold text-white">{t.symbol} ({t.type})</p>
                          <p className={isWinner ? "text-emerald-400" : "text-rose-450 text-rose-400"}>PnL: {isWinner ? "+" : ""}${t.pnl.toFixed(1)}</p>
                          <p className="text-zinc-500 text-[9px]">{new Date(t.openTime).toLocaleDateString()}</p>
                        </div>

                        {/* Visual Step Fill */}
                        <div className="w-full flex flex-col h-full relative">
                          {isWinner ? (
                            <div className="absolute bottom-1/2 left-0 right-0 bg-emerald-500/80 hover:bg-emerald-400 rounded-t-sm transition-all" style={{ height: `${heightPercent / 2}%` }} />
                          ) : (
                            <div className="absolute top-1/2 left-0 right-0 bg-rose-500/80 hover:bg-rose-400 rounded-b-sm transition-all" style={{ height: `${heightPercent / 2}%` }} />
                          )}
                        </div>

                        {/* Label */}
                        <span className="text-[8px] font-mono text-zinc-600 mt-1.5">{idx + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom line labels */}
                <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500 border-t border-zinc-900/60 pt-2 px-1">
                  <span>Start Period Ledger</span>
                  <span>{journalTrades.length} Total Settled Trades</span>
                  <span>Latest Closed Trade</span>
                </div>
              </div>
            </div>

            {/* Quick Audit Sidebar Information */}
            <div className="rounded-xl border border-zinc-900 bg-[#0c0d0f]/60 p-5 space-y-4 text-left font-sans">
              <span className="text-xs uppercase font-extrabold tracking-wider text-white block pb-2 border-b border-zinc-900 flex items-center gap-2">
                <Clock className="h-4 w-4 text-emerald-400" />
                Performance Underpinnings
              </span>

              <div className="space-y-3 font-mono text-[11px]">
                <div className="flex justify-between items-center py-1 border-b border-zinc-900/40">
                  <span className="text-zinc-555 text-zinc-550">Average Winning Trade</span>
                  <span className="text-emerald-400 font-bold">+${avgWin.toFixed(1)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-zinc-900/40">
                  <span className="text-zinc-555 text-zinc-555">Average Losing Trade</span>
                  <span className="text-rose-400 font-bold">-${avgLoss.toFixed(1)}</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-zinc-900/40">
                  <span className="text-zinc-555 text-zinc-555">Max Drawdown Streak</span>
                  <span className="text-rose-400 font-bold">{maxConsecutiveLosses} Trades</span>
                </div>

                <div className="flex justify-between items-center py-1 border-b border-zinc-900/40">
                  <span className="text-zinc-555 text-zinc-555">Enriched Star Ratings</span>
                  <div className="flex items-center gap-1">
                    {renderStars(
                      Math.round(
                        journalTrades.reduce((sum, t) => sum + (enrichments[t.id]?.rating || 3), 0) /
                          Math.max(1, journalTrades.length)
                      )
                    )}
                  </div>
                </div>

                <div className="flex justify-between items-center py-1">
                  <span className="text-zinc-555 text-zinc-555">Auto-Optimized Ratio</span>
                  <span className="text-emerald-400 font-bold font-sans text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 border border-emerald-500/20 uppercase">
                    PASSING
                  </span>
                </div>
              </div>

              {/* Insights block */}
              <div className="rounded-lg bg-zinc-950 p-3.5 border border-zinc-900 mt-2">
                <div className="flex gap-2 text-amber-400/90 text-xs font-bold font-sans">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Institutional Risk Alert</span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal mt-1">
                  {expectancyVal >= 10
                    ? `Your positive trade expectancy is solid at $${expectancyVal.toFixed(1)}. Focus on preserving standard confluences. Keep standard stop-losses strict and do not change stop settings mid-trade out of anxiety.`
                    : `Your current expectation edge is weak. Stop loss adjustments or early execution trigger errors are leaking margin. Review your Mistake and Psychology dashboard.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SETUP VALIDATION TAB */}
      {activeTab === "SETUPS" && (
        <div className="space-y-6 text-left select-none font-sans">
          <div className="rounded-xl border border-zinc-900 bg-[#0c0d0f]/60 p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1.5">
              <Award className="h-4 w-4 text-emerald-400" />
              Trade Entry Setup Quality & Rules Validation
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-sans">
              Measures the actual profitability of your setups. Categorizing and enforcing standard confluences prevents fomo chases and counter-trend bleeding.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {setupStats.map((stat) => {
                const colorMap: Record<string, string> = {
                  A_PLUS: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5",
                  STANDARD: "border-blue-500/30 text-blue-400 bg-blue-500/5",
                  FOMO: "border-rose-500/30 text-rose-450 text-rose-400 bg-rose-500/5",
                  LATE: "border-amber-500/30 text-amber-500 bg-amber-500/5",
                  COUNTER: "border-purple-500/30 text-purple-400 bg-purple-500/5"
                };

                const isDamage = stat.netPnL < 0;

                return (
                  <div
                    key={stat.key}
                    className={`rounded-xl border p-4 flex flex-col justify-between transition-all hover:scale-[1.02] ${
                      colorMap[stat.key] || "border-zinc-900 text-zinc-400"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-wider block mb-1">
                        {getSetupLabel(stat.key)}
                      </span>
                      <span className="text-[10px] text-zinc-500 block">
                        Count: <span className="text-white font-mono font-bold">{stat.count} positions</span>
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-zinc-900/40">
                      <div className="flex justify-between text-[11px] font-mono leading-none mb-1">
                        <span className="text-zinc-500">Win Rate:</span>
                        <span className="text-white font-bold">{stat.wr}%</span>
                      </div>
                      <div className="flex justify-between text-[11px] font-mono leading-none">
                        <span className="text-zinc-500 text-zinc-500">Net Profit:</span>
                        <span className={`font-bold ${isDamage ? "text-rose-400" : "text-emerald-400"}`}>
                          {stat.netPnL >= 0 ? "+" : ""}${stat.netPnL.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quality confluences list */}
            <div className="mt-8 rounded-lg bg-zinc-950 p-4 border border-zinc-900">
              <span className="text-xs font-bold text-white uppercase tracking-wider block mb-2 font-display">
                Institutional Playbook Optimization Action Items:
              </span>
              <ul className="text-xs text-zinc-400 space-y-2 leading-relaxed font-sans">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>A+ Confluences</strong> represent entries where multiple-timeframe support lines, divergence, and volume triggers lock simultaneously. Prioritize capital allocation here.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-455 text-rose-400 mt-0.5 shrink-0" />
                  <span>
                    <strong>FOMO Chase / Impulse Entries</strong> leak edge rapidly. Consider disabling your auto-trade bot if you recognize frequent breakout scaling patterns with low consolidation frames.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* MISTAKE REVIEM CAN_LEAK */}
      {activeTab === "MISTAKES" && (
        <div className="space-y-6 text-left select-none font-sans">
          <div className="rounded-xl border border-zinc-900 bg-[#0c0d0f]/60 p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1.5">
              <AlertTriangle className="h-4 w-4 text-rose-400" />
              Institutional Financial Mistake Leverage Audit
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-sans">
              Quantifies mechanical slip damage. Assigning tags to premature executions or manual exit panic shows exactly where capital is lost.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {mistakeLeakage.map((leak) => {
                const maxDamageLimit = Math.max(...mistakeLeakage.map(l => l.damage), 1);
                const pct = (leak.damage / maxDamageLimit) * 100;
                const isPerfect = leak.key === "NONE";

                return (
                  <div key={leak.key} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 hover:scale-[1.01] transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase text-zinc-300 tracking-wider">
                          {getMistakeLabel(leak.key)}
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500">{leak.count} trades</span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-baseline justify-between mb-1">
                          <span className="text-[10px] text-zinc-550 text-zinc-500 uppercase">Capital Leakage:</span>
                          <span className={`text-[13px] font-mono font-bold font-black ${isPerfect ? "text-emerald-400" : "text-rose-455 text-rose-400"}`}>
                            {isPerfect ? "No Leakage" : `-$${leak.damage}`}
                          </span>
                        </div>
                        {/* CSS Progress Bar */}
                        {!isPerfect && (
                          <div className="w-full h-1.5 bg-zinc-900 rounded-full overflow-hidden mt-1">
                            <div className="bg-rose-500 h-full rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-zinc-900/50 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-zinc-550 text-zinc-500">Net Return:</span>
                      <span className={getPnlColor(leak.totalPnl)}>
                        {leak.totalPnl >= 0 ? "+" : ""}${leak.totalPnl}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* PSYCHOLOGY REVIEW TAB */}
      {activeTab === "PSYCHOLOGY" && (
        <div className="space-y-6 text-left select-none font-sans">
          <div className="rounded-xl border border-zinc-900 bg-[#0c0d0f]/60 p-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1.5">
              <Smile className="h-4 w-4 text-emerald-400" />
              Emotional Biases & Psychology Performance Audit
            </h3>
            <p className="text-xs text-zinc-500 mb-6 font-sans">
              Aggregates metrics by emotional states. Identifies internal trading dynamics to see which feelings trigger risk edge breakdown.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {psychologyPerformance.map((emo) => {
                const colorMap: Record<string, string> = {
                  DISCIPLINED: "text-emerald-400 bg-emerald-500/5 border-emerald-500/20",
                  FOMO: "text-rose-400 bg-rose-500/5 border-rose-500/20",
                  GREED: "text-amber-500 bg-amber-500/5 border-amber-500/20",
                  FEAR: "text-blue-400 bg-blue-500/5 border-blue-500/20",
                  REVENGE: "text-purple-400 bg-purple-500/5 border-purple-500/20",
                  OVERCONFIDENT: "text-zinc-400 bg-zinc-800/10 border-zinc-700"
                };

                return (
                  <div key={emo.key} className="p-4 rounded-xl border border-zinc-900 bg-zinc-950/40 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between border-b border-zinc-900/40 pb-2 mb-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-white">
                          {getEmotionLabel(emo.key)}
                        </span>
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase font-bold ${colorMap[emo.key]}`}>
                          {emo.count} trades
                        </span>
                      </div>

                      <div className="space-y-1 mt-3">
                        <div className="flex justify-between items-center text-[11px] font-mono leading-none">
                          <span className="text-zinc-555 text-zinc-500">Emotion Win Rate:</span>
                          <span className="text-white font-bold">{emo.wr}%</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px] font-mono leading-none pt-1">
                          <span className="text-zinc-555 text-zinc-550">Emotion Net Yield:</span>
                          <span className={`font-bold ${emo.totalPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                            {emo.totalPnl >= 0 ? "+" : ""}${emo.totalPnl}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-zinc-900/50 text-[10px] text-zinc-500 leading-normal italic">
                      {emo.key === "DISCIPLINED" && "System operating cleanly during calm execution periods."}
                      {emo.key === "FOMO" && "Fell for breakout chase. Risk factor remains elevated."}
                      {emo.key === "GREED" && "Exceeded risk units or adjusted targets suboptimally out of greed."}
                      {emo.key === "FEAR" && "Took early exit because of panic. Missed original forecast."}
                      {emo.key === "REVENGE" && "Risk lock violation alerts triggered. Slashes average returns."}
                      {emo.key === "OVERCONFIDENT" && "Unplanned manual position following prior wins."}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TRADING JOURNAL DETAIL LOG TAB */}
      {activeTab === "LOG" && (
        <div className="space-y-6 text-left select-none">
          {/* Filters shelf */}
          <div className="p-4 rounded-xl border border-zinc-900 bg-[#0c0d0f]/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search query input */}
            <div className="relative">
              <span className="text-[9px] text-zinc-550 uppercase font-black text-zinc-500 block mb-1">Search text</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ticket, pair, notes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-900 text-xs px-2.5 py-1.5 pl-8 rounded text-white focus:outline-none focus:border-emerald-500 placeholder-zinc-700"
                />
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-650" />
              </div>
            </div>

            {/* Symbol filtering selection */}
            <div>
              <span className="text-[9px] text-zinc-550 uppercase font-black text-zinc-500 block mb-1">Currency / Asset</span>
              <select
                value={symbolFilter}
                onChange={(e) => setSymbolFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Currency Pairs</option>
                <option value="BTCUSD">BTC / USDT</option>
                <option value="EURUSD">EUR / USD</option>
                <option value="GBPUSD">GBP / USD</option>
                <option value="AAPL">AAPL Stocks</option>
                <option value="SPX500">SPX500 Index</option>
                <option value="XAUUSD">XAU / USD</option>
              </select>
            </div>

            {/* Win Loss filter selector */}
            <div>
              <span className="text-[9px] text-zinc-550 uppercase font-black text-zinc-500 block mb-1">Outcome Class</span>
              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Trades</option>
                <option value="WINS">Win Trades Only</option>
                <option value="LOSSES">Loss Trades Only</option>
              </select>
            </div>

            {/* Rules validation filter */}
            <div>
              <span className="text-[9px] text-zinc-550 uppercase font-black text-zinc-500 block mb-1">Setup Type</span>
              <select
                value={setupFilter}
                onChange={(e) => setSetupFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Setup Classes</option>
                <option value="A_PLUS">A+ Confluence Setup</option>
                <option value="STANDARD">Standard Setup Plan</option>
                <option value="FOMO">FOMO Chase Entry</option>
                <option value="LATE">Late Breakout Fill</option>
                <option value="COUNTER">Counter-Trend Play</option>
              </select>
            </div>

            {/* Emotion filter selector */}
            <div>
              <span className="text-[9px] text-zinc-550 uppercase font-black text-zinc-500 block mb-1">Psychology Class</span>
              <select
                value={emotionFilter}
                onChange={(e) => setEmotionFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-900 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Emotions</option>
                <option value="DISCIPLINED">Calm & Disciplined</option>
                <option value="FOMO">FOMO Worry State</option>
                <option value="GREED">Quick greed reflex</option>
                <option value="FEAR">Fear and doubt Hesitant</option>
                <option value="REVENGE">Revenge triggered drift</option>
              </select>
            </div>
          </div>

          {/* Journal Table list */}
          <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-[#0c0d0f]/60 font-sans text-xs">
            {filteredLogTrades.length === 0 ? (
              <div className="py-12 text-center text-zinc-500">
                <Filter className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                <p>No journaled trades match active filters.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="border-b border-zinc-900 bg-zinc-950/60 font-display text-[10px] uppercase font-bold text-zinc-500 whitespace-nowrap">
                    <th className="py-3 px-4">Ticket</th>
                    <th className="py-3 px-4">Assets</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Size</th>
                    <th className="py-3 px-3 border-r border-zinc-900/30">Close Price</th>
                    <th className="py-3 px-3 text-cyan-400 font-bold">Pips</th>
                    <th className="py-3 px-4">Setup Type</th>
                    <th className="py-3 px-4">Mistake Class</th>
                    <th className="py-3 px-4">Psychology</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4 text-right">Net Yield</th>
                    <th className="py-3 px-4 text-center">Enrich</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono text-[11px] whitespace-nowrap">
                  {filteredLogTrades.map((trade) => {
                    const enrichment = enrichments[trade.id] || {
                      setupType: "STANDARD",
                      mistakeType: "NONE",
                      emotion: "DISCIPLINED",
                      notes: "",
                      rating: 3
                    };

                    const isWin = trade.pnl >= 0;

                    return (
                      <tr key={trade.id} className="hover:bg-zinc-900/30 transition-all border-b border-zinc-900/30">
                        {/* ID */}
                        <td className="py-3.5 px-4 font-bold text-zinc-450 truncate text-[11px] text-zinc-550 mr-2">{trade.id}</td>
                        {/* Asset */}
                        <td className="py-3.5 px-4 font-bold text-white font-sans">{trade.symbol}</td>
                        {/* Type */}
                        <td className="py-3.5 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                            trade.type === "BUY" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {trade.type}
                          </span>
                        </td>
                        {/* Size */}
                        <td className="py-3.5 px-3 text-zinc-300 font-semibold">{trade.size}</td>
                        {/* Close Price */}
                        <td className="py-3.5 px-3 text-zinc-400 font-bold border-r border-zinc-900/30">${trade.closePrice?.toLocaleString() || trade.currentPrice.toLocaleString()}</td>
                        
                        {/* Pips Column */}
                        <td className={`py-3.5 px-3 font-bold font-mono text-[11px] ${getTradePipsValue(trade) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                          {getTradePipsFormatted(trade)}
                        </td>
                        
                        {/* Setup Validation Column */}
                        <td className="py-3.5 px-4 font-sans text-zinc-200">
                          <span className={`p-1 rounded text-[10px] font-bold ${
                            enrichment.setupType === "A_PLUS" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            enrichment.setupType === "STANDARD" ? "bg-zinc-800 text-zinc-300 border border-zinc-700" :
                            "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          }`}>
                            {getSetupLabel(enrichment.setupType)}
                          </span>
                        </td>

                        {/* Mistakes Class Column */}
                        <td className="py-3.5 px-4 font-sans text-zinc-300">
                          <span className={`text-[10px] ${enrichment.mistakeType === "NONE" ? "text-emerald-400 font-bold" : "text-rose-455 text-rose-400 font-semibold"}`}>
                            {enrichment.mistakeType === "NONE" ? "Perfect Edge" : getMistakeLabel(enrichment.mistakeType)}
                          </span>
                        </td>

                        {/* Psychology State Column */}
                        <td className="py-3.5 px-4 font-sans text-zinc-300 text-[10px]">
                          {getEmotionLabel(enrichment.emotion)}
                        </td>

                        {/* Star Score rating */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex justify-center">
                            {renderStars(enrichment.rating)}
                          </div>
                        </td>

                        {/* Net Yield */}
                        <td className="py-3.5 px-4 text-right">
                          <span className={`font-black text-xs ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                            {isWin ? "+" : ""}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </span>
                        </td>

                        {/* Edit Button */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => handleEditEnrichment(trade)}
                            className="bg-zinc-900 border border-zinc-850 p-1 rounded hover:bg-zinc-800 text-zinc-350 cursor-pointer"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* DETAILED JOURNAL EDIT MODE POPUP/SLIDEOUT */}
      {selectedTrade && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans border border-none">
          <div className="w-full max-w-lg bg-zinc-950 border border-zinc-900 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 text-left">
            <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="h-4.5 w-4.5 text-emerald-400" />
                  Enrich Journal: ID {selectedTrade.id}
                </h4>
                <p className="text-[10px] text-zinc-500 uppercase font-mono mt-0.5">Asset: {selectedTrade.symbol} • Yield: ${selectedTrade.pnl}</p>
              </div>
              <button
                onClick={() => setSelectedTrade(null)}
                className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Star Rating picker */}
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Qualitative Execution Score</span>
                {renderStars(selectedTradeEnrichment.rating, (num) => setSelectedTradeEnrichment(prev => ({ ...prev, rating: num })))}
              </div>

              {/* Setup picker */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Setup Type</span>
                  <select
                    value={selectedTradeEnrichment.setupType}
                    onChange={(e) => setSelectedTradeEnrichment(prev => ({ ...prev, setupType: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-850 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="A_PLUS">A+ Confluence Match</option>
                    <option value="STANDARD">Standard Planned Pullback</option>
                    <option value="FOMO">FOMO Chase Entry</option>
                    <option value="LATE">Late Breakout Extension</option>
                    <option value="COUNTER">Counter-trend counter-trade</option>
                  </select>
                </div>

                {/* Emotion picker */}
                <div>
                  <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Psychology Sentiment</span>
                  <select
                    value={selectedTradeEnrichment.emotion}
                    onChange={(e) => setSelectedTradeEnrichment(prev => ({ ...prev, emotion: e.target.value }))}
                    className="w-full bg-zinc-900 border border-zinc-850 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="DISCIPLINED">Calm / Disciplined</option>
                    <option value="FOMO">Anxious / FOMO</option>
                    <option value="GREED">Aggressive / Greed</option>
                    <option value="FEAR">Fear / Hesitant</option>
                    <option value="REVENGE">Revenge triggered drift</option>
                    <option value="OVERCONFIDENT">Careless / Overconfident</option>
                  </select>
                </div>
              </div>

              {/* Mistake picker */}
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Rule mechanical errors / Mistakes</span>
                <select
                  value={selectedTradeEnrichment.mistakeType}
                  onChange={(e) => setSelectedTradeEnrichment(prev => ({ ...prev, mistakeType: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-850 text-xs px-2.5 py-1.5 rounded text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="NONE">None (Perfect Execution)</option>
                  <option value="MOVED_SL">Moved Stop Loss prematurely</option>
                  <option value="MOVED_TP">Moved Take Profit target higher (greed)</option>
                  <option value="EARLY_EXIT">Exited early out of fear/anxiety</option>
                  <option value="OVER_LEVERAGE">Exceeded risk units (over-leverage)</option>
                  <option value="CHASED">Chased breakout after trigger pass</option>
                </select>
              </div>

              {/* Freeform Notes area */}
              <div>
                <span className="text-[10px] font-bold uppercase text-zinc-500 block mb-1">Journal Commentary & Lessons Learnt</span>
                <textarea
                  placeholder="Record market regimes, news correlations, and notes here..."
                  rows={4}
                  value={selectedTradeEnrichment.notes}
                  onChange={(e) => setSelectedTradeEnrichment(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-zinc-900 border border-zinc-850 text-xs p-3 rounded text-white focus:outline-none focus:border-emerald-500 placeholder-zinc-700 font-sans"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleSaveEnrichment}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded text-xs transition-colors"
                >
                  Save Enrichment Entries
                </button>
                <button
                  onClick={() => setSelectedTrade(null)}
                  className="bg-zinc-905 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-bold py-2 px-4 rounded text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
