#!/usr/bin/env node
/**
 * fetch-data.mjs — download every bulk source the candidate pipeline needs into
 * data/raw/ (gitignored). Idempotent: an existing non-empty file is left alone
 * unless --force. Sequential, one request at a time, with a per-host delay.
 *
 *   node scripts/fetch-data.mjs                 # everything, cached
 *   node scripts/fetch-data.mjs --force         # re-download everything
 *   node scripts/fetch-data.mjs --only=polls    # games | jhowell | polls
 *
 * Sources (see data/research/sources.md for the why):
 *   games 2001-2025  cfbfastR-data schedules CSVs on raw.githubusercontent.com
 *   games 1990-2000  jhowell.net per-team historical score files
 *   AP polls 1990-2025 collegepollarchive.com weekly poll pages
 */

import fs from 'node:fs';
import path from 'node:path';
import { RAW, ensureDir, sleep, cellText, decodeEntities } from './lib/util.mjs';

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const ONLY = (args.find((a) => a.startsWith('--only=')) || '').split('=')[1] || null;

const CFB_FIRST = 2001;
const CFB_LAST = 2025;
const POLL_FIRST = 1990;
const POLL_LAST = 2025;
const JH_FIRST = 1990;
const JH_LAST = 2000;

const UA =
  'hostile-territory-research/1.0 (personal research project; contact via github.com/DrewHoo)';

const DELAY = { 'raw.githubusercontent.com': 150, 'www.jhowell.net': 600, 'www.collegepollarchive.com': 700 };
const lastHit = new Map();

async function polite(url) {
  const host = new URL(url).hostname;
  const wait = DELAY[host] ?? 500;
  const since = Date.now() - (lastHit.get(host) ?? 0);
  if (since < wait) await sleep(wait - since);
  lastHit.set(host, Date.now());
}

// Bytes go to disk untouched. cfbfastR CSVs are UTF-8; jhowell is windows-1252.
// Each reader picks its own encoding, so nothing is transcoded twice.
async function get(url) {
  await polite(url);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' });
      if (res.status === 404) return { status: 404, body: null };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return { status: res.status, body: Buffer.from(await res.arrayBuffer()) };
    } catch (err) {
      if (attempt === 3) throw err;
      await sleep(1000 * attempt);
    }
  }
}

async function download(url, file) {
  if (!FORCE && fs.existsSync(file) && fs.statSync(file).size > 0) {
    return { cached: true, bytes: fs.statSync(file).size };
  }
  const { status, body } = await get(url);
  if (status === 404) return { missing: true, bytes: 0 };
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, body);
  return { cached: false, bytes: body.length };
}

const log = (...a) => console.log(...a);

// ---------------------------------------------------------------- cfbfastR

async function fetchCfbfastr() {
  const dir = path.join(RAW, 'cfbfastr');
  const manifest = [];
  for (let year = CFB_FIRST; year <= CFB_LAST; year++) {
    const url = `https://raw.githubusercontent.com/sportsdataverse/cfbfastR-data/main/schedules/csv/cfb_schedules_${year}.csv`;
    const file = path.join(dir, `cfb_schedules_${year}.csv`);
    const r = await download(url, file);
    if (r.missing) {
      log(`  cfbfastR ${year}: MISSING (404)`);
      manifest.push({ year, url, ok: false });
      continue;
    }
    const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).length - 1;
    log(`  cfbfastR ${year}: ${lines} games${r.cached ? ' (cached)' : ''}`);
    manifest.push({ year, url, ok: true, rows: lines });
  }
  fs.writeFileSync(path.join(dir, '_manifest.json'), JSON.stringify(manifest, null, 2));
}

// ----------------------------------------------------------------- jhowell

/** Parse byname.htm into {file, name, spans:[[start,end]]}. */
export function parseJhowellIndex(html) {
  const out = [];
  // Filenames use letters, digits, hyphens and parentheses: "Miami(Florida).htm".
  const re = /<a\s+href="([A-Za-z0-9()_.'-]+\.htm)"[^>]*>([^<]+)<\/a>/gi;
  let m;
  while ((m = re.exec(html))) {
    const file = m[1];
    if (/ScoresIndex|notes|byname|byconf|Sked/i.test(file)) continue;
    const label = decodeEntities(m[2]).trim();
    const nm = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(label);
    if (!nm) continue;
    const name = nm[1].trim();
    const spans = [];
    for (const part of nm[2].split(',')) {
      const p = part.trim();
      const r = /^(\d{4})(?:-(\d{4}|present))?$/.exec(p);
      if (!r) continue;
      const start = Number(r[1]);
      const end = !r[2] ? start : r[2] === 'present' ? 9999 : Number(r[2]);
      spans.push([start, end]);
    }
    if (spans.length) out.push({ file, name, spans });
  }
  return out;
}

async function fetchJhowell() {
  const dir = path.join(RAW, 'jhowell');
  ensureDir(dir);
  const idxFile = path.join(dir, 'byname.htm');
  await download('https://www.jhowell.net/cf/scores/byname.htm', idxFile);
  const teams = parseJhowellIndex(fs.readFileSync(idxFile, 'latin1'));
  const wanted = teams.filter((t) =>
    t.spans.some(([s, e]) => s <= JH_LAST && e >= JH_FIRST)
  );
  log(`  jhowell index: ${teams.length} team files, ${wanted.length} overlap ${JH_FIRST}-${JH_LAST}`);
  const manifest = [];
  let i = 0;
  for (const t of wanted) {
    const file = path.join(dir, 'teams', t.file);
    const r = await download(`https://www.jhowell.net/cf/scores/${t.file}`, file);
    manifest.push({ ...t, bytes: r.bytes, missing: !!r.missing });
    i++;
    if (i % 25 === 0) log(`    …${i}/${wanted.length}`);
  }
  fs.writeFileSync(path.join(dir, '_manifest.json'), JSON.stringify(manifest, null, 2));
  log(`  jhowell: ${manifest.filter((m) => !m.missing).length} team files on disk`);
}

// ------------------------------------------------------------------- polls

/** Pull the appollid <select> (id -> label) out of a season page. */
export function parsePollOptions(html) {
  const sel = /<select[^>]*name="appollid"[^>]*>([\s\S]*?)<\/select>/i.exec(html);
  if (!sel) return [];
  const out = [];
  const re = /<option[^>]*value="(\d+)"[^>]*>([\s\S]*?)<\/option>/gi;
  let m;
  while ((m = re.exec(sel[1]))) out.push({ id: m[1], label: cellText(m[2]) });
  return out;
}

async function fetchPolls() {
  const dir = path.join(RAW, 'ap-polls');
  ensureDir(dir);
  const manifest = [];
  for (let year = POLL_FIRST; year <= POLL_LAST; year++) {
    const seasonFile = path.join(dir, `season-${year}.html`);
    await download(
      `https://www.collegepollarchive.com/football/ap/seasons.cfm?seasonid=${year}`,
      seasonFile
    );
    const opts = parsePollOptions(fs.readFileSync(seasonFile, 'latin1'));
    if (!opts.length) {
      log(`  AP ${year}: NO POLL OPTIONS FOUND`);
      manifest.push({ year, polls: [] });
      continue;
    }
    const polls = [];
    for (const o of opts) {
      const file = path.join(dir, 'polls', `poll-${o.id}.html`);
      await download(
        `https://www.collegepollarchive.com/football/ap/seasons.cfm?appollid=${o.id}`,
        file
      );
      polls.push(o);
    }
    log(`  AP ${year}: ${polls.length} polls (${polls[0].label} … ${polls[polls.length - 1].label})`);
    manifest.push({ year, polls });
  }
  fs.writeFileSync(path.join(dir, '_manifest.json'), JSON.stringify(manifest, null, 2));
}

// --------------------------------------------------------------------- run

async function main() {
  ensureDir(RAW);
  const t0 = Date.now();
  if (!ONLY || ONLY === 'games') {
    log(`cfbfastR schedules ${CFB_FIRST}-${CFB_LAST}`);
    await fetchCfbfastr();
  }
  if (!ONLY || ONLY === 'jhowell') {
    log(`jhowell.net team score files (for ${JH_FIRST}-${JH_LAST})`);
    await fetchJhowell();
  }
  if (!ONLY || ONLY === 'polls') {
    log(`collegepollarchive AP polls ${POLL_FIRST}-${POLL_LAST}`);
    await fetchPolls();
  }
  log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
