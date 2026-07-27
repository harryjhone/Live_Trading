import React, { useState, useEffect } from "react";
import { 
  Users, 
  CreditCard, 
  ShieldAlert, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  ArrowRight, 
  Sparkles,
  DollarSign,
  Activity,
  User,
  Zap,
  Briefcase,
  Smartphone,
  QrCode,
  Lock,
  Check,
  AlertCircle,
  Building,
  Mail,
  ShieldCheck,
  Shield,
  Sliders,
  CheckSquare,
  Eye,
  EyeOff,
  MinusCircle,
  AlertTriangle,
  ArrowUpRight
} from "lucide-react";
import { FullAppState, TenantInfo } from "../types";
import BillingView from "./BillingView";

export const SUBSCRIBER_MENUS = [
  { id: "Dashboard", label: "Dashboard View", desc: "Main portfolio tracker, active PnL charts, and trading metrics." },
  { id: "Signals", label: "Algorithmic Signals", desc: "Real-time trade signals, pending triggers, and blocked reasons." },
  { id: "Trades", label: "Active & Historic Trades", desc: "Open positions tracking, MFE/MAE analysis, and trade history." },
  { id: "Journal", label: "Analytical Journal", desc: "Trading logs, personal feedback text, and filterable tags." },
  { id: "Notifications", label: "Telegram Alert Streams", desc: "Delivery logs, error check details, and bot connection logs." },
  { id: "Strategies", label: "Quantitative Models", desc: "Toggle models (Hybrid, EMA Cross, MWDX, etc.) & define limits." },
  { id: "Timeframe Analysis", label: "Technical Multitimeframe Charts", desc: "Vite charts with RSI, EMA, SMAs and variable candlestick resolutions." },
  { id: "News Calendar", label: "Macro Event Stream", desc: "High/Med impact global currency events & dynamic AI news sentiment analysis." },
  { id: "Disclaimer", label: "Terminal Disclaimers", desc: "Regulatory safe harbor notices and trading risk acknowledgements." },
  { id: "Settings", label: "Workspace Controls", desc: "General configuration panels, risk allocation, sound tests, and parameters." },
  { id: "Profile", label: "User Identification Cards", desc: "Workspace credential inspection & standard login details." },
  { id: "Billing", label: "Subscription Billing Portal", desc: "Credit card sim checkout, invoice renewal timelines, and secure premium plans." },
  { id: "System Updates", label: "Terminal Core Logs & Git", desc: "Software iteration cycles, source files overview, and commit logs." }
];

interface SaaSAdminViewProps {
  state: FullAppState;
  onRefresh: () => void;
  onSwitchTenant: (tenantId: string) => void;
  initialTab?: "tenant-billing" | "admin-registry" | "pricing-admin" | "secure-billing";
}

export default function SaaSAdminView({ state, onRefresh, onSwitchTenant, initialTab }: SaaSAdminViewProps) {
  const [isSuperAdmin] = useState<boolean>(() => {
    return localStorage.getItem("quant_is_super_admin") === "true";
  });

  const fetch = async (url: string, init?: RequestInit) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> || {}),
      "X-Tenant-ID": state.activeTenantId || "tenant-harry",
    };
    if (localStorage.getItem("quant_is_super_admin") === "true") {
      headers["X-Admin-Key"] = "@Hariom12";
      headers["X-Is-Super-Admin"] = "true";
    }
    return window.fetch(url, { ...init, headers });
  };

  // Tab control: default to subscriber profile & billing, but for super-admin default to workspace registry!
  const [activeTab, setActiveTab] = useState<"tenant-billing" | "admin-registry" | "pricing-admin" | "secure-billing">(() => {
    const isSuper = localStorage.getItem("quant_is_super_admin") === "true";
    if (isSuper) {
      return (initialTab === "tenant-billing" || !initialTab) ? "admin-registry" : initialTab;
    }
    return initialTab || "tenant-billing";
  });

  useEffect(() => {
    if (initialTab) {
      if (isSuperAdmin && initialTab === "tenant-billing") {
        setActiveTab("admin-registry");
      } else {
        setActiveTab(initialTab);
      }
    }
  }, [initialTab, isSuperAdmin]);
  
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const generateStrongPasscode = (): string => {
    const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
    const lowercase = "abcdefghijkmnopqrstuvwxyz";
    const numbers = "23456789";
    const symbols = "!@#%^*";
    const all = uppercase + lowercase + numbers + symbols;
    
    let passcode = "QP-";
    passcode += uppercase[Math.floor(Math.random() * uppercase.length)];
    passcode += lowercase[Math.floor(Math.random() * lowercase.length)];
    passcode += numbers[Math.floor(Math.random() * numbers.length)];
    passcode += symbols[Math.floor(Math.random() * symbols.length)];
    
    for (let i = 0; i < 4; i++) {
      passcode += all[Math.floor(Math.random() * all.length)];
    }
    
    const chars = passcode.slice(3).split("");
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    return "QP-" + chars.join("");
  };

  // Form states for creating a new tenant (Admin tab)
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState(generateStrongPasscode());
  const [newTier, setNewTier] = useState<"Starter" | "Professional" | "Institutional">("Starter");
  const [newBalance, setNewBalance] = useState("10000");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Feature block permissions adjustment states
  const [editingFeatureTenantId, setEditingFeatureTenantId] = useState<string | null>(null);
  const [tempDisabledMenus, setTempDisabledMenus] = useState<string[]>([]);

  // Dynamic pricing states
  const [plansConfig, setPlansConfig] = useState<any>(null);
  const [promosConfig, setPromosConfig] = useState<any[]>([]);

  // Promo code creator state
  const [promoNewCode, setPromoNewCode] = useState("");
  const [promoNewDiscount, setPromoNewDiscount] = useState("20");
  const [promoNewIsActive, setPromoNewIsActive] = useState(true);
  const [promoNewIsTrial, setPromoNewIsTrial] = useState(false);
  const [promoNewTrialDays, setPromoNewTrialDays] = useState("7");

  useEffect(() => {
    if (state.pricingConfig) {
      if (state.pricingConfig.plans) {
        setPlansConfig(JSON.parse(JSON.stringify(state.pricingConfig.plans)));
      }
      if (state.pricingConfig.promotionalCodes) {
        setPromosConfig(JSON.parse(JSON.stringify(state.pricingConfig.promotionalCodes)));
      }
    }
  }, [state.pricingConfig]);

  const handleSavePricingConfig = async (updatedPlans?: any, updatedPromos?: any[]) => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const response = await fetch("/api/admin/pricing/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plans: updatedPlans || plansConfig,
          promotionalCodes: updatedPromos || promosConfig
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccessMsg("System pricing ledger updated successfully & saved to secure persistent backup.");
        onRefresh();
      } else {
        setErrorMsg(data.error || "Failed to update dynamic pricing parameters.");
      }
    } catch (err: any) {
      setErrorMsg("Connection failure updating system pricing ledger.");
    } finally {
      setSubmitting(false);
    }
  };

  // Form states for active tenant profile (Subscriber Billing tab)
  const tenants = state.tenantsList || [];
  const activeTenantId = state.activeTenantId || "tenant-harry";
  const currentTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];

  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("+1 555-019-2831");
  const [editCompany, setEditCompany] = useState("Harry Jhone Alpha Corp");

  const [showAdminEditPasscode, setShowAdminEditPasscode] = useState(false);
  const [showAdminNewPasscode, setShowAdminNewPasscode] = useState(false);

  // Sync profile form when current tenant workspace changes
  useEffect(() => {
    if (currentTenant) {
      setEditName(currentTenant.name || "");
      setEditEmail(currentTenant.email || "");
      setEditUsername(currentTenant.username || currentTenant.id.replace("tenant-", ""));
      setEditPassword(currentTenant.password || "@Hariom12");
    }
  }, [currentTenant?.id]);

  // Billing checkout gateway simulator state
  const [selectedPlanTier, setSelectedPlanTier] = useState<"Starter" | "Professional" | "Institutional">(
    (currentTenant?.tier as any) || "Starter"
  );
  const [paymentGatewayType, setPaymentGatewayType] = useState<"UPI" | "CARD">("UPI");
  
  // Credit Card states
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  
  // UPI states
  const [upiVpa, setUpiVpa] = useState("");
  const [upiProvider, setUpiProvider] = useState("@upi");
  const [upiAppSelector, setUpiAppSelector] = useState<"GPay" | "PhonePe" | "Paytm" | "BHIM">("GPay");

  // Checkout process simulation states
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStepIndex, setPaymentStepIndex] = useState(0);
  const [paymentStepText, setPaymentStepText] = useState("");
  const [checkoutCompleteSuccess, setCheckoutCompleteSuccess] = useState(false);

  // Calculate MRR (Monthly Recurring Revenue for Admin view)
  const totalMRR = tenants.reduce((sum, t) => {
    if (t.status === "Active" || t.status === "Past Due") {
      const planPrice = t.tier === "Institutional" ? 599 : t.tier === "Professional" ? 249 : 99;
      return sum + planPrice;
    }
    return sum;
  }, 0);

  const activeCount = tenants.filter(t => t.status === "Active").length;
  const expiredCount = tenants.filter(t => t.status === "Expired").length;

  // Format Credit Card input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(" ") || raw;
    setCardNumber(formatted);
  };

  const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
    if (raw.length > 2) {
      raw = raw.slice(0, 2) + "/" + raw.slice(2);
    }
    setCardExpiry(raw);
  };

  // Profile Save Endpoint Trigger (Real-time updates)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/tenants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          name: editName,
          email: editEmail,
          username: editUsername,
          password: editPassword
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update profile.");
      }
      setSuccessMsg("Subscriber profile and legal identity updated securely on-chain.");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Update Status or Tier manually
  const handleDirectUpdateTenant = async (tenantId: string, payload: Partial<TenantInfo>) => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/tenants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, ...payload })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update workspace configuration.");
      }
      setSuccessMsg(`Workspace configuration successfully re-indexed.`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Billing simulation trigger
  const handleSimulateBilling = async (tenantId: string) => {
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/tenants/bill-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Billing simulation failed.");
      }
      const data = await res.json();
      setSuccessMsg(`Simulated auto-pay debit transaction. Deducted plan fee from ${data.tenant.name}'s account collateral.`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Admin: Create tenant endpoint
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName || !newEmail) {
      setErrorMsg("Please fill in all required fields for a new workspace.");
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: newId.trim().toLowerCase().replace(/\s+/g, "-"),
          name: newName,
          email: newEmail,
          username: newUsername,
          password: newPassword,
          tier: newTier,
          balance: Number(newBalance) || 10000
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create workspace.");
      }
      setSuccessMsg(`Created new workspace '${newName}' successfully.`);
      setNewId("");
      setNewName("");
      setNewEmail("");
      setNewUsername("");
      setNewPassword(generateStrongPasscode());
      setNewTier("Starter");
      setNewBalance("10000");
      setShowCreateForm(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Interactive Payment Gateway processing steps simulator (Real-time feedback)
  const triggerSimulationSequence = () => {
    setPaymentProcessing(true);
    setPaymentStepIndex(0);
    setPaymentStepText("Connecting to secure payment gateway interface...");

    const steps = [
      "Establishing mutual handshakes with secure UPI/Card terminal acquirer...",
      paymentGatewayType === "UPI" 
        ? `Awaiting confirmation request approval on mobile UPI app for address: ${upiVpa || "guest"}${upiProvider}...`
        : "Validating credit card credentials, securing dynamic 3D-secure network token...",
      "Authorized. Submitting credit ledger settlement payload to server database...",
      "Secured! Re-calculating multi-account lot-size limits and updating routing filters...",
      "Process Complete. New workspace subscription parameters active!"
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setPaymentStepIndex(currentStep);
        setPaymentStepText(steps[currentStep]);
      } else {
        clearInterval(interval);
        executeUpgradeCompletion();
      }
    }, 1200);
  };

  // Execute actual server-side update after payment authorized and notify client
  const executeUpgradeCompletion = async () => {
    if (!currentTenant) return;
    try {
      const planPrice = selectedPlanTier === "Institutional" ? 599 : selectedPlanTier === "Professional" ? 249 : 99;
      
      const res = await fetch("/api/admin/tenants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          tier: selectedPlanTier,
          status: "Active",
          price: planPrice,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to commit upgraded plan state.");
      }

      setCheckoutCompleteSuccess(true);
      setSuccessMsg(`🎉 Outstanding! Successfully upgraded and processed payment for ${selectedPlanTier} Plan! Limits updated.`);
      
      // Clear forms
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardholderName("");
      setUpiVpa("");
      
      onRefresh(); // refresh main context
    } catch (err: any) {
      setErrorMsg(`Payment simulated but failed backend storage: ${err.message}`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Cancel subscription: updates status to "Expired" (the suspended state in the backend)
  const handleCancelPlan = async () => {
    if (!currentTenant) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/tenants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          status: "Expired",
          nextBillingDate: "Subscription Suspended"
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to cancel subscription.");
      }
      setSuccessMsg(`🚫 Subscription cancelled successfully. Workspace limits have been suspended.`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Reactivate plan instantly to "Active"
  const handleReactivatePlan = async () => {
    if (!currentTenant) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const planPrice = currentTenant.tier === "Institutional" ? 599 : currentTenant.tier === "Professional" ? 249 : 99;
      const res = await fetch("/api/admin/tenants/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant.id,
          status: "Active",
          nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to reactivate subscription.");
      }
      setSuccessMsg(`🎉 Subscription reactivated successfully! Workspace is now fully Active.`);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-2xl border border-red-950/40 bg-zinc-950/60 text-center space-y-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-red-950/30 flex items-center justify-center border border-red-900/50">
          <ShieldAlert className="h-8 w-8 text-red-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-xl font-bold text-zinc-100 tracking-wider uppercase">
            RESTRICTED ACCESS PORTAL
          </h3>
          <p className="text-sm text-zinc-400 font-sans max-w-md mx-auto leading-relaxed">
            You do not possess the supreme cryptographic signature keys required to inspect the portfolio ledgers. SaaS Admin capabilities are kept strictly confidential.
          </p>
        </div>
        <div className="pt-2 border-t border-zinc-900 text-xs text-zinc-500 font-mono">
          REF: COUPLING_AUTH_FAILURE | IP: SANDBOX_PROTECTED
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans text-white">
      {/* Header and Brand Title */}
      <div className="border-b border-zinc-900 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-black text-white flex items-center gap-2 tracking-wider uppercase">
            <Users className="h-5 w-5 text-emerald-500" />
            {isSuperAdmin ? "Super Admin Platform Console" : "Platform Workspaces & Subscription Hub"}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {isSuperAdmin 
              ? "Oversee regional subscribers, update trading bounds and lot limits, adjust core plan pricing ledgers, and manage secure payment webhook connectors."
              : "Isolate workspace configurations, review subscriber profiles, pay invoices through UPI or Cards, compare plan pricing, and manage API boundaries."
            }
          </p>
        </div>
        
        {/* Workspace Quick-Access Tab Toggle */}
        <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-900 shrink-0 gap-1">
          {!isSuperAdmin && (
            <button
              onClick={() => setActiveTab("tenant-billing")}
              className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === "tenant-billing" 
                  ? "bg-zinc-800 text-white" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
              Billing & Profile Portal
            </button>
          )}
          
          <button
            onClick={() => setActiveTab("admin-registry")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "admin-registry" 
                ? "bg-zinc-800 text-white" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Users className="h-3.5 w-3.5 text-emerald-400" />
            Workspace Registry
          </button>

          <button
            onClick={() => setActiveTab("pricing-admin")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "pricing-admin" 
                ? "bg-zinc-800 text-white" 
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            Pricing & Offer Settings
          </button>

          <button
            onClick={() => setActiveTab("secure-billing")}
            className={`px-3 py-1.5 rounded text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === "secure-billing" 
                ? "bg-zinc-800 text-white" 
                : "text-zinc-500 hover:text-zinc-300"
              }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-indigo-400 font-bold" />
            Gateway Billing Active
          </button>
        </div>
      </div>

      {/* Global MRR and subscriber statistics dashboard (Always visible for platform fidelity) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <DollarSign className="h-3 w-3 text-emerald-400" />
            Global Platform MRR
          </div>
          <div className="font-mono text-2xl font-black text-white">${totalMRR.toLocaleString()}<span className="text-xs text-zinc-500 font-normal">/mo</span></div>
          <p className="text-[10px] text-emerald-400 mt-1">
            Aggregated active subscriptions
          </p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Users className="h-3 w-3 text-emerald-400" />
            Total Workspaces
          </div>
          <div className="font-mono text-2xl font-black text-white">{tenants.length} Workspaces</div>
          <p className="text-[10px] text-zinc-400 mt-1">
            {activeCount} Active • {expiredCount} Expired
          </p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Smartphone className="h-3 w-3 text-emerald-400" />
            Billing Gateways
          </div>
          <div className="font-mono text-sm font-bold text-emerald-400 mt-1">Real-Time Card & UPI</div>
          <p className="text-[10px] text-zinc-500 mt-1">
            Secure processing simulator enabled
          </p>
        </div>

        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-4">
          <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-emerald-400" />
            Active Workspace
          </div>
          <div className="font-mono text-xs font-extrabold text-orange-400 truncate mt-1">
            {currentTenant ? currentTenant.name : "None Loaded"}
          </div>
          <p className="text-[10px] text-zinc-500 mt-0.5 truncate">
            ID: {activeTenantId}
          </p>
        </div>
      </div>

      {/* Alert logs and callback system messages */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>Error: {errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0 animate-bounce" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ==================== TAB 1: WORKSPACE BILLING & SUBSCRIBER PROFILE ==================== */}
      {activeTab === "tenant-billing" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: PROFILE UPDATE & PLAN SELECTION */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* WORKSPACE SUBSCRIBER PROFILE SECTION */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5">
              <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3 mb-4">
                <div className="h-7 w-7 rounded bg-zinc-900 flex items-center justify-center text-emerald-400">
                  <User className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                    Platform Core Subscriber Profile
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Configure your workspace identities and metadata. Saves directly to the backend database.
                  </p>
                </div>
              </div>

              {currentTenant ? (
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1">WORKSPACE UNIQUE ID</label>
                      <input 
                        type="text" 
                        value={currentTenant.id} 
                        disabled
                        className="bg-zinc-900/40 border border-zinc-900 rounded px-2.5 py-1.5 text-xs text-zinc-500 font-mono w-full cursor-not-allowed uppercase" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1">PARENT CLIENT/REGISTERED NAME</label>
                      <input 
                        type="text" 
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="e.g. Harry Doe Ltd"
                        required
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 w-full focus:outline-none focus:border-emerald-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1">CONTRACT METADATA EMAIL</label>
                      <input 
                        type="email" 
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="e.g. billing@company.com"
                        required
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1">DESK CONTACT PHONE (OPTIONAL)</label>
                      <input 
                        type="text" 
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 w-full focus:outline-none focus:border-emerald-500" 
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-emerald-500 block mb-1">WORKSPACE LOGIN USERNAME (FOR CONSOLE LOGIN)</label>
                      <input 
                        type="text" 
                        value={editUsername}
                        onChange={(e) => setEditUsername(e.target.value)}
                        placeholder="e.g. harry"
                        required
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-600 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-mono text-emerald-500 block leading-tight">WORKSPACE SECURITY PASSCODE</label>
                        <button
                          type="button"
                          onClick={() => setEditPassword(generateStrongPasscode())}
                          className="text-[9px] font-bold text-emerald-500 hover:underline cursor-pointer"
                        >
                          Generate New
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type={showAdminEditPasscode ? "text" : "password"} 
                          value={editPassword}
                          onChange={(e) => setEditPassword(e.target.value)}
                          placeholder="Passcode"
                          required
                          className="bg-zinc-900 border border-zinc-800 rounded pl-2.5 pr-10 py-1.5 text-xs text-white placeholder-zinc-600 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                        />
                        <button
                          type="button"
                          onClick={() => setShowAdminEditPasscode(!showAdminEditPasscode)}
                          className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer"
                        >
                          {showAdminEditPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-zinc-900/65">
                    <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                      <Lock className="h-3 w-3 text-zinc-600" />
                      Encrypted connection via HTTPS Gateway
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-emerald-500 hover:bg-emerald-600 text-neutral-950 font-extrabold text-xs px-4 py-1.5 rounded-lg transition shrink-0 cursor-pointer"
                    >
                      {submitting ? "Updating Profile..." : "Save Identity Metadata"}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="p-4 rounded-lg bg-zinc-900/20 border border-zinc-800 text-center text-xs text-zinc-500">
                  Select or switch onto a workspace from the registry tab first to modify details.
                </div>
              )}
            </div>

            {/* CURRENT SUBSCRIPTION DASHBOARD WITH LIVE DEPLOY ACTIONS */}
            {currentTenant && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5 space-y-4 font-sans text-white">
                <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-emerald-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Your Active Subscription status</h4>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border uppercase ${
                    currentTenant.status === "Expired" 
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                      : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse"
                  }`}>
                    {currentTenant.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900/60 text-xs">
                  <div>
                    <span className="text-zinc-500 font-mono text-[9px] block uppercase">Current Active Tier</span>
                    <span className="font-extrabold text-white mt-1 block">{currentTenant.tier} Plan</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono text-[9px] block uppercase">Next Renewal date</span>
                    <span className="font-bold text-zinc-300 mt-1 block font-mono">{currentTenant.nextBillingDate || "30 days from now"}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500 font-mono text-[9px] block uppercase">Subscribed Pricing rate</span>
                    <span className="font-bold text-emerald-400 mt-1 block font-mono">${currentTenant.price || (currentTenant.tier === "Institutional" ? 599 : currentTenant.tier === "Professional" ? 249 : 99)}/mo</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  {currentTenant.status !== "Expired" ? (
                    <button
                      onClick={handleCancelPlan}
                      disabled={submitting}
                      className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 text-[10.5px] font-black uppercase tracking-wider rounded-lg border border-rose-500/20 hover:border-rose-500/40 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <MinusCircle className="h-4 w-4 stroke-[2.5]" />
                      Cancel Subscription
                    </button>
                  ) : (
                    <button
                      onClick={handleReactivatePlan}
                      disabled={submitting}
                      className="px-3.5 py-2 bg-emerald-400 hover:bg-emerald-500 text-black text-[10.5px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Check className="h-4 w-4 stroke-[3px]" />
                      Reactivate Subscription
                    </button>
                  )}

                  {/* Dynamic Downgrade/Upgrade Option */}
                  {selectedPlanTier !== currentTenant.tier && (
                    <button
                      onClick={async () => {
                        setSubmitting(true);
                        setErrorMsg(null);
                        setSuccessMsg(null);
                        try {
                          const planPrice = selectedPlanTier === "Institutional" ? 599 : selectedPlanTier === "Professional" ? 249 : 99;
                          const res = await fetch("/api/admin/tenants/update", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              tenantId: currentTenant.id,
                              tier: selectedPlanTier,
                              price: planPrice,
                              status: "Active",
                              nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
                            })
                          });
                          if (!res.ok) {
                            const err = await res.json();
                            throw new Error(err.error || "Failed to shift plan.");
                          }
                          setSuccessMsg(`🎉 Outstanding! Plan successfully changed to ${selectedPlanTier}!`);
                          onRefresh();
                        } catch (err: any) {
                          setErrorMsg(err.message);
                        } finally {
                          setSubmitting(false);
                        }
                      }}
                      disabled={submitting}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950/20 animate-fadeIn"
                    >
                      <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                      Confirm Plan Action: {selectedPlanTier} ($
                      {selectedPlanTier === "Institutional" ? "599" : selectedPlanTier === "Professional" ? "249" : "99"}
                      /mo)
                    </button>
                  )}
                </div>

                {selectedPlanTier !== currentTenant.tier && (
                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900/50 mt-1">
                    💡 <span className="text-zinc-400 font-bold">Downgrade / Upgrade Action detected:</span> You selected the <b className="text-white font-black">{selectedPlanTier} Plan</b>. Click the confirm button above to process this plan change, or fill the form on the right to simulate payment gateway invoice billing.
                  </p>
                )}
              </div>
            )}

            {/* PRICING PLANS & FEATURES MATRIC COMPARE */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 p-5">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
                <Sparkles className="h-4.5 w-4.5 text-emerald-500 animate-pulse" />
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                    Choose Subscriber Plan Tier
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Compare features and limits configuration. Tap to load plan details into secure checkout.
                  </p>
                </div>
              </div>

              {/* Three Plan Cards layout */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5 select-none">
                {/* Starter Option */}
                <div 
                  onClick={() => {
                    setSelectedPlanTier("Starter");
                    setCheckoutCompleteSuccess(false);
                  }}
                  className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between ${
                    selectedPlanTier === "Starter"
                      ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-950/15"
                      : "border-zinc-900 bg-zinc-950 hover:border-zinc-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Starter</span>
                      {currentTenant?.tier === "Starter" && (
                        <span className="bg-emerald-500/15 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Your Plan</span>
                      )}
                    </div>
                    <div className="font-display text-xl font-black text-white leading-none">$99<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                    <p className="text-[10px] text-zinc-500 mt-2">Perfect for retail algorithm testing and small portfolios.</p>
                  </div>
                  <div className="mt-4 border-t border-zinc-900/80 pt-3 text-[10px] font-mono font-bold text-zinc-400">
                    • 3 Active Strategies<br />
                    • Max 0.5 Lot caps
                  </div>
                </div>

                {/* Professional Option */}
                <div 
                  onClick={() => {
                    setSelectedPlanTier("Professional");
                    setCheckoutCompleteSuccess(false);
                  }}
                  className={`rounded-xl border p-4 cursor-pointer transition relative flex flex-col justify-between ${
                    selectedPlanTier === "Professional"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-950"
                      : "border-emerald-500/15 bg-zinc-950 hover:border-zinc-800"
                  }`}
                >
                  <span className="absolute -top-2 right-4 bg-emerald-500 text-black text-[7px] font-black py-0.5 px-2 rounded-full uppercase tracking-wider">
                    Recommended Best
                  </span>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Professional</span>
                      {currentTenant?.tier === "Professional" && (
                        <span className="bg-emerald-500/15 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Your Plan</span>
                      )}
                    </div>
                    <div className="font-display text-xl font-black text-white leading-none">$249<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                    <p className="text-[10px] text-zinc-400 mt-2">Comprehensive suite for regular institutional operations.</p>
                  </div>
                  <div className="mt-4 border-t border-zinc-900/80 pt-3 text-[10px] font-mono font-bold text-zinc-200">
                    • 10 Active Strategies<br />
                    • Max 5.0 Lot caps<br />
                    • Intelligent AI Advisor ✅
                  </div>
                </div>

                {/* Institutional Option */}
                <div 
                  onClick={() => {
                    setSelectedPlanTier("Institutional");
                    setCheckoutCompleteSuccess(false);
                  }}
                  className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between ${
                    selectedPlanTier === "Institutional"
                      ? "border-purple-500 bg-purple-500/5 shadow-md shadow-purple-950/15"
                      : "border-zinc-900 bg-zinc-950 hover:border-zinc-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">Institutional</span>
                      {currentTenant?.tier === "Institutional" && (
                        <span className="bg-purple-500/15 text-purple-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Your Plan</span>
                      )}
                    </div>
                    <div className="font-display text-xl font-black text-white leading-none">$599<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                    <p className="text-[10px] text-zinc-500 mt-2">High-frequency trading desk volume with unlimited structures.</p>
                  </div>
                  <div className="mt-4 border-t border-zinc-900/80 pt-3 text-[10px] font-mono font-bold text-zinc-400">
                    • 999 Active Strategies<br />
                    • Max 250 Lot caps<br />
                    • Advanced AI Engine
                  </div>
                </div>
              </div>

              {/* Side-by-Side Limits Comparison list */}
              <div className="p-4 bg-zinc-950/50 rounded-xl border border-zinc-900 text-xs text-zinc-400 space-y-2.5">
                <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5 flex items-center gap-1">
                  <CheckSquare className="h-3 w-3 text-emerald-400" />
                  Detailed Feature Comparison (Limit Guardrails)
                </div>
                <div className="grid grid-cols-2 gap-y-2">
                  <span className="text-zinc-500">Max Active Strategies</span>
                  <span className="font-mono text-zinc-300 text-right">
                    {selectedPlanTier === "Starter" ? "3 Strategies cap" : selectedPlanTier === "Professional" ? "10 Strategies limit" : "999 Strategies limit"}
                  </span>
                  
                  <span className="text-zinc-500">Lot Allocation Cap</span>
                  <span className="font-mono text-zinc-300 text-right">
                    {selectedPlanTier === "Starter" ? "0.5 Lots single route" : selectedPlanTier === "Professional" ? "5.0 Lots cap" : "250.0 Lots high-capacity"}
                  </span>

                  <span className="text-zinc-500">Maximum Simultaneous Orders</span>
                  <span className="font-mono text-zinc-300 text-right">
                    {selectedPlanTier === "Starter" ? "3 concurrent positions" : selectedPlanTier === "Professional" ? "20 active positions" : "9999 terminal capacity"}
                  </span>

                  <span className="text-zinc-500">Intelligent AI advisor access</span>
                  <span className="font-mono text-zinc-300 text-right">
                    {selectedPlanTier === "Starter" ? "Locked (Upgrade required) 🚫" : "Fully Integrated ✅"}
                  </span>
                  
                  <span className="text-zinc-500">Continuous Adaptive ML Engine</span>
                  <span className="font-mono text-zinc-300 text-right">
                    {selectedPlanTier === "Starter"
                      ? "Standard Metrics View Only 📊"
                      : selectedPlanTier === "Professional"
                        ? "Semi-Autonomous Mode ✅"
                        : "Autonomous Adaptive co-pilot ⚡"}
                  </span>

                  <span className="text-zinc-500">ML Safeguard Shield (Rollback)</span>
                  <span className="font-mono text-zinc-300 text-right">
                    {selectedPlanTier === "Starter"
                      ? "Not Supported ❌"
                      : selectedPlanTier === "Professional"
                        ? "Supported (1 Step Rollback) ⚙️"
                        : "Unlimited Restore safeguard 🛡️"}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: PAYMENT GATEWAY & INVOICE */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* INVOICE & PRICE CHECKOUT */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden">
              
              {/* Payment Processing Overlay loader */}
              {paymentProcessing && (
                <div className="absolute inset-0 bg-neutral-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin" />
                    <Lock className="h-4.5 w-4.5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <div>
                    <h5 className="text-sm font-black uppercase text-emerald-400 tracking-wider">Gateway Secure Authorization</h5>
                    <p className="text-[10px] text-zinc-500 font-mono mt-1 max-w-xs mx-auto leading-relaxed">
                      {paymentStepText}
                    </p>
                  </div>
                  <div className="w-full max-w-[200px] bg-zinc-90 w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-400 h-full transition-all duration-300 ease-out"
                      style={{ width: `${(paymentStepIndex + 1) * 20}%` }}
                    />
                  </div>
                  <div className="text-[9px] font-mono text-zinc-650 text-zinc-600">
                    In compliance with PCI-DSS Secure Protocol v3
                  </div>
                </div>
              )}

              {/* Invoice Breakdown */}
              <div className="border-b border-zinc-900 pb-3 mb-4">
                <span className="text-[9px] text-emerald-400 font-mono tracking-widest font-bold uppercase block">Secured checkout invoice</span>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                    Order Summary Ledger
                  </h4>
                  <span className="text-zinc-500 text-[10px] font-mono">Invoice #{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>
              </div>

              <div className="space-y-3.5 mb-5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Workspace Account:</span>
                  <span className="font-semibold text-zinc-100">{currentTenant?.name || "harry-desk"} ({currentTenant?.id})</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Plan Tier:</span>
                  <span className="font-extrabold text-emerald-400 font-mono uppercase">{selectedPlanTier} Plan</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Duration:</span>
                  <span className="font-mono text-zinc-200">30-Day billing interval</span>
                </div>
                <div className="flex justify-between">
                  <span>Subscription price:</span>
                  <span className="font-mono text-zinc-200">
                    {selectedPlanTier === "Starter" ? "$99.00" : selectedPlanTier === "Professional" ? "$249.00" : "$599.00"}
                  </span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-3 text-[13px] font-black">
                  <span className="text-white">Amount Outstanding:</span>
                  <span className="text-emerald-400 font-mono">
                    {selectedPlanTier === "Starter" ? "$99.00" : selectedPlanTier === "Professional" ? "$249.00" : "$599.00"}<span className="text-[9px] text-zinc-500 font-normal"> /mo</span>
                  </span>
                </div>
              </div>

              {/* PAYMENT METOD SELECTOR TABS (Unified Cards vs Instant UPI Payment) */}
              <div className="pt-2">
                <label className="text-[9px] font-mono text-zinc-500 block mb-2 uppercase tracking-wider">Select Secure Payment Gateway</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900 mb-4">
                  <button
                    onClick={() => {
                      setPaymentGatewayType("UPI");
                      setCheckoutCompleteSuccess(false);
                    }}
                    className={`py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentGatewayType === "UPI"
                        ? "bg-zinc-900 text-white border border-zinc-800"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                    Instant UPI Gate
                  </button>
                  <button
                    onClick={() => {
                      setPaymentGatewayType("CARD");
                      setCheckoutCompleteSuccess(false);
                    }}
                    className={`py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      paymentGatewayType === "CARD"
                        ? "bg-zinc-900 text-white border border-zinc-800"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5 text-emerald-400" />
                    Credit/Debit Card
                  </button>
                </div>

                {/* --- GATEWAY OPTION 1: INSTANT UPI FORM & QR CODE GENERATOR --- */}
                {paymentGatewayType === "UPI" && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-4">
                      
                      {/* Pick UPI App Preset */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-550 text-zinc-500 block">PREFERRED UPI APP PAYEE</label>
                        <div className="grid grid-cols-4 gap-1.5">
                          {["GPay", "PhonePe", "Paytm", "BHIM"].map(app => (
                            <button
                              key={app}
                              type="button"
                              onClick={() => {
                                setUpiAppSelector(app as any);
                                if (app === "GPay") setUpiProvider("@upi");
                                if (app === "PhonePe") setUpiProvider("@ybl");
                                if (app === "Paytm") setUpiProvider("@paytm");
                                if (app === "BHIM") setUpiProvider("@bhim");
                              }}
                              className={`py-1.5 text-[10px] font-bold rounded-lg border transition ${
                                upiAppSelector === app 
                                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                  : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                              }`}
                            >
                              {app}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom VPA/UPI ID Input */}
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 block mb-1">ENTER UPI ID (VIRTUAL PAYMENT ADDRESS)</label>
                        <div className="flex">
                          <input 
                            type="text" 
                            placeholder="e.g. user-name"
                            value={upiVpa}
                            onChange={(e) => setUpiVpa(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                            required
                            className="bg-zinc-900 border border-r-0 border-zinc-800 rounded-l px-3 py-1.5 text-xs text-white placeholder-zinc-650 w-full focus:outline-none placeholder-zinc-600 font-mono" 
                          />
                          <select
                            value={upiProvider}
                            onChange={(e) => setUpiProvider(e.target.value)}
                            className="bg-zinc-900 border border-zinc-850 rounded-r px-2 py-1.5 text-xs text-zinc-300 font-mono font-bold focus:outline-none"
                          >
                            <option value="@upi">@upi (Standard)</option>
                            <option value="@ybl">@ybl (Yes Bank)</option>
                            <option value="@paytm">@paytm (Paytm)</option>
                            <option value="@oksbi">@oksbi (SBI)</option>
                            <option value="@okaxis">@okaxis (Axis)</option>
                            <option value="@okhdfcbank">@okhdfcbank (HDFC)</option>
                            <option value="@bhim">@bhim (bhim)</option>
                          </select>
                        </div>
                        <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                          Computed VPA: <span className="text-zinc-200">{upiVpa || "username"}{upiProvider}</span>
                        </p>
                      </div>

                      {/* Gorgeous, live vector dynamic QR Code render */}
                      <div className="text-center p-3 border border-zinc-900 bg-zinc-950/80 rounded-xl space-y-2">
                        <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Scan Instant QR to Pay</span>
                        
                        <div className="bg-white p-3.5 rounded-xl inline-block shadow-sm border border-zinc-200">
                          <svg width="120" height="120" viewBox="0 0 140 140" className="text-zinc-950 mx-auto">
                            {/* Corner 1: Top Left */}
                            <rect x="10" y="10" width="30" height="30" fill="currentColor" />
                            <rect x="15" y="15" width="20" height="20" fill="white" />
                            <rect x="20" y="20" width="10" height="10" fill="currentColor" />
                            
                            {/* Corner 2: Top Right */}
                            <rect x="100" y="10" width="30" height="30" fill="currentColor" />
                            <rect x="105" y="15" width="20" height="20" fill="white" />
                            <rect x="110" y="20" width="10" height="10" fill="currentColor" />
                            
                            {/* Corner 3: Bottom Left */}
                            <rect x="10" y="100" width="30" height="30" fill="currentColor" />
                            <rect x="15" y="105" width="20" height="20" fill="white" />
                            <rect x="20" y="110" width="10" height="10" fill="currentColor" />

                            {/* Small alignment block */}
                            <rect x="105" y="105" width="15" height="15" fill="currentColor" />
                            <rect x="110" y="110" width="5" height="5" fill="white" />

                            {/* Simulated custom QR pixel nodes pattern */}
                            <rect x="50" y="10" width="10" height="10" fill="currentColor" />
                            <rect x="70" y="10" width="15" height="10" fill="currentColor" />
                            <rect x="55" y="25" width="10" height="15" fill="currentColor" />
                            <rect x="80" y="25" width="15" height="10" fill="currentColor" />
                            
                            <rect x="50" y="50" width="21" height="20" fill="currentColor" />
                            <rect x="55" y="55" width="11" height="10" fill="white" />
                            <rect x="80" y="50" width="10" height="10" fill="currentColor" />
                            <rect x="100" y="50" width="15" height="15" fill="currentColor" />
                            <rect x="120" y="65" width="10" height="15" fill="currentColor" />

                            <rect x="10" y="50" width="15" height="10" fill="currentColor" />
                            <rect x="15" y="70" width="10" height="20" fill="currentColor" />
                            <rect x="35" y="60" width="10" height="10" fill="currentColor" />
                            
                            <rect x="50" y="80" width="30" height="10" fill="currentColor" />
                            <rect x="90" y="80" width="10" height="25" fill="currentColor" />
                            <rect x="110" y="90" width="20" height="10" fill="currentColor" />

                            <rect x="50" y="100" width="10" height="15" fill="currentColor" />
                            <rect x="70" y="110" width="15" height="10" fill="currentColor" />
                            <rect x="55" y="125" width="20" height="10" fill="currentColor" />
                          </svg>
                        </div>
                        
                        <div className="text-[10px] text-zinc-400 font-sans mt-1">
                          Scan with BHIM, Google Pay, PhonePe, Paytm, or any banking app
                        </div>
                      </div>

                    </div>

                    <button
                      onClick={triggerSimulationSequence}
                      disabled={!upiVpa}
                      className={`w-full py-2.5 rounded-lg text-xs font-black uppercase text-black flex items-center justify-center gap-1 transition tracking-wider ${
                        upiVpa 
                          ? "bg-emerald-400 hover:bg-emerald-500 border border-emerald-500 cursor-pointer" 
                          : "bg-zinc-800 border border-zinc-855 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
                      Pay Instantly via UPI (Verify VPA)
                    </button>
                  </div>
                )}

                {/* --- GATEWAY OPTION 2: CARD CHECKOUT FORM & INTERACTIVE PREVIEW --- */}
                {paymentGatewayType === "CARD" && (
                  <div className="space-y-4">
                    
                    {/* Visual glowing credit card layout preview */}
                    <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-950 via-zinc-950 to-emerald-950 border border-zinc-800 shadow-xl overflow-hidden leading-snug space-y-7 relative">
                      <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/10 rounded-full blur-2xl" />
                      
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase block">PLATFORM SECURE CARD</span>
                          <span className="text-[10px] font-bold text-zinc-300 font-sans tracking-wide mt-1 block">Quant Pro Acquirer</span>
                        </div>
                        <div className="font-display font-black text-xs text-orange-400 italic">RuPay / VISA</div>
                      </div>

                      <div className="font-mono text-base font-medium tracking-widest text-zinc-100 select-all py-1">
                        {cardNumber || "•••• •••• •••• ••••"}
                      </div>

                      <div className="flex justify-between items-end font-mono">
                        <div>
                          <span className="text-[8px] text-zinc-500 block uppercase">CARDHOLDER NAME</span>
                          <span className="text-[10px] font-extrabold text-white truncate max-w-[150px] uppercase block">
                            {cardholderName || "HARRY JHONE"}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-zinc-550 text-zinc-500 block uppercase">EXPIRES</span>
                          <span className="text-[10px] font-bold text-white block">
                            {cardExpiry || "MM/YY"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Form Input fields */}
                    <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-3.5">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 block mb-1">CARD NUMBER</label>
                        <input 
                          type="text" 
                          placeholder="e.g. 4321 0000 1234 5678"
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          required
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono text-zinc-500 block mb-1">EXPIRY DATE (MM/YY)</label>
                          <input 
                            type="text" 
                            placeholder="MM/YY"
                            value={cardExpiry}
                            onChange={handleCardExpiryChange}
                            required
                            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono text-zinc-500 block mb-1">CVV PIN (3 DIGITS)</label>
                          <input 
                            type="password" 
                            placeholder="***"
                            maxLength={3}
                            value={cardCvv}
                            onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                            required
                            className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 block mb-1">CARDHOLDER FULL NAME</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Harry Jhone"
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          required
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500" 
                        />
                      </div>
                    </div>

                    <button
                      onClick={triggerSimulationSequence}
                      disabled={!cardNumber || !cardExpiry || !cardCvv}
                      className={`w-full py-2.5 rounded-lg text-xs font-black uppercase text-black flex items-center justify-center gap-1 transition tracking-wider ${
                        cardNumber && cardExpiry && cardCvv 
                          ? "bg-emerald-400 hover:bg-emerald-500 border border-emerald-500 cursor-pointer" 
                          : "bg-zinc-800 border border-zinc-855 text-zinc-500 cursor-not-allowed"
                      }`}
                    >
                      <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
                      Pay Securely with Card Gateway
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* SECURED GATEWAYS ASSURANCE STATS */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-4 space-y-3">
              <span className="text-[9px] uppercase font-mono tracking-widest text-zinc-550 text-zinc-500 block">Security assurance standards</span>
              <div className="flex gap-2.5 text-xs text-zinc-400">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-zinc-200 block">PCI-DSS Level 1 Encryption Verified</span>
                  <span className="text-[10px] text-zinc-500 block">Your credentials and UPI virtual payment hashes are fully encrypted. No critical details are stored offline.</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* ==================== TAB 2: WORKSPACE REGISTRY ==================== */}
      {activeTab === "admin-registry" && (() => {
        const localPlans = state.pricingConfig?.plans || {
          Starter: { price: 99, originalPrice: 99, benefits: ["Max Active Strategies: 2", "Max Single Lot Size: 0.1 Lots", "Max Open Trades: 2", "AI Advisor: Locked 🚫"] },
          Professional: { price: 249, originalPrice: 249, benefits: ["Max Active Strategies: 5", "Max Single Lot Size: 1.0 Lot", "Max Open Trades: 10", "AI Advisor: Included ✅"] },
          Institutional: { price: 599, originalPrice: 599, benefits: ["Max Active Strategies: Unlimited", "Max Single Lot Size: 100 Lots", "Max Open Trades: Unlimited", "AI Advisor: Included ✅"] }
        };

        return (
          <div className="space-y-6">
            {/* Subscription Tier reference guide block */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/25 p-5">
              <h4 className="font-display text-sm font-bold tracking-wider text-zinc-300 uppercase mb-3 flex items-center gap-1.5/70 lg:gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-500" />
                COMMERCIAL PLAN BOUNDARIES REFERENCE
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Starter Plan */}
                <div className="rounded-lg border border-zinc-900/80 bg-zinc-950/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white font-sans">Starter Plan</span>
                    <span className="text-xs font-mono font-black text-emerald-400">
                      ${localPlans.Starter?.price ?? 99}/mo
                    </span>
                  </div>
                  <ul className="text-[11px] text-zinc-400 space-y-1 font-mono">
                    {(localPlans.Starter?.benefits || [
                      "Max Active Strategies: 2",
                      "Max Single Lot Size: 0.1 Lots",
                      "Max Open Trades: 2",
                      "AI Advisor: Locked 🚫"
                    ]).map((benefit: string, idx: number) => (
                      <li key={idx}>• {benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Professional Plan */}
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3.5 space-y-2 relative">
                  <span className="absolute top-1 right-2 bg-emerald-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-sans">Default Best</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-400 font-sans">Professional Plan</span>
                    <span className="text-xs font-mono font-black text-white">
                      ${localPlans.Professional?.price ?? 249}/mo
                    </span>
                  </div>
                  <ul className="text-[11px] text-zinc-300 space-y-1 font-mono">
                    {(localPlans.Professional?.benefits || [
                      "Max Active Strategies: 5",
                      "Max Single Lot Size: 1.0 Lot",
                      "Max Open Trades: 10",
                      "AI Advisor: Included ✅"
                    ]).map((benefit: string, idx: number) => (
                      <li key={idx}>• {benefit}</li>
                    ))}
                  </ul>
                </div>

                {/* Institutional Plan */}
                <div className="rounded-lg border border-zinc-900/80 bg-zinc-950/60 p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-purple-400 font-sans">Institutional Plan</span>
                    <span className="text-xs font-mono font-black text-white">
                      ${localPlans.Institutional?.price ?? 599}/mo
                    </span>
                  </div>
                  <ul className="text-[11px] text-zinc-400 space-y-1 font-mono">
                    {(localPlans.Institutional?.benefits || [
                      "Max Active Strategies: Unlimited",
                      "Max Single Lot Size: 100 Lots",
                      "Max Open Trades: Unlimited",
                      "AI Advisor: Included ✅"
                    ]).map((benefit: string, idx: number) => (
                      <li key={idx}>• {benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          {/* Workspace Manager Directory list card */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/30 overflow-hidden">
            <div className="p-4 bg-zinc-950/50 border-b border-zinc-900 flex items-center justify-between">
              <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Registered Workspaces ({tenants.length})
              </span>
              <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-emerald-500 hover:bg-emerald-600 border border-emerald-600 text-neutral-950 px-3 py-1 text-xs font-extrabold rounded-lg flex items-center gap-1 transition tracking-tight cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5 stroke-[3px]" />
                New Subscriber Workspace
              </button>
            </div>

            {/* Add subscription workspace form */}
            {showCreateForm && (
              <form onSubmit={handleCreateTenant} className="p-5 border-b border-zinc-900 bg-zinc-950/40 space-y-4 animate-fadeIn">
                <h5 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Register New Sandbox Workspace</h5>
                <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-7 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">WORKSPACE UNIQUE ID</label>
                    <input 
                      type="text" 
                      placeholder="e.g. vertex-ltd" 
                      value={newId}
                      onChange={e => setNewId(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-655 w-full focus:outline-none focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">CLIENT NAME</label>
                    <input 
                      type="text" 
                      placeholder="e.g. John Doe" 
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-655 w-full focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">EMAIL ADDRESS</label>
                    <input 
                      type="email" 
                      placeholder="e.g. name@url.com" 
                      value={newEmail}
                      onChange={e => setNewEmail(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-655 w-full focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-emerald-500 block mb-1">LOGIN USERNAME</label>
                    <input 
                      type="text" 
                      placeholder="e.g. vertex" 
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-655 w-full focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono text-emerald-500 block leading-tight">LOGIN PASSCODE</label>
                      <button
                        type="button"
                        onClick={() => setNewPassword(generateStrongPasscode())}
                        className="text-[9px] font-bold text-emerald-500 hover:underline cursor-pointer select-none"
                      >
                        Regen
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showAdminNewPasscode ? "text" : "password"} 
                        placeholder="Security passcode" 
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded pl-2.5 pr-8 py-1.5 text-xs text-white placeholder-zinc-655 w-full focus:outline-none focus:border-emerald-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminNewPasscode(!showAdminNewPasscode)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer"
                      >
                        {showAdminNewPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">SUBSCRIBED TIER</label>
                    <select 
                      value={newTier}
                      onChange={e => setNewTier(e.target.value as any)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white w-full focus:border-emerald-500 focus:outline-none cursor-pointer"
                    >
                      <option value="Starter">Starter ($99/mo)</option>
                      <option value="Professional">Professional ($249/mo)</option>
                      <option value="Institutional">Institutional ($599/mo)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">COLLATERAL ($)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 50000" 
                      value={newBalance}
                      onChange={e => setNewBalance(e.target.value)}
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-655 w-full focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowCreateForm(false)} 
                    className="bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 rounded text-xs font-semibold text-zinc-400 border border-zinc-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="bg-emerald-500 hover:bg-emerald-600 px-4 py-1.5 rounded text-xs font-black text-black border border-emerald-600 cursor-pointer"
                  >
                    Add Workspace
                  </button>
                </div>
              </form>
            )}

            {/* Registered subscribers detail grid layout */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-950/40 text-[10px] font-mono text-zinc-500 uppercase tracking-widest border-b border-zinc-900">
                    <th className="p-4 font-bold">Client Workspace</th>
                    <th className="p-4 font-bold">Subscription Plan</th>
                    <th className="p-4 font-bold">Subscription Status</th>
                    <th className="p-4 font-bold">Price Rate / Renewal Date</th>
                    <th className="p-4 font-bold">Execution Limit Guards</th>
                    <th className="p-4 font-bold text-right font-mono">Administrative Switch / Renew Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-sans text-xs">
                  {tenants.map((t) => {
                    const isCurrentlyActive = t.id === activeTenantId;
                    
                    return (
                      <tr 
                        key={t.id} 
                        className={`hover:bg-zinc-950/20 transition ${isCurrentlyActive ? "bg-emerald-500/5" : ""}`}
                      >
                        {/* Tenant ID and descriptive identity card */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-zinc-400" />
                            </div>
                            <div>
                              <div className="font-bold text-zinc-100 flex items-center gap-1.5">
                                {t.name}
                                {isCurrentlyActive && (
                                  <span className="bg-emerald-400/10 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded tracking-widest uppercase border border-emerald-400/20">Active Workspace</span>
                                )}
                              </div>
                              <div className="text-[10px] text-zinc-500 font-mono select-all">
                                ID: {t.id} • {t.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Subscription Tier select modification dropdown */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span className={`font-black uppercase tracking-wider text-[10px] ${
                              t.tier === "Institutional" 
                                ? "text-purple-400" 
                                : t.tier === "Professional" 
                                  ? "text-emerald-400" 
                                  : "text-zinc-400"
                            }`}>
                              {t.tier} Tier
                            </span>
                            <select
                              value={t.tier}
                              onChange={(e) => handleDirectUpdateTenant(t.id, { tier: e.target.value as any })}
                              className="bg-zinc-900 border border-zinc-800 text-[10px] rounded px-1.5 py-0.5 text-zinc-300 mt-1 focus:outline-none focus:border-emerald-500 w-28 focus:outline-none"
                            >
                              <option value="Starter">Starter Plan</option>
                              <option value="Professional">Professional</option>
                              <option value="Institutional">Institutional</option>
                            </select>
                          </div>
                        </td>

                        {/* Active/Expired Status Controls */}
                        <td className="p-4">
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              {t.status === "Active" ? (
                                <>
                                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                                  <span className="text-emerald-400 font-bold font-mono">ACTIVE</span>
                                </>
                              ) : t.status === "Expired" ? (
                                <>
                                  <XCircle className="h-3.5 w-3.5 text-rose-500" />
                                  <span className="text-rose-400 font-bold font-mono">EXPIRED</span>
                                </>
                              ) : (
                                <>
                                  <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                                  <span className="text-amber-400 font-bold font-mono">PAST DUE</span>
                                </>
                              )}
                            </div>
                            <div className="flex gap-1.5 mt-1.5">
                              <button
                                onClick={() => handleDirectUpdateTenant(t.id, { status: "Active" })}
                                className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[9px] px-1.5 py-0.5 rounded font-bold border border-zinc-800 cursor-pointer"
                              >
                                Active
                              </button>
                              <button
                                onClick={() => handleDirectUpdateTenant(t.id, { status: "Expired" })}
                                className="bg-zinc-900 hover:bg-zinc-800 text-rose-455 text-[9px] px-1.5 py-0.5 rounded font-bold border border-rose-950/20 text-rose-400 cursor-pointer"
                              >
                                Expire
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Cost rates and renewal information */}
                        <td className="p-4">
                          <div className="font-mono text-zinc-300 font-bold">
                            ${t.price}/mo
                          </div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Next debit: {t.nextBillingDate}
                          </div>
                        </td>

                        {/* Plan Limits Guardrails */}
                        <td className="p-4 font-mono text-[10px] text-zinc-400 space-y-0.5">
                          <div>Max Strategies: <span className="font-bold text-zinc-200">{t.limits.maxStrategies}</span></div>
                          <div>Max Lot: <span className="font-bold text-zinc-200">{t.limits.maxLotSize} Lots</span></div>
                          <div>Concurrent Trades: <span className="font-bold text-zinc-200">{t.limits.maxConcurrentTrades} positions</span></div>
                        </td>

                        {/* Administrative Switches & simulated billing */}
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2 shrink-0 flex-wrap">
                            <button
                              onClick={() => handleSimulateBilling(t.id)}
                              className="bg-zinc-900 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-emerald-500/10 hover:border-emerald-500/30 px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                              title="Advance invoice date and simulate direct debit on starting collateral balance"
                            >
                              <CreditCard className="h-3 w-3" />
                              Bill Credit Cycle
                            </button>

                            <button
                              onClick={() => {
                                setEditingFeatureTenantId(t.id);
                                setTempDisabledMenus(t.disabledMenus || []);
                              }}
                              className="bg-zinc-900 hover:bg-zinc-800 text-amber-550 border border-amber-500/10 hover:border-amber-500/30 px-2.5 py-1.5 rounded text-xs font-bold transition flex items-center gap-1 cursor-pointer text-amber-400"
                              title="Manage active menus and features for this subscriber"
                            >
                              <Shield className="h-3 w-3 animate-pulse text-amber-500" />
                              Permissions
                            </button>

                            <button
                              onClick={() => onSwitchTenant(t.id)}
                              disabled={isCurrentlyActive}
                              className={`px-3 py-1.5 rounded text-xs font-extrabold transition flex items-center gap-1 cursor-pointer ${
                                isCurrentlyActive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 opacity-80"
                                  : "bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700"
                              }`}
                            >
                              <span>{isCurrentlyActive ? "Active" : "Load Workspace"}</span>
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Elegant Overlay Modal for Menu & Feature permissions adjustment */}
          {editingFeatureTenantId && (() => {
            const targetTenant = tenants.find(t => t.id === editingFeatureTenantId);
            if (!targetTenant) return null;

            return (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center z-50 p-4 font-sans animate-fadeIn">
                <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl shadow-emerald-500/5">
                  
                  {/* Header */}
                  <div className="p-5 border-b border-zinc-900 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className="h-10 w-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                        <Sliders className="h-5 w-5 text-amber-500 animate-pulse" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">
                          Workspace Access & Feature Control
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          Manage menu visibility and active feature boundaries for <span className="font-bold text-white">{targetTenant.name}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingFeatureTenantId(null)}
                      className="p-1 px-2.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer font-bold text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Quick presets row */}
                  <div className="px-5 py-3 bg-zinc-900/30 border-b border-zinc-900 flex flex-wrap gap-2 items-center justify-between text-xs text-left">
                    <span className="text-[10px] uppercase font-mono font-bold text-zinc-500">Quick Configuration Presets:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTempDisabledMenus([])}
                        className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-400 font-bold rounded border border-emerald-500/20 transition text-[9px] uppercase cursor-pointer"
                      >
                        Enable All
                      </button>
                      <button
                        type="button"
                        onClick={() => setTempDisabledMenus([
                          "Strategies", "Timeframe Analysis", "Backtesting", "MT5 Connector", "System Updates"
                        ])}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/25 text-amber-505 text-amber-400 font-bold rounded border border-amber-500/20 transition text-[9px] uppercase cursor-pointer"
                      >
                        Core Standard Only
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const allMenuIds = SUBSCRIBER_MENUS.map(m => m.id);
                          setTempDisabledMenus(allMenuIds.filter(id => id !== "Dashboard"));
                        }}
                        className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/25 text-rose-400 font-bold rounded border border-rose-950/20 transition text-[9px] uppercase cursor-pointer"
                      >
                        Dashboard Only
                      </button>
                    </div>
                  </div>

                  {/* Scrollable checklist container */}
                  <div className="p-5 overflow-y-auto space-y-4 flex-1 text-left">
                    <p className="text-[11px] text-zinc-500 leading-relaxed bg-zinc-905 bg-opacity-40 p-3 rounded-lg border border-zinc-900/50">
                      💡 <span className="font-bold text-zinc-400">Security Rule Dynamic Integration:</span> Standard subscriber workspace sessions will automatically hide disabled screens. Direct state modifications or deep link navigations will safely redirect home to keep boundaries pristine.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {SUBSCRIBER_MENUS.map((menu) => {
                        const isEnabled = !tempDisabledMenus.includes(menu.id);
                        return (
                          <div
                            key={menu.id}
                            onClick={() => {
                              if (isEnabled) {
                                setTempDisabledMenus([...tempDisabledMenus, menu.id]);
                              } else {
                                setTempDisabledMenus(tempDisabledMenus.filter(id => id !== menu.id));
                              }
                            }}
                            className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 select-none text-left ${
                              isEnabled
                                ? "bg-zinc-900/30 border-zinc-900 hover:border-emerald-500/30 hover:bg-emerald-500/[0.01]"
                                : "bg-zinc-950/40 border-rose-950/10 opacity-60 hover:opacity-85"
                            }`}
                          >
                            <div className="mt-0.5 shrink-0">
                              <div className={`h-4.5 w-4.5 rounded flex items-center justify-center transition-all ${
                                isEnabled
                                  ? "bg-emerald-550 text-black bg-emerald-500 shadow shadow-emerald-500/20"
                                  : "border border-zinc-900 bg-zinc-950"
                              }`}>
                                {isEnabled && <Check className="h-3 w-3 stroke-[3px]" />}
                              </div>
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[11px] font-black uppercase tracking-wider ${
                                  isEnabled ? "text-zinc-150 text-zinc-200" : "text-zinc-500 line-through font-medium"
                                }`}>
                                  {menu.label}
                                </span>
                                {!isEnabled && (
                                  <span className="bg-rose-500/10 text-rose-455 text-rose-400 border border-rose-950/20 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase font-mono tracking-wider">
                                    Disabled
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-500 leading-normal">
                                {menu.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="p-5 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-left">
                    <span className="text-[10px] text-zinc-550 text-zinc-500 font-mono">
                      Active: {SUBSCRIBER_MENUS.length - tempDisabledMenus.length} / {SUBSCRIBER_MENUS.length} screens permitted
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingFeatureTenantId(null)}
                        className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-lg border border-zinc-800 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await handleDirectUpdateTenant(targetTenant.id, { disabledMenus: tempDisabledMenus });
                          setEditingFeatureTenantId(null);
                        }}
                        disabled={submitting}
                        className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-black font-black rounded-lg border border-emerald-600 text-xs uppercase cursor-pointer flex items-center gap-1 shadow-md shadow-emerald-950/20 transition-all active:scale-95"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3px]" />
                        Save Guardrails
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            );
          })()}

        </div>
      )})()}

      {activeTab === "pricing-admin" && (
        <div className="space-y-6 animate-fadeIn">
          {/* Main Info Card */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-6 text-left">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center gap-1.5 font-display">
                  <Sparkles className="h-4 w-4 text-emerald-400" />
                  Global Pricing & Offer Console
                </h3>
                <p className="text-xs text-zinc-400 max-w-2xl">
                  As the Super Admin of Quant Terminal, you have complete power to restructure subscription tiers, launch dynamic percentage-based sales offers, manage promotional discount codes, and define custom trial periods.
                </p>
              </div>
              <button
                onClick={() => handleSavePricingConfig()}
                className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/30 font-sans"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Commit Dynamic Ledger
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
            {/* 1. Starter Plan Configuration */}
            {plansConfig && plansConfig.Starter && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-blue-500" />
                    <span className="text-xs font-mono font-black text-white uppercase">Starter Plan</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Retail Testing tier</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Live Price ($/mo)</label>
                    <input
                      type="number"
                      value={plansConfig.Starter.price}
                      onChange={(e) => {
                        const next = { ...plansConfig };
                        next.Starter.price = Number(e.target.value);
                        setPlansConfig(next);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Original Price ($)</label>
                    <input
                      type="number"
                      value={plansConfig.Starter.originalPrice}
                      onChange={(e) => {
                        const next = { ...plansConfig };
                        next.Starter.originalPrice = Number(e.target.value);
                        setPlansConfig(next);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Trial Config (Days)</label>
                  <input
                    type="number"
                    value={plansConfig.Starter.trialDays || 7}
                    onChange={(e) => {
                      const next = { ...plansConfig };
                      next.Starter.trialDays = Number(e.target.value);
                      setPlansConfig(next);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                    <span>Value Benefits ({plansConfig.Starter.benefits?.length ?? 0})</span>
                    <button
                      onClick={() => {
                        const next = { ...plansConfig };
                        if (!next.Starter.benefits) next.Starter.benefits = [];
                        next.Starter.benefits.push("Provide dynamic premium platform benefits.");
                        setPlansConfig(next);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-[9px] flex items-center gap-0.5 animate-pulse"
                    >
                      <Plus className="h-3 w-3" /> Add Perk
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {plansConfig.Starter.benefits && plansConfig.Starter.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const next = { ...plansConfig };
                            next.Starter.benefits[idx] = e.target.value;
                            setPlansConfig(next);
                          }}
                          className="w-full bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 p-1 px-2 rounded-lg text-xs font-sans"
                        />
                        <button
                          onClick={() => {
                            const next = { ...plansConfig };
                            next.Starter.benefits.splice(idx, 1);
                            setPlansConfig(next);
                          }}
                          className="text-rose-500 hover:text-rose-400 shrink-0 cursor-pointer"
                          title="Delete benefit item"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Professional Plan Configuration */}
            {plansConfig && plansConfig.Professional && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-xs font-mono font-black text-white uppercase col-span-2">Professional Plan</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Recommended choice</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Live Price ($/mo)</label>
                    <input
                      type="number"
                      value={plansConfig.Professional.price}
                      onChange={(e) => {
                        const next = { ...plansConfig };
                        next.Professional.price = Number(e.target.value);
                        setPlansConfig(next);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Original Price ($)</label>
                    <input
                      type="number"
                      value={plansConfig.Professional.originalPrice}
                      onChange={(e) => {
                        const next = { ...plansConfig };
                        next.Professional.originalPrice = Number(e.target.value);
                        setPlansConfig(next);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Trial Config (Days)</label>
                  <input
                    type="number"
                    value={plansConfig.Professional.trialDays || 7}
                    onChange={(e) => {
                      const next = { ...plansConfig };
                      next.Professional.trialDays = Number(e.target.value);
                      setPlansConfig(next);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-805 border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500 font-mono">
                    <span>Value Benefits ({plansConfig.Professional.benefits?.length ?? 0})</span>
                    <button
                      onClick={() => {
                        const next = { ...plansConfig };
                        if (!next.Professional.benefits) next.Professional.benefits = [];
                        next.Professional.benefits.push("Provide dynamic premium platform benefits.");
                        setPlansConfig(next);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-[9px] flex items-center gap-0.5 cursor-pointer animate-pulse"
                    >
                      <Plus className="h-3 w-3" /> Add Perk
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {plansConfig.Professional.benefits && plansConfig.Professional.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const next = { ...plansConfig };
                            next.Professional.benefits[idx] = e.target.value;
                            setPlansConfig(next);
                          }}
                          className="w-full bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 p-1 px-2 rounded-lg text-xs font-sans"
                        />
                        <button
                          onClick={() => {
                            const next = { ...plansConfig };
                            next.Professional.benefits.splice(idx, 1);
                            setPlansConfig(next);
                          }}
                          className="text-rose-500 hover:text-rose-400 shrink-0 cursor-pointer"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Institutional Plan Configuration */}
            {plansConfig && plansConfig.Institutional && (
              <div className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-mono font-black text-white uppercase">Institutional Plan</span>
                  </div>
                  <span className="text-[10px] font-mono text-zinc-500">Ultimate Uptime</span>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Live Price ($/mo)</label>
                    <input
                      type="number"
                      value={plansConfig.Institutional.price}
                      onChange={(e) => {
                        const next = { ...plansConfig };
                        next.Institutional.price = Number(e.target.value);
                        setPlansConfig(next);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Original Price ($)</label>
                    <input
                      type="number"
                      value={plansConfig.Institutional.originalPrice}
                      onChange={(e) => {
                        const next = { ...plansConfig };
                        next.Institutional.originalPrice = Number(e.target.value);
                        setPlansConfig(next);
                      }}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Trial Config (Days)</label>
                  <input
                    type="number"
                    value={plansConfig.Institutional.trialDays || 7}
                    onChange={(e) => {
                      const next = { ...plansConfig };
                      next.Institutional.trialDays = Number(e.target.value);
                      setPlansConfig(next);
                    }}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-500">
                    <span>Value Benefits ({plansConfig.Institutional.benefits?.length ?? 0})</span>
                    <button
                      onClick={() => {
                        const next = { ...plansConfig };
                        if (!next.Institutional.benefits) next.Institutional.benefits = [];
                        next.Institutional.benefits.push("Provide dynamic premium platform benefits.");
                        setPlansConfig(next);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-[9px] flex items-center gap-0.5 cursor-pointer animate-pulse"
                    >
                      <Plus className="h-3 w-3" /> Add Perk
                    </button>
                  </div>
                  
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {plansConfig.Institutional.benefits && plansConfig.Institutional.benefits.map((benefit: string, idx: number) => (
                      <div key={idx} className="flex gap-1.5 items-center">
                        <input
                          type="text"
                          value={benefit}
                          onChange={(e) => {
                            const next = { ...plansConfig };
                            next.Institutional.benefits[idx] = e.target.value;
                            setPlansConfig(next);
                          }}
                          className="w-full bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-900 text-zinc-300 p-1 px-2 rounded-lg text-xs font-sans"
                        />
                        <button
                          onClick={() => {
                            const next = { ...plansConfig };
                            next.Institutional.benefits.splice(idx, 1);
                            setPlansConfig(next);
                          }}
                          className="text-rose-500 hover:text-rose-400 shrink-0 cursor-pointer"
                        >
                          <MinusCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Promotional Offers & Codes manager panel */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="md:col-span-2 rounded-xl border border-zinc-900 bg-zinc-950/45 p-6 space-y-4">
              <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider border-b border-zinc-900 pb-3 flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-400" />
                Active Promotional Codes & Trials Gateway
              </h3>

              <div className="overflow-x-auto text-left">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-[10px] text-zinc-500 uppercase tracking-widest font-mono select-none">
                      <th className="py-2.5 font-bold text-left">Promo Code</th>
                      <th className="py-2.5 font-bold text-left">Discount %</th>
                      <th className="py-2.5 font-bold text-left">Type</th>
                      <th className="py-2.5 font-bold text-left">Uptime Status</th>
                      <th className="py-2.5 font-bold text-left text-right">Owner Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/60 font-mono text-xs text-left">
                    {promosConfig.map((promo: any, idx: number) => (
                      <tr key={idx} className="hover:bg-zinc-900/20 text-left">
                        <td className="py-3 font-extrabold text-white text-left">{promo.code}</td>
                        <td className="py-3 text-emerald-400 font-bold text-left">{promo.discountPercent}% OFF</td>
                        <td className="py-3 text-left">
                          {promo.isTrialCode ? (
                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-black uppercase">Free Trial</span>
                          ) : (
                            <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded text-[10px] font-black uppercase">Standard Disc</span>
                          )}
                        </td>
                        <td className="py-3 text-left">
                          <button
                            onClick={() => {
                              const next = [...promosConfig];
                              next[idx].isActive = !next[idx].isActive;
                              setPromosConfig(next);
                              handleSavePricingConfig(plansConfig, next);
                            }}
                            className={`px-2 py-0.5 rounded text-[9px] font-black uppercase cursor-pointer select-none transition ${
                              promo.isActive 
                                ? "bg-emerald-500/10 text-emerald-400" 
                                : "bg-rose-500/10 text-rose-500"
                            }`}
                          >
                            {promo.isActive ? "● ACTIVE" : "○ DISABLED"}
                          </button>
                        </td>
                        <td className="py-3 text-right text-left">
                          <button
                            onClick={() => {
                              const next = [...promosConfig];
                              next.splice(idx, 1);
                              setPromosConfig(next);
                              handleSavePricingConfig(plansConfig, next);
                            }}
                            className="text-rose-500 hover:text-rose-455 text-xs font-bold font-sans cursor-pointer"
                          >
                            Revoke/Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {promosConfig.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-zinc-500">
                          No promotional codes have been provisioned in the system yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Promo Code Creator Form Card */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-6 space-y-4">
              <h3 className="text-xs font-black font-mono text-white uppercase tracking-wider border-b border-zinc-900 pb-3 flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-400" />
                Generate Coupon Code
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Coupon Code</label>
                  <input
                    type="text"
                    placeholder="e.g. FIFTYPRO"
                    value={promoNewCode}
                    onChange={(e) => setPromoNewCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500 placeholder-zinc-700"
                  />
                </div>

                <div className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    id="promoIsTrial"
                    checked={promoNewIsTrial}
                    onChange={(e) => setPromoNewIsTrial(e.target.checked)}
                    className="h-3.5 w-3.5 rounded bg-zinc-900 border-zinc-805 text-emerald-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="promoIsTrial" className="text-xs text-zinc-300 font-bold select-none cursor-pointer">
                    Is 7-Day Free Trial Code?
                  </label>
                </div>

                {!promoNewIsTrial ? (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Discount Percentage (%)</label>
                    <input
                      type="number"
                      value={promoNewDiscount}
                      onChange={(e) => setPromoNewDiscount(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-805 border-zinc-808 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Trial Validity (Days)</label>
                    <input
                      type="number"
                      value={promoNewTrialDays}
                      onChange={(e) => setPromoNewTrialDays(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-805 border-zinc-808 rounded-lg p-2 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                )}

                <button
                  onClick={() => {
                    if (!promoNewCode.trim()) {
                      setErrorMsg("Please specify a coupon code name.");
                      return;
                    }
                    const newPromo = {
                      code: promoNewCode.trim().toUpperCase(),
                      discountPercent: promoNewIsTrial ? 100 : Number(promoNewDiscount),
                      isTrialCode: promoNewIsTrial,
                      trialDays: promoNewIsTrial ? Number(promoNewTrialDays) : undefined,
                      isActive: true
                    };
                    const next = [...promosConfig, newPromo];
                    setPromosConfig(next);
                    handleSavePricingConfig(plansConfig, next);
                    setPromoNewCode("");
                  }}
                  className="w-full bg-zinc-900 hover:bg-zinc-805 border border-zinc-800 text-white p-2.5 rounded-lg text-xs font-extrabold transition cursor-pointer flex items-center justify-center gap-1 shadow-sm font-sans"
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                  Publish Offer Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "secure-billing" && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/45 p-6 space-y-4">
          <BillingView state={state} onRefresh={onRefresh} />
        </div>
      )}

    </div>
  );
}
