// Local server: serves the prototype and answers /api/lookup, so a watch you add gets its
// real photo straight away. Browsers can't read other sites directly; this does it for them.
//
//   node server.mjs        → http://localhost:4377
import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { fromUrl, fromReference, byName, saveImage } from "./tools/lookup.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const imgDir = path.join(root, "img");
// Your saved changes, mirrored to disk (gitignored). One daily copy is kept in state/backups/.
const stateDir = path.join(root, "state");
const opsFile = path.join(stateDir, "ops.json");
const PORT = Number(process.env.PORT) || 4377;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8", ".css": "text/css", ".json": "application/json", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".avif": "image/avif", ".svg": "image/svg+xml" };

// Downloads made here are listed so tools/fetch-images.mjs never deletes them as unused.
async function keep(src) {
  const name = await saveImage(src, imgDir);
  fs.appendFileSync(path.join(imgDir, "keep.txt"), name + "\n");
  return "img/" + name;
}

function readOps() {
  try { return JSON.parse(fs.readFileSync(opsFile, "utf8")); } catch { return []; }
}
function writeOps(list) {
  fs.mkdirSync(path.join(stateDir, "backups"), { recursive: true });
  const tmp = opsFile + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(list));
  fs.renameSync(tmp, opsFile); // atomic: a crash never leaves a half-written file
  const daily = path.join(stateDir, "backups", `ops-${new Date().toISOString().slice(0, 10)}.json`);
  fs.copyFileSync(opsFile, daily);
}
function readBody(req) {
  return new Promise((res, rej) => {
    let b = "";
    req.on("data", (c) => { b += c; if (b.length > 20e6) req.destroy(); });
    req.on("end", () => res(b));
    req.on("error", rej);
  });
}

async function lookup(q) {
  q = q.trim();
  if (/^https?:\/\//i.test(q)) {
    const r = await fromUrl(q);
    const base = { url: q, maker: r.maker || null, title: r.title || null, ref: r.ref || null, variants: r.variants || [] };
    if (r.ok) {
      for (const im of r.images) {
        try { return { ...base, photo: { src: await keep(im.src), source: r.source, method: im.how } }; } catch {}
      }
    }
    // The link didn't give a photo; fall back to the reference it carried, if any.
    if (base.ref) {
      const hits = await fromReference(base.ref);
      if (hits.length === 1) return { ...base, photo: { src: await keep(hits[0].image), source: hits[0].source, method: "reference search" } };
    }
    return { ...base, note: r.ok ? "The page had no usable photo." : `Couldn't read that page (${r.reason}).` };
  }
  // Typed text: treat it as a reference first (exact match only), then as a name (choices only).
  const exact = await fromReference(q);
  if (exact.length === 1) {
    const h = exact[0];
    return { maker: h.maker, title: h.title, ref: q.toUpperCase(), url: h.url, photo: { src: await keep(h.image), source: h.source, method: "reference search" } };
  }
  const hits = exact.length ? exact : await byName(q, "", ["teddybaldassarre.com"]);
  const choices = [];
  for (const h of hits) { try { choices.push({ src: await keep(h.image), source: h.source, title: h.title, page: h.url, maker: h.maker }); } catch {} }
  return { ref: exact.length ? q.toUpperCase() : null, title: null, maker: null, choices, note: choices.length ? (exact.length ? "Several watches carry that reference." : "No exact reference match. Pick the right one, or none.") : "Nothing found. You can still add it by hand." };
}

http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://${req.headers.host}`);
  if (u.pathname === "/api/ops") {
    if (req.method === "GET") {
      res.writeHead(200, { "content-type": "application/json", "cache-control": "no-store" }).end(JSON.stringify(readOps()));
      return;
    }
    if (req.method === "POST") {
      try {
        const incoming = JSON.parse(await readBody(req));
        const list = readOps();
        const have = new Set(list.map((o) => o.id));
        const add = (Array.isArray(incoming) ? incoming : []).filter((o) => o && o.id && !have.has(o.id));
        if (add.length) writeOps([...list, ...add].sort((a, b) => a.at - b.at));
        res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify({ added: add.length }));
      } catch (e) {
        res.writeHead(400, { "content-type": "application/json" }).end(JSON.stringify({ error: e.message }));
      }
      return;
    }
  }
  if (u.pathname === "/api/lookup") {
    try {
      const out = await lookup(u.searchParams.get("q") || "");
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(out));
    } catch (e) {
      res.writeHead(500, { "content-type": "application/json" }).end(JSON.stringify({ error: e.message }));
    }
    return;
  }
  const rel = decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname);
  const file = path.join(root, rel);
  if (!file.startsWith(root) || /\/(tools|node_modules|state)\//.test(rel) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end("Not found");
    return;
  }
  res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream", "cache-control": "no-cache" });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log(`Horology on http://localhost:${PORT}`));
