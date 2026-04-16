"use client";

import React, { use, useState } from 'react';
import CollaborativeEditor from '@/components/Editor';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function RoomPage({ params }: PageProps) {
  const { slug } = use(params);
  const router = useRouter();
  const [radioActive, setRadioActive] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  React.useEffect(() => {
    const validateRoom = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_WS_URL 
          ? process.env.NEXT_PUBLIC_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://')
          : 'http://localhost:8080';
        
        const res = await fetch(`${apiUrl}/room/${slug}`);
        if (!res.ok) {
          router.push('/');
        } else {
          setIsValidating(false);
        }
      } catch (err) {
        console.error("Failed to validate room", err);
        // Fallback or handle offline
        setIsValidating(false);
      }
    };
    validateRoom();
  }, [slug, router]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    // Add real toast or visual feedback here in Phase 3
    alert("Room URL copied to clipboard.");
  };

  if (isValidating) {
    return (
      <div className="h-screen w-full bg-background flex flex-col items-center justify-center gap-6">
         <div className="w-8 h-8 rounded-full border-t-2 border-r-2 border-emerald-500 animate-spin" />
         <div className="text-xs font-mono uppercase tracking-widest text-muted">Securing uplink...</div>
      </div>
    );
  }

  return (
    <div className="relative h-screen bg-background flex flex-col font-sans overflow-hidden selection:bg-white/10 selection:text-white">
      {/* Background Layer */}
      <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Persistent Header */}
      <header className="relative z-20 flex items-center justify-between px-6 py-4 glass border-b">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 bg-foreground flex items-center justify-center rounded-md transition-transform group-hover:rotate-12">
               <div className="w-3 h-0.5 bg-background rounded-full" />
            </div>
            <span className="text-sm font-bold tracking-tighter text-gradient uppercase">Codespace</span>
          </Link>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-muted tracking-wide">STAGE://</span>
            <span className="text-foreground font-bold tracking-widest uppercase">{slug}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Participants Indicator */}
           <div className="flex items-center gap-3 mr-4">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Active Stream</span>
           </div>
           
           <button 
             onClick={handleCopyLink}
             className="h-9 px-4 glass glass-hover rounded-xl text-[10px] font-bold tracking-widest uppercase text-foreground transition-all"
           >
             Share Link
           </button>
        </div>
      </header>

      {/* Multi-Pane Workspace */}
      <main className="flex-1 flex overflow-hidden p-6 gap-6">
        
        {/* Left Control Dock */}
        <aside className="w-16 flex flex-col items-center py-8 glass rounded-2xl gap-8">
           <button title="Explorer" className="w-10 h-10 flex items-center justify-center rounded-xl glass-hover text-muted hover:text-foreground">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
           </button>
           <button title="Settings" className="w-10 h-10 flex items-center justify-center rounded-xl glass-hover text-muted hover:text-foreground">
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
           </button>
           
           <div className="mt-auto w-8 h-px bg-white/5" />
           
           {/* Focus Radio Toggle */}
           <button 
            title="Focus Mode (Lo-Fi)" 
            onClick={() => setRadioActive(!radioActive)}
            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${radioActive ? 'bg-foreground text-background scale-110 shadow-[0_0_12px_rgba(255,255,255,0.2)]' : 'glass-hover text-muted hover:text-foreground'}`}
           >
             <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
           </button>
        </aside>

        {/* Editor Main Deck */}
        <div className="flex-1 relative flex">
           <CollaborativeEditor roomSlug={slug} />
        </div>

      </main>

      {/* Integrated Console Bar */}
      <footer className="h-10 mx-6 mb-6 flex items-center px-6 justify-between glass border border-white/5 rounded-xl">
         <div className="flex items-center gap-4">
           <div className="flex items-center gap-3">
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[9px] font-mono tracking-widest text-muted uppercase">Terminal Stream Ready</span>
           </div>
         </div>
         <div className="flex items-center gap-6">
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest">UTF-8 / NO_ERRORS</span>
            <div className="w-px h-3 bg-white/10" />
            <span className="text-[9px] font-mono text-muted uppercase tracking-widest italic">Cursor: 1:1</span>
         </div>
      </footer>

    </div>
  );
}
