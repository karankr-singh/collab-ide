"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { SUPPORTED_LANGUAGES, type LanguageId } from "@/lib/config";
import type { PresenceUser } from "@/hooks/useCollabDoc";

export function TopBar({
  roomId,
  connected,
  users,
  language,
  onLanguageChange,
}: {
  roomId: string;
  connected: boolean;
  users: PresenceUser[];
  language: LanguageId;
  onLanguageChange: (lang: LanguageId) => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-ink-border bg-ink-900 px-4">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold tracking-tight">Cursor &amp; Comma</span>
        <span className="text-ink-border">/</span>
        <span className="font-code text-xs text-ink-400">{roomId}</span>
        <span
          className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-ok" : "bg-err"}`}
          title={connected ? "Connected" : "Reconnecting…"}
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex -space-x-2">
          {users.slice(0, 6).map((u) => (
            <div
              key={u.clientId}
              title={u.name}
              className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-ink-900 text-[10px] font-semibold text-ink-950"
              style={{ backgroundColor: u.color }}
            >
              {u.name.charAt(0)}
            </div>
          ))}
        </div>

        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as LanguageId)}
          className="rounded border border-ink-border bg-ink-800 px-2 py-1 text-xs text-ink-100 focus:outline-none"
        >
          {SUPPORTED_LANGUAGES.map((l) => (
            <option key={l.id} value={l.id}>
              {l.label}
            </option>
          ))}
        </select>

        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 rounded border border-ink-border px-2.5 py-1 text-xs text-ink-100 hover:border-accent hover:text-accent transition-colors"
        >
          {copied ? <Check size={13} /> : <Link2 size={13} />}
          {copied ? "Copied" : "Share"}
        </button>
      </div>
    </header>
  );
}
