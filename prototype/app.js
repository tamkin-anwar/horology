(function () {
  const D = window.HOROLOGY;
  const ALL = {};
  D.owned.forEach((w) => { w.status = "owned"; ALL[w.id] = w; });
  D.wants.forEach((w) => { w.status = "want"; ALL[w.id] = w; });
  // ---------- photos & local state ----------
  // Real photos come from images.js (gitignored, this machine only; see tools/fetch-images.mjs).
  // Photo picks and added watches live in this browser's storage until saving arrives in Batch 2.
  const IMAGES = window.HOROLOGY_IMAGES || {};
  const local = {
    get(k, d) { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  };
  const picks = local.get("horology.picks", {}); // id -> { src, source, title } or "drawing"
  const added = local.get("horology.added", []);
  added.forEach((w) => { w.status = "want"; ALL[w.id] = w; });
  D.wants.unshift(...added);

  const MS = Object.fromEntries(D.milestones.map((m) => [m.id, m]));
  const DEC = Object.fromEntries(D.decisions.map((d) => [d.id, d]));
  const inDecision = {};
  D.decisions.forEach((d) => [...d.candidates, d.chosen].filter(Boolean).forEach((id) => (inDecision[id] = inDecision[id] || []).push(d)));

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const words = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

  // ---------- naming ----------
  const STORES = {
    "teddybaldassarre.com": "Teddy Baldassarre", "jomashop.com": "Jomashop", "the1916company.com": "The 1916 Company",
    "chrono24.com": "Chrono24", "amazon.com": "Amazon", "clickybezel.square.site": "Clicky Bezel", "jpavilion.com": "J. Pavilion",
    "hodinkee.com": "Hodinkee Shop", "gearpatrol.com": "Gear Patrol (article)", "grandseikoboutique.us": "Grand Seiko Boutique US",
  };
  function storeOf(url, w) {
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
  const needsAttention = (w) => w.variantLost || ["partial", "broken", "brand", "text", "article", "repaired"].includes(w.capture);

  function dial(w, size, opts = {}) {
    return `<div class="dial" style="--s:${size}px">${window.Dial.svg(w.dial[0], w.dial[1], opts)}</div>`;
  }

  function photoOf(w) {
    const p = picks[w.id];
    if (p === "drawing") return null;
    if (p) return p;
    if (w.photo) return w.photo;
    return IMAGES[w.id]?.src ? IMAGES[w.id] : null;
  }
  const pendingPick = (w) => !picks[w.id] && !photoOf(w) && IMAGES[w.id]?.choices?.length > 0;

  // A real photo on a soft light card, with the drawing underneath until the photo has loaded.
  function media(w, size, opts = {}) {
    const p = photoOf(w);
    if (!p) return dial(w, size, opts);
    return `<div class="media" style="--s:${size}px">${dial(w, size)}<img src="${esc(p.src)}" alt="" loading="lazy" decoding="async" onload="photoLoaded(this)" onerror="this.remove()"></div>`;
  }

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

  // ---------- views ----------
  function viewCollection() {
    const hero = ALL["citizen-zenshin-80x"];
    const heroCap = hero.occasion ? `${esc(hero.occasion)} · live` : "Live";
    const stories = D.owned.filter((w) => w.occasion).length;
    const open = D.decisions.filter((d) => d.status === "open").length;
    const needs = D.inbox.filter((i) => i.kind === "broken").length;
    const brands = new Set(D.wants.map((w) => w.maker)).size;
    return `
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">The collection · ${new Date().getFullYear()}</p>
        <h1>${words[D.owned.length]} watches.<br><em>${stories ? `${words[stories]} of them mark something.` : "Each one has a story to add."}</em></h1>
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
            </div>
          </button>`).join("")}
      </div>
    </section>`;
  }

  function candidateCard(id, d) {
    const w = ALL[id];
    const chosen = d.chosen === id;
    const considered = d.status === "decided" && !chosen;
    return `<button class="cand ${chosen ? "chosen" : ""} ${considered ? "considered" : ""}" data-open="${id}">
      ${media(w, 132)}
      <p class="maker">${esc(makerLine(w))}</p>
      <p class="cand-title">${esc(title(w))}</p>
      ${w.ref && w.model ? `<p class="ref">${esc(w.ref)}</p>` : ""}
      ${chosen ? `<span class="tag gold">Chosen</span>` : considered ? `<span class="tag">Considered</span>` : w.saves > 1 ? `<span class="tag">Saved ${w.saves}×</span>` : ""}
    </button>`;
  }

  function viewDecisions() {
    const order = (d) => (d.milestone ? 0 : 1) + (d.source === "note" ? 0 : 2) + (d.status === "decided" ? 4 : 0);
    const list = [...D.decisions].sort((a, b) => order(a) - order(b));
    return `
    <section class="page-head">
      <p class="eyebrow">Decisions</p>
      <h1>What you're choosing between.</h1>
      <p class="lede">A decision holds candidates. A milestone is optional. Decisions marked <span class="tag">Suggested</span> were inferred from your variants. Keep them or dismiss them.</p>
    </section>
    <section class="block decisions">
      ${list.map((d) => {
        const ms = d.milestone && MS[d.milestone];
        const ids = d.chosen && !d.candidates.includes(d.chosen) ? [d.chosen, ...d.candidates] : d.candidates;
        return `<article class="decision">
          <div class="dec-info">
            <div class="chips">
              ${ms ? `<span class="tag gold">${esc(ms.name)}</span>` : ""}
              <span class="tag ${d.status === "decided" ? "green" : ""}">${d.status === "decided" ? "Decided" : "Open"}</span>
              <span class="tag ${d.source === "note" ? "" : "dashed"}">${d.source === "note" ? "From your note" : "Suggested"}</span>
            </div>
            <h2>${esc(d.name)}</h2>
            <p class="muted">${ids.length} ${ids.length === 1 ? "candidate" : "candidates"}${d.note ? ` · ${esc(d.note)}` : ""}</p>
            ${d.source === "suggested" ? `<div class="dec-actions"><button class="btn">Keep</button><button class="btn ghost">Dismiss</button></div>` : ""}
          </div>
          <div class="cands">${ids.map((id) => candidateCard(id, d)).join("")}
            ${d.status === "open" ? `<div class="cand add"><span>+</span><p>Add a candidate</p></div>` : ""}
          </div>
        </article>`;
      }).join("")}
    </section>`;
  }

  let wantFilter = "all", wantQuery = "";
  function wantCard(w) {
    const chips = [];
    if (w.size) chips.push(w.size);
    if (w.saves > 1) chips.push(`Saved ${w.saves}×`);
    if (w.variantLost) chips.push(`<span class="warn">Variant lost</span>`);
    if (w.capture === "text") chips.push("Typed, no link");
    if (w.siblingOf) chips.push("Sibling of yours");
    if (inDecision[w.id]) chips.push(`<span class="goldtxt">${esc(inDecision[w.id][0].name)}</span>`);
    if (pendingPick(w)) chips.push(`<span class="goldtxt">Pick a photo</span>`);
    if (w.capture === "added") chips.unshift(`<span class="goldtxt">Just added</span>`);
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
    const groups = {};
    list.forEach((w) => (groups[w.maker] = groups[w.maker] || []).push(w));
    const makers = Object.keys(groups);
    const f = (k, label) => `<button class="seg ${wantFilter === k ? "on" : ""}" data-filter="${k}">${label}</button>`;
    return `
    <section class="page-head">
      <p class="eyebrow">Wants</p>
      <h1>${D.wants.length} watches, ${new Set(D.wants.map((w) => w.maker)).size} makers.</h1>
      <p class="lede">Liking a watch doesn't require a decision. These are the ones you saved, merged and cleaned. Blank fields mean the link didn't say. Nothing was guessed.</p>
      <div class="toolbar">
        <div class="segs">${f("all", "All")}${f("decision", "In a decision")}${f("loose", "Just wanted")}${f("attention", "Needs attention")}${Object.keys(IMAGES).length ? f("photo", "Pick a photo") : ""}</div>
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
    const past = D.milestones.filter((m) => m.when === "past");
    const ahead = D.milestones.filter((m) => m.when === "ahead");
    const history = ALL["seiko-skx007"];
    const none = !D.milestones.length;
    return `
    <section class="page-head">
      <p class="eyebrow">Journey</p>
      <h1>The watches, in the order life happened.</h1>
      <p class="lede">${none ? "Milestones are personal, so this public build ships without any. Add one and the watches it belongs to will line up here." : "No dates yet. Your note didn't have them, so none were invented. Tap a moment to add one."}</p>
    </section>
    <section class="block journey">
      <ol class="timeline">
        ${past.map((m) => {
          const w = ALL[m.watch];
          return `<li class="moment">
            <div class="node"></div>
            <button class="moment-card" data-open="${w.id}">
              ${media(w, 170)}
              <div>
                <p class="eyebrow">${esc(m.name)}</p>
                <h3>${esc(w.maker)} ${esc(title(w))}</h3>
                <p class="story">${lock} ${esc(m.note || "")}</p>
                ${m.decision ? `<p class="muted small">Shortlist was ${DEC[m.decision].candidates.map((id) => esc(title(ALL[id]))).join(", ")}. The ${esc(title(w))} won.</p>` : ""}
                <p class="date-add">Add date</p>
              </div>
            </button>
          </li>`;
        }).join("")}
        ${none ? "" : `<li class="divider"><span>Ahead</span></li>`}
        ${ahead.map((m) => {
          const d = DEC[m.decision];
          return `<li class="moment ahead">
            <div class="node hollow"></div>
            <div class="moment-card">
              <div class="mini-row">${d.candidates.map((id) => `<button data-open="${id}" class="mini">${media(ALL[id], 110)}</button>`).join("")}</div>
              <div>
                <p class="eyebrow">${esc(m.name)}</p>
                <h3>${d.candidates.map((id) => esc(ALL[id].maker + (ALL[id].model ? " " + title(ALL[id]) : ""))).join(" or ")}</h3>
                <p class="muted small">${d.candidates.length} ${d.candidates.length === 1 ? "candidate" : "candidates"} · undecided</p>
              </div>
            </div>
          </li>`;
        }).join("")}
        <li class="moment ahead">
          <div class="node hollow"></div>
          <button class="moment-card" data-open="${history.id}">
            ${media(history, 130)}
            <div>
              <p class="eyebrow">Someday · no occasion needed</p>
              <h3>Seiko SKX007</h3>
              <p class="story">“${esc(history.reason)}”</p>
            </div>
          </button>
        </li>
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
                const lw = w.specs["Lug width"];
                const mm = lw && parseFloat(lw);
                const st = !lw ? "unknown" : isNaN(mm) ? "no" : mm === s.lugWidth ? "yes" : "no";
                const why = !lw ? "Lug width not recorded" : isNaN(mm) ? `${lw} bracelet` : mm === s.lugWidth ? `${lw} lugs` : `${lw} lugs`;
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
    const photoRows = Object.keys(IMAGES).length ? viewPhotoRows() : "";
    return `
    <section class="page-head">
      <p class="eyebrow">Import report</p>
      <h1>What happened to your note.</h1>
      <p class="lede">Every messy line, and what the importer did with it. The raw text is always kept.</p>
    </section>
    <section class="block inbox">
      ${photoRows}
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
    const none = ws.filter((w) => !photoOf(w) && !pendingPick(w) && picks[w.id] !== "drawing");
    const why = {};
    none.forEach((w) => {
      const m = IMAGES[w.id]?.missing || "added before photos";
      const k = /dead link/.test(m) ? "dead links" : /no exact match/.test(m) ? "references no store carries" : /brand only/.test(m) ? "brand only" : /blocks|no photo on page|timed out/.test(m) ? "sites that block lookups" : "other";
      why[k] = (why[k] || 0) + 1;
    });
    return `
      <div class="row"><div class="row-blank photo-count">${have}</div><div class="row-body"><p><span class="tag green">Photos</span></p><h3>${have} of ${ws.length} watches have a real photo</h3><p class="muted">From the page you saved, or a store listing whose reference matches exactly. Never from a guess.</p></div></div>
      ${pick.length ? `<button class="row" data-goto="wants" data-setfilter="photo"><div class="row-blank photo-count">${pick.length}</div><div class="row-body"><p><span class="tag gold">Pick a photo</span></p><h3>${pick.length} watches need you to pick the right photo</h3><p class="muted">No reference to confirm them, so the closest matches are offered. Nothing is used until you choose.</p></div></button>` : ""}
      ${none.length ? `<div class="row"><div class="row-blank photo-count">${none.length}</div><div class="row-body"><p><span class="tag">No photo yet</span></p><h3>${none.length} watches still show the drawing</h3><p class="muted">${Object.entries(why).map(([k, v]) => `${v} ${k}`).join(" · ")}. A fresh link fixes most of them.</p></div></div>` : ""}`;
  }

  // ---------- drawer ----------
  function openDrawer(id) {
    const w = ALL[id];
    if (!w) return;
    const specs = w.status === "owned" ? w.specs : {
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
        <span class="tag ${w.status === "owned" ? "green" : ""}">${w.status === "owned" ? "Owned" : "Wanted"}</span>
        ${w.occasion ? `<span class="tag gold">${esc(w.occasion)}</span>` : ""}
        ${decs.map((d) => `<button class="tag gold link-tag" data-goto="decisions">${esc(d.name)}</button>`).join("")}
      </div>
      ${w.from || w.story ? `<div class="private">${lock}<div><p class="eyebrow">Private story</p><p>${esc([w.occasion, w.from && `Gift from ${w.from}`, w.story].filter(Boolean).join(" · "))}</p></div></div>` : ""}
      ${w.reason && !w.occasion ? `<blockquote>“${esc(w.reason)}”</blockquote>` : ""}
      ${sib ? `<p class="note">Sibling of the <button class="inline" data-open="${sib.id}">${esc(title(sib))}</button> you own.</p>` : ""}
      ${w.variantLost ? `<p class="note warn">You saved this ${w.saves} times with the same link. The variant you picked on the site wasn't captured. Which ones did you mean?</p>` : ""}
      ${photoChoices(w)}
      <h4>Specifications</h4>
      <dl class="specs">${Object.entries(specs).map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="${v ? "" : "nf"}">${v ? esc(v) : "Not found"}</dd></div>`).join("")}</dl>
      ${w.urls.length ? `<h4>Where to find it</h4><ul class="listings">${w.urls.map((u) => `<li><a href="${esc(u)}" target="_blank" rel="noopener"><span>${esc(storeOf(u, w))}</span><span class="muted">Price not tracked →</span></a></li>`).join("")}</ul>` : ""}
      ${w.raw ? `<h4>Original line</h4><p class="ref raw">${esc(w.raw)}</p>` : ""}
      <p class="fine">Photos come from the page you saved or an exact reference match; they stay on this computer. Drawings are illustrative. Specs come only from your note and the link itself.</p>`;
    document.body.classList.add("drawer-open");
    $("#drawer").setAttribute("aria-hidden", "false");
    $("#drawer").scrollTop = 0;
  }
  function photoCaption(w) {
    const p = photoOf(w);
    const im = IMAGES[w.id];
    if (p) return `<p class="photo-cap">Photo · ${esc(p.source || "")}${p.method ? ` · ${esc(p.method)}` : ""} <button class="inline" data-pick="${w.id}" data-i="-1">Show the drawing</button></p>`;
    if (picks[w.id] === "drawing" && (im?.src || im?.choices?.length)) return `<p class="photo-cap">Drawing · <button class="inline" data-pick="${w.id}" data-i="-2">Show the photo</button></p>`;
    return "";
  }

  function photoChoices(w) {
    const im = IMAGES[w.id];
    if (!im?.choices?.length || im.src) return "";
    const cur = picks[w.id];
    return `<h4>${cur && cur !== "drawing" ? "Your pick" : "Which one is it?"}</h4>
      <p class="muted small">There's no reference to confirm these, so they're the closest matches. Nothing is used until you pick.</p>
      <div class="choices">${im.choices.map((c, i) => `<button class="choice ${cur?.src === c.src ? "on" : ""}" data-pick="${w.id}" data-i="${i}">
        <div class="media" style="--s:150px"><img src="${esc(c.src)}" alt="" loading="lazy" onload="photoLoaded(this)"></div>
        <span>${esc(c.title)}</span><em>${esc(c.source)}</em></button>`).join("")}
        <button class="choice none ${cur === "drawing" ? "on" : ""}" data-pick="${w.id}" data-i="-1"><span>None of these</span><em>Keep the drawing</em></button>
      </div>`;
  }

  function setPick(id, i) {
    const im = IMAGES[id];
    if (i === -2) delete picks[id];
    else if (i === -1) picks[id] = "drawing";
    else { const c = im.choices[i]; picks[id] = { src: c.src, source: c.source, title: c.title, method: "your pick" }; }
    local.set("horology.picks", picks);
    const y = window.scrollY;
    render();
    window.scrollTo(0, y);
    openDrawer(id);
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

  function openAdd() {
    addState = null;
    document.body.classList.add("add-open");
    $("#add").setAttribute("aria-hidden", "false");
    $("#add-result").innerHTML = "";
    $("#add-q").value = "";
    setTimeout(() => $("#add-q").focus(), 50);
  }
  function closeAdd() {
    document.body.classList.remove("add-open");
    $("#add").setAttribute("aria-hidden", "true");
  }

  async function lookup(q) {
    $("#add-result").innerHTML = `<div class="looking">${dial({ dial: ["dress", "#1d1d1f"] }, 110, { live: true })}<p class="muted">Finding the watch and its photo…</p></div>`;
    let r;
    try {
      const res = await fetch(`/api/lookup?q=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error(res.status);
      r = await res.json();
    } catch {
      $("#add-result").innerHTML = `<p class="note warn">Adding needs the local server, because a browser can't read other sites by itself. Run <code>node server.mjs</code> in <code>prototype/</code> and open localhost:4377.</p>`;
      return;
    }
    addState = { q, r, pick: r.photo || null };
    drawAdd();
  }

  function drawAdd() {
    const { r } = addState;
    const pick = addState.pick;
    addState.parts = splitTitle(r.title || pick?.title, r.ref);
    const maker = r.maker && !RETAILERS.test(r.maker) ? r.maker : "";
    const tile = (src) => `<div class="media" style="--s:220px"><img src="${esc(src)}" alt="" onload="photoLoaded(this)"></div>`;
    $("#add-result").innerHTML = `
      ${r.photo ? `<div class="add-photo">${tile(r.photo.src)}<p class="photo-cap">Photo · ${esc(r.photo.source)} · ${esc(r.photo.method)}</p></div>` : ""}
      ${!r.photo && r.choices?.length ? `<p class="muted small">${esc(r.note)}</p><div class="choices">${r.choices.map((c, i) => `<button type="button" class="choice ${pick === c ? "on" : ""}" data-add-pick="${i}"><div class="media" style="--s:150px"><img src="${esc(c.src)}" alt="" onload="photoLoaded(this)"></div><span>${esc(c.title)}</span><em>${esc(c.source)}</em></button>`).join("")}</div>` : ""}
      ${!r.photo && !r.choices?.length ? `<p class="note">${esc(r.note || "No photo found.")} It will show as a drawing until a photo turns up.</p>` : ""}
      <div class="fields">
        <label>Maker<input id="f-maker" value="${esc(maker)}" placeholder="e.g. Grand Seiko"></label>
        <label>Model<input id="f-model" value="${esc(addState.parts.model)}" placeholder="Not found"></label>
        <label>Reference<input id="f-ref" value="${esc(r.ref || "")}" placeholder="Not found"></label>
      </div>
      <button class="btn add-save" id="add-save">Add to Wants</button>`;
  }

  function saveAdd() {
    const maker = $("#f-maker").value.trim(), model = $("#f-model").value.trim(), ref = $("#f-ref").value.trim();
    if (!maker && !model && !ref) { $("#f-maker").focus(); return; }
    const p = addState.pick;
    const w = {
      id: "added-" + Date.now().toString(36), maker: maker || "Unknown maker", model: model || null, ref: ref || null,
      size: addState.parts.size, variant: addState.parts.variant,
      urls: addState.r.url ? [addState.r.url] : [], dial: ["dress", "#1d1d1f"], capture: "added",
      photo: p ? { src: p.src, source: p.source, method: p.method || "your pick" } : null, addedAt: Date.now(),
    };
    added.unshift(w);
    local.set("horology.added", added);
    w.status = "want"; ALL[w.id] = w; D.wants.unshift(w);
    closeAdd();
    if (location.hash !== "#wants") location.hash = "wants"; else render();
    setTimeout(() => openDrawer(w.id), 80);
  }

  function closeDrawer() {
    document.body.classList.remove("drawer-open");
    $("#drawer").setAttribute("aria-hidden", "true");
    setTimeout(() => { if (!document.body.classList.contains("drawer-open")) $("#drawer-body").innerHTML = ""; }, 400);
  }

  // ---------- routing ----------
  const VIEWS = { collection: viewCollection, decisions: viewDecisions, wants: viewWants, journey: viewJourney, straps: viewStraps, inbox: viewInbox };
  function render() {
    const v = (location.hash.slice(1) || "collection").split("?")[0];
    const view = VIEWS[v] ? v : "collection";
    $("#main").innerHTML = VIEWS[view]();
    document.querySelectorAll("[data-view]").forEach((a) => a.classList.toggle("on", a.dataset.view === view));
    const s = $(".search");
    if (s) s.addEventListener("input", (e) => { wantQuery = e.target.value; const pos = e.target.selectionStart; render(); const n = $(".search"); n.focus(); n.setSelectionRange(pos, pos); });
  }

  document.addEventListener("click", (e) => {
    const pk = e.target.closest("[data-pick]");
    if (pk) { setPick(pk.dataset.pick, Number(pk.dataset.i)); return; }
    const ap = e.target.closest("[data-add-pick]");
    if (ap) { addState.pick = addState.r.choices[Number(ap.dataset.addPick)]; drawAdd(); return; }
    if (e.target.closest("#add-open")) { openAdd(); return; }
    if (e.target.closest("[data-add-close]")) { closeAdd(); return; }
    if (e.target.closest("#add-save")) { saveAdd(); return; }
    const o = e.target.closest("[data-open]");
    if (o) { openDrawer(o.dataset.open); return; }
    const g = e.target.closest("[data-goto]");
    if (g) { if (g.dataset.setfilter) wantFilter = g.dataset.setfilter; closeDrawer(); if (location.hash === "#" + g.dataset.goto) render(); else location.hash = g.dataset.goto; return; }
    const f = e.target.closest("[data-filter]");
    if (f) { wantFilter = f.dataset.filter; render(); return; }
    if (e.target.closest("[data-close]")) closeDrawer();
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeAdd(); closeDrawer(); } });
  $("#add-form").addEventListener("submit", (e) => { e.preventDefault(); const q = $("#add-q").value.trim(); if (q) lookup(q); });
  window.addEventListener("hashchange", () => { closeDrawer(); render(); window.scrollTo({ top: 0 }); });

  $("#count-inbox").textContent = D.inbox.filter((i) => i.kind === "broken" || i.kind === "variant").length;
  $("#count-decisions").textContent = D.decisions.filter((d) => d.status === "open").length;
  render();
})();
