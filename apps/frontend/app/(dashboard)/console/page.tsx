"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Terminal as TerminalIcon, 
  Send, 
  Bot, 
  User, 
  Sparkles,
  Command,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "pending" | "success" | "error";
};

export default function AIConsole() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I am RepoForge AI. I can help you manage your GitHub repositories with natural language. Try saying 'list my repos' or 'create an express project named my-api'."
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: input }),
      });

      const data = await response.json();
      
      let content = data.message || "Action processed successfully.";
      if (content.includes("Bad credentials") || content.includes("Failed to authenticate")) {
        content = "⚠️ GitHub Authentication Failed. Please run 'repoforge chat' in your PowerShell terminal to set up your GitHub Token first, or check your settings.";
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: content,
        status: data.status === "error" ? "error" : "success"
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I couldn't connect to the RepoForge backend. Please ensure the Python server is running on port 8000.",
        status: "error"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-8 overflow-hidden">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
            <TerminalIcon size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-outfit text-white">AI Console</h1>
            <p className="text-slate-400 text-sm">Natural language automation for your infrastructure</p>
          </div>
        </div>
      </div>

      <div className="flex-1 glass-card overflow-hidden flex flex-col mb-6">
        <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="ml-4 text-xs font-mono text-slate-500">repoforge-ai-terminal</span>
          </div>
          <Sparkles size={16} className="text-accent" />
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 font-mono" ref={scrollRef}>
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={cn(
                  "flex items-start gap-4 max-w-[80%]",
                  msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-1",
                  msg.role === 'user' ? "bg-accent/20 text-accent" : "bg-white/10 text-slate-300"
                )}>
                  {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn(
                  "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-accent text-accent-foreground font-bold" 
                    : cn(
                        "bg-white/5 border border-white/10 text-slate-200",
                        msg.status === "error" && "border-red-500/50 bg-red-500/5",
                        msg.status === "success" && "border-emerald-500/50 bg-emerald-500/5"
                      )
                )}>
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center animate-spin">
                <Loader2 size={16} className="text-slate-400" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-500 text-sm">
                Thinking...
              </div>
            </motion.div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-4 bg-white/5 border-t border-white/5 flex gap-4">
          <div className="flex-1 relative">
            <Command className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a command (e.g. 'create node project named server')..."
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:border-accent/50 transition-all font-mono text-sm placeholder:text-slate-600"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="bg-accent text-accent-foreground w-12 flex items-center justify-center rounded-xl shadow-lg shadow-accent/20"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
