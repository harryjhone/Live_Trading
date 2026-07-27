import React from "react";
import { FullAppState, SymbolType, Trade } from "../types";
import { Table, History, TrendingUp, TrendingDown, DollarSign, XCircle, BarChart, AlertTriangle, PieChart, ShieldAlert, BadgeInfo, Scale, Clock, Calendar, Sparkles, Zap, CheckCircle, RefreshCw, Plus } from "lucide-react";

interface TradesViewProps {
  state: FullAppState;
  onCloseTrade: (id: string) => Promise<void>;
  onUpdateConfig?: (data: any) => Promise<void>;
  activeSubMenu?: "overview" | "session" | "optimizer" | "active" | "history" | "breakdowns";
  onSwitchSubMenu?: (tab: "overview" | "session" | "optimizer" | "active" | "history" | "breakdowns") => void;
}

export default function TradesView({ state, onCloseTrade, onUpdateConfig, activeSubMenu, onSwitchSubMenu }: TradesViewProps) {
  const mt5SupportedSymbols = [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD",
    "BTCUSD", "ETHUSD", "SOLUSD", "BNBUSD",
    "AAPL", "TSLA", "MSFT", "NVDA",
    "XAUUSD", "USOIL", "XAGUSD", "NGAS",
    "SPX500", "NDX100", "DJI30", "GER40"
  ];

  const isSymbolMatch = (symA: string, symB: string) => {
    if (!symA || !symB) return false;
    const a = symA.toUpperCase();
    const b = symB.toUpperCase();
    if (a === b) return true;
    return (a.startsWith(b) && b.length >= 3) || (b.startsWith(a) && a.length >= 3);
  };

  const isMT5Symbol = (symbol: string) => {
    if (!symbol) return false;
    const symUpper = symbol.toUpperCase();
    return mt5SupportedSymbols.some((supported) => {
      const supUpper = supported.toUpperCase();
      return symUpper === supUpper || (symUpper.startsWith(supUpper) && supUpper.length >= 3);
    });
  };

  const [dateFilter, setDateFilter] = React.useState<"ALL" | "TODAY" | "YESTERDAY" | "THIS_WEEK" | "THIS_MONTH" | "CUSTOM">("ALL");
  const [startDateStr, setStartDateStr] = React.useState<string>("");
  const [endDateStr, setEndDateStr] = React.useState<string>("");

  const filterByDate = (trade: Trade) => {
    if (!trade.openTime) return true;
    const tradeDate = new Date(trade.openTime);
    const now = new Date();
    
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
    
    const dayOfWeek = now.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const startOfWeek = new Date(startOfToday.getTime() + diffToMonday * 24 * 60 * 60 * 1000);
    
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    switch (dateFilter) {
      case "TODAY":
        return tradeDate >= startOfToday;
      case "YESTERDAY":
        return tradeDate >= startOfYesterday && tradeDate < startOfToday;
      case "THIS_WEEK":
        return tradeDate >= startOfWeek;
      case "THIS_MONTH":
        return tradeDate >= startOfMonth;
      case "CUSTOM": {
        if (startDateStr) {
          const sDate = new Date(startDateStr);
          sDate.setHours(0, 0, 0, 0);
          if (tradeDate < sDate) return false;
        }
        if (endDateStr) {
          const eDate = new Date(endDateStr);
          eDate.setHours(23, 59, 59, 999);
          if (tradeDate > eDate) return false;
        }
        return true;
      }
      case "ALL":
      default:
        return true;
    }
  };

  const baseOpenPositions = state.trades.filter((t) => t.status === "OPEN" && isMT5Symbol(t.symbol));
  const baseSimulatedPositions = state.trades.filter((t) => t.status === "OPEN" && !isMT5Symbol(t.symbol));
  const baseClosedPositions = state.trades.filter((t) => t.status === "CLOSED" && isMT5Symbol(t.symbol));

  const isSuccessfullyExecutedMT5 = (trade: Trade) => {
    // If trade was synced from MT5 terminal, or is broker direct, or has a numeric ticket ID from MT5
    if ((trade as any).isMt5Synced || trade.strategyId === "MT5_LIVE" || /^\d+$/.test(trade.id)) {
      return true;
    }
    const associatedMirror = state.mt5Config?.mirrorActivity?.find(
      (m) =>
        m.tradeId === trade.id ||
        (isSymbolMatch(m.symbol, trade.symbol) &&
          m.type === trade.type &&
          m.action === "OPEN" &&
          Math.abs(new Date(m.time).getTime() - new Date(trade.openTime).getTime()) < 600000)
    );
    return associatedMirror?.status === "DONE";
  };

  const openPositions = baseOpenPositions.filter(filterByDate).filter(isSuccessfullyExecutedMT5);
  const simulatedPositions = baseSimulatedPositions.filter(filterByDate);
  const closedPositions = baseClosedPositions.filter(filterByDate);

  const [editingTradeId, setEditingTradeId] = React.useState<string | null>(null);
  const [editSl, setEditSl] = React.useState<string>("");
  const [editTp, setEditTp] = React.useState<string>("");
  const [savingEdit, setSavingEdit] = React.useState<boolean>(false);

  // States for attaching manual running MT5 trade
  const [showAttachForm, setShowAttachForm] = React.useState(false);
  const [attachTicket, setAttachTicket] = React.useState("");
  const [attachSymbol, setAttachSymbol] = React.useState("GBPUSD");
  const [attachType, setAttachType] = React.useState<"BUY" | "SELL">("SELL");
  const [attachSize, setAttachSize] = React.useState("0.15");
  const [attachPrice, setAttachPrice] = React.useState("1.31767");
  const [attachSlVal, setAttachSlVal] = React.useState("");
  const [attachTpVal, setAttachTpVal] = React.useState("");
  const [attachError, setAttachError] = React.useState("");
  const [attachSuccess, setAttachSuccess] = React.useState("");
  const [attaching, setAttaching] = React.useState(false);

  const handleAttachTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttachError("");
    setAttachSuccess("");
    if (!attachTicket.trim() || !attachSymbol.trim() || !attachSize.trim() || !attachPrice.trim()) {
      setAttachError("Please fill out all required fields.");
      return;
    }

    setAttaching(true);
    try {
      const res = await fetch("/api/trade/attach-running", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ticket: attachTicket.trim(),
          symbol: attachSymbol.trim().toUpperCase(),
          type: attachType,
          size: parseFloat(attachSize),
          entryPrice: parseFloat(attachPrice),
          stopLoss: attachSlVal ? parseFloat(attachSlVal) : 0,
          takeProfit: attachTpVal ? parseFloat(attachTpVal) : 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setAttachError(data.error || "Failed to attach running trade.");
      } else {
        setAttachSuccess(`Successfully attached running MT5 Position #${attachTicket}!`);
        setAttachTicket("");
        setAttachSlVal("");
        setAttachTpVal("");
        if (onUpdateConfig) {
          await onUpdateConfig({});
        }
        setTimeout(() => {
          setShowAttachForm(false);
          setAttachSuccess("");
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      setAttachError("An error occurred. Check browser logs.");
    } finally {
      setAttaching(false);
    }
  };

  const getHeaders = () => {
    const tenantId = localStorage.getItem("quant_active_tenant_id") || "tenant-harry";
    const isSuper = localStorage.getItem("quant_is_super_admin") === "true";
    return {
      "Content-Type": "application/json",
      "X-Tenant-ID": tenantId,
      ...(isSuper ? { "X-Is-Super-Admin": "true" } : {})
    };
  };

  const handleModifyTradeSLTP = async (tradeId: string) => {
    setSavingEdit(true);
    try {
      const res = await fetch("/api/trade/modify", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          id: tradeId,
          stopLoss: editSl ? parseFloat(editSl) : null,
          takeProfit: editTp ? parseFloat(editTp) : null
        })
      });
      if (res.ok) {
        setEditingTradeId(null);
        if (onUpdateConfig) {
          await onUpdateConfig({});
        }
      }
    } catch (err) {
      console.error("[Modify Params failure]", err);
    } finally {
      setSavingEdit(false);
    }
  };

  const [pushingTradeId, setPushingTradeId] = React.useState<string | null>(null);
  const [resettingTradeId, setResettingTradeId] = React.useState<string | null>(null);

  const handlePushToMT5 = async (tradeId: string) => {
    setPushingTradeId(tradeId);
    try {
      const res = await fetch("/api/trade/push-mt5", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ id: tradeId })
      });
      if (res.ok) {
        if (onUpdateConfig) {
          await onUpdateConfig({});
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to push to MT5.");
      }
    } catch (err) {
      console.error("[Post push-mt5 failure]", err);
    } finally {
      setPushingTradeId(null);
    }
  };

  const handleResetMT5 = async (tradeId: string) => {
    setResettingTradeId(tradeId);
    try {
      const res = await fetch("/api/trade/reset-mt5", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ id: tradeId })
      });
      if (res.ok) {
        if (onUpdateConfig) {
          await onUpdateConfig({});
        }
      } else {
        const errorData = await res.json();
        alert(errorData.error || "Failed to reset MT5 sync.");
      }
    } catch (err) {
      console.error("[Post reset-mt5 failure]", err);
    } finally {
      setResettingTradeId(null);
    }
  };

  // Smooth scroll to selected sub-menu section
  React.useEffect(() => {
    if (!activeSubMenu) return;
    
    const sectionMap: Record<string, string> = {
      overview: "trades-overview",
      session: "trades-session-weekday",
      optimizer: "trades-ai-optimizer",
      active: "trades-active-positions",
      history: "trades-trade-history",
      breakdowns: "trades-breakdowns",
    };
    
    const targetId = sectionMap[activeSubMenu];
    if (targetId) {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [activeSubMenu]);

  // Helper to format Date matching the screenshot requirement: e.g., "May 25, 11:46:44"
  const formatOpenDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const month = months[d.getUTCMonth()];
      const day = d.getUTCDate();
      const pad = (n: number) => n.toString().padStart(2, "0");
      const hours = pad(d.getUTCHours());
      const minutes = pad(d.getUTCMinutes());
      const seconds = pad(d.getUTCSeconds());
      return `${month} ${day}, ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return dateStr;
    }
  };

  // Helper to format Symbol: e.g., "BTCUSD" -> "BTC / USDT"
  const formatPair = (symbol: string) => {
    if (!symbol) return "—";
    const s = symbol.toUpperCase();
    for (const b of mt5SupportedSymbols) {
      if (s.startsWith(b.toUpperCase()) && b.length >= 3) {
        if (b === "BTCUSD") return "BTC / USDT";
        if (b === "XAUUSD") return "XAU / USD";
        if (b.endsWith("USD")) {
          return `${b.replace("USD", "")} / USD`;
        }
        return `${b} / USD`;
      }
    }
    if (s === "BTCUSD") return "BTC / USDT";
    if (s === "XAUUSD") return "XAU / USD";
    if (s.endsWith("USD")) {
      return `${s.replace("USD", "")} / USD`;
    }
    return `${s} / USD`;
  };

  // Helper to format values with correct decimal counts based on symbol
  const formatPrice = (price: number, symbol: string) => {
    const s = (symbol || "").toUpperCase();
    const decimals = s.includes("USD") && !s.startsWith("BTC") && !s.startsWith("XAU") ? 4 : 2;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  // Helper to get Pip Gaps matching asset characteristics
  const getPips = (price1: number, price2: number, symbol: string) => {
    const diff = Math.abs(price1 - price2);
    const s = (symbol || "").toUpperCase();
    if (s.startsWith("BTC")) {
      return `${Math.round(diff)} pips`;
    }
    if (s.startsWith("XAU")) {
      return `${Math.round(diff * 10)} pips`;
    }
    return `${Math.round(diff * 10000)} pips`;
  };

  // Helper to dynamically calculate TP scaling levels
  const getTpLevel = (trade: Trade, level: 1 | 2 | 3) => {
    if (level === 1 && trade.tp1) return trade.tp1;
    if (level === 2 && trade.tp2) return trade.tp2;
    if (level === 3 && trade.tp3) return trade.tp3;
    if (!trade.takeProfit) return undefined;
    const entry = trade.entryPrice;
    const tp = trade.takeProfit;
    const totalGap = tp - entry;
    return entry + (totalGap * level) / 3;
  };

  // Helper to simulate dynamic lot values / format sizes to fit Lot column style perfectly
  const formatLot = (trade: Trade) => {
    return `$${Number(trade.size).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper to calculate PnL percentage matching the screenshot style: e.g., "(-253.21%)"
  const getTradePercent = (trade: Trade) => {
    const entry = trade.entryPrice;
    const exit = trade.status === "CLOSED" && trade.closePrice ? trade.closePrice : trade.currentPrice;
    if (!entry) return "0.00%";
    const isBuy = trade.type === "BUY";
    const change = isBuy ? (exit - entry) : (entry - exit);
    const percent = (change / entry) * 100;
    return `${percent >= 0 ? "+" : ""}${percent.toFixed(2)}%`;
  };

  const getTradePipsValue = (trade: Trade) => {
    const entry = trade.entryPrice;
    const exit = trade.status === "CLOSED" && trade.closePrice ? trade.closePrice : trade.currentPrice;
    const isBuy = trade.type === "BUY";
    const diff = isBuy ? (exit - entry) : (entry - exit);
    
    const sym = (trade.symbol || "").toUpperCase();
    
    // Forex major pairs (except JPY JPY pairs use 100 multiplier)
    if (sym.includes("USD") && (sym.startsWith("EUR") || sym.startsWith("GBP") || sym.startsWith("AUD"))) {
      return diff * 10000;
    }
    // JPY pairs
    if (sym.includes("JPY")) {
      return diff * 100;
    }
    // Gold
    if (sym.startsWith("XAU")) {
      return diff * 10;
    }
    // Silver
    if (sym.startsWith("XAG")) {
      return diff * 100;
    }
    // Cryptocurrencies
    if (sym.startsWith("BTC") || sym.startsWith("ETH") || sym.startsWith("SOL") || sym.startsWith("BNB")) {
      return diff;
    }
    // Equities
    if (sym === "AAPL" || sym === "TSLA" || sym === "MSFT" || sym === "NVDA") {
      return diff * 100;
    }
    return diff * 100;
  };

  const getTradePipsFormatted = (trade: Trade) => {
    const pipsVal = getTradePipsValue(trade);
    return `${pipsVal >= 0 ? "+" : ""}${pipsVal.toFixed(1)} pips`;
  };

  // Helper to calculate the quantitative risk multiple R: e.g., "-1.00R" or "+0.21R"
  const getRMultiple = (trade: Trade) => {
    // Standard risk unit of $25 as aligned with screenshot calculations
    const r = trade.pnl / 25.0;
    return `${r >= 0 ? "+" : ""}${r.toFixed(2)}R`;
  };

  // Helper to format Signal ID to look like: "Sig #102"
  const getTradeNumber = (id: string) => {
    const cleanNum = id.replace(/^\D+/g, "");
    const base = cleanNum ? parseInt(cleanNum, 10) : 0;
    return `Sig #${base + 90}`;
  };

  // Helper to fetch timeframe dynamically for displaying
  const getTradeTimeframe = (trade: Trade) => {
    const strat = state.strategies?.find((s) => s.id === trade.strategyId);
    if (strat?.timeframe) {
      const tf = strat.timeframe.toLowerCase();
      if (tf === "h1") return "1h";
      if (tf === "h4") return "4h";
      if (tf === "d1") return "1d";
      return tf;
    }
    if (trade.strategyId === "TIME_RANGE") return "5m";
    if (trade.strategyId === "EMA_CROSS") return "1m";
    return "15m";
  };

  // Summary figures (Calculated strictly based on MT5 Executed + Live Running trades)
  const activeHoldings = [...closedPositions, ...openPositions];
  const totalFloating = openPositions.reduce((sum, t) => sum + t.pnl, 0);
  const totalRealizedSum = closedPositions.reduce((sum, t) => sum + t.pnl, 0);
  const totalRealized = totalRealizedSum + totalFloating;
  const totalTradesCount = activeHoldings.length;
  const lossesCount = activeHoldings.filter((t) => t.pnl < 0).length;
  const winsCount = activeHoldings.filter((t) => t.pnl >= 0).length;
  
  const winRate = activeHoldings.length > 0 
    ? ((winsCount / activeHoldings.length) * 100).toFixed(1) 
    : "0.0";

  const avgPnL = activeHoldings.length > 0
    ? (totalRealized / activeHoldings.length).toFixed(2)
    : "0.00";

  // Calculate Pair Breakdown based on Active Holdings
  const pairBreakdown: Record<string, { count: number; pnl: number }> = {};
  activeHoldings.forEach((t) => {
    if (!pairBreakdown[t.symbol]) {
      pairBreakdown[t.symbol] = { count: 0, pnl: 0 };
    }
    pairBreakdown[t.symbol].count += 1;
    pairBreakdown[t.symbol].pnl += t.pnl;
  });

  // Calculate Strategy Breakdown based on Active Holdings
  const strategyBreakdown: Record<string, { name: string; count: number; pnl: number }> = {};
  activeHoldings.forEach((t) => {
    if (!strategyBreakdown[t.strategyId]) {
      strategyBreakdown[t.strategyId] = { name: t.strategyName, count: 0, pnl: 0 };
    }
    strategyBreakdown[t.strategyId].count += 1;
    strategyBreakdown[t.strategyId].pnl += t.pnl;
  });

  // Calculate Regime Breakdown based on Active Holdings
  const regimeBreakdown: Record<string, { count: number; pnl: number }> = {};
  activeHoldings.forEach((t) => {
    const regimeLabel = t.regime || "ACCUMULATION";
    if (!regimeBreakdown[regimeLabel]) {
      regimeBreakdown[regimeLabel] = { count: 0, pnl: 0 };
    }
    regimeBreakdown[regimeLabel].count += 1;
    regimeBreakdown[regimeLabel].pnl += t.pnl;
  });

  // Calculate Average MFE/MAE Excursion Metrics based on Active Holdings
  const validMfeTrades = activeHoldings.filter(t => t.mfe !== undefined);
  const validMaeTrades = activeHoldings.filter(t => t.mae !== undefined);
  
  const avgMfe = validMfeTrades.length > 0
    ? (validMfeTrades.reduce((sum, t) => sum + (t.mfe || 0), 0) / validMfeTrades.length).toFixed(2)
    : "0.00";
    
  const avgMae = validMaeTrades.length > 0
    ? (validMaeTrades.reduce((sum, t) => sum + (t.mae || 0), 0) / validMaeTrades.length).toFixed(2)
    : "0.00";

  // Session classification helper
  const getSession = (openTimeStr: string): "ASIAN" | "LONDON" | "NEW_YORK" => {
    try {
      const d = new Date(openTimeStr);
      const hour = d.getUTCHours();
      if (isNaN(hour)) {
        return "LONDON";
      }
      if (hour >= 0 && hour < 8) return "ASIAN";
      if (hour >= 8 && hour < 16) return "LONDON";
      return "NEW_YORK";
    } catch (e) {
      return "LONDON";
    }
  };

  // Day of week helper
  const getDayOfWeek = (openTimeStr: string): string => {
    try {
      const d = new Date(openTimeStr);
      const day = d.getUTCDay(); // 0 is Sunday, 1 is Monday ...
      if (isNaN(day)) {
        return "MONDAY";
      }
      const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
      return days[day];
    } catch (e) {
      return "MONDAY";
    }
  };

  // Calculate session stats dynamically
  const sessionStats = React.useMemo(() => {
    const stats: Record<string, { label: string; hours: string; total: number; wins: number; losses: number; pnl: number }> = {
      ASIAN: { label: "Asian Session", hours: "00:00 - 08:00 UTC", total: 0, wins: 0, losses: 0, pnl: 0 },
      LONDON: { label: "London Session", hours: "08:00 - 16:00 UTC", total: 0, wins: 0, losses: 0, pnl: 0 },
      NEW_YORK: { label: "New York Session", hours: "16:00 - 24:00 UTC", total: 0, wins: 0, losses: 0, pnl: 0 },
    };

    activeHoldings.forEach((trade) => {
      const s = getSession(trade.openTime);
      stats[s].total += 1;
      if (trade.pnl >= 0) {
        stats[s].wins += 1;
      } else {
        stats[s].losses += 1;
      }
      stats[s].pnl += trade.pnl;
    });

    return Object.values(stats);
  }, [activeHoldings]);

  // Calculate weekday stats dynamically
  const weekdayStats = React.useMemo(() => {
    const weekdays = [
      { key: "MONDAY", label: "Monday" },
      { key: "TUESDAY", label: "Tuesday" },
      { key: "WEDNESDAY", label: "Wednesday" },
      { key: "THURSDAY", label: "Thursday" },
      { key: "FRIDAY", label: "Friday" },
      { key: "SATURDAY", label: "Saturday" },
      { key: "SUNDAY", label: "Sunday" },
    ];

    const stats: Record<string, { total: number; wins: number; losses: number; pnl: number }> = {};
    weekdays.forEach((dayObj) => {
      stats[dayObj.key] = { total: 0, wins: 0, losses: 0, pnl: 0 };
    });

    activeHoldings.forEach((trade) => {
      const day = getDayOfWeek(trade.openTime);
      if (stats[day]) {
        stats[day].total += 1;
        if (trade.pnl >= 0) {
          stats[day].wins += 1;
        } else {
          stats[day].losses += 1;
        }
        stats[day].pnl += trade.pnl;
      }
    });

    return weekdays.map((dayObj) => ({
      ...dayObj,
      ...stats[dayObj.key],
    }));
  }, [activeHoldings]);

  // Handle deploying algorithmic optimization recommendation in memory & server config
  const [appliedOptimizations, setAppliedOptimizations] = React.useState<Record<string, boolean>>(() => {
    return state.config.activeOptimizations || {};
  });
  const [appliedAtTradeCount, setAppliedAtTradeCount] = React.useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem("applied_opts_counts");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });
  const [optimizingId, setOptimizingId] = React.useState<string | null>(null);

  // Sync applied state from server updates
  React.useEffect(() => {
    if (state.config.activeOptimizations) {
      setAppliedOptimizations(state.config.activeOptimizations);
    }
  }, [state.config.activeOptimizations]);

  // Dynamic Re-detect/Clear is deactivated to keep deployed optimizations active permanently across trades
  React.useEffect(() => {
    // Deployed optimizations are persisted and remain enabled to compound PnL gains.
  }, [closedPositions.length, onUpdateConfig]);

  const handleApplyOptimization = (id: string) => {
    setOptimizingId(id);
    setTimeout(() => {
      const nextApplied = { ...appliedOptimizations, [id]: true };
      setAppliedOptimizations(nextApplied);
      
      const nextCounts = { ...appliedAtTradeCount, [id]: closedPositions.length };
      setAppliedAtTradeCount(nextCounts);
      localStorage.setItem("applied_opts_counts", JSON.stringify(nextCounts));
      
      if (onUpdateConfig) {
        onUpdateConfig({ activeOptimizations: nextApplied });
      }
      setOptimizingId(null);
    }, 1000);
  };

  // Compile real-time recommendations to increase PnL based on trading history
  const optimizationInsights = React.useMemo(() => {
    const list = [];

    if (activeHoldings.length === 0) {
      return [
        {
          id: "mfe-generic",
          title: "Optimize Multi-Asset Targets",
          description: "Analyze Excursion Metrics once trade history triggers register. Recommendation: Keep current SL / TP default constraints.",
          pnlBoost: "+$250.00/mo est",
          impact: "MEDIUM" as const,
          actionLabel: "Verify Coeffs"
        }
      ];
    }

    // A. MFE left-on-table check
    const wins = activeHoldings.filter((p) => p.pnl > 0);
    const avgWinPnL = wins.length > 0 ? wins.reduce((sum, p) => sum + p.pnl, 0) / wins.length : 0;
    const avgWinMfe = wins.length > 0 ? wins.reduce((sum, p) => sum + (p.mfe || p.pnl), 0) / wins.length : 0;
    const mfeGap = avgWinMfe - avgWinPnL;

    if (mfeGap > 20) {
      list.push({
        id: "ins-mfe-trailing",
        title: "Deploy Automated Trailing Stop (1.5x ATR)",
        description: `Winning setups hit an average peak (MFE) of $${avgWinMfe.toFixed(2)} but retraced before exit to close at $${avgWinPnL.toFixed(2)}. Deploying ATR-based ratchets locks paper gains and secures $${mfeGap.toFixed(2)} average missed profit per trade.`,
        pnlBoost: `+$${(mfeGap * 0.5).toFixed(0)}/trade`,
        impact: "HIGH" as const,
        actionLabel: "Engage Trailing Stop Coefficient"
      });
    }

    // B. Underperforming hourly check (Don't halt full sessions, halt bleeding clock hours)
    const hoursRecord: Record<number, { hour: number; total: number; wins: number; pnl: number }> = {};
    for (let h = 0; h < 24; h++) {
      hoursRecord[h] = { hour: h, total: 0, wins: 0, pnl: 0 };
    }
    activeHoldings.forEach((trade) => {
      try {
        const d = new Date(trade.openTime);
        const hr = d.getUTCHours();
        if (!isNaN(hr) && hr >= 0 && hr < 24) {
          hoursRecord[hr].total += 1;
          if (trade.pnl >= 0) {
            hoursRecord[hr].wins += 1;
          }
          hoursRecord[hr].pnl += trade.pnl;
        }
      } catch (e) {}
    });

    const hourlyStats = Object.values(hoursRecord);
    const sortedHours = [...hourlyStats].filter(h => h.total > 0).sort((a, b) => a.pnl - b.pnl);
    const worstHour = sortedHours[0];
    if (worstHour && worstHour.pnl < 0) {
      const formattedWorstHour = `${String(worstHour.hour).padStart(2, "0")}:00 UTC`;
      list.push({
        id: `ins-hour-halt-${worstHour.hour}`,
        title: `Halt Bleeding Hour (${formattedWorstHour})`,
        description: `Trades executed specifically during the ${formattedWorstHour} hour represent a net leakage of $${Math.abs(worstHour.pnl).toFixed(2)} (Win Rate: ${(worstHour.total > 0 ? (worstHour.wins / worstHour.total) * 100 : 0).toFixed(0)}%). Temporarily halting automated order execution in this single 60-minute interval defends capital without freezing whole sessions.`,
        pnlBoost: `+$${Math.abs(worstHour.pnl).toFixed(0)} saved / mo`,
        impact: "HIGH" as const,
        actionLabel: `Halt ${formattedWorstHour} Executes`
      });
    }

    // C. Underperforming Weekday check
    const sortedWeeks = [...weekdayStats].sort((a, b) => a.pnl - b.pnl);
    const worstDay = sortedWeeks[0];
    if (worstDay && worstDay.pnl < 0) {
      list.push({
        id: `ins-day-cooldown-${worstDay.key}`,
        title: `Impose Max Loss on ${worstDay.label}s`,
        description: `${worstDay.label} trades hit lowest performance levels showing $${Math.abs(worstDay.pnl).toFixed(2)} net draw. Restricting default exposure or enforcing strict trailing thresholds mitigates weekly statistical drag.`,
        pnlBoost: `+$${(Math.abs(worstDay.pnl) * 0.5).toFixed(0)} saved / mo`,
        impact: "MEDIUM" as const,
        actionLabel: `Cap ${worstDay.label} Position Sizing`
      });
    }

    // D. Strategy performance check
    const sortedStrats = Object.keys(strategyBreakdown)
      .map(id => ({ id, ...strategyBreakdown[id] }))
      .sort((a, b) => a.pnl - b.pnl);
    const worstStrat = sortedStrats[0];
    if (worstStrat && worstStrat.pnl < 0) {
      list.push({
        id: `ins-strat-override-${worstStrat.id}`,
        title: `Inject Chop Filters to ${worstStrat.name}`,
        description: `Your ${worstStrat.name} executions suffered major losses (-$${Math.abs(worstStrat.pnl).toFixed(2)}) due to ranging conditions. Overlaying simple SMA filter boundaries block false breakout triggers.`,
        pnlBoost: `+$${(Math.abs(worstStrat.pnl) * 0.45).toFixed(0)} recovered`,
        impact: "HIGH" as const,
        actionLabel: "Implement Structural Guard"
      });
    }

    // E. Best Entry Location pullback buffer optimizer (Dynamic Entry Offset)
    list.push({
      id: "ins-entry-pullback-depth",
      title: "Adaptive Pullback Entry Buffer (Best Entry Location)",
      description: "Delayed automated entry threshold triggers a 0.15% pullback requirement filter. Postponing breakout momentum triggers ensures a highly superior entry price ratio.",
      pnlBoost: "+$380.00/mo est",
      impact: "HIGH" as const,
      actionLabel: "Auto-Deploy Entry Optimizer"
    });

    // F. Dynamic Adaptive SL/TP levels (ATR dynamic bounds)
    list.push({
      id: "ins-adaptive-sltp",
      title: "Dynamic Adaptive SL/TP Multiple",
      description: "Automatic high-contrast ATR scaling sets dynamic 1.5x ATR Stop Loss and 3.2x ATR Take Profit channels, structurally maximizing mathematical expectancy.",
      pnlBoost: "+$420.00/mo est",
      impact: "MEDIUM" as const,
      actionLabel: "Auto-Deploy SL/TP Optimizer"
    });

    if (list.length === 0) {
      list.push({
        id: "ins-perfect-pnl",
        title: "All Parameters Optimal",
        description: "Current trading history does not indicate any friction points or capital leakage. Session allocation and strategy targets are highly optimized.",
        pnlBoost: "N/A",
        impact: "LOW" as const,
        actionLabel: "Continue Monitoring"
      });
    }

    return list;
  }, [activeHoldings, sessionStats, weekdayStats, strategyBreakdown]);

  return (
    <div className="space-y-6" id="trades-overview">
      {/* Visual Header */}
      <div className="border-b border-zinc-200 dark:border-zinc-900 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Table className="h-5 w-5 text-emerald-500" />
            Trade Ledger & Excursion Analytics Room
          </h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
            Review physical open holdings, historical executions, win rate analytics, and custom regime/strategy breakdowns.
          </p>
        </div>

        {/* Date Filter Panel */}
        <div className="flex flex-wrap items-center gap-2.5 bg-slate-50 dark:bg-zinc-950/60 p-2 rounded-lg border border-slate-200 dark:border-zinc-900/60 self-start md:self-auto">
          <div className="flex items-center gap-1.5 pl-1">
            <Calendar className="h-3.5 w-3.5 text-slate-400 dark:text-zinc-500" />
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">Date Horizon:</span>
          </div>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="text-xs font-semibold bg-white dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-800 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="ALL">🗓️ All Time Holdings</option>
            <option value="TODAY">🕒 Today</option>
            <option value="YESTERDAY">🕒 Yesterday</option>
            <option value="THIS_WEEK">📅 This Week</option>
            <option value="THIS_MONTH">📆 This Month</option>
            <option value="CUSTOM">🔧 Custom Date Range</option>
          </select>

          {dateFilter === "CUSTOM" && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-sans font-medium text-slate-400 dark:text-zinc-500">From</span>
              <input
                type="date"
                value={startDateStr}
                onChange={(e) => setStartDateStr(e.target.value)}
                className="text-xs font-mono bg-white dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
              <span className="text-[10px] font-sans font-medium text-slate-400 dark:text-zinc-500">to</span>
              <input
                type="date"
                value={endDateStr}
                onChange={(e) => setEndDateStr(e.target.value)}
                className="text-xs font-mono bg-white dark:bg-zinc-900 text-slate-800 dark:text-white border border-slate-200 dark:border-zinc-800 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Ribbon */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 select-none text-left font-sans">
        {/* Win Rate */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-3.5 sm:p-4.5 relative overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm hover:scale-[1.012] group">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 h-12 w-12 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-900/60">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="p-1 rounded bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 shrink-0">
                <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
              </span>
              <span className="truncate">MT5 Win Rate</span>
            </span>
            <span className="text-[9px] font-mono text-emerald-605 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-1.5 py-0.5 rounded font-black shrink-0">
              EXECUTED
            </span>
          </div>
          <div className="py-0.5">
            <span className="font-mono text-lg sm:text-xl md:text-2xl lg:text-[19px] xl:text-2xl font-black text-slate-900 dark:text-white block tracking-tight truncate leading-none py-1">{winRate}%</span>
          </div>
          <div className="mt-3.5 space-y-1.5">
            <div className="w-full bg-gray-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden flex">
              {activeHoldings.length > 0 ? (
                <>
                  <div className="bg-emerald-500 h-full" style={{ width: `${winRate}%` }} />
                  <div className="bg-rose-500 h-full" style={{ width: `${100 - Number(winRate)}%` }} />
                </>
              ) : (
                <div className="bg-gray-205 dark:bg-zinc-850 w-full h-full" />
              )}
            </div>
            <div className="flex items-center justify-between text-[9.5px] text-slate-500 dark:text-zinc-550 font-mono">
              <span>{winsCount} Wins</span>
              <span>{lossesCount} Losses</span>
            </div>
          </div>
        </div>

        {/* Realized/Floating PnL */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-3.5 sm:p-4.5 relative overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm hover:scale-[1.012] group">
          {/* Subtle background glow */}
          <div className={`absolute top-0 right-0 h-12 w-12 rounded-full blur-xl pointer-events-none transition-colors ${
            totalRealized >= 0 ? "bg-emerald-500/5 group-hover:bg-emerald-500/10" : "bg-rose-500/5 group-hover:bg-rose-500/10"
          }`} />
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-900/60">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className={`p-1 rounded shrink-0 ${totalRealized >= 0 ? "bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20" : "bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20"}`}>
                {totalRealized >= 0 ? <TrendingUp className="h-3 w-3 text-emerald-600 dark:text-emerald-400" /> : <TrendingDown className="h-3 w-3 text-rose-600 dark:text-rose-400" />}
              </span>
              <span className="truncate">Net Executed P&L</span>
            </span>
            <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-black border shrink-0 ${
              totalRealized >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20"
            }`}>
              {openPositions.length > 0 ? "COMBINED" : "SETTLED"}
            </span>
          </div>
          <div className="py-0.5">
            <span className={`font-mono text-xl sm:text-2xl lg:text-[19px] xl:text-2xl font-black block tracking-tight truncate leading-none py-1 ${totalRealized >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {totalRealized >= 0 ? "+" : ""}${totalRealized.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[9.5px] text-slate-550 dark:text-zinc-550 font-mono pt-1.5 border-t border-gray-100 dark:border-zinc-900/50">
            <span className="truncate">Settled margin:</span>
            <span className="text-slate-600 dark:text-zinc-300 font-bold bg-gray-50 dark:bg-zinc-900 px-1 py-0.2 rounded border border-gray-150 dark:border-zinc-800 text-[8.5px] shrink-0">POSTED</span>
          </div>
        </div>

        {/* Total Trades */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-3.5 sm:p-4.5 relative overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm hover:scale-[1.012] group">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 h-12 w-12 bg-amber-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-900/60">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="p-1 rounded bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 shrink-0">
                <History className="h-3 w-3 text-amber-600 dark:text-amber-550/90" />
              </span>
              <span className="truncate">MT5 Executed / Live</span>
            </span>
            <span className="text-[8.5px] font-mono text-slate-600 dark:text-zinc-350 bg-gray-50 dark:bg-zinc-900 border border-gray-150 dark:border-zinc-805 px-1.5 py-0.5 rounded font-black shrink-0">
              MT5 STATS
            </span>
          </div>
          <div className="py-0.5">
            <span className="font-mono text-xl sm:text-2xl lg:text-[19px] xl:text-2xl font-black text-slate-900 dark:text-white block tracking-tight truncate leading-none py-1">{totalTradesCount}</span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[9.5px] text-slate-550 dark:text-zinc-550 font-mono pt-1.5 border-t border-gray-100 dark:border-zinc-900/50">
            <span className="truncate">{closedPositions.length} Closed</span>
            <span className="text-slate-600 dark:text-zinc-400 font-semibold shrink-0">{openPositions.length} Running</span>
          </div>
        </div>

        {/* Avg PnL */}
        <div className="rounded-xl border border-gray-205 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-3.5 sm:p-4.5 relative overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm hover:scale-[1.012] group">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 h-12 w-12 bg-zinc-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-zinc-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-900/60">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="p-1 rounded bg-slate-50 dark:bg-zinc-800 border border-slate-150 dark:border-zinc-700 shrink-0">
                <Scale className="h-3 w-3 text-slate-600 dark:text-zinc-400" />
              </span>
              <span className="truncate">Avg P&L Position</span>
            </span>
            <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded font-black border shrink-0 ${
              Number(avgPnL) >= 0 ? "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-500/10 dark:text-rose-455 text-rose-400 border-rose-500/20"
            }`}>
              EXPECTANCY
            </span>
          </div>
          <div className="py-0.5">
            <span className={`font-mono text-xl sm:text-2xl lg:text-[19px] xl:text-2xl font-black block tracking-tight truncate leading-none py-1 ${Number(avgPnL) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {Number(avgPnL) >= 0 ? "+" : ""}${Number(avgPnL).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between text-[9.5px] text-slate-550 dark:text-zinc-550 font-mono pt-1.5 border-t border-gray-100 dark:border-zinc-900/50">
            <span className="truncate">Expectancy metric:</span>
            <span className={`font-bold uppercase text-[9px] shrink-0 ${Number(avgPnL) >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-655 dark:text-rose-455"}`}>
              {Number(avgPnL) >= 0 ? "POSITIVE" : "NEGATIVE"}
            </span>
          </div>
        </div>

        {/* Dynamic Excursion Metrics (MFE & MAE Card) */}
        <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-3.5 sm:p-4.5 relative overflow-hidden transition-all duration-300 hover:border-gray-300 dark:hover:border-zinc-700 hover:shadow-sm hover:scale-[1.012] group">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 h-12 w-12 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-zinc-900/60">
            <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <span className="p-1 rounded bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 shrink-0">
                <BarChart className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
              </span>
              <span className="truncate">Excursion Metrics</span>
            </span>
            <span className="text-[8.5px] font-mono text-indigo-650 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-550/10 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded font-black shrink-0">
              EFFICIENCY
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 py-0.5">
            <div>
              <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 block uppercase font-bold tracking-wider truncate">Avg MFE</span>
              <span className="font-mono text-xs sm:text-sm md:text-base lg:text-[14px] xl:text-base font-black text-emerald-600 dark:text-emerald-400 block mt-0.5 truncate">${avgMfe}</span>
            </div>
            <div className="border-l border-gray-100 dark:border-zinc-900/80 pl-2">
              <span className="text-[8.5px] text-slate-400 dark:text-zinc-500 block uppercase font-bold tracking-wider truncate">Avg MAE</span>
              <span className="font-mono text-xs sm:text-sm md:text-base lg:text-[14px] xl:text-base font-black text-rose-600 dark:text-rose-400 block mt-0.5 truncate">-${avgMae}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[9.5px] text-slate-500 dark:text-zinc-500 font-mono pt-1.5 border-t border-gray-100 dark:border-zinc-900/50">
            <span className="truncate">Drift ratio:</span>
            <span className="text-slate-700 dark:text-zinc-300 font-bold bg-gray-50 dark:bg-zinc-900 px-1 py-0.2 rounded border border-gray-100 dark:border-zinc-800 shrink-0 text-[8.5px]">{Number(avgMae) > 0 ? (Number(avgMfe)/Number(avgMae)).toFixed(1) : "1.5"}x</span>
          </div>
        </div>
      </div>

      {/* SECTION: PERFORMANCE BREAKDOWNS (SESSION, WEEKDAY) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Win/Loss by Session */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Clock className="h-4 w-4 text-sky-400" />
              Win / Loss by Session on Active Holdings
            </span>
            <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase">
              UTC CLOCK TIMES
            </span>
          </div>

          <div className="space-y-3.5">
            {sessionStats.map((sess) => {
              const winRatio = sess.total > 0 ? (sess.wins / sess.total) * 100 : 0;
              const isProfit = sess.pnl >= 0;
              return (
                <div key={sess.label} className="bg-zinc-900/10 p-3 rounded-lg border border-zinc-900/60 font-sans space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-white block">{sess.label}</span>
                      <span className="text-[10px] text-zinc-500 font-mono">{sess.hours}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span className={`block font-bold leading-tight ${isProfit ? "text-emerald-400" : "text-rose-450 text-rose-405 text-rose-400"}`}>
                        {isProfit ? "+" : ""}${sess.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-zinc-500 font-bold block">{winRatio.toFixed(1)}% WR ({sess.total} holding)</span>
                    </div>
                  </div>

                  {/* Progress Bar Visualization */}
                  <div className="space-y-1">
                    <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden flex">
                      {sess.total > 0 ? (
                        <>
                          <div 
                            className="bg-emerald-500 h-full" 
                            style={{ width: `${(sess.wins / sess.total) * 100}%` }}
                            title={`${sess.wins} Wins`}
                          />
                          <div 
                            className="bg-rose-500 h-full" 
                            style={{ width: `${(sess.losses / sess.total) * 100}%` }}
                            title={`${sess.losses} Losses`}
                          />
                        </>
                      ) : (
                        <div className="bg-zinc-800 w-full h-full" />
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                      <span>{sess.wins} Wins</span>
                      <span>{sess.losses} Losses</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Win/Loss by Weekday */}
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 text-left">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
              <Calendar className="h-4 w-4 text-purple-400" />
              Win / Loss by Days on Active Holdings
            </span>
            <span className="text-[9px] font-bold text-zinc-500 font-mono uppercase">
              SUITE RUN TIME
            </span>
          </div>

          <div className="space-y-2.5 max-h-[350px] overflow-y-auto pr-1">
            {weekdayStats.map((day) => {
              const winRatio = day.total > 0 ? (day.wins / day.total) * 100 : 0;
              const isProfit = day.pnl >= 0;
              if (day.total === 0) {
                return (
                  <div key={day.key} className="flex items-center justify-between text-[11px] py-1.5 border-b border-zinc-900/40 font-sans text-zinc-500">
                    <span>{day.label}</span>
                    <span className="text-[10px] font-mono select-none">No holdings recorded</span>
                  </div>
                );
              }
              return (
                <div key={day.key} className="flex flex-col py-1.5 border-b border-zinc-900/40 space-y-1.5 font-sans">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                       <span className="font-bold text-zinc-300">{day.label}</span>
                       <span className="text-[10px] text-zinc-500 font-mono">({day.total} holdings)</span>
                    </div>
                    <div className="text-right font-mono flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 font-bold">{winRatio.toFixed(0)}% WR</span>
                      <span className={`font-bold ${isProfit ? "text-emerald-405 text-emerald-400" : "text-rose-450 text-rose-400"}`}>
                        {isProfit ? "+" : ""}${day.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Micro bar tracking win count */}
                  <div className="w-full bg-zinc-900 rounded-full h-1 overflow-hidden flex">
                    <div className="bg-emerald-500 h-full" style={{ width: `${winRatio}%` }} />
                    <div className="bg-rose-500 h-full" style={{ width: `${100 - winRatio}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Active Positions */}
          <div id="trades-active-positions" className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5 flex-wrap gap-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 flex-wrap">
                <Table className="h-4 w-4 text-emerald-400 animate-pulse" />
                Active Positions Holdings
                <span className="ml-1.5 px-2 py-0.5 rounded bg-violet-400/10 text-[9px] font-bold text-violet-400 uppercase tracking-widest border border-violet-500/20">
                  Strategy + ITME + ML Combined SL/TP
                </span>
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setShowAttachForm(!showAttachForm)}
                  className="px-2 py-1 text-[10px] font-bold text-violet-400 bg-violet-400/10 hover:bg-violet-400/20 border border-violet-400/25 rounded transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3 w-3" />
                  Attach Running MT5 Trade
                </button>
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-400">
                  {openPositions.length} Open orders
                </span>
              </div>
            </div>

            {showAttachForm && (
              <form onSubmit={handleAttachTrade} className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-4 max-w-4xl animate-fadeIn">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-violet-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Attach Live Running MT5 Position
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-400">
                    Register a trade active on your MT5 terminal to manage SL/TP dynamically.
                  </span>
                </div>

                {attachError && (
                  <div className="p-2.5 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    {attachError}
                  </div>
                )}
                {attachSuccess && (
                  <div className="p-2.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                    {attachSuccess}
                  </div>
                )}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">MT5 Ticket ID *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 552282716"
                      value={attachTicket}
                      onChange={(e) => setAttachTicket(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">Asset Symbol *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. GBPUSD"
                      value={attachSymbol}
                      onChange={(e) => setAttachSymbol(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-violet-500 outline-none uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">Position Type *</label>
                    <div className="flex gap-1 h-8">
                      <button
                        type="button"
                        onClick={() => setAttachType("BUY")}
                        className={`flex-1 rounded text-xs font-bold font-sans uppercase border transition-all ${
                          attachType === "BUY"
                            ? "bg-emerald-500/15 border-emerald-500 text-emerald-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setAttachType("SELL")}
                        className={`flex-1 rounded text-xs font-bold font-sans uppercase border transition-all ${
                          attachType === "SELL"
                            ? "bg-rose-500/15 border-rose-500 text-rose-400"
                            : "bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">Lot Size *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 0.15"
                      value={attachSize}
                      onChange={(e) => setAttachSize(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">Entry Price *</label>
                    <input
                      type="number"
                      step="0.00001"
                      required
                      placeholder="e.g. 1.31767"
                      value={attachPrice}
                      onChange={(e) => setAttachPrice(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">Stop Loss (Optional)</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="None"
                      value={attachSlVal}
                      onChange={(e) => setAttachSlVal(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-zinc-500 font-bold mb-1">Take Profit (Optional)</label>
                    <input
                      type="number"
                      step="0.00001"
                      placeholder="None"
                      value={attachTpVal}
                      onChange={(e) => setAttachTpVal(e.target.value)}
                      className="w-full h-8 px-2.5 text-xs rounded bg-zinc-950 border border-zinc-800 text-white font-mono focus:border-violet-500 outline-none"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={attaching}
                      className="w-full h-8 px-4 rounded text-xs font-bold text-white bg-violet-600 hover:bg-violet-550 border border-violet-500 cursor-pointer flex items-center justify-center gap-1.5 transition-all select-none disabled:opacity-50"
                    >
                      {attaching ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Attaching...
                        </>
                      ) : (
                        "Confirm Attach"
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {openPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-zinc-850 bg-zinc-900/10 select-none">
                <XCircle className="h-8 w-8 text-zinc-750 mb-2" />
                <span className="text-xs font-semibold text-zinc-400">No active positions open</span>
                <p className="text-[10px] text-zinc-500">Go to the Dashboard or click 'Attach Running MT5 Trade' to register your active terminal positions.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-[#0c0d0f]/60">
                <table className="w-full text-left border-collapse min-w-[1250px] select-none font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950/60 whitespace-nowrap">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-3">Pair</th>
                      <th className="py-3 px-3">Strategy</th>
                      <th className="py-3 px-3">Dir</th>
                      <th className="py-3 px-3 text-center">TF</th>
                      <th className="py-3 px-3">LOT</th>
                      <th className="py-3 px-3 text-rose-500 font-bold">SL</th>
                      <th className="py-3 px-3 text-emerald-400 font-bold">ALL TPs</th>
                      <th className="py-3 px-3">Live</th>
                      <th className="py-3 px-3">Exit</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-4 text-right">PnL</th>
                      <th className="py-3 px-4 text-center">R</th>
                      <th className="py-3 px-4 text-center">Act</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 font-mono text-xs whitespace-nowrap">
                    {openPositions.map((trade) => {
                      const isWin = trade.pnl >= 0;
                      const tp1Val = getTpLevel(trade, 1);
                      const tp2Val = getTpLevel(trade, 2);
                      const tp3Val = getTpLevel(trade, 3);

                      const associatedMirror = state.mt5Config?.mirrorActivity?.find(
                        (m) =>
                          (m.tradeId === trade.id ||
                            (isSymbolMatch(m.symbol, trade.symbol) &&
                              m.type === trade.type &&
                              m.action === "OPEN" &&
                              Math.abs(new Date(m.time).getTime() - new Date(trade.openTime).getTime()) < 600000))
                      );

                      return (
                        <tr key={trade.id} className="hover:bg-zinc-900/30 transition-all duration-150 border-b border-zinc-900/30">
                          {/* Date Column */}
                          <td className="py-3.5 px-4 text-left">
                            <span className="text-[11px] font-medium text-zinc-300 block leading-tight">
                              {formatOpenDate(trade.openTime)}
                            </span>
                            <span className="text-[9px] text-[#8a9098] font-semibold mt-0.5 block opacity-75">
                              {getTradeNumber(trade.id)}
                            </span>
                          </td>

                          {/* Pair (Asset) Column */}
                          <td className="py-3.5 px-3">
                            <span className="font-bold text-white tracking-tight">{formatPair(trade.symbol)}</span>
                            <span className="text-[9px] text-zinc-500 block font-mono mt-0.5">{trade.id}</span>
                          </td>

                          {/* Strategy Column */}
                          <td className="py-3.5 px-3 text-left">
                            <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-tight">
                              {trade.strategyName || trade.strategyId}
                            </span>
                          </td>

                          {/* Dir (BUY/SELL) Column */}
                          <td className="py-3.5 px-3">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              trade.type === "BUY" ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {trade.type}
                            </span>
                          </td>

                          {/* Timeframe column */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                              {getTradeTimeframe(trade)}
                            </span>
                          </td>

                          {/* LOT size */}
                          <td className="py-3.5 px-3">
                            <span className="text-zinc-300 font-bold">{formatLot(trade)}</span>
                          </td>

                          {/* Stop Loss (SL) column */}
                          <td className="py-3.5 px-3 text-rose-400 font-semibold font-mono">
                            <div>
                              {trade.stopLoss ? formatPrice(trade.stopLoss, trade.symbol) : "—"}
                              {trade.stopLoss && (
                                <span className="text-[9px] text-zinc-500 font-medium ml-1">
                                  ({getPips(trade.entryPrice, trade.stopLoss, trade.symbol)})
                                </span>
                              )}
                            </div>
                            <span className="text-[7.5px] text-rose-500/70 font-bold block mt-0.5 tracking-wider">COMBINED (S+I+M)</span>
                          </td>

                          {/* ALL TPs Column */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-0.5 text-[9.5px] font-mono">
                              <div className="flex gap-1.5">
                                <span className="text-zinc-550 font-bold uppercase text-[8px]">TP1:</span>
                                <span className="text-emerald-400/95 font-semibold">
                                  {tp1Val ? formatPrice(tp1Val, trade.symbol) : "—"}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                <span className="text-zinc-550 font-bold uppercase text-[8px]">TP2:</span>
                                <span className="text-emerald-400/95 font-semibold">
                                  {tp2Val ? formatPrice(tp2Val, trade.symbol) : "—"}
                                </span>
                              </div>
                              <div className="flex gap-1.5">
                                <span className="text-zinc-550 font-bold uppercase text-[8px]">TP3:</span>
                                <span className="text-emerald-400/95 font-semibold">
                                  {tp3Val ? formatPrice(tp3Val, trade.symbol) : "—"}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Live Current Price */}
                          <td className="py-3.5 px-3">
                            <span className="text-zinc-100 font-semibold animate-pulse">{formatPrice(trade.currentPrice, trade.symbol)}</span>
                          </td>

                          {/* Exit Price (OPEN setup) */}
                          <td className="py-3.5 px-3 text-zinc-500">
                            <span className="text-[10px] font-bold text-zinc-600">—</span>
                          </td>

                          {/* Reason (MT5 Mirror status) */}
                          <td className="py-3.5 px-3 text-left">
                            {!state.config.mt5BridgeEnabled ? (
                              <span className="text-[9px] text-zinc-500 font-bold bg-zinc-900 border border-zinc-800/40 px-2 py-0.5 rounded">
                                Bridge Off
                              </span>
                            ) : (
                              <div className="flex items-center gap-1.5 justify-start">
                                {associatedMirror ? (
                                  <>
                                    {associatedMirror.status === "DONE" && (
                                      <span className="text-[9px] text-emerald-400 font-extrabold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                        <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                        Synced
                                      </span>
                                    )}
                                    {associatedMirror.status === "SENT" && (
                                      <div className="flex flex-col gap-1 items-start">
                                        <span className="text-[9px] text-blue-400 font-extrabold bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1">
                                          <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-pulse" />
                                          Transmitting
                                        </span>
                                        <button
                                          onClick={() => handleResetMT5(trade.id)}
                                          disabled={resettingTradeId === trade.id}
                                          className="text-[8.5px] font-bold text-zinc-400 underline hover:text-white cursor-pointer"
                                        >
                                          {resettingTradeId === trade.id ? "Resetting..." : "Reset Sync"}
                                        </button>
                                      </div>
                                    )}
                                    {associatedMirror.status === "PENDING" && (
                                      <span className="text-[9px] text-amber-400 font-extrabold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 bg-amber-400 rounded-full animate-pulse" />
                                        Pending EA
                                      </span>
                                    )}
                                    {associatedMirror.status === "FAILED" && (
                                      <div className="flex flex-col gap-1 items-start">
                                        <span className="text-[9px] text-rose-400 font-extrabold bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded uppercase flex items-center gap-1.5">
                                          <span className="h-1.5 w-1.5 bg-rose-500 rounded-full animate-pulse" />
                                          Failed
                                        </span>
                                        <button
                                          onClick={() => handlePushToMT5(trade.id)}
                                          disabled={pushingTradeId === trade.id}
                                          className="text-[8.5px] font-bold text-amber-500 underline hover:text-amber-400 cursor-pointer"
                                        >
                                          {pushingTradeId === trade.id ? "Queuing..." : "Retry Mirror"}
                                        </button>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="text-[9px] text-zinc-400 font-extrabold bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded uppercase flex items-center gap-1.5">
                                      <span className="h-1.5 w-1.5 bg-zinc-400 rounded-full" />
                                      Unsynced
                                    </span>
                                    <button
                                      onClick={() => handlePushToMT5(trade.id)}
                                      disabled={pushingTradeId === trade.id}
                                      className="text-[8.5px] font-semibold text-emerald-400 hover:text-emerald-350 underline cursor-pointer"
                                    >
                                      {pushingTradeId === trade.id ? "Queuing..." : "Push MT5"}
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>

                          {/* Yield (PnL) */}
                          <td className={`py-3.5 px-4 text-right font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                            <div className="flex flex-col items-end leading-normal text-right">
                              <span className="text-xs font-black">
                                {isWin ? "+" : ""} ${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9px] font-semibold opacity-85 mt-0.5 flex items-center gap-1.5 justify-end">
                                <span>{getTradePercent(trade)}</span>
                                <span className={`text-[9px] font-bold ${getTradePipsValue(trade) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                                  ({getTradePipsFormatted(trade)})
                                </span>
                              </span>
                            </div>
                          </td>

                          {/* R Multiple */}
                          <td className="py-3.5 px-4 text-center">
                            <span className={`font-mono font-black text-xs ${isWin ? "text-emerald-400" : "text-rose-500"}`}>
                              {getRMultiple(trade)}
                            </span>
                          </td>

                          {/* Closing trigger actions */}
                          <td className="py-3.5 px-4 text-center">
                            {editingTradeId === trade.id ? (
                              <div className="flex items-center gap-1.5 justify-center max-w-[220px] mx-auto bg-zinc-900/55 p-1.5 rounded-lg border border-zinc-800">
                                <div className="flex flex-col gap-1 items-stretch">
                                  <div className="flex gap-1 items-center">
                                    <span className="text-[8px] text-zinc-500 font-mono w-4 text-left">SL:</span>
                                    <input
                                      value={editSl}
                                      onChange={e => setEditSl(e.target.value)}
                                      placeholder="None"
                                      className="w-16 h-5 px-1 text-[9px] rounded bg-zinc-950 border border-zinc-800 text-white font-mono text-center focus:border-zinc-700 outline-none"
                                    />
                                  </div>
                                  <div className="flex gap-1 items-center">
                                    <span className="text-[8px] text-zinc-500 font-mono w-4 text-left">TP:</span>
                                    <input
                                      value={editTp}
                                      onChange={e => setEditTp(e.target.value)}
                                      placeholder="None"
                                      className="w-16 h-5 px-1 text-[9px] rounded bg-zinc-950 border border-zinc-800 text-white font-mono text-center focus:border-zinc-700 outline-none"
                                    />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handleModifyTradeSLTP(trade.id)}
                                    disabled={savingEdit}
                                    className="px-2 py-0.5 rounded text-[8.5px] font-bold bg-emerald-600 hover:bg-emerald-555 text-white border border-emerald-500 cursor-pointer disabled:opacity-50"
                                  >
                                    {savingEdit ? "..." : "Save"}
                                  </button>
                                  <button
                                    onClick={() => setEditingTradeId(null)}
                                    className="px-2 py-0.5 rounded text-[8.5px] font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 justify-center">
                                <button
                                  onClick={() => {
                                    setEditingTradeId(trade.id);
                                    setEditSl(trade.stopLoss ? String(trade.stopLoss) : "");
                                    setEditTp(trade.takeProfit ? String(trade.takeProfit) : "");
                                  }}
                                  className="px-2 py-1 text-[9.5px] font-bold font-sans rounded-md bg-zinc-900 border border-zinc-850 text-zinc-350 hover:bg-zinc-800 hover:text-white transition-all duration-150 cursor-pointer shadow-sm select-none"
                                >
                                  Adjust SL/TP
                                </button>
                                <button
                                  onClick={() => onCloseTrade(trade.id)}
                                  className="px-2.5 py-1 text-[9.5px] font-bold font-sans rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/25 transition-all duration-150 cursor-pointer shadow-sm select-none"
                                >
                                  Close Setup
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Positions Executions (Upgraded) */}
          <div id="trades-trade-history" className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4 scroll-mt-20">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 font-sans">
                <History className="h-4 w-4 text-emerald-500" />
                Trade History Tracker
              </span>
              <span className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-500">
                {closedPositions.length} Closed orders
              </span>
            </div>

            {closedPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-zinc-850 bg-zinc-900/10 select-none font-sans">
                <History className="h-8 w-8 text-zinc-750 mb-2" />
                <span className="text-xs font-semibold text-zinc-500">No closed executions yet</span>
                <p className="text-[10px] text-zinc-650">Trades closed by target levels will populate here.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-zinc-900/80 bg-[#0c0d0f]/60">
                <table className="w-full text-left border-collapse min-w-[1300px] select-none">
                  <thead>
                    <tr className="border-b border-zinc-900 font-mono text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950/60 whitespace-nowrap">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-3">Pair</th>
                      <th className="py-3 px-3">Strategy</th>
                      <th className="py-3 px-3">Dir</th>
                      <th className="py-3 px-3 text-center">TF</th>
                      <th className="py-3 px-3">LOT</th>
                      <th className="py-3 px-3 text-rose-500 font-bold">SL</th>
                      <th className="py-3 px-3 text-emerald-400 font-bold">ALL TPs</th>
                      <th className="py-3 px-3">Live</th>
                      <th className="py-3 px-3">Exit</th>
                      <th className="py-3 px-3">Reason</th>
                      <th className="py-3 px-4 text-right">PnL</th>
                      <th className="py-3 px-4 text-cyan-400 font-bold text-right">R</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/50 font-mono text-[11px] whitespace-nowrap">
                    {closedPositions.map((trade) => {
                      const isWin = trade.pnl >= 0;
                      const tp1Val = getTpLevel(trade, 1);
                      const tp2Val = getTpLevel(trade, 2);
                      const tp3Val = getTpLevel(trade, 3);

                      return (
                        <tr key={trade.id} className="hover:bg-zinc-900/30 transition-all duration-150 border-b border-zinc-900/30">
                          {/* Date Column with Sig # underneath */}
                          <td className="py-3.5 px-4 text-left">
                            <span className="text-[11px] font-medium text-zinc-300 block leading-tight">
                              {formatOpenDate(trade.openTime)}
                            </span>
                            <span className="text-[9.5px] text-zinc-500 font-medium block mt-0.5 select-none opacity-80">
                              {getTradeNumber(trade.id)}
                            </span>
                          </td>

                          {/* Pair Column */}
                          <td className="py-3.5 px-3">
                            <span className="text-[11px] font-bold text-zinc-200 tracking-tight">
                              {formatPair(trade.symbol)}
                            </span>
                            <span className="text-[9px] text-zinc-550 block font-mono mt-0.5">{trade.id}</span>
                          </td>

                          {/* Strategy Column */}
                          <td className="py-3.5 px-3 text-left">
                            <span className={`text-[11.5px] font-black uppercase tracking-tight ${
                              trade.strategyId === "TIME_RANGE" ? "text-cyan-400" :
                              trade.strategyId === "EMA_CROSS" ? "text-amber-400" :
                              trade.strategyId === "ALLIGATOR_SCALPER" ? "text-pink-400" :
                              trade.strategyId === "MAYANK_9_15_EMA" ? "text-emerald-400" :
                              trade.strategyId === "MAYANK_SCALPING" ? "text-violet-400" :
                              "text-indigo-400"
                            }`}>
                              {trade.strategyName || trade.strategyId}
                            </span>
                          </td>

                          {/* Dir (BUY/SELL) Column */}
                          <td className="py-3.5 px-3">
                            <span className={`text-[11px] font-black tracking-wider uppercase ${
                              trade.type === "BUY" ? "text-emerald-400" : "text-rose-400"
                            }`}>
                              {trade.type}
                            </span>
                          </td>

                          {/* Timeframe column */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="text-[9.5px] font-mono bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded font-bold text-zinc-400 select-none">
                              {getTradeTimeframe(trade)}
                            </span>
                          </td>

                          {/* LOT */}
                          <td className="py-3.5 px-3">
                            <span className="text-[11px] font-bold text-zinc-300">
                              {formatLot(trade)}
                            </span>
                          </td>

                          {/* Stop Loss (SL) Price */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col text-left">
                              <span className="font-bold text-rose-500">
                                {trade.stopLoss ? formatPrice(trade.stopLoss, trade.symbol) : "—"}
                              </span>
                              {trade.stopLoss && (
                                <span className="text-[9px] text-rose-400/85 font-medium tracking-tight select-none mt-0.5 opacity-90">
                                  {getPips(trade.entryPrice, trade.stopLoss, trade.symbol)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* ALL TPs Column */}
                          <td className="py-3.5 px-3">
                            <div className="flex flex-col gap-1 text-[9.5px] font-mono text-left">
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-550 font-bold text-[8px] uppercase">TP1:</span>
                                {trade.highestTpReached !== undefined && trade.highestTpReached >= 1 ? (
                                  <span className="font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-1 py-0.2 rounded text-[9px] inline-flex items-center">
                                    ✓ {tp1Val ? formatPrice(tp1Val, trade.symbol) : "—"}
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-500">
                                    {tp1Val ? formatPrice(tp1Val, trade.symbol) : "—"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-550 font-bold text-[8px] uppercase">TP2:</span>
                                {trade.highestTpReached !== undefined && trade.highestTpReached >= 2 ? (
                                  <span className="font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-1 py-0.2 rounded text-[9px] inline-flex items-center">
                                    ✓ {tp2Val ? formatPrice(tp2Val, trade.symbol) : "—"}
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-500">
                                    {tp2Val ? formatPrice(tp2Val, trade.symbol) : "—"}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-zinc-550 font-bold text-[8px] uppercase">TP3:</span>
                                {(trade.highestTpReached !== undefined && trade.highestTpReached >= 3) || (trade.status === "CLOSED" && trade.closeReason === "TP") ? (
                                  <span className="font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/20 px-1 py-0.2 rounded text-[9px] inline-flex items-center">
                                    ✓ {tp3Val ? formatPrice(tp3Val, trade.symbol) : "—"}
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-500">
                                    {tp3Val ? formatPrice(tp3Val, trade.symbol) : "—"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Live Current Price (Dashes when closed) */}
                          <td className="py-3.5 px-3 text-left">
                            <span className="text-zinc-500 font-mono">
                              {trade.status === "OPEN" ? formatPrice(trade.currentPrice, trade.symbol) : "—"}
                            </span>
                          </td>

                          {/* Exit Price */}
                          <td className="py-3.5 px-3 text-left">
                            <span className="font-bold text-zinc-100 font-mono">
                              {trade.status === "CLOSED" && trade.closePrice ? formatPrice(trade.closePrice, trade.symbol) : "—"}
                            </span>
                          </td>

                          {/* Trigger Reason badge matching screenshot */}
                          <td className="py-3.5 px-3 text-left">
                            {trade.status === "CLOSED" ? (
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase select-none ${
                                trade.closeReason === "SL" ? "bg-red-950/40 text-rose-400 border border-red-900/30" :
                                trade.closeReason === "TP" ? "bg-emerald-950/40 text-emerald-400 border border-emerald-950/45" :
                                "bg-amber-950/40 text-amber-500 border border-amber-900/40"
                              }`}>
                                {trade.closeReason || "MANUAL"}
                              </span>
                            ) : (
                              <span className="text-zinc-600 font-mono">—</span>
                            )}
                          </td>

                          {/* Closed PnL */}
                          <td className={`py-3.5 px-4 text-right font-bold text-xs ${
                            isWin ? "text-emerald-400 font-black" : "text-rose-455 text-rose-400"
                          }`}>
                            <div className="flex flex-col items-end gap-0.5 justify-end">
                              <div className="flex items-center gap-1.5">
                                <span>
                                  {isWin ? "+" : ""}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                                <span className={`text-[9.5px] font-bold ${isWin ? "text-emerald-500" : "text-rose-500"}`}>
                                  ({getTradePercent(trade)})
                                </span>
                              </div>
                              <span className={`text-[9.5px] font-black uppercase tracking-wider ${isWin ? "text-emerald-400 animate-pulse" : "text-rose-400"}`}>
                                {getTradePipsFormatted(trade)}
                              </span>
                            </div>
                          </td>

                          {/* R-Multiple Risk Score */}
                          <td className="py-3.5 px-4 text-right">
                            <span className={`font-mono font-black text-xs ${isWin ? "text-emerald-400" : "text-rose-500"}`}>
                              {getRMultiple(trade)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {openPositions.length > 0 && (
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg bg-violet-950/10 border border-violet-500/10 text-left select-none">
                <div className="space-y-1 max-w-2xl">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest block">Unified Combination SL/TP Engine</span>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    All open positions have their Stop Loss and Take Profit levels calculated dynamically by a combined algorithmic thesis: 
                    the baseline <strong className="text-zinc-200 font-bold">Strategy Parameters</strong>, the real-time <strong className="text-zinc-200 font-bold">ITME Confluence Score</strong> (expanding/narrowing limits based on current setup strength), and <strong className="text-zinc-200 font-bold">Machine Learning Neural Forecasts</strong> (auto-extending limits during strong momentum runs).
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900/60 border border-zinc-800 text-[9px] text-zinc-500 font-mono font-bold uppercase whitespace-nowrap">
                  <span className="h-1.5 w-1.5 bg-violet-400 rounded-full animate-pulse" />
                  Live Syncing Active
                </div>
              </div>
            )}
          </div>

          {/* Simulated Alternate / Sandbox Contracts section */}
          {simulatedPositions.length > 0 && (
            <div id="trades-simulated-positions" className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-4 scroll-mt-20 select-none">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 flex-wrap font-sans">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Simulated Equity Contracts (Non-MT5 Sandbox Mode)
                  <span className="ml-1.5 px-2 py-0.5 rounded bg-zinc-805 bg-zinc-900 text-[9px] font-bold text-amber-500 uppercase tracking-widest border border-amber-500/10">
                    Offline Demo Sandbox
                  </span>
                </span>
                <span className="px-2 py-0.5 rounded bg-zinc-900 text-[10px] font-mono text-zinc-500">
                  {simulatedPositions.length} Simulated positions
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-zinc-900 bg-[#0c0d0f]/60">
                <table className="w-full text-left border-collapse min-w-[1000px] select-none font-mono text-[11px]">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] uppercase font-bold text-zinc-500 bg-zinc-950/60 whitespace-nowrap animate-pulse">
                      <th className="py-3 px-4">Ticket</th>
                      <th className="py-3 px-3">Asset</th>
                      <th className="py-3 px-3">Side</th>
                      <th className="py-3 px-3 text-center">TF</th>
                      <th className="py-3 px-3">Status Mode</th>
                      <th className="py-3 px-3">Lot size</th>
                      <th className="py-3 px-3">Entry</th>
                      <th className="py-3 px-3">Live Price</th>
                      <th className="py-3 px-3 text-rose-500 font-bold">SL</th>
                      <th className="py-3 px-3 text-emerald-400 font-bold">Take Profit Target</th>
                      <th className="py-3 px-4 text-right">PnL (Yield)</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/40 font-mono text-xs whitespace-nowrap">
                    {simulatedPositions.map((trade) => {
                      const isWin = trade.pnl >= 0;
                      return (
                        <tr key={trade.id} className="hover:bg-zinc-900/20 transition-all duration-150 border-b border-zinc-900/20">
                          {/* Ticket ID */}
                          <td className="py-3 px-4 text-left">
                            <span className="text-zinc-500 font-bold block">{getTradeNumber(trade.id)}</span>
                            <span className="text-[9px] text-[#8a9098] font-semibold mt-0.5 block opacity-60 font-sans">{trade.id}</span>
                          </td>

                          {/* Asset Info */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-zinc-300 tracking-tight">{formatPair(trade.symbol)}</span>
                          </td>

                          {/* Side BUY/SELL */}
                          <td className="py-3 px-3">
                            <span className={`text-[10px] font-black uppercase tracking-wider ${
                              trade.type === "BUY" ? "text-emerald-405 text-emerald-400" : "text-rose-450 text-rose-400"
                            }`}>
                              {trade.type}
                            </span>
                          </td>

                          {/* Timeframe */}
                          <td className="py-3 px-3 text-center">
                            <span className="text-[10px] uppercase font-bold text-zinc-500 bg-zinc-900/60 border border-zinc-850 px-1.5 py-0.5 rounded shadow-sm">
                              {getTradeTimeframe(trade)}
                            </span>
                          </td>

                          {/* Status Mode */}
                          <td className="py-3 px-3">
                            <span className="text-[9px] text-zinc-500 font-semibold bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded select-none">
                              Offline Paper Trade · No MT5 Bridge
                            </span>
                          </td>

                          {/* Lot size */}
                          <td className="py-3 px-3 text-zinc-400">
                            {formatLot(trade)}
                          </td>

                          {/* Entry */}
                          <td className="py-3 px-3 text-zinc-400">
                            {formatPrice(trade.entryPrice, trade.symbol)}
                          </td>

                          {/* Live Price */}
                          <td className="py-3 px-3 text-zinc-350 select-none animate-pulse">
                            {formatPrice(trade.currentPrice, trade.symbol)}
                          </td>

                          {/* SL */}
                          <td className="py-3 px-3 text-rose-500/80">
                            <div>{trade.stopLoss ? formatPrice(trade.stopLoss, trade.symbol) : "—"}</div>
                            <span className="text-[7.5px] text-rose-500/70 font-bold block mt-0.5 tracking-wider">COMBINED (S+I+M)</span>
                          </td>

                          {/* TP */}
                          <td className="py-3 px-3 text-emerald-400/80 font-semibold">
                            <div>{trade.takeProfit ? formatPrice(trade.takeProfit, trade.symbol) : "—"}</div>
                            <span className="text-[7.5px] text-emerald-500/70 font-bold block mt-0.5 tracking-wider">COMBINED (S+I+M)</span>
                          </td>

                          {/* PnL and percentage */}
                          <td className={`py-3 px-4 text-right font-bold ${isWin ? "text-emerald-400" : "text-rose-400"}`}>
                            <div className="flex flex-col items-end leading-none text-right">
                              <span className="text-xs font-black">
                                {isWin ? "+" : ""} ${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              <span className="text-[9.5px] font-semibold text-zinc-500 mt-1 select-none">
                                {getTradePercent(trade)}
                              </span>
                            </div>
                          </td>

                          {/* Close action */}
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => onCloseTrade(trade.id)}
                              className="px-2 py-1 text-[9.5px] font-bold font-sans rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                            >
                              Close Sim
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        {/* Breakdown Analytics Bento Grid */}
        <div id="trades-breakdowns" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 scroll-mt-20">
          
          {/* Excursion MAE / MFE Analytics Card */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3.5 select-none">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2.5">
              <Scale className="h-4 w-4 text-sky-400" />
              Excursion Analytics (MFE/MAE)
            </span>
            <p className="text-[10.5px] text-zinc-400 leading-normal">
              MAE (Maximum Adverse Excursion) and MFE (Maximum Favorable Excursion) measures the boundary peaks hit during simulated trade run-times.
            </p>

            <div className="grid grid-cols-2 gap-3.5 pt-1">
              <div className="rounded-lg border border-emerald-950/30 bg-emerald-950/5 p-3 text-left">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Avg Max Favorable (MFE)</span>
                <span className="font-mono text-base font-black text-emerald-400 block mt-1">+${avgMfe}</span>
                <span className="text-[9.5px] text-zinc-500 block mt-0.5">Peak positive excursion</span>
              </div>

              <div className="rounded-lg border border-rose-950/30 bg-rose-950/5 p-3 text-left">
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Avg Max Adverse (MAE)</span>
                <span className="font-mono text-base font-black text-rose-400 block mt-1">-${Math.abs(Number(avgMae)).toFixed(2)}</span>
                <span className="text-[9.5px] text-zinc-500 block mt-0.5">Peak negative excursion</span>
              </div>
            </div>
          </div>

          {/* Pair Breakdown card */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <PieChart className="h-4 w-4 text-emerald-400" />
              Pair Breakdown Analytics
            </span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {Object.keys(pairBreakdown).length === 0 ? (
                <div className="text-xs text-zinc-550 text-center py-2">No breakdowns recorded</div>
              ) : (
                Object.keys(pairBreakdown).map((sym) => {
                  const data = pairBreakdown[sym];
                  const isUp = data.pnl >= 0;
                  return (
                    <div key={sym} className="flex items-center justify-between text-[11px] font-mono border-b border-zinc-900/40 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-zinc-300">{sym}</span>
                        <span className="text-zinc-500">x{data.count} trades</span>
                      </div>
                      <span className={`font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {isUp ? "+" : ""}${data.pnl.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Strategy Breakdown Card */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              Strategy Performance Breakdown
            </span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {Object.keys(strategyBreakdown).length === 0 ? (
                <div className="text-xs text-zinc-550 text-center py-2">No strategy breakdowns recorded</div>
              ) : (
                Object.keys(strategyBreakdown).map((stratId) => {
                  const data = strategyBreakdown[stratId];
                  const isUp = data.pnl >= 0;
                  return (
                    <div key={stratId} className="flex flex-col border-b border-zinc-900/40 pb-2 space-y-0.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-zinc-300 font-bold truncate max-w-[150px]" title={data.name}>{data.name}</span>
                        <span className={`font-bold ${isUp ? "text-emerald-400" : "text-rose-400"}`}>
                          {isUp ? "+" : ""}${data.pnl.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono">
                        <span>ID: {stratId}</span>
                        <span>{data.count} executed</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Regime Breakdown card */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-900 pb-2">
              <BadgeInfo className="h-4 w-4 text-purple-400" />
              Regime Breakdown Analytics
            </span>
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {Object.keys(regimeBreakdown).length === 0 ? (
                <div className="text-xs text-zinc-550 text-center py-2 font-mono">No regime breakdowns recorded</div>
              ) : (
                Object.keys(regimeBreakdown).map((reg) => {
                  const data = regimeBreakdown[reg];
                  const isUp = data.pnl >= 0;
                  return (
                    <div key={reg} className="flex items-center justify-between text-[11px] font-mono border-b border-zinc-900/40 pb-1.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-300 font-sans text-xs">{reg}</span>
                        <span className="text-zinc-550 text-zinc-550 text-zinc-500 text-[10px]">({data.count})</span>
                      </div>
                      <span className={`font-bold ${isUp ? "text-emerald-300" : "text-rose-300"}`}>
                        {isUp ? "+" : ""}${data.pnl.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
    </div>
  );
}
