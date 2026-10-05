(function () {
  // The base dataset is never edited. Every change is an operation in store.js, and the
  // collections below are rebuilt from base + operations after each one.
  const BASE = window.HOROLOGY;
  const IMAGES = window.HOROLOGY_IMAGES || {};
  let D, ALL, MS, DEC, inDecision, DISMISSED;

  function rebuild() {
    const m = window.Store.apply(BASE);
    const live = m.watches.filter((w) => !w.archived);
    D = {
      ...BASE,
      owned: live.filter((w) => w.status === "owned"),
      wants: live.filter((w) => w.status !== "owned").sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0)),
      decisions: m.decisions.filter((d) => !d.dismissed),
      milestones: m.milestones,
      straps: m.straps,
    };
    DISMISSED = m.decisions.filter((d) => d.dismissed);
    ALL = Object.fromEntries(m.watches.map((w) => [w.id, w]));
    MS = Object.fromEntries(m.milestones.map((x) => [x.id, x]));
    DEC = Object.fromEntries(m.decisions.map((d) => [d.id, d]));
    inDecision = {};
    D.decisions.forEach((d) => [...d.candidates, d.chosen].filter(Boolean).forEach((id) => (inDecision[id] = inDecision[id] || []).push(d)));
  }
  const alive = (id) => ALL[id] && !ALL[id].archived;
  const cands = (d) => d.candidates.filter(alive);

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve"];
  const word = (n) => words[n] || String(n);
  const monthLabel = (ym) => { if (!ym) return ""; const [y, mo] = ym.split("-").map(Number); return new Date(y, (mo || 1) - 1, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" }); };

  // ---------- naming ----------
  const STORES = {
    "teddybaldassarre.com": "Teddy Baldassarre", "jomashop.com": "Jomashop", "the1916company.com": "The 1916 Company",
    "chrono24.com": "Chrono24", "amazon.com": "Amazon", "clickybezel.square.site": "Clicky Bezel", "jpavilion.com": "J. Pavilion",
    "hodinkee.com": "Hodinkee Shop", "gearpatrol.com": "Gear Patrol (article)", "grandseikoboutique.us": "Grand Seiko Boutique US",
  };
  function storeOf(url) {
    let h;
    try { h = new URL(url).hostname.replace(/^(www|us|shop)\./, ""); } catch { return "Link"; }
    if (STORES[h]) return STORES[h];
    if (h.includes("grand-seiko")) return "Grand Seiko · Singapore";
    if (url.includes("middleeast")) return "Seiko · Middle East";
    return "Official site";
  }
  // Cards use the short name; the drawer also shows the full marketing name.
  const title = (w) => (w.model ? w.model.replace(/ Co-Axial( Master)? Chronometer/g, "").trim() : w.ref || w.maker);
  const subtitle = (w) => {
    if (w.level === "brand") return "Brand only · model not chosen";
    if (!w.model && w.ref) return "Model name not found in link";
    return w.variant || "";
  };
  const makerLine = (w) => (w.collab ? `${w.maker} × ${w.collab}` : w.maker);
  const deadLink = (w) => !w.relinked && /dead link/.test(IMAGES[w.id]?.missing || "");
  const needsAttention = (w) => w.variantLost || deadLink(w) || ["partial", "broken", "brand", "text", "article", "repaired"].includes(w.capture);

  // ---------- art ----------
  function dial(w, size, opts = {}) {
    return `<div class="dial" style="--s:${size}px">${window.Dial.svg(w.dial[0], w.dial[1], opts)}</div>`;
  }
  function photoOf(w) {
    if (w.photoPick === "drawing") return null;
    if (w.photoPick) return w.photoPick;
    if (w.photo) return w.photo;
    return IMAGES[w.id]?.src ? IMAGES[w.id] : null;
  }
  const pendingPick = (w) => !w.photoPick && !photoOf(w) && IMAGES[w.id]?.choices?.length > 0;

  // A real photo on a soft light card, with the drawing underneath until the photo has loaded.
  function media(w, size, opts = {}) {
    const p = photoOf(w);
    if (!p) return dial(w, size, opts);
    return `<div class="media" style="--s:${size}px">${dial(w, size)}<img src="${esc(p.src)}" alt="" loading="lazy" decoding="async" onload="photoLoaded(this)" onerror="this.remove()"></div>`;
  }
  const tile = (src, size) => `<div class="media" style="--s:${size}px"><img src="${esc(src)}" alt="" onload="photoLoaded(this)"></div>`;

  // Studio packshots (white corners) sit on the light card; lifestyle photos show full-bleed.
  const shotKind = new Map();
  window.photoLoaded = (img) => {
    let kind = shotKind.get(img.src);
    if (!kind) {
      kind = "studio";
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 24;
        const x = c.getContext("2d", { willReadFrequently: true });
        x.drawImage(img, 0, 0, 24, 24);
        const px = [[1, 1], [22, 1], [1, 22], [22, 22], [12, 1]].map(([a, b]) => x.getImageData(a, b, 1, 1).data);
        const bright = px.filter(([r, g, b, al]) => al < 20 || (Math.min(r, g, b) > 214 && Math.max(r, g, b) - Math.min(r, g, b) < 26)).length;
        kind = bright >= 4 ? "studio" : "scene";
      } catch {}
      shotKind.set(img.src, kind);
    }
    img.parentNode.classList.add("in", kind);
  };

  const lock = `<svg class="ico" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>`;

  // ---------- saving ----------
  const upd = (kind, ref, data) => ({ type: "update", kind, ref, data });
  const create = (kind, data) => ({ type: "create", kind, ref: `${kind[0]}-${window.Store.uid().slice(0, 8)}`, data });

  async function act(ops, label) {
    const group = ops.length > 1 ? window.Store.uid() : undefined;
    let first = null;
    for (const o of ops) { const c = await window.Store.commit({ ...o, label, group }); first = first || c; }
    rebuild();
    refresh();
    toast(label, first && first.id);
  }

  let toastTimer;
  function toast(label, opId) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(label)}</span>${opId ? `<button data-undo="${opId}">Undo</button>` : ""}`;
    t.classList.add("on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("on"), 6000);
  }

  // ---------- views ----------
  function viewCollection() {
    const hero = ALL["citizen-zenshin-80x"] && !ALL["citizen-zenshin-80x"].archived ? ALL["citizen-zenshin-80x"] : D.owned[0];
    const heroCap = hero.occasion ? `${esc(hero.occasion)} · live` : "Live";
    const stories = D.owned.filter((w) => w.occasion).length;
    const open = D.decisions.filter((d) => d.status === "open").length;
    const needs = D.inbox.filter((i) => i.kind === "broken").length + D.wants.filter(deadLink).length;
    const brands = new Set(D.wants.map((w) => w.maker)).size;
    return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">The collection · ${new Date().getFullYear()}</p>
        <h1>${word(D.owned.length)} watches.<br><em>${stories ? `${word(stories)} of them mark something.` : "Each one has a story to add."}</em></h1>
        <p class="lede">Every watch you own, every one you're weighing, and the moments they belong to. Built from your note, line by line.</p>
        <dl class="stats">
          <div><dt>Wanted</dt><dd>${D.wants.length}</dd></div>
          <div><dt>Brands</dt><dd>${brands}</dd></div>
          <div><dt>Open decisions</dt><dd>${open}</dd></div>
          <div><dt>Need you</dt><dd>${needs}</dd></div>
        </dl>
      </div>
      <button class="hero-dial" data-open="${hero.id}" aria-label="Open ${esc(title(hero))}">
        <div class="spot"></div>
        ${dial(hero, 620, { live: true })}
        <p class="hero-cap"><span>${esc(hero.maker)} ${esc(title(hero))}</span><span class="muted">${heroCap}</span></p>
      </button>
    </section>

    <section class="block">
      <header class="block-head"><h2>In the box</h2><p class="muted">${lock} Stories are private. Nothing here is shared.</p></header>
      <div class="grid owned">
        ${D.owned.map((w) => `
          <button class="card owned-card" data-open="${w.id}">
            ${media(w, 240)}
            <div class="meta">
              <p class="maker">${esc(makerLine(w))}</p>
              <h3>${esc(title(w))}</h3>
              ${w.occasion ? `<p class="story">${esc(w.occasion)}${w.from ? ` · from ${esc(w.from)}` : ""}${w.story ? ` · ${esc(w.story)}` : ""}</p>` : `<p class="story muted">No story yet · add one</p>`}
              ${w.acquired ? `<p class="muted small">${esc(monthLabel(w.acquired))}</p>` : ""}
            </div>
          </button>`).join("")}
      </div>
    </section>`;
  }

  function candidateCard(id, d) {
    const w = ALL[id];
    const chosen = d.chosen === id;
    const considered = d.status === "decided" && !chosen;
    return `<div class="cand-wrap">
      <button class="cand ${chosen ? "chosen" : ""} ${considered ? "considered" : ""}" data-open="${id}">
        ${media(w, 132)}
        <p class="maker">${esc(makerLine(w))}</p>
        <p class="cand-title">${esc(title(w))}</p>
        ${w.ref && w.model ? `<p class="ref">${esc(w.ref)}</p>` : ""}
        ${chosen ? `<span class="tag gold">Chosen</span>` : considered ? `<span class="tag">Considered</span>` : w.saves > 1 ? `<span class="tag">Saved ${w.saves}×</span>` : ""}
      </button>
      ${d.status === "open" ? `<div class="cand-acts"><button data-act="choose" data-d="${d.id}" data-w="${id}">Choose</button><button data-act="uncand" data-d="${d.id}" data-w="${id}" aria-label="Remove from this decision">Remove</button></div>` : ""}
    </div>`;
  }

  function viewDecisions() {
    const order = (d) => (d.milestone ? 0 : 1) + (d.source === "suggested" ? 2 : 0) + (d.status === "decided" ? 4 : 0);
    const list = [...D.decisions].sort((a, b) => order(a) - order(b));
    const sourceTag = (d) => ({ note: ["From your note", ""], suggested: ["Suggested", "dashed"], kept: ["Kept", ""], you: ["Yours", ""] }[d.source] || ["Yours", ""]);
    return `
    <section class="page-head">
      <p class="eyebrow">Decisions</p>
      <h1>What you're choosing between.</h1>
      <p class="lede">A decision holds candidates. A milestone is optional. Decisions marked <span class="tag dashed">Suggested</span> were inferred from your variants. Keep them or dismiss them.</p>
      <div class="toolbar"><button class="btn" data-act="new-decision">New decision</button></div>
    </section>
    <section class="block decisions">
      ${list.map((d) => {
        const ms = d.milestone && MS[d.milestone];
        const live = cands(d);
        const ids = d.chosen && !live.includes(d.chosen) && alive(d.chosen) ? [d.chosen, ...live] : live;
        const [srcLabel, srcCls] = sourceTag(d);
        return `<article class="decision">
          <div class="dec-info">
            <div class="chips">
              ${ms ? `<span class="tag gold">${esc(ms.name)}</span>` : ""}
              <span class="tag ${d.status === "decided" ? "green" : ""}">${d.status === "decided" ? "Decided" : "Open"}</span>
              <span class="tag ${srcCls}">${srcLabel}</span>
            </div>
            <h2>${esc(d.name)}</h2>
            <p class="muted">${ids.length} ${ids.length === 1 ? "candidate" : "candidates"}${d.note ? ` · ${esc(d.note)}` : ""}${d.decidedAt ? ` · decided ${esc(monthLabel(d.decidedAt))}` : ""}</p>
            <div class="dec-actions">
              ${d.source === "suggested" ? `<button class="btn" data-act="keep" data-d="${d.id}">Keep</button>` : ""}
              ${d.status === "decided" ? `<button class="btn ghost" data-act="reopen" data-d="${d.id}">Reopen</button>` : ""}
              <button class="btn ghost" data-act="dismiss" data-d="${d.id}">Dismiss</button>
            </div>
          </div>
          <div class="cands">${ids.map((id) => candidateCard(id, d)).join("")}
            ${d.status === "open" ? `<button class="cand add" data-act="add-cand" data-d="${d.id}"><span>+</span><p>Add a candidate</p></button>` : ""}
          </div>
        </article>`;
      }).join("")}
      ${DISMISSED.length ? `<details class="dismissed"><summary>${DISMISSED.length} dismissed ${DISMISSED.length === 1 ? "decision" : "decisions"}</summary>
        ${DISMISSED.map((d) => `<div class="dismissed-row"><span>${esc(d.name)}</span><button class="btn ghost" data-act="restore" data-d="${d.id}">Restore</button></div>`).join("")}
      </details>` : ""}
    </section>`;
  }

  let wantFilter = "all", wantQuery = "";
  function wantCard(w) {
    const chips = [];
    if (w.capture === "added") chips.push(`<span class="goldtxt">Just added</span>`);
    if (w.size) chips.push(esc(w.size));
    if (w.saves > 1) chips.push(`Saved ${w.saves}×`);
    if (w.variantLost) chips.push(`<span class="warn">Variant lost</span>`);
    if (deadLink(w)) chips.push(`<span class="warn">Dead link</span>`);
    if (w.capture === "text") chips.push("Typed, no link");
    if (w.siblingOf) chips.push("Sibling of yours");
    if (inDecision[w.id]) chips.push(`<span class="goldtxt">${esc(inDecision[w.id][0].name)}</span>`);
    if (pendingPick(w)) chips.push(`<span class="goldtxt">Pick a photo</span>`);
    return `<button class="card want" data-open="${w.id}">
      ${media(w, 150)}
      <p class="maker">${esc(makerLine(w))}</p>
      <h3>${esc(title(w))}</h3>
      ${w.ref && w.model ? `<p class="ref">${esc(w.ref)}</p>` : ""}
      ${subtitle(w) ? `<p class="sub ${w.model ? "" : "muted"}">${esc(subtitle(w))}</p>` : ""}
      ${w.reason && !w.milestone ? `<p class="reason">“${esc(w.reason)}”</p>` : ""}
      ${chips.length ? `<p class="chips small">${chips.map((c) => `<span class="chip">${c}</span>`).join("")}</p>` : ""}
    </button>`;
  }

  function viewWants() {
    const q = wantQuery.toLowerCase();
    let list = D.wants.filter((w) => !q || `${w.maker} ${w.collab || ""} ${w.model || ""} ${w.ref || ""} ${w.variant || ""}`.toLowerCase().includes(q));
    if (wantFilter === "decision") list = list.filter((w) => inDecision[w.id]);
    if (wantFilter === "loose") list = list.filter((w) => !inDecision[w.id]);
    if (wantFilter === "attention") list = list.filter(needsAttention);
    if (wantFilter === "photo") list = list.filter(pendingPick);
    if (wantFilter === "dead") list = list.filter(deadLink);
    const groups = {};
    list.forEach((w) => (groups[w.maker] = groups[w.maker] || []).push(w));
    const makers = Object.keys(groups);
    const f = (k, label, n) => `<button class="seg ${wantFilter === k ? "on" : ""}" data-filter="${k}">${label}${n ? ` <i>${n}</i>` : ""}</button>`;
    const nPick = D.wants.filter(pendingPick).length, nDead = D.wants.filter(deadLink).length;
    return `
    <section class="page-head">
      <p class="eyebrow">Wants</p>
      <h1>${D.wants.length} watches, ${new Set(D.wants.map((w) => w.maker)).size} makers.</h1>
      <p class="lede">Liking a watch doesn't require a decision. These are the ones you saved, merged and cleaned. Blank fields mean the link didn't say. Nothing was guessed.</p>
      <div class="toolbar">
        <div class="segs">${f("all", "All")}${f("decision", "In a decision")}${f("loose", "Just wanted")}${f("attention", "Needs attention")}${nPick ? f("photo", "Pick a photo", nPick) : ""}${nDead ? f("dead", "Dead links", nDead) : ""}</div>
        <input class="search" type="search" placeholder="Search maker, model, reference" value="${esc(wantQuery)}" aria-label="Search wants">
      </div>
    </section>
    <section class="block">
      ${makers.length ? makers.map((m) => `
        <div class="brand-group">
          <header class="brand-head"><h2>${esc(m)}</h2><span class="muted">${groups[m].length}</span></header>
          <div class="grid wants">${groups[m].map(wantCard).join("")}</div>
        </div>`).join("") : `<p class="empty">Nothing matches.</p>`}
    </section>`;
  }

  function viewJourney() {
    const byDate = (a, b) => (a.date && b.date ? a.date.localeCompare(b.date) : 0);
    const past = D.milestones.filter((m) => m.when === "past" && alive(m.watch)).sort(byDate);
    const ahead = D.milestones.filter((m) => m.when === "ahead" && DEC[m.decision] && !DEC[m.decision].dismissed).sort(byDate);
    const history = ALL["seiko-skx007"];
    const none = !D.milestones.length;
    return `
    <section class="page-head">
      <p class="eyebrow">Journey</p>
      <h1>The watches, in the order life happened.</h1>
      <p class="lede">${none ? "Milestones are personal, so this public build ships without any. Add one and the watches it belongs to will line up here." : "Dates are yours to add. Your note didn't have them, so none were invented."}</p>
      <div class="toolbar"><button class="btn" data-act="new-milestone">New milestone</button></div>
    </section>
    <section class="block journey">
      <ol class="timeline">
        ${past.map((m) => {
          const w = ALL[m.watch];
          const d = m.decision && DEC[m.decision];
          return `<li class="moment">
            <div class="node"></div>
            <div class="moment-card">
              <button class="moment-art" data-open="${w.id}">${media(w, 170)}</button>
              <div>
                <p class="eyebrow">${esc(m.name)}</p>
                <h3>${esc(w.maker)} ${esc(title(w))}</h3>
                ${m.note ? `<p class="story">${lock} ${esc(m.note)}</p>` : ""}
                ${d ? `<p class="muted small">Shortlist was ${cands(d).map((id) => esc(title(ALL[id]))).join(", ")}. The ${esc(title(w))} won.</p>` : ""}
                <button class="date-add ${m.date ? "set" : ""}" data-act="ms-date" data-m="${m.id}">${m.date ? esc(monthLabel(m.date)) : "Add date"}</button>
              </div>
            </div>
          </li>`;
        }).join("")}
        ${ahead.length ? `<li class="divider"><span>Ahead</span></li>` : ""}
        ${ahead.map((m) => {
          const d = DEC[m.decision];
          const ids = cands(d);
          return `<li class="moment ahead">
            <div class="node hollow"></div>
            <div class="moment-card">
              <div class="mini-row">${ids.length ? ids.map((id) => `<button data-open="${id}" class="mini">${media(ALL[id], 110)}</button>`).join("") : `<button class="mini empty-mini" data-act="add-cand" data-d="${d.id}">+</button>`}</div>
              <div>
                <p class="eyebrow">${esc(m.name)}</p>
                <h3>${ids.length ? ids.map((id) => esc(ALL[id].maker + (ALL[id].model ? " " + title(ALL[id]) : ""))).join(" or ") : "No candidates yet"}</h3>
                <p class="muted small">${d.status === "decided" && d.chosen ? `Decided: ${esc(title(ALL[d.chosen]))}` : `${ids.length} ${ids.length === 1 ? "candidate" : "candidates"} · undecided`}</p>
                <button class="date-add ${m.date ? "set" : ""}" data-act="ms-date" data-m="${m.id}">${m.date ? esc(monthLabel(m.date)) : "Add date"}</button>
              </div>
            </div>
          </li>`;
        }).join("")}
        ${history && alive(history.id) && history.status !== "owned" ? `<li class="moment ahead">
          <div class="node hollow"></div>
          <button class="moment-card" data-open="${history.id}">
            ${media(history, 130)}
            <div>
              <p class="eyebrow">Someday · no occasion needed</p>
              <h3>Seiko SKX007</h3>
              <p class="story">“${esc(history.reason)}”</p>
            </div>
          </button>
        </li>` : ""}
      </ol>
    </section>`;
  }

  function strapSVG(s) {
    return `<svg viewBox="0 0 120 420" class="strap-svg" aria-hidden="true">
      <defs><linearGradient id="st" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#050404"/><stop offset=".5" stop-color="${s.colour}"/><stop offset=".52" stop-color="#2a2522"/><stop offset="1" stop-color="#050404"/></linearGradient>
      <linearGradient id="bk" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fafaf8"/><stop offset=".5" stop-color="#9c9c98"/><stop offset="1" stop-color="#e8e8e4"/></linearGradient></defs>
      <rect x="30" y="10" width="60" height="180" rx="8" fill="url(#st)"/>
      <rect x="35" y="16" width="50" height="168" rx="5" fill="none" stroke="#d8cfbf" stroke-opacity=".35" stroke-dasharray="3 3" stroke-width=".8"/>
      <rect x="22" y="192" width="76" height="22" rx="7" fill="none" stroke="url(#bk)" stroke-width="5"/>
      <rect x="30" y="226" width="60" height="186" rx="8" fill="url(#st)"/>
      <path d="M 30 405 Q 60 420 90 405" fill="none" stroke="#000" stroke-opacity=".4"/>
      <rect x="35" y="232" width="50" height="168" rx="5" fill="none" stroke="#d8cfbf" stroke-opacity=".35" stroke-dasharray="3 3" stroke-width=".8"/>
      ${[260, 285, 310, 335].map((y) => `<circle cx="60" cy="${y}" r="3" fill="#000" fill-opacity=".7"/>`).join("")}
    </svg>`;
  }

  function viewStraps() {
    return `
    <section class="page-head">
      <p class="eyebrow">Straps</p>
      <h1>Straps belong to watches.</h1>
      <p class="lede">Fit is checked against the lug widths you recorded. No lug width, no verdict.</p>
    </section>
    <section class="block">
      ${D.straps.map((s) => `
        <article class="strap">
          <div class="strap-art">${strapSVG(s)}</div>
          <div class="strap-info">
            <div class="chips"><span class="tag">Wanted</span><span class="tag gold">${s.lugWidth} mm</span></div>
            <p class="maker">${esc(s.maker)}</p>
            <h2>${esc(s.name)}</h2>
            <p class="muted">${esc(s.material)}</p>
            <ul class="fit">
              ${D.owned.map((w) => {
                const lw = (w.specs || {})["Lug width"];
                const mm = lw && parseFloat(lw);
                const st = !lw ? "unknown" : isNaN(mm) ? "no" : mm === s.lugWidth ? "yes" : "no";
                const why = !lw ? "Lug width not recorded" : isNaN(mm) ? `${lw} bracelet` : `${lw} lugs`;
                return `<li class="fit-${st}"><button data-open="${w.id}">${media(w, 56)}<span><strong>${esc(w.maker)} ${esc(title(w))}</strong><em>${esc(why)}</em></span><b>${st === "yes" ? "Fits" : st === "no" ? "Doesn't fit" : "Unknown"}</b></button></li>`;
              }).join("")}
            </ul>
            <a class="link" href="${s.urls[0]}" target="_blank" rel="noopener">Delugs →</a>
          </div>
        </article>`).join("")}
    </section>`;
  }

  const KIND = {
    variant: ["Variant lost", "warn"], matched: ["Matched", "green"], duplicate: ["Merged", ""], cleaned: ["Cleaned", ""],
    repaired: ["Recovered", "green"], broken: ["Needs you", "red"], brand: ["Brand only", ""], article: ["Article", ""], empty: ["Ignored", ""], partial: ["Partial", ""],
  };
  function viewInbox() {
    const order = ["broken", "variant", "brand", "repaired", "matched", "duplicate", "cleaned", "article", "partial", "empty"];
    const list = [...D.inbox].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));
    return `
    <section class="page-head">
      <p class="eyebrow">Import report</p>
      <h1>What happened to your note.</h1>
      <p class="lede">Every messy line, and what the importer did with it. The raw text is always kept.</p>
    </section>
    <section class="block inbox">
      ${Object.keys(IMAGES).length ? viewPhotoRows() : ""}
      ${list.map((i) => {
        const w = i.target && ALL[i.target];
        const [label, cls] = KIND[i.kind];
        return `<${w ? `button data-open="${w.id}"` : "div"} class="row">
          ${w ? media(w, 64) : `<div class="row-blank"></div>`}
          <div class="row-body"><p><span class="tag ${cls}">${label}</span></p><h3>${esc(i.title)}</h3><p class="muted">${esc(i.detail)}</p>${i.raw ? `<p class="ref">${esc(i.raw)}</p>` : ""}</div>
        </${w ? "button" : "div"}>`;
      }).join("")}
    </section>`;
  }

  // Photo status for the whole collection, grouped by why a photo is missing.
  function viewPhotoRows() {
    const ws = [...D.owned, ...D.wants];
    const have = ws.filter((w) => photoOf(w)).length;
    const pick = ws.filter(pendingPick);
    const dead = D.wants.filter(deadLink);
    const none = ws.filter((w) => !photoOf(w) && !pendingPick(w) && w.photoPick !== "drawing");
    const why = {};
    none.forEach((w) => {
      const m = IMAGES[w.id]?.missing || "added before photos";
      const k = /dead link/.test(m) ? "dead links" : /no exact match/.test(m) ? "references no store carries" : /brand only/.test(m) ? "brand only" : /blocks|no photo on page|timed out/.test(m) ? "sites that block lookups" : "other";
      why[k] = (why[k] || 0) + 1;
    });
    return `
      <div class="row"><div class="row-blank photo-count">${have}</div><div class="row-body"><p><span class="tag green">Photos</span></p><h3>${have} of ${ws.length} watches have a real photo</h3><p class="muted">From the page you saved, or a store listing whose reference matches exactly. Never from a guess.</p></div></div>
      ${pick.length ? `<button class="row" data-goto="wants" data-setfilter="photo"><div class="row-blank photo-count">${pick.length}</div><div class="row-body"><p><span class="tag gold">Pick a photo</span></p><h3>${pick.length} watches need you to pick the right photo</h3><p class="muted">No reference to confirm them, so the closest matches are offered. Nothing is used until you choose.</p></div></button>` : ""}
      ${dead.length ? `<button class="row" data-goto="wants" data-setfilter="dead"><div class="row-blank photo-count">${dead.length}</div><div class="row-body"><p><span class="tag warn">Dead links</span></p><h3>${dead.length} saved links no longer work</h3><p class="muted">The stores moved or removed these pages. Open one and paste a fresh link: the photo and reference come with it.</p></div></button>` : ""}
      ${none.length ? `<div class="row"><div class="row-blank photo-count">${none.length}</div><div class="row-body"><p><span class="tag">No photo yet</span></p><h3>${none.length} watches still show the drawing</h3><p class="muted">${Object.entries(why).map(([k, v]) => `${v} ${k}`).join(" · ")}.</p></div></div>` : ""}`;
  }

  // ---------- drawer ----------
  let drawerId = null;
  function openDrawer(id) {
    const w = ALL[id];
    if (!w || w.archived) { closeDrawer(); return; }
    drawerId = id;
    const owned = w.status === "owned";
    const specs = owned && w.specs && Object.keys(w.specs).length ? w.specs : {
      Reference: w.ref, Size: w.size, Variant: w.variant, Movement: null, Crystal: null, "Lug width": null, "Water resistance": null,
    };
    const decs = inDecision[id] || [];
    const sib = w.siblingOf && ALL[w.siblingOf];
    $("#drawer-body").innerHTML = `
      <div class="d-hero"><div class="spot"></div>${photoOf(w) ? media(w, 380) : dial(w, 380, { live: true })}</div>
      ${photoCaption(w)}
      <p class="maker">${esc(makerLine(w))}${w.region ? ` · ${esc(w.region)}` : ""}</p>
      <h2>${esc(title(w))}</h2>
      ${w.model && w.model !== title(w) ? `<p class="muted">${esc(w.model)}</p>` : ""}
      ${w.ref && w.model ? `<p class="ref big">${esc(w.ref)}</p>` : ""}
      ${subtitle(w) ? `<p class="muted">${esc(subtitle(w))}</p>` : ""}
      <div class="chips">
        <span class="tag ${owned ? "green" : ""}">${owned ? "Owned" : "Wanted"}</span>
        ${w.occasion ? `<span class="tag gold">${esc(w.occasion)}</span>` : ""}
        ${w.acquired ? `<span class="tag">${esc(monthLabel(w.acquired))}</span>` : ""}
        ${decs.map((d) => `<button class="tag gold link-tag" data-goto="decisions">${esc(d.name)}</button>`).join("")}
      </div>
      <div class="d-actions">
        ${owned ? `<button class="btn" data-act="story" data-w="${id}">${w.occasion || w.story ? "Edit story" : "Add a story"}</button>`
          : `<button class="btn" data-act="own" data-w="${id}">I own this</button><button class="btn ghost" data-act="to-decision" data-w="${id}">Add to a decision</button>`}
        <button class="btn ghost" data-act="edit" data-w="${id}">Edit</button>
        <button class="btn ghost" data-act="relink" data-w="${id}">${w.urls.length ? "Replace link" : "Add a link"}</button>
        <button class="btn ghost danger" data-act="archive" data-w="${id}">Remove</button>
      </div>
      ${deadLink(w) ? `<p class="note warn">The saved link is dead: the store moved or removed the page. <button class="inline" data-act="relink" data-w="${id}">Paste a fresh link</button> and the photo and reference come with it.</p>` : ""}
      ${w.from || w.story ? `<div class="private">${lock}<div><p class="eyebrow">Private story</p><p>${esc([w.occasion, w.from && `Gift from ${w.from}`, w.story].filter(Boolean).join(" · "))}</p></div></div>` : ""}
      ${w.reason && !w.occasion ? `<blockquote>“${esc(w.reason)}”</blockquote>` : ""}
      ${sib ? `<p class="note">Sibling of the <button class="inline" data-open="${sib.id}">${esc(title(sib))}</button> you own.</p>` : ""}
      ${w.variantLost ? `<p class="note warn">You saved this ${w.saves} times with the same link. The variant you picked on the site wasn't captured. Which ones did you mean?</p>` : ""}
      ${photoChoices(w)}
      <h4>Specifications</h4>
      <dl class="specs">${Object.entries(specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="${v ? "" : "nf"}">${v ? esc(v) : "Not found"}</dd></div>`).join("")}</dl>
      ${w.urls.length ? `<h4>Where to find it</h4><ul class="listings">${w.urls.map((u, i) => `<li><a href="${esc(u)}" target="_blank" rel="noopener"><span>${esc(storeOf(u))}${i === 0 && deadLink(w) ? ` <em class="warn">dead</em>` : ""}</span><span class="muted">Price not tracked →</span></a></li>`).join("")}</ul>` : ""}
      ${w.raw ? `<h4>Original line</h4><p class="ref raw">${esc(w.raw)}</p>` : ""}
      <p class="fine">Photos come from the page you saved or an exact reference match; they stay on this computer. Drawings are illustrative. Specs come only from your note and the link itself.</p>`;
    document.body.classList.add("drawer-open");
    $("#drawer").setAttribute("aria-hidden", "false");
  }
  function closeDrawer() {
    drawerId = null;
    document.body.classList.remove("drawer-open");
    $("#drawer").setAttribute("aria-hidden", "true");
    setTimeout(() => { if (!document.body.classList.contains("drawer-open")) $("#drawer-body").innerHTML = ""; }, 400);
  }

  function photoCaption(w) {
    const p = photoOf(w);
    const im = IMAGES[w.id];
    if (p) return `<p class="photo-cap">Photo · ${esc(p.source || "")}${p.method ? ` · ${esc(p.method)}` : ""} <button class="inline" data-act="pick" data-w="${w.id}" data-i="-1">Show the drawing</button></p>`;
    if (w.photoPick === "drawing" && (im?.src || im?.choices?.length || w.photo)) return `<p class="photo-cap">Drawing · <button class="inline" data-act="pick" data-w="${w.id}" data-i="-2">Show the photo</button></p>`;
    return "";
  }

  function photoChoices(w) {
    const im = IMAGES[w.id];
    if (!im?.choices?.length || im.src) return "";
    const cur = w.photoPick;
    return `<h4>${cur && cur !== "drawing" ? "Your pick" : "Which one is it?"}</h4>
      <p class="muted small">There's no reference to confirm these, so they're the closest matches. Nothing is used until you pick.</p>
      <div class="choices">${im.choices.map((c, i) => `<button class="choice ${cur?.src === c.src ? "on" : ""}" data-act="pick" data-w="${w.id}" data-i="${i}">
        ${tile(c.src, 150)}<span>${esc(c.title)}</span><em>${esc(c.source)}</em></button>`).join("")}
        <button class="choice none ${cur === "drawing" ? "on" : ""}" data-act="pick" data-w="${w.id}" data-i="-1"><span>None of these</span><em>Keep the drawing</em></button>
      </div>`;
  }

  // ---------- sheets (small forms) ----------
  // onSubmit returns false to keep the sheet open (e.g. a lookup step), anything else closes it.
  let sheetSubmit = null;
  function openSheet(html, onSubmit) {
    $("#sheet-body").innerHTML = html;
    sheetSubmit = onSubmit;
    document.body.classList.add("sheet-open");
    $("#sheet").setAttribute("aria-hidden", "false");
    setTimeout(() => $("#sheet-body input:not([type=hidden]):not([type=radio]), #sheet-body textarea, #sheet-body select")?.focus(), 60);
  }
  function closeSheet() {
    sheetSubmit = null;
    document.body.classList.remove("sheet-open");
    $("#sheet").setAttribute("aria-hidden", "true");
  }
  const field = (name, label, value = "", attrs = "") => `<label>${label}<input name="${name}" value="${esc(value)}" ${attrs}></label>`;
  const area = (name, label, value = "") => `<label>${label}<textarea name="${name}" rows="3">${esc(value)}</textarea></label>`;
  const sheetHead = (eyebrow, h) => `<p class="eyebrow">${eyebrow}</p><h2>${h}</h2>`;
  const openDecisions = () => D.decisions.filter((d) => d.status === "open");
  const aheadMilestones = () => D.milestones.filter((m) => m.when === "ahead");

  function sheetOwn(w) {
    openSheet(`${sheetHead("Into the collection", `You own the ${esc(title(w))}.`)}
      <form data-sheet class="fields">
        ${field("acquired", "When", new Date().toISOString().slice(0, 7), 'type="month"')}
        ${field("occasion", "Occasion (optional)", "", 'placeholder="e.g. Graduation"')}
        ${field("from", "Gift from (optional)", "")}
        ${area("story", "The story (private)", "")}
        <button class="btn wide">Move to the collection</button>
      </form>`, (f) => {
      const ops = [upd("watch", w.id, {
        status: "owned", acquired: f.acquired || null, occasion: f.occasion || null, from: f.from || null, story: f.story || null,
        specs: Object.fromEntries(Object.entries({ Reference: w.ref, Size: w.size, Variant: w.variant }).filter(([, v]) => v)),
      })];
      // Owning a candidate settles any open decision it's in.
      (inDecision[w.id] || []).filter((d) => d.status === "open").forEach((d) => ops.push(upd("decision", d.id, { status: "decided", chosen: w.id, decidedAt: f.acquired || null })));
      return act(ops, `${title(w)} moved to your collection`);
    });
  }

  function sheetStory(w) {
    openSheet(`${sheetHead("Private story", esc(title(w)))}
      <form data-sheet class="fields">
        ${field("acquired", "When", w.acquired || "", 'type="month"')}
        ${field("occasion", "Occasion", w.occasion || "")}
        ${field("from", "Gift from", w.from || "")}
        ${area("story", "The story", w.story || "")}
        <button class="btn wide">Save</button>
      </form>`, (f) => act([upd("watch", w.id, { acquired: f.acquired || null, occasion: f.occasion || null, from: f.from || null, story: f.story || null })], "Story saved"));
  }

  function sheetEdit(w) {
    openSheet(`${sheetHead("Edit", esc(title(w)))}
      <form data-sheet class="fields">
        ${field("maker", "Maker", w.maker)}
        ${field("model", "Model", w.model || "", 'placeholder="Not found"')}
        ${field("ref", "Reference", w.ref || "", 'placeholder="Not found" spellcheck="false"')}
        ${field("variant", "Version (dial, strap, bracelet)", w.variant || "")}
        ${field("size", "Case size", w.size || "", 'placeholder="e.g. 38 mm"')}
        ${w.status === "owned" ? "" : field("reason", "Why you want it", w.reason || "")}
        <button class="btn wide">Save</button>
      </form>`, (f) => {
      const data = { maker: f.maker || w.maker, model: f.model || null, ref: f.ref || null, variant: f.variant || null, size: f.size || null };
      if ("reason" in f) data.reason = f.reason || null;
      if (w.variantLost && f.variant) data.variantLost = false;
      return act([upd("watch", w.id, data)], "Saved");
    });
  }

  function decisionPicker(selected) {
    const opts = openDecisions().map((d) => `<label class="radio"><input type="radio" name="dec" value="${d.id}" ${selected === d.id ? "checked" : ""}><span>${esc(d.name)}<em>${cands(d).length} ${cands(d).length === 1 ? "candidate" : "candidates"}${d.milestone && MS[d.milestone] ? ` · ${esc(MS[d.milestone].name)}` : ""}</em></span></label>`).join("");
    return `<div class="radios">${opts}<label class="radio"><input type="radio" name="dec" value="new" ${opts && selected !== "new" ? "" : "checked"}><span>New decision<input name="decName" placeholder="e.g. Everyday GMT"></span></label></div>`;
  }
  // Ops that put watch `wid` into the chosen or a new decision. null = nothing chosen yet.
  function decisionOps(f, wid) {
    if (f.dec && f.dec !== "new") {
      const d = DEC[f.dec];
      return d.candidates.includes(wid) ? [] : [upd("decision", d.id, { candidates: [...d.candidates, wid] })];
    }
    const name = (f.decName || "").trim();
    if (!name) return null;
    return [create("decision", { name, source: "you", status: "open", candidates: [wid] })];
  }

  function sheetToDecision(w) {
    openSheet(`${sheetHead("Add to a decision", esc(title(w)))}
      <form data-sheet class="fields">${decisionPicker()}<button class="btn wide">Add</button></form>`, (f) => {
      const ops = decisionOps(f, w.id);
      if (!ops) { $("#sheet-body [name=decName]").focus(); return false; }
      if (!ops.length) { toast("Already in that decision"); return; }
      return act(ops, "Added to the decision");
    });
  }

  function sheetNewDecision() {
    const ms = aheadMilestones().filter((m) => !m.decision || !DEC[m.decision] || DEC[m.decision].dismissed);
    openSheet(`${sheetHead("New decision", "What are you choosing?")}
      <form data-sheet class="fields">
        ${field("name", "Name", "", 'placeholder="e.g. Everyday GMT" required')}
        <label>Milestone (optional)<select name="ms"><option value="">None</option>${ms.map((m) => `<option value="${m.id}">${esc(m.name)}</option>`).join("")}<option value="new">New milestone…</option></select></label>
        ${field("msName", "New milestone name", "", 'placeholder="Only if you chose New milestone"')}
        <button class="btn wide">Create</button>
      </form>`, async (f) => {
      const name = (f.name || "").trim();
      if (!name) return false;
      const dec = create("decision", { name, source: "you", status: "open", candidates: [] });
      const ops = [dec];
      if (f.ms === "new" && (f.msName || "").trim()) {
        const m = create("milestone", { name: f.msName.trim(), when: "ahead", decision: dec.ref });
        dec.data.milestone = m.ref;
        ops.push(m);
      } else if (f.ms && f.ms !== "new") {
        dec.data.milestone = f.ms;
        ops.push(upd("milestone", f.ms, { decision: dec.ref }));
      }
      await act(ops, `“${name}” created`);
      sheetAddCand(DEC[dec.ref]);
      return false; // the sheet now shows the candidate picker
    });
  }

  function sheetAddCand(d) {
    const pool = [...D.wants, ...D.owned].filter((w) => !d.candidates.includes(w.id));
    const row = (w) => `<button type="button" class="pick-row" data-cand="${w.id}" data-q="${esc(`${w.maker} ${w.collab || ""} ${w.model || ""} ${w.ref || ""}`.toLowerCase())}">${media(w, 44)}<span><strong>${esc(w.maker)} ${esc(title(w))}</strong><em>${esc(w.ref || w.variant || "")}${w.status === "owned" ? " · owned" : ""}</em></span></button>`;
    openSheet(`${sheetHead("Add a candidate", esc(d.name))}
      <div class="fields"><input class="pick-search" placeholder="Search your watches" aria-label="Search your watches"></div>
      <div class="pick-list">${pool.map(row).join("")}</div>
      <button class="btn ghost wide" data-act="add-new-for" data-d="${d.id}">A watch that isn't saved yet…</button>`, null);
    $("#sheet-body").dataset.decision = d.id;
  }

  function sheetMsDate(m) {
    openSheet(`${sheetHead("Milestone", esc(m.name))}
      <form data-sheet class="fields">
        ${field("date", "When", m.date || "", 'type="month"')}
        ${field("name", "Name", m.name)}
        <button class="btn wide">Save</button>
      </form>`, (f) => act([upd("milestone", m.id, { date: f.date || null, name: f.name || m.name })], "Milestone saved"));
  }

  function sheetNewMilestone() {
    openSheet(`${sheetHead("New milestone", "A moment a watch belongs to.")}
      <form data-sheet class="fields">
        ${field("name", "Name", "", 'placeholder="e.g. First job" required')}
        ${field("date", "When (optional)", "", 'type="month"')}
        <div class="radios">
          <label class="radio"><input type="radio" name="when" value="ahead" checked><span>Still ahead<em>Creates a decision to collect candidates</em></span></label>
          <label class="radio"><input type="radio" name="when" value="past"><span>Already happened<em>Pick the watch that marks it</em></span></label>
        </div>
        <label>Watch (if it already happened)<select name="watch"><option value="">Choose…</option>${D.owned.map((w) => `<option value="${w.id}">${esc(w.maker)} ${esc(title(w))}</option>`).join("")}</select></label>
        <button class="btn wide">Create</button>
      </form>`, (f) => {
      const name = (f.name || "").trim();
      if (!name) return false;
      if (f.when === "past") {
        if (!f.watch) { $("#sheet-body select[name=watch]").focus(); return false; }
        return act([create("milestone", { name, when: "past", date: f.date || null, watch: f.watch })], `“${name}” added`);
      }
      const dec = create("decision", { name: `${name} watch`, source: "you", status: "open", candidates: [] });
      const m = create("milestone", { name, when: "ahead", date: f.date || null, decision: dec.ref });
      dec.data.milestone = m.ref;
      return act([dec, m], `“${name}” added`);
    });
  }

  // Replace or add a link: look it up, show what came back, then confirm.
  function sheetRelink(w) {
    openSheet(`${sheetHead(w.urls.length ? "Replace link" : "Add a link", esc(title(w)))}
      <form data-sheet class="inline-form"><input name="url" placeholder="https://…" spellcheck="false" autocomplete="off"><button class="btn">Look up</button></form>
      <div id="relink-result"></div>`, async (f) => {
      const url = (f.url || "").trim();
      if (!/^https?:\/\//i.test(url)) return false;
      $("#relink-result").innerHTML = lookingHtml();
      const r = await apiLookup(url);
      if (!r) { $("#relink-result").innerHTML = serverNote(); return false; }
      $("#relink-result").innerHTML = `
        ${r.photo ? `<div class="add-photo">${tile(r.photo.src, 200)}<p class="photo-cap">Photo · ${esc(r.photo.source)}</p></div>` : `<p class="note">${esc(r.note || "No photo on that page.")}</p>`}
        <p class="muted small center">${esc(r.title || "")}${r.ref ? ` · ${esc(r.ref)}` : ""}</p>
        <button class="btn wide" id="relink-save">Use this link</button>`;
      $("#relink-save").onclick = () => {
        const data = { urls: [url, ...w.urls.filter((u, i) => u !== url && !(deadLink(w) && i === 0))], relinked: true };
        if (r.photo) { data.photo = r.photo; data.photoPick = null; }
        if (!w.ref && r.ref) data.ref = r.ref;
        closeSheet();
        act([upd("watch", w.id, data)], "Link updated");
      };
      return false;
    });
  }

  // ---------- add a watch ----------
  let addState = null;
  const RETAILERS = /teddy baldassarre|jomashop|the 1916 company|chrono24|amazon|crown & caliber/i;
  // "SSK001 5 Sports GMT 42.5mm - Black on Bracelet | Store" → model, size, variant.
  function splitTitle(t, ref) {
    let [main, variant = ""] = (t || "").split(/\s[|–—]\s/)[0].split(/\s+-\s+/);
    if (ref) main = main.replace(new RegExp("^" + ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*", "i"), "");
    const size = main.match(/\b(\d{2}(?:\.\d)?)\s?mm\b/i);
    if (size) main = main.replace(size[0], "").replace(/\s{2,}/g, " ");
    return { model: main.trim(), size: size ? `${size[1]} mm` : null, variant: variant.trim() || null };
  }
  const lookingHtml = () => `<div class="looking">${dial({ dial: ["dress", "#1d1d1f"] }, 110, { live: true })}<p class="muted">Finding the watch and its photo…</p></div>`;
  const serverNote = () => `<p class="note warn">This needs the local server, because a browser can't read other sites by itself. Run <code>node server.mjs</code> in <code>prototype/</code> and open localhost:4377.</p>`;
  async function apiLookup(q) {
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`);
      if (!res.ok || !(res.headers.get("content-type") || "").includes("json")) throw new Error(res.status);
      return await res.json();
    } catch { return null; }
  }

  function openAdd(context = {}) {
    addState = { context };
    document.body.classList.add("add-open");
    $("#add").setAttribute("aria-hidden", "false");
    $("#add-result").innerHTML = context.decision ? `<p class="muted small">It will be added to “${esc(DEC[context.decision].name)}”.</p>` : "";
    $("#add-q").value = "";
    setTimeout(() => $("#add-q").focus(), 50);
  }
  function closeAdd() {
    document.body.classList.remove("add-open");
    $("#add").setAttribute("aria-hidden", "true");
  }

  async function lookup(q) {
    $("#add-result").innerHTML = lookingHtml();
    const r = await apiLookup(q);
    if (!r) { $("#add-result").innerHTML = serverNote(); return; }
    addState = { ...addState, q, r, pick: r.photo || null, why: addState.context.decision ? "decision" : "want" };
    addState.parts = splitTitle(r.title, r.ref);
    drawAdd();
  }

  function drawAdd() {
    const { r, pick, parts, why, context } = addState;
    const maker = r.maker && !RETAILERS.test(r.maker) ? r.maker.replace(/ Watch(es)?$/i, "") : "";
    const variants = (r.variants || []).filter((v) => v.title && v.title !== "Default Title");
    const ambiguous = !r.ref && !variants.length && r.url;
    const seg = (k, label) => `<button type="button" class="seg ${why === k ? "on" : ""}" data-why="${k}">${label}</button>`;
    $("#add-result").innerHTML = `
      ${r.photo ? `<div class="add-photo">${tile(r.photo.src, 220)}<p class="photo-cap">Photo · ${esc(r.photo.source)} · ${esc(r.photo.method)}</p></div>` : ""}
      ${!r.photo && r.choices?.length ? `<p class="muted small">${esc(r.note)}</p><div class="choices">${r.choices.map((c, i) => `<button type="button" class="choice ${pick === c ? "on" : ""}" data-add-pick="${i}">${tile(c.src, 150)}<span>${esc(c.title)}</span><em>${esc(c.source)}</em></button>`).join("")}</div>` : ""}
      ${!r.photo && !r.choices?.length ? `<p class="note">${esc(r.note || "No photo found.")} It will show as a drawing until a photo turns up.</p>` : ""}
      <form class="fields" id="add-fields" onsubmit="return false">
        ${field("maker", "Maker", maker, 'placeholder="e.g. Grand Seiko"')}
        ${field("model", "Model", parts.model, 'placeholder="Not found"')}
        ${field("ref", "Reference", r.ref || "", 'placeholder="Not found" spellcheck="false"')}
        ${variants.length ? `<p class="label-like">Which version? <em>The store lists ${variants.length}.</em></p><div class="vchips">${variants.map((v) => `<button type="button" class="chip-btn ${parts.variant === v.title ? "on" : ""}" data-variant="${esc(v.title)}">${esc(v.title)}</button>`).join("")}</div>` : ""}
        ${field("variant", "Version (dial, strap, bracelet)", parts.variant || "", 'placeholder="Optional"')}
        ${ambiguous ? `<p class="note small">This page doesn't name a reference, and brand pages often cover several versions under one link. If you know the reference, add it above; otherwise describe the version you meant.</p>` : ""}
        <p class="label-like">Why are you saving it?</p>
        <div class="segs why">${seg("want", "Just want it")}${seg("decision", "Comparing")}${seg("milestone", "For a milestone")}${seg("own", "I own it")}</div>
        <div class="why-body">
          ${why === "want" ? field("reason", "Reason (optional)", "", 'placeholder="e.g. Because of its history"') : ""}
          ${why === "decision" ? decisionPicker(context.decision) : ""}
          ${why === "milestone" ? `<div class="radios">${aheadMilestones().map((m) => `<label class="radio"><input type="radio" name="ms" value="${m.id}"><span>${esc(m.name)}</span></label>`).join("")}<label class="radio"><input type="radio" name="ms" value="new" ${aheadMilestones().length ? "" : "checked"}><span>New milestone<input name="msName" placeholder="e.g. First job"></span></label></div>` : ""}
          ${why === "own" ? `${field("acquired", "When", new Date().toISOString().slice(0, 7), 'type="month"')}${field("occasion", "Occasion (optional)", "")}` : ""}
        </div>
        <button type="button" class="btn wide" id="add-save">Save</button>
      </form>`;
  }

  function saveAdd() {
    const f = Object.fromEntries(new FormData($("#add-fields")));
    const maker = (f.maker || "").trim(), model = (f.model || "").trim(), ref = (f.ref || "").trim();
    if (!maker && !model && !ref) { $("#add-fields [name=maker]").focus(); return; }
    const p = addState.pick;
    const why = addState.why;
    const owned = why === "own";
    const w = create("watch", {
      maker: maker || "Unknown maker", model: model || null, ref: ref || null, variant: (f.variant || "").trim() || null, size: addState.parts.size,
      urls: addState.r.url ? [addState.r.url] : [], dial: ["dress", "#1d1d1f"], capture: "added", addedAt: Date.now(),
      status: owned ? "owned" : "want", reason: (f.reason || "").trim() || null,
      photo: p ? { src: p.src, source: p.source, method: p.method || "your pick" } : null,
      ...(owned ? { acquired: f.acquired || null, occasion: (f.occasion || "").trim() || null, specs: Object.fromEntries(Object.entries({ Reference: ref, Size: addState.parts.size }).filter(([, v]) => v)) } : {}),
    });
    const ops = [w];
    if (why === "decision") {
      const more = decisionOps(f, w.ref);
      if (more === null) { $("#add-fields [name=decName]")?.focus(); return; }
      ops.push(...more);
    }
    if (why === "milestone") {
      if (f.ms && f.ms !== "new") {
        const d = DEC[MS[f.ms].decision];
        if (d) ops.push(upd("decision", d.id, { candidates: [...d.candidates, w.ref] }));
      } else {
        const name = (f.msName || "").trim();
        if (!name) { $("#add-fields [name=msName]")?.focus(); return; }
        const dec = create("decision", { name: `${name} watch`, source: "you", status: "open", candidates: [w.ref] });
        const m = create("milestone", { name, when: "ahead", decision: dec.ref });
        dec.data.milestone = m.ref;
        ops.push(dec, m);
      }
    }
    closeAdd();
    act(ops, `${maker || model || ref} added`).then(() => {
      const target = owned ? "collection" : why === "want" ? "wants" : why === "milestone" ? "journey" : "decisions";
      if (location.hash !== "#" + target) location.hash = target;
      setTimeout(() => openDrawer(w.ref), 120);
    });
  }

  // ---------- footer: where your data lives ----------
  function renderFoot() {
    const i = window.Store.info();
    $("#foot").innerHTML = `
      <span class="dot ${i.serverOk ? "ok" : i.indexedDb ? "" : "bad"}"></span>
      <span>${i.changes} saved ${i.changes === 1 ? "change" : "changes"} · ${i.serverOk ? "in this browser and mirrored to disk (prototype/state)" : i.indexedDb ? "in this browser only" : "not saved: browser storage is unavailable"}${i.persisted ? " · protected from browser clean-up" : ""}</span>
      <span class="foot-acts">
        <button data-act="backup">Back up</button>
        <label class="foot-btn">Restore<input type="file" accept="application/json,.json" id="restore-file" hidden></label>
        <button data-act="undo-last" ${window.Store.lastUndoable() ? "" : "disabled"}>Undo last</button>
      </span>`;
  }

  function backup() {
    const blob = new Blob([JSON.stringify(window.Store.exportData(), null, 1)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `horology-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast("Backup downloaded");
  }

  async function restore(file) {
    try {
      const n = await window.Store.importData(JSON.parse(await file.text()));
      rebuild();
      refresh();
      toast(n ? `Restored ${n} ${n === 1 ? "change" : "changes"}` : "Nothing new in that backup");
    } catch (e) {
      toast(/Horology/.test(e.message) ? e.message : "That file couldn't be read");
    }
  }

  // ---------- legacy: Batch 1 kept photo picks and added watches in localStorage ----------
  async function migrateLegacy() {
    let picks = {}, added = [];
    try { picks = JSON.parse(localStorage.getItem("horology.picks")) || {}; added = JSON.parse(localStorage.getItem("horology.added")) || []; } catch {}
    for (const [id, p] of Object.entries(picks)) await window.Store.commit({ type: "update", kind: "watch", ref: id, data: { photoPick: p }, label: "Photo chosen" });
    for (const w of added) await window.Store.commit({ type: "create", kind: "watch", ref: w.id, data: { ...w, status: "want" }, label: "Watch added" });
    try { localStorage.removeItem("horology.picks"); localStorage.removeItem("horology.added"); } catch {}
  }

  // ---------- routing ----------
  const VIEWS = { collection: viewCollection, decisions: viewDecisions, wants: viewWants, journey: viewJourney, straps: viewStraps, inbox: viewInbox };
  function render() {
    const v = (location.hash.slice(1) || "collection").split("?")[0];
    const view = VIEWS[v] ? v : "collection";
    $("#main").innerHTML = VIEWS[view]();
    document.querySelectorAll("[data-view]").forEach((a) => a.classList.toggle("on", a.dataset.view === view));
    $("#count-inbox").textContent = D.inbox.filter((i) => i.kind === "broken" || i.kind === "variant").length + D.wants.filter(deadLink).length || "";
    $("#count-decisions").textContent = D.decisions.filter((d) => d.status === "open").length || "";
    const s = $(".search");
    if (s) s.addEventListener("input", (e) => { wantQuery = e.target.value; const pos = e.target.selectionStart; render(); const n = $(".search"); n.focus(); n.setSelectionRange(pos, pos); });
  }
  // Re-render after a change without losing your place.
  function refresh() {
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    if (drawerId) openDrawer(drawerId);
    renderFoot();
  }

  // ---------- events ----------
  async function onAct(el) {
    const a = el.dataset.act, w = ALL[el.dataset.w], d = DEC[el.dataset.d], m = MS[el.dataset.m];
    switch (a) {
      case "keep": return act([upd("decision", d.id, { source: "kept" })], `Kept “${d.name}”`);
      case "dismiss": return act([upd("decision", d.id, { dismissed: true })], `Dismissed “${d.name}”`);
      case "restore": return act([upd("decision", d.id, { dismissed: false })], `Restored “${d.name}”`);
      case "reopen": return act([upd("decision", d.id, { status: "open", chosen: null, decidedAt: null })], `Reopened “${d.name}”`);
      case "choose": return act([upd("decision", d.id, { status: "decided", chosen: w.id, decidedAt: new Date().toISOString().slice(0, 7) })], `Chose the ${title(w)}`);
      case "uncand": return act([upd("decision", d.id, { candidates: d.candidates.filter((x) => x !== w.id) })], `Removed from “${d.name}”`);
      case "add-cand": return sheetAddCand(d);
      case "add-new-for": closeSheet(); return openAdd({ decision: d.id });
      case "new-decision": return sheetNewDecision();
      case "new-milestone": return sheetNewMilestone();
      case "ms-date": return sheetMsDate(m);
      case "own": return sheetOwn(w);
      case "story": return sheetStory(w);
      case "edit": return sheetEdit(w);
      case "to-decision": return sheetToDecision(w);
      case "relink": return sheetRelink(w);
      case "archive": closeDrawer(); return act([upd("watch", w.id, { archived: true })], `Removed the ${title(w)}`);
      case "pick": {
        const i = Number(el.dataset.i);
        const c = IMAGES[w.id]?.choices?.[i];
        const data = i === -2 ? { photoPick: null } : i === -1 ? { photoPick: "drawing" } : { photoPick: { src: c.src, source: c.source, title: c.title, method: "your pick" } };
        return act([upd("watch", w.id, data)], i === -1 ? "Showing the drawing" : i === -2 ? "Showing the photo" : "Photo chosen");
      }
      case "backup": return backup();
      case "undo-last": {
        const t = await window.Store.undo();
        rebuild(); refresh();
        return toast(t ? `Undid: ${t.label || "last change"}` : "Nothing to undo");
      }
    }
  }

  // Keep what was typed when the add form redraws.
  function refill(fd, skip = []) {
    for (const [k, v] of fd) { const el = $(`#add-fields [name="${k}"]`); if (el && !skip.includes(k) && el.type !== "radio") el.value = v; }
  }

  document.addEventListener("click", async (e) => {
    const un = e.target.closest("[data-undo]");
    if (un) { const t = await window.Store.undo(un.dataset.undo); rebuild(); refresh(); toast(t ? `Undid: ${t.label || "change"}` : "Nothing to undo"); return; }
    const ac = e.target.closest("[data-act]");
    if (ac && !ac.disabled) { e.preventDefault(); onAct(ac); return; }
    const cand = e.target.closest("[data-cand]");
    if (cand) {
      const d = DEC[$("#sheet-body").dataset.decision];
      closeSheet();
      return act([upd("decision", d.id, { candidates: [...d.candidates, cand.dataset.cand] })], `Added to “${d.name}”`);
    }
    const ap = e.target.closest("[data-add-pick]");
    if (ap) { const keep = new FormData($("#add-fields")); addState.pick = addState.r.choices[Number(ap.dataset.addPick)]; drawAdd(); refill(keep); return; }
    const vc = e.target.closest("[data-variant]");
    if (vc) { const keep = new FormData($("#add-fields")); addState.parts.variant = vc.dataset.variant; drawAdd(); refill(keep, ["variant"]); return; }
    const wy = e.target.closest("[data-why]");
    if (wy) { const keep = new FormData($("#add-fields")); addState.why = wy.dataset.why; drawAdd(); refill(keep); return; }
    if (e.target.closest("#add-open")) { openAdd(); return; }
    if (e.target.closest("[data-add-close]")) { closeAdd(); return; }
    if (e.target.closest("[data-sheet-close]")) { closeSheet(); return; }
    if (e.target.closest("#add-save")) { saveAdd(); return; }
    const o = e.target.closest("[data-open]");
    if (o) { openDrawer(o.dataset.open); return; }
    const g = e.target.closest("[data-goto]");
    if (g) { if (g.dataset.setfilter) wantFilter = g.dataset.setfilter; closeDrawer(); if (location.hash === "#" + g.dataset.goto) render(); else location.hash = g.dataset.goto; return; }
    const f = e.target.closest("[data-filter]");
    if (f) { wantFilter = f.dataset.filter; render(); return; }
    if (e.target.closest("[data-close]")) closeDrawer();
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target;
    if (form.id === "add-form") { e.preventDefault(); const q = $("#add-q").value.trim(); if (q) lookup(q); return; }
    if (form.matches("[data-sheet]") && sheetSubmit) {
      e.preventDefault();
      const submit = sheetSubmit;
      const result = await submit(Object.fromEntries(new FormData(form)), form);
      if (result !== false && sheetSubmit === submit) closeSheet();
    }
  });
  document.addEventListener("input", (e) => {
    if (e.target.matches(".pick-search")) {
      const q = e.target.value.toLowerCase();
      document.querySelectorAll(".pick-row").forEach((r) => { r.hidden = !!q && !r.dataset.q.includes(q); });
    }
  });
  document.addEventListener("change", (e) => { if (e.target.id === "restore-file" && e.target.files[0]) { restore(e.target.files[0]); e.target.value = ""; } });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (document.body.classList.contains("sheet-open")) closeSheet();
    else if (document.body.classList.contains("add-open")) closeAdd();
    else closeDrawer();
  });
  window.addEventListener("hashchange", () => { closeDrawer(); render(); window.scrollTo({ top: 0 }); });
  window.Store.on(() => renderFoot());

  (async () => {
    await window.Store.load();
    await migrateLegacy();
    rebuild();
    render();
    renderFoot();
  })();
})();
