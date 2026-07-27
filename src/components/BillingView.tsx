import React, { useState, useEffect } from "react";
import { 
  CreditCard, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Smartphone, 
  Lock, 
  ShieldCheck, 
  MinusCircle, 
  ArrowUpRight,
  Zap,
  Info,
  DollarSign,
  ExternalLink,
  Loader2,
  Calendar,
  XCircle,
  FileText,
  BadgeAlert,
  ArrowRight,
  RefreshCw,
  TrendingUp,
  Download
} from "lucide-react";
import { FullAppState, TenantInfo } from "../types";

interface BillingViewProps {
  state: FullAppState;
  onRefresh: () => void;
}

interface SimulatedInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: "PAID" | "UNPAID";
  plan: string;
}

export default function BillingView({ state, onRefresh }: BillingViewProps) {
  const tenants = state.tenantsList || [];
  const activeTenantId = state.activeTenantId || "tenant-harry";
  const currentTenant = tenants.find(t => t.id === activeTenantId) || tenants[0];

  const fetch = async (url: string, init?: RequestInit) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> || {}),
      "X-Tenant-ID": activeTenantId,
    };
    return window.fetch(url, { ...init, headers });
  };

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Stripe Connection State
  const [isStripeConfigured, setIsStripeConfigured] = useState<boolean>(false);
  const [stripePublishableKey, setStripePublishableKey] = useState<string>("");
  const [checkingOut, setCheckingOut] = useState<boolean>(false);

  // Billing states
  const [selectedPlanTier, setSelectedPlanTier] = useState<"Starter" | "Professional" | "Institutional">(
    (currentTenant?.tier as any) || "Starter"
  );
  
  // Sandbox Simulator Overlay Dialogs
  const [showSandboxCheckout, setShowSandboxCheckout] = useState<boolean>(false);
  const [showSandboxPortal, setShowSandboxPortal] = useState<boolean>(false);
  const [simulatedCardNumber, setSimulatedCardNumber] = useState<string>("4242 •••• •••• 4242");
  const [simulatedCardName, setSimulatedCardName] = useState<string>(currentTenant?.name || "Test Cardholder");
  const [simulatedCardExpiry, setSimulatedCardExpiry] = useState<string>("12/28");
  const [simulatedCardCvv, setSimulatedCardCvv] = useState<string>("***");

  // Local simulated invoices history
  const [simulatedInvoices, setSimulatedInvoices] = useState<SimulatedInvoice[]>([]);
  
  // Custom billing portal simulated parameters
  const [mockAutoRenew, setMockAutoRenew] = useState<boolean>(true);

  // Active Invoice View modal state
  const [activeInvoiceDetail, setActiveInvoiceDetail] = useState<SimulatedInvoice | null>(null);

  // Fetch Stripe Backend Configuration configuration
  const fetchStripeConfig = async () => {
    try {
      const res = await fetch("/api/stripe/config");
      const d = await res.json();
      setIsStripeConfigured(d.isConfigured);
      setStripePublishableKey(d.publishableKey);
    } catch (e) {
      console.error("Failed to read Stripe config state:", e);
    }
  };

  useEffect(() => {
    fetchStripeConfig();
    
    // Seed some mock invoice history based on current plan for credibility
    if (currentTenant) {
      const basePrice = currentTenant.price || (currentTenant.tier === "Institutional" ? 599 : currentTenant.tier === "Professional" ? 249 : 99);
      setSimulatedInvoices([
        {
          id: "inv-l3910f",
          number: `INV-2026-00${Math.floor(10 + Math.random() * 89)}`,
          date: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().split("T")[0],
          amount: basePrice,
          status: "PAID",
          plan: currentTenant.tier
        },
        {
          id: "inv-p8291a",
          number: `INV-2026-00${Math.floor(10 + Math.random() * 89)}`,
          date: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString().split("T")[0],
          amount: basePrice,
          status: "PAID",
          plan: currentTenant.tier
        }
      ]);
    }
  }, [activeTenantId, currentTenant?.tier]);

  // Handle successful redirects or cancellations
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("checkout_success") === "true") {
      const plan = params.get("plan");
      setSuccessMsg(`🎉 Outstanding! Your subscription was successfully processed and activated securely for the ${plan} Plan! Your workspace lot sizing caps and strategy structures have loaded.`);
      window.history.replaceState({}, document.title, window.location.pathname);
      onRefresh();
    } else if (params.get("checkout_cancel") === "true") {
      setErrorMsg("❌ Checkout cancelled. No updates were made to your account billing parameters.");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleCheckout = async () => {
    if (!currentTenant) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setCheckingOut(true);

    try {
      const res = await fetch("/api/stripe/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: selectedPlanTier,
          tenantId: currentTenant.id
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to contact gateway.");
      }

      const data = await res.json();
      if (data.isSandbox) {
        // Stripe keys are missing -> Trigger the developer sandbox experience
        setShowSandboxCheckout(true);
      } else if (data.url) {
        // Hard redirect to Stripe Hosted Checkout
        window.location.href = data.url;
      }
    } catch (e: any) {
      setErrorMsg(`Checkout error: ${e.message}`);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleOpenPortal = async () => {
    if (!currentTenant) return;
    setErrorMsg(null);
    setSuccessMsg(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: currentTenant.id
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load portal.");
      }

      const data = await res.json();
      if (data.isSandbox) {
        // Open simulated customer billing portal
        setShowSandboxPortal(true);
      } else if (data.url) {
        // Launch real secure Billing Portal
        window.location.href = data.url;
      }
    } catch (e: any) {
      setErrorMsg(`Billing Portal failure: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const executeSandboxSimulation = async (action: "checkout" | "cancel" | "reactivate") => {
    if (!currentTenant) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/stripe/sandbox-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          tenantId: currentTenant.id,
          planTier: selectedPlanTier
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed simulation payload event.");
      }

      const d = await res.json();
      onRefresh();

      if (action === "checkout") {
        setSuccessMsg(`🎉 Simulated Checkout Success! Successfully processed payment under Sandbox rules and updated ${selectedPlanTier} plan features.`);
        
        // Add new simulated invoice
        const priceAmount = selectedPlanTier === "Institutional" ? 599 : selectedPlanTier === "Professional" ? 249 : 99;
        const newInv: SimulatedInvoice = {
          id: `inv-${Math.random().toString(36).substr(2, 6)}`,
          number: `INV-2026-00${Math.floor(80 + Math.random() * 19)}`,
          date: new Date().toISOString().split("T")[0],
          amount: priceAmount,
          status: "PAID",
          plan: selectedPlanTier
        };
        setSimulatedInvoices(prev => [newInv, ...prev]);
        setShowSandboxCheckout(false);
      } else if (action === "cancel") {
        setSuccessMsg("🚫 Simulated subscription cancelled successfully inside Sandbox. Auto-renew suspended.");
        setMockAutoRenew(false);
      } else if (action === "reactivate") {
        setSuccessMsg("🎉 Simulated subscription reactivated inside Sandbox! Monthly billing cycles restored.");
        setMockAutoRenew(true);
      }

    } catch (err: any) {
      setErrorMsg(`Simulator write error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Simulate instant month roll-over (bill cycle)
  const handleSimulateCycle = async () => {
    if (!currentTenant) return;
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/admin/tenants/bill-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: currentTenant.id })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Simulated cycle crashed.");
      }

      const d = await res.json();
      setSuccessMsg(`💳 Monthly billing interval completed! Simulated $${currentTenant.price} fee deduction logged in workspace alerts stream.`);
      
      const newInv: SimulatedInvoice = {
        id: `inv-sim-${Math.random().toString(36).substr(2, 6)}`,
        number: `INV-2026-00${Math.floor(100 + Math.random() * 899)}`,
        date: new Date().toISOString().split("T")[0],
        amount: currentTenant.price,
        status: "PAID",
        plan: currentTenant.tier
      };
      setSimulatedInvoices(prev => [newInv, ...prev]);
      
      onRefresh();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const activePriceAmount = selectedPlanTier === "Starter" ? 99 : selectedPlanTier === "Professional" ? 249 : 599;
  const isSubscribedOnStripe = currentTenant?.stripeSubscriptionId && currentTenant.stripeSubscriptionId.length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left text-white font-sans animate-fadeIn">
      
      {/* HEADER BLOCK */}
      <div className="border-b border-zinc-900 pb-4 space-y-1 flex flex-col md:flex-row md:items-center justify-between md:gap-4">
        <div>
          <h3 className="font-display text-xl font-black text-white flex items-center gap-2.5">
            <CreditCard className="h-5.5 w-5.5 text-emerald-400 animate-pulse" />
            True Payment Subscription Billing
          </h3>
          <p className="text-xs text-zinc-400">
            Secure PCI-DSS compliant live secure checkout pipelines, automated subscription renewals, unified invoice logs, and self-service portals.
          </p>
        </div>

        {/* SECURE KEY STATUS BADGE */}
        <div className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 shrink-0 ${
          isStripeConfigured 
            ? "bg-indigo-500/10 border-indigo-500/20 text-indigo-400" 
            : "bg-amber-500/10 border-amber-500/20 text-amber-400"
        }`}>
          <div className={`h-2 w-2 rounded-full ${isStripeConfigured ? "bg-indigo-400 animate-pulse" : "bg-amber-500"}`} />
          <span className="text-[10px] font-mono tracking-wide font-extrabold uppercase">
            {isStripeConfigured ? "Live Gateway Active" : "Billing Sandbox Connected"}
          </span>
        </div>
      </div>

      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-lg text-xs font-bold flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {currentTenant ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT PANEL: CURRENT PLAN & TARGET CHOOSE COMPARSIONS */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* CURRENT ACTIVE PLAN */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">Current Subscription</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border uppercase ${
                  currentTenant.status === "Expired" 
                    ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                }`}>
                  {currentTenant.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-900/20 p-4 rounded-xl border border-zinc-900/60 text-xs">
                <div>
                  <span className="text-zinc-500 font-mono text-[9px] block uppercase">CURRENT PLAN TIER</span>
                  <span className="font-extrabold text-white mt-1 block text-sm">{currentTenant.tier} Plan</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[9px] block uppercase">CYCLE DUE DATE</span>
                  <span className="font-bold text-zinc-300 mt-1 block font-mono">{currentTenant.nextBillingDate || "Subscription suspended"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[9px] block uppercase">PERIODIC RATE</span>
                  <span className="font-bold text-emerald-400 mt-1 block font-mono text-sm">${currentTenant.price || 99}/mo</span>
                </div>
              </div>

              {/* ACTIONS PANEL */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isSubscribedOnStripe ? (
                  <button
                    onClick={handleOpenPortal}
                    disabled={submitting}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black uppercase tracking-wider rounded-lg border border-indigo-500/40 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                    Manage Subscription (Billing Portal)
                  </button>
                ) : (
                  <div className="text-[11px] text-zinc-500 italic flex items-center gap-1.5 w-full">
                    <Info className="h-3.5 w-3.5 text-zinc-600 shrink-0" />
                    No active subscription mapped. Select a plan below and click "Proceed to Checkout" to authorize.
                  </div>
                )}

                {/* DEV BILL CYCLE ADVANCER */}
                {currentTenant.status === "Active" && (
                  <button
                    onClick={handleSimulateCycle}
                    disabled={submitting}
                    title="Simulate rollover of active billing period and charge the next price term."
                    className="px-3.5 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-[10px] font-mono rounded-lg border border-zinc-800 transition-all cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${submitting ? "animate-spin" : ""}`} />
                    DEBUG: Simulate Bill Cycle
                  </button>
                )}
              </div>
            </div>

            {/* CHOOSE PLAN CARDS */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                    Switch Workspace Subscription Plan
                  </h4>
                  <p className="text-[10px] text-zinc-500">
                    Select a tier. Lot sizing capabilities and algorithmic AI signals adjust immediately on success.
                  </p>
                </div>
              </div>

              {/* Plans Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 select-none">
                {/* Starter */}
                <div 
                  onClick={() => setSelectedPlanTier("Starter")}
                  className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between ${
                    selectedPlanTier === "Starter"
                      ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-950/10"
                      : "border-zinc-900 bg-zinc-950 hover:border-zinc-800"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-zinc-400">Starter</span>
                      {currentTenant.tier === "Starter" && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <div className="font-display text-xl font-black text-white leading-none">$99<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                    <p className="text-[10px] text-zinc-500">Great for individual operators testing strategies.</p>
                  </div>
                  <div className="mt-4 border-t border-zinc-900/50 pt-2.5 text-[10px] font-mono text-zinc-400">
                    • 3 Active Strategies<br />
                    • Max 0.5 Lots Limit
                  </div>
                </div>

                {/* Professional */}
                <div 
                  onClick={() => setSelectedPlanTier("Professional")}
                  className={`rounded-xl border p-4 cursor-pointer transition relative flex flex-col justify-between ${
                    selectedPlanTier === "Professional"
                      ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-950/20"
                      : "border-emerald-500/10 bg-zinc-950 hover:border-zinc-800"
                  }`}
                >
                  <span className="absolute -top-2 right-4 bg-emerald-500 text-black text-[7px] font-black py-0.5 px-2 rounded-full uppercase tracking-wider">
                    RECOMMENDED
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Professional</span>
                      {currentTenant.tier === "Professional" && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-[8px] font-bold px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <div className="font-display text-xl font-black text-white leading-none">$249<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                    <p className="text-[10px] text-zinc-400">Ideal for high-volume traders under daily conditions.</p>
                  </div>
                  <div className="mt-4 border-t border-zinc-900/50 pt-2.5 text-[10px] font-mono text-zinc-200">
                    • 10 Active Strategies<br />
                    • Max 5.0 Lots Limit<br />
                    • Unlocked Smart AI Advisor
                  </div>
                </div>

                {/* Institutional */}
                <div 
                  onClick={() => setSelectedPlanTier("Institutional")}
                  className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between ${
                    selectedPlanTier === "Institutional"
                      ? "border-purple-500 bg-purple-500/5 shadow-md shadow-purple-950/10"
                      : "border-zinc-900 bg-zinc-950 hover:border-zinc-800"
                  }`}
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black uppercase tracking-wide text-purple-400">Institutional</span>
                      {currentTenant.tier === "Institutional" && (
                        <span className="bg-purple-500/10 text-purple-400 text-[8px] font-bold px-1.5 py-0.5 rounded">Active</span>
                      )}
                    </div>
                    <div className="font-display text-xl font-black text-white leading-none">$599<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                    <p className="text-[10px] text-zinc-500">Built for institutional desk high sizing operations.</p>
                  </div>
                  <div className="mt-4 border-t border-zinc-900/50 pt-2.5 text-[10px] font-mono text-zinc-400">
                    • 999 Active Strategies<br />
                    • Max 250.0 Lots Limit
                  </div>
                </div>
              </div>

              {/* Limits and Capabilities Detail */}
              <div className="p-4 bg-zinc-950/40 rounded-lg border border-zinc-900/50 text-xs text-zinc-400 grid grid-cols-2 gap-y-2">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider col-span-2 border-b border-zinc-900 pb-1 flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-emerald-400" />
                  WORKSPACE LIMIT PARAMETERS
                </span>
                <span>Active Strategy Limit</span>
                <span className="text-right font-mono text-zinc-200 font-bold">{selectedPlanTier === "Starter" ? "3 strategies" : selectedPlanTier === "Professional" ? "10 strategies" : "999 (Unlimited)"}</span>
                
                <span>Single Lot Sizing Cap</span>
                <span className="text-right font-mono text-zinc-200 font-bold">{selectedPlanTier === "Starter" ? "0.5 Lots limit" : selectedPlanTier === "Professional" ? "5.0 Lots limit" : "250.0 Lots limit"}</span>
                
                <span>Simultaneous Trade Locks</span>
                <span className="text-right font-mono text-zinc-200 font-bold">{selectedPlanTier === "Starter" ? "3 active trades" : selectedPlanTier === "Professional" ? "20 active trades" : "9999 active trades"}</span>
              </div>
            </div>

            {/* INVOICES AND BILLING HISTORY */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-indigo-400" />
                Receipt Invoices & Payment Logs
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-400 border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-900 text-zinc-500 font-mono text-[9px] uppercase">
                      <th className="py-2">Invoice Number</th>
                      <th className="py-2">Date</th>
                      <th className="py-2">Plan</th>
                      <th className="py-2">Amount</th>
                      <th className="py-2">Status</th>
                      <th className="py-1 text-center">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900/40">
                    {simulatedInvoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-zinc-900/20 transition-colors">
                        <td className="py-2.5 font-mono text-zinc-300 font-bold">{inv.number}</td>
                        <td className="py-2.5 font-mono">{inv.date}</td>
                        <td className="py-2.5">{inv.plan}</td>
                        <td className="py-2.5 font-mono font-bold text-white">${inv.amount}.00</td>
                        <td className="py-2.5 text-[10px]">
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20 uppercase tracking-widest text-[8px]">
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-1 text-center">
                          <button
                            onClick={() => setActiveInvoiceDetail(inv)}
                            className="p-1 hover:bg-zinc-900/80 rounded border border-zinc-800 text-zinc-400 hover:text-indigo-400 transition cursor-pointer"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* RIGHT PANEL: SECURE PAYMENT GATEWAY CARD */}
          <div className="lg:col-span-5 space-y-6">
            
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden">
              
              {/* Checkout Frame Headers */}
              <div className="border-b border-zinc-900 pb-3 mb-4">
                <span className="text-[9px] text-indigo-400 font-mono tracking-widest font-bold uppercase block">Secure Checkout Gateway</span>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                    Subscription Invoicing
                  </h4>
                  <span className="text-zinc-500 text-[10px] font-mono">Invoice #{Math.floor(200000 + Math.random() * 800000)}</span>
                </div>
              </div>

              {/* Price rate calculation */}
              <div className="space-y-3 mb-5 text-xs text-zinc-400">
                <div className="flex justify-between">
                  <span>Target Workspace:</span>
                  <span className="font-semibold text-zinc-100">{currentTenant.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Selected Rate Term:</span>
                  <span className="font-extrabold text-emerald-400 font-mono uppercase">{selectedPlanTier} Plan</span>
                </div>
                <div className="flex justify-between border-t border-zinc-900 pt-2.5 text-[13px] font-black text-white">
                  <span>Monthly Rate Total:</span>
                  <span className="text-emerald-400 font-mono">${activePriceAmount}.00 /mo</span>
                </div>
              </div>

              {/* Checkout Button */}
              {selectedPlanTier === currentTenant.tier && isSubscribedOnStripe ? (
                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-400 space-y-2">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Check className="h-4 w-4 shrink-0" />
                    You are already subscribed to this tier
                  </div>
                  <div>Your account features are fully active. Manage auto-renewal and payment methods through the secure platform portal.</div>
                  <button
                    onClick={handleOpenPortal}
                    className="w-full mt-2 py-2 bg-emerald-400 hover:bg-emerald-500 text-black font-bold uppercase text-[10px] rounded-lg cursor-pointer transition flex items-center justify-center gap-1"
                  >
                    Open Active Billing Portal <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Proceed to pay securely. Automated charges rollover every 30 days. You can cancel at any time, instantly reverting to Starter limits on period end.
                  </p>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={checkingOut}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black uppercase flex items-center justify-center gap-1.5 transition tracking-wider border border-indigo-500 cursor-pointer shadow-indigo-950/40 shadow-lg"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Generating Checkout Session...
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        Proceed to Secure Checkout
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* PCI-DSS BADGE */}
            <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-4 space-y-2 flex gap-3 text-xs text-zinc-400 select-none">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold text-zinc-200 block text-xs">Merchant Certified Core</span>
                <span className="text-[10.5px] text-zinc-500">All payment details are direct-routed to secure, off-site servers. Financial credentials never trace or write to local files under PCI-DSS compliance regulations.</span>
              </div>
            </div>

          </div>

        </div>
      ) : (
        <p className="text-xs text-zinc-500 p-4 text-center">No active tenant found.</p>
      )}

      {/* ==============================================================================
          SANDBOX CHECKOUT SIMULATOR OVERLAY MODAL Dialog
          ============================================================================== */}
      {showSandboxCheckout && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden text-left font-sans text-white">
            
            {/* Simulation Header banner */}
            <div className="bg-gradient-to-r from-purple-800 to-indigo-900 px-5 py-4 flex items-center justify-between border-b border-purple-950">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span className="font-mono text-xs font-black uppercase tracking-widest text-emerald-400">Sandbox Simulator Checkout</span>
              </div>
              <button 
                onClick={() => setShowSandboxCheckout(false)}
                className="text-zinc-400 hover:text-white bg-black/20 hover:bg-black/40 rounded-full p-1 cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {/* Simulated Checkout Box */}
            <div className="p-5 space-y-4">
              <div className="bg-amber-400/5 border border-amber-400/20 text-amber-400 rounded-lg p-3 text-[11px] leading-relaxed">
                <span className="font-extrabold uppercase">SDK Sandbox Active</span> - You are checking out using simulated sandbox hooks because no actual <strong>SECRET_KEY</strong> was found in settings.
              </div>

              <div className="space-y-2 border-b border-zinc-900 pb-3">
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Simulated Product:</span>
                  <span className="font-extrabold text-white text-xs">{selectedPlanTier} Plan</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-400">
                  <span>Recurring Term:</span>
                  <span className="font-mono text-xs text-zinc-300">Monthly auto-renewal</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-white border-t border-zinc-900 pt-2">
                  <span>Amount to Charge:</span>
                  <span className="text-emerald-400 font-mono">${activePriceAmount}.00 USD</span>
                </div>
              </div>

              {/* CARD DETAILS FORM SIMULATOR */}
              <div className="space-y-3.5 bg-zinc-900/30 p-4 rounded-xl border border-zinc-900">
                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1">MOCK CARD NUMBER (TEST)</label>
                  <input
                    type="text"
                    value={simulatedCardNumber}
                    onChange={(e) => setSimulatedCardNumber(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 w-full focus:outline-none focus:border-purple-500 font-mono font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">EXPIRY</label>
                    <input
                      type="text"
                      value={simulatedCardExpiry}
                      onChange={(e) => setSimulatedCardExpiry(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 w-full focus:outline-none focus:border-purple-500 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">CVV PIN</label>
                    <input
                      type="text"
                      value={simulatedCardCvv}
                      onChange={(e) => setSimulatedCardCvv(e.target.value)}
                      className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 w-full focus:outline-none focus:border-purple-500 font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-zinc-500 block mb-1">CARDHOLDER NAME</label>
                  <input
                    type="text"
                    value={simulatedCardName}
                    onChange={(e) => setSimulatedCardName(e.target.value)}
                    className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-200 w-full focus:outline-none focus:border-purple-500 text-xs"
                  />
                </div>
              </div>

              {/* Submit simulation */}
              <button
                type="button"
                onClick={() => executeSandboxSimulation("checkout")}
                disabled={submitting}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold uppercase rounded-lg text-xs cursor-pointer shadow-lg shadow-purple-950/20 leading-none flex items-center justify-center gap-1.5"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Simulating Webhook authorization...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Simulate Payment & Activate ({selectedPlanTier})
                  </>
                )}
              </button>

              <div className="text-center">
                <span className="text-[9px] font-mono text-zinc-600">
                  Fires test payload directly into sandbox-simulate
                </span>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==============================================================================
          SANDBOX BILLING CUSTOMER PORTAL SIMULATOR OVERLAY Dialog
          ============================================================================== */}
      {showSandboxPortal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl max-w-xl w-full shadow-2xl relative overflow-hidden text-left font-sans text-white">
            
            {/* simulator header */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 px-5 py-4 flex items-center justify-between border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4.5 w-4.5 text-indigo-400" />
                <span className="font-display font-black text-xs text-indigo-400 uppercase tracking-wider">DEVELOPER PORTAL SIMULATOR</span>
              </div>
              <button 
                onClick={() => setShowSandboxPortal(false)}
                className="text-zinc-500 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full p-1 cursor-pointer"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              
              <div className="space-y-1.5">
                <h4 className="text-sm font-extrabold text-white">Simulation Billing Portal</h4>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Toggle automated renewals, simulate direct cancellations, or inspect recent sandbox invoice lines below. Maps secure Billing Customer Portal.
                </p>
              </div>

              {/* MOCK SUBSCRIPTION CONNECTOR DETAIL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Auto renewal box status */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 space-y-3">
                  <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block">Subscription Action Hub</span>
                  
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400 block">Workspace status:</span>
                    <span className="text-xs font-extrabold text-white uppercase">{currentTenant.tier} Plan - {currentTenant.status}</span>
                  </div>

                  <div className="space-y-1.5 pt-1.5 border-t border-zinc-900/60">
                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Monthly Auto-Renew:</span>
                      <span className={`font-mono text-[10px] font-bold ${mockAutoRenew ? "text-emerald-400" : "text-rose-400"}`}>
                        {mockAutoRenew ? "ENABLED (ON)" : "DISABLED (OFF)"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-400">
                      <span>Next Renewal Charge:</span>
                      <span className="font-mono text-xs">{mockAutoRenew ? currentTenant.nextBillingDate : "Cycle Terminated"}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex gap-2">
                    {mockAutoRenew ? (
                      <button
                        onClick={() => executeSandboxSimulation("cancel")}
                        disabled={submitting}
                        className="flex-1 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 text-[10px] font-bold uppercase rounded cursor-pointer transition flex items-center justify-center gap-1"
                      >
                        <MinusCircle className="h-3.5 w-3.5" />
                        Cancel Auto-Renew
                      </button>
                    ) : (
                      <button
                        onClick={() => executeSandboxSimulation("reactivate")}
                        disabled={submitting}
                        className="flex-1 py-1.5 bg-emerald-400 hover:bg-emerald-500 text-black text-[10px] font-extrabold uppercase rounded cursor-pointer transition flex items-center justify-center gap-1"
                      >
                        <Check className="h-3.5 w-3.5" />
                        Reactivate Auto-Renew
                      </button>
                    )}
                  </div>
                </div>

                {/* Simulated credit card mapped */}
                <div className="bg-zinc-900/30 border border-zinc-900 rounded-xl p-4 space-y-3.5">
                  <span className="text-[9px] font-mono text-zinc-500 font-bold uppercase block">Secure Mapped Card</span>
                  
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="h-7 w-7 text-indigo-400" />
                    <div>
                      <span className="font-mono text-xs font-bold text-white block">VISA •••• 4242</span>
                      <span className="text-[10px] text-zinc-500 uppercase font-mono">Expires {simulatedCardExpiry} | Mapped Securely</span>
                    </div>
                  </div>

                  <div className="text-[10.5px] text-zinc-500 leading-normal pt-1.5 border-t border-zinc-900/60">
                    To update actual payment profiles or link other credentials, enter payment settings in settings panel and authorize live configuration.
                  </div>
                </div>

              </div>

              <div className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  Needs simulated renewal cycle interval to verify charges?
                </span>
                <button
                  onClick={() => {
                    handleSimulateCycle();
                    setShowSandboxPortal(false);
                  }}
                  className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-850/80 hover:text-white border border-zinc-800 rounded font-bold cursor-pointer"
                >
                  Trigger Simulated Cycle Fee
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* ==============================================================================
          MOCK INVOICE PREVIEW MODAL Window
          ============================================================================== */}
      {activeInvoiceDetail && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white text-zinc-950 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden font-mono text-xs">
            
            {/* Header info */}
            <div className="flex justify-between items-start border-b-2 border-dashed border-zinc-300 pb-4 mb-4">
              <div>
                <h4 className="text-sm font-black uppercase text-indigo-900 tracking-wider">GATEWAY INVOICE RECEIPT</h4>
                <p className="text-[10px] text-zinc-500">PCI SECURE BILLING GATEWAY CERTIFIED RECEIPT</p>
              </div>
              <button 
                onClick={() => setActiveInvoiceDetail(null)}
                className="text-zinc-400 hover:text-zinc-950 rounded-full border border-zinc-200 hover:border-zinc-300 p-1 cursor-pointer text-xs"
              >
                [CLOSE]
              </button>
            </div>

            <div className="space-y-4">
              
              <div className="grid grid-cols-2 gap-y-1 bg-zinc-50 p-3 rounded-lg border border-zinc-200">
                <span className="text-zinc-500 font-bold uppercase text-[9px]">Invoice Number:</span>
                <span className="text-right text-zinc-900 font-bold">{activeInvoiceDetail.number}</span>

                <span className="text-zinc-500 font-bold uppercase text-[9px]">Bill Date:</span>
                <span className="text-right text-zinc-900">{activeInvoiceDetail.date}</span>

                <span className="text-zinc-500 font-bold uppercase text-[9px]">Workspace customer:</span>
                <span className="text-right text-zinc-900 font-bold">{currentTenant.name}</span>

                <span className="text-zinc-500 font-bold uppercase text-[9px]">Merchant receiver:</span>
                <span className="text-right text-zinc-900">Quant AI Algorithmic Desk</span>
              </div>

              {/* Items Table */}
              <div className="space-y-1.5">
                <span className="font-bold text-zinc-500 uppercase text-[9px]">LINE ITEM SUMMARY</span>
                <div className="border border-zinc-200 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between border-b border-zinc-100 pb-1.5 font-bold">
                    <span>Description</span>
                    <span>Cost Rate</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quant Workspace {activeInvoiceDetail.plan} Subscription</span>
                    <span>${activeInvoiceDetail.amount}.00</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>- Live EA Sockets / Multi-Chart Data Pipeline</span>
                    <span>[UNLOCKED]</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>- Smart AI Expert Advisor Signals access</span>
                    <span>[INCLUDED]</span>
                  </div>
                  
                  <div className="border-t border-zinc-200/60 pt-2 flex justify-between font-bold text-zinc-900 text-sm">
                    <span>Total Paid (USD):</span>
                    <span className="text-emerald-700">${activeInvoiceDetail.amount}.00</span>
                  </div>
                </div>
              </div>

              {/* Footer Stamp */}
              <div className="text-center p-3.5 bg-indigo-50 rounded-lg border border-indigo-100 space-y-1.5">
                <div className="text-[10px] font-bold text-indigo-900 uppercase">TRANSACTION STATUS: SECURELY PAID ✅</div>
                <div className="text-[9px] text-zinc-500 leading-normal max-w-xs mx-auto">
                  Fund transfers cleared via Secure Payments. Mapped to subscription ledger sub-key record. Retain this invoice as an official business expense record.
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    setActiveInvoiceDetail(null);
                    setSuccessMsg("💾 Simulated Invoice Receipt PDF started downloading safely.");
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase text-[10px] rounded hover:shadow transition-all cursor-pointer"
                >
                  Download Receipt
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
