import React, { useState } from "react";
import { FullAppState, TradingStrategy } from "../types";
import { 
  Settings, 
  Play, 
  Pause, 
  Zap, 
  Cpu, 
  HelpCircle, 
  Loader, 
  ShieldAlert, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Layers,
  Trash2,
  Lock,
  RotateCcw,
  AlertTriangle,
  Archive,
  KeyRound,
  ShieldCheck,
  CheckCircle,
  X,
  History,
  Sparkles,
  Check,
  CornerDownRight,
  Undo,
  ArrowRight
} from "lucide-react";

interface StrategiesViewProps {
  state: FullAppState;
  isSuperAdmin?: boolean;
  onOptimizeStrategy: (strategyId: string) => Promise<any>;
  onToggleStrategy: (strategyData: {
    id: string;
    enabled?: boolean;
    autoTrade?: boolean;
    parameters?: Record<string, number | string>;
  }) => Promise<void>;
  onDeleteStrategy?: (strategyId: string) => Promise<void>;
  onRestoreStrategy?: (strategyId: string) => Promise<void>;
  onDeletePermanentStrategy?: (strategyId: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  onRefreshState?: () => Promise<void>;
}

export default function StrategiesView({ 
  state, 
  isSuperAdmin,
  onToggleStrategy, 
  onOptimizeStrategy,
  onDeleteStrategy,
  onRestoreStrategy,
  onDeletePermanentStrategy,
  onRefreshState
}: StrategiesViewProps) {
  const [activeTab, setActiveTab] = useState<"active" | "trash">("active");
  const [confirmPermanentId, setConfirmPermanentId] = useState<string | null>(null);
  const [passcode, setPasscode] = useState("");
  const [deletingPermanently, setDeletingPermanently] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedParams, setEditedParams] = useState<Record<string, number | string>>({});
  
  // Format holds: { text: string; keyStatus: string; recommendations: any[] }
  const [aiOutputs, setAiOutputs] = useState<Record<string, { text: string; keyStatus: string; recommendations: any[] }>>({});
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  // Checks mapping: checkedRecs[stratId][recId] = boolean
  const [checkedRecs, setCheckedRecs] = useState<Record<string, Record<string, boolean>>>({});
  
  // Handlers and workflow UI indicators
  const [applyingOptimizationId, setApplyingOptimizationId] = useState<string | null>(null);
  const [rollbackLoadingId, setRollbackLoadingId] = useState<string | null>(null);
  const [confirmOverwriteId, setConfirmOverwriteId] = useState<string | null>(null);
  const [showVersionHistoryId, setShowVersionHistoryId] = useState<string | null>(null);
  const [expandedSpecs, setExpandedSpecs] = useState<Record<string, boolean>>({
    TIME_RANGE: true,
    EMA_CROSS: true
  });
  const [softDeleteConfirmId, setSoftDeleteConfirmId] = useState<string | null>(null);

  const toggleSpec = (id: string) => {
    setExpandedSpecs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const startEditing = (strat: TradingStrategy) => {
    setEditingId(strat.id);
    const params: Record<string, number | string> = {};
    strat.parameters.forEach((p) => {
      params[p.key] = p.value;
    });
    setEditedParams(params);
  };

  const handleParamChange = (key: string, value: string | number) => {
    let val = value;
    if (key === "tp3Ratio" && typeof value === "number") {
      val = Math.min(4.0, value);
    }
    setEditedParams((prev) => ({
      ...prev,
      [key]: val
    }));
  };

  const saveParams = async (stratId: string) => {
    await onToggleStrategy({
      id: stratId,
      parameters: editedParams
    });
    setEditingId(null);
  };

  const handleOptimizeClick = async (stratId: string) => {
    setOptimizingId(stratId);
    try {
      const result = await onOptimizeStrategy(stratId);
      setAiOutputs((prev) => ({
        ...prev,
        [stratId]: {
          text: result.text || "",
          keyStatus: result.keyStatus || "missing",
          recommendations: result.recommendations || []
        }
      }));
      if (result.recommendations && result.recommendations.length > 0) {
        const defaultChecks: Record<string, boolean> = {};
        result.recommendations.forEach((r: any) => {
          defaultChecks[r.id] = true;
        });
        setCheckedRecs(prev => ({
          ...prev,
          [stratId]: defaultChecks
        }));
      }
    } catch (err) {
      setAiOutputs((prev) => ({
        ...prev,
        [stratId]: {
          text: "Error loading AI analysis: " + err,
          keyStatus: "missing",
          recommendations: []
        }
      }));
    } finally {
      setOptimizingId(null);
    }
  };

  const handleApplyOptimization = async (stratId: string, createNew: boolean) => {
    setApplyingOptimizationId(stratId);
    const aiOutput = aiOutputs[stratId];
    if (!aiOutput || !aiOutput.recommendations) {
      alert("No recommendations found to apply.");
      setApplyingOptimizationId(null);
      return;
    }

    const checks = checkedRecs[stratId] || {};
    const updates: Record<string, any> = {};
    let selectedCount = 0;

    aiOutput.recommendations.forEach((r: any) => {
      if (checks[r.id]) {
        updates[r.key] = r.newValue;
        selectedCount++;
      }
    });

    if (selectedCount === 0) {
      alert("Please check at least one recommendation to apply.");
      setApplyingOptimizationId(null);
      return;
    }

    const tenantId = localStorage.getItem("quant_active_tenant_id") || "tenant-harry";
    try {
      const description = createNew 
        ? `Model calibration cloned via AI optimizer: Applied ${selectedCount} calibrations.`
        : `AI Optimization: Config parameters adjusted for ${selectedCount} active trigger nodes.`;

      const res = await fetch("/api/strategy/apply-optimization", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId
        },
        body: JSON.stringify({
          strategyId: stratId,
          updates,
          createNew,
          description
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to commit optimization.");
      } else {
        setConfirmOverwriteId(null);
        if (!createNew) {
          // Overwrite removes the optimization panel
          setAiOutputs(prev => {
            const next = { ...prev };
            delete next[stratId];
            return next;
          });
        }
        if (onRefreshState) {
          await onRefreshState();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Network error: Failed to communicate with optimization endpoint.");
    } finally {
      setApplyingOptimizationId(null);
    }
  };

  const handleRollback = async (stratId: string, targetVer: number) => {
    setRollbackLoadingId(stratId);
    const tenantId = localStorage.getItem("quant_active_tenant_id") || "tenant-harry";
    try {
      const res = await fetch("/api/strategy/rollback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId
        },
        body: JSON.stringify({
          strategyId: stratId,
          targetVersion: targetVer
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        alert(errData.error || "Failed to trigger parameter rollback.");
      } else {
        if (onRefreshState) {
          await onRefreshState();
        }
      }
    } catch (err) {
      console.error(err);
      alert("Network error during rollback query processing.");
    } finally {
      setRollbackLoadingId(null);
    }
  };

  const activeStrategies = (state.strategies || []).filter((s) => !s.deleted);
  const trashStrategies = (state.strategies || []).filter((s) => s.deleted);
  const currentStrategies = activeTab === "active" ? activeStrategies : trashStrategies;

  return (
    <div className="space-y-6">
      {/* Title section */}
      <div className="border-b border-zinc-900 pb-4">
        <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
          <Cpu className="h-5 w-5 text-emerald-500" />
          Quant Strategies Room
        </h3>
        <p className="text-xs text-zinc-400 mt-1 font-sans">
          Review core mathematical formulas, calibrate custom triggers, expand strategy specifications, and consult intelligence models for optimized confluences.
        </p>
      </div>

      {/* Tab Selectors */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-zinc-900 pb-2 gap-3">
        <div className="flex gap-4">
          <button
            onClick={() => {
              setActiveTab("active");
              setSoftDeleteConfirmId(null);
            }}
            className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === "active"
                ? "border-emerald-500 text-white animate-fade-in"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            Active Strategies ({activeStrategies.length})
          </button>
          <button
            onClick={() => {
              setActiveTab("trash");
              setSoftDeleteConfirmId(null);
            }}
            className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "trash"
                ? "border-rose-500 text-white animate-fade-in"
                : "border-transparent text-zinc-500 hover:text-white"
            }`}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Recycle Bin ({trashStrategies.length})
          </button>
        </div>
        <div className="text-[10px] text-zinc-500 font-mono">
          {activeTab === "trash" ? (
            <span className="text-amber-500/80">30-day auto-purge policy active</span>
          ) : (
            <span>Halt automation instantly upon strategy deletion</span>
          )}
        </div>
      </div>

      {/* Recycle Bin Empty State */}
      {activeTab === "trash" && trashStrategies.length === 0 && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-12 text-center space-y-4 animate-in fade-in duration-300">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900/60 flex items-center justify-center text-zinc-600 border border-zinc-850">
            <Archive className="h-5 w-5 text-zinc-500" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-zinc-200 font-bold text-sm">Recycle Bin is Empty</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              All soft-deleted strategies will show up here. You can easily restore them at any time during the retention period to recover your configured indicator parameters and rule mappings.
            </p>
          </div>
        </div>
      )}

      {/* Active Room Empty State */}
      {activeTab === "active" && activeStrategies.length === 0 && (
        <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-12 text-center space-y-4 animate-in fade-in duration-300">
          <div className="mx-auto w-12 h-12 rounded-full bg-zinc-900/60 flex items-center justify-center text-zinc-650 border border-zinc-850">
            <Cpu className="h-5 w-5 text-zinc-400" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h4 className="text-zinc-300 font-bold text-sm">No Active Strategies</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-sans">
              Go to the <strong>AI Strategy Builder Assistant</strong> tab to design, test, and register customized mathematical trading models.
            </p>
          </div>
        </div>
      )}

      {/* Grid listing */}
      {currentStrategies.length > 0 && (
        <div className="grid grid-cols-1 gap-6">
          {currentStrategies.map((strat) => {
            const isEditing = editingId === strat.id;
            const aiResponse = aiOutputs[strat.id];
            const isOptimizing = optimizingId === strat.id;
            const isExpanded = expandedSpecs[strat.id];

            return (
              <div
                key={strat.id}
                className={`rounded-xl border p-5 space-y-4 bg-zinc-950/60 transition-all ${
                  strat.enabled && !strat.deleted
                    ? "border-zinc-850 shadow-sm shadow-emerald-950/10" 
                    : strat.deleted 
                    ? "border-rose-950/30 opacity-75"
                    : "border-zinc-900 opacity-60"
                }`}
              >
                {/* Header block controls */}
                <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between border-b border-zinc-900 pb-3.5 gap-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-lg ${
                      strat.deleted
                        ? "bg-rose-500/5 text-rose-450 border border-rose-500/10"
                        : strat.enabled 
                        ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/10" 
                        : "bg-zinc-900 text-zinc-500 border border-zinc-850/60"
                    }`}>
                      <Zap className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-display text-sm font-black text-white">{strat.name}</h4>
                        {strat.deleted && (
                          <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                            In Recycle Bin
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-550 font-mono uppercase tracking-wide">ID: {strat.id}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {activeTab === "active" ? (
                      <>
                        {/* Expand Specs Toggle */}
                        <button
                          onClick={() => toggleSpec(strat.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-white transition cursor-pointer"
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          {isExpanded ? "Hide Spec" : "Show Spec"}
                        </button>

                        {/* Active Toggle */}
                        <button
                          onClick={() => onToggleStrategy({ id: strat.id, enabled: !strat.enabled })}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border cursor-pointer ${
                            strat.enabled
                              ? "bg-rose-500/10 border-rose-500/30 text-rose-450"
                              : "bg-emerald-600 hover:bg-emerald-500 text-white border-transparent"
                          }`}
                        >
                          {strat.enabled ? <Pause className="h-3.5 w-3.5 text-rose-400" /> : <Play className="h-3.5 w-3.5" />}
                          {strat.enabled ? "HALT STRATEGY" : "ACTIVATE"}
                        </button>

                        {/* Auto Trading */}
                        <button
                          onClick={() => onToggleStrategy({ id: strat.id, autoTrade: !strat.autoTrade })}
                          disabled={!strat.enabled}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                            strat.autoTrade && strat.enabled
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-900 border-zinc-855 text-zinc-500 disabled:opacity-30 cursor-pointer"
                          }`}
                        >
                          Auto-Trading: {strat.autoTrade && strat.enabled ? "LIVE WORK" : "OFFLIST"}
                        </button>

                        {/* Soft Delete */}
                        {onDeleteStrategy && (
                          <button
                            onClick={async () => {
                              try {
                                await onDeleteStrategy(strat.id);
                              } catch (err) {
                                console.error("Soft-delete failed:", err);
                              }
                            }}
                            className="flex items-center justify-center p-2 rounded-lg bg-rose-500/5 hover:bg-rose-500/10 text-rose-400/80 hover:text-rose-400 border border-rose-950/30 hover:border-rose-900/60 transition cursor-pointer"
                            title="Soft-Delete (Move to Recycle Bin)"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {/* Soft-Deleted Header Stats */}
                        <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900 border border-zinc-850 px-2 py-1 rounded">
                          Deleted: {strat.deletedAt ? new Date(strat.deletedAt).toLocaleDateString() : "Just Now"}
                        </span>

                        {/* Restore Strategy */}
                        {onRestoreStrategy && (
                          <button
                            onClick={async () => {
                              await onRestoreStrategy(strat.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/25 hover:bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold transition cursor-pointer"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            RESTORE STRATEGY
                          </button>
                        )}

                        {/* Permanently Delete */}
                        {onDeletePermanentStrategy && (
                          <button
                            onClick={() => {
                              setConfirmPermanentId(strat.id);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-600 hover:text-white text-rose-400 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-35"
                            title="Permanently purge strategy from registry"
                          >
                            <AlertTriangle className="h-3.5 w-3.5" />
                            PURGE PERMANENTLY
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
                {/* Description & Specs Details */}
                <div className="space-y-3 font-sans text-xs">
                  <p className="text-zinc-400 leading-relaxed font-sans">{strat.description}</p>

                  {/* Specification Sheet when Expanded */}
                  {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-zinc-950 rounded-lg border border-zinc-900/60 text-[11px] leading-relaxed text-zinc-350">
                      <div className="space-y-1">
                        <span className="text-zinc-500 block uppercase font-bold tracking-wider text-[9.5px]">Technical Pattern Matcher</span>
                        <p className="font-mono text-zinc-300">{strat.pattern || "N/A"}</p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-zinc-500 block uppercase font-bold tracking-wider text-[9.5px]">Trigger Confluences</span>
                        <p className="font-mono text-zinc-300">{strat.confluences || "N/A"}</p>
                      </div>

                      <div className="space-y-1 mt-2 border-t border-zinc-900/40 pt-2 leading-normal">
                        <span className="text-zinc-500 block uppercase font-bold tracking-wider text-[9.5px]">Position Entry Protocol</span>
                        <p>{strat.entryRules || "N/A"}</p>
                      </div>

                      <div className="space-y-1 mt-2 border-t border-zinc-900/40 pt-2 leading-normal">
                        <span className="text-zinc-500 block uppercase font-bold tracking-wider text-[9.5px]">Take Profit & Stop Loss Limits</span>
                        <p>{strat.slTpRules || "N/A"}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Calibration vs Optimization Panels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                  
                  {/* Calibration panel */}
                  <div className="space-y-3.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Settings className="h-3.5 w-3.5 text-zinc-500" />
                      Calibrate Indicators Parameters
                    </span>

                    {isEditing ? (
                      <div className="space-y-3 p-4 bg-zinc-900/30 rounded-lg border border-zinc-900">
                         {strat.parameters.map((p) => (
                          <div key={p.key} className="flex flex-col gap-1 text-[11px]">
                            <span className="text-zinc-400 uppercase tracking-wider text-[9px] font-bold">
                              {p.label} {p.key === "tp3Ratio" && <span className="text-emerald-400 font-extrabold normal-case text-[10px] ml-1">(Strict Max 4.0 / 1:4 Ratio)</span>}
                            </span>
                            <input
                              type={p.type === "number" ? "number" : "text"}
                              value={editedParams[p.key] ?? ""}
                              max={p.key === "tp3Ratio" ? 4.0 : undefined}
                              step={p.type === "number" ? "0.1" : undefined}
                              onChange={(e) => handleParamChange(p.key, p.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)}
                              className="bg-zinc-950 border border-zinc-800 text-white rounded px-2.5 py-1.5 font-mono text-xs focus:outline-hidden hover:border-zinc-700"
                            />
                          </div>
                        ))}

                        <div className="flex gap-2 pt-1 font-sans text-xs">
                          <button
                            onClick={() => saveParams(strat.id)}
                            className="flex-1 py-1 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded cursor-pointer"
                          >
                            Commit Values
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="py-1 px-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 font-mono text-[11px]">
                        <div className="bg-zinc-900/20 p-3.5 rounded-lg border border-zinc-900 space-y-2">
                          {strat.parameters.map((p) => (
                            <div key={p.key} className="flex items-center justify-between">
                              <span className="text-zinc-500 font-sans">{p.label}</span>
                              <span className="px-2 py-0.5 rounded border border-zinc-850 bg-zinc-900 text-zinc-200 font-bold">
                                {p.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          onClick={() => startEditing(strat)}
                          disabled={!strat.enabled || strat.deleted}
                          className="py-1.5 px-3 rounded-lg border border-zinc-850 bg-zinc-950 font-sans text-[11px] font-semibold text-zinc-400 hover:border-zinc-700 hover:text-white transition disabled:opacity-40 cursor-pointer"
                        >
                          Modify Configuration Values
                        </button>
                      </div>
                    )}

                    {/* Version Audit Ledger & Rollback Section */}
                    {strat.versionHistory && strat.versionHistory.length > 0 ? (
                      <div className="mt-3.5 border-t border-zinc-900/50 pt-3.5 space-y-2">
                        <button
                          onClick={() => setShowVersionHistoryId(showVersionHistoryId === strat.id ? null : strat.id)}
                          className="flex items-center gap-1.5 text-[10.5px] font-bold text-zinc-400 hover:text-white transition-colors uppercase cursor-pointer align-middle"
                        >
                          <History className="h-3.5 w-3.5 text-sky-400" />
                          <span>{showVersionHistoryId === strat.id ? "Hide Configuration Ledger" : `View Calibration Ledger (${strat.versionHistory.length})`}</span>
                          <span className="font-mono text-[9px] text-sky-400 px-1 py-0.5 rounded bg-sky-500/5 border border-sky-400/10">V{strat.currentVersion || 1}</span>
                        </button>

                        {showVersionHistoryId === strat.id && (
                          <div className="space-y-2 border-l border-zinc-850 pl-3.5 py-1.5 ml-1.5">
                            {strat.versionHistory.map((snap: any, index: number) => (
                              <div key={`${snap.version}-${index}`} className="relative space-y-1.5 p-3 rounded-lg bg-black/40 border border-zinc-900/60 text-left">
                                <div className="flex items-center justify-between gap-2 border-b border-zinc-900 pb-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-xs text-sky-400">V{snap.version}</span>
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                      {new Date(snap.timestamp).toLocaleString(undefined, {
                                        month: "short",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit"
                                      })}
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleRollback(strat.id, snap.version)}
                                    disabled={rollbackLoadingId === strat.id}
                                    className="py-1 px-2.5 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white text-[10px] font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-40"
                                  >
                                    {rollbackLoadingId === strat.id ? (
                                      <Loader className="h-2.5 w-2.5 animate-spin text-sky-400" />
                                    ) : (
                                      <Undo className="h-2.5 w-2.5 text-sky-400" />
                                    )}
                                    Rollback Parameters
                                  </button>
                                </div>
                                
                                <p className="text-[10px] text-zinc-400 italic font-sans leading-relaxed">
                                  {snap.description || "Baseline Configuration"}
                                </p>

                                <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 font-mono text-[9px] text-zinc-500">
                                  {snap.parameters?.map((p: any) => (
                                    <div key={p.key} className="flex justify-between items-center bg-zinc-950/40 p-1 rounded border border-zinc-900/30">
                                      <span className="truncate font-sans max-w-[120px]">{p.key}:</span>
                                      <span className="text-zinc-300 font-bold">{p.value}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 bg-zinc-900/5 border border-zinc-900/40 rounded p-2 text-center text-zinc-600 text-[10px] font-mono leading-relaxed">
                        Baseline Version V1 active. Overwrite calibrations to register version history and rollout paths.
                      </div>
                    )}
                  </div>

                  {/* Core Optimization panel */}
                  <div className="space-y-3.5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 text-sky-400" />
                      AI "Analyze & Optimize" Advisor
                    </span>

                    <div className="rounded-lg border border-zinc-900 bg-zinc-950/40 p-4 space-y-3 min-h-[140px] flex flex-col justify-between">
                      {aiResponse ? (
                        <div className="space-y-4">
                          <div className="text-[11px] leading-relaxed text-zinc-300 font-sans bg-black/30 p-3 rounded-md border border-zinc-900/60 whitespace-pre-wrap select-all max-h-52 overflow-y-auto">
                            {aiResponse.text}
                          </div>

                          {/* Interactive Parameter Optimization checklist side-by-side matches */}
                          {aiResponse.recommendations && aiResponse.recommendations.length > 0 && (
                            <div className="space-y-3 pt-2.5 border-t border-zinc-900/65 text-left">
                              <span className="text-[11.5px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-sky-400 fill-sky-400/20" />
                                Comparative Calibration Optimizer
                              </span>

                              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                {aiResponse.recommendations.map((rec: any) => {
                                  const isChecked = checkedRecs[strat.id]?.[rec.id] !== false;
                                  return (
                                    <div
                                      key={rec.id}
                                      onClick={() => setCheckedRecs(prev => ({
                                        ...prev,
                                        [strat.id]: {
                                          ...(prev[strat.id] || {}),
                                          [rec.id]: !isChecked
                                        }
                                      }))}
                                      className={`p-3 rounded-lg border text-left transition-all duration-200 cursor-pointer ${
                                        isChecked 
                                          ? "bg-sky-950/10 border-sky-500/25 shadow-xs shadow-sky-500/5" 
                                          : "bg-zinc-900/10 border-zinc-900/60 hover:border-zinc-800"
                                      }`}
                                    >
                                      <div className="flex items-start gap-2.5">
                                        <div className="mt-0.5">
                                          <div className={`h-4 w-4 rounded flex items-center justify-center border transition-all ${
                                            isChecked 
                                              ? "bg-sky-500 border-sky-400 text-black" 
                                              : "border-zinc-700 bg-black"
                                          }`}>
                                            {isChecked && <Check className="h-2.5 w-2.5 stroke-[4.5]" />}
                                          </div>
                                        </div>
                                        <div className="flex-1 space-y-1">
                                          <div className="flex items-center justify-between gap-1.5">
                                            <span className="text-[11px] font-bold text-white font-sans">{rec.title}</span>
                                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-sm bg-sky-500/10 text-sky-400 border border-sky-450/10 lowercase">
                                              {rec.key}
                                            </span>
                                          </div>
                                          
                                          <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                                            {rec.desc}
                                          </p>

                                          {/* Side-by-Side Values Comparison */}
                                          <div className="flex items-center gap-3 pt-1.5 text-[10px] bg-black/20 p-1.5 rounded-md border border-zinc-900/60 font-mono">
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-zinc-500 font-sans">Current:</span>
                                              <span className="text-zinc-400 line-through">{rec.oldValue}</span>
                                            </div>
                                            <ArrowRight className="h-3 w-3 text-sky-400 shrink-0" />
                                            <div className="flex items-center gap-1.5">
                                              <span className="text-zinc-500 font-sans">Proposed:</span>
                                              <span className="text-emerald-450 font-bold">{rec.newValue}</span>
                                            </div>
                                          </div>

                                          {/* Expected Performance Impact Badge */}
                                          <div className="text-[9.5px] font-mono text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                                            <span>{rec.expectedImpact}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Operation triggers */}
                              <div className="space-y-2 pt-2 border-t border-zinc-900/50">
                                {confirmOverwriteId === strat.id ? (
                                  <div className="p-3 bg-rose-950/15 border border-rose-500/25 rounded-lg space-y-2.5">
                                    <div className="text-[11px] text-rose-300 font-sans leading-relaxed flex items-start gap-2">
                                      <AlertTriangle className="h-4 w-4 text-rose-450 shrink-0 mt-0.5" />
                                      <span>
                                        Overwrite strategy baseline calibrations? This will save an auto-rollback ledger snapshot so you can revert back at any time.
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleApplyOptimization(strat.id, false)}
                                        disabled={applyingOptimizationId === strat.id}
                                        className="flex-1 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold cursor-pointer transition disabled:opacity-40"
                                      >
                                        {applyingOptimizationId === strat.id ? "Overwriting..." : "Confirm Overwrite"}
                                      </button>
                                      <button
                                        onClick={() => setConfirmOverwriteId(null)}
                                        className="py-1.5 px-3 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-400 text-[11px] font-semibold cursor-pointer"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                      onClick={() => setConfirmOverwriteId(strat.id)}
                                      disabled={applyingOptimizationId === strat.id}
                                      className="flex-1 py-2 px-3 rounded-lg bg-sky-500 hover:bg-sky-400 active:bg-sky-600 text-zinc-950 text-xs font-bold font-sans transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer shadow-xs shadow-sky-500/10 flex items-center justify-center gap-1.5 disabled:opacity-40"
                                    >
                                      <Zap className="h-3.5 w-3.5 fill-current" />
                                      Overwrite Strategy
                                    </button>
                                    <button
                                      onClick={() => handleApplyOptimization(strat.id, true)}
                                      disabled={applyingOptimizationId === strat.id}
                                      className="flex-1 py-2 px-3 rounded-lg border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-750 text-zinc-300 text-xs font-semibold font-sans transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                                    >
                                      <Layers className="h-3.5 w-3.5 text-zinc-400" />
                                      Clone Version
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          <button
                            onClick={() => handleOptimizeClick(strat.id)}
                            disabled={isOptimizing || strat.deleted}
                            className="w-full flex items-center justify-center gap-1 py-1.5 px-2 border border-dashed border-zinc-850 hover:border-zinc-750 bg-transparent text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition uppercase cursor-pointer"
                          >
                            {isOptimizing ? <Loader className="h-3 w-3 animate-spin text-sky-400" /> : <RefreshCw className="h-3 w-3 text-sky-400" />}
                            Recalculate Advisor Matrix
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3 flex-1 flex flex-col justify-between">
                          <p className="text-[11px] text-zinc-500 leading-relaxed font-sans italic">
                            Consult system AI to parse current high-frequency volatility indicators, audit your configuration, and calculate optimizing target ratios.
                          </p>

                          <button
                            onClick={() => handleOptimizeClick(strat.id)}
                            disabled={isOptimizing || !strat.enabled || strat.deleted}
                            className="w-fit flex items-center gap-1.5 py-1.5 px-3 rounded-md bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-bold transition cursor-pointer disabled:opacity-40"
                          >
                            {isOptimizing ? (
                              <>
                                <Loader className="h-3.5 w-3.5 animate-spin text-sky-400" />
                                Constructing mathematical analysis...
                              </>
                            ) : (
                              <>
                                <span>Analyze & Optimize with System AI</span>
                                <span className="font-mono text-[9px] text-sky-400 border border-sky-400/20 px-1 rounded bg-sky-500/5 animate-pulse">PRO</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Security Passcode Confirmation Dialog */}
      {confirmPermanentId && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-850 max-w-md w-full rounded-2xl p-6 shadow-2xl relative space-y-5 animate-in fade-in zoom-in duration-200">
            <button
               onClick={() => {
                 setConfirmPermanentId(null);
                 setPasscode("");
                 setDeleteError(null);
               }}
               className="absolute top-4 right-4 text-zinc-500 hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-3">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-455 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5 text-rose-450" />
              </div>
              <div>
                <h4 className="font-display font-black text-white text-sm">Security Verification Required</h4>
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wide">Permanent registry deletion</p>
              </div>
            </div>

            <div className="text-xs text-zinc-400 space-y-2 leading-relaxed font-sans">
              <p>
                You are about to permanently purge the strategy <strong className="text-white">"{state.strategies.find(s => s.id === confirmPermanentId)?.name || confirmPermanentId}"</strong> from the active registry database.
              </p>
              <p className="text-rose-400 bg-rose-500/[0.02] p-2.5 rounded-lg border border-rose-500/10 font-sans leading-relaxed">
                ⚠️ <strong>CRITICAL SAFEGUARD:</strong> This action is completely irreversible and will immediately wipe all associated mathematical params, indicator rules, and core signal matchers.
              </p>
            </div>

            {deleteError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-200 rounded-lg text-xs leading-relaxed font-sans">
                {deleteError}
              </div>
            )}

            <div className="space-y-2 text-xs">
              <label className="text-zinc-400 uppercase tracking-wider text-[9px] font-bold block">
                Enter Secure Portal Passcode to Authorize Purge
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg pl-10 pr-4 py-2.5 font-mono text-sm focus:outline-hidden focus:border-rose-500 hover:border-zinc-700"
                />
              </div>
              <p className="text-[10px] text-zinc-500 font-sans italic pt-0.5">
                Note: Authorized administrators may permanently purge any active or default trading strategy configuration from the system registry.
              </p>
            </div>

            <div className="flex gap-3 pt-2 font-sans text-xs">
              <button
                onClick={async () => {
                  if (!confirmPermanentId) return;
                  setDeletingPermanently(true);
                  setDeleteError(null);
                  try {
                    const result = await onDeletePermanentStrategy!(confirmPermanentId, passcode);
                    if (result?.success) {
                      setConfirmPermanentId(null);
                      setPasscode("");
                    } else {
                      setDeleteError(result?.error || "Passcode authorization failed.");
                    }
                  } catch (err) {
                    setDeleteError("System error during authorization.");
                  } finally {
                    setDeletingPermanently(false);
                  }
                }}
                disabled={deletingPermanently}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold rounded-lg cursor-pointer transition flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                {deletingPermanently ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    Purging registry...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4" />
                    Authorize Permanent Purge
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setConfirmPermanentId(null);
                  setPasscode("");
                  setDeleteError(null);
                }}
                disabled={deletingPermanently}
                className="py-2.5 px-4 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-lg cursor-pointer transition disabled:opacity-40"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
