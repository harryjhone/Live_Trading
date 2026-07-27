import React, { useState } from "react";
import { AlertTriangle, X, Check, RefreshCw } from "lucide-react";

interface ResetNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: any;
  wantedConfig: any;
  onApplyWantedConfig: (config: any) => Promise<void>;
  theme?: "light" | "dark";
}

export default function ResetNotificationModal({
  isOpen,
  onClose,
  currentConfig,
  wantedConfig,
  onApplyWantedConfig,
  theme = "dark"
}: ResetNotificationModalProps) {
  const [isApplying, setIsApplying] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setIsApplying(true);
    try {
      await onApplyWantedConfig(wantedConfig);
      onClose();
    } catch (err) {
      console.error("Error applying previous settings:", err);
    } finally {
      setIsApplying(false);
    }
  };

  // Safe checks for comparing and listing differences
  const diffs: { label: string; current: string; preferred: string }[] = [];

  if (wantedConfig && currentConfig) {
    if (Number(wantedConfig.balance) !== Number(currentConfig.balance)) {
      const isCurrentInfinite = Number(currentConfig.balance) >= 999999999999;
      const isPreferredInfinite = Number(wantedConfig.balance) >= 999999999999;
      diffs.push({
        label: "Trading Capital (USD)",
        current: isCurrentInfinite ? "Infinite (∞)" : `$${Number(currentConfig.balance).toLocaleString()}`,
        preferred: isPreferredInfinite ? "Infinite (∞)" : `$${Number(wantedConfig.balance).toLocaleString()}`
      });
    }
    if (wantedConfig.riskMode !== currentConfig.riskMode) {
      diffs.push({
        label: "Risk Sizing Mode",
        current: currentConfig.riskMode || "PERCENT",
        preferred: wantedConfig.riskMode || "PERCENT"
      });
    }
    if (Number(wantedConfig.riskPerTrade) !== Number(currentConfig.riskPerTrade)) {
      diffs.push({
        label: "Risk per Trade (%)",
        current: `${currentConfig.riskPerTrade || 1.0}%`,
        preferred: `${wantedConfig.riskPerTrade}%`
      });
    }
    if (Number(wantedConfig.lotSize) !== Number(currentConfig.lotSize)) {
      diffs.push({
        label: "Standard Lot Size",
        current: String(currentConfig.lotSize || 0.1),
        preferred: String(wantedConfig.lotSize)
      });
    }
    if (Number(wantedConfig.leverage) !== Number(currentConfig.leverage)) {
      diffs.push({
        label: "Account Leverage",
        current: `1:${currentConfig.leverage || 50}`,
        preferred: `1:${wantedConfig.leverage}`
      });
    }
  }

  // If there are no actual differences, don't show any list
  const modalBg = theme === "light" 
    ? "bg-white border-slate-200 shadow-2xl text-slate-800" 
    : "bg-zinc-950 border-zinc-800 p-6 shadow-2xl text-left";

  const closeButtonHover = theme === "light" 
    ? "text-slate-400 hover:bg-slate-100 hover:text-slate-800" 
    : "text-zinc-500 hover:bg-zinc-900 hover:text-zinc-200";

  const headerTitleColor = theme === "light" 
    ? "text-slate-900" 
    : "text-white";

  const headerSubtitleColor = theme === "light" 
    ? "text-slate-500" 
    : "text-zinc-400";

  const dividerBorder = theme === "light" 
    ? "border-slate-200" 
    : "border-zinc-900";

  const mainParagraphColor = theme === "light" 
    ? "text-slate-700" 
    : "text-zinc-300";

  const subParagraphColor = theme === "light" 
    ? "text-slate-500" 
    : "text-zinc-405";

  const cmpBoxBg = theme === "light" 
    ? "bg-slate-50/80 border-slate-200" 
    : "bg-zinc-900/40 border-zinc-900";

  const cmpBoxLabel = theme === "light" 
    ? "text-slate-500 border-slate-200" 
    : "text-zinc-400 border-zinc-800/60";

  const cmpBoxLabelLeft = theme === "light" 
    ? "text-slate-600" 
    : "text-zinc-500";

  const cancelBtnClass = theme === "light" 
    ? "px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-all cursor-pointer text-center" 
    : "px-4 py-2 text-xs font-bold text-zinc-400 bg-transparent border border-zinc-800 rounded-lg hover:bg-zinc-900 hover:text-white transition-all cursor-pointer text-center";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className={`relative w-full max-w-lg rounded-2xl border p-6 text-left ${modalBg}`}>
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 rounded-lg p-1.5 transition-colors cursor-pointer ${closeButtonHover}`}
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div className={`rounded-xl p-3 border ${
            theme === "light" 
              ? "bg-amber-50 border-amber-200" 
              : "bg-amber-500/10 border-amber-500/20"
          }`}>
            <AlertTriangle className="h-7 w-7 text-amber-500 animate-pulse animate-duration-1000" />
          </div>
          <div>
            <h3 className={`font-sans text-lg font-black leading-tight ${headerTitleColor}`}>
              Configuration Reverted to Defaults
            </h3>
            <p className={`text-xs mt-1 ${headerSubtitleColor}`}>
              Your "Equity & Sizing Architecture" settings have automatically reset.
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className={`space-y-3 text-xs leading-relaxed border-t border-b py-4 my-4 ${dividerBorder} ${mainParagraphColor}`}>
          <p>
            This can happen when the cloud container restarts during periodic maintenance or if Firestore database quota limits are exceeded on this session.
          </p>
          <p className={`${subParagraphColor}`}>
            Our detection module identified that the server's parameters were restored to baseline values, which differ from your previously preferred workspace parameters.
          </p>

          {/* Differences comparison table */}
          {diffs.length > 0 && (
            <div className={`mt-4 rounded-lg p-3 space-y-2.5 border ${cmpBoxBg}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider block border-b pb-1 ${cmpBoxLabel}`}>
                Detected Reset Mismatches
              </span>
              <div className="space-y-1.5 font-mono text-xs">
                {diffs.map((diff, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[11px]">
                    <span className={cmpBoxLabelLeft}>{diff.label}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-rose-500/80 line-through decoration-rose-500/55 decoration-2">{diff.current}</span>
                      <span className="text-zinc-500">➔</span>
                      <span className={`font-bold block px-1.5 py-0.5 rounded border ${
                        theme === "light" 
                          ? "text-emerald-600 bg-emerald-50 border-emerald-200" 
                          : "text-emerald-400 bg-emerald-500/5 border-emerald-500/10"
                      }`}>{diff.preferred}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className={cancelBtnClass}
          >
            I will re-apply manually
          </button>

          <button
            type="button"
            onClick={handleApply}
            disabled={isApplying}
            className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-950/10 select-none border border-emerald-500/20"
          >
            {isApplying ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Applying Setup...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Restore My Setup
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
