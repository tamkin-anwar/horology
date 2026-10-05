# Horology

A private curator for a watch collector's decisions. Not another catalogue of watches: a record of what you own, what you're choosing between, and the moments the watches belong to. It started as one very long note full of pasted links, and this prototype is that note, structured.

"Horology" is a working title. The product will get its own name before it ships.

Built by Anwar Creative Studio.

## What it does

- **Collection.** Every watch you own, with the specs you actually recorded and the story behind it. Stories are private by design.
- **Decisions.** The heart of it. A decision holds candidates: "Tangente: 38 or 35?", "Zulu Time: which one?", "Tank Must: which reference?". When you choose, the alternatives aren't deleted. They become the history of that decision, so years later you can see you considered seven watches and why one won.
- **Milestones, optional.** A decision can belong to an occasion (a birthday, a graduation, a wedding), but it doesn't have to. "First Speedmaster" is a real decision with no life event behind it.
- **Wants.** Liking a watch doesn't require a decision. Some watches you simply want, with a reason ("because of history") and nothing to compare them against.
- **Journey.** Your watches in the order life happened, then what's ahead.
- **Straps.** Straps belong to watches. Fit is checked against the lug widths you recorded: a 20 mm strap fits the 20 mm watch, not the 18 mm one, and a watch with no recorded lug width gets "unknown", not a guess.
- **Import report.** Every messy line in the source note and what happened to it: duplicates merged, tracking parameters stripped, cut-off links recovered, ticked items moved into the collection, and the few that need a human.
- **A live watch.** The featured watch tells the real time with a sweeping seconds hand and today's date in the window.

## How it works

The data model came from the source note, which broke every simpler model tried on it:

| Concept | Why it exists |
|---|---|
| `Watch` | Maker, optional collab partner (a MoonSwatch is made by Swatch, with Omega), model, variant, reference. |
| `Listing` | One watch, many stores. The same Grand Seiko was saved four times across three sites; it's one watch with listings. |
| `Decision` | Candidates, a status (open, decided), an optional chosen watch, and an optional milestone. The chosen watch doesn't have to be on the shortlist. |
| `Candidate` | Can point at a brand ("Oris, model not chosen yet"), a model, or an exact reference. |
| `Want` | A watch with a reason, no decision required. Can point at a watch you own ("another Zenshin?"). |
| `Capture` | The raw pasted line, kept forever, with how the import went: resolved, partial, recovered, or broken. |

**The variant problem.** Brand sites often don't change the URL when you pick a dial, crystal or strap. The source note saved the same Speedmaster link three times meaning three different watches, and the difference was lost at capture. The app flags these ("variant lost") instead of pretending they're duplicates, and real capture should ask "which version?" at save time.

**No guessing.** Specs are filled only when the note, the link, or the reference itself states them. A missing case diameter shows "Not found", never an invented 39 mm. For watch data, confidently wrong is worse than blank. Decisions the app inferred from variants are labelled "Suggested" until you keep or dismiss them.

**Drawn, not photographed.** Every watch is rendered as vector art from its style and dial colour: divers with count-up bezels, chronographs with tachymeters and sub-dials, GMTs with 24-hour bezels, field and pilot dials, sector and roulette dials, a Tank with roman numerals and a sapphire cabochon, a Ventura, a G-Shock with a live LCD. It stays sharp at any size, on any display. The art is illustrative and never stands in for a spec.

## Why

Watch apps already catalogue watches well, track wear and value, and recommend what to buy. What none of them model is intent: *why* a watch is on the list, what it's competing against, and what moment it's for. Without that, a wishlist turns back into a long note of links, which is exactly where this started.

The bet: the structured history of your decisions is the product, and anything smart (recommendations, taste, "what should I buy next?") is only as good as that history. So this version has no AI and no price scraping. It's the foundation those would need.

## Privacy

Stories, milestones and milestone decisions are personal, so they live in `prototype/personal.js`, which is gitignored and never published. Without it the app runs as a public demo of the same collection with those parts empty. The bundled single-file build (`horology.html`) includes the personal layer when it exists, so it's gitignored too.

## Running locally

No install, no build step for development:

```bash
cd prototype
python3 -m http.server 4377
```

Open http://localhost:4377.

To produce one self-contained HTML file that opens offline by double-click:

```bash
prototype/build.sh
```

## What's here now, and what's next

- Done: the whole source note structured into watches, listings, decisions, wants, milestones and straps, with an import report for every messy line
- Done: vector watch renderer covering 21 watch styles, with live time on the featured watch
- Done: public/personal split so private stories never reach the repo
- Not yet: saving. Keep, Dismiss, "Add date" and "Add a candidate" are visual only, and nothing persists
- Not yet: capture. Share or paste a link, extract the reference from the URL and the page's structured data, and ask which variant you meant
- Not yet: a native iPhone app (SwiftUI, local-first, iCloud sync), which is where this is headed
- Later, only if earned: collection insights built on your decision history, and licensed market data instead of scraping
