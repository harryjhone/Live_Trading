import React from "react";
import { ShieldAlert, Scale, CheckSquare, Award } from "lucide-react";

export default function DisclaimerView() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="border-b border-zinc-900 pb-4">
        <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-rose-500" />
          Regulatory Risk Disclaimer & Sandbox Terms
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Review financial compliance metrics, sandbox execution constraints, and CFTC algorithmic trading protocols.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          {/* Main Risk Warnings */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3">
            <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
              <Scale className="h-4.5 w-4.5 text-rose-500" />
              CFTC Rule 4.41 - Hypothetical Performance Statements
            </h4>
            <div className="text-xs text-zinc-410 text-zinc-405 text-zinc-400 leading-relaxed space-y-3 font-sans">
              <p>
                HYPOTHETICAL OR SIMULATED PERFORMANCE RESULTS HAVE CERTAIN LIMITATIONS. UNLIKE AN ACTUAL PERFORMANCE RECORD, SIMULATED RESULTS DO NOT REPRESENT ACTUAL TRADING. ALSO, SINCE THE TRADES HAVE NOT BEEN EXECUTED, THE RESULTS MAY HAVE UNDER-OR-OVER COMPENSATED FOR THE IMPACT, IF ANY, OF CERTAIN MARKET FACTORS, SUCH AS LACK OF LIQUIDITY. SIMULATED TRADING PROGRAMS IN GENERAL ARE ALSO SUBJECT TO THE FACT THAT THEY ARE DESIGNED WITH THE BENEFIT OF HINDSIGHT. NO REPRESENTATION IS BEING MADE THAT ANY ACCOUNT WILL OR IS LIKELY TO ACHIEVE PROFIT OR LOSSES SIMILAR TO THOSE SHOWN.
              </p>
              <p>
                All trading signals, active charts, backtested strategy metrics, and simulated orders on this platform are completely speculative virtual actions. No actual currencies, equities, tokens, or options are handled under any circumstances.
              </p>
            </div>
          </div>

          {/* Sandbox conditions */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/40 p-5 space-y-3">
            <h4 className="font-display text-base font-bold text-white flex items-center gap-2">
              <CheckSquare className="h-4.5 w-4.5 text-emerald-500" />
              Direct-Access MT5 Simulation Mechanics
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed font-sans">
              This terminal includes a simulated MetaTrader 5 Expert Advisor (EA) channel module. Enable our connector parameters to sync simulated orders directly as real trading scripts. If connected, these signals will trigger operations in your external MT5 trading environment. Ensure your terminal accounts are strictly configured to demo or sandbox modes before bridging. The platform authors accept zero responsibility for live brokerage loss outcomes.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Risk Level Alert */}
          <div className="rounded-xl border border-rose-950/50 bg-rose-950/15 p-5 space-y-3">
            <span className="text-xs font-bold text-rose-450 text-rose-400 uppercase tracking-widest block leading-none">HIGH EXPOSURE ALERT</span>
            <h5 className="font-display text-sm font-bold text-white leading-tight">Leveraged Financial Margin</h5>
            <p className="text-xs text-zinc-405 text-zinc-400 leading-relaxed font-sans">
              CFD and Forex trading carry significant risk. Average retail retail accounts experience substantial losses due to high-leverage margins. Implement strictly tight stop-losses and optimize your strategies via Gemini to prevent account drawdown cascades.
            </p>
          </div>

          {/* Certification badges */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-950/20 p-4 space-y-2 text-center">
            <Award className="h-7 w-7 text-emerald-500 mx-auto" />
            <span className="font-display text-xs font-bold text-zinc-300 block leading-tight">Quant Laboratory sandbox certification</span>
            <p className="text-[10px] text-zinc-550 leading-relaxed">
              Standard secure sandbox model calibrated strictly for demo and educational demonstration parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
