// Emits the current-coaches poster HTML to stdout. Render it with headless
// Chrome at --force-device-scale-factor=2 against a server that serves
// /hostile-territory/logos/ (the dev server), then crop trailing space.
// Usage: node scripts/gen-poster.mjs > poster.html
import { readFileSync } from 'node:fs'

const d = JSON.parse(readFileSync('src/data/site-data.json', 'utf8'))
const ids = JSON.parse(readFileSync('src/data/team-ids.json', 'utf8'))
const L = (t) => (ids[t] ? `http://localhost:5173/hostile-territory/logos/${ids[t]}.png` : null)

const rows = d.coaches.filter((c) => c.a)
  .map((c) => ({ n: c.n, s: c.s, g: c.g.filter((g) => g[3] <= 10) }))
  .filter((c) => c.g.length)
  .map((c) => {
    const w = c.g.filter((g) => g[4] === 'W').length, l = c.g.length - w
    return { ...c, w, l, pct: w / c.g.length }
  })
  .sort((a, b) => b.pct - a.pct || b.w - a.w || a.l - b.l || a.n.localeCompare(b.n))

const fmtPct = (p) => (p >= 1 ? '1.000' : p.toFixed(3).replace(/^0/, ''))
const chip = (g) => {
  const src = L(g[2])
  const cls = g[4] === 'W' ? 'w' : 'l'
  return src ? `<span class="c ${cls}"><img src="${src}"></span>` : `<span class="c ${cls}">${g[4]}</span>`
}
const schoolLogos = (s) => s.map((x) => (L(x) ? `<img class="sl" src="${L(x)}" >` : '')).join('')
const row = (c) => `<div class="r">
  <span class="nm">${c.n}${schoolLogos(c.s)}</span>
  <span class="gs">${c.g.map(chip).join('')}</span>
  <span class="rec">${c.w}–${c.l}<i>${fmtPct(c.pct)}</i></span>
</div>`

const half = Math.ceil(rows.length / 2)
const cols = [rows.slice(0, half), rows.slice(half)]

console.log(`<!doctype html><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Graduate&family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&family=IBM+Plex+Mono:wght@500;600&display=swap" rel="stylesheet">
<style>
:root { --bg:#282127; --lift:#322a30; --ink:#efe6d9; --muted:#bfb2a6; --faint:#857a75; --line:#453a42; --cream:#f3e2bc; --rust:#c36c36; }
* { box-sizing:border-box; }
body { margin:0; width:1560px; background:var(--bg); color:var(--ink); font-family:'Source Serif 4',Georgia,serif; position:relative; }
body::before { content:''; position:absolute; inset:0; pointer-events:none;
  background: radial-gradient(1400px 700px at 50% -12%, rgba(243,226,188,.10), transparent 65%); }
body::after { content:''; position:absolute; inset:0; pointer-events:none; opacity:.75;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.55' numOctaves='3'/%3E%3CfeColorMatrix values='0 0 0 0 1 0 0 0 0 0.95 0 0 0 0 0.85 0 0 0 0.055 0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E"); }
main { padding:44px 48px 36px; position:relative; }
.rule { display:flex; align-items:center; margin-bottom:20px; }
.rule::before,.rule::after { content:''; flex:1; border-top:2px dashed rgba(239,230,217,.35); }
h1 { font-family:'Graduate',serif; font-weight:400; text-align:center; font-size:44px; margin:0 0 4px; color:var(--cream); letter-spacing:.03em; }
.sub { text-align:center; font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:.2em; text-transform:uppercase; color:var(--rust); margin-bottom:26px; }
.cols { display:flex; gap:40px; }
.col { flex:1; border-top:3px double var(--line); }
.r { display:flex; align-items:center; gap:8px; padding:5.5px 2px; border-bottom:1px solid var(--line); }
.nm { width:255px; font-weight:600; font-size:13.5px; display:inline-flex; align-items:center; gap:4px; white-space:nowrap; overflow:hidden; }
.sl { width:12px; height:12px; filter:brightness(0) invert(.55); opacity:.9; margin-left:2px; flex:none; }
.gs { flex:1; display:flex; gap:3.5px; flex-wrap:wrap; }
.c { width:16px; height:16px; border-radius:2.5px; display:inline-flex; align-items:center; justify-content:center; font-family:'IBM Plex Mono',monospace; font-size:9px; font-weight:600; flex:none; }
.c img { width:12px; height:12px; display:block; }
.c.w { background:var(--cream); box-shadow:0 0 6px rgba(243,226,188,.3); } .c.w img { opacity:.72; }
.c.l { background:var(--lift); border:1px solid var(--line); } .c.l img { filter:invert(.66); opacity:.85; }
.rec { font-family:'IBM Plex Mono',monospace; font-size:12.5px; white-space:nowrap; text-align:right; min-width:86px; }
.rec i { font-style:normal; color:var(--faint); font-size:11px; margin-left:6px; }
footer { display:flex; justify-content:space-between; margin-top:22px; font-family:'IBM Plex Mono',monospace; font-size:11px; color:var(--faint); letter-spacing:.08em; }
.legend { display:flex; gap:14px; align-items:center; }
</style>
<main>
<div class="rule"></div>
<h1>Hostile Territory</h1>
<div class="sub">Current head coaches · true road games vs the AP Top 10 · 1990 – present</div>
<div class="cols">
  <div class="col">${cols[0].map(row).join('')}</div>
  <div class="col">${cols[1].map(row).join('')}</div>
</div>
<footer>
  <span class="legend"><span class="c w">W</span> win <span class="c l">L</span> loss · each mark is the host team</span>
  <span>drewhoover.com/hostile-territory · ${d.generated}</span>
</footer>
</main>`)
