import "dotenv/config";
import http from "http";
import { createApiServer } from "./api.js";
import { attachCollabWebSocketServer } from "./wsServer.js";
import { initExecutionQueue } from "./executionQueue.js";

const PORT = process.env.PORT || 4000;

async function main() {
  await initExecutionQueue();

  const app = createApiServer();
  const server = http.createServer(app);

  attachCollabWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`[server] REST API + WS collab server listening on :${PORT}`);
    console.log(`[server]   REST:  http://localhost:${PORT}/api/health`);
    console.log(`[server]   WS:    ws://localhost:${PORT}/ws/<roomId>`);
  });
}

main().catch((err) => {
  console.error("[server] fatal startup error:", err);
  process.exit(1);
});
