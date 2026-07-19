const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
// Single, consistent port map for the whole platform. The backend is the API
// source of truth on 3000; the office app proxies to it via NEXT_PUBLIC_API_URL
// (defaults to http://localhost:3000/api). The landing page is served on 5173.
// The mobile app is not launched here — it needs a device/emulator (run
// `npm run dev:mobile` separately).
const PORTS = { office: 3001, backend: 3000, landing: 5173 };
const children = [];

const ANSI = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  dim: "\x1b[2m",
};

function log(name, color, msg) {
  console.log(`${color}[${name}]${ANSI.reset} ${msg}`);
}

function run(name, color, cmd, args, cwd, env) {
  const child = spawn(cmd, args, {
    cwd,
    shell: true,
    env: env ? { ...process.env, ...env } : process.env,
  });
  children.push(child);
  child.stdout.on("data", (d) =>
    d.toString().split("\n").forEach((l) => l.trim() && log(name, color, l))
  );
  child.stderr.on("data", (d) =>
    d.toString().split("\n").forEach((l) => l.trim() && log(name, color, l))
  );
  child.on("exit", (code) =>
    log(name, ANSI.yellow, `process exited with code ${code}`)
  );
  return child;
}

// Best-effort: free a TCP port before we start, so re-running `npm run dev`
// doesn't trip over orphaned servers left by a previous (crashed) run.
// Windows-only (uses netstat/taskkill); no-op elsewhere.
function freePort(port) {
  if (process.platform !== 'win32') return;
  try {
    const out = require('child_process').execSync('netstat -ano -p tcp', { encoding: 'utf8' });
    const re = new RegExp(`\\s+\\d+\\.\\d+\\.\\d+\\.\\d+:${port}\\s+\\S+\\s+LISTENING\\s+(\\d+)`, 'm');
    const m = out.match(re);
    if (m) {
      try { require('child_process').execSync(`taskkill /PID ${m[1]} /F /T`); } catch (_) {}
      log('orchestrator', ANSI.yellow, `freed port ${port} (pid ${m[1]})`);
    }
  } catch (_) {}
}

// Minimal static file server for the landing page (no dependencies).
// Falls back to the next port if the requested one is already in use, so a
// busy port never crashes the whole orchestrator.
function startLandingServer(port) {
  const dir = path.join(ROOT, "landing_page");
  const types = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "text/javascript",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".ico": "image/x-icon",
    ".json": "application/json",
  };
  const server = http.createServer((req, res) => {
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.join(dir, path.normalize(urlPath));
    if (!filePath.startsWith(dir)) {
      res.writeHead(403);
      return res.end("Forbidden");
    }
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        return res.end("Not found");
      }
      res.writeHead(200, {
        "Content-Type": types[path.extname(filePath)] || "application/octet-stream",
      });
      res.end(data);
    });
  });
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      log('landing', ANSI.yellow, `port ${port} busy, trying ${port + 1}`);
      startLandingServer(port + 1);
    } else {
      throw err;
    }
  });
  server.listen(port, () => {
    log("landing", ANSI.cyan, `static server on http://localhost:${port}`);
  });
}

console.log(
  `\n${ANSI.green}=== ShieldGuard dev orchestrator ===${ANSI.reset}\n` +
    `${ANSI.dim}Press Ctrl+C to stop all services${ANSI.reset}\n`
);

// Free our ports so a previous run that didn't shut down cleanly can't block us.
[PORTS.backend, PORTS.office, PORTS.landing].forEach(freePort);

run("office", ANSI.green, "npm", ["run", "dev"], path.join(ROOT, "shieldguard-office"), {
  NEXT_PUBLIC_API_URL: `http://localhost:${PORTS.backend}/api`,
});
run(
  "backend",
  ANSI.yellow,
  "npm",
  ["run", "dev"],
  path.join(ROOT, "shieldguard-backend"),
  { PORT: String(PORTS.backend) }
);
startLandingServer(PORTS.landing);

function shutdown() {
  console.log(`\n${ANSI.yellow}Shutting down all services...${ANSI.reset}`);
  children.forEach((c) => {
    try {
      c.kill("SIGTERM");
    } catch (_) {}
  });
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
