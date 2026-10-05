#!/bin/sh
# Inline the scripts into one self-contained page: horology.html.
# Includes personal.js and images.js when they exist (photos load from img/ next to it),
# so horology.html is gitignored.
cd "$(dirname "$0")"
python3 - <<'PY'
import os
src = open("index.html").read()
for f in ["data.js", "personal.js", "images.js", "dial.js", "store.js", "app.js"]:
    tag = f'<script src="{f}"></script>' if f not in ("personal.js", "images.js") else f'<script src="{f}" onerror="this.remove()"></script>'
    body = open(f).read() if os.path.exists(f) else ""
    src = src.replace(tag, f"<script>\n{body}\n</script>" if body else "")
open("horology.html", "w").write(src)
print("wrote horology.html", len(src), "bytes", "(with personal layer)" if os.path.exists("personal.js") else "(public)")
PY
