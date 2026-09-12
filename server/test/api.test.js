import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { createApiServer } from "../src/api.js";

let server;
let baseUrl;

before(async () => {
  const app = createApiServer();
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

test("health endpoint reports a healthy API", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true, redisBacked: false });
});

test("languages endpoint exposes supported runtimes", async () => {
  const response = await fetch(`${baseUrl}/api/languages`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.deepEqual(body.languages, ["python", "javascript", "go", "cpp"]);
});

test("execution rejects an empty code payload", async () => {
  const response = await fetch(`${baseUrl}/api/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language: "python", code: "" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /code.*required/i);
});

test("execution rejects unsupported languages before touching Docker", async () => {
  const response = await fetch(`${baseUrl}/api/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language: "rust", code: "fn main() {}" }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /unsupported language/i);
});

test("execution rejects oversized source code", async () => {
  const response = await fetch(`${baseUrl}/api/execute`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ language: "python", code: "x".repeat(50_001) }),
  });
  assert.equal(response.status, 400);
  assert.match((await response.json()).error, /50,000/i);
});
