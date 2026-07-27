import React, { useState } from "react";
import { FullAppState, TelegramAlert } from "../types";
import { Bell, Send, AlertTriangle, CheckCircle2, MessageSquare, Search, Filter } from "lucide-react";

interface NotificationsViewProps {
  state: FullAppState;
}

export default function NotificationsView({ state }: NotificationsViewProps) {
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "SENT" | "FAILED">("ALL");

  const alerts = state.telegramAlerts || [];

  const filtered = alerts.filter((n) => {
    const matchesSearch = n.message.toLowerCase().includes(search.toLowerCase()) || 
                          n.chatId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || n.deliveryStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="border-b border-zinc-900 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-sky-400" />
            Telegram Broadcast Audit Hub
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Real-time delivery logs of all Telegram channel alerts sent for entry, target ratchets, and SL/TP triggers.
          </p>
        </div>
        
        <div className="flex items-center gap-1.5 px-3 py-1 bg-sky-500/10 border border-sky-500/20 rounded-lg text-[11px] font-mono text-sky-300">
          <Send className="h-3 w-3 animate-pulse" />
          <span>Telegram Channel: @QuantTerminal_Alerts</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search Telegram alert records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2 pl-9 font-sans text-xs text-zinc-200 outline-hidden hover:border-zinc-800 focus:border-zinc-700"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Filter className="h-4 w-4 text-zinc-500" />
          <div className="inline-flex rounded-lg border border-zinc-900 p-0.5 bg-zinc-950">
            {(["ALL", "SENT", "FAILED"] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`py-1 px-3 text-[10px] font-bold rounded-md transition-all ${
                  statusFilter === status
                    ? "bg-sky-500/10 text-sky-400 border border-sky-500/10"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Broadcast Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="lg:col-span-2 flex flex-col items-center justify-center py-20 text-center rounded-xl border border-zinc-900 bg-zinc-950/10">
            <MessageSquare className="h-10 w-10 text-zinc-800 mb-3" />
            <h4 className="text-sm font-semibold text-zinc-400">No broadcast payloads matches</h4>
            <p className="text-xs text-zinc-500 mt-1">Audit logs did not return any historical Telegram notifications.</p>
          </div>
        ) : (
          filtered.map((alert) => {
            const isFailed = alert.deliveryStatus === "FAILED";
            return (
              <div
                key={alert.id}
                className={`rounded-xl border p-4 bg-zinc-950/40 relative flex flex-col justify-between transition-all duration-250 hover:border-zinc-800 ${
                  isFailed ? "border-rose-950/40" : "border-zinc-900"
                }`}
              >
                <div className="space-y-3.5">
                  {/* Channel Header Info */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-sky-500/10 flex items-center justify-center border border-sky-400/20 text-sky-400">
                        <Send className="h-3 w-3" />
                      </div>
                      <div>
                        <span className="text-[11px] font-bold text-white block">Quant AI Broadcast</span>
                        <span className="text-[9px] text-zinc-500 block leading-none">{alert.chatId}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                      <span className="text-zinc-550 text-zinc-500">{new Date(alert.time).toLocaleTimeString()}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[9px] font-bold uppercase ${
                        isFailed ? "bg-rose-500/10 text-rose-400 border border-rose-500/15" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15"
                      }`}>
                        {isFailed ? <AlertTriangle className="h-2.5 w-2.5" /> : <CheckCircle2 className="h-2.5 w-2.5" />}
                        {alert.deliveryStatus}
                      </span>
                    </div>
                  </div>

                  {/* Body message formatted code container */}
                  <div className="bg-black/40 rounded-lg p-3 border border-zinc-900 font-mono text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap select-all">
                    {alert.message}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-3.5 pt-2 border-t border-zinc-900/40 text-[10px] text-zinc-550 text-zinc-500">
                  <span>Packet Tracking Key: <span className="font-mono">{alert.id}</span></span>
                  <span>UTC Time: {new Date(alert.time).toLocaleDateString()}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
