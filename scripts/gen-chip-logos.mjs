// The share card's chip logos, baked: satori (workers-og) can't run CSS
// filters, so the two looks the board gets from filter rules are committed
// as PNGs. logos-ink/ is the win chip's (near-black at 80% alpha, the look
// of brightness(0) opacity .72 on cream); logos-dim/ the loss chip's (66%
// gray at 85% alpha, the look of brightness(0) invert(.66) opacity .85 on
// the lifted dark). Rerun after gen-logos adds a team.
// Usage: node scripts/gen-chip-logos.mjs
import sharp from 'sharp'
import { readdirSync, mkdirSync } from 'node:fs'

const VARIANTS = [
  { dir: 'public/logos-ink', rgb: [36, 29, 18], a: 0.8 },
  { dir: 'public/logos-dim', rgb: [168, 168, 168], a: 0.85 },
]
for (const v of VARIANTS) mkdirSync(v.dir, { recursive: true })
const files = readdirSync('public/logos').filter((f) => f.endsWith('.png'))
for (const f of files) {
  const { data, info } = await sharp(`public/logos/${f}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  for (const v of VARIANTS) {
    const out = Buffer.from(data)
    for (let i = 0; i < out.length; i += 4) {
      out[i] = v.rgb[0]; out[i + 1] = v.rgb[1]; out[i + 2] = v.rgb[2]
      out[i + 3] = Math.round(out[i + 3] * v.a)
    }
    await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
      .png({ compressionLevel: 9 }).toFile(`${v.dir}/${f}`)
  }
}
console.log(`${files.length} logos -> ink + dim`)
