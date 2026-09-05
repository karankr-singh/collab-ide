"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { WS_URL } from "@/lib/config";
import { colorForUser, randomGuestName } from "@/lib/identity";

export interface PresenceUser {
  clientId: number;
  name: string;
  color: string;
}

/**
 * Sets up (or reuses) a Y.Doc synced over the room's WebSocket channel.
 *
 * Document shape:
 *  - ydoc.getMap("files")       -> filename (string) -> Y.Text (file contents)
 *  - ydoc.getArray("fileOrder") -> string[]           (display order of files)
 *
 * Every file in the room shares this single doc/connection, so switching
 * the active file is just re-binding Monaco to a different Y.Text — no
 * extra round trip, and file-tree edits (create/rename/delete) replicate
 * to everyone instantly via the same CRDT sync stream.
 */
export function useCollabDoc(roomId: string) {
  const [connected, setConnected] = useState(false);
  const [users, setUsers] = useState<PresenceUser[]>([]);
  // Yjs + y-websocket touch `window`/`WebSocket` as soon as they're
  // constructed, so this must happen client-side inside an effect —
  // never during the render pass, or Next's SSR pass will crash with
  // "window is not defined".
  const [conn, setConn] = useState<{ doc: Y.Doc; provider: WebsocketProvider } | null>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const wsProvider = new WebsocketProvider(WS_URL, roomId, ydoc, { connect: true });

    const name = randomGuestName();
    const color = colorForUser(String(wsProvider.awareness.clientID));
    wsProvider.awareness.setLocalStateField("user", { name, color });

    const onStatus = ({ status }: { status: string }) => setConnected(status === "connected");
    const onAwarenessChange = () => {
      const states = Array.from(wsProvider.awareness.getStates().entries());
      setUsers(
        states
          .filter(([, state]) => state?.user)
          .map(([clientId, state]) => ({
            clientId,
            name: state.user.name,
            color: state.user.color,
          }))
      );
    };

    wsProvider.on("status", onStatus);
    wsProvider.awareness.on("change", onAwarenessChange);
    onAwarenessChange();

    setConn({ doc: ydoc, provider: wsProvider });

    return () => {
      wsProvider.off("status", onStatus);
      wsProvider.awareness.off("change", onAwarenessChange);
      wsProvider.destroy();
      ydoc.destroy();
      setConn(null);
    };
  }, [roomId]);

  return { doc: conn?.doc ?? null, provider: conn?.provider ?? null, connected, users };
}

/** Gets (creating if needed) the shared Y.Text for a file, plus the ordered file list. */
export function getOrCreateFile(doc: Y.Doc, filename: string, starterContent = ""): Y.Text {
  const files = doc.getMap<Y.Text>("files");
  let text = files.get(filename);
  if (!text) {
    text = new Y.Text();
    if (starterContent) text.insert(0, starterContent);
    files.set(filename, text);
    const order = doc.getArray<string>("fileOrder");
    if (!order.toArray().includes(filename)) order.push([filename]);
  }
  return text;
}

export function deleteFile(doc: Y.Doc, filename: string) {
  doc.getMap<Y.Text>("files").delete(filename);
  const order = doc.getArray<string>("fileOrder");
  const idx = order.toArray().indexOf(filename);
  if (idx !== -1) order.delete(idx, 1);
}
