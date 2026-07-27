import React, { useState } from "react";
import { SymbolType } from "../types";
import { X, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { VisualToggle } from "./VisualToggle";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbols: SymbolType[];
  currentPrices: Record<SymbolType, number>;
  onExecute: (tradeData: {
    symbol: SymbolType;
    type: "BUY" | "SELL";
    size: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => Promise<void>;
  isCapitalConsumed?: boolean;
  defaultLotSize?: number;
  config?: any;
}

export default function TradeModal({ isOpen, onClose, symbols, currentPrices, onExecute, isCapitalConsumed, defaultLotSize, config }: TradeModalProps) {
  const [symbol, setSymbol] = useState<SymbolType>(symbols[0] || "BTCUSD");
  const [type, setType] = useState<"BUY" | "SELL">("BUY");
  const [size, setSize] = useState<number>(defaultLotSize || 0.1);
  const [useSL, setUseSL] = useState<boolean>(false);
  const [stopLoss, setStopLoss] = useState<string>("");
  const [useTP, setUseTP] = useState<boolean>(false);
  const [takeProfit, setTakeProfit] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [confluenceScore, setConfluenceScore] = useState<number | null>(null);
  const [scoreLoading, setScoreLoading] = useState<boolean>(false);

  const activePrice = currentPrices[symbol] || 0;

  // Fetch the confluence score in real-time on symbol/type/open changes
  React.useEffect(() => {
    if (!isOpen) return;
    setScoreLoading(true);
    fetch(`/api/trade/confluence-score?symbol=${symbol}&type=${type}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.score === "number") {
          setConfluenceScore(data.score);
        } else {
          setConfluenceScore(75); // fallback
        }
        setScoreLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching confluence score:", err);
        setConfluenceScore(75); // fallback
        setScoreLoading(false);
      });
  }, [isOpen, symbol, type]);

  // Helper to calculate target position sizing in react
  const getCalculatedSizing = (): { lots: number; explanation: string; mode: "PERCENT" | "FIXED" } => {
    if (config && config.riskMode === "PERCENT") {
      const capital = config.balance || 1000;
      const riskPercent = config.riskPerTrade || 1.0;
      const riskAmount = capital * (riskPercent / 100);
      
      const slNum = useSL && stopLoss ? parseFloat(stopLoss) : 0;
      let slDistance = 0;
      if (slNum > 0 && activePrice > 0) {
        slDistance = Math.abs(activePrice - slNum);
      }
      
      // Default to 1.5% distance estimate if SL is not checked or is empty
      const isDefaultSl = !slDistance || slDistance === 0;
      if (isDefaultSl) {
        slDistance = activePrice * 0.015;
      }
      
      // Symbol multiplier math
      const sym = (symbol || "").toUpperCase();
      let pipMultiplier = 100;
      let dollarMultiplier = 1.0;
      
      if (sym.includes("USD") && (sym.startsWith("EUR") || sym.startsWith("GBP") || sym.startsWith("AUD"))) {
        pipMultiplier = 10000;
        dollarMultiplier = 10.0;
      } else if (sym.includes("JPY")) {
        pipMultiplier = 100;
         dollarMultiplier = 10.0;
      } else if (sym.startsWith("XAU")) {
        pipMultiplier = 100;
        dollarMultiplier = 1.0;
      } else if (sym.startsWith("XAG")) {
        pipMultiplier = 100;
        dollarMultiplier = 10.0;
      } else if (sym.startsWith("BTC") || sym.startsWith("ETH") || sym.startsWith("SOL") || sym.startsWith("BNB")) {
        pipMultiplier = 100;
        dollarMultiplier = 0.01;
      } else if (sym === "AAPL" || sym === "TSLA" || sym === "MSFT" || sym === "NVDA") {
        pipMultiplier = 100;
        dollarMultiplier = 1.0;
      }
      
      const riskPerLot = slDistance * pipMultiplier * dollarMultiplier;
      if (riskPerLot > 0) {
        const calculatedLots = riskAmount / riskPerLot;
        const finalLots = Math.max(0.01, Math.min(50.0, Number(calculatedLots.toFixed(2))));
        
        const slPoints = (slDistance * (sym.includes("USD") && !sym.startsWith("XAU") && !sym.startsWith("BTC") ? 10000 : 100)).toFixed(0);
        return {
          lots: finalLots,
          explanation: `Sized for ${riskPercent}% risk of $${capital.toLocaleString()} (${isDefaultSl ? "using default" : "custom"} ~${slPoints} pip SL distance of $${riskAmount.toFixed(2)})`,
          mode: "PERCENT"
        };
      }
    }
    
    return {
      lots: defaultLotSize || 0.1,
      explanation: "Using Fixed Contracts sizing mode configured in Equity settings.",
      mode: "FIXED"
    };
  };

  const sizingResult = getCalculatedSizing();

  // Sync size automatically if sizingResult.lots changes and we are in percent mode
  React.useEffect(() => {
    if (config && config.riskMode === "PERCENT") {
      setSize(sizingResult.lots);
    }
  }, [sizingResult.lots, config?.riskMode]);

  // Sync state whenever modal is opened
  React.useEffect(() => {
    if (isOpen) {
      setError(null);
      if (config && config.riskMode === "PERCENT") {
        setSize(sizingResult.lots);
      } else {
        setSize(defaultLotSize || 0.1);
      }
    }
  }, [isOpen, defaultLotSize, config?.riskMode, sizingResult.lots]);

  if (!isOpen) return null;

  const presetSize = (val: number) => {
    setSize(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCapitalConsumed) {
      setError("Trading is locked. Capital allocated has been fully consumed by negative net changes.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onExecute({
        symbol,
        type,
        size,
        stopLoss: useSL && stopLoss ? parseFloat(stopLoss) : undefined,
        takeProfit: useTP && takeProfit ? parseFloat(takeProfit) : undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to execute trade order. Please check that connection and balance are ready.");
    } finally {
      setLoading(false);
    }
  };

  // Preset Stop Loss / Take Profit estimations based on market prices
  const handleSetPresetSLTP = (targetType: "BUY" | "SELL") => {
    const slPct = symbol === "BTCUSD" ? 0.015 : symbol === "XAUUSD" ? 0.01 : 0.003;
    const offset = activePrice * slPct;
    if (targetType === "BUY") {
      setStopLoss((activePrice - offset).toFixed(symbol === "EURUSD" || symbol === "GBPUSD" ? 4 : 2));
      setTakeProfit((activePrice + offset * 2).toFixed(symbol === "EURUSD" || symbol === "GBPUSD" ? 4 : 2));
    } else {
      setStopLoss((activePrice + offset).toFixed(symbol === "EURUSD" || symbol === "GBPUSD" ? 4 : 2));
      setTakeProfit((activePrice - offset * 2).toFixed(symbol === "EURUSD" || symbol === "GBPUSD" ? 4 : 2));
    }
    setUseSL(true);
    setUseTP(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200 z-10 cursor-pointer"
          id="btn-close-trade-modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2 mb-4">
          <div className="rounded-lg bg-green-500/10 p-1.5 text-green-500">
            <DollarSign className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-white">Execute Action Placement</h3>
            <p className="text-[11px] text-zinc-400">Place an order directly linked to MT5 bridging protocol.</p>
          </div>
        </div>

        {/* Capital Limit Warning */}
        {isCapitalConsumed && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5 text-[11px] text-rose-400 font-mono leading-relaxed space-y-0.5 mb-3">
            <span className="font-bold block uppercase text-[9px] tracking-widest text-rose-500">⚠️ Trading Suspended</span>
            Allocated capital has been fully consumed by negative net changes. Manual executions are locked.
          </div>
        )}

        {/* Dynamic Error Messaging inside Modal */}
        {error && (
          <div className="rounded-lg border border-rose-900/50 bg-rose-950/30 p-2.5 text-[11px] text-rose-400 font-sans tracking-wide leading-relaxed mb-3">
            <strong className="block text-rose-300 font-semibold mb-0.5">Execution Rejected:</strong>
            {error}
          </div>
        )}

        {/* High-density, compact form requiring zero scrolling */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          
          {/* Grid Level 1: Symbol Selecting + Buy/Sell Action side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Symbol Select Column */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Symbol Asset</label>
              </div>
              <select
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value as SymbolType);
                  setUseSL(false);
                  setUseTP(false);
                }}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 font-mono text-xs text-white focus:border-zinc-650 focus:outline-hidden cursor-pointer"
              >
                {symbols.map((sym) => (
                  <option key={sym} value={sym}>
                    {sym}
                  </option>
                ))}
              </select>
              <div className="mt-1 text-right text-[10px] font-mono text-zinc-400">
                Est: <span className="text-zinc-200">${activePrice.toLocaleString(undefined, { minimumFractionDigits: symbol === "EURUSD" || symbol === "GBPUSD" ? 4 : 2 })}</span>
              </div>
            </div>

            {/* Action Side Column */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Action Side</label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setType("BUY");
                    handleSetPresetSLTP("BUY");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    type === "BUY"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20 shadow-xs border border-emerald-500"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <TrendingUp className="h-3.5 w-3.5" />
                  BUY / LONG
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("SELL");
                    handleSetPresetSLTP("SELL");
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer ${
                    type === "SELL"
                      ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/20 shadow-xs border border-rose-500"
                      : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800"
                  }`}
                >
                  <TrendingDown className="h-3.5 w-3.5" />
                  SELL / SHORT
                </button>
              </div>
            </div>
          </div>

          {/* Grid Level 2: Sizing / Volume & Sizing protocol side-by-side */}
          <div className="grid grid-cols-2 gap-4">
            
            {/* Lots Sizing Column */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Volume (Lots)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max="50.0"
                value={size}
                onChange={(e) => setSize(parseFloat(e.target.value) || 0.1)}
                className="w-full rounded-lg border px-3 py-1.5 font-mono text-xs text-white focus:outline-hidden bg-zinc-900 border-zinc-800 focus:border-zinc-650"
                required
              />
              <div className="flex gap-1.5 mt-1.5">
                {[0.1, 0.5, 1.0, 5.0].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => presetSize(v)}
                    className="flex-1 py-0.5 text-[9px] font-mono rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer text-center"
                  >
                    {v}L
                  </button>
                ))}
              </div>
            </div>

            {/* Sizing protocol Info Box */}
            <div className="flex flex-col justify-between">
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">Target Strategy Sizing</label>
              <div className="flex-1 p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-850/50 flex flex-col justify-center">
                <div className="text-[10px] font-mono leading-relaxed">
                  <span className={sizingResult.mode === "PERCENT" ? "text-cyan-400 font-bold" : "text-zinc-500 font-medium"}>
                    {sizingResult.mode === "PERCENT" ? "📐 AUTOMATIC: " : "🛡️ FIXED: "}
                  </span>
                  <span className="text-zinc-400">{sizingResult.explanation}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Risk Controls (SL & TP side-by-side) */}
          <div className="border-t border-zinc-900 pt-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Risk Controls</span>
              {(useSL || useTP || stopLoss || takeProfit) && (
                <button
                  type="button"
                  onClick={() => {
                    setStopLoss("");
                    setTakeProfit("");
                    setUseSL(false);
                    setUseTP(false);
                  }}
                  className="text-[9px] font-bold text-rose-400 hover:text-rose-300 uppercase tracking-widest cursor-pointer hover:underline transition-all"
                >
                  Clear all exit targets
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Column 1: Stop Loss (SL) */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400">Stop Loss (SL)</span>
                  <VisualToggle
                    checked={useSL}
                    onChange={setUseSL}
                    size="sm"
                  />
                </div>
                {useSL ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="SL Price"
                      value={stopLoss}
                      onChange={(e) => setStopLoss(e.target.value)}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 pl-2 pr-12 py-1 font-mono text-[11px] text-white focus:border-zinc-700 focus:outline-hidden"
                      required
                    />
                    {stopLoss && (
                      <button
                        type="button"
                        onClick={() => setStopLoss("")}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors"
                      >
                        CLR
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] text-zinc-500 italic font-mono py-1">No Stop Loss active</div>
                )}
              </div>

              {/* Column 2: Take Profit (TP) */}
              <div className="space-y-1.5 p-2.5 rounded-lg bg-zinc-900/30 border border-zinc-900">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-zinc-400">Take Profit (TP)</span>
                  <VisualToggle
                    checked={useTP}
                    onChange={setUseTP}
                    size="sm"
                  />
                </div>
                {useTP ? (
                  <div className="relative">
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="TP Price"
                      value={takeProfit}
                      onChange={(e) => setTakeProfit(e.target.value)}
                      className="w-full rounded-md border border-zinc-800 bg-zinc-950 pl-2 pr-12 py-1 font-mono text-[11px] text-white focus:border-zinc-700 focus:outline-hidden"
                      required
                    />
                    {takeProfit && (
                      <button
                        type="button"
                        onClick={() => setTakeProfit("")}
                        className="absolute right-1 top-1/2 -translate-y-1/2 text-[8px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 hover:text-white px-1.5 py-0.5 rounded font-mono cursor-pointer transition-colors"
                      >
                        CLR
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="text-[9px] text-zinc-500 italic font-mono py-1">No Take Profit active</div>
                )}
              </div>
            </div>
          </div>

          {/* Action Execution Submit (Always fully visible!) */}
          <button
            type="submit"
            disabled={loading || size <= 0 || isCapitalConsumed}
            className={`w-full py-2.5 px-4 font-display font-bold text-xs rounded-lg transition-all ${
              isCapitalConsumed
                ? "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                : type === "BUY"
                ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer hover:shadow-lg hover:shadow-emerald-950/25 active:scale-98"
                : "bg-rose-600 hover:bg-rose-500 text-white cursor-pointer hover:shadow-lg hover:shadow-rose-950/25 active:scale-98"
            }`}
          >
            {isCapitalConsumed
              ? "🔒 EXECUTE LOCKED - RISK LIMIT HIT"
              : loading
              ? "Sending bridged order..."
              : `EXECUTE simulated ${type} ORDER`}
          </button>
        </form>
      </div>
    </div>
  );
}
