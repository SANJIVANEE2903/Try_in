"use client";

import { 
  User, 
  Github, 
  Moon, 
  Bell, 
  Shield, 
  Zap,
  CheckCircle2
} from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="p-8 space-y-12 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold font-outfit text-white">Settings</h1>
        <p className="text-slate-400 text-sm">Configure your RepoForge experience and connections</p>
      </div>

      <div className="space-y-8">
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User size={20} className="text-accent" /> Profile
          </h2>
          <div className="glass-card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
              <input readOnly value="John Developer" className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2.5 text-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <input readOnly value="john@example.com" className="w-full bg-slate-900/50 border border-white/5 rounded-lg p-2.5 text-white text-sm" />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Github size={20} className="text-accent" /> Integrations
          </h2>
          <div className="glass-card p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-white">
                <Github size={24} />
              </div>
              <div>
                <p className="font-bold text-white">GitHub OAuth</p>
                <div className="flex items-center gap-1.5 text-emerald-500 text-xs mt-0.5">
                  <CheckCircle2 size={12} /> Connected via OAuth
                </div>
              </div>
            </div>
            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-slate-300 transition-all border border-white/5">
              Sync Account
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Moon size={20} className="text-accent" /> Preferences
          </h2>
          <div className="glass-card p-6 flex items-center justify-between">
            <div>
              <p className="font-bold text-white">Theme Mode</p>
              <p className="text-xs text-slate-500 mt-0.5">Switch between dark and light appearance</p>
            </div>
            <div className="flex bg-slate-900 rounded-lg p-1 border border-white/5">
              <button className="p-2 text-slate-500 hover:text-white"><Zap size={18} /></button>
              <button className="p-2 bg-accent text-accent-foreground rounded-md shadow-lg shadow-accent/20"><Moon size={18} /></button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
