"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  FolderGit2, 
  Terminal, 
  Activity, 
  Settings, 
  ChevronRight,
  BookOpen,
  X,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Repositories", href: "/repos", icon: FolderGit2 },
  { name: "AI Console", href: "/console", icon: Terminal },
  { name: "Activity", href: "/activity", icon: Activity },
  { name: "Documentation", href: "/docs", icon: BookOpen },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean; setIsOpen: (v: boolean) => void }) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-[100] w-72 h-screen glass-sidebar flex flex-col p-6 transition-transform duration-300",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center justify-between mb-12 px-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center animate-glow">
              <FolderGit2 className="text-accent-foreground" size={24} />
            </div>
            <span className="text-2xl font-bold font-display tracking-tight text-white">RepoForge</span>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} onClick={() => setIsOpen(false)}>
                <div className={cn("nav-item", isActive && "active")}>
                  <Icon size={20} />
                  <span className="flex-1 font-medium">{item.name}</span>
                  {isActive && <ChevronRight size={16} />}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-white/5 space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-indigo-500 p-[2px]">
              <div className="w-full h-full rounded-full bg-slate-950 flex items-center justify-center text-sm font-bold">JD</div>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">John Developer</p>
              <p className="text-xs text-slate-500 truncate">Pro Account</p>
            </div>
          </div>
          <Link 
            href="/auth/logout"
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all group"
          >
            <LogOut size={18} className="group-hover:translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Log Out</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
