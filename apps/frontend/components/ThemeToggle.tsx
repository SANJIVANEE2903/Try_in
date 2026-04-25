"use client";

import { useTheme } from "./ThemeProvider";
import { Moon, Sun } from "lucide-react";
import { motion } from "framer-motion";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={toggleTheme}
      className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-accent transition-all relative overflow-hidden group"
      aria-label="Toggle Theme"
    >
      <div className="relative z-10">
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
      </div>
      <div className="absolute inset-0 bg-accent/0 group-hover:bg-accent/5 transition-colors" />
    </motion.button>
  );
}
