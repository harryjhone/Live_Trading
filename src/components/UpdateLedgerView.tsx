import React, { useState, useMemo } from "react";
import { 
  GitBranch, 
  Search, 
  Calendar, 
  ShieldAlert, 
  Cpu, 
  RotateCcw,
  CheckCircle2, 
  Layers, 
  Smartphone, 
  Sparkles, 
  Sliders, 
  Activity,
  History,
  Info
} from "lucide-react";
import { FullAppState } from "../types";

interface LedgerItem {
  version: string;
  date: string;
  title: string;
  type: "major" | "optimization" | "security" | "uiux" | "integration";
  badge: "Stable" | "Active" | "Core" | "Optimized";
  description: string;
  changes: string[];
  impactRating: "High Impact" | "Medium Impact" | "Standard";
}

interface UpdateLedgerViewProps {
  state: FullAppState;
}

export default function UpdateLedgerView({ state }: UpdateLedgerViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  const ledgerData: LedgerItem[] = [
    {
      version: "v1.4.2",
      date: "2026-05-27",
      title: "Realized P&L Sync & Risk Metric Clarification",
      type: "uiux",
      badge: "Stable",
      impactRating: "High Impact",
      description: "Resolved dashboard KPI confusion by isolating settled, closed P&L from live floating risk, and upgrading the protective drawdown tracker.",
      changes: [
        "Separated Realized P&L (Settle Buffer) from open floating transactions to avoid displaying negative values during overall net profit periods.",
        "Engineered drawdown limit calculation to combine both realized loss buffers and open risk metrics for enhanced protection.",
        "Normalized account equity displays to dynamically update alongside true asset valuations.",
        "Refinement of the main panel labels and description titles for higher professional clarity."
      ]
    },
    {
      version: "v1.4.1",
      date: "2026-05-26",
      title: "Micro-Interval Clock Blackout Shield",
      type: "optimization",
      badge: "Optimized",
      impactRating: "High Impact",
      description: "Implemented an hour-targeted execution freeze rule, moving away from blanket trading session locks to elevate terminal capability.",
      changes: [
        "Replaced blanket session freeze triggers with tight hourly blackout bans (e.g., ins-hour-halt-X).",
        "Configured backtesters to automatically detect the individual hour with the highest leakage rate and isolate it.",
        "Prevented trade operations exclusively during designated high-leak clock intervals without locking out the remaining session windows."
      ]
    },
    {
      version: "v1.4.0",
      date: "2026-05-25",
      title: "Mathematical Expectancy Optimization Suite",
      type: "optimization",
      badge: "Active",
      impactRating: "High Impact",
      description: "Introduced advanced mathematical triggers to fine-tune entry and exit parameters on automated strategy triggers.",
      changes: [
        "Added 'Adaptive Pullback Entry Buffer', placing a 0.15% offset superior entry limit on execution logic to prevent chasing breakouts.",
        "Developed 'Dynamic Adaptive SL/TP Multiple' deploying a 1.5x / 3.2x ATR custom limit channel respectively to align with volatility.",
        "Integrated live optimization message logs in the MT5 status logs panel when trigger-matching overrides are completed."
      ]
    },
    {
      version: "v1.3.5",
      date: "2026-05-23",
      title: "Gatekeeper Security Protocol",
      type: "security",
      badge: "Stable",
      impactRating: "Medium Impact",
      description: "Secure cryptographic protection client layer preventing unauthenticated workspace views from seeing live floating setups.",
      changes: [
        "Enforced system gate via PasswordGateView component on server checkouts.",
        "Encrypted sandbox local credentials storage to preserve session variables between page intervals.",
        "Prevented accidental order exposure in multi-seat viewing environments."
      ]
    },
    {
      version: "v1.3.0",
      date: "2026-05-22",
      title: "Expert Advisor (EA) MT5 Direct Bridge",
      type: "integration",
      badge: "Core",
      impactRating: "High Impact",
      description: "Completed bridging handlers allowing simulated orders to sync directly with MetaTrader 5 demo and Live-risk terminals.",
      changes: [
        "Designed local socket bridges mapping execution parameters between Node backend environments and standard EA scripts.",
        "Constructed MT5 status reporting charts covering connected logs, tick count metrics, and system port bindings."
      ]
    },
    {
      version: "v1.2.0",
      date: "2026-05-20",
      title: "Multi-Timeframe Heatmap Matrix",
      type: "uiux",
      badge: "Stable",
      impactRating: "Medium Impact",
      description: "Engineered multi-timeframe metric layers for visual indicators to guide manual trading setups.",
      changes: [
        "Created background calculators assessing EMA, MACD, and RSI across M15, H1, H4, and D1 scopes.",
        "Built responsive color grids mapping momentum directions to assist user trend assessments."
      ]
    },
    {
      version: "v1.1.0",
      date: "2026-05-19",
      title: "AI-Powered Calendar Audit",
      type: "major",
      badge: "Core",
      impactRating: "Medium Impact",
      description: "Linked active Google Generative AI components to automatically analyze upcoming economic indicators.",
      changes: [
        "Integrated the latest @google/genai SDK to proxy sentiment ratings server-side.",
        "Programmed impact parsers summarizing high-risk economic intervals to safeguard active open positions."
      ]
    },
    {
      version: "v1.0.0",
      date: "2026-05-18",
      title: "Base Alpha Platform Genesis",
      type: "major",
      badge: "Core",
      impactRating: "Standard",
      description: "Stabilized the underlying core code-stack supporting multi-strategy, balance charts, and live tick simulations.",
      changes: [
        "Deployed core tick emulator engine with basic simulated instruments (EURUSD, BTCUSD, XAUUSD).",
        "Wrote initial statistical trackers compiling win rates, average trade lengths, and mock Telegram notifications.",
        "Wrote structural local backup/restore functions utilizing local storage arrays."
      ]
    }
  ];

  // Statistics
  const stats = useMemo(() => {
    const totalReleases = ledgerData.length;
    let counts = { major: 0, optimization: 0, security: 0, uiux: 0, integration: 0 };
    ledgerData.forEach(item => {
      counts[item.type] = (counts[item.type] || 0) + 1;
    });

    // Check currently active optimizations according to full app state config
    const activeOpts = (state?.config as any)?.activeOptimizations || {};
    const appliedCount = Object.keys(activeOpts).filter(k => activeOpts[k] === true).length;

    return {
      total: totalReleases,
      counts,
      activeOptimizationsApplied: appliedCount,
      lastUpdated: ledgerData[0].date
    };
  }, [state]);

  // Filter and Search logic
  const filteredLedgers = useMemo(() => {
    return ledgerData.filter(item => {
      const matchesSearch = 
        item.version.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.changes.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesType = selectedType === "all" || item.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [searchQuery, selectedType]);

  const getTypeStyles = (type: string) => {
    switch (type) {
      case "major":
        return { text: "text-purple-400 bg-purple-500/10 border-purple-500/20", label: "Major Release" };
      case "optimization":
        return { text: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", label: "Logic Peak" };
      case "security":
        return { text: "text-rose-450 text-rose-400 bg-rose-500/10 border-rose-500/20", label: "Security & Guard" };
      case "uiux":
        return { text: "text-sky-400 bg-sky-500/10 border-sky-500/20", label: "UI/UX Fidelity" };
      case "integration":
        return { text: "text-amber-400 bg-amber-500/10 border-amber-500/20", label: "MT5 Protocol" };
      default:
        return { text: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20", label: "Patch" };
    }
  };

  const cleanQuery = () => setSearchQuery("");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="border-b border-zinc-900 pb-4 select-none">
        <h3 className="font-display text-lg font-black text-white flex items-center gap-2 tracking-wider uppercase">
          <GitBranch className="h-5 w-5 text-emerald-500" />
          System Evolution Ledger
        </h3>
        <p className="text-xs text-zinc-450 mt-1 font-sans">
          Track release histories, core algo upgrades, compliance patch intervals, and mathematical optimization logs.
        </p>
      </div>

      {/* Release Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 select-none">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Activity className="h-3 w-3 text-emerald-400" /> Terminal Evolution
          </div>
          <div className="font-mono text-2xl font-black text-white">{stats.total} Builds</div>
          <p className="text-[10px] text-zinc-400 mt-1">Calibrated from base genesis</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Sliders className="h-3 w-3 text-sky-400" /> Logic Upgrades
          </div>
          <div className="font-mono text-2xl font-black text-emerald-400">{stats.counts.optimization} Active</div>
          <p className="text-[10px] text-zinc-400 mt-1">Core math expectancy engines</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Cpu className="h-3 w-3 text-purple-400" /> Deployed Optimizers
          </div>
          <div className="font-mono text-2xl font-black text-amber-400">
            {stats.activeOptimizationsApplied} / 3 Enabled
          </div>
          <p className="text-[10px] text-zinc-400 mt-1">Managed during session runs</p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
            <Calendar className="h-3 w-3 text-indigo-400" /> Ledger Audited
          </div>
          <div className="font-mono text-base font-black text-zinc-350 pt-1.5">{stats.lastUpdated}</div>
          <p className="text-[10px] text-zinc-400 mt-1">UTC synchronization status</p>
        </div>
      </div>

      {/* Filter and Query controls */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Search version release, changes, or features..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/60 border border-zinc-900 rounded-lg pl-9 pr-8 py-2 text-xs font-medium text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/80 transition"
          />
          {searchQuery && (
            <button 
              onClick={cleanQuery}
              className="absolute right-3 top-2.5 text-zinc-500 hover:text-zinc-350 font-mono text-[10px] leading-none"
            >
              CLEAR
            </button>
          )}
        </div>

        {/* Filter categories */}
        <div className="flex gap-1.5 flex-wrap overflow-x-auto pb-1 max-w-full">
          {[
            { id: "all", label: "All Logs" },
            { id: "major", label: "Core Releases" },
            { id: "optimization", label: "Algorithms" },
            { id: "security", label: "Security & Safety" },
            { id: "uiux", label: "Interface Upgrades" },
            { id: "integration", label: "MT5 Bridge" }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-3 py-2 rounded-lg text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
                selectedType === type.id
                  ? "!bg-slate-900 border-slate-700 !text-white dark:!bg-zinc-100 dark:border-zinc-200 dark:!text-zinc-950 font-extrabold"
                  : "bg-zinc-50 dark:bg-zinc-950/20 border-zinc-200 dark:border-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-900/30"
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Section */}
      <div className="relative border-l border-zinc-900/60 ml-3.5 pl-6 pt-2 space-y-8">
        {filteredLedgers.length > 0 ? (
          filteredLedgers.map((item, index) => {
            const styles = getTypeStyles(item.type);
            const isLatest = index === 0 && searchQuery === "" && selectedType === "all";

            return (
              <div key={item.version} className="relative group/timeline transition duration-300">
                {/* Visual Connector Dot */}
                <div className={`absolute -left-[31px] top-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition duration-300 bg-zinc-950 ${
                  isLatest 
                    ? "border-emerald-500 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse" 
                    : "border-zinc-800 text-zinc-500 group-hover/timeline:border-zinc-650"
                }`}>
                  <History className="h-2.5 w-2.5" />
                </div>

                {/* Ledger Log Box */}
                <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5 space-y-3 hover:border-zinc-850 hover:bg-zinc-950/40 transition duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2 border-b border-zinc-900/50">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-mono text-sm font-black text-zinc-150 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 select-all leading-none">
                        {item.version}
                      </span>
                      <h4 className="font-display text-base font-bold text-white group-hover/timeline:text-emerald-400 transition duration-300 filter drop-shadow">
                        {item.title}
                      </h4>
                      {isLatest && (
                        <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded animate-pulse select-none">
                          LATEST RESOLUTIONS
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap font-mono text-[10px]">
                      <span className="text-zinc-500 flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {item.date}
                      </span>
                      <span className={`px-2 py-0.5 border rounded-full font-sans font-bold uppercase text-[9px] leading-none ${styles.text}`}>
                        {styles.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                    {item.description}
                  </p>

                  <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 space-y-1.5 mt-2">
                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">CHANGELOG LEDGER SUMMARY</span>
                    <ul className="space-y-1.5 pl-2">
                      {item.changes.map((change, cIdx) => (
                        <li key={cIdx} className="text-xs text-zinc-350 flex items-start gap-2 leading-relaxed">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 mt-0.5 flex-shrink-0" />
                          <span>{change}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Impact Rating Info block */}
                  <div className="pt-2 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                    <span className="flex items-center gap-1">
                      <Info className="h-3 w-3 text-zinc-500" />
                      Status Register: <span className="font-bold text-zinc-300">{item.badge}</span>
                    </span>
                    <span>
                      Impact Value: <span className={`font-bold ${item.impactRating === "High Impact" ? "text-amber-400" : "text-zinc-400"}`}>{item.impactRating}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-xl border border-zinc-900 border-dashed p-10 text-center select-none space-y-2">
            <Info className="h-8 w-8 text-zinc-650 mx-auto" />
            <h5 className="font-display text-sm font-bold text-white">No Record Entries Found</h5>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              No ledger updates matched your search query "{searchQuery}" matching category "{selectedType}".
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedType("all");
              }}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline font-mono cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
