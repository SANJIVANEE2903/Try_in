"use client";

import { useEffect, useState } from "react";
import { 
  FolderGit2, 
  Search, 
  Star, 
  GitFork, 
  ExternalLink, 
  MoreVertical,
  Filter,
  Plus
} from "lucide-react";
import { motion } from "framer-motion";

export default function Repositories() {
  const [repos, setRepos] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setRepos([
      { id: 1, name: "repoforge-cli", stars: 120, forks: 45, type: "TypeScript", private: false },
      { id: 2, name: "express-api-scaffold", stars: 89, forks: 12, type: "JavaScript", private: true },
      { id: 3, name: "react-dashboard-v3", stars: 231, forks: 88, type: "React", private: false },
      { id: 4, name: "python-backend-core", stars: 45, forks: 5, type: "Python", private: true },
    ]);
  }, []);

  const filtered = repos.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-outfit text-white">Repositories</h1>
          <p className="text-slate-400 text-sm">Browse and manage all your connected projects</p>
        </div>
        <button className="bg-accent text-accent-foreground px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-accent/20">
          <Plus size={20} /> Create New
        </button>
      </div>

      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter repositories..."
            className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-2.5 pl-12 pr-4 text-white focus:outline-none focus:border-accent/50 transition-all text-sm"
          />
        </div>
        <button className="px-4 py-2.5 glass-card flex items-center gap-2 text-slate-400 hover:text-white transition-all text-sm">
          <Filter size={18} /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((repo, i) => (
          <motion.div
            key={repo.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 flex flex-col gap-4 group hover:border-accent/30 transition-all duration-300 relative overflow-hidden"
          >
            <div className="flex items-start justify-between relative z-10">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <FolderGit2 size={24} />
              </div>
              <button className="text-slate-600 hover:text-white transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white group-hover:text-accent transition-colors">{repo.name}</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-white/10 text-slate-500 uppercase font-bold tracking-wider">
                  {repo.private ? "Private" : "Public"}
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">Last synchronized 2 hours ago</p>
            </div>

            <div className="flex items-center justify-between mt-2 relative z-10 gap-2">
              <div className="flex items-center gap-3 text-slate-500 text-[10px]">
                <div className="flex items-center gap-1"><Star size={12} className="text-amber-500/50" /> {repo.stars}</div>
                <div className="flex items-center gap-1"><GitFork size={12} className="text-blue-500/50" /> {repo.forks}</div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => alert(`🏥 Running health check for ${repo.name}...`)}
                  className="px-3 py-1 rounded-lg bg-white/5 hover:bg-accent/10 text-slate-400 hover:text-accent transition-all text-[10px] font-bold border border-white/5"
                >
                  Health Check
                </button>
                <button className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all">
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
