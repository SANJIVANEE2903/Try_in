"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  GitBranch, 
  GitCommit, 
  Star, 
  Users, 
  Plus, 
  ExternalLink,
  ChevronRight,
  RefreshCcw,
  Activity as ActivityIcon
} from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({ repos: 0, commits: 0, prs: 0 });
  const [logs, setLogs] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      const statsRes = await fetch("http://localhost:8000/api/stats");
      const statsData = await statsRes.json();
      setStats(statsData);

      const logsRes = await fetch("http://localhost:8000/api/logs");
      const logsData = await logsRes.json();
      setLogs(logsData.logs || []);
    } catch (err) {
      console.error("Fetch failed", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const cards = [
    { name: "Total Repos", value: stats.repos, icon: GitBranch, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Total Commits", value: stats.commits, icon: GitCommit, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Open PRs", value: stats.prs, icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
    { name: "Contributors", value: "12", icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">Overview</h1>
          <p className="text-slate-400">Welcome back. Here is what is happening with your repositories.</p>
        </div>
        <button 
          onClick={fetchData}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCcw size={20} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-6 flex flex-col gap-4 group hover:border-accent/30 transition-all duration-300"
          >
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-400">{card.name}</p>
              <h3 className="text-3xl font-bold text-white mt-1 tracking-tight">{card.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Recent Activity
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded-full uppercase tracking-widest font-bold border border-accent/20">Live</span>
            </h2>
            <button className="text-sm text-accent hover:underline flex items-center gap-1 font-medium">
              View All <ChevronRight size={14} />
            </button>
          </div>

          <div className="glass-card divide-y divide-white/5 overflow-hidden">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ActivityIcon className="text-slate-400" size={16} />
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed font-mono">{log}</p>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500">
                <p>No recent activity detected from CLI.</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          <div className="grid gap-4">
            <button className="glass-card p-5 text-left flex items-center justify-between group hover:bg-accent/5 hover:border-accent/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                  <Plus size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Create New Repo</p>
                  <p className="text-xs text-slate-500 mt-0.5">Setup a new GitHub project</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-accent group-hover:translate-x-1 transition-all" />
            </button>

            <button className="glass-card p-5 text-left flex items-center justify-between group hover:bg-emerald-500/5 hover:border-emerald-500/20">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <ExternalLink size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">New Scaffold</p>
                  <p className="text-xs text-slate-500 mt-0.5">Generate Node/React app</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
