import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const source = readFileSync(filePath, "utf8");
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    if (!key || process.env[key] !== undefined) continue;
    let value = line.slice(separatorIndex + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(path.resolve(root, ".env"));
loadEnvFile(path.resolve(root, ".env.local"));

const nodeExec = process.execPath;
const viteBin = path.resolve(root, "node_modules", "vite", "bin", "vite.js");
const backendEntry = path.resolve(root, "backend", "server.mjs");
const backendPort = Number(process.env.PORT || 3001);
const backendUrl = `http://127.0.0.1:${backendPort}/api/home`;

let shuttingDown = false;
let backend;
let frontend;

function spawnProcess(command, args, name, extraEnv = {}) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, ...extraEnv },
    shell: false,
  });

  child.on("exit", (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    if (frontend && !frontend.killed) frontend.kill("SIGTERM");
    if (backend && !backend.killed) backend.kill("SIGTERM");
    if (signal) {
      process.exit(1);
    }
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(`[${name}] failed to start`, error);
    shutdown(1);
  });

  return child;
}

function ping(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode && res.statusCode < 500);
    });

    req.on("error", () => resolve(false));
    req.setTimeout(700, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForBackend(url, timeoutMs = 15000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await ping(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
}

function shutdown(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  if (frontend && !frontend.killed) frontend.kill("SIGTERM");
  if (backend && !backend.killed) backend.kill("SIGTERM");
  setTimeout(() => process.exit(code), 100);
}

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

backend = spawnProcess(nodeExec, [backendEntry], "backend");

const backendReady = await waitForBackend(backendUrl);
if (!backendReady) {
  console.error(`Backend did not respond in time at ${backendUrl}`);
  shutdown(1);
}

console.log(`BOOKSHOP backend is ready on port ${backendPort}`);
frontend = spawnProcess(nodeExec, [viteBin], "frontend");
