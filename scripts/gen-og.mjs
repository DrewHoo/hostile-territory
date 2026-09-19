// Generate the social preview images. Run: npm run gen:og
//   public/og.png    1200x630, what X/Bluesky/LinkedIn/Reddit/iMessage show
//   public/card.png  1200x750, the 8:5 cover for the index site's project card
//
// Styled to match the site's Night Program look: warm charcoal, cream serif
// display, and a row of letterpress W/L stamps (Kiffin's 1-8) as the motif.
// Outputs are committed; CI does not regenerate them. Re-run after a redesign,
// and open the PNGs.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../site.config.js'
import pkg from '../package.json' with { type: 'json' }

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(outDir, { recursive: true })

const SERIF = "Georgia, 'Times New Roman', serif"
const MONO = "'SF Mono', Menlo, Consolas, monospace"
const BG = '#282127'
const LIFT = '#322a30'
const LINE = '#453a42'
const INK = '#efe6d9'
const MUTED = '#857a75'
const CREAM = '#f3e2bc'
const RUST = '#c36c36'
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

// Kiffin's road-vs-top-10 line, the number that started the site.
const STAMPS = ['L', 'L', 'W', 'L', 'L', 'L', 'L', 'L', 'L']

function chips(x, y, size, gap) {
  return STAMPS.map((r, i) => {
    const cx = x + i * (size + gap)
    return r === 'W'
      ? `<rect x="${cx}" y="${y}" width="${size}" height="${size}" rx="6" fill="${CREAM}"/>
         <text x="${cx + size / 2}" y="${y + size * 0.7}" font-family="${MONO}" font-size="${size * 0.5}" font-weight="700" fill="#241d12" text-anchor="middle">W</text>`
      : `<rect x="${cx}" y="${y}" width="${size}" height="${size}" rx="6" fill="${LIFT}" stroke="${LINE}" stroke-width="2"/>
         <text x="${cx + size / 2}" y="${y + size * 0.7}" font-family="${MONO}" font-size="${size * 0.5}" font-weight="600" fill="${MUTED}" text-anchor="middle">L</text>`
  }).join('\n  ')
}

function render(W, H) {
  const title = config.ogTitle ?? config.title
  const footerY = H - 52
  const cy = H / 2 // vertical anchor for the centered stack
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="lamp" cx="0.5" cy="-0.15" r="1.1">
      <stop offset="0%" stop-color="rgba(243,226,188,0.14)"/>
      <stop offset="60%" stop-color="rgba(243,226,188,0)"/>
    </radialGradient>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.55" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 1  0 0 0 0 0.95  0 0 0 0 0.85  0 0 0 0.05 0"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${BG}"/>
  <rect width="${W}" height="${H}" fill="url(#lamp)"/>
  <rect width="${W}" height="${H}" filter="url(#grain)"/>

  <line x1="60" y1="70" x2="${W / 2 - 310}" y2="70" stroke="${INK}" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="14 10"/>
  <line x1="${W / 2 + 310}" y1="70" x2="${W - 60}" y2="70" stroke="${INK}" stroke-opacity="0.35" stroke-width="3" stroke-dasharray="14 10"/>
  <text x="${W / 2}" y="77" font-family="${MONO}" font-size="19" fill="${MUTED}" letter-spacing="5" text-anchor="middle">OFFICIAL PROGRAM · NIGHT EDITION</text>

  <text x="${W / 2}" y="${cy - 75}" font-family="${SERIF}" font-size="96" font-weight="700" fill="${CREAM}" text-anchor="middle" letter-spacing="2">${esc(title)}</text>
  <text x="${W / 2}" y="${cy - 22}" font-family="${MONO}" font-size="22" fill="${RUST}" letter-spacing="4" text-anchor="middle">${esc(config.ogSubtitle.toUpperCase())}</text>

  ${chips(W / 2 - (9 * 64 - 12) / 2, cy + 30, 52, 12)}
  <text x="${W / 2}" y="${cy + 135}" font-family="${SERIF}" font-size="26" font-style="italic" fill="${MUTED}" text-anchor="middle">Lane Kiffin, on the road against the AP top 10</text>

  <text x="${W / 2}" y="${footerY}" font-family="${MONO}" font-size="18" fill="${MUTED}" text-anchor="middle">${esc(config.domain)}/${esc(pkg.name)}</text>
</svg>`
}

for (const { name, w, h } of [
  { name: 'og.png', w: 1200, h: 630 },
  { name: 'card.png', w: 1200, h: 750 },
]) {
  const out = resolve(outDir, name)
  await sharp(Buffer.from(render(w, h))).png({ compressionLevel: 9 }).toFile(out)
  console.log(`wrote ${name} (${w}x${h})`)
}
