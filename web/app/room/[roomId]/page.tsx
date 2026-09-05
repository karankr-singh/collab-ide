"use client";

import { use, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import * as Y from "yjs";
import { useCollabDoc, getOrCreateFile } from "@/hooks/useCollabDoc";
import { TopBar } from "@/components/TopBar";
import { FileTree } from "@/components/FileTree";
import { Console } from "@/components/Console";

// monaco-editor (via y-monaco) touches browser globals at module-evaluation
// time, which crashes Next's server render pass. Loading it only on the
// client sidesteps that entirely.
const CodeEditor = dynamic(
  () => import("@/components/CodeEditor").then((m) => m.CodeEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-sm text-ink-400">
        Loading editor…
      </div>
    ),
  }
);
import { SUPPORTED_LANGUAGES, STARTER_CODE, type LanguageId } from "@/lib/config";
import { monacoLanguageForFile } from "@/lib/fileLanguage";

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);
  const { doc, provider, connected, users } = useCollabDoc(roomId);

  const [language, setLanguage] = useState<LanguageId>("python");
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [fileText, setFileText] = useState<Y.Text | null>(null);
  const [snapshot, setSnapshot] = useState("");
  const [consoleOpen, setConsoleOpen] = useState(true);

  // Ensure a starter file exists the first time anyone opens this room.
  useEffect(() => {
    if (!doc) return;
    const defaultFile = SUPPORTED_LANGUAGES.find((l) => l.id === language)!.defaultFile;
    const text = getOrCreateFile(doc, defaultFile, STARTER_CODE[language]);
    setActiveFile(defaultFile);
    setFileText(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc]);

  // Keep a plain-string snapshot of the active file for the Run button,
  // since the Console posts raw code to the execution API.
  useEffect(() => {
    if (!fileText) return;
    const sync = () => setSnapshot(fileText.toString());
    sync();
    fileText.observe(sync);
    return () => fileText.unobserve(sync);
  }, [fileText]);

  const selectFile = (filename: string) => {
    if (!doc) return;
    setActiveFile(filename);
    setFileText(getOrCreateFile(doc, filename));
  };

  if (!doc || !provider || !activeFile || !fileText) {
    return (
      <div className="flex h-dvh items-center justify-center bg-ink text-ink-400 text-sm">
        Connecting to room…
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col bg-ink text-ink-100">
      <TopBar
        roomId={roomId}
        connected={connected}
        users={users}
        language={language}
        onLanguageChange={setLanguage}
      />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 shrink-0 border-r border-ink-border">
          <FileTree doc={doc} activeFile={activeFile} onSelect={selectFile} />
        </aside>
        <main className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-ink-border bg-ink-900 px-3 py-1.5">
            <span className="rounded bg-ink-800 px-2 py-0.5 text-xs font-code text-ink-100">
              {activeFile}
            </span>
          </div>
          <div className="flex-1 overflow-hidden">
            <CodeEditor
              fileText={fileText}
              provider={provider}
              monacoLanguage={monacoLanguageForFile(activeFile)}
            />
          </div>
          <Console
            code={snapshot}
            language={language}
            open={consoleOpen}
            onClose={() => setConsoleOpen((o) => !o)}
          />
        </main>
      </div>
    </div>
  );
}
