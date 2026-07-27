import React, { useState, useEffect } from "react";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Smartphone, 
  Lock, 
  Eye, 
  EyeOff, 
  CreditCard, 
  Check, 
  AlertCircle, 
  Sparkles, 
  QrCode, 
  ShieldAlert,
  Save,
  HelpCircle
} from "lucide-react";
import { FullAppState, TenantInfo } from "../types";

interface ProfileViewProps {
  state: FullAppState;
  onRefresh: () => void;
}

export default function ProfileView({ state, onRefresh }: ProfileViewProps) {
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

  // Form states matching 'Platform Core Subscriber Profile' requirements
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editPhone, setEditPhone] = useState("+1 555-019-2831");
  const [editCompany, setEditCompany] = useState("Harry Jhone Alpha Corp");

  const [showPasscode, setShowPasscode] = useState(false);

  // Verification gateway simulator state
  const [feeAmount] = useState(15.00); // subscriber authentication fee
  const [paymentGatewayType, setPaymentGatewayType] = useState<"UPI" | "CARD">("UPI");
  
  // Payment credentials
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  
  const [upiVpa, setUpiVpa] = useState("");
  const [upiProvider, setUpiProvider] = useState("@upi");
  const [upiAppSelector, setUpiAppSelector] = useState<"GPay" | "PhonePe" | "Paytm" | "BHIM">("GPay");

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentStepIndex, setPaymentStepIndex] = useState(0);
  const [paymentStepText, setPaymentStepText] = useState("");

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
    return passcode;
  };

  useEffect(() => {
    if (currentTenant) {
      setEditName(currentTenant.name || "");
      setEditEmail(currentTenant.email || "");
      setEditUsername(currentTenant.username || currentTenant.id.replace("tenant-", ""));
      setEditPassword(currentTenant.password || "@Hariom12");
    }
  }, [currentTenant?.id]);

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
      setSuccessMsg("Subscriber profile and legal identity updated securely on active ledger.");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const triggerVerificationSequence = () => {
    setPaymentProcessing(true);
    setPaymentStepIndex(0);
    setPaymentStepText("Connecting to secure identity payment acquirer...");

    const steps = [
      "Establishing PCI-DSS secure connection with authentication gateway...",
      paymentGatewayType === "UPI" 
        ? `Requesting digital approval token for UPI adress: ${upiVpa || "guest"}${upiProvider}...`
        : "Conducting real-time risk checks & verifying credit card tokenization code...",
      "Approved. Submitting secure credentials clearance seal to main registry...",
      "Active. Updating subscriber verification tag ('Verified Client Node') on-chain...",
      "Security Verification Complete! Workspace node status successfully authenticated."
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setPaymentStepIndex(currentStep);
        setPaymentStepText(steps[currentStep]);
      } else {
        clearInterval(interval);
        executeVerificationCompletion();
      }
    }, 1200);
  };

  const executeVerificationCompletion = async () => {
    if (!currentTenant) return;
    try {
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
        throw new Error(err.error || "Failed to finalize verified status.");
      }

      setSuccessMsg(`🎉 Authentication transaction complete! Workspace '${currentTenant.name}' is verified and fully re-activated.`);
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");
      setCardholderName("");
      setUpiVpa("");
      onRefresh();
    } catch (err: any) {
      setErrorMsg(`Clearance simulation succeeded but failed to save status: ${err.message}`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto text-left text-white font-sans animate-fadeIn">
      {/* Header Banner */}
      <div className="border-b border-zinc-900 pb-4 space-y-1">
        <h3 className="font-display text-xl font-black text-white flex items-center gap-2.5">
          <User className="h-5.5 w-5.5 text-indigo-400" />
          Subscriber Profile Registry
        </h3>
        <p className="text-xs text-zinc-400">
          Manage your personal subscriber parameters, modify secure terminal console credentials, and inspect security access parameters.
        </p>
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Platform Core Subscriber Profile Form */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-4">
            <div className="flex items-center gap-2.5 border-b border-zinc-900 pb-3">
              <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-indigo-400">
                <User className="h-4.5 w-4.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                  Platform Core Subscriber Profile
                </h4>
                <p className="text-[10px] text-zinc-500">
                  Authorized credentials for the core Quant AI Operations Workspace.
                </p>
              </div>
            </div>

            {currentTenant ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase tracking-wide">WORKSPACE UNIQUE ID</label>
                    <input 
                      type="text" 
                      value={currentTenant.id} 
                      disabled
                      className="bg-zinc-900/40 border border-zinc-900 rounded-lg px-3 py-2 text-xs text-zinc-500 font-mono w-full cursor-not-allowed uppercase" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase tracking-wide">PARENT CLIENT NAME</label>
                    <input 
                      type="text" 
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="e.g. Harry Doe Ltd"
                      required
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 w-full focus:outline-none focus:border-indigo-500 transition-colors" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase tracking-wide">CONTRACT METADATA EMAIL</label>
                    <input 
                      type="email" 
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      placeholder="e.g. billing@company.com"
                      required
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 w-full focus:outline-none focus:border-indigo-500 font-mono transition-colors" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1 uppercase tracking-wide">DESK CONTACT PHONE</label>
                    <input 
                      type="text" 
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="e.g. +1 555-019-2831"
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 w-full focus:outline-none focus:border-indigo-500 transition-colors" 
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-indigo-400 block mb-1 uppercase tracking-wide">WORKSPACE LOGIN USERNAME</label>
                    <input 
                      type="text" 
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. harry"
                      required
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-500 w-full focus:outline-none focus:border-indigo-500 font-mono transition-colors" 
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-mono text-indigo-400 block uppercase tracking-wide">WORKSPACE SECURITY PASSCODE</label>
                      <button
                        type="button"
                        onClick={() => setEditPassword(generateStrongPasscode())}
                        className="text-[9px] font-bold text-indigo-400 hover:underline cursor-pointer select-none"
                      >
                        Regen Code
                      </button>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPasscode ? "text" : "password"} 
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Security Passcode"
                        required
                        className="bg-zinc-900 border border-zinc-800 rounded-lg pl-3 pr-10 py-2 text-xs text-white placeholder-zinc-500 w-full focus:outline-none focus:border-indigo-500 font-mono transition-colors" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasscode(!showPasscode)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer"
                      >
                        {showPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-zinc-900">
                  <div className="text-[10px] text-zinc-500 font-mono flex items-center gap-1.5 select-none">
                    <Lock className="h-3.5 w-3.5 text-zinc-600" />
                    Secure PCI 256-bit Connection
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-lg transition shadow-md shadow-indigo-950/20 flex items-center gap-1.5 cursor-pointer active:scale-98"
                  >
                    <Save className="h-4 w-4" />
                    {submitting ? "Applying..." : "Save Identity Metadata"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-zinc-500 p-4 text-center">No subscriber workspace loaded.</p>
            )}
          </div>

          {/* Core Access Guardrails Information */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-5 space-y-3.5">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
              On-Chain Security Access Keys
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every subscriber workspace is sandboxed inside our decentralized virtualization layer. Changes made to your client profile name or parent organization are broadcast instantly to our secure MT5 Mirror Router gateways, locking down cross-account trading strategies automatically to block malicious spoof requests.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: Profile Verification Gateway */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 relative overflow-hidden">
            {/* Gateway loading overlay */}
            {paymentProcessing && (
              <div className="absolute inset-0 bg-neutral-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
                  <Lock className="h-4.5 w-4.5 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <div>
                  <h5 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Secure Profile clearance</h5>
                  <p className="text-[10px] text-zinc-500 font-mono mt-1 max-w-xs mx-auto leading-relaxed">
                    {paymentStepText}
                  </p>
                </div>
                <div className="w-full max-w-[200px] bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-400 h-full transition-all duration-300 ease-out"
                    style={{ width: `${(paymentStepIndex + 1) * 20}%` }}
                  />
                </div>
                <div className="text-[9px] font-mono text-zinc-600">
                  PCI-DSS Security Protocol Compliant
                </div>
              </div>
            )}

            {/* Gateway Header */}
            <div className="border-b border-zinc-900 pb-3 mb-4">
              <span className="text-[9px] text-indigo-400 font-mono tracking-widest font-bold uppercase block">Core license validation</span>
              <div className="flex items-center justify-between mt-1">
                <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200">
                  Identity Verification Gate
                </h4>
                <span className="text-zinc-500 text-[9px] font-mono">DEP-28312</span>
              </div>
            </div>

            {/* Invoice Breakdown */}
            <div className="space-y-3.5 mb-5 text-xs text-zinc-400">
              <div className="flex justify-between">
                <span>Account node:</span>
                <span className="font-semibold text-zinc-100">{currentTenant?.name || "harry-desk"}</span>
              </div>
              <div className="flex justify-between">
                <span>Verification standard:</span>
                <span className="font-semibold text-zinc-200">KYC Compliant Handshake</span>
              </div>
              <div className="flex justify-between">
                <span>Clearance deposit fee:</span>
                <span className="font-mono text-indigo-400 font-bold">${feeAmount.toFixed(2)} (One-Time)</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-snug">
                Conducting a low-value transaction verifies your payment credentials and locks your secure passcode to active routing protocols instantly.
              </p>
            </div>

            {/* Gateway Toggle tabs */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-900 mb-4">
              <button
                type="button"
                onClick={() => setPaymentGatewayType("UPI")}
                className={`py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentGatewayType === "UPI"
                    ? "bg-zinc-900 text-white border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                UPI Gateway
              </button>
              <button
                type="button"
                onClick={() => setPaymentGatewayType("CARD")}
                className={`py-2 rounded-lg text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentGatewayType === "CARD"
                    ? "bg-zinc-900 text-white border border-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                <CreditCard className="h-3.5 w-3.5 text-indigo-400" />
                Credit/Debit Card
              </button>
            </div>

            {/* Form rendering dependent on state */}
            {paymentGatewayType === "UPI" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 block">UPI PAYEE METHOD</label>
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
                              ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                              : "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                          }`}
                        >
                          {app}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">ENTER UPI WORKSPACE ID</label>
                    <div className="flex">
                      <input 
                        type="text" 
                        placeholder="e.g. user-name"
                        value={upiVpa}
                        onChange={(e) => setUpiVpa(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                        required
                        className="bg-zinc-900 border border-r-0 border-zinc-800 rounded-l-lg px-3 py-1.5 text-xs text-white placeholder-zinc-600 w-full focus:outline-none focus:border-indigo-500 font-mono transition-colors" 
                      />
                      <select
                        value={upiProvider}
                        onChange={(e) => setUpiProvider(e.target.value)}
                        className="bg-zinc-900 border border-zinc-800 rounded-r-lg px-2 py-1.5 text-xs text-zinc-300 font-mono font-bold focus:outline-none"
                      >
                        <option value="@upi">@upi (Standard)</option>
                        <option value="@ybl">@ybl (Yes Bank)</option>
                        <option value="@paytm">@paytm (Paytm)</option>
                        <option value="@okaxis">@okaxis (Axis)</option>
                        <option value="@okhdfcbank">@okhdfcbank (HDFC)</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1.5 font-mono">
                      Target: <span className="text-zinc-200">{upiVpa || "username"}{upiProvider}</span>
                    </p>
                  </div>

                  {/* QR code */}
                  <div className="text-center p-3 border border-zinc-900 bg-zinc-950/80 rounded-xl space-y-2 select-none">
                    <span className="text-[9px] uppercase tracking-wider font-mono text-zinc-500 block">Or Scan QR for Verification</span>
                    <div className="bg-white p-2.5 rounded-lg inline-block shadow border border-zinc-200">
                      <svg width="100" height="100" viewBox="0 0 140 140" className="text-zinc-950 mx-auto">
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
                        <rect x="10" y="50" width="15" height="10" fill="currentColor" />
                        <rect x="15" y="70" width="10" height="20" fill="currentColor" />
                        <rect x="50" y="80" width="30" height="10" fill="currentColor" />
                        <rect x="90" y="80" width="10" height="25" fill="currentColor" />
                        <rect x="110" y="90" width="20" height="10" fill="currentColor" />
                      </svg>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerVerificationSequence}
                  disabled={!upiVpa}
                  className={`w-full py-2.5 rounded-lg text-xs font-black uppercase text-white flex items-center justify-center gap-1.5 transition tracking-wider ${
                    upiVpa 
                      ? "bg-indigo-600 hover:bg-indigo-500 border border-indigo-600 cursor-pointer" 
                      : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
                  Pay ${feeAmount} via verification App
                </button>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-3.5">
                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">CARD NUMBER</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 4321 0000 1234 5678"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      required
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-indigo-500 font-mono transition-colors" 
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
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-indigo-500 font-mono transition-colors" 
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
                        className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-indigo-500 font-mono transition-colors" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-zinc-500 block mb-1">CARDHOLDER NAME</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Harry Jhone"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      required
                      className="bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-zinc-700 w-full focus:outline-none focus:border-indigo-500 transition-colors" 
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={triggerVerificationSequence}
                  disabled={!cardNumber || !cardExpiry || !cardCvv}
                  className={`w-full py-2.5 rounded-lg text-xs font-black uppercase text-white flex items-center justify-center gap-1.5 transition tracking-wider ${
                    cardNumber && cardExpiry && cardCvv 
                      ? "bg-indigo-600 hover:bg-indigo-500 border border-indigo-600 cursor-pointer" 
                      : "bg-zinc-900 border border-zinc-800 text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  <Lock className="h-3.5 w-3.5 stroke-[2.5]" />
                  Pay ${feeAmount} via Card Secure
                </button>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-4 space-y-2 flex gap-3 text-xs text-zinc-400 select-none">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold text-zinc-200 block text-xs">Direct API Authentication</span>
              <span className="text-[10.5px] text-zinc-500">Upon successful credential licensing charge, the system locks workspace routing tokens and re-activates active MT5 Bridge terminals instantly.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
