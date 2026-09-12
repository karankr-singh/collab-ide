import Docker from "dockerode";
import { nanoid } from "nanoid";
import { PassThrough } from "stream";

const docker = new Docker(); // connects to /var/run/docker.sock by default

/**
 * Language -> execution image / command mapping.
 * Each image should be a minimal, pinned, offline-capable image.
 */
export const LANGUAGE_CONFIG = {
  python: {
    image: "python:3.12-slim",
    filename: "main.py",
    cmd: (file) => ["python3", file],
  },
  javascript: {
    image: "node:20-slim",
    filename: "main.js",
    cmd: (file) => ["node", file],
  },
  go: {
    image: "golang:1.22-alpine",
    filename: "main.go",
    cmd: (file) => ["go", "run", file],
  },
  cpp: {
    image: "gcc:13-slim",
    filename: "main.cpp",
    cmd: (file) => ["sh", "-c", `g++ -O2 -o /tmp/a.out ${file} && /tmp/a.out`],
  },
};

const MAX_EXEC_MS = 5000;
const MAX_OUTPUT_BYTES = 200_000;
const MEMORY_LIMIT_BYTES = 128 * 1024 * 1024;
const NANO_CPUS = 0.5 * 1e9;

/**
 * Executes user code in a single-use, network-isolated container.
 * The container runs as a non-root user with resource and process limits.
 */
export async function runCode(language, code, onOutput = () => {}) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const jobId = nanoid(10);
  // /tmp is writable by the non-root container user. Using /sandbox here
  // caused permission failures on standard slim images because /sandbox did
  // not exist and a UID 1000 process could not create it at filesystem root.
  const workdir = `/tmp/collab-ide/${jobId}`;
  const filePath = `${workdir}/${config.filename}`;

  let stdout = "";
  let stderr = "";
  let outputBytes = 0;
  let outputTruncated = false;
  let container;
  let timedOut = false;

  const appendBounded = (target, chunk) => {
    if (outputTruncated) return target;
    const remaining = MAX_OUTPUT_BYTES - outputBytes;
    if (remaining <= 0) {
      outputTruncated = true;
      return target;
    }

    const bytes = Buffer.byteLength(chunk, "utf8");
    if (bytes <= remaining) {
      outputBytes += bytes;
      return target + chunk;
    }

    outputTruncated = true;
    const safe = Buffer.from(chunk, "utf8").subarray(0, remaining).toString("utf8");
    outputBytes = MAX_OUTPUT_BYTES;
    return target + safe + "\n[output truncated]";
  };

  try {
    container = await docker.createContainer({
      Image: config.image,
      Cmd: [
        "sh",
        "-c",
        `mkdir -p ${workdir} && cat > ${filePath} && cd ${workdir} && ${config
          .cmd(config.filename)
          .join(" ")}`,
      ],
      Env: ["HOME=/tmp", "GOCACHE=/tmp/go-cache"],
      OpenStdin: true,
      StdinOnce: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      User: "1000:1000",
      HostConfig: {
        Memory: MEMORY_LIMIT_BYTES,
        MemorySwap: MEMORY_LIMIT_BYTES,
        NanoCpus: NANO_CPUS,
        PidsLimit: 64,
        NetworkMode: "none",
        ReadonlyRootfs: false,
        AutoRemove: false,
        CapDrop: ["ALL"],
        SecurityOpt: ["no-new-privileges"],
      },
    });

    const stream = await container.attach({
      stream: true,
      stdin: true,
      stdout: true,
      stderr: true,
    });

    await container.start();

    stream.write(code);
    stream.end();

    const stdoutStream = new PassThrough();
    const stderrStream = new PassThrough();
    docker.modem.demuxStream(stream, stdoutStream, stderrStream);

    stdoutStream.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stdout = appendBounded(stdout, text);
      onOutput({ stream: "stdout", data: text });
    });

    stderrStream.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stderr = appendBounded(stderr, text);
      onOutput({ stream: "stderr", data: text });
    });

    const waitPromise = container.wait();
    const timeoutPromise = new Promise((resolve) =>
      setTimeout(() => resolve({ StatusCode: -1, __timeout: true }), MAX_EXEC_MS)
    );

    const result = await Promise.race([waitPromise, timeoutPromise]);

    if (result.__timeout) {
      timedOut = true;
      try {
        await container.kill();
      } catch (_) {
        // Container may have exited between the timeout and kill attempt.
      }
    }

    return {
      exitCode: timedOut ? 124 : result.StatusCode,
      stdout,
      stderr: timedOut ? stderr + "\n[execution timed out]" : stderr,
      timedOut,
      outputTruncated,
    };
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (_) {
        // Cleanup should never hide the execution result.
      }
    }
  }
}
