import express from "express";
import cors from "cors";
import { submitExecution, isRedisBacked } from "./executionQueue.js";
import { LANGUAGE_CONFIG } from "./dockerRunner.js";

// Very small in-memory rate limiter: N executions per IP per minute.
// Swap for a Redis-backed limiter (e.g. rate-limiter-flexible) once
// running multi-node in production.
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;
const hits = new Map();

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const bucket = hits.get(key) || [];
  const recent = bucket.filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }
  recent.push(now);
  hits.set(key, recent);
  next();
}

export function createApiServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "256kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, redisBacked: isRedisBacked() });
  });

  app.get("/api/languages", (_req, res) => {
    res.json({ languages: Object.keys(LANGUAGE_CONFIG) });
  });

  app.post("/api/execute", rateLimit, async (req, res) => {
    const { language, code } = req.body || {};

    if (typeof code !== "string" || code.length === 0) {
      return res.status(400).json({ error: "`code` is required" });
    }
    if (code.length > 50_000) {
      return res.status(400).json({ error: "Code exceeds maximum length (50,000 chars)" });
    }
    if (!Object.keys(LANGUAGE_CONFIG).includes(language)) {
      return res.status(400).json({
        error: `Unsupported language. Choose one of: ${Object.keys(LANGUAGE_CONFIG).join(", ")}`,
      });
    }

    try {
      const result = await submitExecution({ language, code });
      res.json(result);
    } catch (err) {
      console.error("[api] execution error:", err);
      res.status(500).json({ error: err.message || "Execution failed" });
    }
  });

  return app;
}
