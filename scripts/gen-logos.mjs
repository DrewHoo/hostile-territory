// Downloads every ranked host's ESPN logo, downscales it to a 40px PNG in
// public/logos/<id>.png, and writes src/data/team-ids.json (team -> espn id).
// Run once (and again if a new host appears); outputs are committed.
import sharp from 'sharp'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync } from 'node:fs'

const RAW = 'data/raw/cfbfastr'
const OUT = 'public/logos'
mkdirSync(OUT, { recursive: true })

// team name -> ESPN id, from the raw schedules (canonical names already).
const ids = new Map()
const parse = (t) => {
  const [h, ...rows] = t.trim().split('\n')
  const cols = h.split(',').map((c) => c.replaceAll('"', ''))
  return rows.map((r) => {
    const vals = r.match(/("[^"]*"|[^,]*)(,|$)/g).map((v) => v.replace(/,$/, '').replace(/^"|"$/g, ''))
    const o = {}
    cols.forEach((c, i) => (o[c] = vals[i]))
    return o
  })
}
const aliasFile = JSON.parse(readFileSync('data/name-aliases.json', 'utf8'))
const canon = new Map()
for (const [c, vars] of Object.entries(aliasFile.aliases ?? {})) for (const v of vars) canon.set(v.toLowerCase(), c)
const toCanon = (n) => canon.get(n.toLowerCase()) ?? n
// Raw spellings the alias map doesn't carry (the pipeline joins these by id).
canon.set('miami', 'Miami (FL)')
canon.set("hawai'i", 'Hawaii')
canon.set('san josé state', 'San Jose State')
for (const f of readdirSync(RAW).filter((f) => f.endsWith('.csv'))) {
  for (const r of parse(readFileSync(`${RAW}/${f}`, 'utf8'))) {
    if (r.home_id && r.home_id !== 'NA') ids.set(toCanon(r.home_team), r.home_id)
    if (r.away_id && r.away_id !== 'NA') ids.set(toCanon(r.away_team), r.away_id)
  }
}

// Hosts (board chips) plus every school a scoped coach led (coach-row logos).
const records = JSON.parse(readFileSync('data/records.json', 'utf8'))
const hosts = new Set()
for (const c of records.records) {
  for (const g of c.games) hosts.add(g.home_team)
  for (const s of c.schools) hosts.add(s)
}

ids.set('Pacific', '279') // defunct program, absent from cfbfastR ids
const map = {}
let missing = []
for (const team of [...hosts].sort()) {
  const id = ids.get(team)
  if (!id) { missing.push(team); continue }
  map[team] = id
  const out = `${OUT}/${id}.png`
  if (existsSync(out)) continue
  const res = await fetch(`https://a.espncdn.com/i/teamlogos/ncaa/500/${id}.png`)
  if (!res.ok) { missing.push(`${team} (http ${res.status})`); delete map[team]; continue }
  const buf = Buffer.from(await res.arrayBuffer())
  // Bake a one-color "ink density" mark instead of a binary silhouette: some
  // marks (outlined wordmarks, multi-tone mascot heads) only read through
  // their interior structure. Ink strength comes from darkness OR saturation,
  // so dark outlines and saturated fills print, near-white interiors stay
  // open, and bright solid marks (a maize M) still print at full strength.
  // Output pixels are pure black with variable alpha; the CSS win treatment
  // is plain opacity and the loss treatment inverts the same asset.
  const { data, info } = await sharp(buf).raw().ensureAlpha().toBuffer({ resolveWithObject: true })
  for (let i = 0; i < data.length; i += 4) {
    const [r, g, b] = [data[i], data[i + 1], data[i + 2]]
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    const sat = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
    const ink = Math.min(1, Math.max((1 - lum) * 1.2, sat * 0.9))
    data[i] = 0; data[i + 1] = 0; data[i + 2] = 0
    data[i + 3] = Math.round(data[i + 3] * ink)
  }
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } })
    .trim({ threshold: 10 })
    .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out)
  await new Promise((r) => setTimeout(r, 150))
}
writeFileSync('src/data/team-ids.json', JSON.stringify(map))
console.log(`${Object.keys(map).length} logos for ${hosts.size} hosts; missing: ${missing.join(', ') || 'none'}`)
