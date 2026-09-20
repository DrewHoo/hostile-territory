// Joins researched tenures (data/research/tenures-*.json) against computed
// candidate games (data/games-candidates.json) and emits data/records.json.
// Agents gather rows; this script is the only place attribution happens.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const RESEARCH_DIR = 'data/research'
const candidates = JSON.parse(readFileSync('data/games-candidates.json', 'utf8'))

// Evidence-backed corrections to the bulk sources (see data/game-corrections.json).
let corrections = { corrections: [] }
try { corrections = JSON.parse(readFileSync('data/game-corrections.json', 'utf8')) } catch {}
const corrKey = (d, a, h) => `${d}|${a}|${h}`
const corrMap = new Map(corrections.corrections.map((c) => [corrKey(c.date, c.away_team, c.home_team), c]))
let excluded = 0, patched = 0
candidates.games = candidates.games.flatMap((g) => {
  const c = corrMap.get(corrKey(g.date, g.away_team, g.home_team))
  if (!c || c.action === 'add') return [g]
  if (c.action === 'exclude') { excluded++; return [] }
  patched++
  const out = { ...g, ...c.patch }
  if (c.patch.away_points != null) out.result = out.away_points > out.home_points ? 'W' : out.away_points < out.home_points ? 'L' : 'T'
  return [out]
})
// 'add' entries construct rows the pipeline's rules exclude but a ruling
// admits (e.g. a "neutral" CFP game played in one team's own stadium).
let added = 0
for (const c of corrections.corrections) {
  if (c.action !== 'add') continue
  const { action, reason, ...row } = c
  candidates.games.push(row)
  added++
}
console.log(`corrections: ${excluded} excluded, ${patched} patched, ${added} added (of ${corrMap.size} entries)`)
const aliasFile = JSON.parse(readFileSync('data/name-aliases.json', 'utf8'))

// Coach-name aliases live here once the merge pass needs them: canonical -> [variants].
let coachAliases = {}
try { coachAliases = JSON.parse(readFileSync('data/coach-aliases.json', 'utf8')).aliases ?? {} } catch {}
const coachCanon = new Map()
for (const [canon, variants] of Object.entries(coachAliases))
  for (const v of variants) coachCanon.set(v, canon)
const canonCoach = (name) => coachCanon.get(name) ?? name

// Team-name normalization: the pipeline's canonical set is the target.
const teamCanon = new Map()
for (const [canon, variants] of Object.entries(aliasFile.aliases ?? {}))
  for (const v of variants) teamCanon.set(v.toLowerCase(), canon)
const canonTeam = (name) => teamCanon.get(name.toLowerCase()) ?? name

const tenureFiles = readdirSync(RESEARCH_DIR).filter((f) => /^tenures-.*\.json$/.test(f))
const tenures = tenureFiles.flatMap((f) =>
  JSON.parse(readFileSync(`${RESEARCH_DIR}/${f}`, 'utf8')).map((t) => ({ ...t, coach: canonCoach(t.coach), school: canonTeam(t.school), file: f }))
)

// A tenure covers a school's game when the school matches and either the date
// range (when present) or the season range contains it. Dated rows beat undated
// rows so an interim's narrow window wins over the surrounding span.
function covers(t, school, game) {
  if (t.school !== school) return false
  if (t.start_date && game.date < t.start_date) return false
  if (t.end_date && game.date > t.end_date) return false
  if (!t.start_date && game.season < t.start_season) return false
  if (!t.end_date && t.end_season != null && game.season > t.end_season) return false
  return true
}

// Best-effort coach lookup for the HOME side of a game (for the popover).
// Ranked home teams are nearly all covered schools; null when they aren't.
function homeCoach(game) {
  const matches = tenures.filter((t) => covers(t, game.home_team, game))
  if (matches.length === 1) return matches[0].coach
  if (matches.length > 1) {
    const dated = matches.filter((t) => t.start_date || t.end_date)
    if (dated.length) return dated.sort((a, b) =>
      ((a.end_date ? Date.parse(a.end_date) : Infinity) - (a.start_date ? Date.parse(a.start_date) : -Infinity)) -
      ((b.end_date ? Date.parse(b.end_date) : Infinity) - (b.start_date ? Date.parse(b.start_date) : -Infinity)))[0].coach
  }
  return null
}

const CURRENT_SEASON = 2026
const unmatched = []
const conflicted = []
const byCoach = new Map()

// Optional enrichment layers, attached when present.
let otMap = {}
try { otMap = JSON.parse(readFileSync('data/ot.json', 'utf8')) } catch {}
const receipts = new Map()
for (const f of readdirSync(RESEARCH_DIR).filter((x) => /^receipts-\d\.json$/.test(x))) {
  try {
    for (const r of JSON.parse(readFileSync(`${RESEARCH_DIR}/${f}`, 'utf8')))
      receipts.set(`${r.date}|${r.away_team}`, r)
  } catch {}
}

let triage = {}
try { triage = JSON.parse(readFileSync('data/research/receipt-triage.json', 'utf8')).triage } catch {}

let overrides = []
try { overrides = JSON.parse(readFileSync('data/attribution-overrides.json', 'utf8')).overrides } catch {}
// An override names the coach; the tenure row still has to exist so school and
// grade come from research, not from the override file.
function ovMatch(game, matches) {
  const o = overrides.find((x) => x.date === game.date && x.away_team === game.away_team)
  if (!o) return null
  const row = matches.find((t) => t.coach === o.coach)
  if (!row) console.warn(`override for ${o.date} ${o.away_team} names ${o.coach}, but no matching tenure covers the game`)
  return row ?? null
}

for (const game of candidates.games) {
  const matches = tenures.filter((t) => covers(t, game.away_team, game))
  let pick = null
  const ov = ovMatch(game, matches)
  if (ov) pick = ov
  else if (matches.length === 1) pick = matches[0]
  else if (matches.length > 1) {
    const dated = matches.filter((t) => t.start_date || t.end_date)
    if (dated.length === 1) pick = dated[0]
    else if (dated.length > 1) {
      // Prefer the narrowest dated window: an interim's slice sits inside the
      // surrounding coach's dated span (e.g. Fulmer inside Majors's 1992).
      const span = (t) => (t.end_date ? Date.parse(t.end_date) : Infinity) - (t.start_date ? Date.parse(t.start_date) : -Infinity)
      const sorted = [...dated].sort((a, b) => span(a) - span(b))
      if (span(sorted[0]) < span(sorted[1])) pick = sorted[0]
      else conflicted.push({ game, coaches: matches.map((m) => `${m.coach}${m.interim ? ' (interim)' : ''} [${m.file}]`) })
    } else conflicted.push({ game, coaches: matches.map((m) => `${m.coach}${m.interim ? ' (interim)' : ''} [${m.file}]`) })
  } else {
    unmatched.push(game)
  }
  if (!pick) continue
  const key = pick.coach
  if (!byCoach.has(key)) byCoach.set(key, { coach: key, schools: [], games: [] })
  const rec = byCoach.get(key)
  if (!rec.schools.includes(pick.school)) rec.schools.push(pick.school)
  let rcpt = receipts.get(`${game.date}|${game.away_team}`)
  if (!rcpt) {
    // date-patched games: the fleet recorded the pre-patch worklist date
    const d = new Date(game.date)
    for (const off of [-1, 1]) {
      const alt = new Date(d.getTime() + off * 86400000).toISOString().slice(0, 10)
      rcpt = receipts.get(`${alt}|${game.away_team}`)
      if (rcpt) break
    }
  }
  rec.games.push({
    ...game,
    school: pick.school,
    interim: pick.interim || false,
    tenure_grade: pick.grade,
    home_coach: homeCoach(game),
    ot: game.game_id != null && otMap[game.game_id] != null ? otMap[game.game_id] : null,
    credit: game.credit ?? null,
    receipt: (() => {
      if (!rcpt || rcpt.status === 'page_missing') return null
      let status = rcpt.status
      if (status === 'discrepancy') {
        const t = triage[`${game.date}|${game.away_team}`] ?? triage[`${rcpt.date}|${game.away_team}`]
        if (t === 'resolved-date' || t === 'resolved-score') status = 'confirmed'
        else if (t === 'resolved-rank') status = 'resolved-rank'
      }
      return { url: rcpt.source_url, quote: rcpt.quote, status }
    })(),
  })
}

const records = [...byCoach.values()].map((r) => {
  r.games.sort((a, b) => a.date.localeCompare(b.date))
  const tally = (filter) => {
    const g = r.games.filter(filter)
    return { w: g.filter((x) => x.result === 'W').length, l: g.filter((x) => x.result === 'L').length, t: g.filter((x) => x.result === 'T').length }
  }
  return {
    ...r,
    top10: tally((g) => g.home_rank_ap <= 10),
    top25: tally(() => true),
    active: tenures.some((t) => t.coach === r.coach && t.end_season == null),
  }
}).sort((a, b) => (b.top10.w + b.top10.l) - (a.top10.w + a.top10.l))

writeFileSync('data/records.json', JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  rules_version: candidates.rules_version,
  current_season: CURRENT_SEASON,
  tenure_files: tenureFiles,
  coach_count: records.length,
  matched_games: records.reduce((n, r) => n + r.games.length, 0),
  unmatched_scoped_note: 'unmatched games are road teams with no tenure coverage; scoped-coach G5 stints among them are found by the career-sweep phase',
  records,
  conflicted,
}, null, 1))

// Compact site payload: arrays instead of objects, only what the page renders.
// Row: [date, school, opponent, opp_rank, result, away_pts, home_pts, interim,
//       home_coach|null, ot (0 = regulation/unknown, N = overtimes, ESPN),
//       receipt_url|null, receipt_quote|null (confirmed SR receipts only)]
writeFileSync('src/data/site-data.json', JSON.stringify({
  generated: new Date().toISOString().slice(0, 10),
  rules_version: candidates.rules_version,
  coaches: records.map((r) => ({
    n: r.coach,
    s: r.schools,
    a: r.active,
    g: r.games.map((g) => [g.date, g.school, g.home_team, g.home_rank_ap, g.result, g.away_points, g.home_points, g.interim ? 1 : 0, g.home_coach, g.ot ?? 0, g.receipt?.status === 'confirmed' ? g.receipt.url : null, g.receipt?.status === 'confirmed' ? g.receipt.quote : null, g.credit]),
  })),
}))

console.log(`tenure files: ${tenureFiles.join(', ')}`)
console.log(`coaches: ${records.length}, matched games: ${records.reduce((n, r) => n + r.games.length, 0)} of ${candidates.games.length}`)
console.log(`unmatched (no tenure coverage): ${unmatched.length}, conflicted (2+ tenures, no dated tiebreak): ${conflicted.length}`)
for (const c of conflicted.slice(0, 12)) console.log('  CONFLICT', c.game.date, c.game.away_team, 'at', c.game.home_team, '->', c.coaches.join(' | '))
writeFileSync('data/research/unmatched-games.json', JSON.stringify(unmatched, null, 1))
