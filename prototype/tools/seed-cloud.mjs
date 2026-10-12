// One-time move to the shared version: uploads what lives only on this computer into your
// Supabase collection, so it shows up for everyone you share with.
//   · personal.js (stories, milestones, milestone decisions)  → operations
//   · images.js + img/ (photos)                                → private storage + operations
//   · state/ops.json (changes made with the local server)      → operations
// Safe to run again: every operation has a fixed id and photos that exist are skipped.
//
//   node tools/seed-cloud.mjs
// Sign in with the same email and password you use in the app (the collection's owner).
import fs from "fs";
import vm from "vm";
import path from "path";
import readline from "readline";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (f) => (fs.existsSync(path.join(root, f)) ? fs.readFileSync(path.join(root, f), "utf8") : null);

const cfgCtx = { window: {} };
vm.createContext(cfgCtx);
vm.runInContext(read("config.js") || "", cfgCtx);
const { supabaseUrl: URL_, supabaseKey: KEY } = cfgCtx.window.HOROLOGY_CONFIG || {};
if (!URL_ || !KEY) { console.error("Fill in config.js first (Supabase URL and publishable key)."); process.exit(1); }

function ask(q, hidden = false) {
  return new Promise((res) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) rl._writeToOutput = (s) => { if (s.includes(q)) rl.output.write(q); };
    rl.question(q, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); res(a.trim()); });
  });
}

const email = process.env.HOROLOGY_EMAIL || (await ask("Email: "));
const password = process.env.HOROLOGY_PASSWORD || (await ask("Password: ", true));

const auth = await fetch(`${URL_}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: KEY, "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
const session = await auth.json();
if (!auth.ok) { console.error("Sign-in failed:", session.error_description || session.msg || auth.status); process.exit(1); }
const H = { apikey: KEY, authorization: `Bearer ${session.access_token}` };

const mem = await (await fetch(`${URL_}/rest/v1/members?select=collection_id,role&email=eq.${encodeURIComponent(email.toLowerCase())}`, { headers: H })).json();
if (!mem?.length) { console.error("This account isn't in a collection yet. Open the app, sign in and create it first."); process.exit(1); }
const cid = mem[0].collection_id;
console.log(`Collection ${cid.slice(0, 8)}…`);

// ---- base data, and what personal.js changes about it ----
const ctx = { window: {}, structuredClone };
vm.createContext(ctx);
vm.runInContext(read("data.js"), ctx);
const before = structuredClone(ctx.window.HOROLOGY);
if (read("personal.js")) vm.runInContext(read("personal.js"), ctx);
const after = ctx.window.HOROLOGY;

const ops = [];
let n = 0;
const op = (id, o) => ops.push({ id: `seed:${cid.slice(0, 8)}:${id}`, collection_id: cid, at: ++n, device: "seed", ...o });

for (const list of ["owned", "wants"]) {
  for (const w of after[list]) {
    const was = before[list].find((x) => x.id === w.id) || {};
    const data = Object.fromEntries(Object.entries(w).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(was[k])));
    if (Object.keys(data).length) op(`personal:watch:${w.id}`, { type: "update", kind: "watch", ref: w.id, data, label: "Story added" });
  }
}
for (const m of after.milestones) if (!before.milestones.some((x) => x.id === m.id)) op(`personal:milestone:${m.id}`, { type: "create", kind: "milestone", ref: m.id, data: m, label: "Milestone added" });
for (const d of after.decisions) if (!before.decisions.some((x) => x.id === d.id)) op(`personal:decision:${d.id}`, { type: "create", kind: "decision", ref: d.id, data: d, label: "Decision added" });
console.log(`Personal layer: ${ops.length} operations`);

// ---- photos ----
const imgSrc = read("images.js");
let uploaded = 0, skipped = 0;
if (imgSrc) {
  const ictx = { window: {} };
  vm.createContext(ictx);
  vm.runInContext(imgSrc, ictx);
  const IMAGES = ictx.window.HOROLOGY_IMAGES;
  const files = new Set();
  const toCloud = (src) => { if (!src?.startsWith("img/")) return src; files.add(src.slice(4)); return `sb:${cid}/${src.slice(4)}`; };
  for (const [id, info] of Object.entries(IMAGES)) {
    if (!info.src && !info.choices) { op(`img:${id}`, { type: "update", kind: "watch", ref: id, data: { imageInfo: info }, label: "Photo" }); continue; }
    op(`img:${id}`, { type: "update", kind: "watch", ref: id, label: "Photo", data: { imageInfo: { ...info, src: toCloud(info.src), choices: info.choices?.map((c) => ({ ...c, src: toCloud(c.src) })) } } });
  }
  // Photos picked or added with the local server.
  const state = read("state/ops.json") ? JSON.parse(read("state/ops.json")) : [];
  const rewrite = (v) => (typeof v === "string" ? toCloud(v) : Array.isArray(v) ? v.map(rewrite) : v && typeof v === "object" ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, rewrite(x)])) : v);
  for (const o of state) ops.push({ ...o, collection_id: cid, data: rewrite(o.data ?? null), pending: undefined, author: undefined });
  if (state.length) console.log(`Local server history: ${state.length} operations`);

  const TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", avif: "image/avif" };
  const list = [...files];
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    const file = path.join(root, "img", f);
    if (!fs.existsSync(file)) continue;
    const r = await fetch(`${URL_}/storage/v1/object/photos/${cid}/${f}`, { method: "POST", headers: { ...H, "content-type": TYPES[f.split(".").pop()] || "application/octet-stream", "x-upsert": "false" }, body: fs.readFileSync(file) });
    if (r.ok) uploaded++;
    else { const t = await r.text(); if (/exists|Duplicate|409/i.test(t + r.status)) skipped++; else { console.error(`Photo ${f}: ${r.status} ${t.slice(0, 120)}`); } }
    process.stdout.write(`\rPhotos: ${i + 1}/${list.length}`);
  }
  process.stdout.write("\n");
}

// ---- send, ignoring anything already there ----
const rows = ops.map(({ pending, author, privateTo, ...o }) => ({
  id: o.id, collection_id: o.collection_id, at: o.at, device: o.device, type: o.type, kind: o.kind ?? null, ref: o.ref ?? null,
  target: o.target ?? null, data: o.data ?? null, label: o.label ?? null, group: o.group ?? null, private_to: null,
}));
for (let i = 0; i < rows.length; i += 200) {
  const r = await fetch(`${URL_}/rest/v1/ops?on_conflict=id`, { method: "POST", headers: { ...H, "content-type": "application/json", prefer: "resolution=ignore-duplicates,return=minimal" }, body: JSON.stringify(rows.slice(i, i + 200)) });
  if (!r.ok) { console.error("Sending failed:", r.status, (await r.text()).slice(0, 300)); process.exit(1); }
}
console.log(`Done: ${rows.length} operations sent, ${uploaded} photos uploaded${skipped ? `, ${skipped} already there` : ""}.`);
