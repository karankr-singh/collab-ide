"use client";

import { useState } from "react";
import { Play, Loader2, X } from "lucide-react";
import { API_URL } from "@/lib/config";
import type { LanguageId } from "@/lib/config";

interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export function Console({
  code,
  language,
  open,
  onClose,
}: {
  code: string;
  language: LanguageId;
  open: boolean;
  onClose: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`${API_URL}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Execution failed");
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not reach the execution server");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div
      className={`flex flex-col border-t border-ink-border bg-ink-950 transition-[height] ${
        open ? "h-56" : "h-10"
      }`}
    >
      <div className="flex items-center justify-between px-3 h-10 shrink-0 border-b border-ink-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-ink-400">Console</span>
          {result && !running && (
            <span
              className={`text-[11px] font-code ${
                result.exitCode === 0 ? "text-ok" : "text-err"
              }`}
            >
              exit {result.exitCode}
              {result.timedOut ? " (timed out)" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={run}
            disabled={running}
            className="flex items-center gap-1.5 rounded bg-accent px-3 py-1 text-xs font-semibold text-ink-950 hover:bg-accent-dim disabled:opacity-60 transition-colors"
          >
            {running ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            {running ? "Running" : "Run"}
          </button>
          <button
            onClick={onClose}
            aria-label={open ? "Collapse console" : "Expand console"}
            className="text-ink-400 hover:text-ink-100"
          >
            <X size={14} className={open ? "" : "rotate-45"} />
          </button>
        </div>
      </div>

      {open && (
        <div className="flex-1 overflow-y-auto px-3 py-2 font-code text-[12.5px] leading-relaxed">
          {!running && !result && !error && (
            <p className="text-ink-400">Output from your last run will appear here.</p>
          )}
          {error && <p className="text-err whitespace-pre-wrap">{error}</p>}
          {result?.stdout && (
            <pre className="whitespace-pre-wrap text-ink-100">{result.stdout}</pre>
          )}
          {result?.stderr && (
            <pre className="whitespace-pre-wrap text-err">{result.stderr}</pre>
          )}
          {result && !result.stdout && !result.stderr && (
            <p className="text-ink-400">Program ran with no output.</p>
          )}
        </div>
      )}
    </div>
  );
}
