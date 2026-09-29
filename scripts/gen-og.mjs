// Generate the social preview images. Run: npm run gen:og
//   public/og.png    1200x630, what X/Bluesky/LinkedIn/Reddit/iMessage show
//   public/card.png  1200x750, the 8:5 cover for the index site's project card
//
// Styled to match the site's Night Program look: warm charcoal, cream serif
// display, and Kiffin's road games vs the top 10 as the motif, drawn as the
// site's own chips (cream win / dark loss, opponent mark inside), read from
// src/data/site-data.json so a new game lands on the next run.
// Outputs are committed; CI does not regenerate them. Re-run after a redesign,
// and open the PNGs.
import sharp from 'sharp'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../site.config.js'
import pkg from '../package.json' with { type: 'json' }

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(ROOT, 'public')
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
const data = JSON.parse(readFileSync(resolve(ROOT, 'src/data/site-data.json'), 'utf8'))
const teamIds = JSON.parse(readFileSync(resolve(ROOT, 'src/data/team-ids.json'), 'utf8'))
const kiffin = data.coaches.find((c) => c.n === 'Lane Kiffin')
const GAMES = kiffin.g.filter((g) => g[3] <= 10) // [date, team, opp, oppRank, result, ...]
const WINS = GAMES.filter((g) => g[4] === 'W').length
const RECORD = `${WINS}–${GAMES.length - WINS}`
const WAS = `${WINS}–${GAMES.length - WINS - 1}` // before the latest loss; struck, as on the site

// The site tints the black opponent mark with CSS filters; bake the same tints
// into the pixels: ink on a win, warm gray on a loss.
async function mark(opp, rgb, alpha) {
  const id = teamIds[opp]
  if (!id) return null
  const { data: px, info } = await sharp(resolve(outDir, 'logos', `${id}.png`)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < px.length; i += 4) { px[i] = rgb[0]; px[i + 1] = rgb[1]; px[i + 2] = rgb[2]; px[i + 3] = Math.round(px[i + 3] * alpha) }
  const png = await sharp(px, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
  return `data:image/png;base64,${png.toString('base64')}`
}
const MARKS = await Promise.all(GAMES.map((g) => (g[4] === 'W' ? mark(g[2], [0, 0, 0], 0.72) : mark(g[2], [168, 168, 168], 0.85))))

function chips(x, y, size, gap) {
  const m = size * 0.16 // mark inset; the site draws a 14px mark in an 18px chip
  return GAMES.map((g, i) => {
    const cx = x + i * (size + gap)
    const last = i === GAMES.length - 1
    const box = g[4] === 'W'
      ? `<rect x="${cx}" y="${y}" width="${size}" height="${size}" rx="6" fill="${CREAM}"/>`
      : `<rect x="${cx}" y="${y}" width="${size}" height="${size}" rx="6" fill="${LIFT}" stroke="${LINE}" stroke-width="2"/>`
    // the newest game, the one that made it 1-9, gets the site's rust outline
    const ring = last ? `<rect x="${cx - 4}" y="${y - 4}" width="${size + 8}" height="${size + 8}" rx="8" fill="none" stroke="${RUST}" stroke-width="2.5"/>` : ''
    const img = MARKS[i] ? `<image x="${cx + m}" y="${y + m}" width="${size - 2 * m}" height="${size - 2 * m}" href="${MARKS[i]}"/>` : ''
    return box + img + ring
  }).join('\n  ')
}

// librsvg ignores text-decoration, so the strike through the old record is a
// drawn line. Measure ink widths by rendering the runs alone and trimming.
const CAPTION = { size: 26, attrs: `font-family="${SERIF}" font-size="26" font-style="italic"` }
async function inkWidth(str) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="60"><text x="10" y="40" ${CAPTION.attrs} fill="#000">${esc(str)}</text></svg>`
  const { info } = await sharp(Buffer.from(svg)).flatten({ background: '#fff' }).trim().toBuffer({ resolveWithObject: true })
  return info.width
}
const PRE = 'Lane Kiffin is '
const POST = ` ${RECORD} on the road against the AP top 10`
const STRIKE = { full: await inkWidth(PRE + WAS + POST), toEnd: await inkWidth(PRE + WAS), was: await inkWidth(WAS) }

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

  ${chips(W / 2 - (GAMES.length * 64 - 12) / 2, cy + 30, 52, 12)}
  <text x="${W / 2}" y="${cy + 135}" ${CAPTION.attrs} fill="${MUTED}" text-anchor="middle">${esc(PRE)}<tspan fill-opacity="0.75">${WAS}</tspan> <tspan fill="${INK}">${RECORD}</tspan>${esc(POST.slice(RECORD.length + 1))}</text>
  <line x1="${W / 2 - STRIKE.full / 2 + STRIKE.toEnd - STRIKE.was - 2}" x2="${W / 2 - STRIKE.full / 2 + STRIKE.toEnd + 2}" y1="${cy + 123}" y2="${cy + 123}" stroke="${RUST}" stroke-width="2"/>

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
