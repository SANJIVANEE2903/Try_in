"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Terminal, 
  Zap, 
  ShieldCheck, 
  Github, 
  Code2, 
  Activity, 
  Copy, 
  Check,
  ChevronRight,
  BookOpen,
  Layout,
  Cpu,
  Workflow,
  Key,
  Info,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { id: "quick-start", label: "Quick Start Guide", icon: Zap },
  { id: "auth", label: "Authentication", icon: Key },
  { id: "ai-console", label: "AI Command Console", icon: Terminal },
  { id: "scaffolding", label: "Project Scaffolding", icon: Layout },
  { id: "health", label: "Repo Health Analysis", icon: Activity },
  { id: "automation", label: "GitHub Automation", icon: Github },
  { id: "workflows", label: "Workflow Examples", icon: Workflow },
];

const CodeBlock = ({ code, label }: { code: string; label?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="group relative bg-slate-900 rounded-xl border border-white/5 overflow-hidden my-4">
      {label && (
        <div className="px-4 py-2 bg-white/5 border-b border-white/5 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
          {label}
        </div>
      )}
      <div className="p-4 font-mono text-sm text-slate-300 overflow-x-auto whitespace-pre">
        {code}
      </div>
      <button 
        onClick={copy}
        className="absolute top-2 right-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all opacity-0 group-hover:opacity-100"
      >
        {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
      </button>
    </div>
  );
};

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("quick-start");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      setIsMenuOpen(false);
    }
  };

  return (
    <div className="flex h-full relative flex-col lg:flex-row">
      {/* Mobile Docs Navigator */}
      <div className="lg:hidden p-4 border-b border-white/5 sticky top-0 z-20 bg-background/80 backdrop-blur-md">
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="w-full flex items-center justify-between px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium text-slate-300"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={16} />
            {menuItems.find(m => m.id === activeSection)?.label || "Select Section"}
          </div>
          <ChevronDown size={16} className={cn("transition-transform", isMenuOpen && "rotate-180")} />
        </button>
        
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full left-4 right-4 mt-2 p-2 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-30 space-y-1"
            >
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => scrollTo(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all",
                    activeSection === item.id ? "bg-accent/10 text-accent" : "text-slate-400"
                  )}
                >
                  <item.icon size={14} />
                  {item.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Sticky Left Sidebar Navigation (Desktop) */}
      <aside className="w-64 border-r border-white/5 p-6 space-y-8 sticky top-0 h-full hidden lg:block overflow-y-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="text" 
            placeholder="Search docs..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
          />
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium",
                activeSection === item.id 
                  ? "bg-accent/10 text-accent border border-accent/20" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="pt-6 border-t border-white/5">
          <div className="p-4 rounded-xl bg-gradient-to-br from-accent/10 to-indigo-500/10 border border-accent/10">
            <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-2">
              <Zap size={14} className="text-accent" /> Pro Feature
            </h4>
            <p className="text-[10px] text-slate-400 leading-relaxed mb-3">
              Unlock advanced automation and team collaboration.
            </p>
            <button className="w-full py-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-lg hover:brightness-110 transition-all">
              Upgrade Now
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto px-8 py-12 lg:px-20 scroll-smooth custom-scrollbar">
        <div className="max-w-4xl mx-auto space-y-24 pb-32">
          
          {/* Header Section */}
          <header className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold uppercase tracking-widest">
              <BookOpen size={14} /> Developer Documentation
            </div>
            <h1 className="text-5xl font-bold text-white tracking-tight font-outfit">RepoForge Documentation</h1>
            <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
              Master the art of repository management. Learn how to use natural language to control your entire GitHub infrastructure.
            </p>
          </header>

          <hr className="border-white/5" />

          {/* Quick Start Guide */}
          <section id="quick-start" className="space-y-8 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center text-accent">
                <Zap size={24} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Quick Start Guide</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-accent text-sm font-bold">1</div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Install CLI</h3>
                    <p className="text-sm text-slate-400">Run our one-line installer in your PowerShell terminal.</p>
                  </div>
                </div>
                <CodeBlock code="iwr -useb repoforge.com/install.ps1 | iex" label="PowerShell" />
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-accent text-sm font-bold">2</div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Authenticate</h3>
                    <p className="text-sm text-slate-400">Securely link your GitHub account via OAuth.</p>
                  </div>
                </div>
                <CodeBlock code="repoforge auth login" label="CLI Command" />
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-accent text-sm font-bold">3</div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Start Chatting</h3>
                    <p className="text-sm text-slate-400">Open the interactive natural language console.</p>
                  </div>
                </div>
                <CodeBlock code="repoforge chat" label="CLI Command" />
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center text-accent text-sm font-bold">4</div>
                  <div>
                    <h3 className="text-white font-bold mb-1">Create First Repo</h3>
                    <p className="text-sm text-slate-400">Speak to the AI to create your first repository.</p>
                  </div>
                </div>
                <CodeBlock code="create a public repo named project-one" label="AI Console" />
              </div>
            </div>
          </section>

          {/* Authentication Section */}
          <section id="auth" className="space-y-8 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Key size={24} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Authentication</h2>
            </div>
            <p className="text-slate-400 leading-relaxed">
              RepoForge uses a dual-authentication system to ensure maximum security across both the CLI and the Web UI.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass-card p-6 bg-slate-900/40">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/5"><Terminal size={18} className="text-slate-300" /></div>
                  <h4 className="text-white font-bold">CLI Authentication</h4>
                </div>
                <p className="text-sm text-slate-500 mb-4">Uses a Personal Access Token (PAT) stored securely in your system's keychain.</p>
                <div className="flex items-center gap-2 text-[10px] text-accent font-mono">
                  <ShieldCheck size={12} /> SECURED VIA AES-256
                </div>
              </div>

              <div className="glass-card p-6 border-accent/20 bg-accent/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-white/5"><Github size={18} className="text-accent" /></div>
                  <h4 className="text-white font-bold">Website OAuth</h4>
                </div>
                <p className="text-sm text-slate-500 mb-4">Direct GitHub OAuth 2.0 integration for seamless dashboard access.</p>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400 font-mono">
                  <Check size={12} /> VERIFIED BY GITHUB
                </div>
              </div>
            </div>
          </section>

          {/* AI Console Depth */}
          <section id="ai-console" className="space-y-8 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Terminal size={24} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">AI Command Console</h2>
            </div>
            
            <div className="space-y-6">
              <div className="bg-slate-900/60 rounded-2xl p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Cpu size={120} />
                </div>
                <h4 className="text-lg font-bold text-white mb-4">How it works</h4>
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                   <div className="flex-1 space-y-2 text-center md:text-left">
                     <div className="text-accent font-bold">Natural Language</div>
                     <p className="text-sm text-slate-500 italic">"Push my current changes to main"</p>
                   </div>
                   <ChevronRight className="rotate-90 md:rotate-0 text-slate-700" />
                   <div className="flex-1 space-y-2 text-center md:text-left">
                     <div className="text-white font-bold">NLP Parser</div>
                     <p className="text-sm text-slate-500">Mapping intent to Git services</p>
                   </div>
                   <ChevronRight className="rotate-90 md:rotate-0 text-slate-700" />
                   <div className="flex-1 space-y-2 text-center md:text-left">
                     <div className="text-emerald-400 font-bold">Execution</div>
                     <p className="text-sm text-slate-500">git push origin main</p>
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-white font-bold">Command Examples</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["create repo dyp", "push my code", "create PR from dev to main", "star repoforge"].map((cmd) => (
                    <button key={cmd} className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-accent/30 transition-all">
                      <span className="font-mono text-sm text-slate-300">{cmd}</span>
                      <ChevronRight size={14} className="text-slate-600 group-hover:text-accent transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Scaffolding Section */}
          <section id="scaffolding" className="space-y-8 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Layout size={24} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Project Scaffolding</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {[
                 { t: "Express API", tag: "Backend", icon: Code2 },
                 { t: "React App", tag: "Frontend", icon: Cpu },
                 { t: "Next.js App", tag: "Fullstack", icon: Zap }
               ].map((temp) => (
                 <div key={temp.t} className="glass-card p-6 bg-slate-900/40 border-white/5">
                   <div className="flex items-center justify-between mb-4">
                      <temp.icon size={20} className="text-accent" />
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-slate-500 uppercase font-bold tracking-tighter">{temp.tag}</span>
                   </div>
                   <h4 className="text-white font-bold mb-2">{temp.t}</h4>
                   <p className="text-xs text-slate-500 leading-relaxed">Full boilerplate including ESLint, Prettier, and basic routing.</p>
                 </div>
               ))}
            </div>

            <div className="bg-slate-950 rounded-2xl p-6 border border-white/5">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Generated Folder Structure</h4>
              <div className="font-mono text-sm space-y-1">
                <div className="flex items-center gap-2 text-white"><ChevronDown size={14} /> my-app/</div>
                <div className="flex items-center gap-2 pl-6 text-slate-400"><ChevronDown size={14} /> src/</div>
                <div className="pl-12 text-slate-500">├── index.js</div>
                <div className="pl-12 text-slate-500">├── controllers/</div>
                <div className="pl-12 text-slate-500">└── models/</div>
                <div className="flex items-center gap-2 pl-6 text-slate-400"><Layout size={14} className="text-blue-500" /> public/</div>
                <div className="pl-6 text-slate-300 flex items-center gap-2"><Code2 size={14} className="text-amber-500" /> package.json</div>
                <div className="pl-6 text-slate-500">└── README.md</div>
              </div>
            </div>
          </section>

          {/* Repo Health Check */}
          <section id="health" className="space-y-8 scroll-mt-24">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Activity size={24} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Repo Health Analysis</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-6">
                 <p className="text-slate-400 leading-relaxed">
                   Our AI engine analyzes your repository's pulse in real-time. It doesn't just look at code; it looks at the velocity and health of your entire development lifecycle.
                 </p>
                 <div className="space-y-4">
                    {[
                      { label: "Commit Frequency", val: 88 },
                      { label: "Issue Resolution Rate", val: 65 },
                      { label: "Code Consistency", val: 92 }
                    ].map(m => (
                      <div key={m.label} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                          <span className="text-slate-500">{m.label}</span>
                          <span className="text-white">{m.val}%</span>
                        </div>
                        <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             whileInView={{ width: `${m.val}%` }}
                             className={cn("h-full", m.val > 80 ? "bg-accent" : m.val > 60 ? "bg-amber-400" : "bg-red-500")}
                           />
                        </div>
                      </div>
                    ))}
                 </div>
               </div>

               <div className="glass-card p-8 bg-slate-900 border-amber-500/20">
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="text-white font-bold">Health Snapshot</h4>
                    <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold">78% ⚠️</div>
                  </div>
                  <div className="space-y-6 font-mono text-sm text-slate-300">
                    <div className="flex items-start gap-3">
                      <span className="text-slate-600">▪</span>
                      <span>Last commit: <span className="text-slate-500">5 days ago</span></span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-slate-600">▪</span>
                      <span>Open issues: <span className="text-amber-500">12</span></span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="text-slate-600">▪</span>
                      <span>Health Check: <span className="text-emerald-500">Passed</span></span>
                    </div>
                    <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
                       <div className="text-[10px] text-slate-600 font-bold uppercase">AI Insights</div>
                       <p className="text-xs text-slate-500 italic">"Low commit activity detected. We recommend increasing frequency to maintain project pulse."</p>
                    </div>
                  </div>
               </div>
            </div>
          </section>

          {/* Workflow Example */}
          <section id="workflows" className="space-y-8 scroll-mt-24 pb-20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Workflow size={24} />
              </div>
              <h2 className="text-3xl font-bold text-white tracking-tight">Workflow Examples</h2>
            </div>

            <div className="relative">
               <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/10" />
               <div className="space-y-12">
                  {[
                    { t: "Scaffold", desc: "Initialize a new production-ready API.", cmd: "create express project named user-service" },
                    { t: "Commit", desc: "Save your progress with AI-assisted messages.", cmd: "commit fixed the auth middleware" },
                    { t: "Automate", desc: "Open a pull request for team review.", cmd: "create PR from dev to main" },
                    { t: "Collaborate", desc: "Add team members to the project.", cmd: "add collaborator @chaitanya" }
                  ].map((step, i) => (
                    <div key={i} className="relative pl-10">
                      <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center z-10">
                        <div className="w-2 h-2 rounded-full bg-accent" />
                      </div>
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white font-bold">{step.t}</h4>
                          <p className="text-sm text-slate-500">{step.desc}</p>
                        </div>
                        <CodeBlock code={step.cmd} label="Example Command" />
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          </section>

        </div>
      </main>

      {/* Progress Scroll Indicator */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-accent origin-left z-50 lg:left-64"
        style={{ scaleX: 1 }} // This would be dynamic in a real Next.js scroll listener
      />
    </div>
  );
}
