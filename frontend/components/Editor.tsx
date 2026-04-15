"use client";

import React, { useEffect, useRef, useState } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

interface EditorProps {
  roomSlug: string;
}

const CollaborativeEditor: React.FC<EditorProps> = ({ roomSlug }) => {
  const editorRef = useRef<any>(null);
  const [isSynced, setIsSynced] = useState(false);

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
        'editor.background': '#02020300', // transparent background for glass effect
        'editor.foreground': '#F5F5F7',
        'editorCursor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#FFFFFF05',
        'editorLineNumber.foreground': '#222222',
        'editor.selectionBackground': '#FFFFFF10',
      }
    });

    monaco.editor.setTheme('stealth-dark');

    // Initialize Yjs
    const doc = new Y.Doc();
    const serverUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
    
    // Connect to the Go Hub
    const provider = new WebsocketProvider(`${serverUrl}/ws`, roomSlug, doc);
    const type = doc.getText('monaco');

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
           <span className="text-[10px] font-mono text-muted uppercase tracking-tighter">TypeScript</span>
           <div className="w-px h-3 bg-white/10" />
           <button className="text-[10px] font-bold text-muted hover:text-foreground transition-colors uppercase tracking-widest">
             Export
           </button>
        </div>
      </div>

      {/* Actual Editor Stage */}
      <div className="flex-1 bg-transparent">
        <Editor
          height="100%"
          defaultLanguage="typescript"
          defaultValue="// Collaboration active. Code here..."
          theme="stealth-dark"
          options={{
            fontSize: 14,
            fontFamily: "'Geist Mono', ui-monospace, monospace",
            minimap: { enabled: false },
            padding: { top: 20 },
            scrollbar: {
              vertical: 'hidden',
              horizontal: 'hidden'
            },
            hideCursorInOverviewRuler: true,
            lineNumbersMinChars: 3,
            glyphMargin: false,
            folding: false,
            lineDecorationsWidth: 0,
            overviewRulerBorder: false,
            renderLineHighlight: 'all',
          }}
          onMount={handleEditorDidMount}
        />
      </div>
    </div>
  );
};

export default CollaborativeEditor;
