import http from "node:http"
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
const root = path.resolve(fileURLToPath(new URL("../out/", import.meta.url)))
const prefix = (process.env.BASE_PATH || "").replace(/\/$/, "")
const mime = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
}
const server = http.createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname)
    if (pathname !== prefix && !pathname.startsWith(prefix + "/")) {
      response.writeHead(404).end("Not found")
      return
    }
    let file = path.resolve(root, "." + (pathname.slice(prefix.length) || "/"))
    if (file !== root && !file.startsWith(root + path.sep)) {
      response.writeHead(403).end()
      return
    }
    if ((await fs.stat(file)).isDirectory()) file = path.join(file, "index.html")
    const body = await fs.readFile(file)
    response
      .writeHead(200, { "Content-Type": mime[path.extname(file)] || "application/octet-stream" })
      .end(body)
  } catch {
    response.writeHead(404).end("Not found")
  }
})
server.listen(Number(process.env.PORT || 8791), "127.0.0.1", () =>
  console.log("Static preview ready"),
)
