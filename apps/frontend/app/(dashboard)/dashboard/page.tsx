"use client";

import { useEffect, useState } from "react";
import { 
  GitBranch, GitCommit, Star, Users, Plus, ExternalLink,
  ChevronRight, RefreshCcw, Activity as ActivityIcon,
  Terminal, Globe, CheckCircle, XCircle
} from "lucide-react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface LogEntry {
  id?: number;
  timestamp?: string;
  action?: string;
  message: string;
  source?: string;
  github_user?: string;
  status?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState({ repos: 0, commits: 0, prs: 0, total_actions: 0 });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const fetchData = async () => {
    setIsRefreshing(true);
    setIsOffline(false);
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const [statsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/stats`, { signal: controller.signal }),
        fetch(`${API_URL}/api/logs?limit=10`, { signal: controller.signal }),
      ]).catch(() => {
        setIsOffline(true);
        return [null, null];
      });
      
      clearTimeout(id);

      if (statsRes && statsRes.ok) setStats(await statsRes.json());
      if (logsRes && logsRes.ok) {
        const logsData = await logsRes.json();
        const rawLogs: any[] = logsData.logs || [];
        const normalized: LogEntry[] = rawLogs.map((l, i) =>
          typeof l === "string" ? { id: i, message: l, source: "cli", status: "success" } : l
        );
        setLogs(normalized);
      } else if (!statsRes) {
        setIsOffline(true);
      }
    } catch (err) {
      setIsOffline(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const cards = [
    { name: "Total Repos", value: stats.repos, icon: GitBranch, color: "text-blue-400", bg: "bg-blue-400/10" },
    { name: "Total Commits", value: stats.commits, icon: GitCommit, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { name: "Open PRs", value: stats.prs, icon: Star, color: "text-amber-400", bg: "bg-amber-400/10" },
    { name: "Total Actions", value: stats.total_actions ?? 0, icon: Users, color: "text-purple-400", bg: "bg-purple-400/10" },
  ];

  return (
    <div className="p-4 md:p-8 space-y-10">
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl font-bold font-outfit text-white tracking-tight">Overview</h1>
            {isOffline && (
              <span className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase rounded-md">Offline</span>
            )}
          </div>
          <p className="text-slate-400 mt-1">
            {isOffline 
              ? "Backend is unreachable. Please ensure the local server is running on port 8000."
              : "Welcome back. Here is what is happening with your repositories."
            }
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCcw size={20} className={isRefreshing ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {cards.map((card) => (
          <div
            key={card.name}
            className="glass-card p-5 md:p-6 flex flex-col gap-4 hover:border-white/10 transition-all duration-300"
          >
            <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center ${card.color}`}>
              <card.icon size={24} />
            </div>
            <div>
              <p className="text-xs md:text-sm font-medium text-slate-400">{card.name}</p>
              <h3 className="text-2xl md:text-3xl font-bold text-white mt-1 tracking-tight">{card.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Recent Activity
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] rounded-full uppercase tracking-widest font-bold border border-accent/20">Live</span>
            </h2>
            <Link href="/activity" className="text-sm text-accent hover:underline flex items-center gap-1 font-medium">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          <div className="glass-card divide-y divide-white/5 overflow-hidden">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={log.id ?? i} className="p-4 hover:bg-white/[0.02] transition-colors flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {log.source === "web"
                      ? <Globe size={14} className="text-emerald-400" />
                      : <Terminal size={14} className="text-indigo-400" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-300 leading-relaxed font-mono truncate">
                      {String(log.message)}
                    </p>
                    {log.timestamp && (
                      <p className="text-[10px] text-slate-600 mt-1">{log.timestamp}</p>
                    )}
                  </div>
                  {log.status === "error"
                    ? <XCircle size={14} className="text-red-400 mt-1 flex-shrink-0" />
                    : <CheckCircle size={14} className="text-emerald-400 mt-1 flex-shrink-0" />
                  }
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500">
                <ActivityIcon size={32} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No activity yet. Use the CLI or AI Console to get started.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white">Quick Actions</h2>
          <div className="grid gap-4">
            <Link href="/console" className="glass-card p-5 text-left flex items-center justify-between group hover:bg-accent/5 hover:border-accent/20 transition-all">
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
            </Link>

            <Link href="/console" className="glass-card p-5 text-left flex items-center justify-between group hover:bg-emerald-500/5 hover:border-emerald-500/20 transition-all">
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
            </Link>

            <Link href="/docs" className="glass-card p-5 text-left flex items-center justify-between group hover:bg-indigo-500/5 hover:border-indigo-500/20 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <GitBranch size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">Documentation</p>
                  <p className="text-xs text-slate-500 mt-0.5">Learn all commands</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
