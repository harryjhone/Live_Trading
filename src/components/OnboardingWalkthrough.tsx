import React, { useState, useEffect, useRef } from "react";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Compass, 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Play, 
  HelpCircle, 
  Check, 
  Info,
  CheckSquare,
  Square,
  User,
  Activity,
  Maximize2
} from "lucide-react";

export interface OnboardingStep {
  selector: string;
  title: string;
  description: string;
  placement: "top" | "bottom" | "left" | "right" | "center";
}

interface OnboardingWalkthroughProps {
  runTour: boolean;
  onClose: () => void;
  onStartTour: () => void;
  activeMenu: string;
  setActiveMenu: (menu: any) => void;
  setModalOpen: (open: boolean) => void;
  theme: "dark" | "light";
}

export default function OnboardingWalkthrough({ 
  runTour,
  onClose,
  onStartTour,
  activeMenu,
  setActiveMenu,
  setModalOpen,
  theme
}: OnboardingWalkthroughProps) {
  const [showWelcome, setShowWelcome] = useState<boolean>(true);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [completedTour, setCompletedTour] = useState<boolean>(false);
  const [dontShowAgain, setDontShowAgain] = useState<boolean>(false);
  
  // Element positioning styles
  const [highlightStyle, setHighlightStyle] = useState<React.CSSProperties>({});
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [elementFound, setElementFound] = useState<boolean>(false);

  // Position trackers for lightweight badges
  const [elementsCoords, setElementsCoords] = useState<Record<string, DOMRect & { visible: boolean }>>({});

  const resizeTimer = useRef<number | null>(null);

  // Suggested product tour steps
  const steps: OnboardingStep[] = [
    {
      selector: "#dashboard-area-panel",
      title: "Interactive Analytics Dashboard",
      description: "Keep a real-time pulse on your trade logs, NAV curves, high frequency execution streams, and automated system calibrations.",
      placement: "bottom"
    },
    {
      selector: "#sidebar-nav-container",
      title: "Consensus Side Navigation",
      description: "Quickly slide across dedicated view modules: Signals list, Open trade positions, Strategy code sandboxes, Mental psychology journal, and account billing logs.",
      placement: "right"
    },
    {
      selector: "#btn-place-order-top" ,
      title: "Unified Manual Order Ticket",
      description: "Execute manual order allocations instantly. Set precise stop-losses and dynamic step targets safely with instant contract sizing.",
      placement: "left"
    },
    {
      selector: "#collateral-equity-stats",
      title: "Collateral Ledger & Margin HUD",
      description: "Track your live portfolio equity metrics, daily floating PnL drawdowns, and real-time buffer thresholds before executing.",
      placement: "bottom"
    },
    {
      selector: "#platform-workspace-btn",
      title: "Workspace & Subscription Control",
      description: "Switch workspaces seamlessly, pay premium invoices with simulated card corridors, or unlock strict daily trade caps.",
      placement: "right"
    },
    {
      selector: "#active-theme-switch-btn",
      title: "Interactive Theme Comfort Selector",
      description: "Comfortably inspect technical telemetry screens across any ambient environment with custom light and dark contrast styles.",
      placement: "bottom"
    }
  ];

  // List of lightweight contextual markers for dismissed/skipped state
  const lightweightHints = [
    {
      id: "hint-dash",
      selector: "#dashboard-area-panel",
      title: "Telemetry Terminal Dashboard",
      desc: "Live indicators matrix, historical trade summaries, and account execution logs.",
      placement: "bottom"
    },
    {
      id: "hint-nav",
      selector: "#sidebar-nav-container",
      title: "Multi-Module Workspace Navigation",
      desc: "Access confluences journal, mechanical mistakes checklist, and signals streams instantly.",
      placement: "right"
    },
    {
      id: "hint-order",
      selector: "#btn-place-order-top",
      title: "Instant Market Allocator Terminal",
      desc: "Pre-configure risk multiples, take-profit multipliers, and place manual trades safely.",
      placement: "left"
    },
    {
      id: "hint-hud",
      selector: "#collateral-equity-stats",
      title: "Collateral & Leverage HUD Indicator",
      desc: "Monitor account equity, margin utilization, and total unrealized balance streams.",
      placement: "bottom"
    },
    {
      id: "hint-billing",
      selector: "#platform-workspace-btn",
      title: "Workspace Limits & Account Hub",
      desc: "Adjust segregated workspace environments, unlock high priority slots, or process invoices.",
      placement: "right"
    }
  ];

  // Initialize status on mount
  useEffect(() => {
    const isDismissed = localStorage.getItem("quant_onboarding_dismissed");
    if (isDismissed === "true") {
      setShowWelcome(false);
    } else if (isDismissed === "skipped") {
      setShowWelcome(false);
    }
  }, []);

  // Recalculate target positions dynamically for active guide step
  useEffect(() => {
    if (!runTour || showWelcome || completedTour) return;

    const calculateActiveStepPosition = () => {
      const step = steps[currentStepIndex];
      if (!step) return;

      const element = document.querySelector(step.selector);
      if (element) {
        setElementFound(true);
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        
        setTimeout(() => {
          const rect = element.getBoundingClientRect();
          const lightOverlayAlpha = theme === "light" ? "0.35" : "0.55";
          const glowColor = theme === "light" ? "99, 102, 241" : "129, 140, 248";
          
          setHighlightStyle({
            top: `${rect.top + window.scrollY - 6}px`,
            left: `${rect.left + window.scrollX - 6}px`,
            width: `${rect.width + 12}px`,
            height: `${rect.height + 12}px`,
            position: "absolute",
            borderRadius: "12px",
            boxShadow: `0 0 0 9999px rgba(15, 23, 42, ${lightOverlayAlpha}), 0 0 16px 4px rgba(${glowColor}, 0.5)`,
            border: `2px solid rgb(${glowColor})`,
            zIndex: 40,
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
          });

          // Position Tooltip Card securely
          const tooltipWidth = window.innerWidth < 450 ? 280 : 330;
          let tooltipTop = rect.bottom + window.scrollY + 16;
          let tooltipLeft = rect.left + window.scrollX + (rect.width - tooltipWidth) / 2;

          if (step.placement === "right") {
            tooltipLeft = rect.right + window.scrollX + 16;
            tooltipTop = rect.top + window.scrollY + (rect.height - 180) / 2;
          } else if (step.placement === "left") {
            tooltipLeft = rect.left + window.scrollX - tooltipWidth - 16;
            tooltipTop = rect.top + window.scrollY + (rect.height - 180) / 2;
          } else if (step.placement === "top") {
            tooltipTop = rect.top + window.scrollY - 190;
          }

          // Bound constraints check
          if (tooltipLeft < 12) tooltipLeft = 12;
          if (tooltipLeft + tooltipWidth > window.innerWidth - 12) {
            tooltipLeft = window.innerWidth - tooltipWidth - 12;
          }
          if (tooltipTop < 12) tooltipTop = 12;

          setTooltipStyle({
            top: `${tooltipTop}px`,
            left: `${tooltipLeft}px`,
            width: `${tooltipWidth}px`,
            position: "absolute",
            zIndex: 45,
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
          });
        }, 200);
      } else {
        // Fallback placeholder formatting
        setElementFound(false);
        setHighlightStyle({ display: "none" });
        setTooltipStyle({
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "340px",
          zIndex: 45
        });
      }
    };

    calculateActiveStepPosition();

    const handleResize = () => {
      if (resizeTimer.current) window.clearTimeout(resizeTimer.current);
      resizeTimer.current = window.setTimeout(calculateActiveStepPosition, 100);
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [currentStepIndex, showWelcome, runTour, completedTour, theme]);

  // Track coordinates of hint markers continuously when skipped
  useEffect(() => {
    const isSkipped = localStorage.getItem("quant_onboarding_dismissed") === "skipped";
    if (runTour || !isSkipped) return;

    const trackHintCoordinates = () => {
      const coords: Record<string, DOMRect & { visible: boolean }> = {};
      lightweightHints.forEach(h => {
        const el = document.querySelector(h.selector);
        if (el) {
          const rect = el.getBoundingClientRect();
          // Skip if element is hidden
          if (rect.width > 0 && rect.height > 0) {
            coords[h.id] = {
              x: rect.left,
              y: rect.top,
              width: rect.width,
              height: rect.height,
              top: rect.top,
              bottom: rect.bottom,
              left: rect.left,
              right: rect.right,
              visible: true,
              toJSON: () => {}
            };
          }
        }
      });
      setElementsCoords(coords);
    };

    trackHintCoordinates();
    const interval = setInterval(trackHintCoordinates, 1500);
    window.addEventListener("scroll", trackHintCoordinates, { passive: true });
    window.addEventListener("resize", trackHintCoordinates, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", trackHintCoordinates);
      window.removeEventListener("resize", trackHintCoordinates);
    };
  }, [runTour]);

  // Keyboard controls
  useEffect(() => {
    if (!runTour || showWelcome || completedTour) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        handleNext();
      } else if (e.key === "ArrowLeft") {
        handleBack();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStepIndex, showWelcome, runTour, completedTour]);

  const handleStartGuide = () => {
    setShowWelcome(false);
    setCompletedTour(false);
    setCurrentStepIndex(0);
    onStartTour();
  };

  const handleSkip = () => {
    // Continue directly to dashboard but show lightweight contextual tooltips
    localStorage.setItem("quant_onboarding_dismissed", "skipped");
    setShowWelcome(false);
    setCompletedTour(false);
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      // Completed last step! Trigger completion screen
      setCompletedTour(true);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleFinishTour = () => {
    if (dontShowAgain) {
      localStorage.setItem("quant_onboarding_dismissed", "true");
    } else {
      localStorage.setItem("quant_onboarding_dismissed", "skipped");
    }
    setCompletedTour(false);
    onClose();
  };

  // Turn off lightweight hints permanently
  const handleDismissAllHints = () => {
    localStorage.setItem("quant_onboarding_dismissed", "true");
    setElementsCoords({});
  };

  const isSkippedMode = !runTour && localStorage.getItem("quant_onboarding_dismissed") === "skipped";

  return (
    <div className="font-sans">
      
      {/* 1. INITIAL WELCOME MODAL */}
      <AnimatePresence>
        {runTour && showWelcome && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Darker backdrop blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" 
              onClick={handleSkip}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className={`w-full max-w-xl rounded-2xl relative shadow-2xl border overflow-hidden p-6 md:p-8 z-10 ${
                theme === "light" 
                  ? "bg-white border-zinc-200 text-zinc-800" 
                  : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              {/* Corner decorative light element */}
              <div className="absolute -top-12 -right-12 h-36 w-36 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Close Button overlay */}
              <button
                onClick={handleSkip}
                className={`absolute top-4 right-4 p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === "light" ? "text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                }`}
                title="Skip tour"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="flex flex-col items-center text-center space-y-6">
                
                {/* Modern Animated Logo */}
                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center border shadow-md ${
                  theme === "light" 
                    ? "bg-indigo-50 border-indigo-100 text-indigo-600" 
                    : "bg-indigo-950/40 border-indigo-500/30 text-indigo-400"
                }`}>
                  <Compass className="h-8 w-8 animate-spin" style={{ animationDuration: "12s" }} />
                </div>

                {/* Typography Block */}
                <div className="space-y-2">
                  <h2 className={`font-display text-2xl font-black tracking-tight leading-snug ${
                    theme === "light" ? "text-zinc-900" : "text-white"
                  }`}>
                    Welcome to Quant Terminal
                  </h2>
                  <p className={`text-sm leading-relaxed max-w-md mx-auto ${
                    theme === "light" ? "text-zinc-500" : "text-slate-400"
                  }`}>
                    Your unified high-frequency quantitative sandbox workspace. Let's take a 1-minute guided visual walk properties walkthrough to set up risk buffers, trigger indicator confluences, and adjust subscription billing slots properties flawlessly.
                  </p>
                </div>

                {/* Features list */}
                <div className={`w-full text-left rounded-xl p-4.5 space-y-3.5 border ${
                  theme === "light" ? "bg-zinc-50 border-zinc-200" : "bg-slate-950/40 border-slate-800"
                }`}>
                  <span className="text-[10px] font-mono font-bold tracking-widest text-indigo-500 block uppercase">
                    Interactive Workspace Highlights
                  </span>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 shrink-0 rounded-md bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                        <Activity className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className={`font-semibold block ${theme === "light" ? "text-zinc-800" : "text-slate-200"}`}>Live Indicators Matrix</span>
                        <span className={`text-[11px] ${theme === "light" ? "text-zinc-400" : "text-slate-400"}`}>Evaluate multi-timeframe trends seamlessly.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 shrink-0 rounded-md bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                        <Sparkles className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className={`font-semibold block ${theme === "light" ? "text-zinc-800" : "text-slate-200"}`}>Manual Executor Slots</span>
                        <span className={`text-[11px] ${theme === "light" ? "text-zinc-400" : "text-slate-400"}`}>Execute micro-lot tickets with robust stop safety limits.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 shrink-0 rounded-md bg-amber-500/10 flex items-center justify-center text-amber-500">
                        <User className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className={`font-semibold block ${theme === "light" ? "text-zinc-800" : "text-slate-200"}`}>Workspace Member Billing</span>
                        <span className={`text-[11px] ${theme === "light" ? "text-zinc-400" : "text-slate-400"}`}>Process cloud instances and view pricing constraints.</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="h-5 w-5 shrink-0 rounded-md bg-sky-500/10 flex items-center justify-center text-sky-500">
                        <Maximize2 className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <span className={`font-semibold block ${theme === "light" ? "text-zinc-800" : "text-slate-200"}`}>Comprehensive Statistics Logs</span>
                        <span className={`text-[11px] ${theme === "light" ? "text-zinc-400" : "text-slate-400"}`}>Audit client-side journal, confluences & mistakes logs.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Primary/Secondary actions panel */}
                <div className="w-full pt-3 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleSkip}
                    className={`w-full sm:w-1/3 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      theme === "light" 
                        ? "bg-zinc-100 border-zinc-200 hover:bg-zinc-250 hover:text-zinc-900 text-zinc-650 text-zinc-600" 
                        : "bg-slate-800 border-slate-700 hover:bg-slate-700 hover:text-white text-slate-300"
                    }`}
                  >
                    Skip for Now
                  </button>
                  <button
                    onClick={handleStartGuide}
                    className="w-full sm:w-2/3 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5 fill-white" />
                    Start Guided Tour
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. DIMS SPOTLIGHT AND FLOATING TOOLTIP MODULE */}
      <AnimatePresence>
        {runTour && !showWelcome && !completedTour && (
          <div className="absolute inset-0 pointer-events-none z-40 select-none">
            
            {/* Cutout ring focused spotlight overlay */}
            {elementFound && (
              <motion.div 
                layout
                style={highlightStyle}
                className="pointer-events-none absolute z-40"
              />
            )}

            {/* Float dialog tooltips */}
            <motion.div
              layout
              style={tooltipStyle}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`border rounded-2xl p-5 shadow-2xl pointer-events-auto select-none sm:select-text z-50 ${
                theme === "light" 
                  ? "bg-white border-zinc-200 text-zinc-800 shadow-zinc-300/40" 
                  : "bg-slate-900 border-slate-800 text-slate-100 shadow-black/60"
              }`}
            >
              {/* Header Title with Skip action */}
              <div className="flex justify-between items-center border-b pb-2 mb-3 border-opacity-30 border-current">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 text-indigo-500">
                  <Sparkles className="h-3 w-3 animate-pulse" />
                  Terminal Onboarding step
                </span>
                <button
                  onClick={handleSkip}
                  className={`p-1 rounded transition-colors cursor-pointer ${
                    theme === "light" ? "text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100" : "text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                  }`}
                  title="Abandon tour guide"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Step info context */}
              <div className="space-y-1.5">
                <h4 className={`text-sm font-bold tracking-tight ${theme === "light" ? "text-zinc-900" : "text-white"}`}>
                  {steps[currentStepIndex].title}
                </h4>
                <p className={`text-xs leading-relaxed ${theme === "light" ? "text-zinc-500" : "text-slate-300"}`}>
                  {steps[currentStepIndex].description}
                </p>
              </div>

              {/* Sub navigation count & steps triggers */}
              <div className="mt-4 pt-3.5 border-t border-opacity-10 border-current flex items-center justify-between">
                
                {/* Progress Indicators */}
                <span className={`text-[10px] font-mono ${theme === "light" ? "text-zinc-400" : "text-slate-500"}`}>
                  Step <span className={`font-bold ${theme === "light" ? "text-zinc-800" : "text-slate-200"}`}>{currentStepIndex + 1}</span> of {steps.length}
                </span>

                {/* Back / Next commands */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    disabled={currentStepIndex === 0}
                    className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                      currentStepIndex === 0
                        ? theme === "light" 
                          ? "bg-zinc-50 border-zinc-10 border-zinc-200 text-zinc-300 opacity-40 cursor-not-allowed"
                          : "bg-slate-950 border-slate-90 text-slate-750 opacity-40 cursor-not-allowed"
                        : theme === "light"
                          ? "bg-zinc-150 bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200 hover:text-zinc-950 text-zinc-600"
                          : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                    title="Previous step"
                  >
                    <ArrowLeft className="h-3 w-3" />
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-3.5 py-1.5 text-[11px] rounded-lg font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    {currentStepIndex === steps.length - 1 ? (
                      <>
                        Done
                        <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-3.5 w-3.5 stroke-[3]" />
                      </>
                    )}
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. COMPLETION SCREEN "YOU'RE READY" MODAL */}
      <AnimatePresence>
        {runTour && completedTour && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-950/75 backdrop-blur-md" 
              onClick={handleFinishTour}
            />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ duration: 0.25 }}
              className={`w-full max-w-md rounded-2xl relative shadow-2xl border overflow-hidden p-6 text-center z-10 ${
                theme === "light" 
                  ? "bg-white border-zinc-200 text-zinc-800" 
                  : "bg-slate-900 border-slate-800 text-slate-100"
              }`}
            >
              <div className="absolute top-0 right-0 h-28 w-28 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex flex-col items-center space-y-5">
                {/* Success Celebratory Badge logo */}
                <div className="h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shadow-md">
                  <Check className="h-6.5 w-6.5 text-emerald-400 stroke-[3]" />
                </div>

                <div className="space-y-1.5">
                  <h3 className={`font-display text-xl font-black tracking-tight ${
                    theme === "light" ? "text-zinc-900" : "text-white"
                  }`}>
                    You’re Fully Prepared!
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    theme === "light" ? "text-zinc-500" : "text-slate-400"
                  }`}>
                    Your Quant Terminal setup checklist has been compiled successfully. Live indices calibrators, order tickets manual entries, and strategy triggers are ready for terminal control.
                  </p>
                </div>

                {/* Checklist validation markers */}
                <div className={`w-full rounded-xl p-3.5 text-left border space-y-2 text-xs ${
                  theme === "light" ? "bg-zinc-50 border-zinc-10 border-zinc-200" : "bg-slate-950/40 border-slate-800"
                }`}>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                    <span className="font-semibold">Terminal Workspace Loaded</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500 stroke-[2.5]" />
                    <span className="font-semibold">Simulated billing limits enabled</span>
                  </div>
                </div>

                {/* Action button & checkbox */}
                <div className="w-full space-y-4 pt-1">
                  
                  <div className="flex items-center justify-center gap-2.5 select-none">
                    <button
                      type="button"
                      onClick={() => setDontShowAgain(!dontShowAgain)}
                      className={`transition-colors cursor-pointer ${
                        theme === "light" ? "text-zinc-400 hover:text-zinc-650" : "text-slate-500 hover:text-slate-200"
                      }`}
                    >
                      {dontShowAgain ? (
                        <CheckSquare className="h-4.5 w-4.5 text-indigo-500" />
                      ) : (
                        <Square className="h-4.5 w-4.5" />
                      )}
                    </button>
                    <span className={`text-[11px] ${theme === "light" ? "text-zinc-500" : "text-slate-400"}`}>
                      Don't prompt me with this tour again
                    </span>
                  </div>

                  <button
                    onClick={handleFinishTour}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-98 cursor-pointer"
                  >
                    Enter Operations Room
                    <ArrowRight className="h-3.5 w-3.5 stroke-[2.5]" />
                  </button>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. LIGHTWEIGHT CONTEXTUAL TOOLTIPS / PULSARS FOR SKIPPED TOUR */}
      {isSkippedMode && (
        <div className="absolute inset-0 pointer-events-none z-30 select-none">
          {lightweightHints.map((hint) => {
            const coords = elementsCoords[hint.id];
            if (!coords || !coords.visible) return null;

            // Target position: anchor to elements slightly offset
            // Place indicator slightly near the top-right of the boundaries
            const topPos = coords.top + window.scrollY;
            const leftPos = coords.right + window.scrollX - 12;

            return (
              <div 
                key={hint.id}
                style={{ 
                  position: "absolute", 
                  top: `${topPos + 4}px`, 
                  left: `${leftPos - 12}px`, 
                  width: "16px", 
                  height: "16px" 
                }}
                className="pointer-events-auto z-30 group"
              >
                {/* Floating pulsar dot */}
                <div className="relative w-full h-full flex items-center justify-center cursor-help">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-indigo-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500 border border-white dark:border-slate-900 shadow-md shadow-indigo-500/40" />
                </div>

                {/* Floating, elegant hover mini tooltip card */}
                <div className={`absolute select-text invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all duration-200 rounded-xl p-3.5 w-64 shadow-xl border z-50 pointer-events-auto ${
                  hint.placement === "right" 
                    ? "left-6 -top-10" 
                    : hint.placement === "left"
                      ? "right-6 -top-10"
                      : "left-1/2 -translate-x-1/2 top-6"
                } ${
                  theme === "light" 
                    ? "bg-white border-zinc-200 text-zinc-800 shadow-zinc-300/40" 
                    : "bg-slate-900 border-slate-800 text-slate-100 shadow-black/75"
                }`}>
                  <div className="space-y-1">
                    <h5 className="text-[11px] font-bold tracking-tight uppercase flex items-center gap-1 text-indigo-500">
                      <Sparkles className="h-2.5 w-2.5 text-indigo-500 animate-pulse" />
                      {hint.title}
                    </h5>
                    <p className={`text-[10.5px] leading-relaxed ${theme === "light" ? "text-zinc-500" : "text-slate-400"}`}>
                      {hint.desc}
                    </p>
                  </div>

                  {/* Actions inside tooltip to restart guide or dismiss hints */}
                  <div className="mt-3.5 pt-2 border-t border-opacity-10 border-current flex items-center justify-between text-[9px] font-sans">
                    <button
                      onClick={handleDismissAllHints}
                      className={`font-semibold hover:underline cursor-pointer ${
                        theme === "light" ? "text-zinc-400 hover:text-zinc-650" : "text-slate-500 hover:text-slate-300"
                      }`}
                      title="Hide all helper indicators permanently"
                    >
                      Hide Hints
                    </button>
                    <button
                      onClick={handleStartGuide}
                      className="font-bold text-indigo-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                      title="Launch the complete step-by-step visual product tour"
                    >
                      Start Tour
                      <ArrowRight className="h-2 w-2 stroke-[3]" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
