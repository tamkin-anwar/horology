// Saving. Every change is an append-only operation ({ type, kind, ref, data }) layered over the
// base dataset (data.js + personal.js). Nothing in the base is ever rewritten, so:
//   · two copies merge by union of operation ids (no conflicts to resolve),
//   · any action can be undone by appending an "undo" operation,
//   · the same log can later sync through iCloud to a native app.
// Operations live in IndexedDB (marked persistent), are mirrored to prototype/state/ on disk by
// the local server when it's running, and can be exported as a backup file.
(function () {
  const DB_NAME = "horology", OS = "ops";
  let db = null, ops = [], serverOk = false, persisted = false;
  const subs = new Set();

  const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
  const device = (() => {
    try { let d = localStorage.getItem("horology.device"); if (!d) localStorage.setItem("horology.device", (d = uid())); return d; } catch { return "unknown"; }
  })();

  function openDb() {
    return new Promise((res, rej) => {
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(OS, { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  function tx(mode, fn) {
    return new Promise((res, rej) => {
      const t = db.transaction(OS, mode);
      const req = fn(t.objectStore(OS));
      t.oncomplete = () => res(req && "result" in req ? req.result : undefined);
      t.onerror = () => rej(t.error);
    });
  }
  const sort = () => ops.sort((a, b) => a.at - b.at || (a.id < b.id ? -1 : 1));

  async function saveLocal(list) {
    if (!list.length) return;
    if (db) { await tx("readwrite", (s) => { list.forEach((o) => s.put(o)); }); return; }
    try { localStorage.setItem("horology.ops", JSON.stringify(ops)); } catch {}
  }
  async function mirror(list) {
    if (!serverOk || !list.length) return;
    try {
      const r = await fetch("/api/ops", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(list) });
      if (!r.ok) throw new Error(r.status);
    } catch { serverOk = false; emit(); }
  }
  function merge(list) {
    const have = new Set(ops.map((o) => o.id));
    const add = (Array.isArray(list) ? list : []).filter((o) => o && o.id && o.type && !have.has(o.id));
    ops.push(...add);
    sort();
    return add;
  }
  const emit = () => subs.forEach((fn) => fn());

  async function load() {
    try { db = await openDb(); ops = (await tx("readonly", (s) => s.getAll())) || []; }
    catch { db = null; try { ops = JSON.parse(localStorage.getItem("horology.ops")) || []; } catch { ops = []; } }
    sort();
    // The disk mirror only exists when the local server runs (not on the public demo).
    try {
      const r = await fetch("/api/ops", { cache: "no-store" });
      if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
        serverOk = true;
        const remote = await r.json();
        const fromDisk = merge(remote);
        await saveLocal(fromDisk);
        const onDisk = new Set(remote.map((o) => o.id));
        await mirror(ops.filter((o) => !onDisk.has(o.id)));
      }
    } catch {}
    try { persisted = (await navigator.storage?.persisted?.()) || (await navigator.storage?.persist?.()) || false; } catch {}
  }

  async function commit(op) {
    const full = { id: uid(), at: Date.now(), device, ...op };
    ops.push(full);
    emit();
    await saveLocal([full]);
    mirror([full]);
    return full;
  }

  const undoneSet = () => new Set(ops.filter((o) => o.type === "undo").map((o) => o.target));
  function lastUndoable() {
    const undone = undoneSet();
    for (let i = ops.length - 1; i >= 0; i--) if (ops[i].type !== "undo" && !undone.has(ops[i].id)) return ops[i];
    return null;
  }
  async function undo(id) {
    const target = id ? ops.find((o) => o.id === id) : lastUndoable();
    if (!target) return null;
    // A grouped action (several ops with the same group) is undone together.
    const group = target.group ? ops.filter((o) => o.group === target.group) : [target];
    for (const o of group) await commit({ type: "undo", target: o.id, label: o.label });
    return target;
  }

  // Materialise: base dataset + every live operation, in time order.
  function apply(base) {
    const undone = undoneSet();
    const col = { watch: new Map(), decision: new Map(), milestone: new Map(), strap: new Map() };
    base.owned.forEach((w) => col.watch.set(w.id, { ...w, status: "owned" }));
    base.wants.forEach((w) => col.watch.set(w.id, { ...w, status: "want" }));
    base.decisions.forEach((d) => col.decision.set(d.id, { ...d, candidates: [...d.candidates] }));
    base.milestones.forEach((m) => col.milestone.set(m.id, { ...m }));
    base.straps.forEach((s) => col.strap.set(s.id, { ...s }));
    for (const o of ops) {
      if (o.type === "undo" || undone.has(o.id)) continue;
      const m = col[o.kind];
      if (!m) continue;
      if (o.type === "create") m.set(o.ref, { ...o.data, id: o.ref });
      else if (o.type === "update" && m.has(o.ref)) m.set(o.ref, { ...m.get(o.ref), ...o.data });
      else if (o.type === "delete") m.delete(o.ref);
    }
    return { watches: [...col.watch.values()], decisions: [...col.decision.values()], milestones: [...col.milestone.values()], straps: [...col.strap.values()] };
  }

  function exportData() {
    return { app: "horology", format: 1, exportedAt: new Date().toISOString(), device, ops };
  }
  async function importData(json) {
    const list = Array.isArray(json) ? json : json?.ops;
    if (!Array.isArray(list)) throw new Error("This isn't a Horology backup.");
    const add = merge(list);
    await saveLocal(add);
    await mirror(add);
    emit();
    return add.length;
  }

  window.Store = {
    load, commit, undo, lastUndoable, apply, exportData, importData, uid,
    on: (fn) => subs.add(fn),
    info: () => ({ changes: ops.filter((o) => o.type !== "undo").length, serverOk, persisted, indexedDb: !!db }),
  };
})();
