"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, Bot, User, Minimize2 } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return generateSessionId();
  let id = sessionStorage.getItem("ks_chat_session");
  if (!id) { id = generateSessionId(); sessionStorage.setItem("ks_chat_session", id); }
  return id;
}

const WELCOME: Message = {
  role: "assistant",
  content: "Hi! 👋 I'm the Kutti Story assistant. I can help you with photography services, bookings, packages, and anything else you'd like to know. What can I help you with today?",
};

const QUICK_REPLIES = ["Pricing info", "Book a session", "Wedding packages", "Our services", "Studio location", "Contact info", "Social Media"];

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [sessionId] = useState(getOrCreateSessionId);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Load history on mount
  useEffect(() => {
    fetch(`/api/chatbot?sessionId=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.messages?.length) {
          setMessages([WELCOME, ...data.messages.map((m: any) => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp ? new Date(m.timestamp) : undefined,
          }))]);
        }
      })
      .catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setMinimized(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Clean up any in-flight request on unmount
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const sendMessage = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setStreaming(true);

    // Add streaming placeholder
    const placeholder: Message = { role: "assistant", content: "", timestamp: new Date() };
    setMessages((prev) => [...prev, placeholder]);

    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId }),
        signal: abortRef.current.signal,
      });

      if (!res.ok || !res.body) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Network error");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let full = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        // Keep last potentially incomplete line in buffer
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const data = trimmed.slice(6);
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              full += parsed.text;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: full,
                };
                return updated;
              });
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      // If we got nothing at all, show a fallback
      if (!full.trim()) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: "I'm sorry, I couldn't generate a response. Please try again.",
          };
          return updated;
        });
      }

      if (!open) setUnread((n) => n + 1);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, sessionId, open]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (ts?: Date) => {
    if (!ts) return "";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* CHAT WINDOW */}
      {open && !minimized && (
        <div
          className="fixed bottom-24 right-6 z-[999] w-[360px] max-h-[580px] flex flex-col rounded-2xl shadow-2xl border border-white/10 overflow-hidden bg-[#111111]"
          style={{ boxShadow: "0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)" }}
        >
          {/* HEADER */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-600 to-orange-500 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Kutti Story Assistant</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${streaming ? "bg-yellow-400 animate-pulse" : "bg-green-400"}`} />
                  <span className="text-white/70 text-xs">{streaming ? "typing…" : "Online"}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimized(true)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <Minimize2 className="w-4 h-4 text-white/70" />
              </button>
              <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/20 transition-colors">
                <X className="w-4 h-4 text-white/70" />
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center ${msg.role === "assistant" ? "bg-orange-500/20 border border-orange-500/30" : "bg-zinc-700"}`}>
                  {msg.role === "assistant"
                    ? <Bot className="w-4 h-4 text-orange-400" />
                    : <User className="w-4 h-4 text-zinc-300" />}
                </div>
                <div className={`max-w-[80%] flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    msg.role === "assistant"
                      ? "bg-zinc-800/80 text-zinc-100 rounded-tl-sm"
                      : "bg-orange-500 text-white rounded-tr-sm"
                  }`}>
                    {/* Show typing dots when streaming and this is the last empty assistant message */}
                    {msg.content === "" && msg.role === "assistant" && streaming && i === messages.length - 1 ? (
                      <span className="flex gap-1 py-0.5 px-1">
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : (
                      msg.content
                    )}
                  </div>
                  <span className="text-zinc-600 text-[10px] px-1">{formatTime(msg.timestamp)}</span>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* QUICK SUGGESTIONS — only when just the welcome message is shown */}
          {messages.length <= 1 && !streaming && (
            <div className="px-4 pb-2 flex flex-wrap gap-2 shrink-0">
              {QUICK_REPLIES.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* INPUT */}
          <div className="border-t border-zinc-800 p-3 shrink-0">
            <div className="flex gap-2 items-center bg-zinc-800 rounded-xl px-3 py-2 focus-within:ring-1 focus-within:ring-orange-500/50">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about our photography services…"
                disabled={streaming}
                className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 outline-none disabled:opacity-50"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || streaming}
                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {streaming
                  ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                  : <Send className="w-4 h-4 text-white" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MINIMIZED BAR */}
      {open && minimized && (
        <button
          onClick={() => setMinimized(false)}
          className="fixed bottom-24 right-6 z-[999] bg-zinc-900 border border-zinc-700 rounded-2xl px-4 py-3 flex items-center gap-3 shadow-xl hover:border-orange-500/50 transition-colors"
        >
          <Bot className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-white font-medium">Kutti Story Assistant</span>
          {streaming && <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />}
        </button>
      )}

      {/* FAB BUTTON */}
      <button
        onClick={() => { setOpen((o) => !o); setMinimized(false); }}
        className="fixed bottom-6 right-6 z-[1000] w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg hover:shadow-orange-500/30 hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center"
        style={{ boxShadow: open ? "0 0 0 4px rgba(249,115,22,0.2), 0 8px 32px rgba(249,115,22,0.4)" : undefined }}
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </button>
    </>
  );
}
