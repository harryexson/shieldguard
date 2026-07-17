const { spawn } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORTS = { office: 3000, backend: 4000, landing: 5000 };
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

// Minimal static file server for the landing page (no dependencies)
function startLandingServer() {
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
  server.listen(PORTS.landing, () => {
    log("landing", ANSI.cyan, `static server on http://localhost:${PORTS.landing}`);
  });
}

console.log(
  `\n${ANSI.green}=== ShieldGuard dev orchestrator ===${ANSI.reset}\n` +
    `${ANSI.dim}Press Ctrl+C to stop all services${ANSI.reset}\n`
);

run("office", ANSI.green, "npm", ["run", "dev"], path.join(ROOT, "shieldguard-office"));
run(
  "backend",
  ANSI.yellow,
  "npm",
  ["run", "dev"],
  path.join(ROOT, "shieldguard-backend"),
  { PORT: String(PORTS.backend) }
);
startLandingServer();

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
