import React, { useState } from "react";
import { FullAppState, SymbolType } from "../types";
import { Layers, Activity, ShieldAlert, BadgeInfo } from "lucide-react";

interface MTFAnalysisViewProps {
  state: FullAppState;
  activeSubMenu?: "all" | "matrix" | "inspector";
  onSwitchSubMenu?: (tab: "all" | "matrix" | "inspector") => void;
}

type TimeframeType = "M5" | "M15" | "H1" | "H4" | "D1";

export default function MTFAnalysisView({ state, activeSubMenu, onSwitchSubMenu }: MTFAnalysisViewProps) {
  const symbols = (Object.keys(state.marketData) as SymbolType[]);
  const timeframes: TimeframeType[] = ["M5", "M15", "H1", "H4", "D1"];

  const [selectedAsset, setSelectedAsset] = useState<SymbolType>(() => {
    return symbols[0] || "BTCUSD";
  });

  // Helper to generate complex, consistent MTF trend signals
  const getMTFTrend = (sym: SymbolType, tf: TimeframeType): {
    trend: "BULLISH" | "BEARISH" | "CONSOLIDATING";
    strength: number; // percentage
    rsi: number;
    volume: string;
  } => {
    const asset = state.marketData[sym];
    const price = asset ? asset.currentPrice : 100;

    // Use a hash formula from the symbol name + timeframe characters to make sure the trend state is persistent but slightly varying
    const hash = sym ? (sym.charCodeAt(0) + (sym.charCodeAt(1) || 0) + tf.charCodeAt(1)) : 100;
    
    let rsi = 50 + (hash % 26) - 13;
    if (tf === "M5") rsi += (price % 5) - 2.5;
    if (tf === "H1") rsi -= (price % 7) - 3.5;
    
    rsi = Math.min(Math.max(Number(rsi.toFixed(1)), 15), 85);

    let trend: "BULLISH" | "BEARISH" | "CONSOLIDATING";
    let strength = 30 + (hash % 55);

    if (rsi > 60) {
      trend = "BULLISH";
    } else if (rsi < 40) {
      trend = "BEARISH";
    } else {
      trend = "CONSOLIDATING";
      strength = 10 + (hash % 15);
    }

    const volSeed = (hash * 123) % 900;
    const volume = `${(volSeed + 100).toFixed(0)}K`;

    return { trend, strength, rsi, volume };
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-900 pb-4">
        <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <Layers className="h-5 w-5 text-emerald-500" />
          Multi-Timeframe Trend Matrix (MTF Heatmap)
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Observe multi-interval trend correlation. Successful quants open positions when short-term M5 charts align with D1 charts.
        </p>
      </div>

      {/* Main MTF grid heat map */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 overflow-hidden p-5 space-y-4">
        <span className="text-xs font-semibold text-zinc-300">Live Multi-Timeframe Alignment Map</span>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-900 font-display text-xs text-zinc-400">
                <th className="py-3.5 px-4 font-bold">Trading Symbol</th>
                {timeframes.map((tf) => (
                  <th key={tf} className="py-3.5 px-4 text-center font-bold">
                    {tf} Level
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900 font-mono text-xs">
              {symbols.map((sym) => {
                const asset = state.marketData[sym];
                return (
                  <tr key={sym} className="hover:bg-zinc-900/10 transition-colors">
                    <td className="py-4 px-4 font-sans">
                      <div className="flex flex-col">
                        <span className="font-mono font-black text-white text-sm">{sym}</span>
                        <span className="text-[10px] text-zinc-500">{asset.fullName}</span>
                      </div>
                    </td>

                    {timeframes.map((tf) => {
                      const analysis = getMTFTrend(sym, tf);
                      return (
                        <td key={tf} className="py-4 px-2 text-center">
                          <button
                            onClick={() => setSelectedAsset(sym)}
                            className={`w-full max-w-[110px] mx-auto py-2.5 px-2.5 rounded-lg border text-left flex flex-col justify-between transition-all hover:scale-102 cursor-pointer ${
                              analysis.trend === "BULLISH"
                                ? "bg-emerald-500/5 hover:bg-emerald-500/15 border-emerald-950/40 text-emerald-400"
                                : analysis.trend === "BEARISH"
                                  ? "bg-rose-500/5 hover:bg-rose-500/15 border-rose-950/40 text-rose-400"
                                  : "bg-zinc-900/20 border-zinc-900 hover:border-zinc-800 text-zinc-400"
                            }`}
                          >
                            <span className="text-[10px] uppercase font-bold tracking-wider leading-none">
                              {analysis.trend}
                            </span>
                            <div className="flex items-center justify-between text-[9px] text-zinc-500 mt-2 leading-none w-full">
                              <span>RSI: {analysis.rsi}</span>
                              <span className="font-bold text-zinc-400">{analysis.strength}%</span>
                            </div>
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected symbol detailed MTF inspector */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-3.5 border-b md:border-b-0 md:border-r border-zinc-900 pb-4 md:pb-0 md:pr-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold uppercase tracking-wider mb-1">
              <Activity className="h-4 w-4" /> Multi-Timeframe Inspector
            </div>
            <h4 className="font-display text-base font-bold text-white mb-2">
              Core Trend Analysis: {selectedAsset}
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              Currently reviewing timeframe alignment indicators for <span className="text-white font-bold">{state.marketData[selectedAsset]?.fullName}</span>. 
              Review the detailed breakdown chart for target risk setups.
            </p>
          </div>

          <div className="rounded-lg border border-zinc-900 bg-zinc-900/10 p-3 flex items-start gap-2.5">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-450 text-zinc-500 font-sans leading-normal">
              <strong>Risk Warning:</strong> When MTF segments diverge (e.g., M15 Bullish, Daily Bearish), market structures are ranging. Refrain from heavy position sizing.
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-3">
          <span className="text-xs font-semibold text-zinc-300 block">Current Interval Breakdown ({selectedAsset})</span>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {timeframes.map((tf) => {
              const analysis = getMTFTrend(selectedAsset, tf);
              return (
                <div key={tf} className="rounded-lg border border-zinc-900 bg-zinc-950 p-3.5 space-y-2">
                  <div className="flex items-center justify-between leading-none">
                    <span className="font-display text-xs font-bold text-white">{tf}</span>
                    <span className={`inline-block h-2 w-2 rounded-full ${
                      analysis.trend === "BULLISH" ? "bg-emerald-400 animate-pulse" : analysis.trend === "BEARISH" ? "bg-rose-400 animate-pulse" : "bg-zinc-650 bg-zinc-600"
                    }`} />
                  </div>
                  
                  <div className="space-y-1 mt-2.5">
                    <span className={`text-[10px] font-bold block ${
                      analysis.trend === "BULLISH" ? "text-emerald-400" : analysis.trend === "BEARISH" ? "text-rose-400" : "text-zinc-400"
                    }`}>
                      {analysis.trend}
                    </span>
                    <div className="text-[9px] text-zinc-500 space-y-0.5">
                      <div>Strength: <strong className="text-zinc-350">{analysis.strength}%</strong></div>
                      <div>RSI: <strong className="text-zinc-350">{analysis.rsi}</strong></div>
                      <div>Volume: <strong className="text-zinc-350">{analysis.volume}</strong></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
