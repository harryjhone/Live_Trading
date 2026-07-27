import React, { useState, useRef, useEffect } from "react";
import { Sparkles, Cpu, Send, Check, Play, Settings, BookOpen, Layers, Plus, Trash2, HelpCircle, AlertCircle, RefreshCw, Paperclip, Image as ImageIcon, Clipboard, X } from "lucide-react";
import { FullAppState, TradingStrategy } from "../types";

interface StrategyBuilderViewProps {
  state: FullAppState;
  onRefreshState: () => Promise<void>;
  onSwitchToCurrent: () => void;
  apiFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  attachment?: {
    data: string; // base64 payload
    mimeType: string;
    name: string;
  };
}

export default function StrategyBuilderView({ state, onRefreshState, onSwitchToCurrent, apiFetch }: StrategyBuilderViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "model",
      content: "Hello! I am your AI Quantitative Strategy Architect.\n\nDescribe the technical indicators, entry triggers, stop loss guidelines, or trend confluences you wish to combine (e.g., 'Buy BTC when RSI is under 25 and fast EMA crosses slow Active Line').\n\nI will construct, calibrate, and format a complete algorithmic strategy specification card for your live terminal."
    }
  ]);
  const [userInput, setUserInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [proposedStrategy, setProposedStrategy] = useState<TradingStrategy | null>(null);
  const [keyStatus, setKeyStatus] = useState<"active" | "missing">("active");
  const [commitStatus, setCommitStatus] = useState<"idle" | "success" | "error">("idle");
  const [commitMessage, setCommitMessage] = useState<string>("");

  const [attachment, setAttachment] = useState<{
    data: string;
    mimeType: string;
    name: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll to latest chat messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          processFile(file);
          e.preventDefault();
          break;
        }
      }
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select or paste an image file under 5MB.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB (e.g., JPEG, PNG).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
        const parts = dataUrl.split(",");
        const mimeMatch = dataUrl.match(/data:([^;]+);base64/);
        const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
        const base64Data = parts[1];
        setAttachment({
          data: base64Data,
          mimeType,
          name: file.name || `image-uploaded-${Date.now() % 10000}.png`
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.read) {
        alert("Clipboard read API not fully supported or blocked by sandbox. Simply click the text input area and press Ctrl+V (or Cmd+V) to paste your copied image direct.");
        return;
      }
      const items = await navigator.clipboard.read();
      let found = false;
      for (const item of items) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            const file = new File([blob], `pasted-graph-${Date.now().toString().slice(-4)}.png`, { type });
            processFile(file);
            found = true;
            break;
          }
        }
        if (found) break;
      }
      if (!found) {
        alert("No image found in clipboard. Copy an image or snapshot of your charts first, then click this button or use Ctrl+V.");
      }
    } catch (err) {
      alert("Click on the text input area below and press Ctrl+V (or Cmd+V on Mac) to paste your copied image directly!");
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!userInput.trim() && !attachment) || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: userInput,
      ...(attachment ? { attachment } : {})
    };

    setMessages(prev => [...prev, userMsg]);
    setUserInput("");
    setAttachment(null);
    setIsLoading(true);
    setCommitStatus("idle");

    try {
      const historyToSend = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
        ...(m.attachment ? { attachment: m.attachment } : {})
      }));

      const res = await apiFetch("/api/ai/strategy-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: historyToSend })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Chat agent processing failure.");
      }

      const data = await res.json();
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: data.text
        }
      ]);

      if (data.strategy) {
        setProposedStrategy(data.strategy);
      }
      setKeyStatus(data.keyStatus);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          content: `⚠️ Error contacting strategy backend: ${err.message || "Please check your network connection."}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCommitStrategy = async () => {
    if (!proposedStrategy) return;
    setCommitStatus("idle");

    try {
      const res = await apiFetch("/api/strategy/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposedStrategy)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to commit strategy specification.");
      }

      setCommitStatus("success");
      setCommitMessage(`Strategy "${proposedStrategy.name}" successfully injected into terminal!`);
      await onRefreshState();
      
      // Auto redirect to strategies list after a small delay
      setTimeout(() => {
        onSwitchToCurrent();
      }, 1500);

    } catch (err: any) {
      setCommitStatus("error");
      setCommitMessage(err.message || "Failed to save strategy.");
    }
  };

  const loadSuggestion = (promptText: string) => {
    setUserInput(promptText);
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="border-b border-zinc-900 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-black text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-sky-400" />
            AI Strategy Builder Room
          </h3>
          <p className="text-xs text-zinc-400 mt-1 font-sans">
            Collaborate with our quantum engineering model to code, configure, and backfill tailored quantitative strategy schemas.
          </p>
        </div>
        <button
          onClick={onSwitchToCurrent}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold font-sans border border-slate-705 dark:border-zinc-800 bg-slate-900 dark:bg-zinc-950 hover:bg-slate-800 dark:hover:border-zinc-700 !text-white dark:!text-zinc-300 transition cursor-pointer"
        >
          <Layers className="h-3.5 w-3.5" />
          View Active Strategies
        </button>
      </div>

      {keyStatus === "missing" && (
        <div className="p-3.5 rounded-lg border border-sky-950/40 bg-sky-500/5 text-sky-400 text-xs flex items-start gap-2.5 font-sans leading-relaxed">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-sky-300">Terminal Demonstration Mode Live</span>
            The live system developer key is currently unregistered. Using preset simulation responses to demonstrate architectural capability. Configure your key in the <b>Settings &gt; Secrets</b> tab anytime.
          </div>
        </div>
      )}

      {/* Main split dashboard layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Conversational Chat Panel */}
        <div 
          className={`lg:col-span-7 flex flex-col rounded-xl border relative transition-colors ${
            isDragging 
              ? "border-sky-500 bg-sky-950/20" 
              : "border-zinc-900 bg-zinc-950/55"
          } min-h-[500px] h-[580px] overflow-hidden`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isDragging && (
            <div className="absolute inset-0 bg-zinc-950/90 flex flex-col items-center justify-center gap-3 z-50 pointer-events-none border border-dashed border-sky-450 border-sky-400 m-2 rounded-lg">
              <ImageIcon className="h-10 w-10 text-sky-400 animate-bounce" />
              <p className="text-sm font-bold text-sky-300 font-sans">Drop image here to attach</p>
              <p className="text-xs text-zinc-500 font-sans">Supports JPEG, PNG up to 5MB</p>
            </div>
          )}
          
          {/* Header */}
          <div className="px-4 py-3 bg-zinc-950 border-b border-zinc-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-zinc-200 uppercase font-mono tracking-widest">AI Assistant Feed</span>
            </div>
            <span className="text-zinc-500 font-mono">Model: Intelligence Core</span>
          </div>

          {/* Messages Thread Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-xs scrollbar-thin">
            {messages.map((m) => {
              const isUser = m.role === "user";
              return (
                <div key={m.id} className={`flex ${isUser ? "justify-end" : "justify-start"} items-start gap-2.5`}>
                  {!isUser && (
                    <div className="h-7 w-7 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                      <Cpu className="h-4 w-4" />
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 border whitespace-pre-wrap leading-relaxed ${
                    isUser
                      ? "bg-zinc-900 border-zinc-800 text-white font-medium"
                      : "bg-zinc-950/80 border-zinc-900 text-zinc-300"
                  }`}>
                    <div>{m.content}</div>
                    {m.attachment && (
                      <div className="mt-2.5 border-t border-zinc-800/60 pt-2.5 flex flex-col gap-1 text-left max-w-full">
                        <img
                          src={`data:${m.attachment.mimeType};base64,${m.attachment.data}`}
                          alt={m.attachment.name}
                          className="max-w-full max-h-[160px] object-contain rounded border border-zinc-800/80 bg-black/40"
                        />
                        <span className="text-[10px] text-zinc-500 flex items-center gap-1.5 font-mono truncate max-w-full">
                          📎 {m.attachment.name}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {isLoading && (
              <div className="flex justify-start items-center gap-2.5 text-zinc-500 italic block">
                <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center shrink-0">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                </div>
                <span>Drafting technical confluences...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Prompt Suggestions Bar */}
          <div className="px-4 py-2 bg-zinc-950/40 border-t border-zinc-900 flex flex-wrap gap-2 items-center">
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider font-sans shrink-0">Ideas:</span>
            <button
              onClick={() => loadSuggestion("Build an EMA Crossover strategy with fast line EMA 5 crossing EMA 20, and 1:2 Risk-Reward ratio.")}
              className="text-[10px] bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
            >
              EMA Cross Wave
            </button>
            <button
              onClick={() => loadSuggestion("Create a Mean Reversion strategy buying when RSI reaches 25 and closing out with profit multiplier.")}
              className="text-[10px] bg-zinc-900 hover:bg-zinc-850 px-2.5 py-1 rounded text-zinc-400 hover:text-white transition cursor-pointer"
            >
              RSI Mean Reversion
            </button>
          </div>

          {/* Attachment Preview (if any) */}
          {attachment && (
            <div className="px-3.5 py-2 bg-zinc-950 border-t border-zinc-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={`data:${attachment.mimeType};base64,${attachment.data}`}
                  alt="Attachment Preview"
                  className="h-8 w-8 object-cover rounded border border-zinc-800 bg-black/40 shrink-0"
                />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] text-zinc-300 font-mono truncate max-w-[180px] sm:max-w-[280px]">
                    {attachment.name}
                  </span>
                  <span className="text-[9.5px] text-zinc-500 uppercase tracking-widest font-mono">
                    Ready to analyze
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="p-1.5 rounded-md hover:bg-zinc-900 text-zinc-400 hover:text-red-400 transition cursor-pointer shrink-0"
                title="Remove attachment"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Form Input Container */}
          <form onSubmit={handleSend} className="p-3 bg-zinc-950 border-t border-zinc-900 flex gap-2 items-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition cursor-pointer shrink-0"
              title="Attach diagram image (Drag-and-Drop is also supported)"
              disabled={isLoading}
            >
              <Paperclip className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handlePasteFromClipboard}
              className="p-2.5 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950 text-zinc-400 hover:text-zinc-200 transition cursor-pointer shrink-0"
              title="Paste image directly from clipboard"
              disabled={isLoading}
            >
              <Clipboard className="h-4 w-4" />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  processFile(file);
                }
                e.target.value = "";
              }}
              accept="image/*"
              className="hidden"
            />
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onPaste={handlePaste}
              placeholder="Type message, paste graph, or drag-and-drop screenshots..."
              className="flex-1 rounded-lg border border-zinc-800 bg-zinc-950 text-white px-3.5 py-2 font-sans text-xs focus:outline-none focus:border-zinc-700 placeholder:text-zinc-500"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={(!userInput.trim() && !attachment) || isLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 !text-white font-bold rounded-lg text-xs leading-none flex items-center justify-center gap-1.5 transition disabled:opacity-40 cursor-pointer shrink-0"
            >
              <Send className="h-3.5 w-3.5 !text-white" />
              Analyze
            </button>
          </form>

        </div>

        {/* Right Side: Proposed Strategy Board */}
        <div className="lg:col-span-5 space-y-4">
          
          <div className="px-1.5 flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">Proposed Strategy Card</span>
            {proposedStrategy && (
              <span className="font-mono text-[9px] text-emerald-450 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase font-black uppercase tracking-wide">Ready for Injection</span>
            )}
          </div>

          {proposedStrategy ? (
            <div className="rounded-xl border border-zinc-850 bg-zinc-950/80 p-5 space-y-4 relative overflow-hidden transition-all duration-300">
              
              {/* Card Watermark or Background Decor */}
              <div className="absolute right-0 top-0 opacity-5 p-4 pointer-events-none">
                <Cpu className="h-24 w-24 text-zinc-600" />
              </div>

              {/* Title Header Block */}
              <div className="border-b border-zinc-900 pb-3 flex items-start gap-2.5">
                <div className="p-2.5 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-450 shrink-0">
                  <Cpu className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h4 className="font-display font-black text-sm text-white">{proposedStrategy.name}</h4>
                  <span className="text-[10px] text-zinc-500 font-mono block mt-0.5">Timeframe: {proposedStrategy.timeframe || "M15"}</span>
                </div>
              </div>

              {/* Strategy Details Grid */}
              <div className="space-y-3 font-sans text-xs text-zinc-350">
                <div>
                  <span className="text-[10px] uppercase text-zinc-500 font-bold block tracking-wider">Description</span>
                  <p className="mt-0.5 text-zinc-300 leading-relaxed font-sans">{proposedStrategy.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold block tracking-wide">Pattern Engine</span>
                    <span className="text-[11px] text-zinc-200 mt-1 font-mono block">{proposedStrategy.pattern}</span>
                  </div>

                  <div className="bg-zinc-900/30 p-2.5 rounded-lg border border-zinc-900">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold block tracking-wide">Confluences</span>
                    <span className="text-[11px] text-zinc-200 mt-1 block leading-normal">{proposedStrategy.confluences}</span>
                  </div>
                </div>

                <div className="border-t border-zinc-900/60 pt-3.5 space-y-2.5">
                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 font-bold block tracking-wider">Positions Entry Rules</span>
                    <p className="mt-0.5 leading-normal text-zinc-300">{proposedStrategy.entryRules}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-zinc-500 font-bold block tracking-wider">Take Profit & Exit Schema</span>
                    <p className="mt-0.5 leading-normal text-zinc-300">{proposedStrategy.slTpRules}</p>
                  </div>
                </div>

                {/* Sub-Indicators and Parameters config list */}
                {proposedStrategy.parameters && proposedStrategy.parameters.length > 0 && (
                  <div className="border-t border-zinc-900/60 pt-4">
                    <span className="text-[10px] uppercase text-zinc-500 font-bold block tracking-wider mb-2">Preset Parameters</span>
                    <div className="space-y-1.5 font-mono text-[10.5px]">
                      {proposedStrategy.parameters.map((p) => (
                        <div key={p.key} className="flex items-center justify-between border-b border-zinc-900/30 pb-1">
                          <span className="text-zinc-500 font-sans">{p.label}</span>
                          <span className="bg-zinc-900 px-1.5 py-0.5 rounded text-white font-bold">{p.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Alert Zone */}
              {commitStatus === "success" && (
                <div className="p-3.5 rounded-lg border border-emerald-900/30 bg-emerald-500/5 text-emerald-450 text-xs font-sans text-center flex items-center justify-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">{commitMessage}</span>
                </div>
              )}
              {commitStatus === "error" && (
                <div className="p-3.5 rounded-lg border border-rose-950/40 bg-rose-500/5 text-rose-400 text-xs font-sans text-center">
                  Error: {commitMessage}
                </div>
              )}

              {/* Call to Active Action */}
              <button
                onClick={handleCommitStrategy}
                disabled={commitStatus === "success"}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-black transition cursor-pointer shadow-md uppercase tracking-wider leading-none"
              >
                <Plus className="h-4 w-4 shrink-0" />
                Confirm & Inject Strategy to Terminal
              </button>

            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/20 p-8 flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
              <div className="p-4 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-500">
                <HelpCircle className="h-7 w-7" />
              </div>
              <div>
                <span className="font-display font-black text-sm text-zinc-350 block">No Strategy Draft Available</span>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm font-sans leading-relaxed">
                  Start conversing with our quantitative developer assistant on the left side to compile a live strategy specification card.
                </p>
              </div>
              <div className="pt-2 text-[10px] text-zinc-500 font-sans">
                💡 Try submitting <span className="underline cursor-pointer hover:text-white" onClick={() => loadSuggestion("I want a strategy buying when RSI reaches 25 and closing out with profit multiplier.")}>"Create an RSI strategy"</span> to trigger.
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
