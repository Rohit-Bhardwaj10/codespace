"use client";

import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

interface EditorProps {
  roomSlug: string;
}

const SUPPORTED_LANGUAGES = [
  { id: 'typescript', label: 'TypeScript' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'go', label: 'Go' },
  { id: 'cpp', label: 'C++' },
];

const CollaborativeEditor: React.FC<EditorProps> = ({ roomSlug }) => {
  const editorRef = useRef<any>(null);
  const mapRef = useRef<Y.Map<string> | null>(null);
  const [isSynced, setIsSynced] = useState(false);
  const [language, setLanguage] = useState('typescript');

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    if (mapRef.current) {
      mapRef.current.set('language', newLang);
    }
  };

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom elite obsidian theme
    monaco.editor.defineTheme('stealth-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '666666', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FFFFFF', fontWeight: 'bold' },
        { token: 'string', foreground: 'A1A1A1' },
      ],
      colors: {
        'editor.background': '#020203', // Solid background prevents artifacting
        'editor.foreground': '#F5F5F7',
        'editorCursor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#FFFFFF05',
        'editorLineNumber.foreground': '#444444',
        'editor.selectionBackground': '#FFFFFF15',
      }
    });

    monaco.editor.setTheme('stealth-dark');

    // Initialize Yjs
    const doc = new Y.Doc();
    const serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    
    // Connect to the Go Hub
    const provider = new WebsocketProvider(`${serverUrl}/ws`, roomSlug, doc);
    const type = doc.getText('monaco');
    const map = doc.getMap<string>('metadata');
    mapRef.current = map;

    map.observe(() => {
      const syncedLang = map.get('language');
      if (syncedLang && syncedLang !== language) {
        setLanguage(syncedLang);
      }
      const syncedOut = map.get('output');
      if (syncedOut !== undefined && syncedOut !== output) {
        setOutput(syncedOut || null);
      }
    });

    provider.on('sync', (isSynced: boolean) => {
      if (isSynced) {
        const syncedLang = map.get('language');
        if (syncedLang) {
          setLanguage(syncedLang);
        }
        const syncedOut = map.get('output');
        if (syncedOut !== undefined) {
          setOutput(syncedOut || null);
        }
      }
    });

    // Bind Yjs to Monaco
    const binding = new MonacoBinding(
      type,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );

    provider.on('status', (event: any) => {
      setIsSynced(event.status === 'connected');
    });

    return () => {
      provider.disconnect();
      doc.destroy();
    };
  };

  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const handleExecute = async () => {
    if (!editorRef.current) return;
    setIsExecuting(true);
    setOutput("Executing on secure container...");
    
    try {
      const code = editorRef.current.getValue();
      const apiUrl = process.env.NEXT_PUBLIC_WS_URL 
        ? process.env.NEXT_PUBLIC_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://')
        : 'http://localhost:8080';

      const langMap: Record<string, number> = {
        'typescript': 74, // Note: Judge0 might only support JS natively (63) depending on config, using TS 74
        'javascript': 63,
        'python': 71,
        'go': 95,
        'cpp': 54,
      };

      const res = await fetch(`${apiUrl}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          language_id: langMap[language] || 63, 
          source_code: code 
        })
      });
      const data = await res.json();
      
      if (data.stderr || data.compile_output) {
        const outStr = `[Error]\n${data.compile_output || ''}\n${data.stderr || ''}`;
        setOutput(outStr);
        mapRef.current?.set('output', outStr);
      } else {
        const outStr = `[Execution Time: ${data.time}s]\n${data.stdout || 'Success.'}`;
        setOutput(outStr);
        mapRef.current?.set('output', outStr);
      }
    } catch (e) {
      const outStr = "API Error: Backend execution failed (Check Judge0 connectivity).";
      setOutput(outStr);
      mapRef.current?.set('output', outStr);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col glass rounded-2xl overflow-hidden border">
      {/* Editor ToolBar */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
          <span className="text-[10px] font-bold tracking-widest text-muted uppercase">
            {isSynced ? 'Live Sync Active' : 'Connecting to Node...'}
          </span>
        </div>
        <div className="flex items-center gap-6">
           <select 
             value={language}
             onChange={handleLanguageChange}
             className="bg-transparent text-[10px] font-mono text-muted uppercase tracking-tighter outline-none cursor-pointer hover:text-foreground transition-colors appearance-none"
           >
             {SUPPORTED_LANGUAGES.map((lang) => (
               <option key={lang.id} value={lang.id} className="bg-[#020203] text-foreground">
                 {lang.label}
               </option>
             ))}
           </select>
           <div className="w-px h-3 bg-white/10" />
           <button 
             onClick={handleExecute}
             disabled={isExecuting}
             className={`h-7 px-4 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${isExecuting ? 'bg-white/10 text-muted opacity-50 cursor-not-allowed' : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'}`}
           >
             {isExecuting ? 'Running...' : 'Run Code'}
           </button>
        </div>
      </div>

      {/* Actual Editor Stage */}
      <div className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 relative">
          <Editor
            height="100%"
            language={language}
            defaultLanguage="typescript"
            defaultValue="// Collaboration active. Code here..."
            theme="stealth-dark"
            options={{
              fontSize: 15,
              fontFamily: "'Geist Mono', Consolas, 'Courier New', monospace",
              minimap: { enabled: true, renderCharacters: false, scale: 0.75 },
              padding: { top: 24, bottom: 24 },
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 10,
                horizontalScrollbarSize: 10,
                useShadows: false,
              },
              cursorSmoothCaretAnimation: "on",
              smoothScrolling: true,
              wordWrap: "on",
              lineHeight: 1.6,
              hideCursorInOverviewRuler: true,
              lineNumbersMinChars: 3,
              glyphMargin: true,
              folding: true,
              renderLineHighlight: 'all',
            }}
            onMount={handleEditorDidMount}
          />
        </div>
        
        {/* Output Console Console */}
        {output !== null && (
          <div className="h-48 border-t bg-[#020203] flex flex-col relative z-20">
             <div className="flex items-center justify-between px-4 py-2 border-b bg-white/[0.01]">
               <span className="text-[10px] uppercase font-bold text-muted tracking-widest">Compiler Output</span>
               <button onClick={() => { setOutput(null); mapRef.current?.set('output', ''); }} className="text-muted hover:text-foreground">
                 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
             </div>
             <div className="flex-1 p-4 overflow-y-auto">
               <pre className={`text-xs font-mono whitespace-pre-wrap ${output.includes('[Error]') ? 'text-red-400' : 'text-emerald-400'}`}>
                 {output}
               </pre>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollaborativeEditor;
