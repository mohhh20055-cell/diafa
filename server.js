import { createServer } from "http";
import { readFileSync, existsSync, statSync } from "fs";
import { join, extname } from "path";
import { fileURLToPath } from "url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

const PORT = process.env.PORT || 3000;
const DIST_DIR = join(__dirname, "dist");

const MIME_TYPES = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
};

function serveStatic(reqPath) {
  const pathname = reqPath.split("?")[0];

  if (pathname.includes("..")) {
    return { status: 403, body: "Forbidden" };
  }

  // Try to serve a real file from dist
  const fullPath = join(DIST_DIR, pathname);
  if (existsSync(fullPath) && statSync(fullPath).isFile()) {
    const ext = extname(fullPath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    return { status: 200, body: readFileSync(fullPath), contentType };
  }

  // SPA fallback: always serve dist/index.html for any route
  const indexPath = join(DIST_DIR, "index.html");
  if (existsSync(indexPath)) {
    return { status: 200, body: readFileSync(indexPath), contentType: "text/html" };
  }

  return { status: 404, body: "Not Found" };
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  const response = serveStatic(url.pathname);
  res.writeHead(response.status, {
    "Content-Type": response.contentType || "application/octet-stream",
    "Cache-Control": "no-cache",
  });
  res.end(response.body);
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur Diyafa demarre sur le port ${PORT}`);
});
