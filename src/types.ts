export type SymbolType =
  | "EURUSD"
  | "GBPUSD"
  | "USDJPY"
  | "AUDUSD" // Forex
  | "BTCUSD"
  | "ETHUSD"
  | "SOLUSD"
  | "BNBUSD" // Crypto
  | "AAPL"
  | "TSLA"
  | "MSFT"
  | "NVDA" // Stocks
  | "XAUUSD"
  | "USOIL"
  | "XAGUSD"
  | "NGAS" // Commodities
  | "SPX500"
  | "NDX100"
  | "DJI30"
  | "GER40"; // Indices

export interface OHLCV {
  time: string; // ISO string or short date
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  rsi?: number;
  smaFast?: number;
  smaSlow?: number;
  ema5?: number;
  activeLine?: number;
  alligatorJaw?: number;
  alligatorTeeth?: number;
  alligatorLips?: number;
  macd?: number;
  macdSignal?: number;
  macdHist?: number;
  atr?: number;
  tr?: number;
  bbLower?: number;
  bbUpper?: number;
  bbMiddle?: number;
  ema200?: number;
  ema20?: number;
  ema50?: number;
  ema9?: number;
  ema15?: number;
}

export interface AssetMarketData {
  symbol: SymbolType;
  fullName: string;
  currentPrice: number;
  dailyChange: number; // percentage
  history: OHLCV[];
  regime?: "TRENDING_BULL" | "TRENDING_BEAR" | "RANGING_CHOP" | "ACCUMULATION";
}

export interface StrategyVersion {
  version: number;
  timestamp: string;
  parameters: { key: string; value: number | string }[];
  description: string;
}

export interface TradingStrategy {
  id: string; // TIME_RANGE | EMA_CROSS
  name: string;
  description: string;
  enabled: boolean;
  autoTrade: boolean;
  pattern: string;
  entryRules: string;
  slTpRules: string;
  confluences: string;
  timeframe: string;
  indicators: {
    name: string;
    params: Record<string, number | string | number[]>;
  }[];
  parameters: {
    key: string;
    label: string;
    value: number | string;
    type: "number" | "text" | "select";
    options?: string[];
  }[];
  deleted?: boolean;
  deletedAt?: string;
  versionHistory?: StrategyVersion[];
  currentVersion?: number;
  tenantId?: string;
  createdBy?: string;
  builtWithAi?: boolean;
}

export interface Trade {
  id: string;
  symbol: SymbolType;
  type: "BUY" | "SELL";
  entryPrice: number;
  currentPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  tp4?: number;
  baseStopLoss?: number;
  baseTakeProfit?: number;
  baseTp1?: number;
  baseTp2?: number;
  baseTp3?: number;
  highestTpReached?: number; // 0, 1, 2, 3, or 4
  originalSize?: number;
  realizedPartialPnl?: number;
  size: number; // units/lots
  pnl: number;
  strategyId: string;
  strategyName: string;
  timeframe?: string;
  status: "OPEN" | "CLOSED";
  openTime: string;
  closeTime?: string;
  closePrice?: number;
  closeReason?: "MANUAL" | "SL" | "TP" | "STRATEGY";
  regime: "TRENDING_BULL" | "TRENDING_BEAR" | "RANGING_CHOP" | "ACCUMULATION";
  mfe: number; // Maximum Favorable Excursion ($)
  mae: number; // Maximum Adverse Excursion ($)
  itmeScore?: number;
  itmeScoresBreakdown?: {
    structure: number;
    priceAction: number;
    momentum: number;
    volume: number;
    volatility: number;
  };
  itmeAnalysisDetails?: string;
  itmeScalingInCount?: number;
  itmeLastScalingInTime?: string;
  barsElapsed?: number;
  itmeScaledOutStatus?: Record<number, boolean>;
  itmeScaleEvents?: {
    type: "SCALE_IN" | "SCALE_OUT";
    sizeChange: number;
    sizeAfter: number;
    price: number;
    score: number;
    time: string;
    reason: string;
  }[];
  exitScore?: number;
  exitScoresBreakdown?: {
    profitCapture: number;
    aiContinuation: number;
    trendExhaustion: number;
    patternMatching: number;
    volMomentumShift: number;
    riskProtection: number;
  };
  exitAnalysisDetails?: string;
  aiProbTp1?: number;
  aiProbTp2?: number;
  aiProbTp3?: number;
  aiProbTp4?: number;
  aiProbContinuation?: number;
  aiProbReversal?: number;
  patternMatchSimilarity?: number;
  patternMatchSampleCount?: number;
  patternMatchAnalogsReversal?: number;
  maxRReached?: number;
  profitLockEngineAction?: string;
  exitActionTriggered?: string;
  exitScorePartialClosed?: boolean;
  isBreakevenMoved?: boolean;
  graduatedExits?: number[];
  notes?: string;
}

export interface TradingSignal {
  id: string;
  time: string;
  symbol: SymbolType;
  type: "BUY" | "SELL" | "HOLD";
  price: number;
  strategyId: string;
  strategyName: string;
  timeframe: "M1" | "M3" | "M5" | "M15" | "H1" | "H4" | "D1";
  regime: "TRENDING_BULL" | "TRENDING_BEAR" | "RANGING_CHOP" | "ACCUMULATION";
  entryPrice: number;
  stopLoss?: number;
  takeProfit?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  status: "EXECUTED" | "BLOCKED" | "PENDING" | "PENDING_RETEST";
  blockedReason?:
    | "cooldown"
    | "open-lock"
    | "chop gate"
    | "none"
    | ""
    | "timeframe-lock"
    | string;
  barTime?: string;
  itmeScore?: number;
  itmeScoresBreakdown?: {
    structure: number;
    priceAction: number;
    momentum: number;
    volume: number;
    volatility: number;
  };
  itmeAnalysisDetails?: string;
}

export interface TelegramAlert {
  id: string;
  time: string;
  message: string;
  type: "ENTRY" | "TP_RATCHET" | "EXIT_SL" | "EXIT_TP" | "SYSTEM";
  deliveryStatus: "SENT" | "FAILED" | "PENDING";
  chatId: string;
  errorLog?: string;
}

export interface NewsItem {
  id: string;
  time: string; // Date relative
  event: string;
  currency: string;
  importance: "HIGH" | "MEDIUM" | "LOW";
  actual?: string;
  forecast?: string;
  previous?: string;
  sentiment?: "BULLISH" | "BEARISH" | "NEUTRAL";
  aiAnalysis?: string;
}

export interface MT5ApiToken {
  id: string;
  terminalName: string;
  token: string;
  createdAt: string;
  lastUsedAt?: string;
}

export interface MT5MirrorActivity {
  id: string;
  action: "OPEN" | "MODIFY" | "CLOSE";
  symbol: SymbolType;
  type: "BUY" | "SELL";
  size: number;
  status: "PENDING" | "SENT" | "DONE" | "FAILED";
  strategyId: string;
  time: string;
  details?: string;
  stopLoss?: number;
  takeProfit?: number;
  entryPrice?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  timeframe?: string;
  tradeId?: string;
  ticket?: string;
}

export interface MT5ConnectorConfig {
  connected: boolean;
  server: string;
  login: string;
  password?: string;
  port: number;
  eaStatus: "Running" | "Stopped";
  lastSyncTime?: string;
  logs: string[];
  tokens: MT5ApiToken[];
  mirrorActivity: MT5MirrorActivity[];
  brokerSuffix?: string;
}

export interface AppConfig {
  balance: number;
  equity: number;
  riskPerTrade: number; // percentage or fixed size depends on mode
  riskMode: "PERCENT" | "FIXED";
  maxDailyDrawdown: number; // percentage
  autoTradeEnabled: boolean;
  mt5BridgeEnabled: boolean;

  // High fidelity user-configured parameters
  enabledPairs: Partial<Record<SymbolType, boolean>>;
  displayTimeframe: "M1" | "M3" | "M5" | "M15" | "H1" | "H4" | "D1";
  executionTimeframes: string[]; // e.g. ["M5", "M15", "H1"]
  scannerTargetMode?: "ALL_MONITORED" | "DISPLAY_ONLY";
  lotSize: number;
  leverage: number;
  activeStrategies: string[]; // e.g. ["TIME_RANGE", "EMA_CROSS"]
  tradingDays: string[]; // e.g. ["MON", "TUE", "WED", "THU", "FRI"]
  telegramAlertsEnabled: boolean;
  botPaused: boolean; //BOT_PAUSED halt switch
  telegramReceiverToken?: string;
  telegramReceiverChatId?: string;
  telegramReceiverActive?: boolean;
  telegramAutoMirror?: boolean;
  activeOptimizations?: Record<string, boolean>;
  enabledBlockers?: Record<string, boolean>;
  strategyRetentionDays?: number;
  adaptiveSafeguardsEnabled?: boolean;
  safeguardConfluenceMode?: "NORMAL" | "MEDIUM" | "HIGH";
  profitLockTightness?: "CONSERVATIVE" | "STANDARD" | "WIDE" | "OFF";
  virtualSlTpEnabled?: boolean;
  phase1Enabled?: boolean;
  exitEngineMode?: "ITME" | "DYNAMIC_TRAIL";
  dynamicTrailTp1RR?: number;
  dynamicTrailTp2RR?: number;
  dynamicTrailTp3RR?: number;
  dynamicTrailCapitalLock?: number;
  itmeEnabled?: boolean;
  itmeThreshold?: number;
  itmeAllowReversals?: boolean;
  itmeMinBarsHold?: number;
  itmeFilterPullbacks?: boolean;
  itmeWeightStructure?: number;
  itmeWeightPriceAction?: number;
  itmeWeightMomentum?: number;
  itmeWeightVolume?: number;
  itmeWeightVolatility?: number;
  itmeScalingEnabled?: boolean;
  pyramidingEnabled?: boolean;
  itmeScaleInThreshold?: number;
  itmeScaleInPercent?: number;
  itmeMaxScaleInCount?: number;
  itmeScaleOutThreshold1?: number;
  itmeScaleOutThreshold2?: number;
  itmeScaleOutPercent?: number;
  itmeFiveCandleRuleEnabled?: boolean;
  directBrokerEnabled?: boolean;
  directBrokerServer?: string;
  directBrokerLogin?: string;
  directBrokerPassword?: string;
  directBrokerAutoExecute?: boolean;
  directBrokerConnected?: boolean;
  directBrokerRouteToEA?: boolean;
  directBrokerSuffix?: string;
  directBrokerLogs?: string[];
  executionMethod?: "DIRECT" | "TELEGRAM_BRIDGE" | "DIRECT_BROKER";
  preNewsAutoCloseEnabled?: boolean;
  preNewsAutoCloseMinutes?: number;
  preNewsAutoClosePct?: number;
  indexAtrTrailingLockEnabled?: boolean;
  indexAtrTrailingLockMultiplier?: number;
}

export interface RetestCandidate {
  id: string;
  symbol: SymbolType;
  strategyId: string;
  strategyName: string;
  type: "BUY" | "SELL";
  time: string;
  triggerPrice: number;
  triggerBarHigh: number;
  triggerBarLow: number;
  triggerBarVolume: number;
  timeframe: string;
  status: "WAITING_CANDLE_CLOSE" | "WAITING_RETEST" | "EXECUTED" | "FAILED";
  regime: "TRENDING_BULL" | "TRENDING_BEAR" | "RANGING_CHOP" | "ACCUMULATION";
  stopLoss?: number;
  takeProfit?: number;
  tp1?: number;
  tp2?: number;
  tp3?: number;
  retestPrice?: number;
}

export interface FullAppState {
  marketData: Record<SymbolType, AssetMarketData>;
  strategies: TradingStrategy[];
  trades: Trade[];
  signals: TradingSignal[];
  telegramAlerts: TelegramAlert[];
  news: NewsItem[];
  mt5Config: MT5ConnectorConfig;
  config: AppConfig;
  aiNewsInsight?: string;
  retestCandidates?: RetestCandidate[];
  activeTenantId?: string;
  tenantsList?: TenantInfo[];
  pricingConfig?: any;
  mlRecommendations?: MLRecommendation[];
  mlHistory?: MLRunHistory[];
  mlRollbackPoints?: MLRollbackPoint[];
  autoApplyMLImprovements?: boolean;
  adaptiveOptimizerState?: {
    lastExecutionTime: string;
    totalSignalsScanned: number;
    totalSignalsBlocked: number;
    totalSignalsExecuted: number;
    rejectionStats: Record<string, number>;
    status: "STANDBY" | "ADAPTING" | "OPTIMIZED";
    currentRelaxationLevel: number;
    adaptiveRulesApplied: string[];
  };
}

export type SubscriptionTierType = "Starter" | "Professional" | "Institutional";
export type SubscriptionStatusType = "Active" | "Past Due" | "Expired";

export interface TenantInfo {
  id: string;
  name: string;
  email: string;
  tier: SubscriptionTierType;
  status: SubscriptionStatusType;
  price: number;
  nextBillingDate: string;
  limits: {
    maxStrategies: number;
    maxLotSize: number;
    maxConcurrentTrades: number;
    aiSignalsAllowed: boolean;
  };
  username?: string;
  password?: string;
  passcode?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeCurrentPeriodEnd?: number;
  disabledMenus?: string[];
}

export interface TenantData extends TenantInfo {
  state: FullAppState;
}

// Machine Learning Adaptive Engine types
export interface MLRecommendation {
  id: string;
  field: string;
  currentValue: any;
  recommendedValue: any;
  confidence: number;
  reason: string;
  category: "RISK" | "ITME" | "STRATEGY" | "BLOCKER" | "TRADE_TP";
  impact: string;
  validated: boolean;
}

export interface MLRunHistory {
  id: string;
  timestamp: string;
  type: "MANUAL" | "AUTO_SCHEDULED";
  status: "SUCCESS" | "FAILED";
  inputTradesAnalyzed: number;
  recommendationsCount: number;
  marketRegimeDetected: string;
  forwardValidationScore: number;
  appliedChanges: string[];
}

export interface MLRollbackPoint {
  id: string;
  timestamp: string;
  configBefore: any;
  reason: string;
}
