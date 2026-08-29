import http from "node:http";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".");
const port = Number(process.env.PORT || 4173);
const types = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".mjs":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".svg":"image/svg+xml", ".png":"image/png", ".jpg":"image/jpeg", ".webp":"image/webp", ".woff2":"font/woff2", ".wav":"audio/wav" };

const server = http.createServer((req, res) => {
  const pathname = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  let target = path.resolve(root, `.${pathname}`);
  if (!target.startsWith(root + path.sep) && target !== root) { res.writeHead(403).end("Forbidden"); return; }
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) target = path.join(target, "index.html");
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404).end("Not found"); return; }
  res.writeHead(200, { "Content-Type": types[path.extname(target).toLowerCase()] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(target).pipe(res);
}).listen(port, "127.0.0.1", () => console.log(`Static site listening on http://127.0.0.1:${port}`));

function shutdown() { server.close(() => process.exit(0)); }
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
