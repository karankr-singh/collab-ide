"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [joinId, setJoinId] = useState("");

  const startSession = () => {
    router.push(`/room/${nanoid(8)}`);
  };

  const joinSession = (e: React.FormEvent) => {
    e.preventDefault();
    const id = joinId.trim();
    if (id) router.push(`/room/${id}`);
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ink px-6">
      <div className="w-full max-w-md">
        <pre className="font-code text-[13px] leading-relaxed text-ink-400 mb-8 select-none">
          <span className="text-accent">function</span> <span className="text-ink-100">pair</span>() {"{"}
          {"\n"}  <span className="text-accent">const</span> room = <span className="text-ok">create</span>();
          {"\n"}  <span className="text-accent">return</span> room.<span className="text-ink-100">invite</span>(everyone);
          {"\n"}
          {"}"}
        </pre>

        <h1 className="text-2xl font-semibold tracking-tight text-ink-100">
          Cursor &amp; Comma
        </h1>
        <p className="mt-2 text-sm text-ink-400 max-w-sm">
          Write and run code together, live. Open a room, share the link, and
          watch each other type — Python, JavaScript, Go, and C++ execute in
          an isolated sandbox with one click.
        </p>

        <button
          onClick={startSession}
          className="mt-6 flex items-center gap-2 rounded bg-accent px-4 py-2 text-sm font-semibold text-ink-950 hover:bg-accent-dim transition-colors"
        >
          Start a session
          <ArrowRight size={15} />
        </button>

        <form onSubmit={joinSession} className="mt-3 flex items-center gap-2">
          <input
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            placeholder="or paste a room code"
            className="flex-1 rounded border border-ink-border bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-400 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            className="rounded border border-ink-border px-3 py-2 text-sm text-ink-100 hover:border-accent hover:text-accent transition-colors"
          >
            Join
          </button>
        </form>
      </div>
    </div>
  );
}
