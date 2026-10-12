// Saving. Every change is an append-only operation ({ type, kind, ref, data }) layered over the
// base dataset (data.js + personal.js). Nothing in the base is ever rewritten, so:
//   · two copies merge by union of operation ids (no conflicts to resolve),
//   · any action can be undone by appending an "undo" operation,
//   · several people can share one history.
//
// Two modes:
//   · Shared (config.js has a Supabase project): you sign in, operations live in the project's
//     "ops" table, the other person's changes arrive live, photos come from private storage.
//     IndexedDB keeps a cache so the app opens instantly and works offline; unsent operations
//     are retried.
//   · Local (no config): IndexedDB, mirrored to prototype/state/ by the local server if running.
(function () {
  const CFG = window.HOROLOGY_CONFIG || {};
  const CONFIGURED = !!(CFG.supabaseUrl && CFG.supabaseKey);
  let db = null, ops = [], serverOk = false, persisted = false, dbName = "horology";
  const subs = new Set();
  const cloud = { sb: null, session: null, email: null, collection: null, members: [], channel: null, online: false };
  const photoUrls = new Map(); // "sb:path" -> signed URL

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const device = (() => {
    try { let d = localStorage.getItem("horology.device"); if (!d) localStorage.setItem("horology.device", (d = uid())); return d; } catch { return "unknown"; }
  })();

  // ---------- IndexedDB ----------
  function openDb(name) {
    return new Promise((res, rej) => {
      const r = indexedDB.open(name, 1);
      r.onupgradeneeded = () => r.result.createObjectStore("ops", { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function tx(handle, mode, fn) {
    return new Promise((res, rej) => {
      const t = handle.transaction("ops", mode);
      const req = fn(t.objectStore("ops"));
      t.oncomplete = () => res(req && "result" in req ? req.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  const sort = () => ops.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));
  async function saveLocal(list) {
    if (!list.length) return;
    if (db) { await tx(db, "readwrite", (s) => { list.forEach((o) => s.put(o)); }); return; }
    try { localStorage.setItem(dbName + ".ops", JSON.stringify(ops)); } catch {}
  }
  function merge(list) {
    const byId = new Map(ops.map((o) => [o.id, o]));
    const add = [];
    for (const o of Array.isArray(list) ? list : []) {
      if (!o || !o.id || !o.type) continue;
      const have = byId.get(o.id);
      if (!have) { ops.push(o); byId.set(o.id, o); add.push(o); }
      else if (have.pending && !o.pending) { Object.assign(have, o, { pending: false }); add.push(have); }
    }
    sort();
    return add;
  }
  const emit = (why) => subs.forEach((fn) => fn(why));

  // ---------- Supabase rows <-> operations ----------
  const toRow = (o) => ({ id: o.id, collection_id: cloud.collection.id, at: o.at, device: o.device, type: o.type, kind: o.kind ?? null, ref: o.ref ?? null, target: o.target ?? null, data: o.data ?? null, label: o.label ?? null, group: o.group ?? null, private_to: o.privateTo ?? null });
  const fromRow = (r) => ({ id: r.id, at: Number(r.at), device: r.device, type: r.type, kind: r.kind, ref: r.ref, target: r.target, data: r.data, label: r.label, group: r.group, privateTo: r.private_to, author: r.author });

  async function sendPending() {
    if (!cloud.online) return;
    const pending = ops.filter((o) => o.pending);
    for (let i = 0; i < pending.length; i += 200) {
      const chunk = pending.slice(i, i + 200);
      const { error } = await cloud.sb.from("ops").upsert(chunk.map(toRow), { onConflict: "id", ignoreDuplicates: true });
      if (error) { console.warn("Not sent yet:", error.message); return; }
      chunk.forEach((o) => { o.pending = false; o.author = o.author || cloud.email; });
      await saveLocal(chunk);
    }
  }

  async function loadCloud() {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    cloud.sb = createClient(CFG.supabaseUrl, CFG.supabaseKey, { auth: { persistSession: true, autoRefreshToken: true } });
    const { data } = await cloud.sb.auth.getSession();
    cloud.session = data.session;
    cloud.email = data.session?.user?.email?.toLowerCase() || null;
    if (!cloud.session) return;
    const { data: mem } = await cloud.sb.from("members").select("collection_id, collections(name)").eq("email", cloud.email).limit(1);
    if (!mem?.length) return;
    cloud.collection = { id: mem[0].collection_id, name: mem[0].collections?.name || "Watches" };
    await loadMembers();

    // Local cache for this collection, then everything on the server.
    dbName = `horology-${cloud.collection.id}`;
    try { db = await openDb(dbName); ops = (await tx(db, "readonly", (s) => s.getAll())) || []; } catch { db = null; }
    sort();
    try {
      for (let from = 0; ; from += 1000) {
        const { data: rows, error } = await cloud.sb.from("ops").select("*").eq("collection_id", cloud.collection.id).order("at").range(from, from + 999);
        if (error) throw error;
        await saveLocal(merge(rows.map(fromRow)));
        if (rows.length < 1000) break;
      }
      cloud.online = true;
    } catch (e) { console.warn("Offline, using the saved copy:", e.message); }
    await adoptLocalHistory();
    await sendPending();

    // The other person's changes, live.
    cloud.channel = cloud.sb.channel(`ops-${cloud.collection.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ops", filter: `collection_id=eq.${cloud.collection.id}` }, async (p) => {
        const add = merge([fromRow(p.new)]);
        if (add.length) { await saveLocal(add); emit("remote"); }
      })
      .subscribe();
    window.addEventListener("online", async () => { cloud.online = true; await sendPending(); emit("sync"); });
  }

  // Changes made before sharing was set up (this browser's local history) join the shared one once.
  async function adoptLocalHistory() {
    const flag = `horology.adopted.${cloud.collection.id}`;
    try { if (localStorage.getItem(flag)) return; } catch { return; }
    try {
      const old = await openDb("horology");
      const list = (await tx(old, "readonly", (s) => s.getAll())) || [];
      const add = merge(list.map((o) => ({ ...o, pending: true })));
      await saveLocal(add);
    } catch {}
    try { localStorage.setItem(flag, "1"); } catch {}
  }

  async function loadMembers() {
    const { data } = await cloud.sb.from("members").select("email, name, role").eq("collection_id", cloud.collection.id).order("added_at");
    cloud.members = data || [];
  }

  async function loadLocal() {
    try { db = await openDb("horology"); ops = (await tx(db, "readonly", (s) => s.getAll())) || []; }
    catch { db = null; try { ops = JSON.parse(localStorage.getItem("horology.ops")) || []; } catch { ops = []; } }
    sort();
    try {
      const r = await fetch("/api/ops", { cache: "no-store" });
      if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
        serverOk = true;
        const remote = await r.json();
        await saveLocal(merge(remote));
        const onDisk = new Set(remote.map((o) => o.id));
        await mirror(ops.filter((o) => !onDisk.has(o.id)));
      }
    } catch {}
  }
  async function mirror(list) {
    if (!serverOk || !list.length) return;
    try {
      const r = await fetch("/api/ops", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(list) });
      if (!r.ok) throw new Error(r.status);
    } catch { serverOk = false; emit("status"); }
  }

  async function load() {
    if (CONFIGURED) await loadCloud();
    else await loadLocal();
    try { persisted = (await navigator.storage?.persisted?.()) || (await navigator.storage?.persist?.()) || false; } catch {}
  }

  async function commit(op) {
    const full = { id: uid(), at: Date.now(), device, ...op };
    if (CONFIGURED) { full.pending = true; full.author = cloud.email; }
    ops.push(full);
    emit("local");
    await saveLocal([full]);
    if (CONFIGURED) sendPending().then(() => emit("status"));
    else mirror([full]);
    return full;
  }

  const undoneSet = () => new Set(ops.filter((o) => o.type === "undo").map((o) => o.target));
  function lastUndoable() {
    const undone = undoneSet();
    for (let i = ops.length - 1; i >= 0; i--) {
      const o = ops[i];
      // Only your own changes are yours to undo.
      if (o.type !== "undo" && !undone.has(o.id) && (!CONFIGURED || o.author === cloud.email)) return o;
    }
    return null;
  }
  async function undo(id) {
    const target = id ? ops.find((o) => o.id === id) : lastUndoable();
    if (!target) return null;
    const group = target.group ? ops.filter((o) => o.group === target.group) : [target];
    for (const o of group) await commit({ type: "undo", target: o.id, label: o.privateTo ? null : o.label });
    return target;
  }

  // Materialise: base dataset + every live operation, in time order.
  function apply(base) {
    const undone = undoneSet();
    const col = { watch: new Map(), decision: new Map(), milestone: new Map(), strap: new Map(), pick: new Map() };
    base.owned.forEach((w) => col.watch.set(w.id, { ...w, status: "owned" }));
    base.wants.forEach((w) => col.watch.set(w.id, { ...w, status: "want" }));
    base.decisions.forEach((d) => col.decision.set(d.id, { ...d, candidates: [...d.candidates] }));
    base.milestones.forEach((m) => col.milestone.set(m.id, { ...m }));
    base.straps.forEach((s) => col.strap.set(s.id, { ...s }));
    for (const o of ops) {
      if (o.type === "undo" || undone.has(o.id)) continue;
      const m = col[o.kind];
      if (!m) continue;
      if (o.type === "create") m.set(o.ref, { ...o.data, id: o.ref, addedBy: o.data?.addedBy || o.author || null });
      else if (o.type === "update" && m.has(o.ref)) m.set(o.ref, { ...m.get(o.ref), ...o.data });
      else if (o.type === "delete") m.delete(o.ref);
    }
    return { watches: [...col.watch.values()], decisions: [...col.decision.values()], milestones: [...col.milestone.values()], straps: [...col.strap.values()], picks: [...col.pick.values()] };
  }

  function exportData() {
    return { app: "horology", format: 1, exportedAt: new Date().toISOString(), device, collection: cloud.collection?.id || null, ops: ops.map(({ pending, ...o }) => o) };
  }
  async function importData(json) {
    const list = Array.isArray(json) ? json : json?.ops;
    if (!Array.isArray(list)) throw new Error("This isn't a Horology backup.");
    const add = merge(list.map((o) => (CONFIGURED ? { ...o, pending: true } : o)));
    await saveLocal(add);
    if (CONFIGURED) await sendPending(); else await mirror(add);
    emit("local");
    return add.length;
  }

  // ---------- shared-mode helpers ----------
  const needCloud = () => { if (!cloud.sb) throw new Error("Sharing isn't set up"); return cloud.sb; };
  async function signIn(email, password) {
    const { error } = await needCloud().auth.signInWithPassword({ email, password });
    if (error) throw error;
  }
  async function signUp(email, password) {
    const { data, error } = await needCloud().auth.signUp({ email, password });
    if (error) throw error;
    if (!data.session) throw new Error("Account created, but email confirmation is still switched on in Supabase. Turn off “Confirm email”, then sign in.");
  }
  async function signOut() { await needCloud().auth.signOut(); }
  async function createCollection(name, yourName) {
    const { error } = await needCloud().rpc("create_collection", { collection_name: name, your_name: yourName });
    if (error) throw error;
  }
  async function addMember(email, name) {
    const { error } = await needCloud().from("members").insert({ collection_id: cloud.collection.id, email: email.trim().toLowerCase(), name: name.trim() || null });
    if (error) throw error;
    await loadMembers();
  }
  async function removeMember(email) {
    const { error } = await needCloud().from("members").delete().eq("collection_id", cloud.collection.id).eq("email", email);
    if (error) throw error;
    await loadMembers();
  }
  async function setMyName(name) {
    const { error } = await needCloud().from("members").update({ name: name.trim() || null }).eq("collection_id", cloud.collection.id).eq("email", cloud.email);
    if (error) throw error;
    await loadMembers();
  }
  async function lookup(q) {
    const { data, error } = await needCloud().functions.invoke("lookup", { body: { q, collection: cloud.collection.id } });
    if (error) throw error;
    return data;
  }
  // Private photos are served through short-lived signed links, fetched in batches.
  async function resolvePhotos(srcs) {
    if (!cloud.sb) return 0;
    const paths = [...new Set(srcs.filter((s) => s && s.startsWith("sb:") && !photoUrls.has(s)).map((s) => s.slice(3)))];
    let n = 0;
    for (let i = 0; i < paths.length; i += 100) {
      const { data, error } = await cloud.sb.storage.from("photos").createSignedUrls(paths.slice(i, i + 100), 60 * 60 * 24 * 7);
      if (error) break;
      data.forEach((d) => { if (d.signedUrl) { photoUrls.set("sb:" + d.path, d.signedUrl); n++; } });
    }
    return n;
  }

  window.Store = {
    load, commit, undo, lastUndoable, apply, exportData, importData, uid,
    on: (fn) => subs.add(fn),
    info: () => ({
      changes: ops.filter((o) => o.type !== "undo").length, pending: ops.filter((o) => o.pending).length,
      serverOk, persisted, indexedDb: !!db, shared: CONFIGURED, online: cloud.online,
    }),
    cloud: {
      configured: CONFIGURED,
      get signedIn() { return !!cloud.session; },
      get email() { return cloud.email; },
      get collection() { return cloud.collection; },
      get members() { return cloud.members; },
      signIn, signUp, signOut, createCollection, addMember, removeMember, setMyName, lookup, resolvePhotos,
      photoUrl: (src) => photoUrls.get(src) || null,
    },
  };
})();
