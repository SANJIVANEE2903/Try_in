"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function LogoutPage() {
  const router = useRouter();
  
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4 text-slate-400">
        <Loader2 size={32} className="animate-spin text-accent" />
        <p className="text-sm">Signing you out...</p>
      </div>
    </div>
  );
}
