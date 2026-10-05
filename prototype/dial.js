// Vector watch renderer. Every watch is drawn from (style, dial colour), so it stays
// sharp at any resolution. The art is illustrative — it never stands in for a spec.
(function () {
  let UID = 0;
  const CX = 120, CY = 140;

  const hex = (h) => { h = h.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.substr(i, 2), 16)); };
  const toHex = (a) => "#" + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
  const mix = (a, b, p) => { const x = hex(a), y = hex(b); return toHex(x.map((v, i) => v + (y[i] - v) * p)); };
  const lum = (h) => { const [r, g, b] = hex(h).map((v) => v / 255); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const pol = (r, deg, cx = CX, cy = CY) => { const a = ((deg - 90) * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
  const n = (v) => Math.round(v * 100) / 100;

  const LUME = "#efe7cf";
  const RED = "#c8432b";
  const BLUED = "#2b4c9b";

  function defs(id, color, light, titanium) {
    const metal = titanium
      ? ["#eceded", "#8d9093", "#dcdedf", "#62666a"]
      : ["#fdfdfb", "#a6a6a2", "#f2f2ee", "#6c6c68"];
    return `<defs>
      <linearGradient id="${id}m" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${metal[0]}"/><stop offset=".38" stop-color="${metal[1]}"/>
        <stop offset=".58" stop-color="${metal[2]}"/><stop offset="1" stop-color="${metal[3]}"/></linearGradient>
      <linearGradient id="${id}p" x1="1" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="${metal[0]}"/><stop offset=".45" stop-color="${metal[3]}"/>
        <stop offset=".7" stop-color="${metal[2]}"/><stop offset="1" stop-color="${metal[1]}"/></linearGradient>
      <radialGradient id="${id}d" cx=".36" cy=".28" r=".9">
        <stop offset="0" stop-color="${mix(color, "#ffffff", light ? 0.28 : 0.16)}"/>
        <stop offset=".55" stop-color="${color}"/>
        <stop offset="1" stop-color="${mix(color, "#000000", light ? 0.2 : 0.5)}"/></radialGradient>
      <linearGradient id="${id}h" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stop-color="#8b8b88"/><stop offset=".5" stop-color="#ffffff"/><stop offset=".51" stop-color="#c9c9c5"/><stop offset="1" stop-color="#7d7d7a"/></linearGradient>
      <linearGradient id="${id}g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <filter id="${id}s" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="1.2" dy="2.4" stdDeviation="1.5" flood-color="#000" flood-opacity=".5"/></filter>
    </defs>`;
  }

  // ---------- dial furniture ----------
  function minuteTrack(R, ink, op = 0.5) {
    let s = "";
    for (let i = 0; i < 60; i++) {
      const long = i % 5 === 0;
      const [x1, y1] = pol(R - 2, i * 6), [x2, y2] = pol(R - (long ? 6 : 4.5), i * 6);
      s += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${ink}" stroke-opacity="${op}" stroke-width="${long ? 0.9 : 0.5}"/>`;
    }
    return s;
  }

  function batons(id, R, w, l, opt = {}) {
    let s = "";
    for (let i = 0; i < 12; i++) {
      if ((opt.skip || []).includes(i)) continue;
      const a = i * 30;
      const draw = (dx) =>
        `<g transform="translate(${CX} ${CY}) rotate(${a})"><rect x="${n(-w / 2 + dx)}" y="${n(-(R - 7))}" width="${w}" height="${l}" rx="${n(w * 0.22)}" fill="url(#${id}h)" stroke="#000" stroke-opacity=".35" stroke-width=".4"/>${
          opt.lume ? `<rect x="${n(-w / 2 + dx + w * 0.25)}" y="${n(-(R - 9))}" width="${n(w * 0.5)}" height="${n(l - 4)}" rx="${n(w * 0.15)}" fill="${LUME}"/>` : ""
        }</g>`;
      s += i === 0 && !opt.single ? draw(-w * 0.75) + draw(w * 0.75) : draw(0);
    }
    return s;
  }

  function lines(R, ink, l, w, skip = []) {
    let s = "";
    for (let i = 0; i < 12; i++) {
      if (skip.includes(i)) continue;
      const [x1, y1] = pol(R - 4, i * 30), [x2, y2] = pol(R - 4 - l, i * 30);
      s += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${ink}" stroke-width="${w}" stroke-linecap="round"/>`;
    }
    return s;
  }

  function numerals(r, list, fill, size, font = "Inter, system-ui, sans-serif", weight = 600, labels) {
    return list
      .map((h, k) => {
        const [x, y] = pol(r, (h % 12) * 30);
        const t = labels ? labels[k] : h;
        return `<text x="${n(x)}" y="${n(y)}" fill="${fill}" font-family="${font}" font-weight="${weight}" font-size="${size}" text-anchor="middle" dominant-baseline="central">${t}</text>`;
      })
      .join("");
  }

  function subdial(x, y, r, fill, ink, angle) {
    let s = `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${fill}" stroke="${ink}" stroke-opacity=".25" stroke-width=".6"/>`;
    for (let k = 1; k <= 4; k++) s += `<circle cx="${n(x)}" cy="${n(y)}" r="${n((r * k) / 5)}" fill="none" stroke="${ink}" stroke-opacity=".07" stroke-width=".5"/>`;
    for (let i = 0; i < 12; i++) {
      const [a, b] = pol(r - 1.5, i * 30, x, y), [c, d] = pol(r - (i % 3 ? 3.5 : 5), i * 30, x, y);
      s += `<line x1="${n(a)}" y1="${n(b)}" x2="${n(c)}" y2="${n(d)}" stroke="${ink}" stroke-opacity=".7" stroke-width=".55"/>`;
    }
    const [hx, hy] = pol(r * 0.82, angle, x, y);
    s += `<line x1="${n(x)}" y1="${n(y)}" x2="${n(hx)}" y2="${n(hy)}" stroke="${ink}" stroke-width="1" stroke-linecap="round"/><circle cx="${n(x)}" cy="${n(y)}" r="1.4" fill="${ink}"/>`;
    return s;
  }

  function dateWindow(R, id) {
    const d = new Date().getDate();
    const x = CX + R * 0.66;
    return `<rect x="${n(x - 8)}" y="${CY - 6}" width="16" height="12" rx="1.2" fill="#f5f2ea" stroke="url(#${id}m)" stroke-width="1.2"/>
      <text x="${n(x)}" y="${CY + 0.5}" fill="#151515" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="8" text-anchor="middle" dominant-baseline="central">${d}</text>`;
  }

  function powerArc(R, ink) {
    const y = CY - R * 0.42, r = R * 0.24;
    let s = "";
    for (let a = -60; a <= 60; a += 10) {
      const [x1, y1] = pol(r, a, CX, y), [x2, y2] = pol(r - (a % 30 ? 2.5 : 4.5), a, CX, y);
      s += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="${ink}" stroke-opacity=".75" stroke-width=".6"/>`;
    }
    const [hx, hy] = pol(r - 2, 28, CX, y);
    return s + `<line x1="${CX}" y1="${n(y)}" x2="${n(hx)}" y2="${n(hy)}" stroke="${ink}" stroke-width="1"/><circle cx="${CX}" cy="${n(y)}" r="1.6" fill="${ink}"/>`;
  }

  function bezel(kind, color) {
    let s = "";
    const top = kind === "gmt" ? mix(color, "#000000", 0.25) : "#0f1011";
    s += `<circle cx="${CX}" cy="${CY}" r="88" fill="#0f1011"/>`;
    if (kind === "gmt") s += `<path d="M ${CX - 88} ${CY} A 88 88 0 0 1 ${CX + 88} ${CY} Z" fill="${top}"/>`;
    for (let i = 0; i < 60; i++) {
      const [x1, y1] = pol(86.5, i * 6), [x2, y2] = pol(83.5, i * 6);
      if (kind === "dive" && i % 10 === 0) continue;
      if (kind === "gmt" && i % 5 === 0) continue;
      s += `<line x1="${n(x1)}" y1="${n(y1)}" x2="${n(x2)}" y2="${n(y2)}" stroke="#e9e3d3" stroke-opacity=".7" stroke-width=".55"/>`;
    }
    if (kind === "dive") {
      for (let k = 1; k < 6; k++) {
        const [x, y] = pol(80, k * 60);
        s += `<text x="${n(x)}" y="${n(y)}" fill="#ece6d6" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="8.5" text-anchor="middle" dominant-baseline="central" transform="rotate(${k * 60} ${n(x)} ${n(y)})">${k * 10}</text>`;
      }
      const [tx, ty] = pol(81, 0);
      s += `<path d="M ${n(tx - 5)} ${n(ty - 4)} L ${n(tx + 5)} ${n(ty - 4)} L ${n(tx)} ${n(ty + 4)} Z" fill="${LUME}"/>`;
    }
    if (kind === "gmt") {
      for (let h = 2; h <= 24; h += 2) {
        const [x, y] = pol(80, h * 15);
        if (h === 24) { s += `<path d="M ${n(x - 4.5)} ${n(y - 3.5)} L ${n(x + 4.5)} ${n(y - 3.5)} L ${n(x)} ${n(y + 4)} Z" fill="#ece6d6"/>`; continue; }
        s += `<text x="${n(x)}" y="${n(y)}" fill="#ece6d6" font-family="Inter, system-ui, sans-serif" font-weight="600" font-size="7.5" text-anchor="middle" dominant-baseline="central" transform="rotate(${h * 15} ${n(x)} ${n(y)})">${h}</text>`;
      }
    }
    if (kind === "tachy") {
      [[500, 43.2], [400, 54], [300, 72], [200, 108], [150, 144], [120, 180], [100, 216], [80, 270], [70, 308.6]].forEach(([v, a]) => {
        const [x, y] = pol(80, a);
        s += `<text x="${n(x)}" y="${n(y)}" fill="#ece6d6" font-family="Inter, system-ui, sans-serif" font-weight="500" font-size="6.5" text-anchor="middle" dominant-baseline="central" transform="rotate(${a} ${n(x)} ${n(y)})">${v}</text>`;
      });
      const [x, y] = pol(80, 0);
      s += `<circle cx="${n(x)}" cy="${n(y)}" r="2.2" fill="#ece6d6"/>`;
    }
    return s;
  }

  // ---------- hands ----------
  function handPath(len, w, tail) {
    return `M ${n(-w / 2)} ${tail} L ${n(-w / 2)} ${n(-len + w * 1.3)} L 0 ${-len} L ${n(w / 2)} ${n(-len + w * 1.3)} L ${n(w / 2)} ${tail} Z`;
  }

  function hands(id, R, t, o) {
    const ha = ((t.h % 12) + t.m / 60) * 30, ma = (t.m + t.s / 60) * 6, sa = t.s * 6;
    const fill = o.blued ? BLUED : `url(#${id}h)`;
    const hw = o.thin ? 3 : 6, mw = o.thin ? 2.2 : 4.4;
    const hl = R * 0.55, ml = R * 0.86;
    const lume = (len, w) => o.lume ? `<path d="${handPath(len - 3, w * 0.45, -len * 0.22)}" fill="${LUME}"/>` : "";
    const gmt = o.gmt
      ? `<g class="gh" transform="rotate(${(((t.h + 5) % 24) + t.m / 60) * 15})"><line x1="0" y1="0" x2="0" y2="${n(-R * 0.84)}" stroke="${RED}" stroke-width="1.3"/><path d="M -4.5 ${n(-R * 0.8)} L 4.5 ${n(-R * 0.8)} L 0 ${n(-R * 0.92)} Z" fill="${RED}"/></g>`
      : "";
    const secCol = o.sec || RED;
    const sec = o.noSeconds ? "" :
      `<g class="sh" transform="rotate(${sa})"><line x1="0" y1="${n(R * 0.2)}" x2="0" y2="${n(-R * 0.93)}" stroke="${secCol}" stroke-width="${o.thin ? 0.7 : 0.95}"/><circle cx="0" cy="${n(R * 0.14)}" r="2.3" fill="${secCol}"/></g>`;
    return `<g transform="translate(${CX} ${CY})" filter="url(#${id}s)">
      ${gmt}
      <g class="hh" transform="rotate(${ha})"><path d="${handPath(hl, hw, 9)}" fill="${fill}" stroke="#000" stroke-opacity=".3" stroke-width=".4"/>${lume(hl, hw)}</g>
      <g class="mh" transform="rotate(${ma})"><path d="${handPath(ml, mw, 11)}" fill="${fill}" stroke="#000" stroke-opacity=".3" stroke-width=".4"/>${lume(ml, mw)}</g>
      ${sec}
      <circle r="${o.thin ? 2.6 : 3.6}" fill="${o.blued ? BLUED : `url(#${id}h)`}"/><circle r="1.1" fill="#2a2a2a"/>
    </g>`;
  }

  // ---------- round watch ----------
  function round(style, color, t, o) {
    const id = "w" + ++UID;
    const light = lum(color) > 0.45;
    const ink = light ? "#1b1b1b" : "#ece6d6";
    const bez = { diver: "dive", gmt: "gmt", chrono: "tachy", "chrono-panda": "tachy" }[style];
    const R = bez ? 72 : 79;
    const titanium = style === "integrated";
    let face = "";
    let handOpt = { sec: light ? "#2a2a2a" : "#d8d4c8" };

    const rays = ["dress", "dress-ss", "dress-pr", "sport", "gmt", "integrated"].includes(style) || (style === "diver" && !light);
    let texture = "";
    if (titanium) {
      for (let y = CY - R; y < CY + R; y += 2) texture += `<line x1="${CX - R}" y1="${y}" x2="${CX + R}" y2="${y}" stroke="${y % 4 ? "#fff" : "#000"}" stroke-opacity=".07" stroke-width="1"/>`;
    } else if (rays) {
      for (let i = 0; i < 90; i++) {
        const [x, y] = pol(R, i * 4);
        texture += `<line x1="${CX}" y1="${CY}" x2="${n(x)}" y2="${n(y)}" stroke="${i % 2 ? "#fff" : "#000"}" stroke-opacity=".045" stroke-width="2.2"/>`;
      }
    }

    switch (style) {
      case "dress":
        face = minuteTrack(R, ink, 0.4) + batons(id, R, 3, 13);
        break;
      case "dress-ss":
        face = minuteTrack(R, ink, 0.4) + batons(id, R, 3, 13, { skip: [6] }) + subdial(CX, CY + R * 0.48, R * 0.23, mix(color, "#000000", 0.08), ink, 200);
        break;
      case "dress-pr":
        face = minuteTrack(R, ink, 0.4) + batons(id, R, 3, 13) + powerArc(R, ink);
        break;
      case "sport":
        face = minuteTrack(R, ink, 0.5) + batons(id, R, 5, 14, { skip: [3], lume: true }) + dateWindow(R, id);
        handOpt.lume = true;
        break;
      case "integrated":
        face = minuteTrack(R, ink, 0.45) + batons(id, R, 6, 13, { skip: [3, 9], lume: true }) + dateWindow(R, id) +
          subdial(CX - R * 0.48, CY, R * 0.2, mix(color, "#000000", 0.18), ink, 150);
        handOpt.lume = true;
        break;
      case "diver": {
        face = minuteTrack(R, ink, 0.45);
        for (let i = 0; i < 12; i++) {
          const [x, y] = pol(R - 13, i * 30);
          if (i === 0) face += `<path d="M ${n(x - 7)} ${n(y - 6)} L ${n(x + 7)} ${n(y - 6)} L ${n(x)} ${n(y + 6)} Z" fill="${LUME}" stroke="url(#${id}m)" stroke-width="1"/>`;
          else if (i % 3 === 0) face += `<g transform="translate(${CX} ${CY}) rotate(${i * 30})"><rect x="-3.5" y="${-(R - 6)}" width="7" height="14" rx="1.2" fill="${LUME}" stroke="url(#${id}m)" stroke-width="1"/></g>`;
          else face += `<circle cx="${n(x)}" cy="${n(y)}" r="4.4" fill="${LUME}" stroke="url(#${id}m)" stroke-width="1"/>`;
        }
        handOpt = { lume: true, sec: RED };
        break;
      }
      case "gmt":
        face = minuteTrack(R, ink, 0.45) + batons(id, R, 5, 13, { lume: true });
        handOpt = { lume: true, gmt: true, sec: light ? "#2a2a2a" : "#e8e2d2" };
        break;
      case "chrono":
      case "chrono-panda": {
        const panda = style === "chrono-panda";
        const sf = panda ? "#141414" : mix(color, "#000000", light ? 0.06 : 0.25);
        const si = panda ? "#ece6d6" : ink;
        face = minuteTrack(R, ink, 0.55) + batons(id, R, 3, 10, { skip: [3, 6, 9] }) +
          subdial(CX + R * 0.46, CY, R * 0.22, sf, si, 40) + subdial(CX, CY + R * 0.46, R * 0.22, sf, si, 300) + subdial(CX - R * 0.46, CY, R * 0.22, sf, si, 210);
        handOpt = { lume: !light, sec: RED };
        break;
      }
      case "field":
        face = minuteTrack(R, ink, 0.6) + numerals(R - 15, [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], light ? ink : LUME, R * 0.15) +
          numerals(R * 0.56, [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], ink, R * 0.065, "Inter, system-ui, sans-serif", 500, [24, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]);
        handOpt = { lume: true, sec: light ? "#2a2a2a" : "#e8e2d2" };
        break;
      case "pilot": {
        face = minuteTrack(R, ink, 0.7) + numerals(R - 15, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], light ? ink : "#f2eee2", R * 0.17);
        const [x, y] = pol(R - 14, 0);
        face += `<path d="M ${n(x - 6.5)} ${n(y - 6)} L ${n(x + 6.5)} ${n(y - 6)} L ${n(x)} ${n(y + 6)} Z" fill="${light ? ink : "#f2eee2"}"/><circle cx="${n(x - 9.5)}" cy="${n(y - 5)}" r="1.5" fill="${light ? ink : "#f2eee2"}"/><circle cx="${n(x + 9.5)}" cy="${n(y - 5)}" r="1.5" fill="${light ? ink : "#f2eee2"}"/>`;
        handOpt = { lume: true, sec: "#f2eee2" };
        break;
      }
      case "sector":
        face = `<circle cx="${CX}" cy="${CY}" r="${R - 18}" fill="none" stroke="${ink}" stroke-opacity=".6" stroke-width=".7"/>
          <circle cx="${CX}" cy="${CY}" r="${n(R * 0.42)}" fill="none" stroke="${ink}" stroke-opacity=".6" stroke-width=".7"/>
          <circle cx="${CX}" cy="${CY}" r="${n(R * 0.42)}" fill="${mix(color, "#000000", 0.06)}" fill-opacity=".6"/>
          <line x1="${CX}" y1="${CY - R + 18}" x2="${CX}" y2="${CY + R - 18}" stroke="${ink}" stroke-opacity=".35" stroke-width=".5"/>
          <line x1="${CX - R + 18}" y1="${CY}" x2="${CX + R - 18}" y2="${CY}" stroke="${ink}" stroke-opacity=".35" stroke-width=".5"/>` +
          minuteTrack(R, ink, 0.6) + numerals(R - 10, [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], ink, R * 0.1, "Inter, system-ui, sans-serif", 500) +
          numerals(R * 0.52, [12, 3, 6, 9], ink, R * 0.08, "Inter, system-ui, sans-serif", 600, [60, 15, 30, 45]);
        handOpt = { thin: true, sec: light ? "#2a2a2a" : "#e8e2d2" };
        break;
      case "roulette": {
        let tr = "";
        for (let i = 0; i < 60; i++) {
          const a1 = i * 6 - 3, a2 = i * 6 + 3, r1 = R - 1, r2 = R - 7;
          const [x1, y1] = pol(r1, a1), [x2, y2] = pol(r1, a2), [x3, y3] = pol(r2, a2), [x4, y4] = pol(r2, a1);
          tr += `<path d="M ${n(x1)} ${n(y1)} A ${r1} ${r1} 0 0 1 ${n(x2)} ${n(y2)} L ${n(x3)} ${n(y3)} A ${r2} ${r2} 0 0 0 ${n(x4)} ${n(y4)} Z" fill="${Math.floor(i / 5) % 2 ? "#8e2f25" : ink}" fill-opacity="${i % 5 ? 0.55 : 0.9}"/>`;
        }
        face = tr + [12, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11].map((h) => numerals(R - 18, [h], h % 2 ? "#8e2f25" : ink, R * 0.14, "'Instrument Serif', Georgia, serif", 400)).join("") +
          subdial(CX, CY + R * 0.46, R * 0.22, mix(color, "#000000", 0.07), ink, 120);
        handOpt = { thin: true, blued: true, noSeconds: true };
        break;
      }
      case "bauhaus":
      case "bauhaus-pr":
        face = minuteTrack(R, ink, 0.55) + lines(R, ink, 8, 1.1, [0, 2, 4, 8, 10]) +
          numerals(R - 12, [12, 2, 4, 8, 10], ink, R * 0.13, "Inter, system-ui, sans-serif", 300) +
          (style === "bauhaus" ? subdial(CX, CY + R * 0.48, R * 0.2, color, ink, 250) : powerArc(R, ink) + dateWindow(R, id));
        handOpt = { thin: true, blued: true, noSeconds: true };
        break;
      case "museum":
        face = `<circle cx="${CX}" cy="${CY - R + 13}" r="${n(R * 0.09)}" fill="url(#${id}m)"/><circle cx="${CX}" cy="${CY - R + 13}" r="${n(R * 0.09)}" fill="#c9a24a" fill-opacity=".75"/>`;
        handOpt = { thin: true, noSeconds: true };
        break;
      case "simple":
        face = minuteTrack(R, ink, 0.45) + lines(R, ink, 8, 1.4, [0, 3, 6, 9]) + numerals(R - 14, [12, 3, 6, 9], ink, R * 0.15);
        handOpt = { thin: true, sec: RED };
        break;
      case "worldtime": {
        const band = mix(color, light ? "#000000" : "#ffffff", 0.12);
        face = `<circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="${band}" stroke-width="22"/>` +
          numerals(R - 6, [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], ink, R * 0.07, "Inter, system-ui, sans-serif", 600, [24, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22]) +
          `<circle cx="${CX}" cy="${CY}" r="${R - 12}" fill="none" stroke="${ink}" stroke-opacity=".4" stroke-width=".6"/>` +
          batons(id, R - 14, 3, 10, { lume: false });
        handOpt = { sec: RED };
        break;
      }
      case "unknown":
        face = `<circle cx="${CX}" cy="${CY}" r="${R - 6}" fill="none" stroke="#ece6d6" stroke-opacity=".25" stroke-dasharray="2 4"/>
          <text x="${CX}" y="${CY + 2}" fill="#ece6d6" fill-opacity=".55" font-family="'Instrument Serif', Georgia, serif" font-size="54" text-anchor="middle" dominant-baseline="central">?</text>`;
        break;
    }

    // Tapered lugs that grow out of the case rather than sit on it.
    const lug = (x, top) => {
      const y0 = top ? 44 : 236, y1 = top ? 78 : 202, w = 19, inset = x < CX ? 3 : -3;
      const tip = top ? y0 + 4 : y0 - 4;
      return `<path d="M ${x} ${y1} L ${x + inset} ${tip} Q ${x + inset} ${y0} ${x + inset + 5} ${y0} L ${x + inset + w - 5} ${y0} Q ${x + inset + w} ${y0} ${x + inset + w} ${tip} L ${x + w} ${y1} Z"
        fill="url(#${id}m)" stroke="#000" stroke-opacity=".28" stroke-width=".6"/>
        <path d="M ${x + inset + 4} ${tip} L ${x + 5} ${y1}" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>`;
    };
    const crown = `<rect x="206" y="128" width="13" height="24" rx="3.5" fill="url(#${id}m)" stroke="#000" stroke-opacity=".3" stroke-width=".5"/>` +
      [132, 136, 140, 144, 148].map((y) => `<line x1="207" y1="${y}" x2="218" y2="${y}" stroke="#000" stroke-opacity=".22" stroke-width=".6"/>`).join("");

    const body = `
      ${lug(74, true)}${lug(147, true)}${lug(74, false)}${lug(147, false)}${crown}
      <circle cx="${CX}" cy="${CY}" r="93" fill="url(#${id}m)"/>
      <circle cx="${CX}" cy="${CY}" r="93" fill="none" stroke="#000" stroke-opacity=".35" stroke-width=".8"/>
      ${bez ? bezel(bez, color) : `<circle cx="${CX}" cy="${CY}" r="87" fill="url(#${id}p)"/>`}
      <circle cx="${CX}" cy="${CY}" r="${R + 2.5}" fill="#000" fill-opacity=".45"/>
      <clipPath id="${id}c"><circle cx="${CX}" cy="${CY}" r="${R}"/></clipPath>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="url(#${id}d)"/>
      <g clip-path="url(#${id}c)">${texture}</g>
      ${face}
      ${style === "unknown" ? "" : hands(id, R, t, handOpt)}
      <g clip-path="url(#${id}c)"><ellipse cx="${CX - 22}" cy="${CY - 46}" rx="${R * 1.05}" ry="${R * 0.62}" fill="url(#${id}g)" transform="rotate(-24 ${CX} ${CY})"/></g>
      <circle cx="${CX}" cy="${CY}" r="${R}" fill="none" stroke="#fff" stroke-opacity=".08" stroke-width="1"/>`;
    return wrap(id, color, light, titanium, body, o);
  }

  // ---------- rectangular (Tank / DolceVita) ----------
  function tank(color, t, o) {
    const id = "w" + ++UID;
    const light = lum(color) > 0.45;
    const ink = light ? "#1b1b1b" : "#ece6d6";
    const rp = (a, hw, hh) => {
      const r = ((a - 90) * Math.PI) / 180, dx = Math.cos(r), dy = Math.sin(r);
      const k = Math.min(hw / Math.abs(dx || 1e-9), hh / Math.abs(dy || 1e-9));
      return [CX + dx * k, CY + dy * k];
    };
    let track = `<rect x="${CX - 36}" y="${CY - 76}" width="72" height="152" fill="none" stroke="${ink}" stroke-width=".6"/>
      <rect x="${CX - 31}" y="${CY - 71}" width="62" height="142" fill="none" stroke="${ink}" stroke-width=".6"/>`;
    for (let i = 0; i < 60; i++) {
      const [a, b] = rp(i * 6, 36, 76), [c, d] = rp(i * 6, 31, 71);
      track += `<line x1="${n(a)}" y1="${n(b)}" x2="${n(c)}" y2="${n(d)}" stroke="${ink}" stroke-width=".45"/>`;
    }
    const romans = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"];
    romans.forEach((r, i) => {
      const [x, y] = rp(i * 30, 22, 58);
      track += `<text x="${n(x)}" y="${n(y)}" fill="${ink}" font-family="'Instrument Serif', Georgia, serif" font-size="${i % 3 ? 12 : 14}" text-anchor="middle" dominant-baseline="central" transform="rotate(${i * 30} ${n(x)} ${n(y)})">${r}</text>`;
    });
    const ha = ((t.h % 12) + t.m / 60) * 30, ma = (t.m + t.s / 60) * 6;
    const sword = (len, w) => `M ${-w / 2} 8 L ${-w / 2} ${-len * 0.55} L 0 ${-len} L ${w / 2} ${-len * 0.55} L ${w / 2} 8 Z`;
    const body = `
      <rect x="62" y="42" width="116" height="196" rx="15" fill="url(#${id}m)" stroke="#000" stroke-opacity=".3" stroke-width=".8"/>
      <rect x="71" y="50" width="98" height="180" rx="6" fill="url(#${id}p)"/>
      <rect x="182" y="134" width="6" height="12" fill="url(#${id}m)"/>
      <circle cx="191" cy="140" r="8" fill="url(#${id}m)"/><circle cx="191" cy="140" r="5.6" fill="#2d4fa6"/><circle cx="189.6" cy="138.4" r="1.6" fill="#fff" fill-opacity=".5"/>
      <clipPath id="${id}c"><rect x="78" y="58" width="84" height="164" rx="3"/></clipPath>
      <rect x="78" y="58" width="84" height="164" rx="3" fill="url(#${id}d)"/>
      ${track}
      <g transform="translate(${CX} ${CY})" filter="url(#${id}s)">
        <g class="hh" transform="rotate(${ha})"><path d="${sword(34, 4)}" fill="${BLUED}"/></g>
        <g class="mh" transform="rotate(${ma})"><path d="${sword(54, 3)}" fill="${BLUED}"/></g>
        <circle r="2.4" fill="${BLUED}"/>
      </g>
      <g clip-path="url(#${id}c)"><rect x="40" y="20" width="160" height="90" fill="url(#${id}g)" transform="rotate(-18 ${CX} ${CY})"/></g>`;
    return wrap(id, color, light, false, body, o);
  }

  // ---------- shield (Ventura) ----------
  function shield(color, t, o) {
    const id = "w" + ++UID;
    const light = lum(color) > 0.45;
    const ink = light ? "#1b1b1b" : "#ece6d6";
    const P = "M 0 -96 L 70 -48 Q 86 4 56 62 L 0 104 L -56 62 Q -86 4 -70 -48 Z";
    const body = `
      <rect x="98" y="16" width="44" height="40" rx="6" fill="#141312"/><rect x="98" y="226" width="44" height="40" rx="6" fill="#141312"/>
      <path d="${P}" transform="translate(${CX} ${CY})" fill="url(#${id}m)" stroke="#000" stroke-opacity=".3" stroke-width=".8"/>
      <rect x="196" y="132" width="10" height="16" rx="3" fill="url(#${id}m)"/>
      <clipPath id="${id}c"><path d="${P}" transform="translate(${CX} ${CY}) scale(.84)"/></clipPath>
      <path d="${P}" transform="translate(${CX} ${CY}) scale(.84)" fill="url(#${id}d)"/>
      ${lines(64, ink, 7, 1.3, [])}
      ${hands(id, 64, t, { thin: false, sec: RED })}
      <g clip-path="url(#${id}c)"><ellipse cx="${CX - 20}" cy="${CY - 50}" rx="80" ry="46" fill="url(#${id}g)" transform="rotate(-24 ${CX} ${CY})"/></g>`;
    return wrap(id, color, light, false, body, o);
  }

  // ---------- digital (G-Shock square, Intrepid) ----------
  function digital(color, t, o) {
    const id = "w" + ++UID;
    const pad = (v) => String(Math.floor(v)).padStart(2, "0");
    const body = `
      <defs><linearGradient id="${id}r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3a3a3a"/><stop offset=".5" stop-color="${color}"/><stop offset="1" stop-color="#050505"/></linearGradient>
      <linearGradient id="${id}l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9c0a8"/><stop offset="1" stop-color="#99a088"/></linearGradient></defs>
      <rect x="92" y="10" width="56" height="40" rx="8" fill="#121212"/><rect x="92" y="230" width="56" height="40" rx="8" fill="#121212"/>
      <rect x="28" y="124" width="12" height="18" rx="3" fill="#2a2a2a"/><rect x="200" y="96" width="12" height="18" rx="3" fill="#2a2a2a"/>
      <rect x="28" y="164" width="12" height="18" rx="3" fill="#2a2a2a"/><rect x="200" y="166" width="12" height="18" rx="3" fill="#2a2a2a"/>
      <rect x="34" y="44" width="172" height="192" rx="40" fill="url(#${id}r)" stroke="#000" stroke-width="1"/>
      <rect x="52" y="66" width="136" height="148" rx="22" fill="#0b0b0b" stroke="#2c2c2c" stroke-width="1"/>
      <rect x="68" y="104" width="104" height="66" rx="6" fill="url(#${id}l)" stroke="#000" stroke-opacity=".6"/>
      <text class="lcd-time" x="${CX - 6}" y="142" fill="#1d2118" font-family="'JetBrains Mono', ui-monospace, monospace" font-weight="600" font-size="30" text-anchor="middle" dominant-baseline="central">${pad(t.h)}:${pad(t.m)}</text>
      <text class="lcd-sec" x="${CX + 40}" y="${148}" fill="#1d2118" font-family="'JetBrains Mono', ui-monospace, monospace" font-weight="600" font-size="13" text-anchor="middle" dominant-baseline="central">${pad(t.s)}</text>
      <rect x="68" y="104" width="104" height="22" rx="6" fill="#fff" fill-opacity=".12"/>`;
    return `<svg viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg" ${o.live ? 'data-live="digital"' : ""} aria-hidden="true">${body}</svg>`;
  }

  function wrap(id, color, light, titanium, body, o) {
    return `<svg viewBox="0 0 240 280" xmlns="http://www.w3.org/2000/svg" ${o.live ? 'data-live="analog"' : ""} aria-hidden="true">${defs(id, color, light, titanium)}${body}</svg>`;
  }

  function svg(style, color, o = {}) {
    const t = o.time || { h: 10, m: 9, s: 36 };
    if (style === "tank") return tank(color, t, o);
    if (style === "shield") return shield(color, t, o);
    if (style === "digital") return digital(color, t, o);
    return round(style, color, t, o);
  }

  // Live hands: smooth sweep, only for dials marked data-live.
  function tick() {
    const d = new Date();
    const s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    document.querySelectorAll('svg[data-live="analog"]').forEach((el) => {
      el.querySelectorAll(".hh").forEach((g) => g.setAttribute("transform", `rotate(${h * 30})`));
      el.querySelectorAll(".mh").forEach((g) => g.setAttribute("transform", `rotate(${m * 6})`));
      el.querySelectorAll(".sh").forEach((g) => g.setAttribute("transform", `rotate(${s * 6})`));
      el.querySelectorAll(".gh").forEach((g) => g.setAttribute("transform", `rotate(${(d.getHours() + 5 + m / 60) * 15})`));
    });
    document.querySelectorAll('svg[data-live="digital"]').forEach((el) => {
      const p = (v) => String(v).padStart(2, "0");
      el.querySelector(".lcd-time").textContent = `${p(d.getHours())}:${p(d.getMinutes())}`;
      el.querySelector(".lcd-sec").textContent = p(d.getSeconds());
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  window.Dial = { svg, lum };
})();
