"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 p-6 bg-slate-900/95 backdrop-blur-xl border-b border-white/10 flex flex-col gap-5 md:hidden z-50 shadow-2xl">
          <a href="#features" onClick={() => setOpen(false)} className="text-slate-300 font-medium hover:text-white transition-colors">Features</a>
          <a href="#how-it-works" onClick={() => setOpen(false)} className="text-slate-300 font-medium hover:text-white transition-colors">How it Works</a>
          <div className="flex flex-col gap-3 pt-4 border-t border-white/5">
            <Link href="/auth/login" onClick={() => setOpen(false)} className="w-full py-3 text-center rounded-xl bg-white/5 text-white font-bold border border-white/10 hover:bg-white/10 transition-all">
              Sign In
            </Link>
            <Link href="/auth/login" onClick={() => setOpen(false)} className="w-full py-3 text-center rounded-xl bg-cyan-400 text-slate-900 font-bold hover:brightness-110 transition-all shadow-lg shadow-cyan-400/20">
              Get Started
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
