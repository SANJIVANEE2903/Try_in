"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const errorMessages: Record<string, string> = {
  Configuration: "There is a server configuration issue. Please contact support.",
  AccessDenied: "You did not grant the required permissions. Please try again.",
  Verification: "The sign-in link has expired. Please request a new one.",
  Default: "An unexpected error occurred. Please try signing in again.",
  OAuthSignin: "Could not start the OAuth flow. Please try again.",
  OAuthCallback: "Could not complete the OAuth sign-in. Please try again.",
  OAuthCreateAccount: "Could not create your account. Please try again.",
};

function ErrorContent() {
  const params = useSearchParams();
  const error = params.get("error") || "Default";
  const message = errorMessages[error] || errorMessages.Default;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md"
    >
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
          <ShieldAlert size={32} className="text-red-400" />
        </div>
        <h1 className="text-3xl font-bold text-white font-outfit">Authentication Error</h1>
        <p className="text-slate-400 mt-2 text-sm">{message}</p>
      </div>

      <div className="glass-card p-8 space-y-4">
        <Link
          href="/auth/login"
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-accent text-accent-foreground font-semibold hover:brightness-110 transition-all"
        >
          Try Again
        </Link>
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all"
        >
          <ArrowLeft size={18} /> Back to Home
        </Link>
      </div>
    </motion.div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(239,68,68,0.05),transparent_60%)] pointer-events-none" />
      <Suspense fallback={<div className="text-slate-400">Loading...</div>}>
        <ErrorContent />
      </Suspense>
    </div>
  );
}
