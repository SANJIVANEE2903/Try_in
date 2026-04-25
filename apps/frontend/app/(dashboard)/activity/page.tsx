"use client";

import { useEffect, useState } from "react";
import { Activity as ActivityIcon, Clock, Filter, Terminal, Globe, CheckCircle, XCircle } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LogEntry {
  id: number;
  timestamp: string;
  action: string;
  message: string;
  source: string;
  github_user: string;
  status: string;
}

export default function ActivityPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filter, setFilter] = useState<"all" | "cli" | "web">("all");
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    fetch(`${API_URL}/api/logs?limit=100`)
      .then((res) => res.json())
      .then((data) => {
        // Handle both old string[] format and new object[] format
        const rawLogs = data.logs || [];
        if (rawLogs.length > 0 && typeof rawLogs[0] === "string") {
          setLogs(rawLogs.map((l: string, i: number) => ({
            id: i, timestamp: "", action: "cli", message: l, source: "cli", github_user: "unknown", status: "success"
          })));
        } else {
          setLogs(rawLogs);
        }
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  const filtered = filter === "all" ? logs : logs.filter(l => l.source === filter);

  return (
    <div className="p-4 md:p-8 space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Activity Logs</h1>
          <p className="text-slate-400 text-sm mt-1">Full audit trail of all actions via CLI & Web</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "cli", "web"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize",
                filter === f ? "bg-accent text-accent-foreground" : "glass-card text-slate-400 hover:text-white"
              )}
            >
              {f === "all" ? "All Sources" : f === "cli" ? "CLI" : "Web"}
            </button>
          ))}
          <button onClick={fetchLogs} className="px-4 py-2 glass-card text-slate-400 hover:text-white text-sm flex items-center gap-2 rounded-xl">
            <Filter size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Actions", val: logs.length, color: "text-accent" },
          { label: "CLI Actions", val: logs.filter(l => l.source === "cli").length, color: "text-indigo-400" },
          { label: "Web Actions", val: logs.filter(l => l.source === "web").length, color: "text-emerald-400" },
          { label: "Errors", val: logs.filter(l => l.status === "error").length, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="glass-card p-4">
            <div className={cn("text-2xl font-bold font-mono", s.color)}>{s.val}</div>
            <div className="text-xs text-slate-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass-card divide-y divide-white/5">
        {loading ? (
          <div className="p-20 text-center text-slate-500">
            <div className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full animate-spin mx-auto mb-4" />
            <p>Loading activity...</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((log, i) => (
            <motion.div
              key={log.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.5) }}
              className="p-4 md:p-6 flex items-start gap-4 hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center shrink-0">
                {log.source === "cli" ? <Terminal size={16} className="text-indigo-400" /> : <Globe size={16} className="text-emerald-400" />}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                    log.source === "cli" ? "bg-indigo-500/10 text-indigo-400" : "bg-emerald-500/10 text-emerald-400"
                  )}>{log.source || "cli"}</span>
                  <span className="text-[10px] font-mono text-slate-600 uppercase">{log.action}</span>
                  {log.github_user && log.github_user !== "unknown" && (
                    <span className="text-[10px] text-slate-500">@{log.github_user}</span>
                  )}
                  {log.status === "error" ? (
                    <XCircle size={12} className="text-red-400 ml-auto" />
                  ) : (
                    <CheckCircle size={12} className="text-emerald-400 ml-auto" />
                  )}
                </div>
                <p className="text-slate-200 font-mono text-sm leading-relaxed truncate">{log.message}</p>
                {log.timestamp && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-600">
                    <Clock size={10} /> {log.timestamp}
                  </div>
                )}
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-20 text-center text-slate-500">
            <ActivityIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>No activity yet. Start using the CLI or Web Console to see logs here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
