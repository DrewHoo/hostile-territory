// Joins researched tenures (data/research/tenures-*.json) against computed
// candidate games (data/games-candidates.json) and emits data/records.json.
// Agents gather rows; this script is the only place attribution happens.
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'

const RESEARCH_DIR = 'data/research'
const candidates = JSON.parse(readFileSync('data/games-candidates.json', 'utf8'))
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

// A tenure covers a game when the school matches and either the date range
// (when present) or the season range contains it. Dated rows beat undated rows
// so an interim's narrow window wins over the surrounding span.
function covers(t, game) {
  if (t.school !== game.away_team) return false
  if (t.start_date && game.date < t.start_date) return false
  if (t.end_date && game.date > t.end_date) return false
  if (!t.start_date && game.season < t.start_season) return false
  if (!t.end_date && t.end_season != null && game.season > t.end_season) return false
  return true
}

const CURRENT_SEASON = 2026
const unmatched = []
const conflicted = []
const byCoach = new Map()

for (const game of candidates.games) {
  const matches = tenures.filter((t) => covers(t, game))
  let pick = null
  if (matches.length === 1) pick = matches[0]
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
  rec.games.push({ ...game, school: pick.school, interim: pick.interim || false, tenure_grade: pick.grade })
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

console.log(`tenure files: ${tenureFiles.join(', ')}`)
console.log(`coaches: ${records.length}, matched games: ${records.reduce((n, r) => n + r.games.length, 0)} of ${candidates.games.length}`)
console.log(`unmatched (no tenure coverage): ${unmatched.length}, conflicted (2+ tenures, no dated tiebreak): ${conflicted.length}`)
for (const c of conflicted.slice(0, 12)) console.log('  CONFLICT', c.game.date, c.game.away_team, 'at', c.game.home_team, '->', c.coaches.join(' | '))
writeFileSync('data/research/unmatched-games.json', JSON.stringify(unmatched, null, 1))
