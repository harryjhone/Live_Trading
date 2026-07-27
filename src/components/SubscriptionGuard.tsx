import React, { useState } from "react";
import { ShieldAlert, Mail, ArrowRight, CreditCard, Lock, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

interface SubscriptionGuardProps {
  onGoToBilling?: () => void;
}

export default function SubscriptionGuard({ onGoToBilling }: SubscriptionGuardProps) {
  const [showRequestAccess, setShowRequestAccess] = useState(false);

  return (
    <div className="w-full h-full min-h-[450px] flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
      <div className="w-full max-w-xl bg-zinc-950/40 border border-zinc-900 rounded-2xl p-6 sm:p-10 text-center space-y-6 relative overflow-hidden shadow-2xl backdrop-blur-sm">
        
        {/* Sleek Ambient Security Circle Banner */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-emerald-500/5 dark:bg-rose-500/5 rounded-full blur-2xl pointer-events-none" />
        
        {/* Lock Shield Icon Indicator */}
        <div className="mx-auto h-16 w-16 bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center rounded-2xl shadow-inner relative group animate-pulse">
          <Lock className="h-7 w-7 text-rose-400 group-hover:scale-105 transition-transform" />
          <div className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-rose-500 rounded-full border-2 border-black animate-ping" />
        </div>

        {/* Heading Mandate */}
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-display font-black uppercase tracking-tight text-white">
            An active subscription is required to access this feature.
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
            Live-trading algorithms, direct VPS linkages, MT5 credential profiles, proprietary indicator metrics, and real-time ledger histories are encrypted and reserved for active subscribers.
          </p>
        </div>

        {/* Interactive Control Block */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
          {onGoToBilling && (
            <button
              onClick={onGoToBilling}
              className="w-full sm:w-auto px-5 py-2.5 bg-rose-650 hover:bg-rose-600 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-emerald-500/10 hover:scale-[1.02] active:scale-[0.98]"
            >
              <CreditCard className="h-4 w-4" />
              <span>UPGRADE / ACTIVATE SUBSCRIPTION</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => setShowRequestAccess(!showRequestAccess)}
            className="w-full sm:w-auto px-5 py-2.5 bg-zinc-900 hover:bg-zinc-805 hover:bg-zinc-800 text-zinc-200 hover:text-white border border-zinc-800 hover:border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Request Account Access</span>
            {showRequestAccess ? <ChevronUp className="h-3.5 w-3.5 text-zinc-500" /> : <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />}
          </button>
        </div>

        {/* Request Access Box */}
        {showRequestAccess && (
          <div className="p-4 rounded-xl border border-dashed border-zinc-800 bg-zinc-950/80 text-left space-y-2.5 animate-slideDown">
            <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-amber-400" />
              Temporary Authorization Portal
            </span>
            <div className="text-xs text-zinc-300 font-medium space-y-2 leading-relaxed">
              <p className="font-bold text-white">Need access? Contact us at:</p>
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 font-mono text-zinc-100 flex items-center justify-between">
                <span className="text-emerald-400 font-bold">access@yourdomain.com</span>
                <span className="text-[8px] text-zinc-500 uppercase tracking-wider">Review Copy</span>
              </div>
              <p className="text-zinc-400 text-[11px]">
                Our team will review and provide temporary or full access if approved.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
