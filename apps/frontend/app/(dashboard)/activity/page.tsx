"use client";

import { useEffect, useState } from "react";
import { Activity as ActivityIcon, Clock, Filter, Search } from "lucide-react";
import { motion } from "framer-motion";

export default function ActivityPage() {
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetch("http://localhost:8000/api/logs")
      .then((res) => res.json())
      .then((data) => setLogs(data.logs || []))
      .catch((err) => console.error("Logs fetch failed", err));
  }, []);

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Activity Logs</h1>
          <p className="text-slate-400 text-sm">A full audit trail of all actions performed via RepoForge</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 glass-card text-slate-400 hover:text-white text-sm flex items-center gap-2">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="glass-card divide-y divide-white/5">
        {logs.length > 0 ? (
          logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-6 flex items-start gap-6 hover:bg-white/[0.01] transition-colors"
            >
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-white/5 flex items-center justify-center text-slate-500 shrink-0">
                <Clock size={20} />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent uppercase tracking-widest">CLI Command</span>
                  <span className="text-[10px] text-slate-600 font-mono">ID: rf_{Math.random().toString(36).substr(2, 9)}</span>
                </div>
                <p className="text-slate-200 font-mono text-sm leading-relaxed">{log}</p>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="p-20 text-center text-slate-500">
            <ActivityIcon size={48} className="mx-auto mb-4 opacity-20" />
            <p>No activity recorded yet. Start using the CLI to see logs here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
