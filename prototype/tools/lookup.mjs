// Find a product photo, and whatever else a page states, for a saved link or a reference number.
// Rule: a link you saved is trusted; a search result is only accepted when the reference matches.
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFile } from "child_process";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
// Shopify stores with good packshots; their predictive search is public JSON.
const SEARCH_STORES = ["teddybaldassarre.com", "www.crownandcaliber.com"];

export const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
const hostOf = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const abs = (src, base) => { try { return new URL(src.startsWith("//") ? "https:" + src : src, base).href; } catch { return null; } };

async function get(url, accept = "text/html") {
  return fetch(url, { headers: { "user-agent": UA, accept, "accept-language": "en-US,en;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(15000) });
}

function meta(html, prop) {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)`, "i"));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i"));
  return (a || b)?.[1]?.replace(/&amp;/g, "&");
}

function readPage(html, base) {
  const out = { image: null, images: [], title: null, ref: null, maker: null, method: null };
  // Some pages put their own URL (or an @id) where the image belongs; keep only real image candidates.
  const add = (src, how) => {
    const u = src && abs(src, base);
    if (!u || u.split("?")[0] === base.split("?")[0] || out.images.some((x) => x.src === u)) return;
    if (/logo|placeholder|default[-_]?(og|share|image)|opengraph\/tag|social[-_]share/i.test(u)) return; // site-wide images, not the watch
    out.images.push({ src: u, how });
  };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const nodes = [JSON.parse(m[1])].flat().flatMap((x) => x["@graph"] || [x]);
      const p = nodes.find((x) => /Product/.test([x["@type"]].flat().join(" ")));
      if (!p) continue;
      for (const im of [p.image].flat().slice(0, 2)) add(typeof im === "string" ? im : im?.url || im?.contentUrl, "page data");
      out.title ||= p.name;
      out.ref ||= p.mpn || p.sku || null;
      out.maker ||= typeof p.brand === "string" ? p.brand : p.brand?.name;
    } catch {}
  }
  add(meta(html, "og:image:secure_url") || meta(html, "og:image"), "link preview");
  if (out.images[0]) { out.image = out.images[0].src; out.method = out.images[0].how; }
  out.title ||= meta(html, "og:title");
  out.maker ||= meta(html, "og:site_name");
  return out;
}

// Reference hiding in the URL slug, e.g. ".../h70405730-khaki-field-murph-38mm.html".
export function refFromUrl(url) {
  const slug = (url.split("?")[0].split("/").filter(Boolean).pop() || "").replace(/\.html?$/, "");
  const tokens = slug.split(/[-_]/).filter((t) => /\d/.test(t) && /[a-z]/i.test(t) && t.length >= 5 && !/^\d+mm$/i.test(t));
  return tokens[0] ? tokens[0].toUpperCase() : null;
}

export async function fromUrl(url) {
  const host = hostOf(url);
  try {
    const r = await get(url);
    if (!r.ok) return { ok: false, host, reason: r.status === 404 ? "dead link" : r.status === 403 ? "site blocks lookups" : `site said ${r.status}` };
    const page = readPage(await r.text(), r.url);
    if (!page.image && /\/products\//.test(url)) {
      const j = await get(url.split("?")[0].replace(/\/$/, "") + ".json", "application/json").catch(() => null);
      if (j?.ok) {
        const p = (await j.json()).product;
        if (p?.images?.[0]) Object.assign(page, { image: p.images[0].src, images: [{ src: p.images[0].src, how: "store data" }], title: page.title || p.title, maker: p.vendor || page.maker, ref: page.ref || p.variants?.[0]?.sku || null, method: "store data" });
      }
    }
    if (!page.image) return { ok: false, host, reason: "no photo on page", ...page };
    return { ok: true, host, source: host, url, ...page, ref: page.ref || refFromUrl(url) };
  } catch (e) {
    return { ok: false, host, reason: e.name === "TimeoutError" ? "site timed out" : "site blocks lookups" };
  }
}

// Exact-reference search. Returns up to 3 products whose title or handle contains the reference.
export async function fromReference(ref) {
  const keys = [norm(ref), norm(ref).replace(/(k1|j1|j|k)$/, "")].filter((k, i, a) => k.length >= 5 && a.indexOf(k) === i);
  if (!keys.length) return [];
  const found = [];
  for (const store of SEARCH_STORES) {
    try {
      const r = await get(`https://${store}/search/suggest.json?q=${encodeURIComponent(ref)}&resources[type]=product&resources[limit]=6`, "application/json");
      if (!r.ok) continue;
      for (const p of (await r.json()).resources?.results?.products || []) {
        const hay = norm(`${p.title} ${p.handle}`);
        const img = p.image || p.featured_image?.url;
        if (img && keys.some((k) => hay.includes(k))) {
          found.push({ ok: true, source: store.replace(/^www\./, ""), url: `https://${store}${p.url?.split("?")[0] || "/products/" + p.handle}`, image: abs(img, `https://${store}`), title: p.title, maker: p.vendor, ref, method: "reference search" });
        }
      }
    } catch {}
    if (found.length) break;
  }
  return found.slice(0, 3);
}

// Download a photo into dir, sized for 4K-class displays. Returns the file name.
export async function saveImage(src, dir) {
  let url = src;
  if (/cdn\.shopify\.com|\/cdn\/shop\//.test(url)) { const u = new URL(url); u.searchParams.set("width", "1800"); url = u.href; }
  const r = await get(url, "image/avif,image/webp,image/png,image/jpeg,*/*");
  const type = r.headers.get("content-type") || "";
  if (!r.ok || !type.startsWith("image/")) throw new Error(`not an image (${r.status} ${type})`);
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("avif") ? "avif" : "jpg";
  const name = crypto.createHash("sha1").update(src).digest("hex").slice(0, 16) + "." + ext;
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, name);
  fs.writeFileSync(file, Buffer.from(await r.arrayBuffer()));
  // Reject what isn't a product shot: logo banners (very wide) and thumbnails. sips is built into macOS.
  const dims = await new Promise((res) => execFile("sips", ["-g", "pixelWidth", "-g", "pixelHeight", file], (e, out) => res(e ? "" : out)));
  const [w, h] = ["pixelWidth", "pixelHeight"].map((k) => +(dims.match(new RegExp(k + ": (\\d+)"))?.[1] || 0));
  if (w && h && (w / h > 2 || h / w > 2.2 || Math.max(w, h) < 320)) {
    fs.unlinkSync(file);
    throw new Error(`not a product photo (${w}×${h})`);
  }
  // Cap the long edge at 1800 px without ever upscaling.
  if ((ext === "jpg" || ext === "png") && Math.max(w, h) > 1800) await new Promise((res) => execFile("sips", ["-Z", "1800", file], () => res()));
  return name;
}

// Name search for when there is no exact reference. Never auto-accepted: results are offered as
// choices for a person to pick. Products from other makers are dropped (no Certina for a Timex).
export async function byName(query, maker, stores) {
  const m = norm(maker);
  const out = [];
  for (const store of stores) {
    try {
      const r = await get(`https://${store}/search/suggest.json?q=${encodeURIComponent(query)}&resources[type]=product&resources[limit]=8`, "application/json");
      if (!r.ok) continue;
      for (const p of (await r.json()).resources?.results?.products || []) {
        const img = p.image || p.featured_image?.url;
        const brandOk = !m || norm(p.vendor).includes(m) || norm(p.title).includes(m) || store.includes(m);
        if (img && brandOk) out.push({ source: store.replace(/^www\./, ""), url: `https://${store}${p.url?.split("?")[0] || "/products/" + p.handle}`, image: abs(img, `https://${store}`), title: p.title });
      }
    } catch {}
    if (out.length >= 3) break;
  }
  return out.slice(0, 3);
}
