import React, { useState, useEffect } from "react";
import { 
  Lock, 
  Unlock, 
  Cpu, 
  Eye, 
  EyeOff, 
  ShieldAlert, 
  Key, 
  Users, 
  Sparkles, 
  Building, 
  User, 
  Mail, 
  ShieldCheck, 
  Zap, 
  Plus, 
  AlertCircle, 
  RefreshCw, 
  Sun, 
  Moon, 
  ArrowRight, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  ExternalLink,
  Shield,
  Activity,
  Award
} from "lucide-react";
import { TenantInfo } from "../types";

interface PasswordGateViewProps {
  onSuccess: (userId: string) => void;
}

export default function PasswordGateView({ onSuccess }: PasswordGateViewProps) {
  // Theme state synchronized with database profile configurations
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("quant_theme") as "light" | "dark") || "light";
  });

  const [workspaces, setWorkspaces] = useState<TenantInfo[]>([]);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState<boolean>(true);
  
  const [isAdminLogin, setIsAdminLogin] = useState<boolean>(() => {
    return window.location.pathname.startsWith("/quant-secure-admin-portal-99a") || window.location.search.includes("admin_secure=true");
  });
  
  // Selected Authorized Workspace behind the scenes
  const [selectedWorkspace, setSelectedWorkspace] = useState<TenantInfo | null>(null);
  
  // Active state inputs requested by the user
  const [typedEmail, setTypedEmail] = useState<string>("harry.jhone@gmail.com");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showSignupPasscode, setShowSignupPasscode] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState<boolean>(false);
  const [showPasscodeHint, setShowPasscodeHint] = useState<boolean>(false);

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

  const [pricingConfig, setPricingConfig] = useState<any>(null);
  const [couponCode, setCouponCode] = useState<string>("");
  const [validationResult, setValidationResult] = useState<any>(null);
  const [useTrial, setUseTrial] = useState<boolean>(false);

  // Sign up / Create custom subscriber workspace state
  const [showSignup, setShowSignup] = useState<boolean>(false);
  const [signupName, setSignupName] = useState<string>("Warren Buffett");
  const [signupEmail, setSignupEmail] = useState<string>("dynamic@berkshire.com");
  const [signupUsername, setSignupUsername] = useState<string>("warren");
  const [signupPassword, setSignupPassword] = useState<string>(generateStrongPasscode());
  const [signupTier, setSignupTier] = useState<"Starter" | "Professional" | "Institutional">("Professional");
  const [signupBalance, setSignupBalance] = useState<string>("50000");
  const [signupSubmitting, setSignupSubmitting] = useState<boolean>(false);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  // Static Fallbacks for offline resilience
  const STATIC_WORKSPACES: TenantInfo[] = [
    {
      id: "tenant-harry",
      name: "Harry Jhone",
      email: "harry.jhone@gmail.com",
      username: "harry",
      password: "@Hariom12",
      passcode: "@Hariom12",
      tier: "Professional",
      status: "Active",
      price: 249,
      nextBillingDate: "2026-06-25",
      limits: { maxStrategies: 10, maxLotSize: 5.0, maxConcurrentTrades: 20, aiSignalsAllowed: true }
    },
    {
      id: "tenant-starter",
      name: "Sarah Connor",
      email: "sarah.connor@sky.net",
      username: "sarah",
      password: "QP-8xF2#k8",
      passcode: "QP-8xF2#k8",
      tier: "Starter",
      status: "Expired",
      price: 99,
      nextBillingDate: "2026-05-15",
      limits: { maxStrategies: 3, maxLotSize: 0.5, maxConcurrentTrades: 3, aiSignalsAllowed: false }
    },
    {
      id: "tenant-institutional",
      name: "Vertex Capital Corp",
      email: "institutional@vertexcap.com",
      username: "vertex",
      password: "QP-5dN7!x2",
      passcode: "QP-5dN7!x2",
      tier: "Institutional",
      status: "Active",
      price: 599,
      nextBillingDate: "2026-06-18",
      limits: { maxStrategies: 999, maxLotSize: 250.0, maxConcurrentTrades: 9999, aiSignalsAllowed: true }
    },
    {
      id: "tenant-trial",
      name: "Demo Account",
      email: "demo@quantengine.com",
      username: "demo",
      password: "QP-trial-user",
      passcode: "QP-trial-user",
      tier: "Starter",
      status: "Expired",
      price: 99,
      nextBillingDate: "2026-05-15",
      limits: { maxStrategies: 3, maxLotSize: 0.5, maxConcurrentTrades: 3, aiSignalsAllowed: false }
    }
  ];

  // Load registered workspaces
  const fetchWorkspaces = async () => {
    setLoadingWorkspaces(true);
    try {
      const res = await fetch("/api/state", {
        headers: { "X-Tenant-ID": "tenant-harry" }
      });
      if (!res.ok) throw new Error("Could not load backend configurations");
      const data = await res.json();
      if (data && data.tenantsList && data.tenantsList.length > 0) {
        setWorkspaces(data.tenantsList);
        if (data.pricingConfig) {
          setPricingConfig(data.pricingConfig);
        }
        
        // Match initial typed email to workspace account list
        const initialMatch = data.tenantsList.find((t: TenantInfo) => t.email.toLowerCase() === typedEmail.trim().toLowerCase());
        if (initialMatch) {
          setSelectedWorkspace(initialMatch);
        } else {
          setSelectedWorkspace(data.tenantsList[0]);
        }
      } else {
        setWorkspaces(STATIC_WORKSPACES);
        setSelectedWorkspace(STATIC_WORKSPACES[0]);
      }
    } catch (err) {
      console.warn("Falling back to static workspace database: ", err);
      setWorkspaces(STATIC_WORKSPACES);
      setSelectedWorkspace(STATIC_WORKSPACES[0]);
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Autofill theme selection on element root wrapper
  useEffect(() => {
    document.documentElement.className = theme === "dark" ? "theme-dark" : "theme-light";
  }, [theme]);

  // Synchronize typedEmail to select correct backend workspace
  useEffect(() => {
    if (workspaces.length > 0) {
      const match = workspaces.find(
        w => w.email.toLowerCase().trim() === typedEmail.toLowerCase().trim() ||
             (w.username && w.username.toLowerCase().trim() === typedEmail.toLowerCase().trim()) ||
             w.id.toLowerCase().trim() === typedEmail.toLowerCase().trim() ||
             w.name.toLowerCase().trim() === typedEmail.toLowerCase().trim()
      );
      if (match) {
        setSelectedWorkspace(match);
      }
    }
  }, [typedEmail, workspaces]);

  const handleToggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("quant_theme", nextTheme);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAdminLogin) {
      if (!typedEmail || !password) {
        setErrorCode("AUTHENTICATION ERROR: Please enter your administrative username and secure security passcode.");
        return;
      }
      setAuthSubmitting(true);
      setErrorCode(null);
      
      const normalizedUser = typedEmail.trim().toLowerCase();
      if ((normalizedUser === "admin" || normalizedUser === "admin@quantengine.com") && password === "@Hariom12") {
        localStorage.setItem("quant_is_super_admin", "true");
        localStorage.setItem("gate_auth_token", "true");
        localStorage.setItem("quant_active_tenant_id", "tenant-harry"); 
        localStorage.setItem("quant_is_demo_account", "false");
        
        onSuccess("tenant-harry");
      } else {
        setErrorCode("AUTHENTICATION FAILED: Administrative secure passcode or identity keys do not match authorization database.");
        setAuthSubmitting(false);
      }
      return;
    }

    if (!selectedWorkspace) {
      setErrorCode("AUTHENTICATION ERROR: No registered workspace associated with this email or identity. Please select an active demo workspace or register a new sandbox.");
      return;
    }
    if (!password) {
      setErrorCode("AUTHENTICATION ERROR: Please enter your security signature key.");
      return;
    }

    setAuthSubmitting(true);
    setErrorCode(null);

    const isDemo = ["tenant-harry", "tenant-starter", "tenant-institutional", "tenant-trial"].includes(selectedWorkspace.id);

    try {
      const allowedPassword = selectedWorkspace.password || "@Hariom12";
      if (password !== allowedPassword) {
        setErrorCode("AUTHENTICATION FAILED: Signature key does not match authorization database. Please check your passcode and try again.");
        setAuthSubmitting(false);
        return;
      }

      // If logging into a quick-deploy demo account, perform device & network security validation
      if (isDemo) {
        let canvasVal = "nocanvas";
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (ctx) {
            canvas.width = 200;
            canvas.height = 50;
            ctx.textBaseline = "top";
            ctx.font = "14px 'Arial'";
            ctx.fillStyle = "#f60";
            ctx.fillRect(125, 1, 62, 20);
            ctx.fillStyle = "#069";
            ctx.fillText("QuantEngine, <canvas> 123!", 2, 15);
            ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
            ctx.fillText("QuantEngine, <canvas> 123!", 4, 17);
            const textStr = canvas.toDataURL();
            let hash = 0;
            for (let i = 0; i < textStr.length; i++) {
              hash = (hash << 5) - hash + textStr.charCodeAt(i);
              hash |= 0;
            }
            canvasVal = hash.toString();
          }
        } catch (err) {
          canvasVal = "canvas-err";
        }

        let deviceId = localStorage.getItem("quant_demo_device_id");
        if (!deviceId) {
          deviceId = "dev-" + Math.random().toString(36).substring(2, 15) + "-" + Date.now();
          localStorage.setItem("quant_demo_device_id", deviceId);
        }

        const secureRes = await fetch("/api/auth/demo-login-secure", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: selectedWorkspace.id,
            canvasHash: canvasVal,
            userAgent: navigator.userAgent,
            screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            cores: navigator.hardwareConcurrency || 0,
            memory: (navigator as any).deviceMemory || 0,
            deviceId: deviceId
          })
        });

        const secureData = await secureRes.json();
        if (!secureData.success) {
          setErrorCode(secureData.error);
          setAuthSubmitting(false);
          return;
        }

        localStorage.setItem("quant_is_demo_account", "true");
        localStorage.setItem("quant_demo_login_time", Date.now().toString());
        localStorage.setItem("quant_demo_fingerprint", JSON.stringify({
          canvasHash: canvasVal,
          userAgent: navigator.userAgent,
          screen: `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
          cores: navigator.hardwareConcurrency || 0,
          memory: (navigator as any).deviceMemory || 0,
          deviceId: deviceId
        }));
        if (secureData.remainingTimeMs !== undefined) {
          localStorage.setItem("quant_demo_remaining_time", secureData.remainingTimeMs.toString());
        } else {
          localStorage.setItem("quant_demo_remaining_time", "3600000");
        }
      } else {
        localStorage.setItem("quant_is_demo_account", "false");
        localStorage.removeItem("quant_demo_login_time");
        localStorage.removeItem("quant_demo_fingerprint");
        localStorage.removeItem("quant_demo_remaining_time");
      }

      localStorage.setItem("gate_auth_token", "true");
      localStorage.setItem("quant_active_tenant_id", selectedWorkspace.id);
      
      // Handle remember me preference
      if (rememberMe) {
        localStorage.setItem("remembered_email", typedEmail);
      } else {
        localStorage.removeItem("remembered_email");
      }
      
      onSuccess(selectedWorkspace.id);
    } catch (err) {
      setErrorCode("SECURITY VERIFICATION ERROR: Failed to hand shake with auth cluster. Please verify connection and retry.");
      setAuthSubmitting(false);
    }
  };

  const handleValidatePromo = async () => {
    if (!couponCode.trim()) return;
    setErrorCode(null);
    try {
      const res = await fetch("/api/admin/pricing/promo/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, tier: signupTier })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setValidationResult(data);
        if (data.isTrial) {
          setUseTrial(true);
        }
      } else {
        setValidationResult(null);
        setErrorCode(data.error || "Invalid coupon code.");
      }
    } catch (err) {
      setErrorCode("Could not contact promo validator.");
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim()) {
      setErrorCode("DATA VALIDATION ERROR: Please complete all custom profile fields.");
      return;
    }

    setSignupSubmitting(true);
    setErrorCode(null);
    setSignupSuccess(null);

    try {
      const customsId = `tenant-${signupName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Math.floor(Math.random() * 800 + 100)}`;
      const res = await fetch("/api/admin/tenants/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: customsId,
          name: signupName,
          email: signupEmail,
          username: signupUsername || signupName.toLowerCase().replace(/[^a-z0-9]/g, ""),
          password: signupPassword || "@Hariom12",
          tier: signupTier,
          status: "Active",
          balance: Number(signupBalance) || 50000,
          promoCode: couponCode,
          useTrial: useTrial
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Workspace creation failed.");
      }

      setSignupSuccess("Custom plan subscriber workspace initiated successfully!");
      // Autofill with either username or email for immediate login comfort:
      setTypedEmail(signupUsername || signupEmail); 
      
      // Reload from backend DB
      await fetchWorkspaces();
      
      setTimeout(() => {
        setSignupName("");
        setSignupEmail("");
        setSignupUsername("");
        setSignupPassword("");
        setShowSignup(false);
        setSignupSuccess(null);
      }, 1200);

    } catch (err: any) {
      setErrorCode(err.message || "E-commerce merchant simulation failed.");
    } finally {
      setSignupSubmitting(false);
    }
  };

  const handleSelectDemoWorkspace = (workspace: TenantInfo) => {
    setTypedEmail(workspace.username || workspace.email);
    setSelectedWorkspace(workspace);
    setPassword(workspace.password || "@Hariom12");
    setErrorCode(null);
  };

  return (
    <div className={`min-h-screen w-full flex flex-col md:flex-row transition-all duration-300 font-sans ${
      theme === "light" ? "bg-zinc-50 text-zinc-900" : "bg-black text-white"
    }`}>
      
      {/* LEFT COLUMN: Clean, spacious 50% split for User Authorization */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-6 sm:p-12 md:p-16 lg:p-24 relative overflow-y-auto bg-zinc-50 border-r border-zinc-200 text-zinc-900">
        
        {/* Top bar with quick brand and local theme switch */}
        <div className="flex items-center justify-between w-full mb-8 select-none">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shadow-sm">
              <Zap className="h-4.5 w-4.5" />
            </div>
            <div>
              <span className="font-display text-sm font-black uppercase tracking-widest text-zinc-900">
                Quant Engine
              </span>
              <span className="text-[9px] font-mono font-bold uppercase text-emerald-500 block leading-none tracking-wider">
                Horizon Node
              </span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleToggleTheme}
            id="theme-toggler-btn"
            className="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-100 transition-all cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center shadow-sm"
            title={theme === "light" ? "Toggle Dark Theme" : "Toggle Light Theme"}
          >
            {theme === "light" ? <Moon className="h-4 w-4 text-zinc-700" /> : <Sun className="h-4 w-4 text-amber-500" />}
          </button>
        </div>

        {/* Core dynamic forms module */}
        <div className="my-auto max-w-md w-full mx-auto space-y-8 py-6">
          
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-4xl font-display font-black tracking-tight leading-tight uppercase text-zinc-900">
              {isAdminLogin ? "Admin Control" : showSignup ? "Provision Workspace" : "Access Console"}
            </h2>
            {isAdminLogin ? (
              <p className="text-sm leading-relaxed text-zinc-655 text-zinc-500">
                Authorized Platform Administration node. Enter credentials to manage subscribers, adjust limit thresholds, and audit global network feeds.
              </p>
            ) : showSignup ? (
              <p className="text-sm leading-relaxed text-zinc-650 text-zinc-600">
                Configure sandbox subscription parameter allocations, define billing rates, and launch a test container.
              </p>
            ) : null}
          </div>

          {/* Render Active Form based on user intent */}
          {!showSignup ? (
            // ================= LOGIN FORM =================
            <form onSubmit={handleLoginSubmit} className="space-y-5 animate-fadeIn">
              
              {/* Username/Email Input Field */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center font-sans">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    {isAdminLogin ? "Administrative Username" : "Workspace Email or Username"}
                  </label>
                  {!isAdminLogin && selectedWorkspace && (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded border leading-none ${
                      selectedWorkspace.tier === "Institutional" 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-600" 
                        : selectedWorkspace.tier === "Professional"
                        ? "bg-blue-50 border-blue-200 text-blue-600"
                        : "bg-amber-50 border-amber-200 text-amber-600"
                    }`}>
                      {selectedWorkspace.tier} Tier ({selectedWorkspace.status})
                    </span>
                  )}
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={typedEmail}
                    onChange={(e) => {
                      setTypedEmail(e.target.value);
                      if (errorCode) setErrorCode(null);
                    }}
                    placeholder={isAdminLogin ? "e.g. admin" : "Enter email e.g. harry.jhone@gmail.com"}
                    autoFocus
                    required
                    disabled={authSubmitting}
                    className={`w-full font-sans text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition-all border bg-white text-zinc-900 shadow-sm ${
                      isAdminLogin 
                        ? "border-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20" 
                        : "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 border-zinc-200"
                    }`}
                  />
                </div>
              </div>

              {/* Password/Passcode Field */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 font-sans">
                    {isAdminLogin ? "Admin Security Signature Key" : "Security Passcode"}
                  </label>
                </div>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorCode) setErrorCode(null);
                    }}
                    placeholder={isAdminLogin ? "Enter administrative key passcode" : "Enter security passcode"}
                    required
                    disabled={authSubmitting}
                    className={`w-full font-mono text-xs rounded-xl pl-10 pr-4 py-3 outline-none transition-all border bg-white text-zinc-900 shadow-sm ${
                      isAdminLogin 
                        ? "border-amber-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20" 
                        : "focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 border-zinc-200"
                    }`}
                  />
                </div>
              </div>

              {isAdminLogin && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[10.5px] font-sans leading-relaxed animate-fadeIn">
                  ⚠️ <b>SECURE GATEWAY MONITORED:</b> You are attempting to access standard super-user permissions. Portals and credential authentications are strictly recorded.
                </div>
              )}

              {/* Login Options: Remember me */}
              <div className="flex items-center justify-between select-none py-1 text-xs">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer h-4 w-4 accent-emerald-500 bg-white"
                  />
                  <span className="text-zinc-600 group-hover:text-zinc-805 group-hover:text-zinc-800 transition-colors">
                    Remember me on this machine
                  </span>
                </label>
              </div>

              {/* Error messages block */}
              {errorCode && (
                <div className="p-3.5 border border-red-200 bg-red-50 text-red-700 rounded-xl flex items-start gap-2.5 text-xs font-sans animate-slideDown leading-relaxed">
                  <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{errorCode}</span>
                </div>
              )}

              {/* Submit Active Button */}
              <button
                type="submit"
                disabled={authSubmitting}
                className={`w-full py-3 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 ${
                  isAdminLogin 
                    ? "bg-amber-600 hover:bg-amber-500 active:bg-amber-700 hover:shadow-amber-500/10" 
                    : "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 hover:shadow-emerald-500/10"
                }`}
              >
                {authSubmitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>{isAdminLogin ? "Establishing Admin Handshake..." : "Spinning up Workspace Container..."}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="h-3.5 w-3.5" />
                    <span>{isAdminLogin ? "AUTHORIZE ADMIN PORTAL" : "LAUNCH TERMINAL WORKSPACE"}</span>
                  </>
                )}
              </button>

              {/* Interactive suggestive listing of available workspaces */}
              {!isAdminLogin && (
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Quick-Deploy Accounts
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {loadingWorkspaces ? (
                      <div className="col-span-full text-center py-4 font-mono text-[10px] text-zinc-500 flex items-center justify-center gap-1.5">
                        <RefreshCw className="h-3 w-3 animate-spin text-zinc-500" />
                        <span>Retrieving account slots...</span>
                      </div>
                    ) : (
                      workspaces.filter(w => w.name === "Demo Account").map((w) => {
                        const isSelected = selectedWorkspace?.id === w.id;
                        return (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => handleSelectDemoWorkspace(w)}
                            title={`Click to fill form for ${w.name}`}
                            className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${
                              isSelected
                                ? "bg-emerald-50/50 border-emerald-500/35 ring-1 ring-emerald-500/10"
                                : "bg-white border-zinc-200 hover:border-zinc-350 shadow-sm"
                            }`}
                          >
                            <div>
                              <span className="text-[10px] font-extrabold block truncate leading-tight text-zinc-800">
                                {w.name}
                              </span>
                              <span className="text-[8.5px] text-zinc-500 font-mono truncate block mt-0.5">
                                {w.email}
                              </span>
                            </div>
                            
                            <div className="mt-2 flex items-center justify-between">
                              <span className={`text-[7.5px] font-mono font-bold uppercase px-1 leading-none rounded ${
                                w.tier === "Institutional" 
                                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                                  : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                              }`}>
                                {w.tier}
                              </span>
                              
                              {w.status === "Expired" && (
                                <span className="text-[7px] text-rose-600 font-bold bg-rose-50 px-1 border border-rose-200 rounded animate-pulse">Expired</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

            </form>
          ) : (
            // ================= SIGNUP / REGISTER FORM =================
            <form onSubmit={handleSignupSubmit} className="space-y-4 pt-1 animate-slideUp">
              <div className="p-4 rounded-xl border text-xs leading-relaxed bg-blue-50/50 border-blue-150 text-blue-700">
                <span className="font-bold block text-blue-600 mb-1 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> High-Performance Sandbox Environment
                </span>
                Initialize an isolated custom subscriber database profile node with simulated pricing corridors, collateral accounts, and execution boundaries.
              </div>

              {/* Name field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Subscriber Account Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="E.g. Warren Buffett"
                    required
                    className="w-full text-xs rounded-lg pl-9 pr-3 py-2 px-3 focus:outline-none transition-colors border bg-white border-zinc-200 focus:border-emerald-500 text-zinc-900 shadow-sm"
                  />
                </div>
              </div>

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                  Secured Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="E.g. dynamic@berkshire.com"
                    required
                    className="w-full text-xs rounded-lg pl-9 pr-3 py-2 px-3 focus:outline-none transition-colors border bg-white border-zinc-200 focus:border-emerald-500 text-zinc-900 shadow-sm"
                  />
                </div>
              </div>

              {/* Login Username & Passcode field */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Login Username (For Console Login)
                  </label>
                  <input
                    type="text"
                    value={signupUsername}
                    onChange={(e) => setSignupUsername(e.target.value)}
                    placeholder="E.g. warren"
                    required
                    className="w-full text-xs rounded-lg px-3 py-2 focus:outline-none transition-colors border font-mono bg-white border-zinc-200 focus:border-emerald-500 text-zinc-900 shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Secure Connection Passcode
                    </label>
                    <button
                      type="button"
                      onClick={() => setSignupPassword(generateStrongPasscode())}
                      className="text-[9px] font-bold text-emerald-600 hover:underline hover:text-emerald-500 select-none cursor-pointer"
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showSignupPasscode ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Security passcode"
                      required
                      className="w-full text-xs rounded-lg pl-3 pr-10 py-2 focus:outline-none transition-colors border font-mono bg-white border-zinc-200 focus:border-emerald-500 text-zinc-900 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPasscode(!showSignupPasscode)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:scale-105 active:scale-95 transition-all cursor-pointer text-zinc-400 hover:text-zinc-650"
                    >
                      {showSignupPasscode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Tier and Allocations */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Plan Tier Access
                  </label>
                  <select
                    value={signupTier}
                    onChange={(e: any) => {
                      setSignupTier(e.target.value);
                      setValidationResult(null);
                    }}
                    className="w-full text-xs rounded-lg px-2.5 py-2 focus:outline-none transition-colors border cursor-pointer bg-white border-zinc-200 focus:border-emerald-500 text-zinc-800 shadow-sm"
                  >
                    <option value="Starter">Starter (${pricingConfig?.plans?.Starter?.price ?? 99}/mo)</option>
                    <option value="Professional">Professional (${pricingConfig?.plans?.Professional?.price ?? 249}/mo)</option>
                    <option value="Institutional">Institutional (${pricingConfig?.plans?.Institutional?.price ?? 599}/mo)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                    Simulated Margin ($)
                  </label>
                  <input
                    type="number"
                    value={signupBalance}
                    onChange={(e) => setSignupBalance(e.target.value)}
                    placeholder="50000"
                    required
                    className="w-full font-mono text-xs rounded-lg px-3 py-2 focus:outline-none transition-colors border bg-white border-zinc-200 focus:border-emerald-500 text-zinc-900 shadow-sm"
                  />
                </div>
              </div>

              {/* Promo Code & Free Trial Section */}
              <div className="space-y-3.5 border-t border-b border-zinc-200 py-3 mt-1 font-sans text-left">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      id="signupUseTrial"
                      checked={useTrial}
                      onChange={(e) => {
                        setUseTrial(e.target.checked);
                        if (!e.target.checked) setValidationResult(null);
                      }}
                      className="h-3.5 w-3.5 rounded bg-white border-zinc-300 text-emerald-600 focus:ring-0 cursor-pointer"
                    />
                    <label htmlFor="signupUseTrial" className="text-xs font-bold leading-none cursor-pointer select-none text-zinc-700">
                      Claim 7 Days Free Trial
                    </label>
                  </div>
                  <span className="text-[9.5px] font-mono uppercase bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded border border-emerald-100 font-bold">
                    Instant sandbox access
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider block text-zinc-500">
                    Promotional Discount Coupon
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. SUMMER50"
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setValidationResult(null);
                      }}
                      className="flex-grow font-mono text-xs rounded-lg px-3 py-1.5 focus:outline-none transition-colors border bg-white border-zinc-200 focus:border-emerald-550 text-zinc-900 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleValidatePromo}
                      className="bg-zinc-100 border border-zinc-250 border-zinc-200 hover:border-zinc-300 text-emerald-600 px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer shrink-0 shadow-sm active:scale-95"
                    >
                      Apply Code
                    </button>
                  </div>

                  {validationResult && (
                    <div className="text-[11px] bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded-lg font-mono space-y-1">
                      <div className="flex justify-between font-bold text-emerald-800">
                        <span>Code Applied:</span>
                        <span>{validationResult.code}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500 text-[10px]">
                        <span>Standard Rate:</span>
                        <span className="line-through">
                          ${signupTier === "Institutional" ? (pricingConfig?.plans?.Institutional?.price ?? 599) : signupTier === "Professional" ? (pricingConfig?.plans?.Professional?.price ?? 249) : (pricingConfig?.plans?.Starter?.price ?? 99)}/mo
                        </span>
                      </div>
                      <div className="flex justify-between font-extrabold text-emerald-700">
                        <span>Offer Price:</span>
                        <span className="text-emerald-600">
                          {validationResult.isTrial ? "FREE TRIAL ($0)" : `$${validationResult.finalPrice}/mo`}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500 text-center border-t border-zinc-200/60 pt-1.5 mt-1">
                        Benefits valid for standard billing period of {validationResult.durationText || "30 Days"}.
                      </div>
                    </div>
                  )}

                  {!validationResult && useTrial && (
                    <div className="text-[11px] bg-emerald-55/40 bg-emerald-50 border border-emerald-100 text-emerald-700 p-2 py-2.5 rounded-lg font-mono">
                      <div className="flex justify-between font-bold text-emerald-800">
                        <span>7 Days Free Trial option selected!</span>
                        <span>$0.00</span>
                      </div>
                      <span className="text-[9.5px] text-zinc-500 block mt-0.5">Your sandbox billing cycle starts for $0.00. Standard rates apply post-trial.</span>
                    </div>
                  )}
                </div>
              </div>

              {signupSuccess && (
                <div className="p-3.5 border border-emerald-200 bg-emerald-50 text-emerald-700 text-center text-xs font-bold rounded-lg animate-fadeIn text-emerald-500">
                  {signupSuccess}
                </div>
              )}

              {errorCode && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-semibold">
                  {errorCode}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowSignup(false);
                    setErrorCode(null);
                  }}
                  className="py-2 text-xs font-bold rounded-lg text-zinc-700 bg-zinc-100 hover:bg-zinc-150 transition cursor-pointer text-center border border-zinc-200 shadow-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={signupSubmitting}
                  className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition overflow-hidden text-center cursor-pointer shadow-sm shadow-emerald-600/10"
                >
                  {signupSubmitting ? "Provisioning..." : "Inject Plan"}
                </button>
              </div>
            </form>
          )}

          {/* Separation Toggle Link for Admin vs Subscriber Workspaces */}
          <div className="flex justify-center pt-2">
            {isAdminLogin ? (
              <button
                type="button"
                onClick={() => {
                  setIsAdminLogin(false);
                  setErrorCode(null);
                  setTypedEmail("harry.jhone@gmail.com");
                  setPassword("");
                  window.history.pushState(null, "", "/");
                }}
                className="text-[11px] font-semibold text-zinc-500 hover:text-emerald-600 hover:underline flex items-center gap-1.5 cursor-pointer bg-zinc-100 px-3 py-1.5 rounded-lg border border-zinc-200 transition-all active:scale-95"
              >
                <User className="h-3 w-3 text-zinc-400" />
                <span>Return to Standard Subscriber Login</span>
              </button>
            ) : null}
          </div>

        </div>

        {/* Footer info note */}
        <div className="pt-6 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] font-mono text-zinc-500 select-none">
          <span>Secure Bridge SSL Active</span>
          <span>© 2026 Quant Operations Node</span>
        </div>

      </div>
      {/* RIGHT COLUMN: Advanced AI-powered trading engine background with features text */}
      <div className={`hidden md:flex md:w-1/2 flex-col justify-center p-12 lg:p-16 relative overflow-hidden select-none border-l ${
        theme === "light" ? "border-zinc-200" : "border-zinc-900"
      }`}>
        <img
          src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80"
          alt="AI-Powered Algorithmic Trading Engine and Market Data Streams"
          className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none transition-transform duration-1000"
          referrerPolicy="no-referrer"
        />
        {/* Deepen the dark overlay so the white text is perfectly legible */}
        <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px] transition-colors duration-300 pointer-events-none" />
        
        {/* High-end decorative glowing accent lights for cinematic premium effect */}
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-[120px] pointer-events-none mix-blend-screen animate-pulse" />

        {/* Content Container */}
        <div className="relative z-10 max-w-xl w-full mx-auto space-y-8 text-white">
          <div className="space-y-3">
            <span className="text-[10px] font-mono tracking-[0.2em] font-bold text-emerald-400 uppercase flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              Institutional Standard Intelligence
            </span>
            <h1 className="text-3xl lg:text-4xl font-display font-extrabold tracking-tight text-white leading-tight">
              Predict the Market <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-sky-400">
                Before It Moves
              </span>
            </h1>
            <p className="text-xs lg:text-sm text-zinc-300/95 leading-relaxed font-sans max-w-lg">
              Gain access to next-generation AI models that continuously analyze Forex, Crypto, Stocks, Commodities, and Global Indices. Discover emerging opportunities, identify high-probability setups, and receive data-driven trading intelligence powered by advanced machine learning and predictive analytics.
            </p>
          </div>

          {/* Checklist divided into two columns */}
          <div className="pt-4 border-t border-zinc-800/60">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono mb-4">
              Premium Subscriber Features
            </h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
              {[
                "Actionable Signals Dashboard",
                "Structured Trade Execution Signals",
                "AI-Powered Strategy Builder Agent",
                "Multi-Timeframe Trend Confluence (MTF) Visualizer",
                "Precision Trading Journal & Slip Analyzer",
                "Interactive Position Risk & Drawdown Simulator",
                "Real-Time News Stream & Economic Calendars",
                "Proactive Alerts & Connection System Ledger",
                "Native MetaTrader 5 (MT5) Integration Bridge",
                "Dedicated Telegram Signals",
                "Backtest Reports & Performance Analyzer",
                "Excursion Analytics (MFE & MAE Audit)",
                "Dynamic Stop Loss & Take Profit",
                "Continuous Adaptive ML Engine"
              ].map((feature, idx) => (
                <div key={idx} className="flex items-start gap-2.5 group">
                  <div className="p-0.5 mt-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/30 transition-colors">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-zinc-200/90 font-medium group-hover:text-white transition-colors leading-tight">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
