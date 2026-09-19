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
const inScopeUnmatched = unmatched.filter((g) => inScope.includes(g.away_team))
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

// 6. Receipt integrity is checked by the verification fleet per row; here just count grades.
console.log('\n== 6. Evidence grades ==')
const grades = {}
for (const t of tenures) grades[t.grade] = (grades[t.grade] ?? 0) + 1
console.log(' ', JSON.stringify(grades))

console.log(`\n${failures} failure(s) across ${tenureFiles.length} tenure files, ${tenures.length} tenure rows, ${candidates.count} candidate games.`)
process.exit(failures ? 1 : 0)
