"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [roomSlug, setRoomSlug] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (roomSlug.trim()) {
      router.push(`/room/${roomSlug.trim().toLowerCase()}`);
    }
  };

  const handleCreate = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_WS_URL 
        ? process.env.NEXT_PUBLIC_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://')
        : 'http://localhost:8080';
        
      const response = await fetch(`${apiUrl}/room/new`, { method: "POST" });
      
      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      router.push(`/room/${data.slug}`);
    } catch (error) {
      console.error("Error creating room:", error);
      // Fallback to local random slug if backend is unreachable 
      const randomSlug = Math.random().toString(36).substring(7);
      router.push(`/room/${randomSlug}`);
    }
  };

  return (
    <div className="relative min-h-screen bg-background flex flex-col selection:bg-white/10 selection:text-white overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-full bg-blue-500/5 blur-[120px] animate-pulse-slow pointer-events-none" />

      {/* Navigation */}
      <nav className="relative z-20 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 bg-foreground flex items-center justify-center rounded-xl transition-transform group-hover:rotate-12">
             <div className="w-4 h-1 bg-background rounded-full" />
          </div>
          <span className="text-xl font-bold tracking-tighter text-gradient uppercase">Codespace</span>
        </div>
        <div className="flex items-center gap-10 text-xs font-bold tracking-widest text-muted uppercase">
          <Link href="#" className="hover:text-foreground transition-all">Manual</Link>
          <button className="glass px-6 py-2 rounded-full text-foreground glass-hover">
            Account
          </button>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-4xl mx-auto flex flex-col gap-12">
          
          <div className="flex flex-col gap-6">
            <div className="mx-auto flex items-center gap-2 px-3 py-1 rounded-full border bg-white/5 text-[9px] uppercase tracking-widest font-bold text-muted">
              Live & Synchronized
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-gradient leading-none">
              Code. Share.<br />Build.
            </h1>
            <p className="max-w-xl mx-auto text-lg text-muted">
              A minimalist workspace for high-speed collaboration. 
              Built for developers who value focus over noise.
            </p>
          </div>

          <div className="max-w-md mx-auto w-full p-2 glass rounded-3xl">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1 px-6 flex items-center">
                 <input 
                  type="text" 
                  placeholder="Enter workspace ID..."
                  value={roomSlug}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
                  onChange={(e) => setRoomSlug(e.target.value)}
                  className="text-lg text-foreground placeholder:text-muted h-14 w-full bg-transparent outline-none focus:ring-0"
                 />
              </div>
              <button 
                onClick={handleJoin}
                className="h-14 px-8 bg-foreground text-background rounded-2xl font-bold text-lg hover:opacity-90"
              >
                Join
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-6">
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted/50">Or accelerate with a fresh stage</p>
            <button 
              onClick={handleCreate}
              className="group flex items-center gap-4 glass glass-hover px-6 py-4 rounded-2xl"
            >
              <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8E8E93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-foreground">Create New Space</div>
                <div className="text-[9px] text-muted font-mono uppercase tracking-widest">Immediate Deployment</div>
              </div>
            </button>
          </div>
        </div>
      </main>

      <footer className="relative z-10 px-8 py-10 flex items-center justify-between max-w-7xl mx-auto w-full border-t border-white/5 opacity-40">
        <div className="text-[10px] font-mono text-muted uppercase tracking-widest">
           SYSTEM_VER: 1.0.42
        </div>
        <div className="flex items-center gap-4">
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
           <span className="text-[10px] font-bold tracking-widest uppercase text-muted">Backend Online</span>
        </div>
      </footer>
    </div>
  );
}
