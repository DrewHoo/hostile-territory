// A coach's record at each venue and its words, for the share worker: the
// card and the <head> of a board link with him open (?coach=). Pure.

// site-data game row, as App.jsx reads it
export const D = { DATE: 0, SCHOOL: 1, OPP: 2, RANK: 3, RES: 4, AP: 5, HP: 6, INT: 7, HC: 8, OT: 9, URL: 10, QUOTE: 11, CREDIT: 12, POLL: 13 }

export const CUTS = [5, 10, 25]
/** the record every page leads with, and the board's default */
export const CUT = 10
/** a coach needs this many road games against the top 10 to be ranked */
export const MIN_RANKED = 5

/** "P. J. Fleck" -> "p-j-fleck", "Mike O'Brien" -> "mike-obrien" */
export const slugOf = (name) =>
  name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/['.]/g, ' ').replace(/'/g, '').trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** the 1990+ and the 1936 payloads as one list, oldest games first (App.jsx's mergeEras) */
export function mergeEras(modern, early) {
  if (!early) return modern
  const byName = new Map(modern.map((c) => [c.n, c]))
  const merged = modern.map((c) => c)
  for (const e of early) {
    const m = byName.get(e.n)
    const c = m ? { n: e.n, s: [...new Set([...e.s, ...m.s])], a: m.a, g: [...e.g, ...m.g] } : e
    if (m) merged[merged.indexOf(m)] = c
    else merged.push(c)
  }
  return merged
}

/** [w, l, t] of a list of site-data games */
export function tally(games) {
  const r = [0, 0, 0]
  for (const g of games) r[g[D.RES] === 'W' ? 0 : g[D.RES] === 'L' ? 1 : 2]++
  return r
}

export const rec = ([w, l, t] = [0, 0, 0]) => `${w}-${l}${t ? `-${t}` : ''}`
export const pctOf = ([w, l, t]) => (w + l + t ? (w + t / 2) / (w + l + t) : 0)
export const fmtPct = (p) => (p >= 1 ? '1.000' : p.toFixed(3).replace(/^0/, ''))
const sum = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const list = (xs) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`)
const ordinal = (n) => `${n}${['th', 'st', 'nd', 'rd'][(n % 100 > 10 && n % 100 < 14) || n % 10 > 3 ? 0 : n % 10]}`

/**
 * Everything a coach's page says.
 * @param coach a merged site-data coach ({ n, s, a, g })
 * @param venues his venues.json entry ({ h, r, n }: venue -> cut -> [w, l, t]) or undefined
 * @param field every merged coach, for his place on the board
 */
export function coachRecord(coach, venues, field) {
  const road = Object.fromEntries(CUTS.map((c) => [c, tally(coach.g.filter((g) => g[D.RANK] <= c))]))
  // home and neutral are Streak King's; the road row is the board's, with its receipts
  const table = CUTS.map((c) => {
    const h = venues?.h?.[c] ?? [0, 0, 0]
    const n = venues?.n?.[c] ?? [0, 0, 0]
    return { cut: c, home: h, road: road[c], neutral: n, all: sum(sum(h, n), road[c]) }
  })
  // his road record at each school against the top 10, in the order he coached there
  const schools = coach.s
    .map((s) => ({ school: s, r: tally(coach.g.filter((g) => g[D.SCHOOL] === s && g[D.RANK] <= CUT)) }))
    .filter((x) => x.r[0] + x.r[1] + x.r[2] > 0)
  // his place among every coach with MIN_RANKED road games against the top 10, the board's order
  const ranked = field
    .map((c) => ({ n: c.n, r: tally(c.g.filter((g) => g[D.RANK] <= CUT)) }))
    .filter((c) => c.r[0] + c.r[1] + c.r[2] >= MIN_RANKED)
    .sort((a, b) => pctOf(b.r) - pctOf(a.r) || b.r[0] - a.r[0] || a.r[1] - b.r[1] || a.n.localeCompare(b.n))
  const i = ranked.findIndex((c) => c.n === coach.n)
  let place = null
  if (i >= 0) {
    const p = pctOf(ranked[i].r)
    const first = ranked.findIndex((c) => pctOf(c.r) === p)
    const tied = ranked.filter((c) => pctOf(c.r) === p).length > 1
    place = { rank: first + 1, tied, last: p === pctOf(ranked[ranked.length - 1].r), of: ranked.length }
  }
  return { name: coach.n, schools, table, road, place, active: coach.a, games: coach.g, hasVenues: !!venues }
}

const top10 = (r) => r.table.find((x) => x.cut === CUT)

/** the lead: the whole record against the top 10, then the road part of it, then the top 25 on the road */
export function coachLead(r) {
  const t = top10(r)
  const is = r.active ? 'is' : 'was'
  const head = r.hasVenues
    ? `${r.name} ${is} ${rec(t.all)} against AP top-10 teams, ${rec(t.road)} of it on the road.`
    : `${r.name} ${is} ${rec(t.road)} on the road against AP top-10 teams.`
  const atEach = r.schools.length > 1 ? ` On the road against the top 10 he ${is} ${list(r.schools.map((x) => `${rec(x.r)} at ${x.school}`))}.` : ''
  return `${head}${atEach} Against the top 25 on the road he ${is} ${rec(r.road[25])}.`
}
