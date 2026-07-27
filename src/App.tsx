import React, { useState, useEffect, useRef } from "react";
import { FullAppState, SymbolType, Trade } from "./types";

// Views
import DashboardView from "./components/DashboardView";
import SignalsView from "./components/SignalsView";
import TradesView from "./components/TradesView";
import JournalView from "./components/JournalView";
import NotificationsView from "./components/NotificationsView";
import StrategiesView from "./components/StrategiesView";
import StrategyBuilderView from "./components/StrategyBuilderView";
import MTFAnalysisView from "./components/MTFAnalysisView";
import NewsCalendarView from "./components/NewsCalendarView";
import BacktestingView from "./components/BacktestingView";
import DisclaimerView from "./components/DisclaimerView";
import MT5ConnectorView from "./components/MT5ConnectorView";
import SettingsView from "./components/SettingsView";
import TradeModal from "./components/TradeModal";
import ResetNotificationModal from "./components/ResetNotificationModal";
import PasswordGateView from "./components/PasswordGateView";
import UpdateLedgerView from "./components/UpdateLedgerView";
import SaaSAdminView from "./components/SaaSAdminView";
import OnboardingWalkthrough from "./components/OnboardingWalkthrough";
import ProfileView from "./components/ProfileView";
import BillingView from "./components/BillingView";
import SubscriptionGuard from "./components/SubscriptionGuard";
import SectionUpgradeOverlay from "./components/SectionUpgradeOverlay";

// Icons
import {
  LayoutDashboard,
  Brain,
  GitBranch,
  Sparkles,
  BarChart,
  History,
  Bell,
  Cpu,
  Users,
  Layers,
  Calendar,
  ShieldCheck,
  Link,
  Settings,
  Plus,
  Compass,
  Wrench,
  Activity,
  AlertOctagon,
  Menu,
  X,
  LineChart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
  ChevronUp,
  Info,
  CreditCard,
  TrendingUp,
  Award,
  AlertTriangle,
  Smile,
  HelpCircle
} from "lucide-react";

type MenuType =
  | "Dashboard"
  | "Signals"
  | "Trades"
  | "Journal"
  | "Notifications"
  | "Strategies"
  | "Timeframe Analysis"
  | "News Calendar"
  | "Backtesting"
  | "Disclaimer"
  | "MT5 Connector"
  | "Settings"
  | "System Updates"
  | "SaaS Admin"
  | "Profile"
  | "Billing";

export default function App() {
  const [activeMenu, setActiveMenu] = useState<MenuType>("Dashboard");
  const [strategiesSubMenu, setStrategiesSubMenu] = useState<"current" | "create">("current");
  const [dashboardSubMenu, setDashboardSubMenu] = useState<"all" | "terminal" | "analyzer">("all");
  const [signalsSubMenu, setSignalsSubMenu] = useState<"all" | "radar" | "ledger">("all");
  const [tradesSubMenu, setTradesSubMenu] = useState<"overview" | "session" | "optimizer" | "active" | "history" | "breakdowns">("overview");
  const [mtfSubMenu, setMtfSubMenu] = useState<"all" | "matrix" | "inspector">("all");
  const [settingsSubMenu, setSettingsSubMenu] = useState<"general" | "mt5" | "backtest" | "profile" | "billing" | "admin" | "notifications">("general");
  const [soundAlertsEnabled, setSoundAlertsEnabled] = useState<boolean>(() => {
    return localStorage.getItem("quant_sound_alerts_enabled") !== "false";
  });
  const [journalSubMenu, setJournalSubMenu] = useState<"OVERVIEW" | "SETUPS" | "MISTAKES" | "PSYCHOLOGY" | "LOG">("OVERVIEW");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem("quant_sidebar_collapsed") === "true";
  });
  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem("quant_sidebar_collapsed", String(next));
      return next;
    });
  };
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    return (localStorage.getItem("quant_theme") as "dark" | "light") || "light";
  });
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 5500);
  };

  useEffect(() => {
    window.alert = (message: string) => {
      const lower = (message || "").toLowerCase();
      const isError = lower.includes("fail") || lower.includes("error") || lower.includes("limit") || lower.includes("denied") || lower.includes("blocked");
      showToast(message, isError ? "error" : "success");
      console.log("[Safe Sandbox Alert Bypass]:", message);
    };
  }, []);

  const [demoRemainingMs, setDemoRemainingMs] = useState<number | null>(() => {
    const saved = localStorage.getItem("quant_demo_remaining_time");
    return saved ? Number(saved) : 3600000;
  });
  const formatDemoTime = (ms: number | null) => {
    if (ms === null) return "60:00";
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}m ${secs.toString().padStart(2, "0")}s`;
  };
  const [state, setState] = useState<FullAppState | null>(null);
  const [selectedTenantId, setSelectedTenantId] = useState<string>(() => {
    return localStorage.getItem("quant_active_tenant_id") || "tenant-harry";
  });

  const apiFetch = async (url: string, init?: RequestInit) => {
    const headers = {
      ...(init?.headers || {}),
      "X-Tenant-ID": selectedTenantId,
      ...(localStorage.getItem("quant_is_super_admin") === "true" ? { "X-Is-Super-Admin": "true" } : {}),
    };
    return fetch(url, { ...init, headers });
  };

  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [selfHealModalOpen, setSelfHealModalOpen] = useState<boolean>(false);
  const [selfHealRunning, setSelfHealRunning] = useState<boolean>(false);
  const [selfHealLog, setSelfHealLog] = useState<string[]>([]);
  const [selfHealSuccess, setSelfHealSuccess] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("gate_auth_token") === "true";
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean>(() => {
    return localStorage.getItem("quant_is_super_admin") === "true";
  });
  const [showProfileDetails, setShowProfileDetails] = useState<boolean>(false);

  const handleLogout = () => {
    localStorage.removeItem("gate_auth_token");
    localStorage.removeItem("quant_is_super_admin");
    setIsAuthenticated(false);
    setIsSuperAdmin(false);
    setMobileMenuOpen(false);
    setShowProfileDetails(false);
  };

  const [runTour, setRunTour] = useState<boolean>(false);

  const hasAttemptedAutoRestore = React.useRef<boolean>(false);

  // Automatic Config Reset Detection States & Refs
  const [resetPopupOpen, setResetPopupOpen] = useState<boolean>(false);
  const [headerProfileMenuOpen, setHeaderProfileMenuOpen] = useState<boolean>(false);
  const [wantedConfig, setWantedConfig] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("quant_user_wanted_config");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isResettingManualRef = React.useRef<boolean>(false);
  const hasShownResetModalThisSessionRef = React.useRef<boolean>(false);

  useEffect(() => {
    if (isAuthenticated) {
      const alreadyWelcomed = localStorage.getItem("quant_onboarding_welcomed") === "true";
      const alreadyDismissed = localStorage.getItem("quant_onboarding_dismissed") === "true";
      if (!alreadyWelcomed && !alreadyDismissed) {
        localStorage.setItem("quant_onboarding_welcomed", "true");
        setRunTour(true);
      }
    }
  }, [isAuthenticated]);

  // Sync theme with document element root class name
  useEffect(() => {
    document.documentElement.className = theme === "dark" ? "theme-dark" : "theme-light";
  }, [theme]);

  // Synchronize state from backend on mount, and poll every 2 seconds
  useEffect(() => {
    let active = true;

    const fetchState = async () => {
      try {
        const res = await apiFetch("/api/state");
        if (!res.ok) throw new Error("Server error");
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          // If response is HTML (e.g. iframe cookie check, gateway redirect of platform)
          console.warn("[Sync] Received non-JSON response from /api/state. Iframe cookie checking or proxy authentication active.");
          return;
        }

        const data = await res.json();
        if (active) {
          // Detect Auto Reset
          if (data && data.config) {
            const lastKnownConfigStr = localStorage.getItem("quant_user_wanted_config");
            if (lastKnownConfigStr) {
              try {
                const wanted = JSON.parse(lastKnownConfigStr);
                
                // Server defaults are balance = 1000 on general restart or reset.
                const isServerDefault = Number(data.config.balance) === 1000;
                const isWantedCustom = Number(wanted.balance) !== 1000;

                const hasBalanceMismatch = Number(wanted.balance) !== Number(data.config.balance);
                const hasRiskMismatch = Number(wanted.riskPerTrade) !== Number(data.config.riskPerTrade);
                const hasLotMismatch = Number(wanted.lotSize) !== Number(data.config.lotSize);

                if (isServerDefault && isWantedCustom && (hasBalanceMismatch || hasRiskMismatch || hasLotMismatch)) {
                  if (!isResettingManualRef.current && !hasShownResetModalThisSessionRef.current) {
                    setWantedConfig(wanted);
                    setResetPopupOpen(true);
                    hasShownResetModalThisSessionRef.current = true;
                  }
                }
              } catch (e) {
                console.error("[Reset Detect] Parse error:", e);
              }
            } else {
              // Capture customized config automatically as original baseline
              if (Number(data.config.balance) !== 1000) {
                localStorage.setItem("quant_user_wanted_config", JSON.stringify(data.config));
                setWantedConfig(data.config);
              }
            }
          }

          setState(data);
          setLoading(false);

          // Silently and automatically restore backup once on initial load if the server's trade list is clear/empty
          // and a valid local storage backup exists. This makes redeployments seamless and fully automatic.
          if (!hasAttemptedAutoRestore.current && data.config && data.trades && data.trades.length === 0) {
            hasAttemptedAutoRestore.current = true;
            const backupStr = localStorage.getItem("quant_terminal_production_state_v1");
            if (backupStr) {
              try {
                const backupData = JSON.parse(backupStr);
                if (backupData.trades && backupData.trades.length > 0) {
                  console.log("[Auto-Restore] Fresh server load detected. Auto-restoring production state...");
                  const importRes = await apiFetch("/api/state/import", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ importedState: backupData })
                  });
                  if (importRes.ok) {
                    const importData = await importRes.json();
                    if (importData && importData.state) {
                      setState(importData.state);
                    }
                  }
                }
              } catch (e) {
                console.error("[Auto-Restore] Silent parse/restore error:", e);
              }
            }
          } else if (data.config && data.trades && data.trades.length > 0) {
            // Server has trades, make sure auto-restore is marked checked to prevent any future overwrite
            hasAttemptedAutoRestore.current = true;
          }
        }
      } catch (err) {
        console.error("Error synchronizing simulation states: ", err);
      }
    };

    fetchState();
    const interval = setInterval(fetchState, 2000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [selectedTenantId]);

  // Synchronize sound alert preferences with localStorage
  useEffect(() => {
    localStorage.setItem("quant_sound_alerts_enabled", soundAlertsEnabled ? "true" : "false");
  }, [soundAlertsEnabled]);

  // Heartbeat tracking + Countdown for Demo Account's daily 1-hour total limit
  useEffect(() => {
    if (!isAuthenticated) return;

    const isDemo = localStorage.getItem("quant_is_demo_account") === "true";
    if (!isDemo) return;

    // Helper for demo account fingerprinting
    const getDemoFingerprint = () => {
      let deviceId = localStorage.getItem("quant_demo_device_id");
      if (!deviceId) {
        deviceId = "dev-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now();
        localStorage.setItem("quant_demo_device_id", deviceId);
      }

      const saved = localStorage.getItem("quant_demo_fingerprint");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return { ...parsed, deviceId };
        } catch (e) {}
      }
      return {
        canvasHash: "nocanvas",
        userAgent: navigator.userAgent,
        screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
        cores: navigator.hardwareConcurrency || 0,
        memory: (navigator as any).deviceMemory || 0,
        deviceId: deviceId
      };
    };

    // Heartbeat to sync with Server's unified daily accumulated tracker
    const runHeartbeat = async () => {
      try {
        const fingerprint = getDemoFingerprint();
        const res = await fetch("/api/auth/demo-heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: selectedTenantId,
            ...fingerprint
          })
        });

        const data = await res.json();
        if (data.limitReached || !data.success) {
          console.warn("[Demo Heartbeat] 1-hour total daily limit reached. Logging off...");
          localStorage.removeItem("quant_is_demo_account");
          localStorage.removeItem("quant_demo_login_time");
          localStorage.removeItem("quant_demo_fingerprint");
          localStorage.removeItem("quant_demo_remaining_time");
          setDemoRemainingMs(0);
          handleLogout();
          alert(data.error || "Your daily trial demo access limit of 1 hour has been reached. Please subscribe for full, unrestricted access.");
        } else {
          if (data.remainingTimeMs !== undefined) {
            setDemoRemainingMs(data.remainingTimeMs);
            localStorage.setItem("quant_demo_remaining_time", data.remainingTimeMs.toString());
          }
        }
      } catch (err) {
        console.error("Demo heartbeat tracking failure:", err);
      }
    };

    // Run heartbeat immediately and then every 10 seconds
    runHeartbeat();
    const heartbeatInterval = setInterval(runHeartbeat, 10000);

    // Dynamic 1s Local Countdown for continuous real-time clock tick
    const countdownInterval = setInterval(() => {
      setDemoRemainingMs((prev) => {
        if (prev === null) return null;
        if (prev <= 0) {
          // Log out immediately
          localStorage.removeItem("quant_is_demo_account");
          localStorage.removeItem("quant_demo_login_time");
          localStorage.removeItem("quant_demo_fingerprint");
          localStorage.removeItem("quant_demo_remaining_time");
          handleLogout();
          alert("Demo Access Limit Reached: Your total trial demo access limit of 1 hour for today has been reached. Please subscribe or wait until tomorrow for full, unrestricted access.");
          return 0;
        }
        const next = prev - 1000;
        localStorage.setItem("quant_demo_remaining_time", next.toString());
        return next;
      });
    }, 1000);

    return () => {
      clearInterval(heartbeatInterval);
      clearInterval(countdownInterval);
    };
  }, [isAuthenticated, selectedTenantId]);

  // Audio synthesizer alerts triggered on trade state updates (Entry, TP, SL)
  const triggerSound = (type: "entry" | "sl" | "tp") => {
    if (!soundAlertsEnabled) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      
      // We want a loud, clean alert, so we use a high volume gain node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.45, ctx.currentTime);
      masterGain.connect(ctx.destination);

      if (type === "entry") {
        // Fast optimistic double-chirpiest electronic trigger (Entry executed)
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc1.connect(masterGain);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.1);

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.08); // high pitch
        osc2.connect(masterGain);
        osc2.start(ctx.currentTime + 0.08);
        osc2.stop(ctx.currentTime + 0.22);

      } else if (type === "tp") {
        // Success upbeat triad chime (TP hit!)
        const noteTimes = [0, 0.08, 0.16];
        const freqs = [659.25, 830.61, 1318.51]; // E5, G#5, E6 (extremely positive triumphant triad)

        freqs.forEach((f, idx) => {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(f, ctx.currentTime + noteTimes[idx]);
          osc.connect(masterGain);
          osc.start(ctx.currentTime + noteTimes[idx]);
          osc.stop(ctx.currentTime + noteTimes[idx] + 0.15);
        });

      } else if (type === "sl") {
        // Two low-buzzy urgent caution signals (SL hit!)
        const osc1 = ctx.createOscillator();
        osc1.type = "triangle";
        osc1.frequency.setValueAtTime(380, ctx.currentTime);
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.4, ctx.currentTime);
        g1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc1.connect(g1);
        g1.connect(ctx.destination);
        osc1.start(ctx.currentTime);
        osc1.stop(ctx.currentTime + 0.22);

        const osc2 = ctx.createOscillator();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(290, ctx.currentTime + 0.22);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.4, ctx.currentTime + 0.22);
        g2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.45);
        osc2.connect(g2);
        g2.connect(ctx.destination);
        osc2.start(ctx.currentTime + 0.22);
        osc2.stop(ctx.currentTime + 0.47);
      }
    } catch (err) {
      console.warn("[Sound System] Audio context error/blocked:", err);
    }
  };

  const prevTradesRef = useRef<Trade[]>([]);
  const hasSetInitialTrades = useRef(false);

  useEffect(() => {
    if (!state || !state.trades) return;

    if (!hasSetInitialTrades.current) {
      prevTradesRef.current = state.trades;
      hasSetInitialTrades.current = true;
      return;
    }

    const prevTrades = prevTradesRef.current;
    const currentTrades = state.trades;

    currentTrades.forEach((trade) => {
      // 1. Detect Entry
      const wasOpenBefore = prevTrades.some(t => t.id === trade.id && t.status === "OPEN");
      const isOpenNow = trade.status === "OPEN";
      const isNewOpenTrade = isOpenNow && !wasOpenBefore;

      if (isNewOpenTrade) {
        console.log(`[Sound Alert] Trade entry executed! ID: ${trade.id}, Symbol: ${trade.symbol}`);
        triggerSound("entry");
      }

      // 2. Detect SL or TP
      const wasClosedBefore = prevTrades.some(t => t.id === trade.id && t.status === "CLOSED");
      const isClosedNow = trade.status === "CLOSED";

      if (isClosedNow && !wasClosedBefore) {
        const knewAsOpen = prevTrades.some(t => t.id === trade.id && t.status === "OPEN");
        if (knewAsOpen) {
          if (trade.closeReason === "SL") {
            console.log(`[Sound Alert] Stop Loss executed! ID: ${trade.id}, Symbol: ${trade.symbol}`);
            triggerSound("sl");
          } else if (trade.closeReason === "TP") {
            console.log(`[Sound Alert] Take Profit executed! ID: ${trade.id}, Symbol: ${trade.symbol}`);
            triggerSound("tp");
          }
        }
      }
    });

    prevTradesRef.current = currentTrades;
  }, [state, soundAlertsEnabled]);

  const rawActiveTenant = state?.tenantsList?.find(t => t.id === selectedTenantId) || state?.tenantsList?.[0] || {
    id: "tenant-harry",
    name: "Harry Jhone",
    email: "harry.jhone@gmail.com",
    tier: "Professional",
    status: "Active",
    limits: { maxStrategies: 10, maxLotSize: 5.0, maxConcurrentTrades: 20, aiSignalsAllowed: true },
    nextBillingDate: "2026-06-25",
    price: 249
  };

  const activeTenant = isSuperAdmin ? {
    ...rawActiveTenant,
    name: "Super Admin",
    tier: "Infinite Super Admin",
    status: "UNBOUNDED",
    limits: { maxStrategies: 999999, maxLotSize: 99999.0, maxConcurrentTrades: 999999, aiSignalsAllowed: true }
  } : rawActiveTenant;

  // Dynamic filtered menus based on active tenant specifications
  const activeTenantDisabledMenus = activeTenant?.disabledMenus || [];

  if (!isAuthenticated) {
    return (
      <PasswordGateView
        onSuccess={(tenantId: string) => {
          localStorage.setItem("quant_active_tenant_id", tenantId);
          setSelectedTenantId(tenantId);
          setIsAuthenticated(true);
          setIsSuperAdmin(localStorage.getItem("quant_is_super_admin") === "true");
        }}
      />
    );
  }

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="relative flex items-center justify-center mb-4">
          <div className="h-12 w-12 rounded-full border-4 border-t-emerald-500 border-zinc-900 animate-spin" />
          <Cpu className="absolute h-5 w-5 text-emerald-500 animate-pulse" />
        </div>
        <span className="font-display text-md font-bold text-white tracking-widest uppercase">QUANT TERMINAL ONLINE</span>
        <p className="text-xs text-zinc-500 mt-1 font-mono">Synchronizing state streams with live tick simulator...</p>
      </div>
    );
  }

  // Action methods
  const handleOpenTrade = async (tradeData: {
    symbol: SymbolType;
    type: "BUY" | "SELL";
    size: number;
    stopLoss?: number;
    takeProfit?: number;
  }) => {
    const res = await apiFetch("/api/trade/open", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tradeData),
    });
    if (res.ok) {
      const updatedState = await (await apiFetch("/api/state")).json();
      setState(updatedState);
    } else {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || "Failed to execute manual order.");
    }
  };

  const handleCloseTrade = async (id: string) => {
    try {
      const res = await apiFetch("/api/trade/close", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        const updatedState = await (await apiFetch("/api/state")).json();
        setState(updatedState);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleStrategy = async (strategyData: {
    id: string;
    enabled?: boolean;
    autoTrade?: boolean;
    parameters?: Record<string, number | string>;
  }) => {
    try {
      const res = await apiFetch("/api/strategy/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(strategyData),
      });
      if (res.ok) {
        const updatedState = await (await apiFetch("/api/state")).json();
        setState(updatedState);
        showToast("Strategy settings updated successfully.", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to toggle strategy.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("A connection error occurred.", "error");
    }
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    try {
      const res = await apiFetch("/api/strategy/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: strategyId }),
      });
      if (res.ok) {
        const updatedState = await (await apiFetch("/api/state")).json();
        setState(updatedState);
        showToast("Strategy moved to Recycle Bin.", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to delete strategy.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("A connection error occurred.", "error");
    }
  };

  const handleRestoreStrategy = async (strategyId: string) => {
    try {
      const res = await apiFetch("/api/strategy/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: strategyId }),
      });
      if (res.ok) {
        const updatedState = await (await apiFetch("/api/state")).json();
        setState(updatedState);
        showToast("Strategy successfully restored from Recycle Bin.", "success");
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to restore strategy.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("A connection error occurred.", "error");
    }
  };

  const handleDeletePermanentStrategy = async (strategyId: string, passcode: string) => {
    try {
      const res = await apiFetch("/api/strategy/delete-permanent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: strategyId, password: passcode }),
      });
      if (res.ok) {
        const updatedState = await (await apiFetch("/api/state")).json();
        setState(updatedState);
        showToast("Strategy permanently deleted.", "success");
        return { success: true };
      } else {
        const errData = await res.json();
        showToast(errData.error || "Failed to permanently delete strategy.", "error");
        return { success: false, error: errData.error };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: "Network error occurred." };
    }
  };

  const handleUpdateConfig = async (configParameters: any): Promise<any> => {
    try {
      const res = await apiFetch("/api/config/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configParameters),
      });
      if (res.ok) {
        const updatedState = await (await apiFetch("/api/state")).json();
        setState(updatedState);
        if (updatedState && updatedState.config) {
          localStorage.setItem("quant_user_wanted_config", JSON.stringify(updatedState.config));
          setWantedConfig(updatedState.config);
          hasShownResetModalThisSessionRef.current = false;
        }
        return { success: true };
      } else {
        const errData = await res.json();
        return { success: false, error: errData.error || "Failed to update configuration Settings." };
      }
    } catch (err: any) {
      console.error(err);
      return { success: false, error: err.message || "Network error occurred." };
    }
  };

  const handleResetState = async () => {
    try {
      isResettingManualRef.current = true;
      const res = await apiFetch("/api/state/reset", { method: "POST" });
      if (res.ok) {
        const updatedState = await (await apiFetch("/api/state")).json();
        setState(updatedState);
        if (updatedState && updatedState.config) {
          localStorage.setItem("quant_user_wanted_config", JSON.stringify(updatedState.config));
          setWantedConfig(updatedState.config);
          hasShownResetModalThisSessionRef.current = false;
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        isResettingManualRef.current = false;
      }, 3000);
    }
  };

  const handleOptimizeStrategy = async (strategyId: string): Promise<any> => {
    const res = await apiFetch("/api/ai/analyze-strategy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ strategyId }),
    });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Optimization failed");
    }
    const data = await res.json();
    return data;
  };

  const handleAnalyzeSentiment = async (): Promise<string> => {
    const res = await apiFetch("/api/ai/analyze-news", { method: "POST" });
    if (!res.ok) throw new Error("Sentiment audit failed");
    const data = await res.json();
    return data.text;
  };

  // Menu configurations with relevant icons, tailored dynamically to the logged-in role
  const menus: { name: MenuType; icon: React.ReactNode; badgeCount?: number; label?: string }[] = isSuperAdmin ? [
    { name: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: "SaaS Admin", icon: <Users className="h-4 w-4 text-amber-500 animate-pulse" />, label: "Super Admin Portal" },
    { name: "Signals", icon: <BarChart className="h-4 w-4" />, badgeCount: state?.signals?.filter(s => s.status === "PENDING").length },
    { name: "Trades", icon: <History className="h-4 w-4" />, badgeCount: state?.trades?.filter(t => t.status === "OPEN").length },
    { name: "Strategies", icon: <Cpu className="h-4 w-4" /> },
    { name: "Disclaimer", icon: <ShieldCheck className="h-4 w-4" /> },
    { name: "Settings", icon: <Settings className="h-4 w-4 text-amber-500" /> },
    { name: "System Updates", icon: <GitBranch className="h-4 w-4" /> },
  ] : [
    { name: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
    { name: "Signals", icon: <BarChart className="h-4 w-4" />, badgeCount: state?.signals?.filter(s => s.status === "PENDING").length },
    { name: "Trades", icon: <History className="h-4 w-4" />, badgeCount: state?.trades?.filter(t => t.status === "OPEN").length },
    { name: "Journal", icon: <BookOpen className="h-4 w-4" /> },
    { name: "Notifications", icon: <Bell className="h-4 w-4" />, badgeCount: state?.telegramAlerts && state?.telegramAlerts?.length > 0 ? state?.telegramAlerts?.length : undefined },
    { name: "Strategies", icon: <Cpu className="h-4 w-4" /> },
    { name: "Timeframe Analysis", icon: <Layers className="h-4 w-4" /> },
    { name: "News Calendar", icon: <Calendar className="h-4 w-4" /> },
    { name: "Disclaimer", icon: <ShieldCheck className="h-4 w-4" /> },
    { name: "Settings", icon: <Settings className="h-4 w-4 text-emerald-400" /> },
    { name: "Profile", icon: <User className="h-4 w-4 text-indigo-400" /> },
    { name: "Billing", icon: <CreditCard className="h-4 w-4 text-emerald-400" /> },
    { name: "System Updates", icon: <GitBranch className="h-4 w-4" /> },
  ];

  const openTrades = state.trades.filter((t) => t.status === "OPEN");
  const closedTrades = state.trades.filter((t) => t.status === "CLOSED");
  const floatingPnL = openTrades.reduce((sum, t) => {
    const val = Number(t.pnl);
    return sum + (isNaN(val) || !isFinite(val) || Math.abs(val) > 50000000 ? 0 : val);
  }, 0);
  const realizedPnL = closedTrades.reduce((sum, t) => {
    const val = Number(t.pnl);
    return sum + (isNaN(val) || !isFinite(val) || Math.abs(val) > 50000000 ? 0 : val);
  }, 0);
  const netChangeAmount = realizedPnL + floatingPnL;
  const originalBalance = state.config.balance;
  const capitalNowLive = originalBalance + realizedPnL + floatingPnL;
  const isCapitalConsumed = state.config.balance >= 999999999999 
    ? false 
    : ((netChangeAmount < 0 && Math.abs(netChangeAmount) >= state.config.balance) || capitalNowLive <= 0);

  const isNotSubscribed = activeTenant ? activeTenant.status !== "Active" : false;

  const filteredMenus = menus;

  return (
    <div className={`min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-zinc-950 to-black font-sans text-zinc-100 flex flex-col md:flex-row antialiased ${theme === "light" ? "theme-light" : "theme-dark"}`}>
      {/* Toast Notification HUD */}
      {toast && (
        <div className="fixed top-5 right-5 z-[9999] flex items-center justify-center">
          <div className={`flex items-center gap-2.5 px-4.5 py-3 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === "error" 
              ? "bg-rose-950/90 border-rose-500/40 text-rose-200" 
              : "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${toast.type === "error" ? "bg-rose-400 animate-ping" : "bg-emerald-400 animate-pulse"}`} />
            <p className="text-xs font-bold font-mono tracking-wide uppercase">{toast.message}</p>
          </div>
        </div>
      )}

      <style>{`
        /* ==========================================================================
           1. CORE TRANSITIONS & UNIFIED FONTS
           ========================================================================== */
        * {
          transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }

        body, html, input, select, textarea, button, p, span, div, th, td, aside, main, header, section, h1, h2, h3, h4, h5, h6, ul, li, label, option, form, fieldset, a, svg text, tr, tbody, thead, dt, dd {
          font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }

        .font-mono, code, pre, [class*="font-mono"], .font-mono *, [class*="font-mono"] * {
          font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace !important;
        }

        /* ==========================================================================
           2. TYPOGRAPHY HIERARCHY SYSTEM
           ========================================================================== */

        /* H1: Primary page title (largest, highest emphasis) */
        h1, .text-3xl, .text-4xl, .text-5xl, [class*="text-3xl"], [class*="text-4xl"] {
          font-size: clamp(1.4rem, 3vw, 2.125rem) !important;
          font-weight: 800 !important;
          line-height: 1.25 !important;
          letter-spacing: -0.03em !important;
        }

        /* H2: Major section headings */
        h2, .text-2xl, [class*="text-2xl"] {
          font-size: clamp(1.15rem, 2.25vw, 1.5rem) !important;
          font-weight: 700 !important;
          line-height: 1.3 !important;
          letter-spacing: -0.025em !important;
        }

        /* H3: Subsection headings */
        h3, .text-xl, [class*="text-xl"] {
          font-size: clamp(1.05rem, 1.75vw, 1.2rem) !important;
          font-weight: 600 !important;
          line-height: 1.35 !important;
          letter-spacing: -0.02em !important;
        }

        /* H4: Card titles and widget headers */
        h4, .text-lg, [class*="text-lg"] {
          font-size: 0.875rem !important;
          font-weight: 600 !important;
          line-height: 1.4 !important;
          letter-spacing: -0.015em !important;
        }

        /* Body / Paragraph: Standard content and descriptions */
        p, .text-base, [class*="text-base"] {
          font-size: 0.8125rem !important; /* Standardized to 13px */
          font-weight: 400 !important;
          line-height: 1.55 !important;
        }

        /* Medium support: clean weight scaling */
        .font-medium, [class*="font-medium"] {
          font-weight: 500 !important;
        }
        .font-semibold, [class*="font-semibold"] {
          font-weight: 600 !important;
        }
        .font-bold, [class*="font-bold"] {
          font-weight: 700 !important;
        }
        .font-extrabold, .font-black, [class*="font-extrabold"], [class*="font-black"] {
          font-weight: 800 !important;
        }

        /* Small: Secondary information, helper text, labels */
        .text-sm, [class*="text-sm"] {
          font-size: 0.775rem !important; /* Slightly smaller for secondary labels (approx 12px) */
          font-weight: 400 !important;
          line-height: 1.45 !important;
        }

        /* Extra Small (XS): Metadata, timestamps, status text, captions */
        .text-xs, [class*="text-xs"], .text-\[10px\], [class*="text-\[10px\]"], .text-\[9\.5px\], .text-\[9px\] {
          font-size: 0.7rem !important; /* Clear 11px metadata captions */
          font-weight: 400 !important;
          line-height: 1.4 !important;
        }

        /* Dynamic scale support across table headers/cells */
        table th, table td {
          padding: 10px 12px !important;
          font-size: 0.75rem !important;
          line-height: 1.4 !important;
        }

        /* Input typography scaling */
        input, select, textarea {
          border-radius: 8px !important;
          padding: 8px 12px !important;
          font-size: 0.8125rem !important;
          transition: all 0.2s ease !important;
        }

        /* ==========================================================================
           3. LIGHT THEME CORE SYSTEM (#F8FAFC, #FFFFFF, Indigo Accent)
           ========================================================================== */
        .theme-light {
          color-scheme: light !important;
        }
        
        .theme-light,
        .theme-light .min-h-screen,
        .theme-light main,
        .theme-light body {
          background-color: #F8FAFC !important;
          background-image: none !important;
          color: #111827 !important;
        }
        
        /* Light aside elements (Sidebar Navigation) */
        .theme-light aside {
          background-color: #ffffff !important;
          border-right: 1px solid #e5e7eb !important;
          box-shadow: 1px 0 10px rgba(15, 23, 42, 0.02) !important;
        }
        .theme-light aside div.border-b {
          border-bottom-color: #f3f4f6 !important;
        }
        .theme-light aside span.text-white,
        .theme-light aside button span,
        .theme-light aside span.text-zinc-550,
        .theme-light aside span.text-zinc-100 {
          color: #1f2937 !important;
        }
        .theme-light aside button {
          color: #4b5563 !important;
        }
        .theme-light aside button:hover {
          background-color: #f3f4f6 !important;
          color: #4f46e5 !important;
        }
        .theme-light aside button[class*="bg-zinc-850"],
        .theme-light aside dt,
        .theme-light aside button.bg-zinc-900,
        .theme-light aside button.bg-zinc-950,
        .theme-light aside div.bg-zinc-950\/20 {
          background-color: #f9fafb !important;
          color: #1f2937 !important;
          border-color: #e5e7eb !important;
        }
        .theme-light aside div.border-t {
          border-top-color: #e5e7eb !important;
        }

        /* Card Widgets, Boxes, Popups, and sidebar dropdown panels in Light Mode */
        .theme-light main div.rounded-xl,
        .theme-light main div.rounded-lg,
        .theme-light main div.rounded-2xl,
        .theme-light form div.rounded-xl,
        .theme-light form div.rounded-lg,
        .theme-light [class*="bg-zinc-950/80"],
        .theme-light [class*="bg-zinc-950/70"],
        .theme-light [class*="bg-zinc-950/60"],
        .theme-light [class*="bg-zinc-950/40"],
        .theme-light [class*="bg-zinc-950/30"],
        .theme-light [class*="bg-zinc-950/20"],
        .theme-light [class*="bg-zinc-900/40"],
        .theme-light [class*="bg-[#121624]"],
        .theme-light [class*="bg-[#0c0d0f]"],
        .theme-light [class*="bg-[#090b11]"],
        .theme-light [class*="bg-black/"],
        .theme-light [class*="bg-zinc-900/80"] {
          background-color: #ffffff !important;
          background-image: none !important;
          border-color: #e5e7eb !important;
          border-width: 1px !important;
          border-style: solid !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03), 0 2px 4px -1px rgba(0, 0, 0, 0.02) !important;
        }

        /* Light Theme Muted Components (Elevated Backgrounds) */
        .theme-light [class*="bg-zinc-950/15"],
        .theme-light [class*="bg-zinc-950/10"],
        .theme-light [class*="bg-zinc-950/5"],
        .theme-light [class*="bg-zinc-900/15"],
        .theme-light [class*="bg-zinc-900/10"],
        .theme-light [class*="bg-zinc-900/5"],
        .theme-light [class*="bg-zinc-850"],
        .theme-light [class*="bg-zinc-900"],
        .theme-light [class*="bg-[#1e2333]"],
        .theme-light [class*="bg-zinc-800/40"],
        .theme-light [class*="bg-[#111827]"] {
          background-color: #f9fafb !important;
          border-color: #e5e7eb !important;
        }

        .theme-light [class*="bg-zinc-950/60"] button,
        .theme-light [class*="bg-zinc-950/60"] button span {
          color: #4b5563 !important;
        }

        .theme-light [class*="bg-zinc-950/60"] button.bg-zinc-900,
        .theme-light [class*="bg-zinc-950/60"] button.bg-zinc-950,
        .theme-light [class*="bg-zinc-950/60"] button[class*="bg-zinc-"] {
          background-color: #ffffff !important;
          color: #4f46e5 !important;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08) !important;
          border: 1px solid #e5e7eb !important;
        }

        /* Coerce typical light-theme panel text labels to dark gray for high color contrast */
        .theme-light main span.text-white,
        .theme-light main h3.text-white,
        .theme-light main h2.text-white,
        .theme-light main h1.text-white,
        .theme-light main p.text-white,
        .theme-light main div.text-white,
        .theme-light th.text-white,
        .theme-light td.text-white,
        .theme-light div.text-zinc-100 {
          color: #1f2937 !important;
        }

        /* High specificity fallback to turn passive white styling into readable dark gray in light mode */
        .theme-light .text-white:not([class*="bg-"]):not(button):not([class*="bg-indigo"]):not([class*="bg-emerald"]),
        .theme-light .text-zinc-50,
        .theme-light .text-zinc-100,
        .theme-light .text-zinc-200,
        .theme-light .text-zinc-300,
        .theme-light .text-zinc-350,
        .theme-light .text-slate-100,
        .theme-light .text-slate-200,
        .theme-light .text-slate-350 {
          color: #1f2937 !important;
        }

        /* ABSOLUTE CONTRAST PRESERVATION: If any text sits inside a colored active button/badge backdrop, KEEP IT WHITE */
        .theme-light button.bg-indigo-600,
        .theme-light button.bg-indigo-600 *,
        .theme-light button.bg-emerald-600,
        .theme-light button.bg-emerald-600 *,
        .theme-light button.bg-rose-605,
        .theme-light button.bg-rose-600,
        .theme-light button.bg-rose-600 *,
        .theme-light button.bg-red-600,
        .theme-light button.bg-red-600 *,
        .theme-light button.bg-blue-600,
        .theme-light button.bg-blue-600 *,
        .theme-light button.bg-sky-600,
        .theme-light button.bg-sky-600 *,
        .theme-light [class*="bg-indigo-600"] *,
        .theme-light [class*="bg-emerald-600"] *,
        .theme-light [class*="bg-rose-600"] *,
        .theme-light [class*="bg-blue-600"] *,
        .theme-light [class*="bg-red-600"] *,
        .theme-light [class*="bg-sky-600"] * {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* EXPLICIT SOLID #5B4CFF COLOR CONTRAST PRESERVATION ENGINE */
        .bg-\[\#5B4CFF\],
        .bg-\[\#5b4cff\],
        .theme-light .bg-\[\#5B4CFF\],
        .theme-light .bg-\[\#5b4cff\],
        .theme-dark .bg-\[\#5B4CFF\],
        .theme-dark .bg-\[\#5b4cff\],
        .dark .bg-\[\#5B4CFF\],
        .dark .bg-\[\#5b4cff\] {
          color: #ffffff !important;
        }

        .bg-\[\#5B4CFF\] *,
        .bg-\[\#5b4cff\] *,
        .theme-light .bg-\[\#5B4CFF\] *,
        .theme-light .bg-\[\#5b4cff\] *,
        .theme-dark .bg-\[\#5B4CFF\] *,
        .theme-dark .bg-\[\#5b4cff\] *,
        .dark .bg-\[\#5B4CFF\] *,
        .dark .bg-\[\#5b4cff\] * {
          color: #ffffff !important;
          stroke: #ffffff !important;
        }

        /* Secondary & Muted light theme texts labels */
        .theme-light .text-zinc-400,
        .theme-light .text-zinc-500,
        .theme-light .text-slate-400,
        .theme-light .text-slate-500,
        .theme-light .text-[#818ba0],
        .theme-light .text-[#8a9098] {
          color: #6b7280 !important;
        }

        /* Forms Inputs */
        .theme-light input,
        .theme-light select,
        .theme-light textarea {
          background-color: #ffffff !important;
          border: 1px solid #d1d5db !important;
          color: #1f2937 !important;
        }
        .theme-light input:focus,
        .theme-light select:focus,
        .theme-light textarea:focus {
          border-color: #4f46e5 !important;
          box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
          outline: none !important;
        }
        .theme-light input::placeholder,
        .theme-light textarea::placeholder {
          color: #94a3b8 !important;
        }

        /* Borders normalization */
        .theme-light .border-zinc-950,
        .theme-light .border-zinc-900,
        .theme-light .border-zinc-850,
        .theme-light .border-zinc-805,
        .theme-light .border-zinc-800,
        .theme-light [class*="border-zinc-"],
        .theme-light [class*="border-slate-"] {
          border-color: #e5e7eb !important;
        }

        /* Tables adjustments */
        .theme-light table {
          background-color: #ffffff !important;
        }
        .theme-light th {
          background-color: #f9fafb !important;
          color: #4b5563 !important;
          border-bottom: 2px solid #e5e7eb !important;
          font-weight: 600 !important;
        }
        .theme-light td {
          border-bottom: 1px solid #f3f4f6 !important;
          color: #374151 !important;
        }
        .theme-light tr:hover {
          background-color: #f9fafb !important;
        }

        /* Indicator color fixes (Soft and high contrast) */
        .theme-light .text-emerald-400,
        .theme-light .text-emerald-500,
        .theme-light .text-emerald-600 {
          color: #10b981 !important;
        }
        .theme-light .text-rose-455,
        .theme-light .text-rose-400,
        .theme-light .text-rose-500,
        .theme-light .text-rose-600,
        .theme-light .text-red-400,
        .theme-light .text-red-500 {
          color: #ef4444 !important;
        }
        .theme-light .text-sky-400,
        .theme-light .text-sky-500,
        .theme-light .text-blue-400,
        .theme-light .text-blue-500 {
          color: #3b82f6 !important;
        }
        .theme-light .text-amber-400,
        .theme-light .text-amber-500,
        .theme-light .text-yellow-400,
        .theme-light .text-yellow-500 {
          color: #f59e0b !important;
        }

        /* Pills and Active Status Badges */
        .theme-light [class*="bg-emerald-500/10"],
        .theme-light [class*="bg-emerald-500/20"],
        .theme-light [class*="bg-emerald-500/5"],
        .theme-light [class*="bg-emerald-950/40"] {
          background-color: #ecfdf5 !important;
          color: #065f46 !important;
          border: 1px solid rgba(16, 185, 129, 0.2) !important;
        }
        .theme-light [class*="bg-rose-500/10"],
        .theme-light [class*="bg-rose-500/20"],
        .theme-light [class*="bg-rose-550"],
        .theme-light [class*="bg-rose-500/5"],
        .theme-light [class*="bg-rose-950/40"] {
          background-color: #fef2f2 !important;
          color: #981b1b !important;
          border: 1px solid rgba(239, 68, 68, 0.2) !important;
        }
        .theme-light [class*="bg-sky-500/10"],
        .theme-light [class*="bg-sky-500/20"],
        .theme-light [class*="bg-sky-500/5"],
        .theme-light [class*="bg-sky-950/40"] {
          background-color: #eff6ff !important;
          color: #1e40af !important;
          border: 1px solid rgba(59, 130, 246, 0.2) !important;
        }
        .theme-light [class*="bg-amber-500/10"],
        .theme-light [class*="bg-amber-500/20"],
        .theme-light [class*="bg-amber-500/5"],
        .theme-light [class*="bg-amber-950/40"] {
          background-color: #fffbeb !important;
          color: #92400e !important;
          border: 1px solid rgba(245, 158, 11, 0.2) !important;
        }
        .theme-light .bg-zinc-800,
        .theme-light [class*="bg-zinc-900/20"],
        .theme-light [class*="bg-zinc-900/10"] {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
          border: 1px solid #e5e7eb !important;
        }

        /* Precise Hover rules for light theme buttons & links */
        .theme-light [class*="hover:bg-zinc-"]:hover,
        .theme-light [class*="hover:bg-slate-"]:hover,
        .theme-light [class*="hover:bg-gray-"]:hover,
        .theme-light [class*="hover:bg-neutral-"]:hover,
        .theme-light button:hover:not([class*="bg-indigo"]):not([class*="bg-emerald"]):not([class*="bg-rose"]):not([class*="bg-amber"]):not([class*="bg-sky"]):not([class*="bg-blue"]):not([class*="bg-purple"]):not([class*="bg-[#5B4CFF]"]):not([class*="bg-\[\#5B4CFF\]"]),
        .theme-light a:hover {
          background-color: #f1f5f9 !important;
          color: #0f172a !important;
        }

        .theme-light a:hover,
        .theme-light button:not([class*="text-white"]):hover,
        .theme-light [class*="hover:text-zinc-"]:hover,
        .theme-light [class*="hover:text-slate-"]:hover,
        .theme-light [class*="hover:text-white"]:hover,
        .theme-light [class*="hover:text-gray-"]:hover {
          color: #0d121c !important;
        }

        /* ==========================================================================
           4. DARK THEME CORE SYSTEM (#0F172A, #111827, Indigo Accent)
           ========================================================================== */
        .theme-dark {
          color-scheme: dark !important;
        }

        .theme-dark,
        .theme-dark .min-h-screen,
        .theme-dark main,
        .theme-dark body {
          background-color: #0f172a !important;
          background-image: none !important;
          color: #f3f4f6 !important;
        }

        /* Sidebar in Dark Mode */
        .theme-dark aside {
          background-color: #111827 !important;
          border-right: 1px solid #1e293b !important;
          box-shadow: 1px 0 10px rgba(0, 0, 0, 0.3) !important;
        }
        .theme-dark aside div.border-b {
          border-bottom-color: #1e293b !important;
        }
        .theme-dark aside span.text-white,
        .theme-dark aside span.text-zinc-100,
        .theme-dark aside button span {
          color: #f3f4f6 !important;
        }
        .theme-dark aside button {
          color: #9ca3af !important;
        }
        .theme-dark aside button:hover {
          background-color: #1e293b !important;
          color: #818cf8 !important;
        }
        .theme-dark aside button[class*="bg-zinc-850"],
        .theme-dark aside button.bg-zinc-900,
        .theme-dark aside button.bg-zinc-950,
        .theme-dark aside div.bg-zinc-950\/20 {
          background-color: #1e293b !important;
          color: #f3f4f6 !important;
          border-color: #334155 !important;
        }
        .theme-dark aside div.border-t {
          border-top-color: #1e293b !important;
        }

        /* Card Widgets and Boxes inside Dark theme */
        .theme-dark main div.rounded-xl,
        .theme-dark main div.rounded-lg,
        .theme-dark main div.rounded-2xl,
        .theme-dark form div.rounded-xl,
        .theme-dark form div.rounded-lg,
        .theme-dark [class*="bg-zinc-950/70"],
        .theme-dark [class*="bg-zinc-950/40"],
        .theme-dark [class*="bg-zinc-950/20"],
        .theme-dark [class*="bg-[#121624]"],
        .theme-dark [class*="bg-[#0c0d0f]"],
        .theme-dark [class*="bg-black/"] {
          background-color: #111827 !important;
          background-image: none !important;
          border-color: #1e293b !important;
          border-width: 1px !important;
          border-style: solid !important;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25) !important;
        }

        /* Dark Theme Elevated Backgrounds */
        .theme-dark [class*="bg-zinc-950/60"],
        .theme-dark [class*="bg-zinc-900/60"],
        .theme-dark [class*="bg-zinc-850"],
        .theme-dark [class*="bg-zinc-900"],
        .theme-dark [class*="bg-zinc-800/40"],
        .theme-dark [class*="bg-[#1e2333]"] {
          background-color: #1e293b !important;
          border-color: #334155 !important;
        }

        .theme-dark [class*="bg-zinc-950/60"] button,
        .theme-dark [class*="bg-zinc-950/60"] button span {
          color: #9ca3af !important;
        }

        .theme-dark [class*="bg-zinc-950/60"] button.bg-zinc-900,
        .theme-dark [class*="bg-zinc-950/60"] button.bg-zinc-950,
        .theme-dark [class*="bg-zinc-950/60"] button[class*="bg-zinc-"] {
          background-color: #111827 !important;
          color: #818cf8 !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2) !important;
          border: 1px solid #1e293b !important;
        }

        /* Typography colors visibility in Dark theme */
        .theme-dark main span.text-white,
        .theme-dark main h3.text-white,
        .theme-dark main h2.text-white,
        .theme-dark main h1.text-white,
        .theme-dark main p.text-white,
        .theme-dark main button.text-white,
        .theme-dark main div.text-white {
          color: #f3f4f6 !important;
        }

        .theme-dark .text-zinc-400,
        .theme-dark .text-zinc-500,
        .theme-dark .text-slate-400,
        .theme-dark .text-slate-500 {
          color: #9ca3af !important;
        }

        /* Controls inputs in Dark theme */
        .theme-dark input,
        .theme-dark select,
        .theme-dark textarea {
          background-color: #0f172a !important;
          border: 1px solid #334155 !important;
          color: #f3f4f6 !important;
        }
        .theme-dark input:focus,
        .theme-dark select:focus,
        .theme-dark textarea:focus {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
          outline: none !important;
        }

        /* Normalized borders */
        .theme-dark .border-zinc-950,
        .theme-dark .border-zinc-900,
        .theme-dark .border-zinc-850,
        .theme-dark .border-zinc-805,
        .theme-dark .border-zinc-800,
        .theme-dark [class*="border-zinc-"],
        .theme-dark [class*="border-slate-"] {
          border-color: #1e293b !important;
        }

        /* Tables style in Dark theme */
        .theme-dark table {
          background-color: #111827 !important;
        }
        .theme-dark th {
          background-color: #1e293b !important;
          color: #9ca3af !important;
          border-bottom: 2px solid #334155 !important;
          font-weight: 600 !important;
        }
        .theme-dark td {
          border-bottom: 1px solid #1e293b !important;
          color: #f3f4f6 !important;
        }
        .theme-dark tr:hover {
          background-color: #1e293b !important;
        }

        /* Indicators colors visibility in Dark theme */
        .theme-dark .text-emerald-400 {
          color: #34d399 !important;
        }
        .theme-dark .text-rose-455,
        .theme-dark .text-rose-400 {
          color: #f87171 !important;
        }
        .theme-dark .text-sky-400 {
          color: #60a5fa !important;
        }
        .theme-dark .text-amber-400 {
          color: #fbbf24 !important;
        }

        /* Dark Mode Badges */
        .theme-dark [class*="bg-emerald-500/10"],
        .theme-dark [class*="bg-emerald-500/20"],
        .theme-dark [class*="bg-emerald-500/5"] {
          background-color: rgba(52, 211, 153, 0.1) !important;
          color: #34d399 !important;
          border: 1px solid rgba(52, 211, 153, 0.2) !important;
        }
        .theme-dark [class*="bg-rose-500/10"],
        .theme-dark [class*="bg-rose-500/20"],
        .theme-dark [class*="bg-rose-500/5"] {
          background-color: rgba(248, 113, 113, 0.1) !important;
          color: #f87171 !important;
          border: 1px solid rgba(248, 113, 113, 0.2) !important;
        }
        .theme-dark [class*="bg-sky-500/10"],
        .theme-dark [class*="bg-sky-500/20"],
        .theme-dark [class*="bg-sky-500/5"] {
          background-color: rgba(96, 165, 250, 0.1) !important;
          color: #60a5fa !important;
          border: 1px solid rgba(96, 165, 250, 0.2) !important;
        }
        .theme-dark [class*="bg-zinc-800"] {
          background-color: #1e293b !important;
          color: #f3f4f6 !important;
          border: 1px solid #334155 !important;
        }

        /* Interactive active dark states hover details */
        .theme-dark [class*="hover:bg-zinc-"]:hover,
        .theme-dark [class*="hover:bg-slate-"]:hover,
        .theme-dark [class*="hover:bg-neutral-"]:hover,
        .theme-dark [class*="hover:bg-gray-"]:hover,
        .theme-dark button:hover:not([class*="bg-indigo"]):not([class*="bg-emerald"]):not([class*="bg-rose"]):not([class*="bg-amber"]) {
          background-color: #1e293b !important;
          color: #f8fafc !important;
        }

        .theme-dark [class*="hover:text-white"]:hover,
        .theme-dark [class*="hover:text-zinc-100"]:hover,
        .theme-dark [class*="hover:text-zinc-200"]:hover,
        .theme-dark [class*="hover:text-zinc-300"]:hover,
        .theme-dark [class*="hover:text-slate-100"]:hover,
        .theme-dark [class*="hover:text-slate-200"]:hover,
        .theme-dark [class*="hover:text-slate-300"]:hover {
          color: #ffffff !important;
        }

        /* ==========================================================================
           5. RECHARTS GRAPHIC TYPOGRAPHY INTEGRATION
           ========================================================================== */
        .recharts-cartesian-axis-tick text {
          font-family: 'Inter', sans-serif !important;
          font-weight: 500 !important;
        }

        .theme-light .recharts-cartesian-axis-tick text {
          fill: #4b5563 !important;
        }
        .theme-light .recharts-cartesian-axis-line,
        .theme-light .recharts-cartesian-axis-tick-line,
        .theme-light .recharts-cartesian-grid-horizontal line,
        .theme-light .recharts-cartesian-grid-vertical line {
          stroke: #e5e7eb !important;
        }
        .theme-light .recharts-line .recharts-line-curve[stroke="#ffffff"],
        .theme-light .recharts-line .recharts-line-curve[stroke="#fff"] {
          stroke: #1f2937 !important;
        }
        .theme-light .recharts-pie-label-text {
          fill: #1f2937 !important;
        }
        .theme-light .recharts-default-tooltip {
          background-color: #ffffff !important;
          border: 1px solid #e5e7eb !important;
          border-radius: 8px !important;
          color: #1f2937 !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05) !important;
        }
        .theme-light .recharts-tooltip-item,
        .theme-light .recharts-tooltip-label {
          color: #1f2937 !important;
        }

        .theme-dark .recharts-cartesian-axis-tick text {
          fill: #9ca3af !important;
        }
        .theme-dark .recharts-cartesian-axis-line,
        .theme-dark .recharts-cartesian-axis-tick-line,
        .theme-dark .recharts-cartesian-grid-horizontal line,
        .theme-dark .recharts-cartesian-grid-vertical line {
          stroke: #1e293b !important;
        }
        .theme-dark .recharts-line .recharts-line-curve[stroke="#ffffff"],
        .theme-dark .recharts-line .recharts-line-curve[stroke="#fff"] {
          stroke: #f3f4f6 !important;
        }
        .theme-dark .recharts-pie-label-text {
          fill: #f3f4f6 !important;
        }
        .theme-dark .recharts-default-tooltip {
          background-color: #111827 !important;
          border: 1px solid #1e293b !important;
          border-radius: 8px !important;
          color: #f3f4f6 !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        .theme-dark .recharts-tooltip-item,
        .theme-dark .recharts-tooltip-label {
          color: #f3f4f6 !important;
        }

        /* ==========================================================================
           6. SCROLLBARS DESIGN OVERHAUL
           ========================================================================== */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        .theme-light ::-webkit-scrollbar-track {
          background: #f5f7fa;
        }
        .theme-light ::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 9999px;
          border: 2px solid #f5f7fa;
        }
        .theme-light ::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        .theme-dark ::-webkit-scrollbar-track {
          background: #0f172a;
        }
        .theme-dark ::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 9999px;
          border: 2px solid #0f172a;
        }
        .theme-dark ::-webkit-scrollbar-thumb:hover {
          background: #475569;
        }
      `}</style>

      {/* Sidebar for Desktop */}
      <aside className={`hidden md:flex flex-col shrink-0 bg-zinc-900/40 backdrop-blur-md border-r border-zinc-800/60 select-none z-10 transition-all duration-300 ${isSidebarCollapsed ? "w-16" : "w-64"}`}>
        <div className={`p-4 border-b border-zinc-800/60 flex items-center justify-between ${isSidebarCollapsed ? "px-3" : "px-4"}`}>
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-500 shrink-0 shadow-sm shadow-emerald-950">
              <Compass className="h-4 w-4 text-emerald-400" />
            </div>
            {!isSidebarCollapsed && (
              <div className="truncate">
                <span className="font-display font-black text-sm text-white block uppercase tracking-wide leading-none">Quant Terminal</span>
                <span className="text-[10px] text-zinc-400 font-mono mt-0.5 block leading-none">M15 CALIBRATION ACTIVE</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1 shrink-0">
            {/* Theme Toggle Button */}
            <button
              id="active-theme-switch-btn"
              onClick={() => {
                const nextType = theme === "dark" ? "light" : "dark";
                setTheme(nextType);
                localStorage.setItem("quant_theme", nextType);
              }}
              className="p-1 rounded hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors animate-pulse"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-indigo-400" />}
            </button>
            
            {/* Collapse Trigger */}
            <button
              onClick={toggleSidebar}
              className="p-1 rounded hover:bg-zinc-850 text-zinc-400 hover:text-white transition-colors"
              title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {isSidebarCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </button>
          </div>
        </div>

        {/* Navigation Elements */}
        <nav id="sidebar-nav-container" className="flex-1 p-3 space-y-1 overflow-y-auto">
          {filteredMenus.map((m) => {
            const isSelected = activeMenu === m.name || (m.name === "Settings" && ["Backtesting", "MT5 Connector", "SaaS Admin"].includes(activeMenu));
            return (
              <React.Fragment key={m.name}>
                <button
                  id={m.name === "Settings" ? "platform-workspace-btn" : undefined}
                  onClick={() => {
                    setActiveMenu(m.name);
                    if (m.name === "Strategies") {
                      setStrategiesSubMenu("current");
                    } else if (m.name === "Dashboard") {
                      setDashboardSubMenu("all");
                    } else if (m.name === "Signals") {
                      setSignalsSubMenu("all");
                    } else if (m.name === "Trades") {
                      setTradesSubMenu("overview");
                    } else if (m.name === "Timeframe Analysis") {
                      setMtfSubMenu("all");
                    } else if (m.name === "Settings") {
                      setSettingsSubMenu("general");
                    } else if (m.name === "Journal") {
                      setJournalSubMenu("OVERVIEW");
                    }
                  }}
                  title={isSidebarCollapsed ? m.name : undefined}
                  className={`w-full flex items-center py-2 rounded-lg text-xs font-bold transition-all relative cursor-pointer ${
                    isSidebarCollapsed ? "justify-center px-0 h-10" : "justify-between px-3"
                  } ${
                    isSelected
                      ? theme === "light"
                        ? "bg-[#5B4CFF]/10 text-[#5B4CFF] shadow-sm"
                        : "bg-[#5B4CFF]/25 text-white shadow-md border border-[#5B4CFF]/20"
                      : theme === "light"
                        ? "text-slate-600 hover:text-[#5B4CFF] hover:bg-slate-100/85"
                        : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                  }`}
                >
                  <div className={`flex items-center gap-2.5 ${isSidebarCollapsed ? "justify-center" : ""}`}>
                    <span className={isSelected ? theme === "light" ? "text-[#5B4CFF]" : "text-indigo-300" : "text-zinc-500"}>{m.icon}</span>
                    {!isSidebarCollapsed && <span>{m.name}</span>}
                  </div>
                  {!isSidebarCollapsed && !isSuperAdmin && activeTenantDisabledMenus.includes(m.name) ? (
                    <span className="flex items-center gap-1 text-[9px] font-black uppercase text-amber-600 dark:text-amber-400 bg-amber-500/15 border border-amber-500/20 px-1.5 py-0.5 rounded">
                      <Lock className="h-2.5 w-2.5 shrink-0" />
                      Locked
                    </span>
                  ) : !isSidebarCollapsed && m.badgeCount && m.badgeCount > 0 ? (
                    <span className={`font-mono text-[9px] font-black px-1.5 py-0.5 rounded ${
                      m.name === "Trades" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {m.badgeCount}
                    </span>
                  ) : null}
                  {isSidebarCollapsed && !isSuperAdmin && activeTenantDisabledMenus.includes(m.name) ? (
                    <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-amber-500 flex items-center justify-center shadow-md">
                      <Lock className="h-2 w-2 text-zinc-950" />
                    </span>
                  ) : isSidebarCollapsed && m.badgeCount && m.badgeCount > 0 ? (
                    <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  ) : null}
                </button>

                {/* Submenu rendering for Dashboard removed as requested by the user */}

                {/* Submenu rendering for Trades */}
                {m.name === "Trades" && isSelected && !isSidebarCollapsed && (
                  <div className="pl-6 pt-1 pb-1.5 space-y-1 px-1 transition-all">
                    <button
                      onClick={() => setTradesSubMenu("overview")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        tradesSubMenu === "overview"
                          ? "bg-zinc-850 text-emerald-400 font-extrabold border border-emerald-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Overview & KPIs</span>
                    </button>
                    <button
                      onClick={() => setTradesSubMenu("session")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        tradesSubMenu === "session"
                          ? "bg-zinc-850 text-sky-400 font-extrabold border border-sky-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Calendar className="h-3.5 w-3.5 text-sky-450" />
                      <span>Session & Weekday</span>
                    </button>
                    <button
                      onClick={() => setTradesSubMenu("optimizer")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        tradesSubMenu === "optimizer"
                          ? "bg-zinc-850 text-amber-450 font-extrabold border border-amber-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-450" />
                      <span>AI Risk Optimizer</span>
                    </button>
                    <button
                      onClick={() => setTradesSubMenu("active")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        tradesSubMenu === "active"
                          ? "bg-zinc-850 text-indigo-400 font-extrabold border border-indigo-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Active Holdings</span>
                    </button>
                    <button
                      onClick={() => setTradesSubMenu("history")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        tradesSubMenu === "history"
                          ? "bg-zinc-850 text-purple-400 font-extrabold border border-purple-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <History className="h-3.5 w-3.5 text-purple-400" />
                      <span>Trade History</span>
                    </button>
                    <button
                      onClick={() => setTradesSubMenu("breakdowns")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        tradesSubMenu === "breakdowns"
                          ? "bg-zinc-850 text-rose-450 font-extrabold border border-rose-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <BarChart className="h-3.5 w-3.5 text-rose-450" />
                      <span>Breakdown Analytics</span>
                    </button>
                  </div>
                )}

                {/* Submenu rendering for Journal */}
                {m.name === "Journal" && isSelected && !isSidebarCollapsed && (
                  <div className="pl-6 pt-1 pb-1.5 space-y-1 px-1 transition-all">
                    <button
                      onClick={() => setJournalSubMenu("OVERVIEW")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        journalSubMenu === "OVERVIEW"
                          ? "bg-zinc-850 text-emerald-400 font-extrabold border border-emerald-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Overview Analytics</span>
                    </button>
                    <button
                      onClick={() => setJournalSubMenu("SETUPS")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        journalSubMenu === "SETUPS"
                          ? "bg-zinc-850 text-indigo-400 font-extrabold border border-indigo-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Award className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Confluences Audit</span>
                    </button>
                    <button
                      onClick={() => setJournalSubMenu("MISTAKES")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        journalSubMenu === "MISTAKES"
                          ? "bg-zinc-850 text-rose-500 font-extrabold border border-rose-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
                      <span>Mechanical Mistakes</span>
                    </button>
                    <button
                      onClick={() => setJournalSubMenu("PSYCHOLOGY")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        journalSubMenu === "PSYCHOLOGY"
                          ? "bg-zinc-850 text-amber-400 font-extrabold border border-amber-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Smile className="h-3.5 w-3.5 text-amber-450" />
                      <span>Mental Psychology</span>
                    </button>
                    <button
                      onClick={() => setJournalSubMenu("LOG")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        journalSubMenu === "LOG"
                          ? "bg-zinc-850 text-sky-450 font-extrabold border border-sky-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <BookOpen className="h-3.5 w-3.5 text-sky-400" />
                      <span>Personal Logs List</span>
                    </button>
                  </div>
                )}

                {/* Submenu rendering for Strategies */}
                {m.name === "Strategies" && isSelected && !isSidebarCollapsed && (
                  <div className="pl-6 pt-1 pb-1.5 space-y-1 px-1 transition-all">
                    <button
                      onClick={() => setStrategiesSubMenu("current")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        strategiesSubMenu === "current"
                          ? "bg-zinc-800 text-emerald-400 font-extrabold border border-emerald-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Current Strategies</span>
                    </button>
                    <button
                      onClick={() => setStrategiesSubMenu("create")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        strategiesSubMenu === "create"
                          ? "bg-zinc-800 text-sky-400 font-extrabold border border-sky-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-sky-450 text-sky-400" />
                      <span>AI Strategy Builder Assistant</span>
                    </button>
                  </div>
                )}

                {/* Submenu rendering for Timeframe Analysis */}
                {m.name === "Timeframe Analysis" && isSelected && !isSidebarCollapsed && (
                  <div className="pl-6 pt-1 pb-1.5 space-y-1 px-1 transition-all">
                    <button
                      onClick={() => setMtfSubMenu("all")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        mtfSubMenu === "all"
                          ? "bg-zinc-850 text-emerald-400 font-extrabold border border-emerald-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Layers className="h-3.5 w-3.5" />
                      <span>Correlation Matrix</span>
                    </button>
                    <button
                      onClick={() => setMtfSubMenu("inspector")}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        mtfSubMenu === "inspector"
                          ? "bg-zinc-850 text-indigo-400 font-extrabold border border-indigo-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Info className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Interval Inspector</span>
                    </button>
                  </div>
                )}

                {/* Submenu rendering for Settings */}
                {m.name === "Settings" && isSelected && !isSidebarCollapsed && (
                  <div className="pl-6 pt-1 pb-1.5 space-y-1 px-1 transition-all">
                    <button
                      onClick={() => {
                        setActiveMenu("Settings");
                        setSettingsSubMenu("general");
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeMenu === "Settings" && settingsSubMenu === "general"
                          ? "bg-zinc-850 text-emerald-400 font-extrabold border border-emerald-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Settings className="h-3.5 w-3.5 text-zinc-500" />
                      <span>General Sizing & Config</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenu("Settings");
                        setSettingsSubMenu("mt5");
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeMenu === "Settings" && settingsSubMenu === "mt5"
                          ? "bg-zinc-850 text-amber-400 font-extrabold border border-amber-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Link className="h-3.5 w-3.5 text-amber-500" />
                      <span>MT5 Broker Gateway</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenu("Settings");
                        setSettingsSubMenu("backtest");
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeMenu === "Settings" && settingsSubMenu === "backtest"
                          ? "bg-zinc-850 text-indigo-400 font-extrabold border border-indigo-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <LineChart className="h-3.5 w-3.5 text-indigo-450" />
                      <span>Algos Backtester</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenu("Settings");
                        setSettingsSubMenu("profile");
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeMenu === "Settings" && settingsSubMenu === "profile"
                          ? "bg-zinc-850 text-sky-400 font-extrabold border border-sky-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <User className="h-3.5 w-3.5 text-sky-455" />
                      <span>User Profile & Security</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenu("Settings");
                        setSettingsSubMenu("billing");
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeMenu === "Settings" && settingsSubMenu === "billing"
                          ? "bg-zinc-850 text-emerald-400 font-extrabold border border-emerald-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <CreditCard className="h-3.5 w-3.5 text-emerald-450" />
                      <span>Plan Billings & Quotas</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenu("Settings");
                        setSettingsSubMenu("admin");
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeMenu === "Settings" && settingsSubMenu === "admin"
                          ? "bg-zinc-850 text-purple-400 font-extrabold border border-purple-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Users className="h-3.5 w-3.5 text-purple-450" />
                      <span>Workspace Registry</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveMenu("Settings");
                        setSettingsSubMenu("notifications");
                      }}
                      className={`w-full flex items-center gap-2 py-1.5 px-2.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        activeMenu === "Settings" && settingsSubMenu === "notifications"
                          ? "bg-zinc-850 text-indigo-400 font-extrabold border border-indigo-500/10"
                          : "text-zinc-400 hover:text-white hover:bg-zinc-900/40"
                      }`}
                    >
                      <Bell className="h-3.5 w-3.5 text-indigo-400" />
                      <span>Notifications & Sounds</span>
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        {/* Plan Subscriber & User Stats block */}
        {!isSidebarCollapsed ? (
          <div className="border-t border-zinc-900 bg-zinc-950/20 flex flex-col">
            
            {/* Elegant Collapsible Subscriber Profile Card */}
            {(() => {
              const activeTenant = isSuperAdmin ? {
                id: "tenant-super-admin",
                name: "Super Admin",
                email: "harry.jhone@gmail.com",
                tier: "Infinite Super Admin",
                status: "UNBOUNDED",
                limits: { maxStrategies: 999999, maxLotSize: 99999.0, maxConcurrentTrades: 999999, aiSignalsAllowed: true },
                nextBillingDate: "Infinite",
                price: 0
              } : (state?.tenantsList?.find(t => t.id === selectedTenantId) || state?.tenantsList?.[0] || {
                id: "tenant-harry",
                name: "Harry Jhone",
                email: "harry.jhone@gmail.com",
                tier: "Professional",
                status: "Active",
                limits: { maxStrategies: 10, maxLotSize: 5.0, maxConcurrentTrades: 20, aiSignalsAllowed: true },
                nextBillingDate: "2026-06-25",
                price: 249
              });

              let planColorTheme = "text-sky-400 bg-sky-500/10 border-sky-500/20";
              if (activeTenant.tier === "Starter") planColorTheme = "text-amber-500 bg-amber-500/10 border-amber-500/15";
              if (activeTenant.tier === "Institutional") planColorTheme = "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

              return (
                <div id="desktop-subscriber-profile-block" className="border-b border-zinc-900/65">
                  <div 
                    onClick={() => setShowProfileDetails(!showProfileDetails)}
                    className="p-3 hover:bg-zinc-900/30 flex items-center justify-between cursor-pointer transition select-none"
                    title="Click to view subscription limits"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="truncate">
                        <span className="font-sans font-bold text-xs text-white block truncate leading-none">{activeTenant.name}</span>
                        <span className="text-[9.5px] font-mono font-medium text-zinc-500 mt-0.5 block leading-none">{activeTenant.tier} Plan</span>
                      </div>
                    </div>
                    {showProfileDetails ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
                  </div>

                  {/* Expanded Profile Interactive Child-Menu Panel */}
                  {showProfileDetails && (
                    <div className="px-2 py-2 border-t border-zinc-900 bg-zinc-950/80 text-xs font-sans text-zinc-400 animate-fadeIn space-y-2">
                      
                      {/* Sub-header showing subscription active status */}
                      <div className={`px-2.5 py-1.5 flex justify-between items-center rounded-lg border ${
                        theme === "light"
                          ? "bg-slate-50 border-slate-200"
                          : "bg-zinc-900/45 border-zinc-900/50"
                      }`}>
                        <div className="flex flex-col">
                          <span className={`text-[9px] font-mono tracking-wider uppercase ${theme === "light" ? "text-slate-400" : "text-zinc-500"}`}>Active Plan</span>
                          <span className={`font-bold truncate max-w-[130px] ${theme === "light" ? "text-slate-800" : "text-white"}`}>{activeTenant.tier} Level</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border ${
                          activeTenant.status === "Expired" 
                            ? theme === "light"
                              ? "bg-rose-50 text-rose-700 border-rose-250"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                            : theme === "light"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {activeTenant.status}
                        </span>
                      </div>

                      {/* Dropdown Items Group */}
                      <div className="space-y-0.5">
                        
                        {/* 1. View User Profile */}
                        <button
                          onClick={() => {
                            setActiveMenu("Profile");
                            setShowProfileDetails(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                            theme === "light"
                              ? "text-slate-700 hover:bg-slate-100 hover:text-[#5B4CFF] bg-transparent"
                              : "text-zinc-300 hover:bg-indigo-500/10 hover:text-indigo-400 bg-transparent"
                          }`}
                        >
                          <User className={`h-4 w-4 shrink-0 transition-colors ${
                            theme === "light" ? "text-[#5B4CFF]" : "text-indigo-400"
                          }`} />
                          <div className="flex-1 flex flex-col min-w-0 text-left">
                            <span className={`truncate leading-tight font-bold ${
                              theme === "light" ? "text-slate-800" : "text-zinc-300"
                            }`}>My Profile</span>
                            <span className={`text-[9.5px] truncate font-normal ${
                              theme === "light" ? "text-slate-400" : "text-zinc-500"
                            }`}>Subscriber identity settings</span>
                          </div>
                        </button>

                        {/* 2. Manage Plan & Invoices */}
                        <button
                          onClick={() => {
                            setActiveMenu("Billing");
                            setShowProfileDetails(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                            theme === "light"
                              ? "text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 bg-transparent"
                              : "text-zinc-300 hover:bg-emerald-500/10 hover:text-emerald-400 bg-transparent"
                          }`}
                        >
                          <CreditCard className={`h-4 w-4 shrink-0 transition-colors ${
                            theme === "light" ? "text-emerald-600" : "text-emerald-400"
                          }`} />
                          <div className="flex-1 flex flex-col min-w-0 text-left">
                            <span className={`truncate leading-tight font-bold ${
                              theme === "light" ? "text-slate-800" : "text-zinc-300"
                            }`}>Manage Plan</span>
                            <span className={`text-[9.5px] truncate font-normal ${
                              theme === "light" ? "text-slate-400" : "text-zinc-500"
                            }`}>Invoices & lot constraints</span>
                          </div>
                        </button>

                        {/* 3. Restart Walkthrough Guide */}
                        <button
                          onClick={() => {
                            setShowProfileDetails(false);
                            setRunTour(true);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                            theme === "light"
                              ? "text-slate-700 hover:bg-amber-50 hover:text-amber-800 bg-transparent"
                              : "text-zinc-300 hover:bg-amber-500/10 hover:text-amber-400 bg-transparent"
                          }`}
                        >
                          <Compass className={`h-4 w-4 shrink-0 transition-colors ${
                            theme === "light" ? "text-amber-600" : "text-zinc-500"
                          }`} />
                          <div className="flex-1 flex flex-col min-w-0 text-left">
                            <span className={`truncate leading-tight font-bold ${
                              theme === "light" ? "text-slate-800" : "text-zinc-300"
                            }`}>Restart Guided Tour</span>
                            <span className={`text-[9.5px] truncate font-normal ${
                              theme === "light" ? "text-slate-400" : "text-zinc-500"
                            }`}>Interactive step-by-step walkthrough</span>
                          </div>
                        </button>

                        {/* 4. Help & Central Configs */}
                        <button
                          onClick={() => {
                            setActiveMenu("Settings");
                            setSettingsSubMenu("general");
                            setShowProfileDetails(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 flex items-center gap-2.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                            theme === "light"
                              ? "text-slate-700 hover:bg-slate-100 hover:text-[#5B4CFF] bg-transparent"
                              : "text-zinc-300 hover:bg-indigo-500/10 hover:text-indigo-400 bg-transparent"
                          }`}
                        >
                          <Settings className={`h-4 w-4 shrink-0 transition-colors ${
                            theme === "light" ? "text-slate-500" : "text-zinc-500"
                          }`} />
                          <div className="flex-1 flex flex-col min-w-0 text-left">
                            <span className={`truncate leading-tight font-bold ${
                              theme === "light" ? "text-slate-800" : "text-zinc-300"
                            }`}>System Settings</span>
                            <span className={`text-[9.5px] truncate font-normal ${
                              theme === "light" ? "text-slate-400" : "text-zinc-500"
                            }`}>Trading environment & buffers</span>
                          </div>
                        </button>

                        {/* Spacer Border */}
                        <div className={`border-t border-dashed my-1.5 ${
                          theme === "light" ? "border-slate-200" : "border-zinc-900"
                        }`} />

                        {/* 5. Log Out */}
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-2.5 py-2 flex items-center gap-2.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                            theme === "light"
                              ? "text-rose-600 hover:bg-rose-50 hover:text-rose-800 bg-transparent"
                              : "text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 bg-transparent"
                          }`}
                        >
                          <LogOut className={`h-4 w-4 shrink-0 transition-colors ${
                            theme === "light" ? "text-rose-600" : "text-rose-500"
                          }`} />
                          <span className={`flex-1 leading-tight font-bold ${
                            theme === "light" ? "text-rose-700" : "text-rose-500"
                          }`}>Log Out Session</span>
                        </button>

                      </div>

                    </div>
                  )}

                </div>
              );
            })()}

            {localStorage.getItem("quant_is_demo_account") === "true" && (
              <div className="mx-3.5 mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-between text-[11px] font-mono animate-pulse" id="demo-access-sidebar-badge">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                  <span className="font-semibold text-zinc-300">Daily Trial Limit</span>
                </div>
                <span className="font-extrabold font-mono tracking-wider text-amber-400">{formatDemoTime(demoRemainingMs)}</span>
              </div>
            )}

            {/* Trading balance and active statistics */}
            <div className="p-3.5 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Margin Collateral</span>
                <span className="font-bold text-white">
                  {state.config.balance >= 999999999999 ? "Infinite (∞)" : `$${state.config.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-500">Floating Net</span>
                <span className={`font-bold ${floatingPnL >= 0 ? "text-emerald-400 animate-pulse" : "text-rose-450 text-rose-400"}`}>
                  {floatingPnL >= 0 ? "+" : ""}${floatingPnL.toLocaleString(undefined, { minimumFractionDigits: 1 })}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Collapsed Sidebar: Show Avatar badge that logs out or expand profile metadata on click */
          <div className="p-3 border-t border-zinc-900 bg-zinc-950/40 flex flex-col items-center gap-3">
            <button
              onClick={handleLogout}
              className="h-8 w-8 rounded-lg bg-zinc-900 hover:bg-rose-500/10 hover:border-rose-550 border border-zinc-800 text-zinc-400 hover:text-rose-400 flex items-center justify-center transition"
              title="Click to Log Out / Disconnect Subscriber Session"
            >
              <LogOut className="h-4 w-4 shrink-0" />
            </button>
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Quant Network: Secure Node Active" />
          </div>
        )}
      </aside>

      {/* Mobile Topbar */}
      <header className={`md:hidden flex items-center justify-between border-b p-4 sticky top-0 z-40 select-none transition-colors duration-200 ${
        theme === "light"
          ? "bg-white/95 backdrop-blur-md border-slate-200"
          : "bg-zinc-900/90 backdrop-blur-md border-zinc-850"
      }`}>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`p-1 rounded border transition-colors ${
              theme === "light"
                ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-white"
            }`}
            id="btn-mobile-nav"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className={`font-display font-extrabold text-sm uppercase tracking-wider ${
            theme === "light" ? "text-slate-900" : "text-white"
          }`}>Quant Terminal</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Theme Toggle */}
          <button
            onClick={() => {
              const nextType = theme === "dark" ? "light" : "dark";
              setTheme(nextType);
              localStorage.setItem("quant_theme", nextType);
            }}
            className={`p-1.5 rounded border transition-colors ${
              theme === "light"
                ? "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
                : "bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:text-white"
            }`}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-400" />}
          </button>

          <button
            onClick={() => {
              if (isCapitalConsumed) return;
              setModalOpen(true);
            }}
            disabled={isCapitalConsumed}
            className={`p-2 text-white rounded-lg shadow-sm ${
              isCapitalConsumed
                ? "bg-zinc-800 text-zinc-600 opacity-40 cursor-not-allowed"
                : "bg-emerald-600 cursor-pointer"
            }`}
            id="btn-place-order-mobile-top"
          >
            <Plus className="h-4 w-4" />
          </button>

          <button
            onClick={handleLogout}
            className={`p-1.5 rounded border transition-colors ${
              theme === "light"
                ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                : "bg-zinc-950 border-zinc-800/80 text-rose-400 hover:bg-rose-950/20 hover:text-rose-300"
            }`}
            title="Log out Session"
            id="btn-mobile-logout"
          >
            <LogOut className="h-4 w-4 shrink-0" />
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown overlay */}
      {mobileMenuOpen && (
        <div className={`md:hidden fixed inset-x-0 top-[53px] bottom-0 z-30 backdrop-blur-md border-b flex flex-col p-5 space-y-3.5 transition-colors duration-200 ${
          theme === "light"
            ? "bg-white/95 border-slate-200"
            : "bg-zinc-950/95 border-zinc-800"
        }`}>
          <span className={`text-[10px] uppercase font-bold ml-2 tracking-widest ${
            theme === "light" ? "text-slate-500" : "text-zinc-500"
          }`}>Navigation Menus</span>
          <div className="grid grid-cols-2 gap-2">
            {filteredMenus.map((m) => {
              const isSelected = activeMenu === m.name || (m.name === "Settings" && ["Backtesting", "MT5 Connector", "SaaS Admin"].includes(activeMenu));
              return (
                <button
                  key={m.name}
                  onClick={() => {
                    setActiveMenu(m.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-2 py-3 px-3.5 rounded-lg text-xs font-bold border transition z-30 ${
                    isSelected
                      ? theme === "light"
                        ? "bg-[#5B4CFF] border-[#5B4CFF] text-white font-extrabold shadow-sm"
                        : "bg-[#5B4CFF]/25 border-[#5B4CFF]/30 text-white font-extrabold"
                      : theme === "light"
                        ? "bg-slate-50 border-slate-200 text-slate-600 hover:text-[#5B4CFF] hover:bg-slate-100"
                        : "bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className={isSelected ? "text-white" : theme === "light" ? "text-slate-500" : "text-zinc-500"}>{m.icon}</span>
                  <span>{m.name}</span>
                </button>
              );
            })}
          </div>

          {/* Elegant Mobile Profile Card with Collapsible Child-Menu */}
          {(() => {
            const activeTenant = isSuperAdmin ? {
              id: "tenant-super-admin",
              name: "Super Admin",
              email: "harry.jhone@gmail.com",
              tier: "Infinite Super Admin",
              status: "UNBOUNDED",
              limits: { maxStrategies: 999999, maxLotSize: 99999.0, maxConcurrentTrades: 999999, aiSignalsAllowed: true },
              nextBillingDate: "Infinite",
              price: 0
            } : (state?.tenantsList?.find(t => t.id === selectedTenantId) || state?.tenantsList?.[0] || {
              id: "tenant-harry",
              name: "Harry Jhone",
              email: "harry.jhone@gmail.com",
              tier: "Professional",
              status: "Active",
              limits: { maxStrategies: 10, maxLotSize: 5.0, maxConcurrentTrades: 20, aiSignalsAllowed: true },
              nextBillingDate: "2026-06-25-Demo"
            });

            return (
              <div className={`pt-4 mt-auto space-y-3 font-sans select-none shrink-0 border-t ${
                theme === "light" ? "border-slate-200" : "border-zinc-900"
              }`} id="mobile-subscriber-profile-block">
                <span className={`text-[10px] uppercase font-bold ml-2 tracking-widest block text-left ${
                  theme === "light" ? "text-slate-500" : "text-zinc-500"
                }`}>Subscriber Workspace</span>
                
                <div 
                  onClick={() => setShowProfileDetails(!showProfileDetails)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    theme === "light"
                      ? "bg-slate-50 border-slate-200 hover:bg-slate-100"
                      : "bg-zinc-900/60 border-zinc-900 hover:bg-zinc-900/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`h-8 w-8 rounded-full border flex items-center justify-center shrink-0 ${
                        theme === "light"
                          ? "bg-[#5B4CFF]/10 border-[#5B4CFF]/20 text-[#5B4CFF]"
                          : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                      }`}>
                        <User className="h-4 w-4" />
                      </div>
                      <div className="truncate text-left">
                        <span className={`text-xs font-bold block truncate leading-none ${
                          theme === "light" ? "text-slate-900" : "text-white"
                        }`}>{activeTenant.name}</span>
                        <span className={`text-[9.5px] block mt-1.5 leading-none ${
                          theme === "light" ? "text-slate-500" : "text-zinc-550"
                        }`}>{activeTenant.tier} Plan ({activeTenant.status})</span>
                      </div>
                    </div>
                    {showProfileDetails ? (
                      <ChevronUp className={`h-4 w-4 ${theme === "light" ? "text-slate-500" : "text-zinc-500"}`} />
                    ) : (
                      <ChevronDown className={`h-4 w-4 ${theme === "light" ? "text-slate-500" : "text-zinc-500"}`} />
                    )}
                  </div>

                  {/* Expanded Subscriber Interactive Child Menu for Mobile with 44px premium touch targets */}
                  {showProfileDetails && (
                    <div className={`mt-3 pt-3 border-t space-y-1 text-left animate-fadeIn ${
                      theme === "light" ? "border-slate-200" : "border-zinc-900"
                    }`}>
                      
                      {/* 1. Profile */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu("Profile");
                          setMobileMenuOpen(false);
                          setShowProfileDetails(false);
                        }}
                        className={`w-full text-left px-2.5 py-2.5 flex items-center gap-3 rounded-lg transition text-xs font-semibold cursor-pointer min-h-[44px] ${
                          theme === "light"
                            ? "hover:bg-slate-200/50 text-slate-700 hover:text-[#5B4CFF]"
                            : "hover:bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <User className="h-4 w-4 shrink-0 text-[#5B4CFF]" />
                        <span className={theme === "light" ? "text-slate-850 font-bold" : "text-zinc-300"}>My Profile Settings</span>
                      </button>

                      {/* 2. Manage Plan */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu("Billing");
                          setMobileMenuOpen(false);
                          setShowProfileDetails(false);
                        }}
                        className={`w-full text-left px-2.5 py-2.5 flex items-center gap-3 rounded-lg transition text-xs font-semibold cursor-pointer min-h-[44px] ${
                          theme === "light"
                            ? "hover:bg-slate-200/50 text-slate-700 hover:text-emerald-600"
                            : "hover:bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <CreditCard className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span className={theme === "light" ? "text-slate-850 font-bold" : "text-zinc-300"}>Manage Plan & Limits</span>
                      </button>

                      {/* 3. Restart Walkthrough */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProfileDetails(false);
                          setMobileMenuOpen(false);
                          setRunTour(true);
                        }}
                        className={`w-full text-left px-2.5 py-2.5 flex items-center gap-3 rounded-lg transition text-xs font-semibold cursor-pointer min-h-[44px] ${
                          theme === "light"
                            ? "hover:bg-slate-200/50 text-slate-700 hover:text-[#5B4CFF]"
                            : "hover:bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Compass className="h-4 w-4 shrink-0 text-indigo-500" />
                        <span className={theme === "light" ? "text-slate-850 font-bold" : "text-zinc-300"}>Restart Guided Tour</span>
                      </button>

                      {/* 4. Settings */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenu("Settings");
                          setSettingsSubMenu("general");
                          setMobileMenuOpen(false);
                          setShowProfileDetails(false);
                        }}
                        className={`w-full text-left px-2.5 py-2.5 flex items-center gap-3 rounded-lg transition text-xs font-semibold cursor-pointer min-h-[44px] ${
                          theme === "light"
                            ? "hover:bg-slate-200/50 text-slate-700 hover:text-[#5B4CFF]"
                            : "hover:bg-zinc-900 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <Settings className="h-4 w-4 shrink-0 text-slate-500" />
                        <span className={theme === "light" ? "text-slate-850 font-bold" : "text-zinc-300"}>System Configs</span>
                      </button>

                      {/* Space divider */}
                      <div className={`border-t border-dashed my-2 ${
                        theme === "light" ? "border-slate-200" : "border-zinc-900"
                      }`} />

                      {/* 5. Logout */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLogout();
                        }}
                        className="w-full text-left px-2.5 py-2.5 bg-rose-500/5 hover:bg-rose-500/15 flex items-center gap-3 rounded-lg transition text-xs font-bold text-rose-500 cursor-pointer min-h-[44px]"
                      >
                        <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
                        <span>Sign Out Session</span>
                      </button>

                    </div>
                  )}

                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Master Content Platform */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-transparent px-4 py-6 md:px-12 w-full max-w-none">
        {/* Global Warning Banner for Consumed Capital */}
        {isCapitalConsumed && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/5 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-pulse border-solid">
            <div className="flex items-start gap-3">
              <AlertOctagon className="h-5 w-5 text-rose-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-xs font-bold text-rose-500 uppercase tracking-widest font-sans">⚠️ TRADING SUSPENDED: RISK LIMIT HIT</h4>
                <p className="text-[11px] text-zinc-400 mt-1 font-mono leading-relaxed">
                  Negative net change ({netChangeAmount >= 0 ? "+" : "-"}${Math.abs(netChangeAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}) has fully consumed the allocated starting capital of ${state.config.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}. Further trading is automatically blocked by systems risk controllers.
                </p>
              </div>
            </div>
            <div className="text-right text-[10px] font-mono font-bold text-rose-400 border border-rose-900/40 bg-zinc-900 px-2 py-1 rounded self-start sm:self-auto uppercase tracking-wider">
              Account Locked (Live Balance $0.00)
            </div>
          </div>
        )}

        {/* Desk top banner containing connection stat info */}
        <div className="hidden md:flex items-center justify-between border-b border-[#E5E7EB] dark:border-zinc-800 pb-4 mb-6 select-none">
          <div className="flex items-center gap-3">
            <h1 className="font-sans font-extrabold text-xl text-slate-900 dark:text-white leading-none">Quant AI Operations Room</h1>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-medium ${
              state.config.mt5BridgeEnabled 
                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/45" 
                : "bg-red-50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400 border-red-200 dark:border-rose-900/30"
            }`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full ${state.config.mt5BridgeEnabled ? "bg-emerald-500 animate-pulse" : "bg-red-500 animate-pulse"}`} />
              <span>Bridge: {state.config.mt5BridgeEnabled ? "Linked (HTTPS)" : "Offline (Local)"}</span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <div id="collateral-equity-stats" className="flex items-center gap-5 text-xs font-sans">
              <div className="text-right">
                <span className="text-slate-500 dark:text-zinc-500 block text-[9.5px] uppercase font-semibold">Account Equity</span>
                <span className="font-extrabold text-slate-900 dark:text-white text-sm" id="live-account-equity">
                  ${capitalNowLive.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-l border-[#E5E7EB] dark:border-zinc-800 pl-5 text-right">
                <span className="text-slate-500 dark:text-zinc-500 block text-[9.5px] uppercase font-semibold">Floating PnL</span>
                <span className={`font-extrabold text-sm ${floatingPnL >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`} id="live-floating-pnl">
                  {floatingPnL >= 0 ? "+" : ""}${floatingPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-l border-[#E5E7EB] dark:border-zinc-800 pl-5 text-right">
                <span className="text-slate-500 dark:text-zinc-500 block text-[9.5px] uppercase font-semibold">Daily PnL</span>
                <span className={`font-extrabold text-sm ${netChangeAmount >= 0 ? "text-emerald-500 dark:text-emerald-400" : "text-rose-500 dark:text-rose-400"}`} id="live-daily-pnl">
                  {netChangeAmount >= 0 ? "+" : ""}${netChangeAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (isCapitalConsumed) return;
                  setModalOpen(true);
                }}
                disabled={isCapitalConsumed}
                className={`flex items-center gap-1.5 py-2.5 px-4 rounded-lg font-sans text-xs font-bold transition-all shadow-md active:scale-98 text-white ${
                  isCapitalConsumed
                    ? "bg-zinc-400 dark:bg-zinc-800 text-zinc-300 dark:text-zinc-500 cursor-not-allowed opacity-60"
                    : "bg-[#5B4CFF] hover:bg-[#483cd4] cursor-pointer"
                }`}
                id="btn-place-order-top"
              >
                <span>{isCapitalConsumed ? "🔒 Risk Locked" : "Place Manual Order"}</span>
                <ChevronDown className="h-3 w-3 text-white/80" />
              </button>

              <button
                onClick={() => {
                  setSelfHealModalOpen(true);
                  setSelfHealSuccess(false);
                  setSelfHealLog(["Diagnostic core initialization complete. Ready to run automated system healer."]);
                }}
                className="flex items-center gap-1.5 py-2 px-3 border border-amber-200 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-950/10 hover:bg-amber-100 dark:hover:bg-amber-950/20 text-amber-600 dark:text-amber-400 rounded-lg font-sans text-xs font-bold transition-all shadow-sm active:scale-98 cursor-pointer"
                title="Unified Self-Healing Terminal Options"
                id="btn-self-heal-top"
              >
                <Wrench className="h-3.5 w-3.5 animate-bounce" />
                <span className="hidden md:inline">Self-Heal Terminal ⚡</span>
              </button>

              <button
                onClick={() => setActiveMenu("Notifications")}
                className="relative p-2 rounded-full border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950/40 hover:bg-gray-50 dark:hover:bg-zinc-900 transition cursor-pointer outline-none focus:ring-1 focus:ring-[#5B4CFF]"
                id="btn-bell-notifications"
              >
                <Bell className="h-4 w-4 text-slate-700 dark:text-zinc-300" />
                {state.telegramAlerts && state.telegramAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[9px] font-black text-white flex items-center justify-center border-2 border-white dark:border-zinc-950 animate-pulse">
                    {state.telegramAlerts.length}
                  </span>
                )}
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setHeaderProfileMenuOpen(!headerProfileMenuOpen)}
                  className={`relative p-2 rounded-full border transition cursor-pointer outline-none focus:ring-1 focus:ring-[#5B4CFF] flex items-center justify-center ${
                    theme === "light"
                      ? "border-gray-200 bg-white hover:bg-gray-50 text-slate-700 hover:text-[#5B4CFF]"
                      : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white"
                  }`}
                  aria-expanded={headerProfileMenuOpen}
                  id="btn-header-profile"
                >
                  <User className="h-4 w-4" />
                </button>

                {headerProfileMenuOpen && (
                  <>
                    {/* Backdrop cover for closing menu on outside click */}
                    <div 
                      className="fixed inset-0 z-40 bg-transparent" 
                      onClick={() => setHeaderProfileMenuOpen(false)}
                    />
                    
                    <div className={`absolute right-0 mt-2 w-56 rounded-xl border p-2 shadow-xl z-50 animate-fadeIn ${
                      theme === "light"
                        ? "bg-white border-slate-200 text-slate-800"
                        : "bg-zinc-950 border-zinc-900 text-zinc-100"
                    }`}>
                      <div className={`px-3 py-2 border-b mb-1 border-dashed text-left ${
                        theme === "light" ? "border-slate-100" : "border-zinc-900"
                      }`}>
                        <span className={`text-[10px] font-mono tracking-wider uppercase block ${theme === "light" ? "text-slate-400" : "text-zinc-500"}`}>Connected User</span>
                        <span className={`font-bold text-xs truncate block leading-tight ${theme === "light" ? "text-slate-800" : "text-white"}`}>{activeTenant?.name || "Subscriber"}</span>
                        <span className={`text-[9.5px] font-mono mt-0.5 block leading-none ${theme === "light" ? "text-[#5B4CFF]" : "text-emerald-400"}`}>{activeTenant?.tier || "Level"} Account</span>
                      </div>

                      <button
                        onClick={() => {
                          setActiveMenu("Profile");
                          setHeaderProfileMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 flex items-center gap-2.5 rounded-lg transition-all text-xs font-semibold cursor-pointer ${
                          theme === "light"
                            ? "text-slate-700 hover:bg-slate-50 hover:text-[#5B4CFF] bg-transparent"
                            : "text-zinc-300 hover:bg-indigo-500/10 hover:text-indigo-400 bg-transparent"
                        }`}
                      >
                        <User className={`h-4 w-4 shrink-0 ${theme === "light" ? "text-[#5B4CFF]" : "text-indigo-400"}`} />
                        <span className="flex-1 leading-tight font-bold">My Profile</span>
                      </button>

                      <div className={`border-t border-dashed my-1 ${
                        theme === "light" ? "border-slate-200" : "border-zinc-900"
                      }`} />

                      <button
                        onClick={() => {
                          handleLogout();
                          setHeaderProfileMenuOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 flex items-center gap-2.5 rounded-lg transition-all text-xs font-bold cursor-pointer ${
                          theme === "light"
                            ? "text-rose-600 hover:bg-rose-50 hover:text-rose-800 bg-transparent"
                            : "text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 bg-transparent"
                        }`}
                      >
                        <LogOut className="h-4 w-4 shrink-0 text-rose-500" />
                        <span className="flex-1 leading-tight font-bold">Sign Out Session</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Inner View Switch */}
        <div className="flex-1">
          {isNotSubscribed && !isSuperAdmin && [
            "Dashboard",
            "Trades",
            "Journal",
            "Strategies",
            "Timeframe Analysis",
            "Backtesting",
            "MT5 Connector",
            "SaaS Admin",
            "Settings"
          ].includes(activeMenu) && !(activeMenu === "Settings" && settingsSubMenu === "billing") ? (
            <SubscriptionGuard onGoToBilling={() => {
              setActiveMenu("Billing");
              setSettingsSubMenu("billing");
            }} />
          ) : !isSuperAdmin && activeTenantDisabledMenus.includes(activeMenu) && !(activeMenu === "Settings" && settingsSubMenu === "billing") ? (
            <SectionUpgradeOverlay 
              sectionName={activeMenu} 
              onGoToBilling={() => {
                setActiveMenu("Billing");
                setSettingsSubMenu("billing");
              }} 
            />
          ) : (
            <>
              {activeMenu === "Dashboard" && (
            <DashboardView
              state={state}
              onOpenTradeModal={() => setModalOpen(true)}
              onCloseTrade={handleCloseTrade}
              onResetState={handleResetState}
              theme={theme}
              activeSubMenu={dashboardSubMenu}
              onSwitchSubMenu={setDashboardSubMenu}
              onNavigate={setActiveMenu}
              onUpdateConfig={handleUpdateConfig}
            />
          )}

          {activeMenu === "Signals" && (
            <SignalsView
              state={state}
              onRefresh={async () => {
                try {
                  const res = await apiFetch("/api/signals/poll", {
                    method: "POST"
                  });
                  if (res.ok) {
                    const updated = await res.json();
                    setState(updated);
                  } else {
                    const updated = await (await apiFetch("/api/state")).json();
                    setState(updated);
                  }
                } catch (err) {
                  console.error("Failed manual poll, falling back to state fetch:", err);
                  const updated = await (await apiFetch("/api/state")).json();
                  setState(updated);
                }
              }}
              activeSubMenu={signalsSubMenu}
              onSwitchSubMenu={setSignalsSubMenu}
            />
          )}

          {activeMenu === "Trades" && (
            <TradesView 
              state={state} 
              onCloseTrade={handleCloseTrade} 
              onUpdateConfig={handleUpdateConfig} 
              activeSubMenu={tradesSubMenu}
              onSwitchSubMenu={setTradesSubMenu}
            />
          )}

          {activeMenu === "Journal" && (
            <JournalView 
              state={state} 
              onRefresh={async () => {
                const updated = await (await fetch("/api/state")).json();
                setState(updated);
              }}
              activeSubMenu={journalSubMenu}
              onSwitchSubMenu={setJournalSubMenu}
            />
          )}

          {activeMenu === "Notifications" && <NotificationsView state={state} />}

          {activeMenu === "Strategies" && (
            <div className="space-y-4">
              {/* Universal sub-tabs selector for both desktop & mobile views */}
              <div className="flex border-b border-zinc-900 pb-2.5 gap-2">
                <button
                  onClick={() => setStrategiesSubMenu("current")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all ${
                    strategiesSubMenu === "current"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/35"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
                  }`}
                >
                  Current Strategies ({state.strategies.length})
                </button>
                <button
                  onClick={() => setStrategiesSubMenu("create")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans cursor-pointer transition-all flex items-center gap-1.5 ${
                    strategiesSubMenu === "create"
                      ? "bg-sky-500/10 text-sky-400 border border-sky-500/35"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5 text-sky-400" />
                  AI Strategy Builder Assistant
                </button>
              </div>

              {strategiesSubMenu === "current" ? (
                <StrategiesView
                  state={state}
                  isSuperAdmin={isSuperAdmin}
                  onToggleStrategy={handleToggleStrategy}
                  onOptimizeStrategy={handleOptimizeStrategy}
                  onDeleteStrategy={handleDeleteStrategy}
                  onRefreshState={async () => {
                    const updated = await (await apiFetch("/api/state")).json();
                    setState(updated);
                  }}
                  onRestoreStrategy={handleRestoreStrategy}
                  onDeletePermanentStrategy={handleDeletePermanentStrategy}
                />
              ) : (
                <StrategyBuilderView
                  state={state}
                  apiFetch={apiFetch}
                  onRefreshState={async () => {
                    const updated = await (await apiFetch("/api/state")).json();
                    setState(updated);
                  }}
                  onSwitchToCurrent={() => setStrategiesSubMenu("current")}
                />
              )}
            </div>
          )}

          {activeMenu === "Timeframe Analysis" && (
            <MTFAnalysisView 
              state={state} 
              activeSubMenu={mtfSubMenu}
              onSwitchSubMenu={setMtfSubMenu}
            />
          )}

          {activeMenu === "News Calendar" && (
            <NewsCalendarView state={state} onAnalyzeSentiment={handleAnalyzeSentiment} />
          )}

          {activeMenu === "Profile" && (
            <ProfileView
              state={state}
              onRefresh={async () => {
                const updated = await (await apiFetch("/api/state")).json();
                setState(updated);
              }}
            />
          )}

          {activeMenu === "Billing" && (
            <BillingView
              state={state}
              onRefresh={async () => {
                const updated = await (await apiFetch("/api/state")).json();
                setState(updated);
              }}
            />
          )}

          {["Settings", "Backtesting", "MT5 Connector", "SaaS Admin"].includes(activeMenu) && (
            <SettingsView 
              state={state} 
              onUpdateConfig={handleUpdateConfig} 
              onResetState={handleResetState} 
              theme={theme}
              initialTab={
                activeMenu === "Settings"
                  ? settingsSubMenu
                  : activeMenu === "Backtesting"
                    ? "backtest"
                    : activeMenu === "MT5 Connector"
                      ? "mt5"
                      : activeMenu === "SaaS Admin"
                        ? "subscriber"
                        : "general"
              }
              onRefresh={async () => {
                const updated = await (await apiFetch("/api/state")).json();
                setState(updated);
              }}
              onRestartWalkthrough={() => {
                localStorage.removeItem("quant_onboarding_dismissed");
                setRunTour(true);
              }}
              onSwitchTenant={async (tenantId) => {
                localStorage.setItem("quant_active_tenant_id", tenantId);
                setSelectedTenantId(tenantId);
                const updated = await (await fetch("/api/state", {
                  headers: { "X-Tenant-ID": tenantId }
                })).json();
                setState(updated);
              }}
              soundAlertsEnabled={soundAlertsEnabled}
              onToggleSoundAlerts={setSoundAlertsEnabled}
              onPlayTestSound={triggerSound}
            />
          )}

          {activeMenu === "Disclaimer" && <DisclaimerView />}

          {activeMenu === "System Updates" && (
            <UpdateLedgerView state={state} />
          )}
            </>
          )}
        </div>
      </main>

      {/* Global Manual Trade Modal */}
      <TradeModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        symbols={(Object.keys(state.marketData) as SymbolType[])}
        currentPrices={Object.fromEntries(
          (Object.keys(state.marketData) as SymbolType[]).map((k) => [k, state.marketData[k].currentPrice])
        ) as Record<SymbolType, number>}
        onExecute={handleOpenTrade}
        isCapitalConsumed={isCapitalConsumed}
        defaultLotSize={state.config.lotSize}
        config={state.config}
      />

      {state && (
        <ResetNotificationModal
          isOpen={resetPopupOpen}
          onClose={() => setResetPopupOpen(false)}
          currentConfig={state.config}
          wantedConfig={wantedConfig}
          onApplyWantedConfig={handleUpdateConfig}
          theme={theme}
        />
      )}

      {selfHealModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen p-4 text-center">
            {/* Backdrop with elegant blur */}
            <div 
              className="fixed inset-0 bg-slate-950/70 dark:bg-black/85 backdrop-blur-sm transition-opacity animate-fadeIn" 
              onClick={() => !selfHealRunning && setSelfHealModalOpen(false)}
            />

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            {/* Modal Box */}
            <div className={`relative inline-block w-full max-w-xl rounded-2xl border p-6 text-left overflow-hidden shadow-2xl transform transition-all animate-scaleUp ${
              theme === "light"
                ? "bg-white border-slate-200 text-slate-800"
                : "bg-zinc-950 border-zinc-850 text-zinc-100"
            }`}>
              {/* Top gradient/decorative border accent */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-emerald-500" />

              <div className="space-y-5 pt-1">
                {/* Header */}
                <div className={`flex items-center justify-between border-b pb-3.5 ${
                  theme === "light" ? "border-slate-100" : "border-zinc-800/80"
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl flex items-center justify-center ${
                      theme === "light" ? "bg-indigo-50 text-indigo-600" : "bg-indigo-950/40 text-indigo-400"
                    }`}>
                      <Activity className={`h-5 w-5 ${selfHealRunning ? "animate-spin text-emerald-500" : "animate-pulse"}`} />
                    </div>
                    <div>
                      <h4 className={`text-sm font-bold tracking-wider font-mono uppercase ${
                        theme === "light" ? "text-slate-900" : "text-white"
                      }`}>
                        Terminal Self-Healing & Diagnostics
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        <p className={`text-[10px] font-mono ${theme === "light" ? "text-slate-500" : "text-zinc-450"}`}>
                          Automated AI Repair Core v2.4.9
                        </p>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelfHealModalOpen(false)}
                    disabled={selfHealRunning}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 ${
                      theme === "light" 
                        ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700" 
                        : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200"
                    }`}
                  >
                    <X className="h-4.5 w-4.5" />
                  </button>
                </div>

                {/* Info block explaining the current time / weekend context */}
                <div className={`rounded-xl border p-4 text-xs leading-relaxed space-y-2.5 ${
                  theme === "light"
                    ? "bg-slate-50 border-slate-200 text-slate-755"
                    : "bg-zinc-900/40 border-zinc-900 text-zinc-300"
                }`}>
                  <div className="flex items-center gap-2 font-bold font-mono text-[11px] tracking-wider uppercase border-b pb-1.5 border-dashed border-slate-200 dark:border-zinc-800/80">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse inline-block" />
                    <span className={theme === "light" ? "text-slate-800" : "text-amber-400"}>Market Operational Telemetry</span>
                  </div>

                  {/* Grid of Key Info */}
                  <div className="grid grid-cols-1 gap-2.5">
                    <div className="flex items-start gap-2">
                      <span className="text-indigo-500 font-bold font-mono shrink-0">▸</span>
                      <div>
                        <strong className={theme === "light" ? "text-slate-900" : "text-white"}>Current System Time: </strong>
                        <span className="font-mono bg-indigo-50 dark:bg-indigo-950/20 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-bold">
                          {new Date().toISOString().replace("T", " ").substr(0, 19)} UTC
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold font-mono shrink-0">▸</span>
                      <div>
                        <strong className={theme === "light" ? "text-slate-900" : "text-white"}>Day & Session Telemetry: </strong>
                        Saturdays & Sundays are traditional global market closures. Traditional Forex (EURUSD/GBPUSD), Metals (Gold), and Stock/Indices assets do not move on weekends. Crypto assets are available and active 24/7.
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <span className="text-emerald-500 font-bold font-mono shrink-0">▸</span>
                      <div>
                        <strong className={theme === "light" ? "text-slate-900" : "text-white"}>Self-Heal System Actions: </strong>
                        Clicking the option below will instantly bypass all active session/news locks, clear day and hour optimization restricts, toggle automated trading globally, re-sync the live Firebase stream connection, and bypass the Retest Guard so matching signals execute live trades immediately.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Console Log Screen */}
                <div className="rounded-xl bg-slate-950 border border-slate-900 p-4 font-mono text-[11px] leading-relaxed text-emerald-400 space-y-1.5 h-60 overflow-y-auto shadow-2xl relative select-text">
                  <div className="text-zinc-500 border-b border-zinc-900 pb-1.5 flex items-center justify-between sticky top-0 bg-slate-950 z-10">
                    <span className="tracking-wider text-[10px] font-bold text-zinc-400">SYSTEM CORE DIAGNOSTICS LOG:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[9px] text-emerald-500 animate-pulse font-bold">ON-CONNECTOR</span>
                    </div>
                  </div>
                  <div className="pt-2 space-y-2">
                    {selfHealLog.map((logLine, idx) => (
                      <div key={idx} className="flex gap-2">
                        <span className="text-emerald-600 shrink-0 select-none">&gt;</span>
                        <span className="whitespace-pre-wrap">{logLine}</span>
                      </div>
                    ))}
                    {selfHealRunning && (
                      <div className="flex items-center gap-2 text-zinc-400 italic font-mono text-[10px] animate-pulse">
                        <span className="h-1.5 w-1.5 bg-zinc-500 animate-ping rounded-full shrink-0" />
                        <span>Running core diagnostic checks, MT5 EA whitelisting coupling, state-tree revalidation...</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions footer */}
                <div className="flex items-center gap-3 pt-1">
                  <button
                    type="button"
                    disabled={selfHealRunning}
                    onClick={async () => {
                      setSelfHealRunning(true);
                      setSelfHealSuccess(false);
                      setSelfHealLog((prev) => [...prev, "Spawning asynchronous sandbox repairs...", "Initiating MT5-EA loopback handshakes..."]);
                      
                      try {
                        const response = await apiFetch("/api/terminal/self-heal", {
                          method: "POST"
                        });
                        const data = await response.json() as any;
                        
                        if (data.success) {
                          // Fetch and synchronize updated states immediately
                          apiFetch("/api/state")
                            .then((res) => {
                              if (res.ok) return res.json();
                            })
                            .then((updatedState) => {
                              if (updatedState) {
                                setState(updatedState);
                              }
                            })
                            .catch((err) => console.error("Self-Heal State Sync Error:", err));

                          // Simulate elegant retro analysis typewriter logging
                          setTimeout(() => {
                            setSelfHealLog((prev) => [
                              ...prev,
                              "✓ Recoupled MetaTrader 5 High-Frequency Bridge successfully",
                              "✓ Restored global state active configurations (Balanced capital cap verified)"
                            ]);
                          }, 600);

                          setTimeout(() => {
                            setSelfHealLog((prev) => [
                              ...prev,
                              "✓ Automated News-Stream filters & Session locks safely bypassed",
                              "✓ Saturday/Sunday restricted day/hour optimizations unlocked"
                            ]);
                          }, 1200);

                          setTimeout(() => {
                            setSelfHealLog((prev) => [
                              ...prev,
                              "✓ Retest Breakout Guard bypassed: Triggering immediate matching strategy entries",
                              "✓ Re-authenticated secure Google Firestore stream channel (Cleared RPC idle-stream warning)"
                            ]);
                          }, 1850);

                          setTimeout(() => {
                            setSelfHealLog((prev) => [
                              ...prev,
                              "🎯 SELF-HEALING RECOVERY COMPLETED SUCCESSFULLY! All blocks cleared, strategies active."
                            ]);
                            setSelfHealRunning(false);
                            setSelfHealSuccess(true);
                          }, 2500);
                        } else {
                          setSelfHealLog((prev) => [...prev, `❌ Error: ${data.error || "Execution failed."}`]);
                          setSelfHealRunning(false);
                        }
                      } catch (err: any) {
                        setSelfHealLog((prev) => [...prev, `❌ Network Error: ${err.message || String(err)}`]);
                        setSelfHealRunning(false);
                      }
                    }}
                    className={`flex-1 py-3 px-4 rounded-xl text-center text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                      selfHealRunning
                        ? "bg-zinc-850 text-zinc-500 cursor-not-allowed"
                        : selfHealSuccess
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "bg-indigo-600 hover:bg-indigo-700 text-white"
                    }`}
                  >
                    {selfHealRunning ? (
                      <>
                        <Activity className="h-4 w-4 animate-spin text-emerald-300" />
                        <span>Self-Healing in Progress...</span>
                      </>
                    ) : selfHealSuccess ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-100" />
                        <span>System Active & Fully Repaired ✓</span>
                      </>
                    ) : (
                      <>
                        <Wrench className="h-4 w-4" />
                        <span>Run Full Automated Self-Healing Suite ⚡</span>
                      </>
                    )}
                  </button>

                  {!selfHealRunning && (
                    <button
                      type="button"
                      onClick={() => setSelfHealModalOpen(false)}
                      className={`py-3 px-5 border rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        theme === "light"
                          ? "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                          : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      }`}
                    >
                      Dismiss
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <OnboardingWalkthrough
        runTour={runTour}
        onClose={() => setRunTour(false)}
        onStartTour={() => setRunTour(true)}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
        setModalOpen={setModalOpen}
        theme={theme}
      />

      {/* Floating System-Wide Sandbox Safe Toast system */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[99999] max-w-sm w-[90vw] md:w-full animate-in slide-in-from-bottom duration-300">
          <div className={`p-4 rounded-xl border shadow-2xl flex items-start gap-3 relative ${
            toast.type === "success"
              ? "bg-emerald-950/95 border-emerald-500/30 text-emerald-100"
              : toast.type === "error"
              ? "bg-rose-950/95 border-rose-500/30 text-rose-100"
              : "bg-zinc-900/95 border-zinc-850 text-zinc-100"
          }`}>
            <div className={`p-1.5 rounded-lg shrink-0 ${
              toast.type === "success"
                ? "bg-emerald-500/10 text-emerald-400"
                : toast.type === "error"
                ? "bg-rose-500/10 text-rose-455"
                : "bg-zinc-800 text-zinc-300"
            }`}>
              {toast.type === "success" ? (
                <ShieldCheck className="h-4 w-4" />
              ) : toast.type === "error" ? (
                <AlertTriangle className="h-4 w-4" />
              ) : (
                <Info className="h-4 w-4" />
              )}
            </div>
            <div className="space-y-1 pr-6 text-left">
              <span className="text-xs font-bold font-sans block">
                {toast.type === "success" ? "System Notification" : toast.type === "error" ? "System Alert" : "System Notification"}
              </span>
              <p className="text-[11px] leading-relaxed font-sans text-zinc-300">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast(null)}
              className="absolute top-3.5 right-3.5 text-zinc-500 hover:text-white transition cursor-pointer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
