#!/usr/bin/env node
// The in-season data refresh, the runbook in CLAUDE.md as one command. Drops
// the newest season's two cached source files so they download again, then
// rebuilds the ledger from the sources: fetch the schedules and the polls,
// join them (build-candidates), attribute each game to its coach
// (build-records), fill ESPN's overtime counts for the new game ids, and
// build the records again so ot.json reaches the payload. Ends with the
// per-season report. The deploy workflow runs it every Sunday in season;
// by hand: node scripts/refresh.mjs
//
// Needs data/raw/ to reach 1936 (fetch-data.mjs fills whatever is missing,
// about 15 minutes from empty). Any step that fails stops the run with its
// exit code, and the committed payload is what builds.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RAW = path.join(ROOT, 'data/raw')

// The newest season in the cache is the one in progress: its schedule CSV
// and poll index page grow through the season, so they are fetched fresh.
const newest = (dir, re) => {
  if (!fs.existsSync(dir)) return null
  const years = fs.readdirSync(dir).map((f) => f.match(re)?.[1]).filter(Boolean).map(Number)
  return years.length ? Math.max(...years) : null
}
const csvYear = newest(path.join(RAW, 'cfbfastr'), /^cfb_schedules_(\d{4})\.csv$/)
const pollYear = newest(path.join(RAW, 'ap-polls'), /^season-(\d{4})\.html$/)
for (const f of [csvYear && `cfbfastr/cfb_schedules_${csvYear}.csv`, pollYear && `ap-polls/season-${pollYear}.html`]) {
  if (f) { fs.rmSync(path.join(RAW, f), { force: true }); console.log(`refresh: dropped data/raw/${f}`) }
}

const steps = [
  ['fetch-data.mjs', '--only=games'],
  ['fetch-data.mjs', '--only=polls'],
  ['fetch-data.mjs', '--only=jhowell'], // cached; only a cold data/raw downloads
  ['build-candidates.mjs'],
  ['build-records.mjs'],
  ['fetch-ot.mjs'],
  ['build-records.mjs'],
  ['candidate-stats.mjs'],
]
for (const [script, ...args] of steps) {
  console.log(`\nrefresh: node scripts/${script} ${args.join(' ')}`.trimEnd())
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', script), ...args], { cwd: ROOT, stdio: 'inherit' })
}
console.log('\nrefresh: done')
