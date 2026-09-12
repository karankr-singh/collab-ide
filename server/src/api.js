import express from "express";
import cors from "cors";
import { submitExecution, isRedisBacked } from "./executionQueue.js";
import { LANGUAGE_CONFIG } from "./dockerRunner.js";

const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;
const hits = new Map();

function rateLimit(req, res, next) {
  const key = req.ip;
  const now = Date.now();
  const bucket = hits.get(key) || [];
  const recent = bucket.filter((timestamp) => now - timestamp < RATE_WINDOW_MS);

  if (recent.length >= RATE_LIMIT) {
    return res.status(429).json({ error: "Rate limit exceeded. Try again in a minute." });
  }

  recent.push(now);
  hits.set(key, recent);

  // Avoid retaining inactive IPs forever in the in-memory limiter.
  if (hits.size > 10_000) {
    for (const [ip, timestamps] of hits) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_WINDOW_MS)) {
        hits.delete(ip);
      }
    }
  }

  next();
}

function getCorsOptions() {
  const configured = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  // Preserve the convenient open policy when no origins are configured.
  if (configured.length === 0) return {};

  return {
    origin(origin, callback) {
      if (!origin || configured.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Origin is not allowed by CORS"));
    },
  };
}

export function createApiServer() {
  const app = express();
  app.use(cors(getCorsOptions()));
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
    if (!Object.hasOwn(LANGUAGE_CONFIG, language)) {
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
