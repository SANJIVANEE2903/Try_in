"use client";

import { signIn, getProviders } from "next-auth/react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Github, Mail, Shield, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSignIn = async (provider: "github" | "google") => {
    setLoading(provider);
    await signIn(provider, { callbackUrl: "/dashboard" });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(0,229,255,0.08),transparent_60%)] pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 mb-6">
            <Shield size={32} className="text-accent" />
          </div>
          <h1 className="text-3xl font-bold text-white font-outfit tracking-tight">Welcome to RepoForge</h1>
          <p className="text-slate-400 mt-2 text-sm">Sign in to manage your GitHub with natural language</p>
        </div>

        {/* Auth Card */}
        <div className="glass-card p-8 space-y-4">
          {/* GitHub Login */}
          <button
            onClick={() => handleSignIn("github")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === "github" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Github size={20} />
            )}
            Continue with GitHub
          </button>

          {/* Google Login */}
          <button
            onClick={() => handleSignIn("google")}
            disabled={loading !== null}
            className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 hover:border-white/20 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading === "google" ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <div className="relative flex justify-center text-xs text-slate-600">
              <span className="bg-slate-900 px-3">SECURED BY OAUTH 2.0</span>
            </div>
          </div>

          <p className="text-center text-xs text-slate-600 leading-relaxed">
            By signing in, you agree to our{" "}
            <span className="text-slate-400 hover:text-accent cursor-pointer transition-colors">Terms of Service</span>
            {" "}and{" "}
            <span className="text-slate-400 hover:text-accent cursor-pointer transition-colors">Privacy Policy</span>.
          </p>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          Your GitHub token is encrypted and never stored in plain text.
        </p>
      </motion.div>
    </div>
  );
}
