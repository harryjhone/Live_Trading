import React, { useState, useEffect } from "react";
import { FullAppState, SymbolType, Trade, TradingSignal, OHLCV } from "../types";
import DashboardSubTabs from "./DashboardSubTabs";
import { VisualToggle } from "./VisualToggle";
import { ComposedChart, Bar, Cell, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine, CartesianGrid } from "recharts";
import { 
  TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle, Plus, 
  RefreshCw, Layers, ShieldAlert, Sparkles, Sliders, Play, Pause, 
  ChevronRight, Scale, Gauge, Zap, Percent, CheckCircle, Shield, 
  Coins, Settings, Calendar, Compass, Bell, BookOpen, Clock, Globe, 
  ChevronDown, AlertOctagon, User, BookMarked
} from "lucide-react";

// Professional custom candlestick component to replace basic rectangles
const Candlestick = (props: any) => {
  const { x, y, width, height, payload } = props;
  if (!payload) return null;

  const { open, close, high, low } = payload;
  if (open === undefined || close === undefined || high === undefined || low === undefined) return null;

  const isUp = close >= open;
  
  // High-precision standard trading colors: Emerald/Green for Bullish, Ruby/Red for Bearish
  const bodyColor = isUp ? "#10b981" : "#ef4444";
  const borderStrokeColor = isUp ? "#10b981" : "#ef4444";
  const wickColor = isUp ? "#10b981" : "#ef4444";

  // Mathematically precise mapping derived from layout coordinates:
  // Recharts maps dataKey range to top Y ('y') and height ('height').
  const highPrice = Math.max(open, close);
  const lowPrice = Math.min(open, close);
  const priceRange = highPrice - lowPrice;

  let yHigh = y;
  let yLow = y + height;
  let bodyY = y;
  let bodyHeight = height;

  if (priceRange > 0.000001 && height > 0) {
    const scale = height / priceRange;
    yHigh = y - (high - highPrice) * scale;
    yLow = y + height + (lowPrice - low) * scale;
  } else {
    // Graceful fallback offset for flat doji/near-flat candles
    yHigh = y - 3;
    yLow = y + height + 3;
    bodyHeight = 1.5; // Prevent negative/zero height artifacts
  }

  // Consistent, elegant width and spacing to prevent candle overlap (compressing/squashing visual issue)
  const candleWidth = width && width > 4 ? Math.floor(width * 0.7) : Math.max(width || 4, 2);
  const xOffset = x + (width - candleWidth) / 2;
  const xCenter = x + width / 2;

  return (
    <g>
      {/* High-Low Wick Representing Complete Price Excursion */}
      <line
        x1={xCenter}
        y1={yHigh}
        x2={xCenter}
        y2={yLow}
        stroke={wickColor}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      {/* Candlestick Body overlay */}
      <rect
        x={xOffset}
        y={bodyY}
        width={candleWidth}
        height={bodyHeight}
        fill={bodyColor}
        stroke={borderStrokeColor}
        strokeWidth={1}
        rx={0.5}
      />
    </g>
  );
};

interface IntelligenceNewsItem {
  avatar: string;
  avatarBg: string; // Tailwind class
  avatarTextColor: string; // Tailwind class
  tag: string;
  tagBg: string; // Tailwind class
  tagTextColor: string; // Tailwind class
  change: string;
  changeTextColor: string; // Tailwind class
  publisher: string;
  timeAgo: string;
  title: string;
  link: string;
}

const INTELLIGENCE_NEWS_MAP: Record<SymbolType, IntelligenceNewsItem[]> = {
  EURUSD: [
    {
      avatar: "E",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "EURUSD",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-700 dark:text-blue-300",
      change: "-0.15%",
      changeTextColor: "text-rose-600 dark:text-rose-400",
      publisher: "Bloomberg",
      timeAgo: "30m",
      title: "ECB Signals Cautious Stance on Further Interest Rate Cuts Pending Wage Growth Deceleration",
      link: "https://www.tradingview.com/symbols/EURUSD/"
    },
    {
      avatar: "M",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-800 dark:text-emerald-400",
      tag: "EUROZONE",
      tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-700 dark:text-emerald-300",
      change: "+0.22%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "2h",
      title: "Eurozone Manufacturing PMIs Rebound to Multi-Month Highs Led by Strong Capital Goods Output",
      link: "https://www.reuters.com/"
    },
    {
      avatar: "F",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "FOREX",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "-0.05%",
      changeTextColor: "text-rose-600 dark:text-rose-400",
      publisher: "WSJ",
      timeAgo: "4h",
      title: "EURUSD Cross Stabilizes Close to Monthly Pivot as Sovereign Debt Yield Spreads Tighten",
      link: "https://www.wsj.com/"
    }
  ],
  GBPUSD: [
    {
      avatar: "G",
      avatarBg: "bg-purple-50 dark:bg-purple-950/20",
      avatarTextColor: "text-purple-800 dark:text-purple-400",
      tag: "GBPUSD",
      tagBg: "bg-purple-50 dark:bg-purple-950/40",
      tagTextColor: "text-purple-700 dark:text-purple-300",
      change: "+0.35%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "20m",
      title: "Bank of England Keeps Bank Rate Steady as Services Inflation Remains Unpredictably Sticky",
      link: "https://www.tradingview.com/symbols/GBPUSD/"
    },
    {
      avatar: "K",
      avatarBg: "bg-indigo-50 dark:bg-indigo-950/20",
      avatarTextColor: "text-indigo-800 dark:text-indigo-400",
      tag: "UK_GDP",
      tagBg: "bg-indigo-50 dark:bg-indigo-950/40",
      tagTextColor: "text-indigo-700 dark:text-indigo-300",
      change: "+0.18%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "3h",
      title: "UK GDP Growth Estimates Upgraded for Q2 Fueled by Robust Consumer Spending Services Rebound",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "M",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-805 dark:text-zinc-200",
      tag: "GBP",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+0.42%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "5h",
      title: "GBPUSD Touches Weekly Highs as USD Softens on Mixed Macro Employment Trends",
      link: "https://www.wsj.com/"
    }
  ],
  USDJPY: [
    {
      avatar: "J",
      avatarBg: "bg-red-50 dark:bg-red-950/20",
      avatarTextColor: "text-red-800 dark:text-red-400",
      tag: "USDJPY",
      tagBg: "bg-red-50 dark:bg-red-950/40",
      tagTextColor: "text-red-700 dark:text-red-300",
      change: "-0.85%",
      changeTextColor: "text-rose-600 dark:text-rose-400",
      publisher: "Reuters",
      timeAgo: "18m",
      title: "Bank of Japan Intervenes Dynamically to Support JPY; Market Volatility Triggers Short Squeezes",
      link: "https://www.tradingview.com/symbols/USDJPY/"
    },
    {
      avatar: "Y",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "TREASURY",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "-0.45%",
      changeTextColor: "text-rose-600 dark:text-rose-400",
      publisher: "Bloomberg",
      timeAgo: "2.5h",
      title: "Treasury Yield Spreads Compress Pressuring USDJPY Back Towards Key Technical Support Lines",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "X",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-800 dark:text-emerald-400",
      tag: "EXPORT",
      tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-700 dark:text-emerald-300",
      change: "-0.20%",
      changeTextColor: "text-rose-600 dark:text-rose-400",
      publisher: "WSJ",
      timeAgo: "4h",
      title: "Japan Export Volumes Jump to Record Output Modifying Long-run Interest Rate Projections",
      link: "https://www.wsj.com/"
    }
  ],
  AUDUSD: [
    {
      avatar: "A",
      avatarBg: "bg-amber-50 dark:bg-amber-950/20",
      avatarTextColor: "text-amber-800 dark:text-amber-400",
      tag: "AUDUSD",
      tagBg: "bg-amber-50 dark:bg-amber-950/40",
      tagTextColor: "text-amber-700 dark:text-amber-300",
      change: "+0.65%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "35m",
      title: "Reserve Bank of Australia Keeps Hawkish Option on Table Following Sticky Quarterly Trimmed Mean CPI",
      link: "https://www.tradingview.com/symbols/AUDUSD/"
    },
    {
      avatar: "D",
      avatarBg: "bg-indigo-50 dark:bg-indigo-950/20",
      avatarTextColor: "text-indigo-800 dark:text-indigo-400",
      tag: "DEMAND",
      tagBg: "bg-indigo-50 dark:bg-indigo-950/40",
      tagTextColor: "text-indigo-700 dark:text-indigo-300",
      change: "+0.40%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "2h",
      title: "Commodity Export Volumes Surge as Chinese Demand for Iron Ore and Raw Minerals Recovers",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "O",
      avatarBg: "bg-teal-50 dark:bg-teal-950/20",
      avatarTextColor: "text-teal-800 dark:text-teal-400",
      tag: "OCEANIA",
      tagBg: "bg-teal-50 dark:bg-teal-950/40",
      tagTextColor: "text-teal-700 dark:text-teal-300",
      change: "+0.55%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "6h",
      title: "AUDUSD Outperforms Peers in Oceanian Trading as Local Treasury Yield Spreads Widens",
      link: "https://www.wsj.com/"
    }
  ],
  BTCUSD: [
    {
      avatar: "B",
      avatarBg: "bg-amber-50 dark:bg-amber-950/20",
      avatarTextColor: "text-amber-805 dark:text-amber-400",
      tag: "BTCUSD",
      tagBg: "bg-amber-55 dark:bg-amber-950/40",
      tagTextColor: "text-amber-700 dark:text-amber-300",
      change: "+2.45%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Coindesk",
      timeAgo: "15m",
      title: "Bitcoin Breaches Key Multi-Month Resistance Level as Institutional Inflows via Spot ETFs Accelerate",
      link: "https://finance.yahoo.com/news/bitcoin-etf-inflows-reach-record-143000627.html"
    },
    {
      avatar: "M",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "MINING",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-700 dark:text-blue-300",
      change: "-0.12%",
      changeTextColor: "text-rose-600 dark:text-rose-400",
      publisher: "Bloomberg",
      timeAgo: "1h",
      title: "Network Hashrate Hits All-Time High: Mining Difficulty Adjusts Upwards by 4.2% Amid Halving Consolidation",
      link: "https://www.bloomberg.com/crypto"
    },
    {
      avatar: "S",
      avatarBg: "bg-teal-50 dark:bg-teal-950/20",
      avatarTextColor: "text-teal-800 dark:text-teal-400",
      tag: "ACCUMULATION",
      tagBg: "bg-teal-50 dark:bg-teal-950/40",
      tagTextColor: "text-teal-700 dark:text-teal-300",
      change: "+1.80%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "3h",
      title: "Sovereign Wealth Funds Rumored to Be Accumulating BTC as Global Inflation Hedges Gain Traction",
      link: "https://www.reuters.com/technology/cryptocurrency/"
    }
  ],
  ETHUSD: [
    {
      avatar: "E",
      avatarBg: "bg-indigo-50 dark:bg-indigo-950/20",
      avatarTextColor: "text-indigo-805 dark:text-indigo-400",
      tag: "ETHUSD",
      tagBg: "bg-indigo-55 dark:bg-indigo-950/40",
      tagTextColor: "text-indigo-700 dark:text-indigo-300",
      change: "+4.20%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Coindesk",
      timeAgo: "10m",
      title: "SEC Approves Supplemental Filings for Spot Ethereum ETFs; TradFi Desks Prepare for Launch",
      link: "https://finance.yahoo.com/news/sec-ethereum-etf-updates"
    },
    {
      avatar: "G",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "GAS_FEES",
      tagBg: "bg-zinc-100 dark:bg-zinc-805",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+0.15%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "2h",
      title: "Gas Fees Plunge Below 5 Gwei Post Dencun Upgrade as Layer-2 Blob Scaling Reaches Maturity",
      link: "https://www.bloomberg.com/crypto"
    },
    {
      avatar: "S",
      avatarBg: "bg-purple-50 dark:bg-purple-950/20",
      avatarTextColor: "text-purple-800 dark:text-purple-400",
      tag: "STAKING",
      tagBg: "bg-purple-50 dark:bg-purple-950/40",
      tagTextColor: "text-purple-700 dark:text-purple-300",
      change: "+1.10%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "5h",
      title: "Staking Inflows Surge to Record Highs: Over 28% of Circulating Supply Now Locked in Smart Contracts",
      link: "https://www.wsj.com"
    }
  ],
  SOLUSD: [
    {
      avatar: "S",
      avatarBg: "bg-teal-50 dark:bg-teal-950/20",
      avatarTextColor: "text-teal-800 dark:text-teal-400",
      tag: "SOLUSD",
      tagBg: "bg-teal-50 dark:bg-teal-950/40",
      tagTextColor: "text-teal-700 dark:text-teal-300",
      change: "+5.12%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Coindesk",
      timeAgo: "25m",
      title: "Solana Network Dynamic Fee Allocation Boosts DeFi Transaction Success Rates to New Highs",
      link: "https://coinmarketcap.com/currencies/solana/"
    },
    {
      avatar: "R",
      avatarBg: "bg-red-50 dark:bg-red-950/20",
      avatarTextColor: "text-red-800 dark:text-red-400",
      tag: "SOL_ETF",
      tagBg: "bg-red-50 dark:bg-red-950/40",
      tagTextColor: "text-red-700 dark:text-red-300",
      change: "+6.70%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "1h",
      title: "Institutional Asset Managers File for Spot Solana ETFs Following Regulatory Sentiment Shifts",
      link: "https://www.reuters.com/"
    },
    {
      avatar: "D",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "DEX_VOLUME",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-700 dark:text-blue-300",
      change: "+2.34%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "4h",
      title: "DEX Volume on Solana Outpaces Ethereum Mainnet for Three Consecutive Days as Memecoin Mania Cools",
      link: "https://www.bloomberg.com/crypto"
    }
  ],
  BNBUSD: [
    {
      avatar: "B",
      avatarBg: "bg-yellow-50 dark:bg-yellow-950/20",
      avatarTextColor: "text-yellow-800 dark:text-yellow-400",
      tag: "BNBUSD",
      tagBg: "bg-yellow-55 dark:bg-yellow-950/40",
      tagTextColor: "text-yellow-700 dark:text-yellow-300",
      change: "+3.10%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Coindesk",
      timeAgo: "40m",
      title: "Binance Launchpool Unveils New Staking Pools Triggering Inflows and Sudden BNB Demand Shock",
      link: "https://www.coindesk.com/"
    },
    {
      avatar: "C",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-805 dark:text-emerald-400",
      tag: "BNB_CHAIN",
      tagBg: "bg-emerald-55 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-700 dark:text-emerald-300",
      change: "+0.80%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "2h",
      title: "BNB Chain Multi-Chain Scalability Framework Activated to Support Ultra-Low Latency Gaming DApps",
      link: "https://www.bloomberg.com/crypto"
    },
    {
      avatar: "T",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-803 dark:text-zinc-200",
      tag: "BURN",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+1.20%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "6h",
      title: "On-Chain Transaction Burn Rate Accelerates as Smart Chain Gas Volumes Rebound",
      link: "https://www.reuters.com/"
    }
  ],
  AAPL: [
    {
      avatar: "A",
      avatarBg: "bg-slate-50 dark:bg-zinc-900",
      avatarTextColor: "text-slate-800 dark:text-zinc-200",
      tag: "AAPL",
      tagBg: "bg-slate-100 dark:bg-zinc-800",
      tagTextColor: "text-slate-700 dark:text-zinc-300",
      change: "+1.45%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "30m",
      title: "Apple Unveils On-Device Generative AI Integrations Powered by Next-Generation M4 Silicon Chips",
      link: "https://finance.yahoo.com/quote/AAPL"
    },
    {
      avatar: "S",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "SHIPPING",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-700 dark:text-blue-300",
      change: "+0.75%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "2h",
      title: "Supply Chain Optimization Boosts iPhone Shipping Projections Across Highly Resilient Asian Markets",
      link: "https://www.bloomberg.com/quote/AAPL:US"
    },
    {
      avatar: "U",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-800 dark:text-emerald-400",
      tag: "UPGRADE",
      tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-700 dark:text-emerald-300",
      change: "+2.10%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "5h",
      title: "Analysts Upgrade Apple to Strong Buy as Services Revenue Growth Reasserts Structural Dominance",
      link: "https://www.reuters.com/companies/AAPL.O"
    }
  ],
  TSLA: [
    {
      avatar: "T",
      avatarBg: "bg-red-50 dark:bg-red-950/20",
      avatarTextColor: "text-red-800 dark:text-red-400",
      tag: "TSLA",
      tagBg: "bg-red-50 dark:bg-red-950/40",
      tagTextColor: "text-red-700 dark:text-red-300",
      change: "+6.40%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "12m",
      title: "Tesla Full Self-Driving (FSD) Beta Receives Regulatory Clearance for Regional Pilot in China",
      link: "https://finance.yahoo.com/quote/TSLA"
    },
    {
      avatar: "G",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "OUTPUT",
      tagBg: "bg-zinc-100 dark:bg-zinc-805",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+1.80%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "1.5h",
      title: "Gigafactory Shanghai Targets Record Outflow Capacity Following Local Power Grid Optimizations",
      link: "https://www.bloomberg.com/quote/TSLA:US"
    },
    {
      avatar: "A",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-800 dark:text-emerald-400",
      tag: "AFFORDABLE_EV",
      tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-700 dark:text-emerald-300",
      change: "+3.55%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "4h",
      title: "Tesla Prepares to Launch Next-Generation Affordable EV Crossover Model Ahead of Schedule",
      link: "https://www.reuters.com/companies/TSLA.O"
    }
  ],
  MSFT: [
    {
      avatar: "M",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "MSFT",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-700 dark:text-blue-300",
      change: "+0.85%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "45m",
      title: "Microsoft Copilot Workspace Extends Enterprise Penetration as SaaS Conversions Peak",
      link: "https://finance.yahoo.com/quote/MSFT"
    },
    {
      avatar: "A",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-808 dark:text-emerald-400",
      tag: "AZURE_CLOUD",
      tagBg: "bg-emerald-55 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-700 dark:text-emerald-300",
      change: "+1.20%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "2h",
      title: "Azure Cloud Infrastructure Sector Expands as High-Performance AI Clusters Go Online Globally",
      link: "https://www.bloomberg.com/quote/MSFT:US"
    },
    {
      avatar: "S",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "SECURITY",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+0.60%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "6h",
      title: "Regulatory Approvals Cleared for New Cyber-Security SaaS Subscriptions Targeting Corporate Audits",
      link: "https://www.reuters.com/companies/MSFT.O"
    }
  ],
  NVDA: [
    {
      avatar: "N",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-800 dark:text-emerald-400",
      tag: "NVDA",
      tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-700 dark:text-emerald-300",
      change: "+4.80%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "15m",
      title: "NVIDIA Blackwell B200 AI Superchips Face Unprecedented Backlog Demand from Cloud Providers",
      link: "https://finance.yahoo.com/quote/NVDA"
    },
    {
      avatar: "C",
      avatarBg: "bg-teal-50 dark:bg-teal-950/20",
      avatarTextColor: "text-teal-800 dark:text-teal-400",
      tag: "COWOS",
      tagBg: "bg-teal-50 dark:bg-teal-950/40",
      tagTextColor: "text-teal-700 dark:text-teal-300",
      change: "+2.30%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "1h",
      title: "Local Foundry Cooperations Solidified as NVIDIA Guarantees 2026 CoWoS Packaging Allocation",
      link: "https://www.bloomberg.com/quote/NVDA:US"
    },
    {
      avatar: "A",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "AUTO_AI",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+1.75%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "3h",
      title: "Automotive AI Cockpit Integration Contracts Signed with Major European Luxury EV Brands",
      link: "https://www.reuters.com/companies/NVDA.O"
    }
  ],
  XAUUSD: [
    {
      avatar: "G",
      avatarBg: "bg-amber-50 dark:bg-amber-950/20",
      avatarTextColor: "text-amber-800 dark:text-amber-400",
      tag: "GOLD",
      tagBg: "bg-amber-50 dark:bg-amber-950/40",
      tagTextColor: "text-amber-700 dark:text-amber-300",
      change: "+1.95%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "25m",
      title: "Gold Spot Prices Break All-Time Highs Amid Escalating Geopolitical Crises and Central Bank Buying",
      link: "https://www.tradingview.com/symbols/XAUUSD/"
    },
    {
      avatar: "R",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "RESERVES",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+1.20%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "3h",
      title: "Global Sovereign Gold Reserve Mandates Propel Strategic Long-term Spot Physical Storage Demands",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "E",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-801 dark:text-emerald-400",
      tag: "GOLD_ETFS",
      tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-707 dark:text-emerald-300",
      change: "+0.85%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "5h",
      title: "Technical Bull Flag Patterns Completed as Exchange-Traded Funds Report Massive Capital Inflow",
      link: "https://www.reuters.com/"
    }
  ],
  USOIL: [
    {
      avatar: "O",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "USOIL",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-750 dark:text-zinc-300",
      change: "+2.15%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "40m",
      title: "Crude Oil Rallies as OPEC+ Agrees to Extend Production Cut Targets into Next Fiscal Quarter",
      link: "https://www.tradingview.com/symbols/USOIL/"
    },
    {
      avatar: "S",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "RESERVES",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-700 dark:text-blue-300",
      change: "+1.10%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "2.5h",
      title: "US Strategic Petroleum Reserve Dispatches Major Refueling Request to Support Local Inventory",
      link: "https://www.reuters.com/"
    },
    {
      avatar: "M",
      avatarBg: "bg-red-50 dark:bg-red-950/20",
      avatarTextColor: "text-red-00 dark:text-red-400",
      tag: "MIDDLE_EAST",
      tagBg: "bg-red-50 dark:bg-red-950/40",
      tagTextColor: "text-red-700 dark:text-red-300",
      change: "+1.65%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "4h",
      title: "Middle East Supply Chain Disruption Threats Keep Geopolitical Premium High on Front-Month Contracts",
      link: "https://www.wsj.com/"
    }
  ],
  XAGUSD: [
    {
      avatar: "S",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "SILVER",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+3.40%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "50m",
      title: "Silver Outperforms Gold as Industrial Demand for Solar Panels and EV Hardware Outstrips Mine Supply",
      link: "https://www.tradingview.com/symbols/XAGUSD/"
    },
    {
      avatar: "I",
      avatarBg: "bg-teal-50 dark:bg-teal-950/20",
      avatarTextColor: "text-teal-800 dark:text-teal-400",
      tag: "INVENTORIES",
      tagBg: "bg-teal-50 dark:bg-teal-950/40",
      tagTextColor: "text-teal-700 dark:text-teal-300",
      change: "+1.90%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "3h",
      title: "On-Exchange Silver Inventory Depletes Quickest in a Decade at Major COMEX Regulated Vaults",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "B",
      avatarBg: "bg-indigo-50 dark:bg-indigo-950/20",
      avatarTextColor: "text-indigo-805 dark:text-indigo-400",
      tag: "BATTERY_TECH",
      tagBg: "bg-indigo-55 dark:bg-indigo-950/40",
      tagTextColor: "text-indigo-707 dark:text-indigo-300",
      change: "+2.65%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "6h",
      title: "Industrial Sourcing Contract Lock-ins Force Global Battery Manufacturers to Pay Spot Premiums",
      link: "https://www.wsj.com/"
    }
  ],
  NGAS: [
    {
      avatar: "N",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "NGAS",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-700 dark:text-blue-300",
      change: "+4.60%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "1h",
      title: "Natural Gas Futures Settle Higher as Freezing Weather Front Looming Over Pacific Northwest Needs Heat",
      link: "https://www.tradingview.com/symbols/NGAS/"
    },
    {
      avatar: "L",
      avatarBg: "bg-teal-50 dark:bg-teal-950/20",
      avatarTextColor: "text-teal-800 dark:text-teal-400",
      tag: "EXPORT",
      tagBg: "bg-teal-50 dark:bg-teal-950/40",
      tagTextColor: "text-teal-700 dark:text-teal-300",
      change: "+2.10%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "3h",
      title: "LNG Liquefaction Outflow Terminals Resume Operations Boosting Natural Gas Direct Domestic Export",
      link: "https://www.reuters.com/"
    },
    {
      avatar: "S",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "STORAGE",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-707 dark:text-zinc-300",
      change: "-0.25%",
      changeTextColor: "text-rose-600 dark:text-rose-400",
      publisher: "WSJ",
      timeAgo: "5h",
      title: "Slight Gas Storage Builds Match Market Expectations, Reducing High-Vol Interday Price Movements",
      link: "https://www.wsj.com/"
    }
  ],
  SPX500: [
    {
      avatar: "S",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/10",
      avatarTextColor: "text-emerald-700 dark:text-emerald-400",
      tag: "SPX500",
      tagBg: "bg-emerald-50 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-707 dark:text-emerald-300",
      change: "+1.15%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "15m",
      title: "S&P 500 Rallies as Outstanding Q1 Megacap Corporate Earnings Lift Broader Tech Index Valuations",
      link: "https://www.tradingview.com/symbols/SPX500/"
    },
    {
      avatar: "B",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "BONDS",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-707 dark:text-blue-300",
      change: "+0.80%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "2.5h",
      title: "Sovereign Bond Yield Pullbacks Bring Broad Institutional Buyflows Back to Stable Consumer Equities",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "V",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "VOLATILITY",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-707 dark:text-zinc-300",
      change: "+0.45%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "4h",
      title: "VIX Fear Index Collapses Below 12 Units as Volatility Options Writing Compresses Premium",
      link: "https://www.reuters.com/"
    }
  ],
  NDX100: [
    {
      avatar: "N",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "NDX100",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-707 dark:text-blue-300",
      change: "+1.95%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "10m",
      title: "Nasdaq 100 Powers Forward as AI Semiconductor Suppliers Recalibrate Forward Growth Guidance",
      link: "https://www.tradingview.com/symbols/NDX100/"
    },
    {
      avatar: "C",
      avatarBg: "bg-indigo-50 dark:bg-indigo-950/20",
      avatarTextColor: "text-indigo-800 dark:text-indigo-400",
      tag: "CLOUD",
      tagBg: "bg-indigo-55 dark:bg-indigo-950/40",
      tagTextColor: "text-indigo-707 dark:text-indigo-300",
      change: "+1.40%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "1.5h",
      title: "Cloud Platform Giants Declare Expansion Plans on GPU Systems Fueling Software Margin Optimization",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "P",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "PCE",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-700 dark:text-zinc-300",
      change: "+0.90%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "3h",
      title: "Broad Tech Index Approaches Blue Sky Territory as Core PCE Match Fed Forecast Objectives",
      link: "https://www.reuters.com/"
    }
  ],
  DJI30: [
    {
      avatar: "D",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-850 dark:text-zinc-200",
      tag: "DJI30",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-707 dark:text-zinc-300",
      change: "+0.65%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "1h",
      title: "Dow Jones Outperforms Led by Financial and Heavy Manufacturing Giants Upgraded on Infrastructure",
      link: "https://www.tradingview.com/symbols/DJI30/"
    },
    {
      avatar: "I",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "INDUSTRIALS",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-707 dark:text-blue-300",
      change: "+0.40%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "3h",
      title: "Global Industrial Capital Replacements Drive High Dividend Blue-Chip Equities Revaluations",
      link: "https://www.bloomberg.com/"
    },
    {
      avatar: "C",
      avatarBg: "bg-emerald-50 dark:bg-emerald-950/20",
      avatarTextColor: "text-emerald-805 dark:text-emerald-400",
      tag: "BANKING",
      tagBg: "bg-emerald-55 dark:bg-emerald-950/40",
      tagTextColor: "text-emerald-707 dark:text-emerald-300",
      change: "+0.85%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "5h",
      title: "Consumer Banking Sectors Post Surpassing Capital Return Discrepancies Boosting Net Non-Fees",
      link: "https://www.reuters.com/"
    }
  ],
  GER40: [
    {
      avatar: "G",
      avatarBg: "bg-amber-50 dark:bg-amber-950/20",
      avatarTextColor: "text-amber-805 dark:text-amber-400",
      tag: "GER40",
      tagBg: "bg-amber-55 dark:bg-amber-950/40",
      tagTextColor: "text-amber-707 dark:text-amber-300",
      change: "+0.95%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Bloomberg",
      timeAgo: "45m",
      title: "German DAX 40 Climbs Higher as Resilient Industrial Export Demands Offset Soft Utilities",
      link: "https://www.tradingview.com/symbols/GER40/"
    },
    {
      avatar: "E",
      avatarBg: "bg-zinc-100 dark:bg-zinc-900",
      avatarTextColor: "text-zinc-800 dark:text-zinc-200",
      tag: "EXPORTS",
      tagBg: "bg-zinc-100 dark:bg-zinc-800",
      tagTextColor: "text-zinc-707 dark:text-zinc-300",
      change: "+0.60%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "Reuters",
      timeAgo: "2h",
      title: "Automotive and Advanced Electronics Exports Record Jump as European Supply Stretches Ease",
      link: "https://www.reuters.com/"
    },
    {
      avatar: "B",
      avatarBg: "bg-blue-50 dark:bg-blue-950/20",
      avatarTextColor: "text-blue-800 dark:text-blue-400",
      tag: "BONDS",
      tagBg: "bg-blue-50 dark:bg-blue-950/40",
      tagTextColor: "text-blue-707 dark:text-blue-300",
      change: "+0.35%",
      changeTextColor: "text-emerald-600 dark:text-emerald-400",
      publisher: "WSJ",
      timeAgo: "4h",
      title: "Bund Yield Retractions Bring Strategic Domestic Value Asset Sinks Into Active Mutual Portfolios",
      link: "https://www.wsj.com/"
    }
  ]
};

interface DashboardViewProps {
  state: FullAppState;
  onOpenTradeModal: () => void;
  onCloseTrade: (id: string) => Promise<void>;
  onResetState: () => Promise<void>;
  theme?: "dark" | "light";
  activeSubMenu?: "all" | "terminal" | "analyzer";
  onSwitchSubMenu?: (mode: "all" | "terminal" | "analyzer") => void;
  onNavigate?: (tabName: any) => void;
  onUpdateConfig?: (config: any) => Promise<void>;
}

export default function DashboardView({ 
  state, 
  onOpenTradeModal, 
  onCloseTrade, 
  onResetState, 
  theme,
  activeSubMenu = "all",
  onSwitchSubMenu,
  onNavigate,
  onUpdateConfig
}: DashboardViewProps) {
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolType>("BTCUSD");
  const [selectedTimeframe, setSelectedTimeframe] = useState<"M1" | "M5" | "M15" | "H1" | "H4" | "D1">("M15");
  const [chartType, setChartType] = useState<"candle" | "line" | "tradingview">("tradingview");
  const [secondaryTab, setSecondaryTab] = useState<string>("Overview");
  const [hoveredCandle, setHoveredCandle] = useState<OHLCV | null>(null);

  const [realOKXCandles, setRealOKXCandles] = useState<OHLCV[] | null>(null);
  const [candlesLoading, setCandlesLoading] = useState<boolean>(false);

  const symbolToOKXId: Record<string, string> = {
    BTCUSD: "BTC-USDT",
    ETHUSD: "ETH-USDT",
    SOLUSD: "SOL-USDT",
    BNBUSD: "BNB-USDT",
    EURUSD: "EUR-USDT",
    GBPUSD: "GBP-USDT",
    XAUUSD: "PAXG-USDT"
  };

  const timeframeToOKXBar: Record<string, string> = {
    M1: "1m",
    M5: "5m",
    M15: "15m",
    H1: "1H",
    H4: "4H",
    D1: "1D"
  };

  useEffect(() => {
    let active = true;
    const okxInstId = symbolToOKXId[selectedSymbol];
    if (!okxInstId) {
      setRealOKXCandles(null);
      return;
    }

    const bar = timeframeToOKXBar[selectedTimeframe] || "15m";
    const fetchCandles = async () => {
      setCandlesLoading(true);
      try {
        const url = `https://www.okx.com/api/v5/market/candles?instId=${okxInstId}&bar=${bar}&limit=100`;
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`OKX HTTP error: ${res.status}`);
        }
        const json = await res.json();
        if (json.code === "0" && Array.isArray(json.data)) {
          const reversed = [...json.data].reverse();
          const mapped: OHLCV[] = reversed.map((c: any) => {
            const ts = parseInt(c[0]);
            return {
              time: new Date(ts).toISOString(),
              open: parseFloat(c[1]),
              high: parseFloat(c[2]),
              low: parseFloat(c[3]),
              close: parseFloat(c[4]),
              volume: parseFloat(c[5])
            };
          });

          if (active) {
            setRealOKXCandles(mapped);
          }
        } else {
          throw new Error(json.msg || "Invalid OKX response structure");
        }
      } catch (err) {
        console.warn("[OKX API] Client-side fetch failed, falling back to server state path:", err);
        if (active) {
          setRealOKXCandles(null);
        }
      } finally {
        if (active) {
          setCandlesLoading(false);
        }
      }
    };

    fetchCandles();
    const updateInterval = setInterval(fetchCandles, 10000); // 10 seconds intervals

    return () => {
      active = false;
      clearInterval(updateInterval);
    };
  }, [selectedSymbol, selectedTimeframe]);

  useEffect(() => {
    const enabledPairs = state?.config?.enabledPairs || {};
    const activeSymbols = (Object.keys(state.marketData) as SymbolType[]).filter(
      (sym) => !!enabledPairs[sym]
    );
    if (activeSymbols.length > 0 && !enabledPairs[selectedSymbol]) {
      setSelectedSymbol(activeSymbols[0]);
    }
  }, [state?.config?.enabledPairs, state?.marketData, selectedSymbol]);

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

  const formatPriceVal = (price: number, symbol: string) => {
    const decimals = symbol.includes("USD") && !symbol.startsWith("BTC") && !symbol.startsWith("XAU") ? 4 : 2;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  };

  const getPips = (price1: number, price2: number, symbol: string) => {
    const diff = Math.abs(price1 - price2);
    if (symbol.startsWith("BTC")) {
      return `${Math.round(diff)} pips`;
    }
    if (symbol.startsWith("XAU")) {
      return `${Math.round(diff * 10)} pips`;
    }
    return `${Math.round(diff * 10000)} pips`;
  };

  const getTradePipsValue = (trade: Trade) => {
    const entry = trade.entryPrice;
    const exit = trade.status === "CLOSED" && trade.closePrice ? trade.closePrice : trade.currentPrice;
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
  
  // States for on-demand "Generate Signal" AI module
  const [genSymbol, setGenSymbol] = useState<SymbolType>("BTCUSD");
  const [genStrategy, setGenStrategy] = useState<string>("EMA_CROSS");
  const [genTimeframe, setGenTimeframe] = useState<string>("M15");
  const [genLoading, setGenLoading] = useState<boolean>(false);
  const [genResult, setGenResult] = useState<{ action: string; reasoning: string } | null>(null);

  const assetDetails = state.marketData[selectedSymbol];
  const rawChartData = assetDetails?.history || [];

  const getTimeframeMs = (tf: "M1" | "M5" | "M15" | "H1" | "H4" | "D1"): number => {
    const mapping = {
      M1: 1 * 60 * 1000,
      M5: 5 * 60 * 1000,
      M15: 15 * 60 * 1000,
      H1: 60 * 60 * 1000,
      H4: 4 * 60 * 60 * 1000,
      D1: 24 * 60 * 60 * 1000
    };
    return mapping[tf] || 15 * 60 * 1000;
  };

  const intervalMs = getTimeframeMs(selectedTimeframe);
  const nowTime = new Date().getTime();

  // Dynamically aligned chart data to synchronize perfectly with selected timeframe on the x-axis
  const chartData = (() => {
    const hasOKX = realOKXCandles && realOKXCandles.length > 0;
    const baseList = hasOKX ? realOKXCandles : rawChartData;

    if (baseList.length === 0) return [];

    let scaledBars: any[] = [];

    if (hasOKX) {
      scaledBars = baseList.map(bar => ({ ...bar }));
    } else {
      const timeframeScales: Record<"M1" | "M5" | "M15" | "H1" | "H4" | "D1", number> = {
        M1: 0.08,
        M5: 0.25,
        M15: 0.65,
        H1: 1.8,
        H4: 4.2,
        D1: 12.0
      };
      const volScale = timeframeScales[selectedTimeframe] || 1.0;
      const liveClose = assetDetails?.currentPrice || 1000;

      // 1. Reconstruct historical candles continuously walking backwards from current live price
      let currentClose = liveClose;

      for (let i = baseList.length - 1; i >= 0; i--) {
        const rawBar = baseList[i];
        const rawBody = rawBar.close - rawBar.open;
        const bodyChange = rawBody * volScale;
        const open = currentClose - bodyChange;

        const maxVal = Math.max(open, currentClose);
        const minVal = Math.min(open, currentClose);

        const rawMaxBody = Math.max(rawBar.open, rawBar.close);
        const rawMinBody = Math.min(rawBar.open, rawBar.close);

        const high = maxVal + (rawBar.high - rawMaxBody) * volScale;
        const low = minVal - (rawMinBody - rawBar.low) * volScale;

        scaledBars.unshift({
          ...rawBar,
          open,
          high,
          low,
          close: currentClose,
          volume: Math.round(rawBar.volume * (0.3 + 0.7 * volScale))
        });

        if (i > 0) {
          const prevRaw = baseList[i - 1];
          const rawGap = rawBar.open - prevRaw.close;
          currentClose = open - rawGap * volScale;
        }
      }
    }

    // 2. Recompute technical indicators matching the new scaled price path
    const fastPeriod = 9;
    const slowPeriod = 21;
    const rsiPeriod = 14;

    const k5 = 2 / (5 + 1);
    const k40 = 2 / (40 + 1);
    const k3 = 2 / (3 + 1);

    let lastEma5 = scaledBars[0]?.close || 1000;
    let lastEma40 = scaledBars[0]?.close || 1000;
    const hybridRaws: number[] = [];

    for (let i = 0; i < scaledBars.length; i++) {
      const bar = scaledBars[i];

      // Fast SMA
      if (i >= fastPeriod) {
        let sum = 0;
        for (let j = 0; j < fastPeriod; j++) sum += scaledBars[i - j].close;
        bar.smaFast = Number((sum / fastPeriod).toFixed(4));
      } else {
        bar.smaFast = bar.close;
      }

      // Slow SMA
      if (i >= slowPeriod) {
        let sum = 0;
        for (let j = 0; j < slowPeriod; j++) sum += scaledBars[i - j].close;
        bar.smaSlow = Number((sum / slowPeriod).toFixed(4));
      } else {
        bar.smaSlow = bar.close;
      }

      // RSI
      if (i >= rsiPeriod) {
        let gains = 0;
        let losses = 0;
        for (let j = 0; j < rsiPeriod; j++) {
          const diff = scaledBars[i - j].close - scaledBars[i - j - 1].close;
          if (diff > 0) gains += diff;
          else losses -= diff;
        }
        const val = gains + losses === 0 ? 50 : 100 * (gains / (gains + losses));
        bar.rsi = Number(val.toFixed(1));
      } else {
        bar.rsi = 50 + (bar.close % 15) - 7.5;
      }

      // 5 EMA
      let currentEma5 = bar.close;
      if (i > 0) {
        currentEma5 = bar.close * k5 + lastEma5 * (1 - k5);
      }
      bar.ema5 = Number(currentEma5.toFixed(4));
      lastEma5 = currentEma5;

      // 40 EMA
      let currentEma40 = bar.close;
      if (i > 0) {
        currentEma40 = bar.close * k40 + lastEma40 * (1 - k40);
      }
      lastEma40 = currentEma40;

      // 40 WMA
      let currentWma40 = bar.close;
      if (i >= 39) {
        let sum = 0;
        let weightSum = 0;
        for (let j = 0; j < 40; j++) {
          const weight = 40 - j;
          sum += scaledBars[i - j].close * weight;
          weightSum += weight;
        }
        currentWma40 = sum / weightSum;
      }

      const hybridRaw = 0.7 * currentEma40 + 0.3 * currentWma40;
      hybridRaws.push(hybridRaw);
    }

    // Active Line (EMA-3 of hybridRaws)
    let lastActiveEma = hybridRaws[0] || 1000;
    for (let i = 0; i < scaledBars.length; i++) {
      let currentActiveEma = hybridRaws[i];
      if (i > 0) {
        currentActiveEma = hybridRaws[i] * k3 + lastActiveEma * (1 - k3);
      }
      scaledBars[i].activeLine = Number(currentActiveEma.toFixed(4));
      lastActiveEma = currentActiveEma;
    }

    // Alligator Indicators (Jaw = 8, Teeth = 5, Lips = 3 SMMA on Median Price, shifted 5, 3, 2 forward)
    const medianPrices = scaledBars.map(b => (b.high + b.low) / 2);
    const smma8: number[] = [];
    const smma5: number[] = [];
    const smma3: number[] = [];

    // Calculate SMMA 8
    let sum8 = 0;
    for (let i = 0; i < scaledBars.length; i++) {
      if (i < 8) {
        sum8 += medianPrices[i];
        if (i === 7) {
          smma8.push(sum8 / 8);
        } else {
          smma8.push(medianPrices[i]);
        }
      } else {
        const prev = smma8[i - 1];
        smma8.push((prev * 7 + medianPrices[i]) / 8);
      }
    }

    // Calculate SMMA 5
    let sum5 = 0;
    for (let i = 0; i < scaledBars.length; i++) {
      if (i < 5) {
        sum5 += medianPrices[i];
        if (i === 4) {
          smma5.push(sum5 / 5);
        } else {
          smma5.push(medianPrices[i]);
        }
      } else {
        const prev = smma5[i - 1];
        smma5.push((prev * 4 + medianPrices[i]) / 5);
      }
    }

    // Calculate SMMA 3
    let sum3 = 0;
    for (let i = 0; i < scaledBars.length; i++) {
      if (i < 3) {
        sum3 += medianPrices[i];
        if (i === 2) {
          smma3.push(sum3 / 3);
        } else {
          smma3.push(medianPrices[i]);
        }
      } else {
        const prev = smma3[i - 1];
        smma3.push((prev * 2 + medianPrices[i]) / 3);
      }
    }

    // Set shifted Alligator values
    for (let i = 0; i < scaledBars.length; i++) {
      const jawIdx = i - 5;
      scaledBars[i].alligatorJaw = jawIdx >= 0 ? Number(smma8[jawIdx].toFixed(5)) : Number(medianPrices[i].toFixed(5));

      const teethIdx = i - 3;
      scaledBars[i].alligatorTeeth = teethIdx >= 0 ? Number(smma5[teethIdx].toFixed(5)) : Number(medianPrices[i].toFixed(5));

      const lipsIdx = i - 2;
      scaledBars[i].alligatorLips = lipsIdx >= 0 ? Number(smma3[lipsIdx].toFixed(5)) : Number(medianPrices[i].toFixed(5));
    }

    if (hasOKX) {
      return scaledBars;
    }

    // 3. Attach matching timestamps (only for fallback simulation)
    return scaledBars.map((d, index) => {
      const reversedIndex = scaledBars.length - 1 - index;
      const adjustedTime = new Date(nowTime - reversedIndex * intervalMs).toISOString();
      return {
        ...d,
        time: adjustedTime
      };
    });
  })();

  // Prepared data for candlestick chart representation with always-ascending body values for Recharts layout stability
  const preparedCandleData = chartData.map((d) => {
    const isUp = d.close >= d.open;
    return {
      ...d,
      wick: [d.low, d.high],
      body: [Math.min(d.open, d.close), Math.max(d.open, d.close)],
      isUp
    };
  });

  const getTradingViewSymbol = (symbol: SymbolType): string => {
    const mapping: Record<SymbolType, string> = {
      // Forex
      EURUSD: "FX:EURUSD",
      GBPUSD: "FX:GBPUSD",
      USDJPY: "FX:USDJPY",
      AUDUSD: "FX:AUDUSD",
      // Crypto
      BTCUSD: "COINBASE:BTCUSD",
      ETHUSD: "COINBASE:ETHUSD",
      SOLUSD: "COINBASE:SOLUSD",
      BNBUSD: "BINANCE:BNBUSD",
      // Stocks
      AAPL: "NASDAQ:AAPL",
      TSLA: "NASDAQ:TSLA",
      MSFT: "NASDAQ:MSFT",
      NVDA: "NASDAQ:NVDA",
      // Commodities
      XAUUSD: "OANDA:XAUUSD",
      USOIL: "TVC:USOIL",
      XAGUSD: "OANDA:XAGUSD",
      NGAS: "TVC:NATURALGAS",
      // Indices
      SPX500: "OANDA:SPX500USD",
      NDX100: "OANDA:NAS100USD",
      DJI30: "TVC:DJI",
      GER40: "OANDA:DE30EUR"
    };
    return mapping[symbol] || symbol;
  };

  const getTradingViewInterval = (tf: "M1" | "M5" | "M15" | "H1" | "H4" | "D1"): string => {
    const mapping = {
      M1: "1",
      M5: "5",
      M15: "15",
      H1: "60",
      H4: "240",
      D1: "D"
    };
    return mapping[tf] || "15";
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-900 rounded-lg p-3 shadow-2xl font-mono text-[11px] text-zinc-500 dark:text-zinc-350 space-y-1.5">
          <p className="font-sans font-black text-slate-850 dark:text-zinc-400 border-b border-gray-100 dark:border-zinc-900 pb-1 mb-1 shadow-sm">
            {new Date(data.time).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div>Open: <span className="text-slate-900 dark:text-white font-bold">${data.open?.toLocaleString()}</span></div>
            <div>Close: <span className="text-slate-900 dark:text-white font-bold">${data.close?.toLocaleString()}</span></div>
            <div>High: <span className="text-emerald-500 font-bold">${data.high?.toLocaleString()}</span></div>
            <div>Low: <span className="text-rose-500 font-bold">${data.low?.toLocaleString()}</span></div>
          </div>
          {(data.ema5 !== undefined || data.activeLine !== undefined) && (
            <div className="border-t border-gray-100 dark:border-zinc-900/60 pt-1.5 mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px5]">
              <div className="text-yellow-600 dark:text-yellow-400">5 EMA: <span className="font-bold">${data.ema5?.toFixed(2)}</span></div>
              <div className="text-orange-600 dark:text-orange-400">Active Line: <span className="font-bold">${data.activeLine?.toFixed(2)}</span></div>
            </div>
          )}
          {(data.smaFast || data.smaSlow) && (
            <div className="border-t border-gray-100 dark:border-zinc-900/60 pt-1.5 mt-1 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px5]">
              <div className="text-sky-600 dark:text-sky-400">SMA Fast (9): <span className="font-bold">${data.smaFast?.toFixed(2)}</span></div>
              <div className="text-amber-600 dark:text-amber-400">SMA Slow (21): <span className="font-bold">${data.smaSlow?.toFixed(2)}</span></div>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Sparkline generator for watchlist elements
  const getWatchlistSparklineValues = (sym: SymbolType) => {
    const historicalSeries = state.marketData[sym]?.history || [];
    if (historicalSeries.length > 0) {
      return historicalSeries.slice(-8).map(h => h.close);
    }
    // Fallback static series curves for aesthetic precision
    const seriesMap: Partial<Record<SymbolType, number[]>> = {
      BTCUSD: [72100, 72340, 72050, 72280, 72600, 72350, 72580, 72448],
      EURUSD: [1.0890, 1.0872, 1.0885, 1.0860, 1.0854, 1.0862, 1.0848, 1.0854],
      GBPUSD: [1.2650, 1.2662, 1.2645, 1.2670, 1.2665, 1.2680, 1.2675, 1.2682],
      AAPL: [176.20, 177.10, 176.80, 177.50, 178.10, 177.40, 178.20, 178.43],
      SPX500: [5195.40, 5204.10, 5194.80, 5203.20, 5213.90, 5201.10, 5213.10, 5210.54],
      XAUUSD: [2162.0, 2168.5, 2164.0, 2171.2, 2175.0, 2172.5, 2180.1, 2178.6]
    };
    return seriesMap[sym] || [100, 102, 101, 104, 103, 106, 105, 107];
  };

  const Sparkline = ({ values, color }: { values: number[]; color: string }) => {
    const width = 56;
    const height = 16;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min === 0 ? 1 : max - min;
    const points = values
      .map((val, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((val - min) / range) * height;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg width={width} height={height} className="overflow-visible">
        <polyline
          fill="none"
          stroke={color}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  };

  // Summary indicators based on Active Positions Holdings
  const activeHoldings = state.trades.filter((t) => t.status === "OPEN");
  const openTrades = activeHoldings;
  const closedTrades = activeHoldings;
  const floatingPnL = activeHoldings.reduce((sum, t) => sum + t.pnl, 0);

  const winsLimit = activeHoldings.filter((t) => t.pnl >= 0).length;
  const lossesLimit = activeHoldings.filter((t) => t.pnl < 0).length;
  const winRate = activeHoldings.length > 0 ? ((winsLimit / activeHoldings.length) * 100).toFixed(1) : "0.0";

  // KPIs screenshot alignment calculations
  const realizedPnL = floatingPnL;
  const unrealizedPnL = floatingPnL;
  const originalBalance = state.config.balance;
  const isInfinite = originalBalance >= 999999999999;
  const capitalNowLive = originalBalance + realizedPnL + unrealizedPnL;
  const isLiveGain = capitalNowLive >= originalBalance;
  const netChangeAmount = realizedPnL + unrealizedPnL;
  const netChangePercent = (originalBalance > 0 && !isInfinite) ? (netChangeAmount / originalBalance) * 100 : 0;
  const isNetGain = netChangeAmount >= 0;

  const avgPnL = activeHoldings.length > 0 ? realizedPnL / activeHoldings.length : 0;
  const negativeClosedTrades = activeHoldings.filter(t => t.pnl < 0);
  const worstLossVal = negativeClosedTrades.length > 0 ? Math.min(...negativeClosedTrades.map(t => t.pnl)) : 0;

  // Advanced Protection & Performance metrics
  const totalWinAmount = activeHoldings.filter(t => t.pnl > 0).reduce((sum, t) => sum + t.pnl, 0);
  const totalLossAmount = Math.abs(activeHoldings.filter(t => t.pnl < 0).reduce((sum, t) => sum + t.pnl, 0));
  const profitFactor = totalLossAmount > 0 
    ? (totalWinAmount / totalLossAmount).toFixed(2) 
    : totalWinAmount > 0 
      ? "∞" 
      : "1.00";

  const dailyDrawdownLimitAmount = state.config.balance * ((state.config.maxDailyDrawdown || 5) / 100);
  const netDrawdownPnL = (realizedPnL < 0 ? realizedPnL : 0) + (floatingPnL < 0 ? floatingPnL : 0);
  const drawdownUsedPercentage = netDrawdownPnL < 0 
    ? Math.min(100, (Math.abs(netDrawdownPnL) / Math.max(1, dailyDrawdownLimitAmount)) * 100) 
    : 0;

  const activeMarginUsed = openTrades.reduce((sum, t) => {
    const lev = state.config.leverage || 100;
    return sum + (t.size * t.entryPrice) / lev;
  }, 0);
  const marginUtilizationRatio = state.config.balance > 0 ? Math.min(100, (activeMarginUsed / state.config.balance) * 105).toFixed(1) : "0.0";

  const executedSignalsCount = state.signals.filter(s => s.status === "EXECUTED").length;
  const totalSignalsCount = state.signals.length;
  const executionYield = totalSignalsCount > 0 ? Math.round((executedSignalsCount / totalSignalsCount) * 100) : 85;

  // Find latest signal
  const latestSignal: TradingSignal | undefined = state.signals[0];

  // Callback to trigger generate AI signal
  const handleGenerateSignal = async () => {
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await fetch("/api/ai/generate-signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symbol: genSymbol,
          strategyId: genStrategy,
          timeframe: genTimeframe
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGenResult({
          action: data.decision,
          reasoning: data.reasoning
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenLoading(false);
    }
  };

  const getWatchlistFullName = (sym: SymbolType) => {
    const names: Record<string, string> = {
      EURUSD: "Euro / USD",
      GBPUSD: "Pound Sterling / USD",
      USDJPY: "US Dollar / Japanese Yen",
      AUDUSD: "Australian Dollar / USD",
      BTCUSD: "Bitcoin / USD",
      ETHUSD: "Ethereum / USD",
      SOLUSD: "Solana / USD",
      BNBUSD: "BNB / USD",
      AAPL: "Apple Inc.",
      TSLA: "Tesla Inc.",
      MSFT: "Microsoft Corp.",
      NVDA: "NVIDIA Corp.",
      XAUUSD: "Gold Spot / USD",
      USOIL: "Crude Oil Brent",
      XAGUSD: "Silver Spot / USD",
      NGAS: "Natural Gas Spot",
      SPX500: "S&P 500 Index",
      NDX100: "NASDAQ 100 Index",
      DJI30: "Dow Jones 30 Index",
      GER40: "DAX 40 Index"
    };
    return names[sym] || sym;
  };

  const secondaryNavigationTabs = [
    "Overview",
    "Analytics",
    "Signals",
    "Entry Qualification",
    "Dynamic Exit Engine",
    "Journal",
    "AI Insights",
    "Market Scanner",
    "BTCUSD Co-Pilot"
  ];

  // Map tabs clicks to synchronize submenus
  const handleTabClick = (tab: string) => {
    setSecondaryTab(tab);
    if (onSwitchSubMenu) {
      if (tab === "Overview") {
        onSwitchSubMenu("all");
      } else if (tab === "Analytics") {
        onSwitchSubMenu("terminal");
      } else if (tab === "Signals" || tab === "AI Insights") {
        onSwitchSubMenu("analyzer");
      }
    }
  };

  return (
    <div id="dashboard-area-panel" className="space-y-6 select-none animate-fadeIn">
      
      {/* 1. SECONDARY HORIZONTAL TABBED MENU */}
      <div className="flex border-b border-gray-200 dark:border-zinc-800/80 gap-6 select-none overflow-x-auto pb-0.5">
        {secondaryNavigationTabs.map((tab) => {
          const isCurrentActive = secondaryTab === tab;
          return (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`py-2 px-1 text-xs font-bold font-sans cursor-pointer transition-all relative border-b-2 whitespace-nowrap ${
                isCurrentActive
                  ? "border-[#5B4CFF] text-[#5B4CFF] dark:text-indigo-400 font-extrabold"
                  : "border-transparent text-[#6B7280] dark:text-zinc-550 hover:text-[#5B4CFF] dark:hover:text-zinc-250"
              }`}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {secondaryTab !== "Overview" ? (
        <DashboardSubTabs 
          state={state} 
          activeTab={secondaryTab} 
          selectedSymbol={selectedSymbol} 
          setSelectedSymbol={setSelectedSymbol}
          onOpenTradeModal={onOpenTradeModal}
          onUpdateConfig={onUpdateConfig}
        />
      ) : (
        <>
          {/* 2. HIGH-DENSITY MARKET WATCHLIST ROWS WITH REAL SVGs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 select-none">
        {(Object.keys(state.marketData) as SymbolType[])
          .filter((sym) => !!state.config.enabledPairs?.[sym])
          .map((sym) => {
            const item = state.marketData[sym];
          const isSelected = selectedSymbol === sym;
          const isUp = item.dailyChange >= 0;
          const sparklineValues = getWatchlistSparklineValues(sym);

          return (
            <div
              key={sym}
              onClick={() => {
                setSelectedSymbol(sym);
                setGenSymbol(sym);
              }}
              className={`flex flex-col text-left rounded-xl p-3 border cursor-pointer transition-all duration-200 hover:shadow-md ${
                isSelected
                  ? "bg-white dark:bg-zinc-900 border-[#5B4CFF] ring-1 ring-[#5B4CFF]/25 shadow-sm"
                  : "bg-white dark:bg-zinc-950/40 border-gray-200 dark:border-zinc-900/60 hover:border-gray-300 dark:hover:border-zinc-800"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                    sym === "BTCUSD" ? "bg-amber-100 text-amber-700" :
                    sym === "XAUUSD" ? "bg-yellow-100 text-yellow-700" :
                    sym === "EURUSD" ? "bg-blue-100 text-blue-700" :
                    sym === "GBPUSD" ? "bg-indigo-100 text-indigo-700" :
                    sym === "AAPL" ? "bg-slate-100 text-slate-700" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {sym.substring(0, 3)}
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-850 dark:text-zinc-300 leading-none truncate">{sym}</span>
                </div>
                <span
                  className={`text-[9.5px] font-mono font-bold px-1 rounded-sm leading-none ${
                    isUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/15 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/15 dark:text-rose-400"
                  }`}
                >
                  {isUp ? "+" : ""}
                  {item.dailyChange}%
                </span>
              </div>
              
              <div className="flex items-end justify-between mt-2">
                <div>
                  <span className="font-sans text-sm font-black text-slate-900 dark:text-white block tracking-tight">
                    {item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: sym.includes("USD") && !sym.startsWith("XAU") && !sym.startsWith("BTC") ? 4 : 2 })}
                  </span>
                  <span className="text-[9.5px] text-[#6B7280] dark:text-zinc-500 mt-0.5 truncate max-w-[85px] block leading-none">{getWatchlistFullName(sym)}</span>
                </div>
                <div className="shrink-0 pb-0.5">
                  <Sparkline values={sparklineValues} color={isUp ? "#22C55E" : "#EF4444"} />
                </div>
              </div>
            </div>
          );
        })}

        {/* 7th watch item element: placeholder visual overview button card */}
        <div 
          onClick={() => onNavigate && onNavigate("Timeframe Analysis")}
          className="rounded-xl border border-gray-250 dark:border-zinc-900 bg-white/70 dark:bg-zinc-950/20 p-3.5 flex flex-col justify-between hover:bg-slate-50 dark:hover:bg-zinc-900/30 transition cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">Live Scanners</span>
            <Globe className="h-3 w-3 text-slate-400" />
          </div>
          <p className="text-[10px] text-slate-600 dark:text-zinc-500 leading-normal">
            18 core pairs streaming...
          </p>
          <span className="text-[10px] font-bold text-[#5B4CFF] dark:text-indigo-400 flex items-center justify-between mt-1">
            <span>View All Assets</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>

      {/* 3. KPI METRICS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-4 select-none">
        
        {/* KPI 0: Initial Capital */}
        <div className="bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-900 p-3.5 rounded-xl hover:shadow-sm duration-150">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Initial Capital</span>
          <span className="text-lg font-black text-slate-900 dark:text-white block mt-1 leading-tight">
            {isInfinite ? "Infinite (∞)" : `$${originalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
          <span className="text-[9px] text-[#6B7280] dark:text-zinc-500 font-medium block mt-1 leading-none">Trading capital (USD)</span>
        </div>

        {/* KPI 1: Capital Allocated / Now */}
        <div className="bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-900 p-3.5 rounded-xl hover:shadow-sm duration-150">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Capital (Live)</span>
          <span className="text-lg font-black text-slate-900 dark:text-white block mt-1 leading-tight">
            {isInfinite ? "Infinite (∞)" : `$${capitalNowLive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          </span>
          <span className={`text-[9px] font-mono font-bold block mt-1 leading-none ${isNetGain ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-455"}`}>
            {isNetGain ? "+" : ""}${netChangeAmount.toFixed(2)} {isInfinite ? "" : `(${netChangePercent >= 0 ? "+" : ""}${netChangePercent.toFixed(1)}%)`}
          </span>
        </div>

        {/* KPI 2: Win Rate */}
        <div className="bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-900 p-3.5 rounded-xl hover:shadow-sm duration-150">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Win Rate</span>
          <span className="text-lg font-black text-[#5B4CFF] dark:text-indigo-400 block mt-1 leading-tight">{winRate}%</span>
          <span className="text-[9px] text-[#6B7280] dark:text-zinc-500 font-medium block mt-1 leading-none">Based on {closedTrades.length + openTrades.length} trades</span>
        </div>

        {/* KPI 3: Total Trades */}
        <div className="bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-900 p-3.5 rounded-xl hover:shadow-sm duration-150">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Total Trades</span>
          <span className="text-lg font-black text-slate-900 dark:text-white block mt-1 leading-tight">{state.trades.length}</span>
          <span className="text-[9px] text-[#6B7280] dark:text-zinc-500 font-medium block mt-1 leading-none">{closedTrades.length} closed / {openTrades.length} open</span>
        </div>

        {/* KPI 4: Avg PnL */}
        <div className="bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-900 p-3.5 rounded-xl hover:shadow-sm duration-155">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Avg PnL</span>
          <span className={`text-lg font-black block mt-1 leading-tight ${avgPnL >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-500"}`}>
            {avgPnL >= 0 ? "+" : "-"}${Math.abs(avgPnL).toFixed(2)}
          </span>
          <span className="text-[9px] text-[#6B7280] dark:text-zinc-500 font-medium block mt-1 leading-none">Realized per session</span>
        </div>

        {/* KPI 5: Profit Factor */}
        <div className="bg-white dark:bg-zinc-950/40 border border-gray-200 dark:border-zinc-900 p-3.5 rounded-xl hover:shadow-sm duration-150">
          <span className="text-[10px] font-semibold text-slate-500 dark:text-zinc-500 uppercase tracking-wider block">Profit Factor</span>
          <span className="text-lg font-black text-amber-500 dark:text-amber-400 block mt-1 leading-tight">{profitFactor}</span>
          <span className="text-[9px] text-[#6B7280] dark:text-zinc-500 font-medium block mt-1 leading-none">Net Win/Loss ratio</span>
        </div>

        {/* KPI 6: Customize settings gear */}
        <div 
          onClick={() => onNavigate && onNavigate("Settings")}
          className="rounded-xl border border-gray-250 dark:border-zinc-900 bg-slate-50 dark:bg-zinc-950/20 p-3.5 flex flex-col justify-between hover:bg-slate-100 dark:hover:bg-zinc-900/30 transition cursor-pointer"
        >
          <div className="mx-auto my-auto flex items-center justify-center gap-2">
            <Settings className="h-4 w-4 text-slate-500 animate-spin-slow" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-zinc-400 font-sans">Customize</span>
          </div>
        </div>
      </div>

      {/* 4. SPLIT LAYOUT (70% Left Section, 30% Right Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        
        {/* ======================================= LEFT SECTION (70%) ======================================= */}
        <div className="lg:col-span-1 lg:col-span-7 space-y-6">
          
          {/* Main Chart Terminal */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-5 space-y-4">
            
            {/* Header controls for symbol, interval, candle vs tradingview, and timeframe tabs */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 dark:border-zinc-900/80 pb-3 gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-sans font-extrabold text-[#111827] dark:text-white leading-none text-base">{selectedSymbol} Market Analytical Terminal</span>
                <span className="p-1 px-1.5 bg-indigo-50 dark:bg-emerald-950/30 text-indigo-700 dark:text-emerald-400 rounded text-[9px] font-mono uppercase tracking-wide border border-indigo-100 dark:border-emerald-900/10 leading-none">
                  {chartType === "tradingview" ? "TradingView Live" : `${selectedTimeframe} ${chartType === "candle" ? "Candles" : "Line"}`}
                </span>
                <span className="p-1 px-1.5 bg-gray-50 dark:bg-amber-950/20 text-[#6B7280] dark:text-amber-400 rounded text-[9px] font-mono leading-none border border-gray-100 dark:border-amber-900/10">
                  IST Timeframe (UTC+5:30)
                </span>
                {symbolToOKXId[selectedSymbol] && (
                  <span className={`p-1 px-1.5 rounded text-[9px] font-mono leading-none border transition-all ${
                    candlesLoading
                      ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/10 animate-pulse"
                      : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-450 border-emerald-100 dark:border-emerald-900/10"
                  }`}>
                    {candlesLoading ? "Syncing OKX..." : "OKX Feed Active"}
                  </span>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                {/* Candle / Line / TV switcher */}
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-zinc-900 p-0.5 bg-white dark:bg-zinc-950/80 text-[10px5]">
                  {(["candle", "line", "tradingview"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setChartType(type)}
                      className={`py-1 px-2.5 font-sans font-bold rounded-md capitalize transition-all cursor-pointer ${
                        chartType === type
                          ? "bg-[#5B4CFF] text-white"
                          : "text-slate-500 dark:text-zinc-550 hover:text-slate-800 dark:hover:text-zinc-350"
                      }`}
                    >
                      {type === "tradingview" ? "TradingView" : type}
                    </button>
                  ))}
                </div>

                {/* Absolutely positioned absolute intervals picker */}
                <div className="inline-flex rounded-lg border border-gray-200 dark:border-zinc-900 p-0.5 bg-white dark:bg-zinc-950/80 text-[10px5]">
                  {(["M1", "M5", "M15", "H1", "H4", "D1"] as const).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setSelectedTimeframe(tf)}
                      className={`py-1 px-2.5 font-bold rounded-md transition-all cursor-pointer ${
                        selectedTimeframe === tf
                          ? "bg-[#5B4CFF]/10 text-[#5B4CFF]"
                          : "text-slate-500 dark:text-zinc-550 hover:text-slate-800 dark:hover:text-zinc-350"
                      }`}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* MONOSPACE LIVE O-H-L-C BAR FOR TRADING ACCURACY */}
            {(() => {
              const activeCandle = hoveredCandle || (chartData && chartData.length > 0 ? chartData[chartData.length - 1] : null);
              if (!activeCandle) {
                return (
                  <div className="p-2.5 border border-gray-150 dark:border-zinc-900 rounded-lg bg-slate-50 dark:bg-zinc-950/80 text-[11px] font-mono text-[#6B7280]">
                    Loading market data...
                  </div>
                );
              }

              const { open, high, low, close, volume } = activeCandle;
              const isCloseUp = close >= open;
              const diff = close - open;
              const diffPercent = open > 0 ? (diff / open) * 100 : 0;
              const isUnchanged = Math.abs(diff) < 0.000001;

              const formatVal = (val: number) => {
                const decimals = selectedSymbol.includes("USD") && !selectedSymbol.startsWith("BTC") && !selectedSymbol.startsWith("XAU") ? 4 : 2;
                return val.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
              };

              const formatVol = (vol?: number) => {
                if (vol === undefined) return "2.41M";
                if (vol >= 1000000) return `${(vol / 1000000).toFixed(2)}M`;
                if (vol >= 1000) return `${(vol / 1000).toFixed(1)}K`;
                return vol.toLocaleString();
              };

              return (
                <div className="p-2.5 border border-gray-150 dark:border-zinc-900 rounded-lg bg-slate-50 dark:bg-zinc-950/80 flex flex-wrap items-center justify-between text-[11px] font-mono font-medium leading-none gap-2 select-none">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-zinc-500 dark:text-zinc-400">O: <span className="text-slate-900 dark:text-zinc-200 font-bold">{formatVal(open)}</span></span>
                    <span className="text-zinc-500 dark:text-zinc-400">H: <span className="text-slate-900 dark:text-zinc-200 font-bold text-emerald-500 dark:text-emerald-400">{formatVal(high)}</span></span>
                    <span className="text-zinc-500 dark:text-zinc-400">L: <span className="text-slate-900 dark:text-zinc-200 font-bold text-rose-500 dark:text-rose-400">{formatVal(low)}</span></span>
                    <span className="text-zinc-500 dark:text-zinc-400">C: <span className="text-slate-900 dark:text-zinc-200 font-bold">{formatVal(close)}</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold ${isUnchanged ? "text-zinc-400" : isCloseUp ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-450"}`}>
                      {diff >= 0 ? "+" : ""}{formatVal(diff)} ({diffPercent >= 0 ? "+" : ""}{diffPercent.toFixed(2)}%)
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">&middot; Volume: <span className="text-slate-900 dark:text-zinc-200 font-bold">{formatVol(volume)}</span></span>
                    {hoveredCandle && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-sans font-black tracking-widest uppercase">
                        Hov
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Price Tracking Recharts Grid */}
            <div className="h-80 sm:h-96 w-full select-none rounded-lg p-1">
              {chartType === "tradingview" ? (
                <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-zinc-900 bg-white dark:bg-black">
                  <iframe
                     key={`${selectedSymbol}-${selectedTimeframe}`}
                     id={`tradingview-${selectedSymbol}-${selectedTimeframe}`}
                     title="TradingView Real-time Widget"
                     src={`https://s.tradingview.com/widgetembed/?frameElementId=tradingview_chart&symbol=${getTradingViewSymbol(selectedSymbol)}&interval=${getTradingViewInterval(selectedTimeframe)}&theme=${theme === "light" ? "light" : "dark"}&style=1&timezone=Asia%2FKolkata`}
                     style={{ width: "100%", height: "100%", border: "none" }}
                     referrerPolicy="no-referrer"
                  />
                </div>
              ) : chartType === "candle" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={preparedCandleData} 
                    margin={{ top: 10, right: 5, left: 5, bottom: 5 }}
                    onMouseMove={(e: any) => {
                      if (e && e.activePayload && e.activePayload.length > 0) {
                        setHoveredCandle(e.activePayload[0].payload);
                      } else {
                        setHoveredCandle(null);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredCandle(null);
                    }}
                  >
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      vertical={true} 
                      horizontal={true} 
                      stroke={theme === "light" ? "rgba(226, 232, 240, 0.7)" : "rgba(39, 39, 42, 0.35)"} 
                    />
                    <XAxis
                      dataKey="time"
                      tickFormatter={(t) => {
                        const d = new Date(t);
                        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
                      }}
                      tick={{ fill: theme === "light" ? "#64748b" : "#a1a1aa", fontSize: 10 }}
                      axisLine={{ stroke: theme === "light" ? "#cbd5e1" : "#27272a" }}
                      tickLine={{ stroke: theme === "light" ? "#cbd5e1" : "#27272a" }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: theme === "light" ? "#64748b" : "#a1a1aa", fontSize: 10 }}
                      axisLine={{ stroke: theme === "light" ? "#cbd5e1" : "#27272a" }}
                      tickLine={{ stroke: theme === "light" ? "#cbd5e1" : "#27272a" }}
                      orientation="right"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    
                    {/* Integrated custom professional body + wick candlestick drawing */}
                    <Bar 
                      dataKey="body" 
                      shape={<Candlestick />} 
                      maxBarSize={12}
                    />
                    
                    {/* Indicators lines */}
                    <Line name="5 EMA" type="monotone" dataKey="ema5" stroke="#eab308" strokeWidth={2} dot={false} />
                    <Line name="Active Line (40)" type="monotone" dataKey="activeLine" stroke="#f97316" strokeWidth={2} dot={false} />
                    <Line name="SMA Fast (9)" type="monotone" dataKey="smaFast" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="3 3" dot={false} />
                    <Line name="SMA Slow (21)" type="monotone" dataKey="smaSlow" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
                    <Line name="Alligator Jaw" type="monotone" dataKey="alligatorJaw" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    <Line name="Alligator Teeth" type="monotone" dataKey="alligatorTeeth" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                    <Line name="Alligator Lips" type="monotone" dataKey="alligatorLips" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 5, left: 5, bottom: 5 }}>
                    <XAxis
                      dataKey="time"
                      tickFormatter={(t) => {
                        const d = new Date(t);
                        return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Kolkata" });
                      }}
                      tick={{ fill: "#71717a", fontSize: 10 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={{ stroke: "#e2e8f0" }}
                    />
                    <YAxis
                      domain={["auto", "auto"]}
                      tick={{ fill: "#71717a", fontSize: 10 }}
                      axisLine={{ stroke: "#e2e8f0" }}
                      tickLine={{ stroke: "#e2e8f0" }}
                      orientation="right"
                    />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "8px" }}
                      labelStyle={{ color: "#71717a", fontSize: "11px", fontWeight: "bold" }}
                      itemStyle={{ fontSize: "11px" }}
                      labelFormatter={(t) => new Date(t).toLocaleString("en-US", { timeZone: "Asia/Kolkata" }) + " IST"}
                    />
                    <Line name="Close Price" type="monotone" dataKey="close" stroke="#5B4CFF" strokeWidth={2.2} dot={false} activeDot={{ r: 4 }} />
                    <Line name="5 EMA" type="monotone" dataKey="ema5" stroke="#eab308" strokeWidth={1.5} dot={false} />
                    <Line name="Active Line (40)" type="monotone" dataKey="activeLine" stroke="#f97316" strokeWidth={1.5} dot={false} />
                    <Line name="Alligator Jaw" type="monotone" dataKey="alligatorJaw" stroke="#3b82f6" strokeWidth={1.5} dot={false} />
                    <Line name="Alligator Teeth" type="monotone" dataKey="alligatorTeeth" stroke="#ef4444" strokeWidth={1.5} dot={false} />
                    <Line name="Alligator Lips" type="monotone" dataKey="alligatorLips" stroke="#10b981" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* RSI Sub-chart indicator */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-550 uppercase tracking-wider block">Relative Strength Index (RSI 14)</span>
              <div className="h-20 w-full bg-slate-50/50 dark:bg-zinc-950/60 rounded-lg p-1 border border-gray-150 dark:border-zinc-900/55">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 2, right: 10, left: 10, bottom: 2 }}>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={[0, 100]} ticks={[30, 70]} hide />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", borderRadius: "6px" }}
                      itemStyle={{ fontSize: "10px" }}
                      labelFormatter={() => "RSI Analysis"}
                    />
                    <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" label={{ value: 'OB 70', fill: '#ef4444', fontSize: 8, position: 'insideTopRight' }} />
                    <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'OS 30', fill: '#10b981', fontSize: 8, position: 'insideBottomRight' }} />
                    <Area name="RSI Level" type="monotone" dataKey="rsi" stroke="#5B4CFF" fill="rgba(91, 76, 255, 0.04)" strokeWidth={1.5} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Active Positions Operations Card */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900/80 pb-3">
              <div>
                <h4 className="font-sans font-extrabold text-[#111827] dark:text-white leading-none text-base">Active Operational Positions</h4>
                <p className="text-[11px] text-[#6B7280] dark:text-zinc-400 mt-1.5 font-sans leading-none">Immediate active orders generated by strategies or manually placed.</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 font-mono text-[11px] font-bold leading-none">
                {openTrades.length} Positions open
              </span>
            </div>

            {openTrades.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-dashed border-gray-200 dark:border-zinc-900 bg-slate-50/20 dark:bg-zinc-900/10">
                <AlertCircle className="h-8 w-8 text-slate-400 mb-2" />
                <span className="text-xs font-bold text-slate-500 dark:text-zinc-400">No active trades running</span>
                <p className="text-[10.5px] text-slate-400 dark:text-zinc-500 mt-1">Place manual orders or toggle automated triggers from Strategies.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[750px]">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-zinc-900 font-sans text-[11px] font-semibold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Ticket</th>
                      <th className="py-2.5 px-3">Symbol</th>
                      <th className="py-2.5 px-3">Side</th>
                      <th className="py-2.5 px-3">Strategy</th>
                      <th className="py-2.5 px-3">Volume</th>
                      <th className="py-2.5 px-3">Entry</th>
                      <th className="py-2.5 px-3">Current</th>
                      <th className="py-2.5 px-3 text-right">PnL (USD)</th>
                      <th className="py-2.5 px-3 text-center">Operation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-900 font-mono text-xs text-slate-800 dark:text-zinc-300">
                    {openTrades.map((trade) => {
                      const profitIsPositive = trade.pnl >= 0;
                      const tradeKey = trade.id || `trd-fallback-${Math.random().toString(36).substring(2, 9)}`;
                      return (
                        <tr key={tradeKey} className="hover:bg-slate-50 dark:hover:bg-zinc-900/20 transition-colors">
                          <td className="py-3 px-3 text-slate-400">#{trade.id ? trade.id.substring(0, 6) : "N/A"}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{trade.symbol}</td>
                          <td className="py-3 px-3">
                            <span className={`inline-flex px-1.5 py-0.5 rounded font-black text-[9.5px] leading-none ${
                              trade.type === "BUY" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/10 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-950/10 dark:text-rose-400"
                            }`}>
                              {trade.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-zinc-400">
                            {trade.strategyName || (trade.strategyId === "MANUAL" ? "Manual Setup" : "Standard Engine")}
                          </td>
                          <td className="py-3 px-3">{trade.size} Lots</td>
                          <td className="py-3 px-3">{formatPriceVal(trade.entryPrice, trade.symbol)}</td>
                          <td className="py-3 px-3">{formatPriceVal(trade.currentPrice, trade.symbol)}</td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className={`text-xs font-extrabold ${profitIsPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                {profitIsPositive ? "+" : ""}${trade.pnl.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </span>
                              <span className={`text-[9.5px] font-bold mt-0.5 ${getTradePipsValue(trade) >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                {getTradePipsFormatted(trade)}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <button
                              onClick={() => onCloseTrade(trade.id)}
                              className="px-2 py-1 text-[10px] font-bold font-sans rounded bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400 transition-all cursor-pointer"
                            >
                              Close
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ======================================= RIGHT SECTION (30%) ======================================= */}
        <div className="lg:col-span-1 lg:col-span-3 space-y-6">
          {/* LATEST NEWS PANEL (Exactly Replicating Tesla, apple and Meta layout style) */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-5 space-y-4 shadow-sm select-none">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <BookMarked className="h-4 w-4 text-[#5B4CFF] dark:text-indigo-400" />
                Latest NEWS
              </span>
              <span className="text-[9.5px] font-mono text-slate-400">Just updated</span>
            </div>

            <div className="space-y-4 select-none">
              {(() => {
                const enabledPairs = state?.config?.enabledPairs || {};
                let selectedAssets = Object.keys(enabledPairs).filter((sym) => !!enabledPairs[sym as SymbolType]) as SymbolType[];
                
                if (selectedAssets.length === 0) {
                  selectedAssets = ["BTCUSD", "ETHUSD", "EURUSD", "GBPUSD", "USDJPY", "SOLUSD"];
                }

                const newsList: IntelligenceNewsItem[] = [];
                const maxArticles = 6;
                const newsByAsset = selectedAssets.map(sym => INTELLIGENCE_NEWS_MAP[sym] || []);
                const maxLen = Math.max(...newsByAsset.map(arr => arr.length), 0);

                for (let r = 0; r < maxLen; r++) {
                  for (let c = 0; c < newsByAsset.length; c++) {
                    const item = newsByAsset[c][r];
                    if (item && newsList.length < maxArticles) {
                      if (!newsList.some(n => n.title === item.title)) {
                        newsList.push(item);
                      }
                    }
                  }
                }

                if (newsList.length < maxArticles) {
                  const allKeys = Object.keys(INTELLIGENCE_NEWS_MAP) as SymbolType[];
                  for (let r = 0; r < 5; r++) {
                    for (const key of allKeys) {
                      if (newsList.length >= maxArticles) break;
                      const items = INTELLIGENCE_NEWS_MAP[key] || [];
                      if (items[r]) {
                        const item = items[r];
                        if (!newsList.some(n => n.title === item.title)) {
                          newsList.push(item);
                        }
                      }
                    }
                  }
                }

                return newsList.map((item, idx) => {
                  const isGenericOrUnstable = 
                    !item.link ||
                    item.link === "https://www.reuters.com/" || 
                    item.link === "https://www.reuters.com" || 
                    item.link === "https://www.bloomberg.com/" || 
                    item.link === "https://www.bloomberg.com" || 
                    item.link === "https://www.wsj.com/" || 
                    item.link === "https://www.wsj.com" || 
                    item.link === "https://www.coindesk.com/" || 
                    item.link === "https://www.coindesk.com" ||
                    item.link.includes("companies/") ||
                    item.link.includes("quote/") ||
                    item.link.includes("symbols/") ||
                    item.link.includes("crypto");

                  const articleUrl = isGenericOrUnstable
                    ? `https://www.google.com/search?q=${encodeURIComponent(item.title + " " + item.publisher)}`
                    : item.link;

                  return (
                    <a 
                      key={idx}
                      href={articleUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex gap-3 cursor-pointer hover:opacity-90 block"
                    >
                      <div className={`h-14 w-14 rounded-lg flex items-center justify-center font-black border shrink-0 select-none ${item.avatarBg} ${item.avatarTextColor} border-gray-100 dark:border-zinc-900/40`}>
                        {item.avatar}
                      </div>
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5 leading-none">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[8.5px] uppercase tracking-wide border ${item.tagBg} ${item.tagTextColor}`}>
                            {item.tag}
                          </span>
                          <span className={`${item.changeTextColor} text-[8.5px] font-bold font-mono`}>
                            {item.change}
                          </span>
                          <span className="text-[8.5px] text-[#6B7280] font-medium font-sans">
                            {item.publisher} &middot; {item.timeAgo}
                          </span>
                        </div>
                        <h5 className="font-sans text-xs font-bold text-slate-900 dark:text-white leading-normal truncate-multiple-2 group-hover:text-[#5B4CFF] dark:group-hover:text-indigo-400 transition-colors">
                          {item.title}
                        </h5>
                      </div>
                    </a>
                  );
                });
              })()}
            </div>
          </div>

          {/* UPCOMING EVENTS ECONOMIC CALENDAR */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-5 space-y-4 shadow-sm select-none">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <Calendar className="h-4 w-4 text-[#5B4CFF] dark:text-indigo-400" />
                Upcoming Economic Events
              </span>
              <span className="text-[9.5px] font-mono text-slate-400">2026-05-29</span>
            </div>

            <div className="overflow-hidden select-none">
              <table className="w-full text-left text-xs text-[#6B7280] dark:text-zinc-400 border-collapse leading-none">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-zinc-900 text-[#6B7280] uppercase tracking-wider text-[9px] font-bold">
                    <th className="pb-2">Time</th>
                    <th className="pb-2">Currency</th>
                    <th className="pb-2">Event Detail</th>
                    <th className="pb-2 text-right">Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-zinc-900 font-sans text-[11px] font-medium text-slate-800 dark:text-zinc-300">
                  
                  {/* Event 1 */}
                  <tr>
                    <td className="py-2.5 font-mono">18:30</td>
                    <td className="py-2.5 font-bold">USD</td>
                    <td className="py-2.5 truncate max-w-[95px] block">Retail Sales (MoM)</td>
                    <td className="py-2.5 text-right font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[9px] font-bold uppercase tracking-wide border border-red-150 leading-none">High</span>
                    </td>
                  </tr>

                  {/* Event 2 */}
                  <tr>
                    <td className="py-2.5 font-mono">20:00</td>
                    <td className="py-2.5 font-bold">USD</td>
                    <td className="py-2.5 truncate max-w-[95px] block">FOMC Meeting Minutes</td>
                    <td className="py-2.5 text-right font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-700 text-[9px] font-bold uppercase tracking-wide border border-red-150 leading-none">High</span>
                    </td>
                  </tr>

                  {/* Event 3 */}
                  <tr>
                    <td className="py-2.5 font-mono">21:30</td>
                    <td className="py-2.5 font-bold">USD</td>
                    <td className="py-2.5 truncate max-w-[95px] block">Crude Oil Inventories</td>
                    <td className="py-2.5 text-right font-semibold">
                      <span className="px-1.5 py-0.5 rounded bg-orange-50 text-orange-700 text-[9px] font-bold uppercase tracking-wide border border-orange-150 leading-none">Medium</span>
                    </td>
                  </tr>

                </tbody>
              </table>
            </div>
          </div>

          {/* BOT DEPLOYMENT CONTROLS & SNAPSHOT */}
          <div className="rounded-xl border border-gray-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 p-5 space-y-3.5 shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-900 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                <Sliders className="h-4 w-4 text-[#5B4CFF] dark:text-indigo-400" />
                Active Co-Pilot Engine
              </span>
              <VisualToggle
                checked={!state.config.botPaused}
                onChange={async (checked) => {
                  if (onUpdateConfig) {
                    await onUpdateConfig({ botPaused: !checked });
                  }
                }}
                size="sm"
              />
            </div>

            <div className="space-y-2 text-[11px] font-mono leading-none">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Lot Sizing</span>
                <span className="text-slate-900 dark:text-zinc-250 font-bold">{state.config.lotSize} Lots</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Risk Model</span>
                <span className="text-slate-900 dark:text-zinc-250 font-bold">{state.config.riskMode === "PERCENT" ? "Balance %" : "Fixed Contracts"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Max Lot Cap</span>
                <span className="text-slate-900 dark:text-zinc-250 font-bold">5.0 Lots</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Leverage Channel</span>
                <span className="text-slate-900 dark:text-zinc-250 font-bold">{state.config.leverage}x</span>
              </div>
            </div>
          </div>

        </div>

      </div>

      </>
      )}

    </div>
  );
}
