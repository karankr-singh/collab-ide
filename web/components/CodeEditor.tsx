"use client";

import { useEffect, useRef } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import type { editor } from "monaco-editor";

export function CodeEditor({
  fileText,
  provider,
  monacoLanguage,
}: {
  fileText: Y.Text;
  provider: WebsocketProvider;
  monacoLanguage: string;
}) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleMount: OnMount = (editorInstance) => {
    editorRef.current = editorInstance;
    bindEditor();
  };

  const bindEditor = () => {
    const editorInstance = editorRef.current;
    if (!editorInstance) return;

    bindingRef.current?.destroy();

    const model = editorInstance.getModel();
    if (!model) return;

    bindingRef.current = new MonacoBinding(
      fileText,
      model,
      new Set([editorInstance]),
      provider.awareness
    );
  };

  // Re-bind whenever the active file (Y.Text instance) changes, since
  // Monaco keeps a single editor instance but we swap which document
  // (and therefore which Y.Text) it displays.
  useEffect(() => {
    bindEditor();
    return () => {
      bindingRef.current?.destroy();
      bindingRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileText]);

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={monacoLanguage}
      onMount={handleMount}
      options={{
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        fontSize: 13.5,
        minimap: { enabled: false },
        smoothScrolling: true,
        padding: { top: 12 },
        scrollBeyondLastLine: false,
        automaticLayout: true,
      }}
    />
  );
}
