// Overtime counts for matched games, from ESPN's public summary API (the
// game_id in cfbfastR rows is ESPN's event id). Resumable: already-fetched
// ids are skipped, so rerunning after a failure only fills the holes.
// Pre-2001 games have no game_id; pre-1996 college football had no OT rule.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const OUT = 'data/ot.json'
const records = JSON.parse(readFileSync('data/records.json', 'utf8'))
const ot = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {}

const ids = [...new Set(records.records.flatMap((r) => r.games.map((g) => g.game_id).filter(Boolean)))]
const todo = ids.filter((id) => !(id in ot))
console.log(`${ids.length} games with ESPN ids, ${todo.length} to fetch`)

let done = 0, errors = 0
for (const id of todo) {
  try {
    const res = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/college-football/summary?event=${id}`)
    if (!res.ok) throw new Error(`http ${res.status}`)
    const j = await res.json()
    const detail = j.header?.competitions?.[0]?.status?.type?.shortDetail ?? ''
    const m = detail.match(/Final\/(\d*)\s*OT/i)
    ot[id] = m ? (m[1] ? Number(m[1]) : 1) : 0
  } catch (e) {
    errors++
    if (errors > 50) { console.error('too many errors, stopping'); break }
  }
  done++
  if (done % 200 === 0) { writeFileSync(OUT, JSON.stringify(ot)); console.log(`${done}/${todo.length} (${errors} errors)`) }
  await new Promise((r) => setTimeout(r, 300))
}
writeFileSync(OUT, JSON.stringify(ot))
const otGames = Object.values(ot).filter(Boolean).length
console.log(`done: ${Object.keys(ot).length} fetched, ${otGames} OT games, ${errors} errors`)
