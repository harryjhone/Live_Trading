import React, { useState } from "react";
import { Lock, Sparkles, Mail, CreditCard, ArrowRight, ChevronUp, ChevronDown, CheckCircle } from "lucide-react";

interface SectionUpgradeOverlayProps {
  sectionName: string;
  onGoToBilling?: () => void;
}

export default function SectionUpgradeOverlay({ sectionName, onGoToBilling }: SectionUpgradeOverlayProps) {
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  const getSectionDetails = (name: string) => {
    switch (name) {
      case "Signals":
        return {
          title: "Algorithmic Trade Signals & Triggers",
          desc: "Unlock real-time high-execution model triggers, automated pattern matching indices, and Telegram bot alert webhooks.",
          features: ["Sub-second ticker execution checks", "AI setup validation scoring", "Detailed trade exclusion reason logs"]
        };
      case "Trades":
        return {
          title: "Active Positions & Advanced Metrics Suite",
          desc: "Track active trades with live MFE/MAE ratio analyses, historic ledger metrics, and custom trailing-stop calibrations.",
          features: ["Real-time visual PnL charts", "Advanced drawdown safety metrics", "Historical trade report exporter"]
        };
      case "Journal":
        return {
          title: "Dynamic Analytical Trade Journal",
          desc: "Chronicle every setup with high-contrast ledger notes, custom filterable market tags, and AI-driven behavior scores.",
          features: ["Behavioral slip-cost analysis", "Custom tagging & tagging-matrix charts", "Editable notes with local auto-save"]
        };
      case "Notifications":
        return {
          title: "Instant Telegram Alert Streams",
          desc: "Mirror system outputs directly to your personal or group Telegram channel instantly with full JSON/payload configurations.",
          features: ["Instant socket heartbeat streams", "Dynamic channel ID targeting", "System trace diagnostic telemetry logs"]
        };
      case "Strategies":
        return {
          title: "Quantitative Model Calibration Control",
          desc: "Activate or adjust live algorithmic trading strategies (e.g., Hybrid EMA Cross, MWDX, ATR Pullbacks) with strict mathematical rules.",
          features: ["Custom margin & drawdown ceilings", "Leverage size multipliers", "Real-time AI parameter optimizations"]
        };
      case "Timeframe Analysis":
        return {
          title: "Technical Multi-Timeframe Charts",
          desc: "Visualize raw ticker data with integrated oscillators (RSI, MACD), moving averages, and adjustable candle resolution bars.",
          features: ["Smooth HTML5 canvases & state managers", "Live historical bid/ask order flows", "Interactive zone markers & custom ATR levels"]
        };
      case "News Calendar":
        return {
          title: "Macro Event Streams & AI News Sentiment",
          desc: "Receive fast macro economic data releases paired with real-time news articles parsed using advanced LLM sentiment engines.",
          features: ["AI positive/neutral/negative ratings", "Dynamic impact levels (High/Medium)", "Direct connection to trading trigger blockers"]
        };
      case "System Updates":
        return {
          title: "Terminal Core Logs & Git Analytics",
          desc: "Access low-level system iteration states, repository patch histories, and detailed git commitment indexes for debugging.",
          features: ["Full repository file tree inspection", "Live execution stack trace", "Developer build patch notes"]
        };
      default:
        return {
          title: `Premium Multi-Asset ${name} Module`,
          desc: "Unlock proprietary quantitative terminal features, live MT5 connections, and secure API cloud execution mirrors.",
          features: ["High-speed server mirroring pipelines", "Premium dashboard indicators", "Dedicated institutional support chat"]
        };
    }
  };

  const details = getSectionDetails(sectionName);

  return (
    <div className="w-full h-full min-h-[500px] flex items-center justify-center p-4 sm:p-12 animate-fadeIn" id="section-upgrade-overlay">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-200/10 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-12 text-center space-y-8 relative overflow-hidden shadow-2xl backdrop-blur-sm dark:bg-zinc-950/45">
        
        {/* Glow ambient background spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-500/5 dark:bg-amber-600/5 rounded-full blur-3xl pointer-events-none" />

        {/* Lock indicator with sparkles */}
        <div className="mx-auto h-20 w-20 bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center rounded-2xl relative shadow-inner group">
          <Lock className="h-9 w-9 text-amber-400 group-hover:scale-110 transition-transform duration-300" />
          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-amber-500 rounded-full border-2 border-slate-900 animate-pulse" />
        </div>

        {/* Heading section */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold tracking-widest uppercase font-mono">
            <Sparkles className="h-3 w-3" />
            Plan Upgrade Required
          </div>
          <h3 className="text-xl sm:text-3xl font-display font-black uppercase tracking-tight text-slate-900 dark:text-zinc-50">
            {details.title}
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            {details.desc}
          </p>
        </div>

        {/* Premium items checklist */}
        <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 rounded-xl p-5 text-left max-w-md mx-auto space-y-3">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-zinc-400 font-mono block">Included in Higher-Tier Packages:</span>
          <div className="space-y-2">
            {details.features.map((feat, i) => (
              <div key={i} className="flex items-start gap-2.5 text-xs text-slate-705 dark:text-zinc-300">
                <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action button triggers */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onGoToBilling && (
            <button
              onClick={onGoToBilling}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CreditCard className="h-4 w-4" />
              <span>UPGRADE SUBSCRIPTION TIER</span>
              <ArrowRight className="h-3.5 w-3.5 animate-bounce-horizontal" />
            </button>
          )}

          <button
            onClick={() => setShowRequestAccess(!showRequestAccess)}
            className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-805 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Ask Administrator</span>
            {showRequestAccess ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
          </button>
        </div>

        {/* Temporary Authorization panel */}
        {showRequestAccess && (
          <div className="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/80 text-left space-y-2.5 max-w-md mx-auto animate-slideDown">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-600 dark:text-amber-500 flex items-center gap-1.5 font-mono">
              <Mail className="h-3.5 w-3.5" />
              Direct Support & Authorization
            </span>
            <div className="text-xs text-slate-705 dark:text-zinc-300 font-medium space-y-2 leading-relaxed">
              <p className="font-bold text-slate-800 dark:text-white">Request exceptional sandbox/beta-access:</p>
              <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-800 dark:text-zinc-100 flex items-center justify-between">
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">billing@quant-terminal.ai</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Support Code</span>
              </div>
              <p className="text-zinc-500 text-[11px]">
                Mention your active Tenant UID in the subject line to expedite whitelisting.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
