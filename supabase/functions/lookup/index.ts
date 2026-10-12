// Supabase Edge Function "lookup": find a watch's photo and details for a pasted link or a typed
// reference, and store the photo in the private "photos" bucket. Same rules as
// prototype/tools/lookup.mjs: a saved link is trusted; a search result is only accepted when the
// reference matches exactly; name matches are only ever offered as choices.
//
// Called by the app with { q, collection }. Runs as the signed-in person, so the storage rules
// (members only) apply to every photo it saves.
import { createClient } from "npm:@supabase/supabase-js@2";

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36";
const SEARCH_STORES = ["teddybaldassarre.com", "www.crownandcaliber.com"];
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Img = { src: string; how: string };
const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
const hostOf = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const abs = (src: string, base: string) => { try { return new URL(src.startsWith("//") ? "https:" + src : src, base).href; } catch { return null; } };
const get = (url: string, accept = "text/html") =>
  fetch(url, { headers: { "user-agent": UA, accept, "accept-language": "en-US,en;q=0.9" }, redirect: "follow", signal: AbortSignal.timeout(15000) });

function meta(html: string, prop: string) {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']+)`, "i"));
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*(?:property|name)=["']${prop}["']`, "i"));
  return (a || b)?.[1]?.replace(/&amp;/g, "&");
}

function readPage(html: string, base: string) {
  const out = { images: [] as Img[], title: null as string | null, ref: null as string | null, maker: null as string | null };
  const add = (src: string | undefined, how: string) => {
    const u = src && abs(src, base);
    if (!u || u.split("?")[0] === base.split("?")[0] || out.images.some((x) => x.src === u)) return;
    if (/logo|placeholder|default[-_]?(og|share|image)|opengraph\/tag|social[-_]share/i.test(u)) return;
    out.images.push({ src: u, how });
  };
  for (const m of html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      // deno-lint-ignore no-explicit-any
      const nodes: any[] = [JSON.parse(m[1])].flat().flatMap((x: any) => x["@graph"] || [x]);
      const p = nodes.find((x) => /Product/.test([x["@type"]].flat().join(" ")));
      if (!p) continue;
      for (const im of [p.image].flat().slice(0, 2)) add(typeof im === "string" ? im : im?.url || im?.contentUrl, "page data");
      out.title ||= p.name;
      out.ref ||= p.mpn || p.sku || null;
      out.maker ||= typeof p.brand === "string" ? p.brand : p.brand?.name;
    } catch { /* not JSON */ }
  }
  add(meta(html, "og:image:secure_url") || meta(html, "og:image"), "link preview");
  out.title ||= meta(html, "og:title") || null;
  out.maker ||= meta(html, "og:site_name") || null;
  return out;
}

function refFromUrl(url: string) {
  const slug = (url.split("?")[0].split("/").filter(Boolean).pop() || "").replace(/\.html?$/, "");
  const t = slug.split(/[-_]/).filter((x) => /\d/.test(x) && /[a-z]/i.test(x) && x.length >= 5 && !/^\d+mm$/i.test(x));
  return t[0] ? t[0].toUpperCase() : null;
}

async function fromUrl(url: string) {
  const host = hostOf(url);
  try {
    const r = await get(url);
    if (!r.ok) return { ok: false, host, reason: r.status === 404 ? "dead link" : r.status === 403 ? "site blocks lookups" : `site said ${r.status}` };
    const page = { ...readPage(await r.text(), r.url), variants: [] as { title: string; sku: string | null }[] };
    if (/\/products\//.test(url)) {
      const j = await get(url.split("?")[0].replace(/\/$/, "") + ".json", "application/json").catch(() => null);
      if (j?.ok) {
        const p = (await j.json()).product;
        // deno-lint-ignore no-explicit-any
        if (p?.variants?.length > 1) page.variants = p.variants.map((v: any) => ({ title: v.title, sku: v.sku || null }));
        if (p?.images?.[0] && !page.images.length) page.images.push({ src: p.images[0].src, how: "store data" });
        page.title ||= p?.title; page.maker = p?.vendor || page.maker; page.ref ||= p?.variants?.[0]?.sku || null;
      }
    }
    return { ok: page.images.length > 0, host, source: host, url, ...page, ref: page.ref || refFromUrl(url), reason: page.images.length ? null : "no photo on page" };
  } catch (e) {
    return { ok: false, host, reason: (e as Error).name === "TimeoutError" ? "site timed out" : "site blocks lookups" };
  }
}

async function shopifySearch(store: string, q: string) {
  const r = await get(`https://${store}/search/suggest.json?q=${encodeURIComponent(q)}&resources[type]=product&resources[limit]=8`, "application/json");
  if (!r.ok) return [];
  // deno-lint-ignore no-explicit-any
  return ((await r.json()).resources?.results?.products || []) as any[];
}

async function fromReference(ref: string) {
  const keys = [norm(ref), norm(ref).replace(/(k1|j1|j|k)$/, "")].filter((k, i, a) => k.length >= 5 && a.indexOf(k) === i);
  if (!keys.length) return [];
  for (const store of SEARCH_STORES) {
    try {
      const hits = (await shopifySearch(store, ref))
        .filter((p) => (p.image || p.featured_image?.url) && keys.some((k) => norm(`${p.title} ${p.handle}`).includes(k)))
        .map((p) => ({ source: store.replace(/^www\./, ""), url: `https://${store}${p.url?.split("?")[0] || "/products/" + p.handle}`, image: abs(p.image || p.featured_image.url, `https://${store}`)!, title: p.title, maker: p.vendor }));
      if (hits.length) return hits.slice(0, 3);
    } catch { /* try the next store */ }
  }
  return [];
}

async function byName(query: string) {
  try {
    return (await shopifySearch("teddybaldassarre.com", query)).filter((p) => p.image || p.featured_image?.url).slice(0, 3)
      .map((p) => ({ source: "teddybaldassarre.com", url: `https://teddybaldassarre.com${p.url?.split("?")[0]}`, image: abs(p.image || p.featured_image.url, "https://teddybaldassarre.com")!, title: p.title, maker: p.vendor }));
  } catch { return []; }
}

// deno-lint-ignore no-explicit-any
async function save(sb: any, collection: string, src: string) {
  let url = src;
  if (/cdn\.shopify\.com|\/cdn\/shop\//.test(url)) { const u = new URL(url); u.searchParams.set("width", "1800"); url = u.href; }
  const r = await get(url, "image/avif,image/webp,image/png,image/jpeg,*/*");
  const type = r.headers.get("content-type") || "";
  if (!r.ok || !type.startsWith("image/")) throw new Error("not an image");
  const bytes = new Uint8Array(await r.arrayBuffer());
  if (bytes.length < 4000) throw new Error("too small to be a product photo");
  const ext = type.includes("png") ? "png" : type.includes("webp") ? "webp" : type.includes("avif") ? "avif" : "jpg";
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest("SHA-1", new TextEncoder().encode(src)))).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16);
  const path = `${collection}/${hash}.${ext}`;
  const { error } = await sb.storage.from("photos").upload(path, bytes, { contentType: type, upsert: false });
  if (error && !/exists|Duplicate/i.test(error.message)) throw error;
  return "sb:" + path;
}

async function lookup(q: string, sb: unknown, collection: string) {
  q = q.trim();
  if (/^https?:\/\//i.test(q)) {
    const r = await fromUrl(q);
    // deno-lint-ignore no-explicit-any
    const base = { url: q, maker: (r as any).maker || null, title: (r as any).title || null, ref: (r as any).ref || null, variants: (r as any).variants || [] };
    // deno-lint-ignore no-explicit-any
    for (const im of ((r as any).images || []) as Img[]) {
      try { return { ...base, photo: { src: await save(sb, collection, im.src), source: r.host, method: im.how } }; } catch { /* next */ }
    }
    if (base.ref) {
      const hits = await fromReference(base.ref);
      if (hits.length === 1) {
        try { return { ...base, photo: { src: await save(sb, collection, hits[0].image), source: hits[0].source, method: "reference search" } }; } catch { /* fall through */ }
      }
    }
    return { ...base, note: r.ok ? "The page had no usable photo." : `Couldn't read that page (${r.reason}).` };
  }
  const exact = await fromReference(q);
  if (exact.length === 1) {
    const h = exact[0];
    try { return { maker: h.maker, title: h.title, ref: q.toUpperCase(), url: h.url, photo: { src: await save(sb, collection, h.image), source: h.source, method: "reference search" } }; } catch { /* offer as a choice */ }
  }
  const hits = exact.length ? exact : await byName(q);
  const choices = [];
  for (const h of hits) { try { choices.push({ src: await save(sb, collection, h.image), source: h.source, title: h.title, page: h.url, maker: h.maker }); } catch { /* skip */ } }
  return { ref: exact.length ? q.toUpperCase() : null, title: null, maker: null, choices, note: choices.length ? (exact.length ? "Several watches carry that reference." : "No exact reference match. Pick the right one, or none.") : "Nothing found. You can still add it by hand." };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const { q, collection } = await req.json();
    if (!q || !/^[0-9a-f-]{36}$/.test(collection || "")) throw new Error("q and collection are required");
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") || "" } },
    });
    const out = await lookup(String(q).slice(0, 2000), sb, collection);
    return new Response(JSON.stringify(out), { headers: { ...CORS, "content-type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 400, headers: { ...CORS, "content-type": "application/json" } });
  }
});
