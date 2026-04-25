import Link from "next/link";
import { Code2, Terminal, Zap, Shield, ChevronRight, Github, Cpu, Globe } from "lucide-react";
import MobileNav from "@/components/MobileNav";

const features = [
  { icon: Terminal, title: "Natural Language CLI", desc: "Type commands like 'create repo my-app' or 'push my changes to main'. Our AI understands you.", color: "text-accent", bg: "bg-accent/10" },
  { icon: Zap, title: "Instant Execution", desc: "Commands are parsed, validated, and executed against the GitHub API in milliseconds.", color: "text-amber-400", bg: "bg-amber-400/10" },
  { icon: Shield, title: "Secure by Design", desc: "Your GitHub token is encrypted at rest with AES-256. Never stored in plain text.", color: "text-emerald-400", bg: "bg-emerald-400/10" },
  { icon: Cpu, title: "AI-Powered Parser", desc: "Advanced NLP engine maps your intent to the correct GitHub/Git action automatically.", color: "text-indigo-400", bg: "bg-indigo-400/10" },
  { icon: Github, title: "Full GitHub API", desc: "Create repos, manage PRs, handle issues, manage collaborators, and much more.", color: "text-purple-400", bg: "bg-purple-400/10" },
  { icon: Globe, title: "Web Dashboard", desc: "Monitor activity, view repositories, and run commands from your browser dashboard.", color: "text-pink-400", bg: "bg-pink-400/10" },
];

const steps = [
  { n: "01", t: "Install & Authenticate", d: "Run the CLI installer and authenticate with your GitHub token in seconds." },
  { n: "02", t: "Type Natural Commands", d: "Use plain English to tell RepoForge what you want to do with your repos." },
  { n: "03", t: "Watch it Execute", d: "Sit back as RepoForge handles the Git commands and GitHub API calls for you." },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 overflow-hidden relative">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes glow { 0%,100% { opacity: 0.4; } 50% { opacity: 0.7; } }
        .anim-1 { animation: fadeUp 0.6s ease forwards; }
        .anim-2 { animation: fadeUp 0.6s 0.1s ease both; }
        .anim-3 { animation: fadeUp 0.6s 0.2s ease both; }
        .anim-4 { animation: fadeUp 0.6s 0.3s ease both; }
        .glow-orb { animation: glow 4s ease-in-out infinite; }
        .hero-badge { animation: fadeIn 0.5s ease forwards; }
      `}</style>

      {/* Background Glows */}
      <div className="glow-orb absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-400/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="glow-orb absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-5 max-w-7xl mx-auto w-full z-50 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-400/30">
            <Code2 className="text-slate-900" size={22} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white font-outfit">RepoForge</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-white transition-colors">How it Works</a>
          <Link href="/auth/login" className="bg-white/5 border border-white/10 px-5 py-2 rounded-xl text-white hover:bg-white/10 transition-all">
            Sign In
          </Link>
          <Link href="/auth/login" className="bg-cyan-400 text-slate-900 px-5 py-2 rounded-xl font-bold hover:brightness-110 transition-all shadow-lg shadow-cyan-400/20">
            Get Started
          </Link>
        </div>

        {/* Mobile Nav (client component for toggle) */}
        <MobileNav />
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 py-24 text-center max-w-5xl mx-auto w-full">
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-8">
          <Zap size={12} /> AI-Powered GitHub Management
        </div>

        <h1 className="anim-1 text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] mb-6 font-outfit">
          Control GitHub with{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
            Natural Language
          </span>
        </h1>

        <p className="anim-2 text-xl text-slate-400 max-w-2xl leading-relaxed mb-10">
          RepoForge translates plain English into GitHub actions. Create repos, manage PRs, push code — all from a single command.
        </p>

        <div className="anim-3 flex flex-col sm:flex-row gap-4 w-full justify-center">
          <Link
            href="/auth/login"
            className="bg-cyan-400 text-slate-900 px-8 py-4 rounded-2xl font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-cyan-400/20 flex items-center justify-center gap-2"
          >
            Get Started for Free <ChevronRight size={20} />
          </Link>
          <Link
            href="/docs"
            className="bg-slate-900 border border-white/10 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 text-white"
          >
            View Documentation
          </Link>
        </div>

        {/* Terminal preview */}
        <div className="anim-4 mt-16 w-full max-w-2xl bg-slate-900 rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-black/50 text-left">
          <div className="flex items-center gap-2 px-5 py-3 bg-white/5 border-b border-white/5">
            <div className="w-3 h-3 rounded-full bg-red-500/60" />
            <div className="w-3 h-3 rounded-full bg-amber-500/60" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/60" />
            <span className="ml-3 text-xs font-mono text-slate-500">repoforge-terminal</span>
          </div>
          <div className="p-6 font-mono text-sm space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-cyan-400">❯</span>
              <span className="text-white">create public repo named my-saas-app</span>
            </div>
            <div className="text-emerald-400 pl-6">✔ Repository 'my-saas-app' created successfully</div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400">❯</span>
              <span className="text-white">create PR from dev to main</span>
            </div>
            <div className="text-emerald-400 pl-6">✔ Pull Request #12 opened successfully</div>
            <div className="flex items-center gap-3">
              <span className="text-cyan-400">❯</span>
              <span className="text-slate-400 animate-pulse">_</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6 max-w-7xl mx-auto w-full">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white font-outfit mb-4">Everything You Need</h2>
          <p className="text-slate-400 max-w-xl mx-auto">A complete developer toolkit for GitHub automation, built for speed and simplicity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="bg-slate-900/60 border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all hover:-translate-y-1 duration-200">
              <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-5`}>
                <f.icon size={24} className={f.color} />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-4xl mx-auto text-center mb-16">
          <h2 className="text-4xl font-bold text-white font-outfit mb-4">How It Works</h2>
          <p className="text-slate-400">Get from zero to running GitHub commands in under 2 minutes.</p>
        </div>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.n} className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center mx-auto">
                <span className="text-2xl font-bold text-cyan-400 font-mono">{s.n}</span>
              </div>
              <h3 className="text-white font-bold text-lg">{s.t}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.d}</p>
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute" />
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center max-w-4xl mx-auto w-full">
        <h2 className="text-4xl md:text-5xl font-bold text-white font-outfit mb-6">
          Ready to supercharge your GitHub workflow?
        </h2>
        <p className="text-slate-400 mb-10 text-lg">Join developers who use RepoForge to ship faster.</p>
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 bg-cyan-400 text-slate-900 px-10 py-4 rounded-2xl font-bold text-lg hover:brightness-110 transition-all shadow-xl shadow-cyan-400/20"
        >
          Start for Free <ChevronRight size={20} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 px-6 text-center text-slate-600 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>© 2026 RepoForge. Built for developers.</span>
          <div className="flex gap-6">
            <Link href="/docs" className="hover:text-slate-400 transition-colors">Docs</Link>
            <Link href="/auth/login" className="hover:text-slate-400 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
