import Docker from "dockerode";
import { nanoid } from "nanoid";
import { PassThrough } from "stream";

const docker = new Docker(); // connects to /var/run/docker.sock by default

/**
 * Language -> execution image / command mapping.
 * Each image should be a minimal, pinned, offline-capable image.
 * Build these once with `docker build` from the /images directory (see README),
 * or substitute official slim images as shown below.
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
    // compile then run; combined into one shell invocation
    cmd: (file) => ["sh", "-c", `g++ -O2 -o /tmp/a.out ${file} && /tmp/a.out`],
  },
};

const MAX_EXEC_MS = 5000; // hard execution timeout
const MAX_OUTPUT_BYTES = 200_000; // truncate runaway output
const MEMORY_LIMIT_BYTES = 128 * 1024 * 1024; // 128MB
const NANO_CPUS = 0.5 * 1e9; // 0.5 CPU

/**
 * Executes `code` for the given `language` inside a locked-down,
 * single-use, non-root, network-isolated container.
 *
 * @param {string} language
 * @param {string} code
 * @param {(chunk: {stream: 'stdout'|'stderr', data: string}) => void} onOutput
 *        Optional streaming callback, called as output arrives.
 * @returns {Promise<{exitCode: number, stdout: string, stderr: string, timedOut: boolean}>}
 */
export async function runCode(language, code, onOutput = () => {}) {
  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const jobId = nanoid(10);
  const workdir = `/sandbox/${jobId}`;
  const filePath = `${workdir}/${config.filename}`;

  let stdout = "";
  let stderr = "";
  let truncated = false;
  let container;
  let timedOut = false;

  const appendBounded = (target, chunk) => {
    if (truncated) return target;
    const next = target + chunk;
    if (next.length > MAX_OUTPUT_BYTES) {
      truncated = true;
      return next.slice(0, MAX_OUTPUT_BYTES) + "\n[output truncated]";
    }
    return next;
  };

  try {
    // Create the container in a stopped state first so we can inject the
    // source file, THEN start it — avoids ever mounting host paths.
    container = await docker.createContainer({
      Image: config.image,
      Cmd: ["sh", "-c", `mkdir -p ${workdir} && cat > ${filePath} && cd ${workdir} && ${config
        .cmd(config.filename)
        .join(" ")}`],
      OpenStdin: true,
      StdinOnce: true,
      AttachStdin: true,
      AttachStdout: true,
      AttachStderr: true,
      Tty: false,
      User: "1000:1000", // non-root
      HostConfig: {
        Memory: MEMORY_LIMIT_BYTES,
        MemorySwap: MEMORY_LIMIT_BYTES, // disable swap growth
        NanoCpus: NANO_CPUS,
        PidsLimit: 64,
        NetworkMode: "none", // no network egress at all
        ReadonlyRootfs: false, // languages need to write compiled artifacts; workdir is ephemeral
        AutoRemove: false, // we remove explicitly after collecting logs
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

    // Write the user's code to the container's stdin, then close stdin.
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
        /* already exited */
      }
    }

    return {
      exitCode: timedOut ? 124 : result.StatusCode,
      stdout,
      stderr: timedOut ? stderr + "\n[execution timed out]" : stderr,
      timedOut,
    };
  } finally {
    if (container) {
      try {
        await container.remove({ force: true });
      } catch (_) {
        /* ignore cleanup errors */
      }
    }
  }
}
