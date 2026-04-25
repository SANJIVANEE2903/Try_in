"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Github, Loader2, ShieldCheck } from "lucide-react";

export default function GitHubAuthPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Authenticating with GitHub...");
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    const stages = [
      { t: 0, m: "Connecting to GitHub..." },
      { t: 30, m: "Verifying OAuth Scope..." },
      { t: 60, m: "Securing Session..." },
      { t: 90, m: "Finalizing Profile..." }
    ];

    const messageTimer = setInterval(() => {
      const currentStage = [...stages].reverse().find(s => progress >= s.t);
      if (currentStage) setStatus(currentStage.m);
    }, 100);

    const redirectTimer = setTimeout(() => {
      router.push("/dashboard");
    }, 2500);

    return () => {
      clearInterval(timer);
      clearInterval(messageTimer);
      clearTimeout(redirectTimer);
    };
  }, [progress, router]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,229,255,0.05),transparent)] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-12 max-w-md w-full flex flex-col items-center text-center relative z-10"
      >
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative z-10">
            <Github size={40} className="text-white" />
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="absolute -inset-4 border-2 border-dashed border-accent/20 rounded-full"
          />
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">Almost there!</h1>
        <p className="text-slate-400 text-sm mb-8">{status}</p>

        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-accent shadow-[0_0_15px_rgba(0,229,255,0.5)]"
          />
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <ShieldCheck size={14} className="text-emerald-500" />
          Secure OAuth 2.0 Encryption Active
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex items-center gap-2 text-slate-600 text-sm"
      >
        <Loader2 size={16} className="animate-spin" />
        Redirecting to RepoForge Dashboard
      </motion.div>
    </div>
  );
}
