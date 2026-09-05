import { WebSocketServer } from "ws";
import { setupWSConnection } from "y-websocket/bin/utils";
import { URL } from "url";

/**
 * Attaches a Yjs CRDT sync server to an existing HTTP server.
 *
 * Room identity: the WebSocket path (e.g. /ws/<roomId>) becomes the Yjs
 * document name, so every client connecting to the same room path shares
 * the same CRDT document and gets automatic conflict-free merging plus
 * awareness (remote cursors / presence).
 *
 * For multi-node horizontal scaling, set Y_REDIS=1 and configure the
 * y-redis persistence adapter (see README) so document updates fan out
 * across server instances via Redis Pub/Sub instead of living only in
 * this process's memory.
 */
export function attachCollabWebSocketServer(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on("upgrade", (request, socket, head) => {
    const { pathname } = new URL(request.url, `http://${request.headers.host}`);

    if (!pathname.startsWith("/ws/")) {
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit("connection", ws, request);
    });
  });

  wss.on("connection", (conn, req) => {
    const roomId = req.url.replace(/^\/ws\//, "").split("?")[0];
    // setupWSConnection binds the socket to a shared Y.Doc keyed by docName
    // (here, the roomId) and handles sync + awareness protocol messages.
    setupWSConnection(conn, req, { docName: roomId, gc: true });
  });

  console.log("[collab] Yjs WebSocket server attached at /ws/<roomId>");
  return wss;
}
