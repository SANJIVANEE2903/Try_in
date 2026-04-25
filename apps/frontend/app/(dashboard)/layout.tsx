"use client";

import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Menu, Bell } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex bg-mesh min-h-screen">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-4 lg:px-8 backdrop-blur-sm sticky top-0 z-10 bg-background/50">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="hidden sm:flex items-center gap-4">
              <span className="text-slate-500 text-sm">App</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-100 font-medium">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <button className="p-2 text-slate-400 hover:text-white transition-colors">
              <Bell size={20} />
            </button>
            <div className="hidden xs:block h-8 w-px bg-white/10 mx-2"></div>
            <button className="bg-accent text-accent-foreground px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-accent/20 hover:brightness-110 transition-all">
              Pro Version
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-0">
          {children}
        </main>
      </div>
    </div>
  );
}
