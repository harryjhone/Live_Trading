import React, { useState, useEffect } from "react";
import { 
  User, 
  CreditCard, 
  Lock, 
  Check, 
  Smartphone, 
  Eye, 
  EyeOff, 
  MinusCircle, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  CheckSquare
} from "lucide-react";
import { FullAppState, TenantInfo } from "../types";

interface SubscriberBillingViewProps {
  state: FullAppState;
  onRefresh: () => void;
}

export default function SubscriberBillingView({ state, onRefresh }: SubscriberBillingViewProps) {
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

  // Profile forms fields
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("+1 555-019-2831");
  const [editCompany, setEditCompany] = useState("Horizon Alpha Trading Group");

  const [showAdminEditPasscode, setShowAdminEditPasscode] = useState(false);
  
  // Checkout simulator options
  const [selectedPlanTier, setSelectedPlanTier] = useState<"Starter" | "Professional" | "Institutional">(
    (currentTenant?.tier as any) || "Starter"
  );
  const [paymentGatewayType, setPaymentGatewayType] = useState<"UPI" | "CARD">("UPI");
  
  // Card credentials
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");

  // UPI credentials
  const [upiVpa, setUpiVpa] = useState("");
  const [upiProvider, setUpiProvider] = useState("@upi");
  const [upiAppSelector, setUpiAppSelector] = useState<"GPay" | "PhonePe" | "Paytm" | "BHIM">("GPay");

  // Loading / processing states
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStepIndex, setPaymentStepIndex] = useState(0);
  const [paymentStepText, setPaymentStepText] = useState("");
  const [checkoutCompleteSuccess, setCheckoutCompleteSuccess] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      setEditName(currentTenant.name || "");
      setEditEmail(currentTenant.email || "");
      setEditUsername(currentTenant.username || currentTenant.id.replace("tenant-", ""));
      setEditPassword(currentTenant.password || "@Hariom12");
    }
  }, [currentTenant?.id]);

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

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
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
          password: editPassword,
          tier: currentTenant.tier,
          status: currentTenant.status,
          price: currentTenant.price,
          nextBillingDate: currentTenant.nextBillingDate
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Profile update failed.");
      }

      setSuccessMsg("System identity & connection passcode updated successfully.");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Connection error to node cluster.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelPlan = async () => {
    if (!currentTenant) return;
    if (!window.confirm("Are you absolutely sure you want to suspend/cancel this automated subscription and downgrade instantly on period expiration?")) return;
    
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
          name: currentTenant.name,
          email: currentTenant.email,
          username: currentTenant.username,
          password: currentTenant.password,
          tier: currentTenant.tier,
          status: "Expired",
          price: planPrice,
          nextBillingDate: currentTenant.nextBillingDate
        })
      });

      if (!res.ok) throw new Error("Could not cancel this workspace.");
      setSuccessMsg("🚫 Subscription cancelled successfully. Workspace limits have been suspended.");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Endpoint connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

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
          name: currentTenant.name,
          email: currentTenant.email,
          username: currentTenant.username,
          password: currentTenant.password,
          tier: currentTenant.tier,
          status: "Active",
          price: planPrice,
          nextBillingDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split("T")[0]
        })
      });

      if (!res.ok) throw new Error("Could not reactivate workspace limits.");
      setSuccessMsg("✅ Subscription reactivated successfully! Workspace limits upgraded.");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || "Endpoint connection failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const triggerSimulationSequence = () => {
    setPaymentProcessing(true);
    setPaymentStepIndex(0);
    setPaymentStepText("Connecting to PCI-DSS secure acquirer bridge...");

    const steps = [
      "Establishing handshake node with payment gateway...",
      "Authorizing virtual payment instrument credentials...",
      "Simulating merchant escrow settlement validation...",
      "Finalizing bank allocation and updating workspace limits...",
      "Synchronizing client context. Almost complete..."
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      currentStep++;
      if (currentStep < steps.length) {
        setPaymentStepIndex(currentStep);
        setPaymentStepText(steps[currentStep]);
      } else {
        clearInterval(interval);
        
        // Push update to backend to switch tier and reactivate
        try {
          const planPrice = selectedPlanTier === "Institutional" ? 599 : selectedPlanTier === "Professional" ? 249 : 99;
          await fetch("/api/admin/tenants/update", {
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

          // Simulate billing webhook log
          await fetch("/api/admin/tenants/bill-simulate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tenantId: currentTenant.id,
              amount: planPrice,
              tier: selectedPlanTier
            })
          });

          setCheckoutCompleteSuccess(true);
          setSuccessMsg(`🚀 Awesome! Your workspace has been upgraded to ${selectedPlanTier} Tier!`);
          onRefresh();
        } catch (err) {
          console.error(err);
        } finally {
          setPaymentProcessing(false);
        }
      }
    }, 1500);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(" ");
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardExpiry(formatExpiry(e.target.value));
  };

  return (
    <div className="space-y-6">
      
      {/* SUCCESS & ERROR TOAST NOTIFICATION CORNER */}
      {successMsg && (
        <div className="p-4 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-start gap-2.5 text-xs animate-slideDown">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <div>
            <span className="font-bold block text-emerald-300">Transaction/Operations Executed</span>
            {successMsg}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 border border-rose-500/20 bg-rose-500/10 text-rose-400 rounded-xl flex items-start gap-2.5 text-xs animate-slideDown">
          <Info className="h-4.5 w-4.5 text-rose-450 shrink-0" />
          <div>
            <span className="font-bold block text-rose-350">Operations Error</span>
            {errorMsg}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: PROFILE & PLANS */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* PROFILE CARD */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3 mb-4">
              <div className="h-7 w-7 rounded bg-zinc-900 flex items-center justify-center text-emerald-400">
                <User className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                  Platform Core Subscriber Profile
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Configure your workspace identity, metadata, and security passcode.
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
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-650 w-full focus:outline-none focus:border-emerald-500 font-sans" 
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
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-650 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">DESK CONTACT PHONE (OPTIONAL)</label>
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +91 98765 43210"
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-650 w-full focus:outline-none focus:border-emerald-500" 
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
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-650 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono text-emerald-500 block leading-tight font-bold">WORKSPACE SECURITY PASSCODE</label>
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
                        className="bg-zinc-900 border border-zinc-800 rounded pl-2.5 pr-10 py-1.5 text-xs text-white placeholder-zinc-650 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminEditPasscode(!showAdminEditPasscode)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showAdminEditPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-900">
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1 leading-none">
                    <Lock className="h-3 w-3 text-zinc-650" />
                    Secure Sandbox AES-256 Connection Protocol
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-[11px] px-4 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    {submitting ? "Updating Profile..." : "Save Identity Metadata"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-lg bg-zinc-900/10 border border-zinc-900 text-center text-xs text-zinc-500">
                Initializing subscription profile session...
              </div>
            )}
          </div>

          {/* ACTIVE PLAN INFOMATION CARD */}
          {currentTenant && (
            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-400" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">Your Active Subscription Status</h4>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold tracking-wider border uppercase ${
                  currentTenant.status === "Expired" 
                    ? "bg-rose-500/10 text-rose-450 border-rose-500/20" 
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse"
                }`}>
                  {currentTenant.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950/50 p-4 rounded-xl border border-zinc-900 text-xs text-zinc-300">
                <div>
                  <span className="text-zinc-500 font-mono text-[9px] block uppercase">Current Active Tier</span>
                  <span className="font-extrabold text-white mt-1 block">{currentTenant.tier} Plan</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[9px] block uppercase">Next Renewal Date</span>
                  <span className="font-bold text-zinc-400 mt-1 block font-mono">{currentTenant.nextBillingDate || "30 days from now"}</span>
                </div>
                <div>
                  <span className="text-zinc-500 font-mono text-[9px] block uppercase">Subscribed pricing rate</span>
                  <span className="font-bold text-emerald-400 mt-1 block font-mono">${currentTenant.price || (currentTenant.tier === "Institutional" ? 599 : currentTenant.tier === "Professional" ? 249 : 99)}/mo</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                {currentTenant.status !== "Expired" ? (
                  <button
                    onClick={handleCancelPlan}
                    disabled={submitting}
                    className="px-3.5 py-1.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-400 text-[10.5px] font-black uppercase tracking-wider rounded-lg border border-rose-500/10 hover:border-rose-500/30 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <MinusCircle className="h-4 w-4 stroke-[2]" />
                    Cancel Subscription
                  </button>
                ) : (
                  <button
                    onClick={handleReactivatePlan}
                    disabled={submitting}
                    className="px-3.5 py-1.5 bg-emerald-450 hover:bg-emerald-500 text-black text-[10.5px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5 font-sans"
                  >
                    <Check className="h-4 w-4 stroke-[3]" />
                    Reactivate Subscription
                  </button>
                )}

                {/* Confirm pricing dynamic shift button */}
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
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[10.5px] font-black uppercase tracking-wider rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950/25"
                  >
                    <ArrowUpRight className="h-4 w-4 stroke-[2.5]" />
                    Confirm Plan Action: {selectedPlanTier} (${selectedPlanTier === "Institutional" ? "599" : selectedPlanTier === "Professional" ? "249" : "99"}/mo)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TIER COMPARATOR CART */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
              <Sparkles className="h-4.5 w-4.5 text-emerald-500" />
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                  Choose Subscriber Plan Tier
                </h4>
                <p className="text-[10px] text-zinc-500 font-mono">
                  Compare features. Click a tier to load details into the simulated checkout card on the right.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-5 select-none">
              {/* Starter Option */}
              <div 
                onClick={() => {
                  setSelectedPlanTier("Starter");
                  setCheckoutCompleteSuccess(false);
                }}
                className={`rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between ${
                  selectedPlanTier === "Starter"
                    ? "border-emerald-500 bg-emerald-500/5 shadow-md shadow-emerald-950/10"
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
                  <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">Perfect for retail algorithm testing and small portfolios.</p>
                </div>
                <div>
                  <div className="mt-4 border-t border-zinc-900 pt-3 text-[10px] font-mono font-bold text-zinc-400">
                    • 3 Active Strategies<br />
                    • Max 0.5 Lot caps
                  </div>
                  <button
                    type="button"
                    className={`mt-4 w-full py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all text-center ${
                      currentTenant?.tier === "Starter"
                        ? "bg-zinc-900 border-zinc-850 text-zinc-500 cursor-default"
                        : selectedPlanTier === "Starter"
                          ? "bg-emerald-500 border-emerald-400 text-black shadow-lg"
                          : "bg-zinc-800/40 border-zinc-90 w-full text-zinc-400 hover:text-white"
                    }`}
                  >
                    {currentTenant?.tier === "Starter" ? "Active Plan" : selectedPlanTier === "Starter" ? "Selected" : "Select Plan"}
                  </button>
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
                    ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-950/15"
                    : "border-emerald-555/10 border-zinc-900 bg-zinc-950 hover:border-zinc-800"
                }`}
              >
                <span className="absolute -top-2 right-4 bg-emerald-500 text-black text-[7px] font-black py-0.5 px-2 rounded-full uppercase tracking-wider font-sans">
                  Best Value
                </span>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 font-sans">Professional</span>
                    {currentTenant?.tier === "Professional" && (
                      <span className="bg-emerald-500/15 text-emerald-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase">Your Plan</span>
                    )}
                  </div>
                  <div className="font-display text-xl font-black text-white leading-none">$249<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                  <p className="text-[10px] text-zinc-400 mt-2 leading-relaxed">Comprehensive suite for regular institutional operations.</p>
                </div>
                <div>
                  <div className="mt-4 border-t border-zinc-900 pt-3 text-[10px] font-mono font-bold text-zinc-200">
                    • 10 Active Strategies<br />
                    • Max 5.0 Lot caps<br />
                    • Intelligent AI Advisor ✅
                  </div>
                  <button
                    type="button"
                    className={`mt-4 w-full py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all text-center ${
                      currentTenant?.tier === "Professional"
                        ? "bg-zinc-900 border-zinc-850 text-zinc-500 cursor-default"
                        : selectedPlanTier === "Professional"
                          ? "bg-emerald-500 border-emerald-400 text-black shadow-lg"
                          : "bg-[#5B4CFF] border-[#5B4CFF] text-white hover:bg-[#4639d6]"
                    }`}
                  >
                    {currentTenant?.tier === "Professional" ? "Active Plan" : selectedPlanTier === "Professional" ? "Selected (Pay Below)" : "Upgrade to Pro"}
                  </button>
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
                      <span className="bg-purple-500/15 text-purple-400 text-[8px] font-black px-1.5 py-0.5 rounded uppercase font-sans">Your Plan</span>
                    )}
                  </div>
                  <div className="font-display text-xl font-black text-white leading-none">$599<span className="text-xs text-zinc-500 font-sans font-normal">/mo</span></div>
                  <p className="text-[10px] text-zinc-500 mt-2 leading-relaxed">High-frequency trading desk volume with unlimited structures.</p>
                </div>
                <div>
                  <div className="mt-4 border-t border-zinc-900 pt-3 text-[10px] font-mono font-bold text-zinc-400">
                    • 999 Active Strategies<br />
                    • Max 250 Lot caps<br />
                    • Advanced AI Engine
                  </div>
                  <button
                    type="button"
                    className={`mt-4 w-full py-2 px-3 text-[10px] font-black uppercase tracking-wider rounded-lg border transition-all text-center ${
                      currentTenant?.tier === "Institutional"
                        ? "bg-zinc-900 border-zinc-850 text-zinc-500 cursor-default"
                        : selectedPlanTier === "Institutional"
                          ? "bg-purple-500 border-purple-400 text-white shadow-lg"
                          : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/35"
                    }`}
                  >
                    {currentTenant?.tier === "Institutional" ? "Active Plan" : selectedPlanTier === "Institutional" ? "Selected (Pay Below)" : "Upgrade to Inst"}
                  </button>
                </div>
              </div>
            </div>
          </div>

            {/* COMPARE FEATURE HIGHLIGHTS */}
            <div className="p-4 bg-zinc-950 border border-zinc-900 rounded-xl text-xs text-zinc-400 space-y-2.5">
              <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900 pb-1.5 flex items-center gap-1 font-mono">
                <CheckSquare className="h-3 w-3 text-emerald-400" />
                Plan Limit Guardrails
              </div>
              <div className="grid grid-cols-2 gap-y-2 font-mono text-[11px]">
                <span className="text-zinc-500">Max Active Strategies Limit</span>
                <span className="text-zinc-300 text-right font-bold">
                  {selectedPlanTier === "Starter" ? "3 Strategies limit" : selectedPlanTier === "Professional" ? "10 Strategies limit" : "999 Strategies limit"}
                </span>
                
                <span className="text-zinc-500">Lot Allocation Cap</span>
                <span className="text-zinc-300 text-right font-bold">
                  {selectedPlanTier === "Starter" ? "0.5 Lots single order" : selectedPlanTier === "Professional" ? "5.0 Lots cap" : "250.0 Lots high-capacity"}
                </span>

                <span className="text-zinc-500">Simultaneous Market Orders</span>
                <span className="text-zinc-300 text-right font-bold">
                  {selectedPlanTier === "Starter" ? "3 concurrent positions" : selectedPlanTier === "Professional" ? "20 active positions" : "9999 terminal capacity"}
                </span>

                <span className="text-zinc-500">Generative AI Engine Access</span>
                <span className="text-zinc-300 text-right font-bold">
                  {selectedPlanTier === "Starter" ? "Locked (Upgrade Required) 🚫" : "Full Access Enabled ✅"}
                </span>

                <span className="text-zinc-500">Adaptive ML Core Engine</span>
                <span className="text-zinc-300 text-right font-bold">
                  {selectedPlanTier === "Starter" 
                    ? "Standard Metrics View Only 📊" 
                    : selectedPlanTier === "Professional" 
                      ? "Semi-Autonomous Mode ✅" 
                      : "Autonomous Guardrails & Auto-Apply ⚡"}
                </span>

                <span className="text-zinc-500">ML Rollback Safeguard Shield</span>
                <span className="text-zinc-300 text-right font-bold">
                  {selectedPlanTier === "Starter" 
                    ? "Not Supported ❌" 
                    : selectedPlanTier === "Professional" 
                      ? "Supported (1 Restore Step) ⚙️" 
                      : "Unlimited Step Restore Shield 🛡️"}
                </span>
              </div>
            </div>

          </div>

        {/* RIGHT COLUMN: COUPLING PAYMENT GATES */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 relative overflow-hidden">
            
            {/* Payment Processing Loader overlay */}
            {paymentProcessing && (
              <div className="absolute inset-0 bg-black/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin" />
                  <Lock className="h-4.5 w-4.5 text-emerald-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h5 className="text-sm font-black uppercase text-emerald-400 tracking-wider">Secure Payment Gateway Authorization</h5>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1 max-w-xs mx-auto leading-relaxed">
                    {paymentStepText}
                  </p>
                </div>
                <div className="w-full max-w-[200px] bg-zinc-900 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full transition-all duration-300"
                    style={{ width: `${(paymentStepIndex + 1) * 20}%` }}
                  />
                </div>
                <div className="text-[9px] font-mono text-zinc-650 text-zinc-600">
                  PCI-DSS compliant sandbox integration
                </div>
              </div>
            )}

            {/* Checkout order summaries */}
            <div className="border-b border-zinc-900 pb-3 mb-4">
              <span className="text-[9px] text-emerald-400 font-mono tracking-widest font-bold uppercase block">Secured checkout invoice</span>
              <div className="flex items-center justify-between mt-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                  Order Summary Ledger
                </h4>
                <span className="text-zinc-500 text-[10px] font-mono">Invoice #{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
            </div>

            <div className="space-y-3 mb-5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Workspace Account:</span>
                <span className="font-semibold text-zinc-100">{currentTenant?.name || "harry-desk"}</span>
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
                <span>Subscription Price:</span>
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

            {/* GATEWAY SELECTORS */}
            <div className="pt-2">
              <label className="text-[9px] font-mono text-zinc-500 block mb-2 uppercase tracking-wider">Select Pay Gateway Method</label>
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

              {/* UPI PANEL */}
              {paymentGatewayType === "UPI" && (
                <div className="space-y-4">
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-4">
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-500 block">PREFERRED UPI APP PAYEE</label>
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
                            className={`py-1.5 text-[10px] font-bold rounded border transition ${
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
                          className="bg-zinc-900 border border-zinc-800 rounded-r px-2 py-1.5 text-xs text-zinc-300 font-mono font-bold focus:outline-none"
                        >
                          <option value="@upi">@upi (Standard)</option>
                          <option value="@ybl">@ybl (Yes Bank)</option>
                          <option value="@paytm">@paytm (Paytm)</option>
                          <option value="@oksbi">@oksbi (SBI)</option>
                          <option value="@ okaxis">@okaxis (Axis)</option>
                          <option value="@okhdfcbank">@okhdfcbank (HDFC)</option>
                          <option value="@bhim">@bhim (bhim)</option>
                        </select>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                        Computed VPA: <span className="text-zinc-200">{upiVpa || "username"}{upiProvider}</span>
                      </p>
                    </div>

                    <div className="text-center p-3 border border-zinc-900 bg-zinc-950/40 rounded-xl space-y-2">
                      <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-505 text-zinc-500 block">Scan Instant QR Code</span>
                      
                      <div className="bg-white p-3 rounded-xl inline-block border border-zinc-350">
                        <svg width="112" height="112" viewBox="0 0 140 140" className="text-zinc-950 mx-auto">
                          <rect x="10" y="10" width="30" height="30" fill="currentColor" />
                          <rect x="15" y="15" width="20" height="20" fill="white" />
                          <rect x="20" y="20" width="10" height="10" fill="currentColor" />
                          
                          <rect x="100" y="10" width="30" height="30" fill="currentColor" />
                          <rect x="105" y="15" width="20" height="20" fill="white" />
                          <rect x="110" y="20" width="10" height="10" fill="currentColor" />
                          
                          <rect x="10" y="100" width="30" height="30" fill="currentColor" />
                          <rect x="15" y="105" width="20" height="20" fill="white" />
                          <rect x="20" y="110" width="10" height="10" fill="currentColor" />

                          <rect x="105" y="105" width="15" height="15" fill="currentColor" />
                          <rect x="110" y="110" width="5" height="5" fill="white" />

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
                      
                      <div className="text-[10px] text-zinc-500 font-sans mt-1">
                        Compatible with all BHIM UPI client nodes
                      </div>
                    </div>

                  </div>

                  <button
                    onClick={triggerSimulationSequence}
                    disabled={!upiVpa || currentTenant.tier === selectedPlanTier}
                    className={`w-full py-2.5 rounded-lg text-xs font-black uppercase text-black flex items-center justify-center gap-1.5 transition tracking-wider ${
                      upiVpa && currentTenant.tier !== selectedPlanTier
                        ? "bg-emerald-400 hover:bg-emerald-500 border border-emerald-500 cursor-pointer shadow-md shadow-emerald-500/10 active:scale-95" 
                        : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
                    Authorize UPI payment: ${selectedPlanTier === "Institutional" ? "599" : selectedPlanTier === "Professional" ? "249" : "99"}
                  </button>
                </div>
              )}

              {/* CARD DETAILS PANEL */}
              {paymentGatewayType === "CARD" && (
                <div className="space-y-4 font-sans text-xs">
                  
                  {/* Glowing Credit Card simulation element */}
                  <div className="rounded-xl p-4 bg-gradient-to-br from-indigo-950 via-zinc-950 to-emerald-950 border border-zinc-800 shadow-xl overflow-hidden leading-snug space-y-7 relative select-none">
                    <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/5 rounded-full blur-2xl" />
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[8px] font-mono tracking-widest text-zinc-500 uppercase block leading-none">PLATFORM SECURE CARD</span>
                        <span className="text-[10px] font-bold text-zinc-300 tracking-wide mt-1 block">Simulated sandbox gateway</span>
                      </div>
                      <div className="font-display font-black text-xs text-orange-400 italic">RuPay / VISA</div>
                    </div>

                    <div className="font-mono text-base font-medium tracking-widest text-zinc-100 select-all py-1">
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>

                    <div className="flex justify-between items-end font-mono">
                      <div>
                        <span className="text-[8px] text-zinc-500 block">CARDHOLDER NAME</span>
                        <span className="text-[10px] font-extrabold text-white truncate max-w-[150px] uppercase block">
                          {cardholderName || "HARRY JHONE"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[8px] text-zinc-500 block leading-none">EXPIRES</span>
                        <span className="text-[10px] font-bold text-white block mt-0.5">
                          {cardExpiry || "MM/YY"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Form inputs */}
                  <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-3.5">
                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1">CARD NUMBER</label>
                      <input 
                        type="text" 
                        maxLength={19}
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 block mb-1 font-bold">EXPIRY DATE (MM/YY)</label>
                        <input 
                          type="text" 
                          maxLength={5}
                          placeholder="06/28"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-mono text-zinc-500 block mb-1 font-bold">SECURITY CODE (CVV)</label>
                        <input 
                          type="password" 
                          maxLength={3}
                          placeholder="•••"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\s+/g, "").replace(/[^0-9]/gi, ""))}
                          className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500 font-mono" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-mono text-zinc-500 block mb-1 font-bold">CARDHOLDER NAME</label>
                      <input 
                        type="text" 
                        placeholder="E.G. HARRY JHONE"
                        value={cardholderName}
                        onChange={(e) => setCardholderName(e.target.value.toUpperCase())}
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-emerald-500 font-sans" 
                      />
                    </div>
                  </div>

                  <button
                    onClick={triggerSimulationSequence}
                    disabled={!cardNumber || !cardExpiry || !cardCvv || !cardholderName || currentTenant.tier === selectedPlanTier}
                    className={`w-full py-2.5 rounded-lg text-xs font-black uppercase text-black flex items-center justify-center gap-1.5 transition tracking-wider ${
                      cardNumber && cardExpiry && cardCvv && cardholderName && currentTenant.tier !== selectedPlanTier
                        ? "bg-emerald-400 hover:bg-emerald-500 border border-emerald-500 cursor-pointer shadow-md shadow-emerald-500/10 active:scale-95" 
                        : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
                    Authorize Credit Charge: ${selectedPlanTier === "Institutional" ? "599" : selectedPlanTier === "Professional" ? "249" : "99"}
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
