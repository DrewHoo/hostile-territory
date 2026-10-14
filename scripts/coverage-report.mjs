// Measures what the finished page can't show: gaps, double-coverage, name
// splits, and the known-answer check. Run after every merge.
import { readFileSync, readdirSync } from 'node:fs'

const rules = JSON.parse(readFileSync('data/rules.json', 'utf8'))
const candidates = JSON.parse(readFileSync('data/games-candidates.json', 'utf8'))
const tenureFiles = readdirSync('data/research').filter((f) => /^tenures-.*\.json$/.test(f))
const tenures = tenureFiles.flatMap((f) => JSON.parse(readFileSync(`data/research/${f}`, 'utf8')).map((t) => ({ ...t, file: f })))
const records = JSON.parse(readFileSync('data/records.json', 'utf8'))

const CURRENT_SEASON = 2026
const inScope = Object.values(rules.school_assignments).flat()
let failures = 0
const fail = (msg) => { failures++; console.log('  FAIL', msg) }

// 1. Continuous coverage: every in-scope school, every season 1990..now, >=1 tenure.
console.log('\n== 1. School-season coverage ==')
const covered = tenureFiles.length === 5
if (!covered) console.log(`  (only ${tenureFiles.length}/5 tenure files present — gaps below may just be missing files)`)
for (const school of inScope) {
  const rows = tenures.filter((t) => t.school === school)
  if (!rows.length) { if (covered) fail(`${school}: no tenure rows at all`); continue }
  for (let season = 1990; season <= CURRENT_SEASON; season++) {
    if (school === 'South Florida' && season < 1997) continue // program founded 1997
    if (!rows.some((t) => season >= t.start_season && (t.end_season == null || season <= t.end_season)))
      fail(`${school} ${season}: no tenure covers this season`)
  }
}
console.log('  (school-season pass complete)')

// 2. Attribution health from the last build-records run.
console.log('\n== 2. Attribution ==')
if (records.conflicted.length) fail(`${records.conflicted.length} games match 2+ tenures with no dated tiebreak`)
else console.log('  no unresolved multi-tenure games')

// 3. Name-variant splits: same surname, same school, different full names.
console.log('\n== 3. Name-variant suspects ==')
const bySchoolSurname = new Map()
for (const t of tenures) {
  const surname = t.coach.split(' ').at(-1)
  const key = `${t.school}|${surname}`
  bySchoolSurname.set(key, (bySchoolSurname.get(key) ?? new Set()).add(t.coach))
}
let suspects = 0
for (const [key, names] of bySchoolSurname) if (names.size > 1) {
  console.log(`  suspect: ${key.split('|')[0]} — ${[...names].join(' vs ')}`)
  suspects++
}
if (!suspects) console.log('  none')

// 4. Known-answer check: Kiffin 1-8 road vs top-10 (per ESPN graphic, through 2025).
console.log('\n== 4. Kiffin check ==')
const kiffin = records.records.find((r) => /Lane Kiffin/.test(r.coach))
if (!kiffin) fail('Lane Kiffin missing from records')
else {
  const { w, l } = kiffin.top10
  console.log(`  Lane Kiffin road vs top-10: ${w}-${l} (${kiffin.schools.join(', ')})`)
  if (!(w === 1 && l === 8)) fail(`expected 1-8 per ESPN graphic; got ${w}-${l} — document each differing game before shipping`)
}

// 5. Candidate games at in-scope schools with no coach (subset of unmatched).
console.log('\n== 5. Unattributed games at in-scope schools ==')
const unmatched = JSON.parse(readFileSync('data/research/unmatched-games.json', 'utf8'))
const inScopeUnmatched = unmatched.filter((g) => g.season >= 1990 && inScope.includes(g.away_team))
if (inScopeUnmatched.length) {
  fail(`${inScopeUnmatched.length} qualifying games at in-scope schools have no coach`)
  for (const g of inScopeUnmatched.slice(0, 10)) console.log(`    ${g.date} ${g.away_team} at #${g.home_rank_ap} ${g.home_team}`)
} else console.log('  none')

// 5b. Boundary adjacency: tenure boundary dates sourced from cfbfastR CSVs are
// UTC while the pipeline shifts game dates -8h, so a qualifying game within a
// day of a dated boundary can sit on the wrong side. Print them for eyeballing.
console.log('\n== 5b. Games within 1 day of a tenure boundary ==')
const DAY = 86400000
let nearBoundary = 0
for (const g of candidates.games) {
  const gd = Date.parse(g.date)
  for (const t of tenures) {
    if (t.school !== g.away_team) continue
    for (const b of [t.start_date, t.end_date]) {
      if (!b) continue
      const diff = Math.abs(Date.parse(b) - gd)
      if (diff > 0 && diff <= DAY) {
        console.log(`  check: ${g.date} ${g.away_team} at #${g.home_rank_ap} ${g.home_team} — 1 day from ${t.coach} boundary ${b} [${t.file}]`)
        nearBoundary++
      }
    }
  }
}
if (!nearBoundary) console.log('  none')

// 5c. Receipts: every displayed top-10 game should carry a confirmed SR
// receipt; a discrepancy-status receipt on a still-included game means the
// fleet flagged something nobody triaged into game-corrections or
// rank-disputes.md.
console.log('\n== 5c. Receipts ==')
{
  const recs = JSON.parse(readFileSync('data/records.json', 'utf8'))
  let top10 = 0, receipted = 0, resolvedRank = 0
  const flagged = []
  for (const c of recs.records) for (const g of c.games) {
    if (g.home_rank_ap > 10 || g.season < 1990) continue // pre-1990 receipts: section 7
    top10++
    if (g.receipt?.status === 'confirmed') receipted++
    else if (g.receipt?.status === 'resolved-rank') resolvedRank++
    else if (g.receipt?.status === 'discrepancy') flagged.push(`${g.date} ${g.away_team} at ${g.home_team}`)
  }
  if (resolvedRank) console.log(`  ${resolvedRank} rank-dispute games kept without a displayed receipt (see rank-disputes.md)`)
  console.log(`  ${receipted}/${top10} top-10 games since 1990 carry a confirmed SR receipt (${(100*receipted/top10).toFixed(1)}%)`)
  if (flagged.length) { fail(`${flagged.length} included games have untriaged discrepancy receipts`); for (const f of flagged.slice(0, 10)) console.log('   ', f) }
  else console.log('  no untriaged discrepancy receipts on included games')
}

// 6. Receipt integrity is checked by the verification fleet per row; here just count grades.
console.log('\n== 6. Evidence grades ==')
const grades = {}
for (const t of tenures) grades[t.grade] = (grades[t.grade] ?? 0) + 1
console.log(' ', JSON.stringify(grades))

// 7. The 1936 backfill (specs/back-to-1936.spec.md). Pre-1990 games are
// attributed from data/coach-stints.json, scoped by rules.json pre_1990_power.
console.log('\n== 7. 1936-1989 ==')
{
  const stintDoc = JSON.parse(readFileSync('data/coach-stints.json', 'utf8'))
  const power = stintDoc.power_seasons_pre_1990
  const gaps = JSON.parse(readFileSync('data/research/coach-gaps-pre-1990.json', 'utf8')).games
  const gapKey = (g) => `${g.date}|${g.away_team}`
  const known = new Set(gaps.map(gapKey))
  const inPower = (g) => (power[g.away_team] ?? []).some(([a, b]) => g.season >= a && g.season <= b)
  const pre = unmatched.filter((g) => g.season < 1990)
  const powerGaps = pre.filter(inPower)
  const fresh = powerGaps.filter((g) => !known.has(gapKey(g)))
  const stale = gaps.filter((g) => !powerGaps.some((x) => gapKey(x) === gapKey(g)))
  console.log(`  ${pre.length} pre-1990 qualifying games have no scoped coach; ${powerGaps.length} of them in a power school-season (${gaps.length} triaged in coach-gaps-pre-1990.json)`)
  if (fresh.length) { fail(`${fresh.length} untriaged pre-1990 power-season games have no coach`); for (const g of fresh.slice(0, 10)) console.log(`    ${g.date} ${g.away_team} at #${g.home_rank_ap} ${g.home_team}`) }
  if (stale.length) { fail(`${stale.length} coach-gaps entries no longer match a gap; drop them`); for (const g of stale.slice(0, 10)) console.log(`    ${g.date} ${g.away_team}`) }

  // Every pre-1990 game on the board carries its two receipts (Howell's row,
  // the host's poll row); check-receipts.mjs string-checks them.
  let preGames = 0, twoReceipts = 0
  for (const c of records.records) for (const g of c.games) {
    if (g.season >= 1990) continue
    preGames++
    if ((g.receipts ?? []).filter((r) => r.url && r.quote).length === 2) twoReceipts++
  }
  console.log(`  ${twoReceipts}/${preGames} pre-1990 games on the board carry a Howell receipt and a poll receipt`)
  if (twoReceipts !== preGames) fail(`${preGames - twoReceipts} pre-1990 games are missing a receipt`)

  // Floors. Before 1950 the first poll came in mid-October, so earlier games
  // have no rank in effect: unknown, not unranked.
  const prePoll = candidates.pre_poll ?? []
  console.log(`  floor: ${prePoll.length} road games at a team ranked in its season's first poll were played before that poll (1936-49; ${prePoll.filter((g) => g.first_poll_rank <= 10).length} at a first-poll top 10); they can't count`)
  console.log('  floor: the AP ranked 20 teams before 1989 and 10 in 1961-67, so the top-25 cut is a top-20 (or top-10) cut in those seasons')

  // Known answers: famous road games against a top-10 team, each checked by
  // hand against Howell and the CPA poll before it went in here.
  const GATES = [
    { date: '1966-11-19', away: 'Notre Dame', home: 'Michigan State', rank: 2, result: 'T', score: '10-10', coach: 'Ara Parseghian' },
    { date: '1969-12-06', away: 'Texas', home: 'Arkansas', rank: 2, result: 'W', score: '15-14', coach: 'Darrell Royal' },
    { date: '1971-11-25', away: 'Nebraska', home: 'Oklahoma', rank: 2, result: 'W', score: '35-31', coach: 'Bob Devaney' },
  ]
  for (const k of GATES) {
    const hit = records.records.flatMap((c) => c.games.map((g) => ({ ...g, coach: c.coach }))).find((g) => g.date === k.date && g.away_team === k.away)
    const got = hit && `${hit.away_team} at #${hit.home_rank_ap} ${hit.home_team} ${hit.result} ${hit.away_points}-${hit.home_points} (${hit.coach})`
    const want = `${k.away} at #${k.rank} ${k.home} ${k.result} ${k.score} (${k.coach})`
    if (got === want) console.log(`  known answer ok: ${k.date} ${want}`)
    else fail(`known answer ${k.date}: want ${want}, got ${got ?? 'nothing'}`)
  }

  // Name splits across the two coach sources: a stint coach and a researched
  // coach with one surname and first initial. Same person -> coach-aliases.json.
  const key = (n) => { const p = n.replace(/\./g, '').split(/\s+/); return `${p.at(-1).toLowerCase()}|${p[0][0].toLowerCase()}` }
  const researchedNames = new Set(tenures.map((t) => t.coach))
  const byKey = new Map()
  for (const n of researchedNames) byKey.set(key(n), [...(byKey.get(key(n)) ?? []), n])
  const KNOWN_DIFFERENT = new Set(['Biff Jones', 'Bud Davis', 'D.C. Walker', 'Tony Mason'])
  const splits = [...new Set(stintDoc.rows.filter((r) => r.scoped).map((r) => r.coach))]
    .filter((n) => !researchedNames.has(n) && !KNOWN_DIFFERENT.has(n) && byKey.has(key(n)))
  if (splits.length) { fail(`${splits.length} possible coach-name splits between the stints and the research`); for (const n of splits) console.log(`    ${n} vs ${byKey.get(key(n)).join(' / ')}`) }
  else console.log('  no coach-name splits between the stints and the research (4 checked by hand as different people)')
}

console.log(`\n${failures} failure(s) across ${tenureFiles.length} tenure files, ${tenures.length} tenure rows, ${candidates.count} candidate games.`)
process.exit(failures ? 1 : 0)
