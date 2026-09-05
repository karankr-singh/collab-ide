import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";
import { runCode } from "./dockerRunner.js";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
const QUEUE_NAME = "code-execution";
const CONCURRENCY = Number(process.env.EXEC_CONCURRENCY || 4);

let queue = null;
let queueEvents = null;
let worker = null;
let redisAvailable = false;

// In-memory fallback so the app still runs without a Redis instance
// (useful for local dev / demos). Production deployments should set
// REDIS_URL and rely on the BullMQ path for real backpressure handling.
const inMemoryInFlight = { count: 0 };
const IN_MEMORY_MAX_CONCURRENCY = CONCURRENCY;

async function tryConnectRedis() {
  const conn = new Redis(REDIS_URL, {
    lazyConnect: true,
    retryStrategy: () => null, // don't auto-retry; we're just probing
    reconnectOnError: () => false,
  });
  conn.on("error", () => {}); // swallow probe errors, we handle via try/catch below
  try {
    await conn.connect();
    await conn.ping();
    return true;
  } catch (_) {
    return false;
  } finally {
    conn.disconnect();
  }
}

export async function initExecutionQueue({ onJobOutput } = {}) {
  redisAvailable = await tryConnectRedis();

  if (!redisAvailable) {
    console.warn(
      "[executionQueue] Redis unavailable — falling back to in-memory queue. " +
        "Set REDIS_URL for horizontally-scalable execution."
    );
    return;
  }

  const connection = { connection: new Redis(REDIS_URL, { maxRetriesPerRequest: null }) };

  queue = new Queue(QUEUE_NAME, connection);
  queueEvents = new QueueEvents(QUEUE_NAME, connection);

  worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { language, code } = job.data;
      const result = await runCode(language, code, (chunk) => {
        onJobOutput?.(job.id, chunk);
      });
      return result;
    },
    { ...connection, concurrency: CONCURRENCY }
  );

  worker.on("failed", (job, err) => {
    console.error(`[executionQueue] job ${job?.id} failed:`, err.message);
  });
}

/**
 * Submits code for execution and resolves with the result.
 * Streams intermediate output via onOutput if provided.
 */
export async function submitExecution({ language, code }, onOutput = () => {}) {
  if (redisAvailable && queue) {
    const job = await queue.add(
      "run",
      { language, code },
      { removeOnComplete: 100, removeOnFail: 100 }
    );
    // Live output relies on the worker's onJobOutput callback wired to a
    // pub/sub channel in index.js; for direct callers we just await result.
    const result = await job.waitUntilFinished(queueEvents, 15_000);
    return result;
  }

  // In-memory fallback path
  if (inMemoryInFlight.count >= IN_MEMORY_MAX_CONCURRENCY) {
    throw new Error("Server busy — too many concurrent executions. Try again shortly.");
  }
  inMemoryInFlight.count += 1;
  try {
    return await runCode(language, code, onOutput);
  } finally {
    inMemoryInFlight.count -= 1;
  }
}

export function isRedisBacked() {
  return redisAvailable;
}
