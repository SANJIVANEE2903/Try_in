import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { motion } from "framer-motion";
import { 
  Github, Mail, Lock, LayoutDashboard, 
  FolderGit2, Activity, Settings, Search, LogOut,
  Star, GitFork, GitCommit
} from "lucide-react";
import "./styles.css";

// --- Types ---
type ViewState = 'landing' | 'auth' | 'dashboard';

// --- MOCK DATA FOR VISUAL DASHBOARD ---
// Since the website no longer uses GitHub tokens (CLI only), we display visual analytics.
const mockRepos = [
  { id: 1, name: "repoforge-v2", desc: "AI-powered CLI and SaaS Dashboard for GitHub management.", private: false, stars: 142, forks: 23 },
  { id: 2, name: "nextjs-saas-starter", desc: "Production-ready SaaS template with Supabase Auth.", private: true, stars: 0, forks: 0 },
  { id: 3, name: "api-gateway", desc: "High-performance Rust API Gateway for microservices.", private: true, stars: 0, forks: 0 },
  { id: 4, name: "react-animations", desc: "Framer Motion components library.", private: false, stars: 89, forks: 12 },
];

const mockActivity = [
  { id: 1, action: "Created repository", repo: "repoforge-v2", time: "2 hours ago" },
  { id: 2, action: "Starred repository", repo: "vercel/next.js", time: "5 hours ago" },
  { id: 3, action: "Deleted repository", repo: "old-test-project", time: "1 day ago" },
];

// --- AUTH PAGE COMPONENT ---
function AuthPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuthLogin = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: { redirectTo: window.location.origin }
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError(err.message || "Failed to initialize OAuth.");
    }
    setLoading(false);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Hardcoded Demo Credentials (Bypasses Supabase if keys aren't set)
    if (email === "admin@repoforge.com" && password === "admin") {
      onLogin();
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // If login fails, try signup for demo purposes
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) setError(signUpError.message);
        else onLogin(); // Successful signup
      } else {
        onLogin(); // Successful login
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to authentication server.");
    }
    setLoading(false);
  };

  return (
    <div className="auth-container">
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="auth-header">
          <div className="logo-text" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>
            <FolderGit2 size={28} /> RepoForge
          </div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Manage your repositories effortlessly</p>
          <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: 'rgba(0, 229, 255, 0.1)', border: '1px solid rgba(0, 229, 255, 0.2)', borderRadius: '0.5rem', fontSize: '0.85rem', color: '#00e5ff' }}>
            <strong>Demo Mode Active</strong><br/>
            Email: admin@repoforge.com<br/>
            Password: admin
          </div>
        </div>

        {error && <div style={{ color: '#ef4444', marginBottom: '1rem', fontSize: '0.9rem' }}>{error}</div>}

        <button className="btn-oauth" onClick={handleOAuthLogin} disabled={loading}>
          <Github size={20} /> Continue with GitHub
        </button>

        <div className="auth-divider">or</div>

        <form className="auth-form" onSubmit={handleEmailLogin}>
          <div className="input-group">
            <Mail className="input-icon" />
            <input 
              type="email" 
              placeholder="Email address" 
              className="auth-input"
              value={email} onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <Lock className="input-icon" />
            <input 
              type="password" 
              placeholder="Password" 
              className="auth-input"
              value={password} onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Signing in..." : "Sign In with Email"}
          </button>
        </form>

      </motion.div>
    </div>
  );
}

// --- DASHBOARD COMPONENT ---
type Tab = 'dashboard' | 'repositories' | 'activity' | 'settings';

function Dashboard({ session, onLogout }: { session: any, onLogout: () => void }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const user = session?.user;
  const email = user?.email || "developer@example.com";
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="logo-text">
          <FolderGit2 size={24} /> RepoForge
        </div>
        
        <nav className="nav-links">
          <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}><LayoutDashboard size={20} /> Dashboard</div>
          <div className={`nav-item ${activeTab === 'repositories' ? 'active' : ''}`} onClick={() => setActiveTab('repositories')}><FolderGit2 size={20} /> Repositories</div>
          <div className={`nav-item ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}><Activity size={20} /> Activity</div>
          <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={20} /> Settings</div>
        </nav>

        <div className="user-profile">
          <div className="avatar">{initial}</div>
          <div className="user-info">
            <div className="user-email">{email}</div>
          </div>
          <LogOut size={18} style={{color: '#8892b0', cursor: 'pointer'}} onClick={onLogout} />
        </div>
      </aside>

      <main className="main-content">
        <header className="top-bar">
          <h2 style={{fontFamily: 'Outfit', fontWeight: 700, textTransform: 'capitalize'}}>{activeTab}</h2>
          <div className="search-bar">
            <Search size={18} color="#8892b0" />
            <input type="text" placeholder="Search repositories..." />
          </div>
        </header>

        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        >
          {activeTab === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <div style={{color: '#8892b0', fontSize: '0.9rem', fontWeight: 500}}>Total Repositories</div>
                  <div className="stat-value">24</div>
                </div>
                <div className="stat-card">
                  <div style={{color: '#8892b0', fontSize: '0.9rem', fontWeight: 500}}>Stars Earned</div>
                  <div className="stat-value">231</div>
                </div>
                <div className="stat-card">
                  <div style={{color: '#8892b0', fontSize: '0.9rem', fontWeight: 500}}>Recent Commits</div>
                  <div className="stat-value">89</div>
                </div>
              </div>
              <h3 className="section-title">Pinned Repositories</h3>
              <div className="repo-grid" style={{marginBottom: '3rem'}}>
                {mockRepos.slice(0, 2).map(repo => (
                  <div className="repo-card" key={repo.id}>
                    <div className="repo-header">
                      <div className="repo-name">
                        <FolderGit2 size={18} color="#00e5ff" /> {repo.name}
                      </div>
                      <span className="repo-badge">{repo.private ? "Private" : "Public"}</span>
                    </div>
                    <p className="repo-desc">{repo.desc}</p>
                    <div className="repo-stats">
                      <div className="stat"><Star size={16} /> {repo.stars}</div>
                      <div className="stat"><GitFork size={16} /> {repo.forks}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'repositories' && (
            <div className="repo-grid" style={{marginBottom: '3rem'}}>
              {mockRepos.map(repo => (
                <div className="repo-card" key={repo.id}>
                  <div className="repo-header">
                    <div className="repo-name">
                      <FolderGit2 size={18} color="#00e5ff" /> {repo.name}
                    </div>
                    <span className="repo-badge">{repo.private ? "Private" : "Public"}</span>
                  </div>
                  <p className="repo-desc">{repo.desc}</p>
                  <div className="repo-stats">
                    <div className="stat"><Star size={16} /> {repo.stars}</div>
                    <div className="stat"><GitFork size={16} /> {repo.forks}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="activity-list">
              {mockActivity.map(act => (
                <div className="activity-item" key={act.id}>
                  <GitCommit className="activity-icon" size={20} />
                  <div className="activity-content">
                    <p><strong>{act.action}</strong> in {act.repo}</p>
                    <div className="activity-time">{act.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{color: 'var(--text-secondary)'}}>
              <p>Settings panel coming soon.</p>
              <br/>
              <p>In this premium SaaS version, your token management and automation configurations will live here.</p>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}

// --- LANDING PAGE (UNCHANGED) ---
function LandingPage({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="landing-container">
      <header className="header" style={{marginBottom: '0'}}>
        <div className="logo-text"><FolderGit2 size={24}/> RepoForge</div>
        <button className="btn-outline" onClick={onLogin}>Login</button>
      </header>

      <section className="hero-section" style={{textAlign: 'center', padding: '8rem 0', animation: 'slideUp 0.6s ease-out'}}>
        <h1 style={{fontFamily: 'Outfit', fontSize: '5.5rem', fontWeight: 900, lineHeight: 1.05, marginBottom: '1rem'}}>
          GitHub, Managed by<br/><span style={{background: 'var(--accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'}}>Artificial Intelligence.</span>
        </h1>
        <button className="btn-large" onClick={onLogin} style={{background: 'var(--accent-gradient)', color: 'white', border: 'none', padding: '1.2rem 3rem', borderRadius: '4rem', fontSize: '1.25rem', fontWeight: 700, cursor: 'pointer', marginTop: '2rem'}}>
          Get Started
        </button>
      </section>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
export default function App() {
  const [view, setView] = useState<ViewState>('landing');
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        if (session) setView('dashboard');
      })
      .catch((err) => {
        console.warn("Supabase auth session fetch failed (expected if using dummy keys):", err);
      });

    const authListener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) setView('dashboard');
      else setView('landing');
    });

    return () => {
      if (authListener?.data?.subscription) {
        authListener.data.subscription.unsubscribe();
      }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('landing');
  };

  if (view === 'landing') return <LandingPage onLogin={() => setView('auth')} />;
  if (view === 'auth') return <AuthPage onLogin={() => setView('dashboard')} />;
  if (view === 'dashboard') return <Dashboard session={session} onLogout={handleLogout} />;
  
  return null;
}
