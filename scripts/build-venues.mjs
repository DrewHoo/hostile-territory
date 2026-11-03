// Every coach's record against ranked teams at home, on the road and on a
// neutral field, from College Football Streak King's published payload
// (data/raw/streak-king/payload.json, which fetch-data.mjs --only=games
// downloads): every major-college game since 1936, the AP rank in effect at
// kickoff for each side, and each team's head coach by game. The board's
// home and neutral-site choices read it beside its own road games, which carry
// the receipts; the share worker's card reads the tallies.
//
//   node scripts/build-venues.mjs     writes src/data/venue-games.json (every
//                                     home and neutral game against a ranked
//                                     team, per coach, loaded when a reader
//                                     picks one) and src/data/venues.json
//                                     (the tallies the card draws)
//
// A coach is matched to Streak King's by name, initials without spaces
// ("P. J. Fleck" is "P.J. Fleck") and data/coach-aliases.json, with the few
// spellings below. A coach Streak King doesn't name has no venue table.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { canon, display } from './build-candidates.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PAYLOAD = path.join(ROOT, 'data/raw/streak-king/payload.json')
const OUT = path.join(ROOT, 'src/data/venues.json')
const GAMES_OUT = path.join(ROOT, 'src/data/venue-games.json')
const NEUTRAL = 1 // cfb-streak-king src/lib/schema.ts FLAG

// this site's spelling -> Streak King's, where initials aren't the difference
const SPELLINGS = {
  'Eliah Drinkwitz': 'Eli Drinkwitz',
  'John L. Smith': 'John Smith',
  'Jim L. Mora': 'Jim Mora',
}
const ALIASES = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/coach-aliases.json'), 'utf8')).aliases
const key = (n) => n.toLowerCase().replace(/\b([a-z])\.\s+(?=[a-z]\.)/g, '$1.').replace(/\s+/g, ' ').trim()

if (!fs.existsSync(PAYLOAD)) {
  console.log('build-venues: no Streak King payload under data/raw/, kept the committed venues.json')
  process.exit(0)
}
const p = JSON.parse(fs.readFileSync(PAYLOAD, 'utf8'))
const g = p.games
const N = g.se.length

// each team's game count within a season, as Streak King's createModel keeps
// it: the stints start at a season and an ordinal
const hOrd = new Int32Array(N), aOrd = new Int32Array(N)
{
  const cnt = new Map()
  const next = (ti, se) => { const k = ti * 10000 + se; const n = cnt.get(k) ?? 0; cnt.set(k, n + 1); return n }
  for (let i = 0; i < N; i++) { hOrd[i] = next(g.hi[i], g.se[i]); aOrd[i] = next(g.ai[i], g.se[i]) }
}
const stintAt = (ti, se, ord) => {
  let cur = null
  for (const s of p.teams[ti].hc ?? []) {
    if (s[1] < se || (s[1] === se && s[2] <= ord)) cur = s
    else break
  }
  return cur
}
const major = (ti, se) => (p.teams[ti].major ?? []).some(([a, b]) => se >= a && se <= b)

// a team by this site's name, as the board and its logos know it
const teamName = (ti) => {
  const t = p.teams[ti]
  const key = canon(t.id, 'Streak King') ?? canon(t.name, 'Streak King')
  return key ? display(key) : t.name
}

// coach name (Streak King's, keyed) -> venue -> cut -> [w, l, t], and his
// home and neutral games against ranked teams
const CUTS = [5, 10, 25]
const tallies = new Map()
const venueGames = new Map()
const add = (name, venue, rank, res) => {
  let t = tallies.get(name)
  if (!t) tallies.set(name, (t = { h: {}, r: {}, n: {} }))
  for (const c of CUTS) {
    if (rank > c) continue
    const v = (t[venue][c] ??= [0, 0, 0])
    v[res]++
  }
}
// a game row in site-data's shape (App.jsx), the coach's side first: [date,
// school, opponent, opp_rank, result, his points, theirs, interim, opposing
// coach, overtimes, 4 receipt fields left null, venue 'h' | 'n']
const addGame = (name, venue, row) => {
  if (venue === 'r') return
  let v = venueGames.get(name)
  if (!v) venueGames.set(name, (v = { h: [], n: [] }))
  v[venue].push(row)
}
for (let i = 0; i < N; i++) {
  const se = g.se[i]
  const neutral = g.fl[i] & NEUTRAL
  for (const side of [0, 1]) {
    const ti = side ? g.ai[i] : g.hi[i]
    const rank = side ? g.hr[i] : g.ar[i] // the opponent's
    if (rank <= 0 || !major(ti, se)) continue
    const s = stintAt(ti, se, side ? aOrd[i] : hOrd[i])
    if (!s || s[0] < 0) continue
    const us = side ? g.as[i] : g.hs[i], them = side ? g.hs[i] : g.as[i]
    const venue = neutral ? 'n' : side ? 'r' : 'h'
    const res = us > them ? 0 : us < them ? 1 : 2
    const name = key(p.coachNames[s[0]])
    add(name, venue, rank, res)
    if (rank > 25) continue
    const oi = side ? g.hi[i] : g.ai[i]
    const os = stintAt(oi, se, side ? hOrd[i] : aOrd[i])
    addGame(name, venue, [
      new Date(g.ep[i] * 86400000).toISOString().slice(0, 10), teamName(ti), teamName(oi), rank, 'WLT'[res], us, them,
      s[3] ? 1 : 0, os && os[0] >= 0 ? p.coachNames[os[0]] : null, g.ot && g.ot[i] > 0 ? g.ot[i] : 0, null, null, null, null, venue,
    ])
  }
}

// this site's coaches, both eras
const coaches = new Set()
for (const f of ['site-data.json', 'site-data-1936.json']) {
  for (const c of JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data', f), 'utf8')).coaches) coaches.add(c.n)
}
const out = {}
const games = {}
const unmatched = []
for (const n of [...coaches].sort()) {
  const names = [n, SPELLINGS[n], ...(ALIASES[n] ?? [])].filter(Boolean).map(key)
  const k = names.find((k) => tallies.has(k))
  if (!k) { unmatched.push(n); continue }
  out[n] = tallies.get(k)
  if (venueGames.has(k)) games[n] = venueGames.get(k)
}
fs.writeFileSync(OUT, JSON.stringify({ builtAt: p.builtAt, coaches: out }) + '\n')
fs.writeFileSync(GAMES_OUT, JSON.stringify({ builtAt: p.builtAt, coaches: games }) + '\n')
console.log(`build-venues: ${Object.keys(out).length} coaches written, ${unmatched.length} not in Streak King's payload${unmatched.length ? `: ${unmatched.join(', ')}` : ''}`)
