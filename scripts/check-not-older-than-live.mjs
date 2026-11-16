#!/usr/bin/env node
// The deploy's last check, after the build: the data about to ship holds
// everything the live site's does. It fails when this data is dated before
// the live site's or has fewer games: a branch merged with the data it was
// cut with, a refresh that built short. Once the site has a week, no deploy
// takes it back (2026-11-16: a refresh that couldn't fetch built the
// committed data instead and put the board back nine days, green).
//
// To ship older data on purpose, put "[older data]" in the commit message
// (the workflow sets ALLOW_OLDER_DATA from it). A live site that can't be
// read isn't checked: the committed data is still the newest main has.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LIVE = 'https://drewhoover.com/hostile-territory/data.json'

const mine = JSON.parse(fs.readFileSync(path.join(ROOT, 'dist/data.json'), 'utf8'))
let live
try {
  const res = await fetch(`${LIVE}?t=${Date.now()}`, { headers: { 'user-agent': 'hostile-territory build (drewhoover.com)' } })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  live = await res.json()
} catch (e) {
  console.log(`not checked: the live site's data.json couldn't be read (${e.message})`)
  process.exit(0)
}

const older = []
if (mine.generated < live.generated) older.push(`it is dated ${mine.generated}, before the live site's ${live.generated}`)
if (mine.games < live.games) older.push(`it has ${mine.games} games, and the live site has ${live.games}`)
if (!older.length) {
  console.log(`the data (${mine.generated}, ${mine.games} games) is no older than the live site's (${live.generated}, ${live.games})`)
  process.exit(0)
}
console.error(`This build would take the live site back: ${older.join('; ')}.`)
if (process.env.ALLOW_OLDER_DATA) {
  console.error('Shipping it anyway: the commit says [older data].')
  process.exit(0)
}
console.error('Pull main and run node scripts/refresh.mjs, or put "[older data]" in the commit message to ship it on purpose.')
process.exit(1)
