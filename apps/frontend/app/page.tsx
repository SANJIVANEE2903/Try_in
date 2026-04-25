"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Terminal, 
  Sparkles, 
  Zap, 
  Shield, 
  Github, 
  ChevronRight,
  Code2,
  Cpu,
  Globe,
  Menu,
  X
} from "lucide-react";

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10" />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-6 max-w-7xl mx-auto w-full z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
            <Code2 className="text-accent-foreground" size={24} />
          </div>
          <span className="text-2xl font-bold font-display tracking-tight text-white">RepoForge</span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <Link href="/auth/github" className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-white hover:bg-white/10 transition-all">
            Sign In
          </Link>
          <Link href="/auth/github" className="bg-accent text-accent-foreground px-5 py-2 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-accent/20">
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden p-2 text-slate-400 hover:text-white"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 right-0 p-6 bg-slate-900 border-b border-white/10 flex flex-col gap-6 md:hidden z-50 shadow-2xl"
          >
            <a href="#features" onClick={() => setIsMenuOpen(false)} className="text-slate-300 font-medium">Features</a>
            <a href="#how-it-works" onClick={() => setIsMenuOpen(false)} className="text-slate-300 font-medium">How it Works</a>
            <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
              <Link href="/auth/github" className="w-full py-3 text-center rounded-xl bg-white/5 text-white font-bold border border-white/10">
                Sign In
              </Link>
              <Link href="/auth/github" className="w-full py-3 text-center rounded-xl bg-accent text-accent-foreground font-bold shadow-lg shadow-accent/20">
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 pt-20 pb-32 max-w-5xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-bold uppercase tracking-widest mb-8"
        >
          <Sparkles size={14} /> AI-Powered Repository Management
        </motion.div>
        
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold font-outfit text-white tracking-tight mb-8 leading-[1.1]"
        >
          Control GitHub with <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-indigo-400">Natural Language</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl leading-relaxed"
        >
          Stop memorizing complex Git syntax. Manage your repositories, branches, and automation using plain English. Built for modern developers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 w-full justify-center"
        >
          <Link href="/auth/github" className="bg-accent text-accent-foreground px-8 py-4 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2">
            Get Started for Free <ChevronRight size={20} />
          </Link>
          <Link href="/docs" className="bg-slate-900 border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2">
            View Documentation
          </Link>
        </motion.div>

        {/* Terminal Preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, type: "spring", damping: 15 }}
          className="mt-24 w-full max-w-4xl glass-card overflow-hidden shadow-2xl shadow-accent/5"
        >
          <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/50" />
              <div className="w-3 h-3 rounded-full bg-amber-500/50" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/50" />
            </div>
            <span className="text-xs font-mono text-slate-500 ml-4 italic">repoforge --chat</span>
          </div>
          <div className="p-8 text-left font-mono text-sm md:text-base leading-relaxed bg-slate-900/50">
            <div className="flex gap-3 mb-4">
              <span className="text-accent">❯</span>
              <span className="text-white">create a public repo named project-x</span>
            </div>
            <div className="text-slate-500 mb-6 flex items-center gap-2">
              <Terminal size={14} /> Parsing intent... Done.
            </div>
            <div className="flex gap-3 mb-4">
              <span className="text-emerald-400">✓</span>
              <span className="text-slate-300">Repository 'project-x' created successfully at </span>
              <span className="text-accent underline">github.com/user/project-x</span>
            </div>
            <div className="flex gap-3 mt-8">
              <span className="text-accent animate-pulse">❯</span>
              <span className="text-slate-600">_</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Features Grid */}
      <section id="features" className="px-8 py-32 max-w-7xl mx-auto w-full relative">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-4">Everything you need to automate</h2>
          <p className="text-slate-400">Powerful features wrapped in a simple natural language interface.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { 
              title: "Natural Language", 
              desc: "Talk to your GitHub like a human. No more memorizing git branch -D or git push origin --force.",
              icon: Sparkles
            },
            { 
              title: "Project Scaffolding", 
              desc: "Instant boilerplate for Node, Express, and React projects with a single command.",
              icon: Zap
            },
            { 
              title: "Audit & Security", 
              desc: "Complete history of every action with secure OAuth authentication and token storage.",
              icon: Shield
            }
          ].map((feat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -10 }}
              className="glass-card p-8 group hover:border-accent/30 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">
                <feat.icon size={24} />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/5 py-12 px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center text-accent-foreground">
              <Code2 size={18} />
            </div>
            <span className="font-bold text-white">RepoForge</span>
          </div>
          <p className="text-slate-500 text-sm">© 2024 RepoForge. Built for the modern developer.</p>
          <div className="flex items-center gap-6 text-slate-500">
            <Github size={20} className="hover:text-white cursor-pointer transition-colors" />
            <Globe size={20} className="hover:text-white cursor-pointer transition-colors" />
          </div>
        </div>
      </footer>
    </div>
  );
}
