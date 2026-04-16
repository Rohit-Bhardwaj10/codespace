"use client";

import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { FileCode2, Terminal, Plus, X } from 'lucide-react';

interface EditorProps {
  roomSlug: string;
}

const SUPPORTED_LANGUAGES = [
  { id: 'typescript', label: 'TypeScript', ext: 'ts' },
  { id: 'javascript', label: 'JavaScript', ext: 'js' },
  { id: 'python', label: 'Python', ext: 'py' },
  { id: 'go', label: 'Go', ext: 'go' },
  { id: 'cpp', label: 'C++', ext: 'cpp' },
];

const CollaborativeEditor: React.FC<EditorProps> = ({ roomSlug }) => {
  const editorRef = useRef<any>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const docRef = useRef<Y.Doc | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const mapRef = useRef<Y.Map<string> | null>(null);
  const filesMapRef = useRef<Y.Map<Y.Text> | null>(null);
  
  const [isSynced, setIsSynced] = useState(false);
  const [language, setLanguage] = useState('typescript');
  const [activeFile, setActiveFile] = useState('main.ts');
  const [files, setFiles] = useState<string[]>(['main.ts']);
  const [isExecuting, setIsExecuting] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  // Derive Language from file extension
  useEffect(() => {
    const ext = activeFile.split('.').pop();
    const lang = SUPPORTED_LANGUAGES.find(l => l.ext === ext);
    if (lang && lang.id !== language) {
      setLanguage(lang.id);
      mapRef.current?.set('language', lang.id);
    }
  }, [activeFile, language]);

  const bindFileToEditor = (fileName: string) => {
    if (!editorRef.current || !filesMapRef.current || !providerRef.current) return;

    let ytext = filesMapRef.current.get(fileName);
    if (!ytext) {
      ytext = new Y.Text('// New File\n');
      filesMapRef.current.set(fileName, ytext);
    }

    if (bindingRef.current) {
      bindingRef.current.destroy();
    }

    bindingRef.current = new MonacoBinding(
      ytext,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      providerRef.current.awareness
    );
  };

  // Run whenever activeFile changes
  useEffect(() => {
    bindFileToEditor(activeFile);
  }, [activeFile]);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;

    monaco.editor.defineTheme('stealth-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '666666', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FFFFFF', fontWeight: 'bold' },
        { token: 'string', foreground: 'A1A1A1' },
      ],
      colors: {
        'editor.background': '#020203',
        'editor.foreground': '#F5F5F7',
        'editorCursor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#FFFFFF05',
        'editorLineNumber.foreground': '#444444',
        'editor.selectionBackground': '#FFFFFF15',
      }
    });

    monaco.editor.setTheme('stealth-dark');

    const doc = new Y.Doc();
    docRef.current = doc;
    const serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    
    const provider = new WebsocketProvider(`${serverUrl}/ws`, roomSlug, doc);
    providerRef.current = provider;

    const metadataMap = doc.getMap<string>('metadata');
    mapRef.current = metadataMap;

    const filesMap = doc.getMap<Y.Text>('files_v2');
    filesMapRef.current = filesMap;

    // Observe Files
    filesMap.observe(() => {
      setFiles(Array.from(filesMap.keys()));
    });

    metadataMap.observe(() => {
      const syncedLang = metadataMap.get('language');
      if (syncedLang && syncedLang !== language) setLanguage(syncedLang);
      
      const syncedOut = metadataMap.get('output');
      if (syncedOut !== undefined && syncedOut !== output) setOutput(syncedOut || null);
    });

    provider.on('sync', (isSyncedState: boolean) => {
      if (isSyncedState) {
        setFiles(Array.from(filesMap.keys()));
        if (!filesMap.has('main.ts') && Array.from(filesMap.keys()).length === 0) {
          filesMap.set('main.ts', new Y.Text('// Collaboration active.\n'));
        }
        
        // Initial binding
        bindFileToEditor(activeFile);
      }
    });

    provider.on('status', (event: any) => {
      setIsSynced(event.status === 'connected');
    });

    return () => {
      if (bindingRef.current) bindingRef.current.destroy();
      provider.disconnect();
      doc.destroy();
    };
  };

  const createNewFile = () => {
    const extMatch = SUPPORTED_LANGUAGES.find(l => l.id === language);
    const newName = `file_${files.length + 1}.${extMatch?.ext || 'ts'}`;
    filesMapRef.current?.set(newName, new Y.Text(''));
    setActiveFile(newName);
  };

  const handleExecute = async () => {
    if (!editorRef.current) return;
    setIsExecuting(true);
    setOutput("Executing on Secure Ephemeral Docker Engine...");
    
    try {
      const code = editorRef.current.getValue();
      const apiUrl = process.env.NEXT_PUBLIC_WS_URL 
        ? process.env.NEXT_PUBLIC_WS_URL.replace('ws://', 'http://').replace('wss://', 'https://')
        : 'http://localhost:8080';

      const langMap: Record<string, number> = {
        'typescript': 74,
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
      
      const outStr = data.compile_output || data.stderr 
        ? `[Pipeline Error]\n${data.compile_output || ''}\n${data.stderr || ''}`
        : `[Term: Process Exited 0] (${data.time}s)\n${data.stdout || ''}`;
        
      setOutput(outStr);
      mapRef.current?.set('output', outStr);
    } catch (e) {
      const outStr = "API Error: Docker RCE executing backend failed.";
      setOutput(outStr);
      mapRef.current?.set('output', outStr);
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="relative w-full h-full flex glass rounded-2xl overflow-hidden border">
      
      {/* LEFT SIDEBAR - FILE TREE */}
      <div className="w-48 border-r bg-[#020203]/50 flex flex-col z-10 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <span className="text-[10px] uppercase font-bold text-muted tracking-widest flex items-center gap-2">
            <FileCode2 size={12} /> Files
          </span>
          <button onClick={createNewFile} className="text-muted hover:text-emerald-400 transition-colors">
            <Plus size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-1 p-2 overflow-y-auto flex-1">
          {files.map(f => (
            <button 
              key={f}
              onClick={() => setActiveFile(f)}
              className={`text-left px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                activeFile === f ? 'bg-white/10 text-white' : 'text-muted hover:text-white hover:bg-white/5'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN EDITOR COLUMN */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Editor ToolBar */}
        <div className="flex items-center justify-between px-6 py-3 border-b bg-[#020203]">
          <div className="flex items-center gap-3">
            <div className={`w-1.5 h-1.5 rounded-full ${isSynced ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
            <span className="text-[10px] font-bold tracking-widest text-muted uppercase">
              {isSynced ? 'Live Sync Active' : 'Connecting Engine...'}
            </span>
          </div>
          <div className="flex items-center gap-6">
             <select 
               value={language}
               onChange={(e) => {
                 setLanguage(e.target.value);
                 mapRef.current?.set('language', e.target.value);
               }}
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
              theme="stealth-dark"
              options={{
                fontSize: 15,
                fontFamily: "'Geist Mono', Consolas, 'Courier New', monospace",
                minimap: { enabled: true, renderCharacters: false, scale: 0.75 },
                padding: { top: 24, bottom: 24 },
                scrollbar: {
                  vertical: 'visible',
                  horizontal: 'visible',
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
          
          {/* Output Terminal Emulation */}
          {output !== null && (
            <div className="h-56 border-t border-[#333] bg-[#0C0C0F] flex flex-col relative z-20 shadow-2xl">
               <div className="flex items-center justify-between px-4 py-2 border-b border-[#222] bg-[#020203]">
                 <span className="text-[10px] uppercase font-bold text-muted tracking-widest flex items-center gap-2">
                   <Terminal size={12} /> Process Terminal
                 </span>
                 <button onClick={() => { setOutput(null); mapRef.current?.set('output', ''); }} className="text-muted hover:text-rose-400 transition-colors">
                   <X size={14} />
                 </button>
               </div>
               <div className="flex-1 p-4 overflow-y-auto">
                 <pre className={`text-sm font-mono whitespace-pre-wrap ${output.includes('[Pipeline Error]') || output.includes('Error:') ? 'text-rose-400' : 'text-emerald-400'}`}>
                   <span className="text-muted/50 select-none">$ docker run --rm -i ephemeral_sandbox</span>
                   <br/><br/>
                   {output}
                 </pre>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CollaborativeEditor;
