"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { FilePlus, Trash2, FileCode2 } from "lucide-react";
import { getOrCreateFile, deleteFile } from "@/hooks/useCollabDoc";

export function FileTree({
  doc,
  activeFile,
  onSelect,
}: {
  doc: Y.Doc;
  activeFile: string;
  onSelect: (filename: string) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    const order = doc.getArray<string>("fileOrder");
    const sync = () => setFiles(order.toArray());
    sync();
    order.observe(sync);
    return () => order.unobserve(sync);
  }, [doc]);

  const handleNewFile = () => {
    const name = window.prompt("New file name (e.g. utils.py)");
    if (!name || !name.trim()) return;
    const trimmed = name.trim();
    if (files.includes(trimmed)) {
      onSelect(trimmed);
      return;
    }
    getOrCreateFile(doc, trimmed, "");
    onSelect(trimmed);
  };

  const handleDelete = (e: React.MouseEvent, name: string) => {
    e.stopPropagation();
    if (files.length <= 1) return; // keep at least one file
    if (!window.confirm(`Delete ${name}? This can't be undone.`)) return;
    deleteFile(doc, name);
    if (activeFile === name) {
      const remaining = files.filter((f) => f !== name);
      if (remaining[0]) onSelect(remaining[0]);
    }
  };

  return (
    <div className="flex h-full flex-col bg-ink-900">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-ink-border">
        <span className="text-xs font-medium tracking-normal text-ink-400">Files</span>
        <button
          onClick={handleNewFile}
          aria-label="New file"
          className="text-ink-400 hover:text-ink-100 transition-colors"
        >
          <FilePlus size={15} />
        </button>
      </div>
      <ul className="flex-1 overflow-y-auto py-1">
        {files.map((name) => (
          <li key={name}>
            <button
              onClick={() => onSelect(name)}
              className={`group flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm font-code transition-colors ${
                name === activeFile
                  ? "bg-ink-800 text-ink-100"
                  : "text-ink-400 hover:bg-ink-800/60 hover:text-ink-100"
              }`}
            >
              <FileCode2 size={14} className="shrink-0 opacity-70" />
              <span className="truncate flex-1">{name}</span>
              {files.length > 1 && (
                <span
                  onClick={(e) => handleDelete(e, name)}
                  role="button"
                  aria-label={`Delete ${name}`}
                  className="opacity-0 group-hover:opacity-100 hover:text-err transition-opacity"
                >
                  <Trash2 size={13} />
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
