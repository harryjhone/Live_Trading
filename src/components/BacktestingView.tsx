import React, { useState } from "react";
import { SymbolType, FullAppState } from "../types";
import {
  TrendingUp,
  Percent,
  Play,
  RotateCw,
  Sparkles,
  FileText,
  Copy,
  ChevronDown,
  CheckCircle,
  AlertTriangle,
  History,
  Coins,
  Shield,
  Gauge,
  HelpCircle,
  Share2
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

interface BacktestKPIs {
  startBalance: number;
  endBalance: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  averageWin: number;
  averageLoss: number;
  realDataLoaded?: boolean;
  slStats?: { STANDARD: number; ATR: number; PIPS: number; RISK_REWARD: number };
}

interface BacktestTrade {
  ticket: string;
  type: "BUY" | "SELL";
  entryTime: string;
  exitTime: string;
  entryPrice: number;
  stopLoss: number;
  originalSL: number;
  takeProfit: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  highestTpReached: number;
  exitPrice: number;
  pnl: number;
  pnlPercentage: number;
  status: string;
  closeReason: "SL" | "TP" | "TP_TRAIL_1" | "TP_TRAIL_2" | "TP3_HIT" | "END";
  endBalance: number;
  slType?: string;
  tpType?: string;
  slLevels?: { STANDARD: number; ATR: number; PIPS: number; RISK_REWARD: number };
  slHits?: { STANDARD: boolean; ATR: boolean; PIPS: boolean; RISK_REWARD: boolean };
}

interface PricePoint {
  date: string;
  balance: number;
  drawdown: number;
  price: number;
}

const SYMBOL_DETAILS: Record<SymbolType, { name: string; desc: string; decimals: number }> = {
  // Forex
  EURUSD: { name: "Euro / US Dollar", desc: "High-liquidity major spot", decimals: 4 },
  GBPUSD: { name: "Pound / US Dollar", desc: "Cable high yield macro pair", decimals: 4 },
  USDJPY: { name: "US Dollar / Japanese Yen", desc: "Classic safe-haven FX pair", decimals: 2 },
  AUDUSD: { name: "Aussie / US Dollar", desc: "Commodity-correlated FX pair", decimals: 4 },
  // Crypto
  BTCUSD: { name: "Bitcoin / USD", desc: "Digital gold volatility index", decimals: 2 },
  ETHUSD: { name: "Ethereum / USD", desc: "Smart-contract utility network asset", decimals: 2 },
  SOLUSD: { name: "Solana / USD", desc: "High-throughput layer 1 ledger", decimals: 2 },
  BNBUSD: { name: "BNB / USD", desc: "Exchange-ecosystem utility token", decimals: 2 },
  // Stocks
  AAPL: { name: "Apple Inc.", desc: "US large-cap equity premium", decimals: 2 },
  TSLA: { name: "Tesla Inc.", desc: "High-Beta clean energy stock", decimals: 2 },
  MSFT: { name: "Microsoft Corp.", desc: "Enterprise software & cloud leader", decimals: 2 },
  NVDA: { name: "NVIDIA Corp.", desc: "GPU & AI compute silicon leader", decimals: 2 },
  // Commodities
  XAUUSD: { name: "Gold / US Dollar", desc: "Sovereign hedge commodity standard", decimals: 2 },
  USOIL: { name: "Crude Oil Brent", desc: "Global energy benchmark spot", decimals: 2 },
  XAGUSD: { name: "Silver / US Dollar", desc: "Precious metals beta alternative", decimals: 2 },
  NGAS: { name: "Natural Gas Spot", desc: "Clean power energy commodity feed", decimals: 2 },
  // Indices
  SPX500: { name: "S&P 500 Index", desc: "US stock market basket benchmark", decimals: 2 },
  NDX100: { name: "NASDAQ 100 Index", desc: "Leading US innovation equity tech basket", decimals: 2 },
  DJI30: { name: "Dow Jones 30 Index", desc: "US industrial giants benchmark", decimals: 2 },
  GER40: { name: "DAX 40 Index", desc: "German blue-chip equity benchmark", decimals: 2 }
};

interface BacktestingViewProps {
  theme?: "dark" | "light";
  state?: FullAppState;
}

export default function BacktestingView({ theme, state }: BacktestingViewProps = {}) {
  // Backtest selections
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>("GBPUSD");
  const [selectedStrategy, setSelectedStrategy] = useState<string>("EMA_CROSS");
  const [timeframe, setTimeframe] = useState<string>("H4");
  const [startBalance, setStartBalance] = useState<number>(10000);
  const [riskPercent, setRiskPercent] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>("2025-11-27");
  const [endDate, setEndDate] = useState<string>("2026-05-27");
  const [emaLength, setEmaLength] = useState<number>(5);
  const [activeLength, setActiveLength] = useState<number>(40);
  const [tp1Ratio, setTp1Ratio] = useState<number>(1.5);
  const [tp2Ratio, setTp2Ratio] = useState<number>(2.5);
  const [tp3Ratio, setTp3Ratio] = useState<number>(4.0);
  const [profitLockTightness, setProfitLockTightness] = useState<"CONSERVATIVE" | "STANDARD" | "WIDE" | "OFF">("STANDARD");

  // Custom SL and TP States
  const [slType, setSlType] = useState<"STANDARD" | "ATR" | "PIPS" | "RISK_REWARD">("STANDARD");
  const [tpType, setTpType] = useState<"STANDARD" | "ATR" | "PIPS" | "RISK_REWARD">("STANDARD");
  const [slAtrMultiplier, setSlAtrMultiplier] = useState<number>(1.5);
  const [tpAtrMultiplier, setTpAtrMultiplier] = useState<number>(3.0);
  const [slPips, setSlPips] = useState<number>(50);
  const [tpPips, setTpPips] = useState<number>(100);
  const [slRiskRewardRatio, setSlRiskRewardRatio] = useState<number>(2.0);
  const [tpRiskRewardRatio, setTpRiskRewardRatio] = useState<number>(2.0);

  // Multi-Timeframe and Results States
  const [isMultiTimeframe, setIsMultiTimeframe] = useState<boolean>(false);
  const [multiResults, setMultiResults] = useState<Record<string, { kpis: BacktestKPIs; trades: BacktestTrade[]; pnlHistory: PricePoint[] }> | null>(null);
  const [activeComparativeTf, setActiveComparativeTf] = useState<string>("H4");

  // Results state
  const [loading, setLoading] = useState<boolean>(false);
  const [kpis, setKpis] = useState<BacktestKPIs | null>(null);
  const [trades, setTrades] = useState<BacktestTrade[]>([]);
  const [pnlHistory, setPnlHistory] = useState<PricePoint[]>([]);

  // AI Insights
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiReport, setAiReport] = useState<string>("");
  const [copyStatus, setCopyStatus] = useState<boolean>(false);

  // Selector for inspecting a specific timeframe of multi-backtest
  const selectMultiTimeframeForInspection = (tf: string) => {
    if (!multiResults || !multiResults[tf]) return;
    setActiveComparativeTf(tf);
    setTimeframe(tf);
    const selected = multiResults[tf];
    setKpis(selected.kpis);
    setTrades(selected.trades);
    setPnlHistory(selected.pnlHistory);
  };

  // Run backtest
  const runBacktest = async () => {
    setLoading(true);
    setAiReport(""); // Reset insights on new run
    try {
      if (isMultiTimeframe) {
        const timeframesToRun = ["M1", "M3", "M5", "M15", "H1", "H4", "D1"];
        const resultsMap: Record<string, { kpis: BacktestKPIs; trades: BacktestTrade[]; pnlHistory: PricePoint[] }> = {};
        
        const list = await Promise.all(timeframesToRun.map(async (tf) => {
          try {
            const res = await fetch("/api/backtest/run", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                symbol: selectedSymbol,
                strategyId: selectedStrategy,
                emaLength,
                activeLength,
                timeframe: tf,
                startBalance,
                riskPercentage: riskPercent,
                startDate,
                endDate,
                tp1Ratio,
                tp2Ratio,
                tp3Ratio,
                profitLockTightness,
                slType,
                tpType,
                slAtrMultiplier,
                tpAtrMultiplier,
                slPips,
                tpPips,
                slRiskRewardRatio,
                tpRiskRewardRatio
              })
            });
            if (!res.ok) throw new Error(`Failed to compile ${tf} backtest`);
            const data = await res.json();
            return { tf, success: true, data };
          } catch (err) {
            console.error(`Error in runBacktest for ${tf}:`, err);
            return { tf, success: false, data: null };
          }
        }));

        let defaultSelectedTf: string | null = null;
        list.forEach(({ tf, success, data }) => {
          if (success && data) {
            resultsMap[tf] = {
              kpis: data.kpis,
              trades: data.trades,
              pnlHistory: data.pnlHistory
            };
            if (!defaultSelectedTf) {
              defaultSelectedTf = tf;
            }
          }
        });

        if (defaultSelectedTf) {
          setMultiResults(resultsMap);
          setActiveComparativeTf(defaultSelectedTf);
          setTimeframe(defaultSelectedTf);
          
          const activeData = resultsMap[defaultSelectedTf];
          setKpis(activeData.kpis);
          setTrades(activeData.trades);
          setPnlHistory(activeData.pnlHistory);
        } else {
          throw new Error("Unable to fetch any multi-timeframe backtest results.");
        }
      } else {
        setMultiResults(null);
        const res = await fetch("/api/backtest/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol: selectedSymbol,
            strategyId: selectedStrategy,
            emaLength,
            activeLength,
            timeframe,
            startBalance,
            riskPercentage: riskPercent,
            startDate,
            endDate,
            tp1Ratio,
            tp2Ratio,
            tp3Ratio,
            profitLockTightness,
            slType,
            tpType,
            slAtrMultiplier,
            tpAtrMultiplier,
            slPips,
            tpPips,
            slRiskRewardRatio,
            tpRiskRewardRatio
          })
        });

        if (!res.ok) throw new Error("Failed to compile backtest.");
        const data = await res.json();
        setKpis(data.kpis);
        setTrades(data.trades);
        setPnlHistory(data.pnlHistory);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Generate AI quantitative report
  const generateAiReport = async () => {
    if (!kpis) return;
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/analyze-backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kpis,
          symbol: selectedSymbol,
          strategyId: selectedStrategy,
          timeframe
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiReport(data.text);
      } else {
        setAiReport("Unable to establish communication with Gemini. Set process.env.GEMINI_API_KEY.");
      }
    } catch (err: any) {
      setAiReport("Failed, Error: " + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // Sharing metrics
  const shareReport = () => {
    if (!kpis) return;
    const reportText = `📊 QUANT AI BACKTEST REPORT
================================
Asset: ${selectedSymbol} | Strategy: ${selectedStrategy} | TF: ${timeframe}
Period simulated: ${startDate} to ${endDate}
Starting Bal: $${kpis.startBalance} | Ending Bal: $${kpis.endBalance}
Net Gain: $${kpis.netProfit} (${kpis.netProfitPercent}%)
Win Rate: ${kpis.winRate}% | Completed Positions: ${kpis.totalTrades}
Strategy Profit Factor: ${kpis.profitFactor} | Max Drawdown: -${kpis.maxDrawdownPercent}%
================================
Generated via Quant Terminal on ${new Date().toLocaleDateString()}`;

    navigator.clipboard.writeText(reportText);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header section with description */}
      <div className="border-b border-zinc-900 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            Quant Strategy Backtester
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Simulate advanced historical trading rules retroactively across a custom range of candle data. Inspect trailing Stops, SL margins, and compile deep KPI metrics.
          </p>
        </div>
        {kpis && (
          <button
            onClick={shareReport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            id="btn-share-backtest"
          >
            {copyStatus ? (
              <>
                <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                Copied Markdown!
              </>
            ) : (
              <>
                <Share2 className="h-3.5 w-3.5" />
                Share KPI Sheet
              </>
            )}
          </button>
        )}
      </div>

      {/* Inputs Calibration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Configurations Column */}
        <div className="lg:col-span-1 rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 space-y-4">
          <div className="border-b border-zinc-900/60 pb-2 flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-400" />
            <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase font-mono">Parameters Setup</h4>
          </div>

          {/* Symbol */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Trading Asset</label>
            <div className="relative">
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value as SymbolType)}
                className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/70"
                id="backtest-asset-select"
              >
                {Object.keys(SYMBOL_DETAILS).map((sym) => (
                  <option key={sym} value={sym}>
                    {sym} - {SYMBOL_DETAILS[sym as SymbolType].name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Strategy */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Algorithmic Strategy</label>
            <select
              value={selectedStrategy}
              onChange={(e) => setSelectedStrategy(e.target.value)}
              className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/70"
              id="backtest-strategy-select"
            >
              {state?.strategies?.filter((s) => !s.deleted).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              )) || (
                <>
                  <option value="EMA_CROSS">EMA Active Line Cross (With TP 1:3 Trailing Stop)</option>
                  <option value="TIME_RANGE">Time-Range Breakout Strategy (Session consolidation levels)</option>
                </>
              )}
              {/* Force fallback default keys if not present in the dynamic strategies */}
              {!state?.strategies?.find(s => s.id === "EMA_CROSS") && (
                <option value="EMA_CROSS">EMA Active Line Cross (With TP 1:3 Trailing Stop)</option>
              )}
              {!state?.strategies?.find(s => s.id === "TIME_RANGE") && (
                <option value="TIME_RANGE">Time-Range Breakout Strategy (Session consolidation levels)</option>
              )}
            </select>
          </div>

          {/* Timeframe */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Candle Log Timeframe</label>
            {isMultiTimeframe ? (
              <div className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800/60 rounded-lg p-2.5 text-zinc-400 font-mono text-center select-none uppercase tracking-wide">
                ⚡ ALL (M1, M3, M5, M15, H1, H4, D1)
              </div>
            ) : (
              <select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-100 focus:outline-none focus:border-emerald-500/70"
                id="backtest-timeframe-select"
              >
                <option value="M1">M1 (1 Minute)</option>
                <option value="M3">M3 (3 Minutes)</option>
                <option value="M5">M5 (5 Minutes)</option>
                <option value="M15">M15 (15 Minutes)</option>
                <option value="H1">H1 (1 Hour)</option>
                <option value="H4">H4 (4 Hours)</option>
                <option value="D1">D1 (Daily Candles)</option>
              </select>
            )}
          </div>

          {/* Multi-Timeframe Mode Checkbox */}
          <div className="p-2.5 bg-zinc-900/50 border border-zinc-900/80 rounded-lg space-y-1.5">
            <label className="flex items-center gap-2 cursor-pointer group text-zinc-200 select-none">
              <input
                type="checkbox"
                checked={isMultiTimeframe}
                onChange={(e) => {
                  setIsMultiTimeframe(e.target.checked);
                  // Clear old results to avoid mismatched states
                  setKpis(null);
                  setMultiResults(null); 
                }}
                className="rounded border-zinc-800 bg-zinc-950 w-3.5 h-3.5 text-emerald-600 focus:ring-emerald-500/50 cursor-pointer accent-emerald-500"
              />
              <span className="text-[11px] font-bold group-hover:text-emerald-400 transition-colors duration-200 font-sans tracking-wide">
                🔄 Multi-Timeframe Model
              </span>
            </label>
            <span className="text-[9px] text-zinc-500 block leading-normal select-none font-sans">
              Crunches historical bars across M1, M3, M5, M15, H1, H4, and D1 scopes concurrently to compile comparative results.
            </span>
          </div>

          {/* Starting Capital */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Starting Balance ($)</label>
            <input
              type="number"
              value={startBalance}
              onChange={(e) => setStartBalance(Number(e.target.value))}
              placeholder="e.g. 10000"
              className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-zinc-101 focus:outline-none focus:border-emerald-500/70"
              id="backtest-balance-input"
            />
          </div>

          {/* Custom Date Range Selection */}
          <div className="space-y-2 border-t border-zinc-905 border-zinc-900/40 pt-2.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">Backtest Horizon (Custom Date Range)</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500/70 cursor-pointer"
                />
              </div>
              <div>
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500/70 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Risk Percent */}
          <div className="space-y-1.5">
            <label className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Capital Risk Per Position</label>
            <div className="flex gap-1">
              {[0.5, 1, 2, 3, 5].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setRiskPercent(val)}
                  className={`flex-1 py-1.5 text-[10px] font-mono font-black rounded border transition-all cursor-pointer ${
                    riskPercent === val
                      ? "bg-emerald-600 border-emerald-500 text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                  }`}
                >
                  {val}%
                </button>
              ))}
            </div>
          </div>

          {/* Strategy Specific Indicator Configurations */}
          {selectedStrategy === "EMA_CROSS" && (
            <div className="pt-2 border-t border-zinc-900/60 space-y-3">
              <div className="text-[9px] text-zinc-500 uppercase font-bold leading-none tracking-wider select-none">Technical Indicator Calibration</div>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-500 tracking-tight leading-none block mb-1">Fast EMA</label>
                  <input
                    type="number"
                    value={emaLength}
                    onChange={(e) => setEmaLength(Number(e.target.value))}
                    min={2}
                    max={20}
                    className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 text-center"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-500 tracking-tight leading-none block mb-1">Active Line</label>
                  <input
                    type="number"
                    value={activeLength}
                    onChange={(e) => setActiveLength(Number(e.target.value))}
                    min={20}
                    max={100}
                    className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 text-center"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Exit Limits & SL/TP Engine Customization */}
          <div className="pt-3 border-t border-zinc-900/60 space-y-4">
            <div className="text-[10px] text-zinc-400 uppercase font-bold leading-none tracking-wider select-none">🛡️ Stop Loss (SL) & Take Profit (TP) Engine</div>

            <div className="grid grid-cols-2 gap-3">
              {/* SL Type Selection */}
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block mb-1">Stop Loss Type</label>
                <select
                  value={slType}
                  onChange={(e) => setSlType(e.target.value as any)}
                  className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500/70"
                >
                  <option value="STANDARD">Standard (Adaptive)</option>
                  <option value="ATR">ATR Based</option>
                  <option value="PIPS">Fixed Pips</option>
                  <option value="RISK_REWARD">Risk Reward Ratio</option>
                </select>
              </div>

              {/* TP Type Selection */}
              <div className="space-y-1">
                <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block mb-1">Take Profit Type</label>
                <select
                  value={tpType}
                  onChange={(e) => setTpType(e.target.value as any)}
                  className="w-full text-xs font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-100 focus:outline-none focus:border-emerald-500/70"
                >
                  <option value="STANDARD">Standard (Adaptive)</option>
                  <option value="ATR">ATR Based</option>
                  <option value="PIPS">Fixed Pips</option>
                  <option value="RISK_REWARD">Risk Reward Ratio</option>
                </select>
              </div>
            </div>

            {/* Dynamic parameters depending on selection */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-950/45 p-2 rounded-lg border border-zinc-900/60">
              {/* Dynamic SL Config */}
              <div>
                {slType === "ATR" && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block">ATR SL Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={slAtrMultiplier}
                      onChange={(e) => setSlAtrMultiplier(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500/70"
                    />
                  </div>
                )}
                {slType === "PIPS" && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block">SL Fixed Pips</label>
                    <input
                      type="number"
                      value={slPips}
                      onChange={(e) => setSlPips(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500/70"
                    />
                  </div>
                )}
                {slType === "RISK_REWARD" && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block">SL Risk/Reward Ratio</label>
                    <input
                      type="number"
                      step="0.1"
                      value={slRiskRewardRatio}
                      onChange={(e) => setSlRiskRewardRatio(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500/70"
                    />
                  </div>
                )}
                {slType === "STANDARD" && (
                  <div className="text-[9.5px] text-zinc-500 leading-normal italic py-1">
                    Standard adaptive SL uses structural swing lows and support zones.
                  </div>
                )}
              </div>

              {/* Dynamic TP Config */}
              <div>
                {tpType === "ATR" && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block">ATR TP Multiplier</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tpAtrMultiplier}
                      onChange={(e) => setTpAtrMultiplier(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500/70"
                    />
                  </div>
                )}
                {tpType === "PIPS" && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block">TP Fixed Pips</label>
                    <input
                      type="number"
                      value={tpPips}
                      onChange={(e) => setTpPips(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500/70"
                    />
                  </div>
                )}
                {tpType === "RISK_REWARD" && (
                  <div className="space-y-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide block">TP Risk/Reward Ratio</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tpRiskRewardRatio}
                      onChange={(e) => setTpRiskRewardRatio(Number(e.target.value))}
                      className="w-full text-xs font-mono font-bold bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 text-zinc-100 text-center focus:outline-none focus:border-emerald-500/70"
                    />
                  </div>
                )}
                {tpType === "STANDARD" && (
                  <div className="text-[9.5px] text-zinc-500 leading-normal italic py-1">
                    Standard adaptive TP uses swing highs and mathematical target zones.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CTA Run button */}
          <button
            onClick={runBacktest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer disabled:cursor-not-allowed font-sans mt-3"
            id="btn-launch-backtest"
          >
            {loading ? (
              <>
                <RotateCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                Crunching Historical Ticks...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current text-white" />
                Run Backtest Engine
              </>
            )}
          </button>
        </div>

        {/* Charting & KPIs Row */}
        <div className="lg:col-span-3 space-y-6">
          {kpis === null ? (
            /* Standby Placeholder */
            <div className="h-full flex flex-col items-center justify-center border border-zinc-900/60 border-dashed rounded-2xl bg-zinc-950/20 p-8 min-h-[420px] text-center select-none">
              <div className="p-3.5 rounded-full bg-zinc-900/50 border border-zinc-800/80 text-zinc-500 mb-4 animate-pulse">
                <Gauge className="h-7 w-7 text-zinc-400" />
              </div>
              <h4 className="text-zinc-300 font-semibold font-display text-sm tracking-wide">6-Month Strategic Simulation Stream</h4>
              <p className="text-[11px] text-zinc-550 max-w-sm mx-auto mt-1 leading-relaxed text-zinc-550 text-zinc-500">
                Setup your preferred capital parameters and macro conditions, then trigger the simulator to load real-time mathematical backtest indices.
              </p>
            </div>
          ) : (
             /* Visual Platform Results */
            <div className="space-y-6">
              {/* Backtest Header with Status Badge */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-zinc-950/40 p-3 px-4 rounded-xl border border-zinc-900 border-dashed">
                <div>
                  <h4 className="text-sm font-black font-display text-zinc-100 tracking-wide text-left">Historical Backtest Audit Completed</h4>
                  <p className="text-[10px] text-zinc-500 font-mono mt-0.5 text-left">Determined on real-time execution parameters and slippage offsets.</p>
                </div>
                <div className="flex items-center gap-1.5 align-middle self-start sm:self-center">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold font-sans px-2.5 py-0.5 rounded-full uppercase tracking-wider ${kpis.realDataLoaded ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${kpis.realDataLoaded ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                    {kpis.realDataLoaded ? "Live API Historical Feed" : "Simulated Wave Engine"}
                  </span>
                </div>
              </div>

              {/* Multi-Timeframe Comparative Table */}
              {multiResults && (
                <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900/60 pb-2.5 gap-2 select-none">
                    <div className="flex items-center gap-1.5 text-left">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <div>
                        <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase font-mono">Multi-Timeframe Comparative Performance Matrix</h4>
                        <p className="text-[10px] text-zinc-500 font-sans mt-0.5">Click any interval row below to dynamically update charts, AI insights, and trade logs</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans text-xs min-w-[650px]">
                      <thead>
                        <tr className="border-b border-zinc-900/80 text-[10px] text-zinc-500 font-mono uppercase tracking-wider select-none">
                          <th className="py-2 px-3">Interval</th>
                          <th className="py-2 px-3 text-right">Net Profit</th>
                          <th className="py-2 px-3 text-right">Win Rate</th>
                          <th className="py-2 px-3 text-right">Profit Factor</th>
                          <th className="py-2 px-3 text-right">Max Drawdown</th>
                          <th className="py-2 px-3 text-right">Positions Raised</th>
                          <th className="py-2 px-3 text-right">Compounded Balance</th>
                          <th className="py-2 px-3 text-center">Data Type</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/40 text-zinc-300">
                        {Object.entries(multiResults).map(([tf, result]) => {
                          const item = result as { kpis: BacktestKPIs; trades: BacktestTrade[]; pnlHistory: PricePoint[] };
                          const kpf = item.kpis;
                          const isActive = activeComparativeTf === tf;
                          const isProfPercent = kpf.netProfitPercent >= 0;
                          return (
                            <tr 
                              key={tf}
                              onClick={() => selectMultiTimeframeForInspection(tf)}
                              className={`hover:bg-zinc-900/15 transition-all cursor-pointer ${
                                isActive ? "bg-emerald-950/15 border-l-2 border-emerald-500" : ""
                              }`}
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${isActive ? "bg-emerald-400 animate-pulse" : "bg-zinc-650 bg-zinc-600"}`} />
                                  <span className="font-bold text-zinc-100 font-mono text-[13px]">{tf}</span>
                                </div>
                              </td>
                              <td className={`py-3 px-3 text-right font-mono font-bold text-[12px] ${isProfPercent ? "text-emerald-400" : "text-rose-400"}`}>
                                {isProfPercent ? "+" : ""}{kpf.netProfitPercent.toFixed(2)}%
                              </td>
                              <td className="py-3 px-3 text-right font-mono">
                                <span className="text-zinc-100 font-semibold">{kpf.winRate}%</span>
                                <span className="text-[9px] text-zinc-500 ml-1">({kpf.wins}W / {kpf.losses}L)</span>
                              </td>
                              <td className={`py-3 px-3 text-right font-mono ${
                                kpf.profitFactor >= 1.25 ? "text-emerald-400 font-bold" : kpf.profitFactor >= 1.0 ? "text-amber-500" : "text-rose-400"
                              }`}>
                                {kpf.profitFactor.toFixed(2)}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-rose-400">
                                -{kpf.maxDrawdownPercent}%
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-zinc-400">
                                {kpf.totalTrades}
                              </td>
                              <td className="py-3 px-3 text-right font-mono text-emerald-400 font-semibold">
                                ${kpf.endBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono inline-block tracking-wider ${
                                  isActive
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/35"
                                    : "bg-zinc-900 text-zinc-400 border border-zinc-800"
                                }`}>
                                  {isActive ? "ACTIVE VIEW" : "INSPECT"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Bento KPIs Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 font-sans text-left">
                {/* Net Balance Growth */}
                <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(16,185,129,0.05)] hover:scale-[1.02] group">
                  <div className="absolute top-0 right-0 h-10 w-10 bg-emerald-500/5 rounded-full blur-lg pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                  <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Compounded Balance</span>
                  <div className="flex items-baseline gap-1.5 pt-2">
                    <span className="text-2xl font-black text-white font-mono tracking-tight leading-none">${kpis.endBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                    <span className={`text-[11px] font-mono font-black ${kpis.netProfit >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {kpis.netProfit >= 0 ? "+" : ""}{kpis.netProfitPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 flex items-center justify-between">
                    <span>Initial capital:</span>
                    <span className="text-zinc-400 font-mono">${kpis.startBalance.toLocaleString()}</span>
                  </div>
                </div>

                {/* Win Rate */}
                <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(59,130,246,0.05)] hover:scale-[1.02] group">
                  <div className="absolute top-0 right-0 h-10 w-10 bg-blue-500/5 rounded-full blur-lg pointer-events-none group-hover:bg-blue-500/10 transition-colors" />
                  <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Completions Win Rate</span>
                  <div className="flex items-baseline gap-1.5 pt-2">
                    <span className="text-2xl font-black text-white font-mono tracking-tight leading-none">{kpis.winRate}%</span>
                    <span className="text-[9.5px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1 py-0.2 rounded font-bold">RATE</span>
                  </div>
                  <div className="mt-3 text-[10px] border-t border-zinc-900/50 pt-1.5 flex items-center justify-between">
                    <span className="text-zinc-500">Breakdown:</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-semibold">{kpis.wins}W <span className="text-zinc-700">/</span> <span className="text-rose-400 font-semibold">{kpis.losses}L</span></span>
                  </div>
                </div>

                {/* Profit Factor */}
                <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(234,179,8,0.05)] hover:scale-[1.02] group">
                  <div className="absolute top-0 right-0 h-10 w-10 bg-amber-500/5 rounded-full blur-lg pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                  <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Profit Factor</span>
                  <div className="flex items-baseline gap-1.5 pt-2">
                    <span className={`text-2xl font-black font-mono tracking-tight leading-none ${kpis.profitFactor >= 1.25 ? "text-emerald-400" : kpis.profitFactor >= 0.95 ? "text-amber-500" : "text-rose-400"}`}>
                      {kpis.profitFactor}
                    </span>
                    <span className="text-[9.5px] font-mono text-zinc-400 bg-zinc-900 border border-zinc-800 px-1 py-0.2 rounded font-bold">RATIO</span>
                  </div>
                  <div className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 flex items-center justify-between">
                    <span>Yield expectancy:</span>
                    <span className={`text-[9px] font-bold ${kpis.profitFactor >= 1.0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {kpis.profitFactor >= 1.0 ? "POSITIVE" : "NEGATIVE"}
                    </span>
                  </div>
                </div>

                {/* Max Peak Drawdown */}
                <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-950 via-zinc-950 to-zinc-900/50 p-5 relative overflow-hidden transition-all duration-300 hover:border-zinc-700 hover:shadow-[0_0_20px_rgba(244,63,94,0.05)] hover:scale-[1.02] group">
                  <div className="absolute top-0 right-0 h-10 w-10 bg-rose-500/5 rounded-full blur-lg pointer-events-none group-hover:bg-rose-500/10 transition-colors" />
                  <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">Peak Drawdown</span>
                  <div className="flex items-baseline gap-1.5 pt-2">
                    <span className={`text-2xl font-black font-mono tracking-tight leading-none ${kpis.maxDrawdownPercent <= 5 ? "text-emerald-400" : kpis.maxDrawdownPercent <= 10 ? "text-amber-400" : "text-rose-400"}`}>
                      -{kpis.maxDrawdownPercent}%
                    </span>
                    <span className="text-[9.5px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1 py-0.2 rounded font-bold">LIMIT</span>
                  </div>
                  <div className="mt-3 text-[10px] text-zinc-500 border-t border-zinc-900/50 pt-1.5 flex items-center justify-between">
                    <span>Avg Win/Loss Ratio:</span>
                    <span className="text-zinc-450 text-zinc-350 font-mono font-bold">${kpis.averageWin.toFixed(0)} <span className="text-zinc-600 font-normal">/</span> -${kpis.averageLoss.toFixed(0)}</span>
                  </div>
                </div>
              </div>

              {/* Chart Visualizer */}
              <div className="rounded-xl border border-zinc-905 border-zinc-900 bg-zinc-950/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-bold uppercase text-zinc-400 font-mono tracking-wider">Equity Growth Curves</span>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono block">{startDate} to {endDate} - {timeframe} Candles interval</span>
                </div>

                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pnlHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" vertical={false} />
                      <XAxis dataKey="date" stroke="#3f3f46" fontSize={9} fontStyle="mono" tickLine={false} />
                      <YAxis stroke="#3f3f46" fontSize={9} fontStyle="mono" tickLine={false} domain={['dataMin - 100', 'dataMax + 100']} />
                      <Tooltip
                        contentStyle={{ backgroundColor: "#09090b", borderColor: "#18181b", borderRadius: "8px", fontSize: "11px" }}
                        labelStyle={{ color: "#a1a1aa", fontWeight: "bold" }}
                      />
                      <Area type="monotone" dataKey="balance" name="Account balance" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorBalance)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* AI Report Deconstruction */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-5 space-y-3.5">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
                    <div>
                      <h4 className="font-sans text-xs font-black tracking-widest text-zinc-400 uppercase">AI Quantitative Audit Report</h4>
                      <p className="text-[9px] text-zinc-500 mt-0.5 font-sans">Dual-layered statistical analysis driven by Gemini</p>
                    </div>
                  </div>
                  {!aiReport && (
                    <button
                      onClick={generateAiReport}
                      disabled={aiLoading}
                      className="flex items-center gap-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md cursor-pointer text-[10.5px]"
                      id="btn-backtest-ai-generate"
                    >
                      {aiLoading ? (
                        <>
                          <RotateCw className="h-3 w-3 animate-spin" />
                          Consulting Gemini Risk Models...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          Deconstruct Performance
                        </>
                      )}
                    </button>
                  )}
                </div>

                {aiReport && (
                  <div className="bg-zinc-900/10 p-4 rounded-lg border border-zinc-900/60 min-h-[140px] flex flex-col justify-between relative">
                    <div className="text-xs leading-relaxed text-zinc-300 font-sans whitespace-pre-wrap select-all max-h-[300px] overflow-y-auto pr-2">
                      {aiReport}
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(aiReport);
                        setCopyStatus(true);
                        setTimeout(() => setCopyStatus(false), 2000);
                      }}
                      className="absolute top-2.5 right-2.5 p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-450 text-zinc-400 hover:text-white"
                      title="Copy report to clipboard"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Trade-by-trade completed order books */}
      {trades.length > 0 && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4 space-y-3">
          <div className="flex items-center gap-1.5 pb-1 border-b border-zinc-900">
            <History className="h-4.5 w-4.5 text-zinc-400" />
            <h4 className="text-xs font-black tracking-widest text-zinc-400 uppercase font-mono">Historical Simulation Ledger ({trades.length} Positions)</h4>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-sans text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-zinc-900/80 text-[10px] text-zinc-500 font-mono uppercase tracking-wider select-none">
                  <th className="py-2.5 px-3">Ticket ID</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3">Timeframes</th>
                  <th className="py-2.5 px-3 uppercase text-left">Targets set / trailing</th>
                  <th className="py-2.5 px-3 text-right">Exec Prices</th>
                  <th className="py-2.5 px-3 text-center">Trigger Case</th>
                  <th className="py-2.5 px-3 text-right">Profit / Loss</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                {trades.map((t) => {
                  const isProf = t.pnl >= 0;
                  const formatPrice = (p: number) => p.toFixed(SYMBOL_DETAILS[selectedSymbol]?.decimals || 2);
                  const isEma = selectedStrategy === "EMA_CROSS";

                  // Direction-aware pip calculation
                  const entry = t.entryPrice;
                  const exit = t.exitPrice;
                  const isBuy = t.type === "BUY";
                  const diff = isBuy ? (exit - entry) : (entry - exit);
                  
                  let pipsVal = 0;
                  if (selectedSymbol.startsWith("BTC")) {
                    pipsVal = diff;
                  } else if (selectedSymbol.startsWith("XAU")) {
                    pipsVal = diff * 10;
                  } else {
                    pipsVal = diff * 10000;
                  }
                  const pipsFormatted = `${pipsVal >= 0 ? "+" : ""}${pipsVal.toFixed(1)} pp`;

                  return (
                    <tr key={t.ticket} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="py-3 px-3 font-mono font-bold font-medium select-all text-zinc-400 uppercase">{t.ticket}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-black font-mono inline-block tracking-wider ${
                          t.type === "BUY"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                            : "bg-rose-500/10 text-rose-450 text-rose-400 border border-rose-500/15"
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[10.5px]">
                        <span className="text-zinc-300 block">{new Date(t.entryTime).toLocaleDateString()}</span>
                        <span className="text-[8px] text-zinc-500 block leading-none">{new Date(t.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      
                      <td className="py-3 px-3">
                        {isEma && t.tp1 && t.tp2 && t.tp3 ? (
                          <div className="flex flex-col text-[10px] font-mono leading-tight space-y-0.5">
                            <span className="text-zinc-500">
                              SL: <span className="text-zinc-400 font-bold">{formatPrice(t.stopLoss)}</span>
                            </span>
                            <div className="flex gap-2">
                              <span className={`px-1 py-0.5 rounded-sm bg-zinc-900 text-[8.5px] border ${t.highestTpReached >= 1 ? "text-emerald-400 border-emerald-500/30" : "text-zinc-500 border-zinc-800"}`}>
                                TP1: {formatPrice(t.tp1)}
                              </span>
                              <span className={`px-1 py-0.5 rounded-sm bg-zinc-900 text-[8.5px] border ${t.highestTpReached >= 2 ? "text-emerald-400 border-emerald-500/30" : "text-zinc-500 border-zinc-800"}`}>
                                TP2: {formatPrice(t.tp2)}
                              </span>
                              <span className={`px-1 py-0.5 rounded-sm bg-zinc-900 text-[8.5px] border ${t.highestTpReached >= 3 || t.closeReason === "TP3_HIT" ? "text-emerald-400 border-emerald-500/30" : "text-zinc-500 border-zinc-800"}`}>
                                TP3: {formatPrice(t.tp3)}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-3 font-mono text-[10px]">
                            <span className="text-zinc-500">SL: <span className="text-zinc-400">{formatPrice(t.stopLoss)}</span></span>
                            <span className="text-zinc-500">TP: <span className="text-zinc-400">{formatPrice(t.takeProfit)}</span></span>
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-[10.5px]">
                        <div className="leading-snug">
                          <span className="text-[9px] text-zinc-500 block">Entry: {formatPrice(t.entryPrice)}</span>
                          <span className="text-zinc-350 block">Exit: {formatPrice(t.exitPrice)}</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold inline-block font-mono ${
                          t.closeReason === "TP3_HIT"
                            ? "bg-emerald-950/60 border border-emerald-500/50 text-emerald-400"
                            : t.closeReason.startsWith("TP_TRAIL")
                            ? "bg-emerald-900/30 border border-emerald-500/20 text-emerald-300"
                            : t.closeReason === "SL"
                            ? "bg-rose-955 bg-rose-950/55 border border-rose-500/40 text-rose-400"
                            : "bg-zinc-900 border border-zinc-800 text-zinc-400"
                        }`}>
                          {t.closeReason}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right font-mono">
                        <div className="leading-tight">
                          <span className={`font-black font-semibold text-[10.5px] block ${isProf ? "text-emerald-400" : "text-rose-455 text-rose-400"}`}>
                            {isProf ? "+" : ""}${t.pnl}
                          </span>
                          <span className={`text-[8.5px] font-bold block ${isProf ? "text-emerald-500" : "text-rose-500"}`}>
                            {isProf ? "+" : ""}{t.pnlPercentage}% ({pipsFormatted})
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
