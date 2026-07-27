import React, { useState, useEffect, useMemo } from "react";
import { FullAppState, NewsItem } from "../types";
import { Calendar, Globe2, AlertCircle, RefreshCw, Cpu, Folder, Radio, Filter, Clock } from "lucide-react";

interface NewsCalendarViewProps {
  state: FullAppState;
  onAnalyzeSentiment: () => Promise<string>;
}

export default function NewsCalendarView({ state, onAnalyzeSentiment }: NewsCalendarViewProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>("10:06:25 AM");
  const [insight, setInsight] = useState<string>(
    state.aiNewsInsight || "No active macro audit requested yet. Trigger AI analysis to check dynamic market commentary."
  );

  // States for interactive filtering
  const [activePairFilter, setActivePairFilter] = useState<string>("ALL");
  const [activeImpactFilter, setActiveImpactFilter] = useState<string>("ALL");

  // Keep trigger/refresh time aligned with local standard timestamps
  useEffect(() => {
    const formatTime = (d: Date) => {
      return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }) + " IST";
    };
    setLastUpdated(formatTime(new Date()));
  }, []);

  // Live countdown timer state (re-registers tick and re-calculates offsets every second)
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerAnalysis = async () => {
    setLoading(true);
    try {
      const text = await onAnalyzeSentiment();
      setInsight(text);
    } catch (err) {
      setInsight("Failed to compile AI insights: " + err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Fake refresh duration for realistic terminal synchronization
    setLastUpdated(new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Kolkata" }) + " IST");
    setTimeout(() => {
      setIsRefreshing(false);
    }, 805);
  };

  // Maps which news currencies match target pair tags
  const matchesPair = (currency: string, pair: string) => {
    if (pair === "ALL") return true;
    const curLower = currency.toUpperCase();
    if (pair === "BTC/USD") return curLower === "BTC" || curLower === "USD";
    if (pair === "XAU/USD") return curLower === "XAU" || curLower === "USD";
    if (pair === "EUR/USD") return curLower === "EUR" || curLower === "USD";
    if (pair === "GBP/USD") return curLower === "GBP" || curLower === "USD";
    if (pair === "USD/JPY") return curLower === "JPY" || curLower === "USD";
    return false;
  };

  // Counts events matching matching pairs
  const getPairCount = (pair: string) => {
    return state.news.filter(n => matchesPair(n.currency, pair)).length;
  };

  // Format date helper matching Friday, May 29 style
  const formatDateGroupLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { weekday: "long", month: "short", day: "numeric", timeZone: "Asia/Kolkata" };
    return d.toLocaleDateString("en-US", options);
  };

  // Helper code to get countdown intervals
  const getCountdownString = (targetDateStr: string) => {
    const diffMs = new Date(targetDateStr).getTime() - currentTime.getTime();
    if (diffMs < 0) {
      const absDiff = Math.abs(diffMs);
      const minsObj = Math.floor(absDiff / 1000 / 60);
      if (minsObj < 60) return `${minsObj}m ago`;
      const hrsObj = Math.floor(minsObj / 60);
      if (hrsObj < 24) return `${hrsObj}h ago`;
      return `${Math.floor(hrsObj / 24)}d ago`;
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `in ${days}d`;
    }
    if (hours > 0) {
      return `in ${hours}h`;
    }
    return `in ${mins}m`;
  };

  // Dynamic next high-impact event finder
  const nextHighImpact = useMemo(() => {
    const futureHighImpactEvents = state.news
      .filter((n) => n.importance === "HIGH" && new Date(n.time).getTime() > currentTime.getTime())
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    if (futureHighImpactEvents.length === 0) return null;
    const target = futureHighImpactEvents[0];

    // Compute exact detailed countdown of next high-impact (e.g. 2d 7h 41m)
    const diffMs = new Date(target.time).getTime() - currentTime.getTime();
    const totalSecs = Math.floor(diffMs / 1000);
    const totalMins = Math.floor(totalSecs / 60);
    const totalHours = Math.floor(totalMins / 60);
    
    const dStr = totalHours >= 24 ? `${Math.floor(totalHours / 24)}d ` : "";
    const hStr = `${totalHours % 24}h `;
    const mStr = `${totalMins % 60}m`;

    const formattedTimeStr = new Date(target.time).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata"
    }) + " IST";

    return {
      event: target.event,
      currency: target.currency,
      timeLabel: formattedTimeStr,
      countdown: `${dStr}${hStr}${mStr}`
    };
  }, [state.news, currentTime]);

  // Process filters (by selected pair and impact)
  const filteredEvents = useMemo(() => {
    return state.news
      .filter((n) => {
        const pairMatch = matchesPair(n.currency, activePairFilter);
        const impactMatch = activeImpactFilter === "ALL" || n.importance === activeImpactFilter;
        return pairMatch && impactMatch;
      })
      .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [state.news, activePairFilter, activeImpactFilter]);

  // Group events by day index in Indian Standard Time (IST)
  const groupedEvents = useMemo(() => {
    const groups: Record<string, NewsItem[]> = {};
    filteredEvents.forEach((item) => {
      // Group by Asia/Kolkata localized date string key in YYYY-MM-DD format
      const dateKey = new Date(item.time).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });
    return groups;
  }, [filteredEvents]);

  // Specific Day Label check (TODAY, THU etc) synchronized with IST
  const getDayShortBadge = (dateKey: string) => {
    const parts = dateKey.split("-");
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const targetDate = new Date(year, month, day);

    const today = new Date();
    const todayIstStr = today.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
    
    if (dateKey === todayIstStr) {
      return "TODAY";
    }
    
    // Return short abbreviation, e.g. "THU", "WED"
    return targetDate.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  };

  const getFolderColor = (lvl: string) => {
    switch (lvl) {
      case "HIGH":
        return "text-red-500 fill-red-500";
      case "MEDIUM":
        return "text-amber-500 fill-amber-500";
      default:
        return "text-yellow-600 fill-yellow-600";
    }
  };

  return (
    <div className="space-y-5 px-3 md:px-6 py-4 bg-zinc-950 font-sans min-h-screen text-zinc-100 selection:bg-emerald-600 selection:text-white">
      
      {/* Header design corresponding perfectly with original screenshot style */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-zinc-900 pb-4 gap-4">
        <div>
          <h3 className="font-sans text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-500" />
            News Calendar
            <span className="text-[9px] font-mono text-amber-400 border border-amber-900/40 bg-amber-950/40 px-1.5 py-0.5 rounded uppercase tracking-wide">
              IST Timeframe
            </span>
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Macro events that move BTC, Gold and the major FX pairs (displayed in Indian Standard Time).
          </p>
        </div>

        <div className="flex items-center gap-3 self-end md:self-auto text-xs font-mono">
          <span className="text-zinc-500">
            Updated <span className="text-zinc-300 font-semibold">{lastUpdated}</span>
          </span>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:text-white transition-all text-zinc-300 font-sans text-xs font-semibold cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Red Alert Banner: NEXT HIGH-IMPACT dynamic tracker */}
      {nextHighImpact && (
        <div className="rounded-lg border border-red-950 bg-red-950/10 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-red-400 transition-all shadow-sm">
          <div className="flex items-center gap-2 text-xs">
            <Radio className="h-4 w-4 text-red-500 animate-pulse shrink-0" />
            <span className="font-bold tracking-wider uppercase text-[10px] text-red-500 shrink-0">NEXT HIGH-IMPACT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-red-950 shrink-0 hidden sm:inline" />
            <span className="font-bold text-zinc-200">
              {nextHighImpact.event}
            </span>
            <span className="px-1.5 py-0.2 bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 rounded text-[9px] font-bold font-mono uppercase">
              {nextHighImpact.currency}
            </span>
          </div>
          <div className="flex items-center gap-2.5 sm:text-right font-mono text-xs font-bold text-zinc-300 justify-end">
            <span>{nextHighImpact.timeLabel}</span>
            <span className="text-red-500 block tracking-wider bg-red-950/50 px-2 py-0.5 rounded border border-red-900/30">
              {nextHighImpact.countdown}
            </span>
          </div>
        </div>
      )}

      {/* Navigation Filter row exactly representing pairs and impacts grid */}
      <div className="rounded-lg border border-zinc-900 bg-zinc-950 p-3.5 flex flex-wrap md:flex-nowrap items-center gap-6 text-xs text-zinc-300">
        
        {/* Pairs filter with exact screenshot mapping list */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase select-none">PAIRS</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setActivePairFilter("ALL")}
              className={`py-1 px-2.5 rounded font-sans text-xs transition-all cursor-pointer ${
                activePairFilter === "ALL"
                  ? "bg-zinc-800/80 border border-zinc-700 text-white font-bold"
                  : "bg-zinc-900/30 border border-transparent hover:bg-zinc-900 hover:text-white"
              }`}
            >
              ALL
            </button>
            {["BTC/USD", "XAU/USD", "EUR/USD", "GBP/USD", "USD/JPY"].map((pair) => {
              const count = getPairCount(pair);
              return (
                <button
                  key={pair}
                  onClick={() => setActivePairFilter(pair)}
                  className={`py-1 px-2.5 rounded font-sans text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                    activePairFilter === pair
                      ? "bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold"
                      : "bg-zinc-900/30 border border-transparent hover:bg-zinc-900 hover:text-white"
                  }`}
                >
                  <span className="font-mono">{pair}</span>
                  {count > 0 && (
                    <span className="text-[9px] px-1 bg-zinc-800 rounded font-bold text-zinc-400-50">
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="h-4 w-px bg-zinc-850 hidden md:block" />

        {/* Impact filter level option buttons */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase select-none">IMPACT</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveImpactFilter("ALL")}
              className={`py-1 px-2.5 rounded font-sans text-xs transition-all cursor-pointer ${
                activeImpactFilter === "ALL"
                  ? "bg-zinc-800/85 border border-zinc-750 text-white font-bold"
                  : "bg-zinc-900/30 border border-transparent hover:bg-zinc-900 hover:text-white"
              }`}
            >
              ALL
            </button>
            <button
              onClick={() => setActiveImpactFilter("HIGH")}
              className={`py-1 px-2.5 rounded font-sans text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeImpactFilter === "HIGH"
                  ? "bg-red-950/40 border border-red-900/40 text-red-400 font-bold"
                  : "bg-zinc-900/30 border border-transparent hover:bg-zinc-900 hover:text-white text-zinc-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              HIGH
            </button>
            <button
              onClick={() => setActiveImpactFilter("MEDIUM")}
              className={`py-1 px-2.5 rounded font-sans text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeImpactFilter === "MEDIUM"
                  ? "bg-amber-950/40 border border-amber-900/40 text-amber-500 font-bold"
                  : "bg-zinc-900/30 border border-transparent hover:bg-zinc-900 hover:text-white text-zinc-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              MEDIUM
            </button>
            <button
              onClick={() => setActiveImpactFilter("LOW")}
              className={`py-1 px-2.5 rounded font-sans text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                activeImpactFilter === "LOW"
                  ? "bg-yellow-950/40 border border-yellow-904/40 text-yellow-600 font-bold"
                  : "bg-zinc-900/30 border border-transparent hover:bg-zinc-900/30 hover:text-orange-400 text-zinc-400"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              LOW
            </button>
          </div>
        </div>

      </div>

      {/* Main Container dividing Grouped lists and AI analytical box */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        
        {/* News Stream Calendar */}
        <div className="xl:col-span-2 space-y-4">
          
          {filteredEvents.length === 0 ? (
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/50 p-12 text-center text-zinc-500 font-sans space-y-2">
              <Filter className="h-8 w-8 text-zinc-700 mx-auto" strokeWidth={1.5} />
              <p className="text-sm font-bold">No High Impact Events found for criteria.</p>
              <p className="text-xs">Try selecting ALL Pairs or ALL impacts triggers to clear the screen filter limits.</p>
            </div>
          ) : (
            Object.keys(groupedEvents).map((dateKey) => {
              const dayLabel = formatDateGroupLabel(groupedEvents[dateKey][0].time);
              const badgeLabel = getDayShortBadge(dateKey);
              const totalEvents = groupedEvents[dateKey].length;

              return (
                <div key={dateKey} className="rounded-lg border border-zinc-1000 border-zinc-900 bg-zinc-950/25 overflow-hidden shadow-sm">
                  
                  {/* Calendar Group Day Header Line matching image layout */}
                  <div className="px-4 py-2.5 bg-zinc-900/40 border-b border-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-400">
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-200">{dayLabel}</span>
                      <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-bold ${
                        badgeLabel === "TODAY" 
                          ? "bg-emerald-950 text-emerald-400 border border-emerald-900" 
                          : "bg-zinc-800 text-zinc-400 border border-zinc-750"
                      }`}>
                        {badgeLabel}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-semibold font-mono">
                      {totalEvents} {totalEvents === 1 ? "event" : "events"}
                    </span>
                  </div>

                  {/* Calendar Items Table/List Rows resembling final spec */}
                  <div className="divide-y divide-zinc-900 px-4">
                    {groupedEvents[dateKey].map((n) => {
                      const timeLabel = new Date(n.time).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: false,
                        timeZone: "Asia/Kolkata"
                      });
                      const countdownStr = getCountdownString(n.time);

                      return (
                        <div key={n.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 font-sans">
                          
                          {/* Left event indicators & name */}
                          <div className="flex items-start gap-4 flex-1">
                            {/* Time indicator + Currency stack */}
                            <div className="w-12 shrink-0 font-mono text-left leading-tight">
                              <span className="block text-xs font-black text-white">{timeLabel}</span>
                              <span className="text-[9px] text-zinc-500 font-bold uppercase">{n.currency}</span>
                            </div>

                            <div className="space-y-0.5 leading-snug">
                              <h5 className="text-xs font-bold text-zinc-200 hover:text-white transition-colors">
                                {n.event}
                              </h5>
                            </div>
                          </div>

                          {/* Right elements: Folder representation + Stats (Forecast/Previous) + Countdown */}
                          <div className="flex items-center justify-between sm:justify-end gap-6 font-mono text-xs w-full sm:w-auto shrink-0 border-t border-zinc-900 sm:border-t-0 pt-2 sm:pt-0">
                            
                            {/* Compact folder representation colored precisely by impact */}
                            <div className="flex items-center" title={`${n.importance} Impact`}>
                              <Folder className={`h-4 w-4 ${getFolderColor(n.importance)}`} />
                            </div>

                            {/* Stats layout: F [forecast] P [previous] */}
                            <div className="flex items-center gap-3.5 text-[10.5px]">
                              <div className="flex items-center gap-1 text-zinc-500">
                                <span>F</span>
                                <span className="text-zinc-305 text-zinc-300 font-medium font-mono">{n.forecast || "N/A"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-zinc-500">
                                <span>P</span>
                                <span className="text-zinc-305 text-zinc-300 font-medium font-mono">{n.previous || "N/A"}</span>
                              </div>
                            </div>

                            {/* Target time relative text highlighted blueish precisely */}
                            <div className="w-16 text-right">
                              <span className="text-[10px] font-bold text-sky-450 text-sky-400 tracking-wide">
                                {countdownStr}
                              </span>
                            </div>

                          </div>

                        </div>
                      );
                    })}
                  </div>

                </div>
              );
            })
          )}

          {/* Table bottom credits footnote exact match */}
          <div className="text-center pt-2">
            <p className="text-[10.5px] text-zinc-650 text-zinc-500 select-none">
              Source: ForexFactory weekly feed · cached 30 min · times in IST (Indian Standard Time)
            </p>
          </div>

        </div>

        {/* Intelligent analytical report side pane */}
        <div className="rounded-lg border border-zinc-900 bg-zinc-950/70 p-5 space-y-4">
          <div className="border-b border-zinc-900 pb-3 flex items-center justify-between">
            <div>
              <h4 className="font-sans text-xs font-black tracking-wider text-zinc-400 uppercase">AI MACRO SENTIMENT REPORT</h4>
              <p className="text-[10px] text-zinc-500 mt-0.5">Dual-layer commentary driven by system intelligence models.</p>
            </div>
            <Cpu className="h-5 w-5 text-emerald-500" />
          </div>

          <div className="bg-zinc-900/10 p-3.5 rounded-lg border border-zinc-900/60 min-h-[350px] flex flex-col justify-between">
            <div className="text-xs leading-relaxed text-zinc-305 text-zinc-300 font-sans whitespace-pre-wrap select-all max-h-[420px] overflow-y-auto pr-1">
              {insight}
            </div>

            <div className="pt-3 border-t border-zinc-900 mt-4">
              <button
                onClick={triggerAnalysis}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer disabled:cursor-not-allowed"
                id="btn-trigger-news-sentiment-analysis"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin text-emerald-400" />
                    Crunching structural metrics...
                  </>
                ) : (
                  <>
                    <Radio className="h-3.5 w-3.5 text-zinc-200" />
                    Deconstruct News Sentiment
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
