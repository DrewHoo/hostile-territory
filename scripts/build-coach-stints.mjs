#!/usr/bin/env node
// Coach attribution for the seasons the researched tenure files don't cover:
// every major-college head-coaching stint 1936-1989, and the 1990+ stints of
// coaches who are in scope only through their pre-1990 careers. Writes
// data/coach-stints.json, which build-records.mjs reads.
//
//   CSK_DIR=../cfb-streak-king node scripts/build-coach-stints.mjs
//
// The stints are cfb-streak-king's: CFBD /coaches season rows resolved
// against Howell's results as W-L prefixes (that repo's scripts/lib/coach.mjs),
// with its researched coach-overrides.json ruling every season CFBD can't
// resolve. This script reads that repo's committed payload-base.json and
// data/ref/coach-overrides.json; it never reads its raw caches.
//
// The scope rule is data/rules.json pre_1990_power. A row is `scoped` when its
// coach has a tenure overlapping a power school-season in either era; only
// scoped rows carry a record, unscoped ones name the home coach in a popover.

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/util.mjs';
import { display } from './build-candidates.mjs';

const CSK = path.resolve(process.env.CSK_DIR ?? path.join(ROOT, '..', 'cfb-streak-king'));
const payloadFile = path.join(CSK, 'data', 'payload-base.json');
if (!fs.existsSync(payloadFile)) {
  console.error(`no cfb-streak-king checkout at ${CSK} (set CSK_DIR)`);
  process.exit(1);
}
const P = JSON.parse(fs.readFileSync(payloadFile, 'utf8'));
const overrides = JSON.parse(fs.readFileSync(path.join(CSK, 'data', 'ref', 'coach-overrides.json'), 'utf8'));
const rules = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rules.json'), 'utf8'));
const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), 'utf8'));

const SEAM = 1990; // researched tenures own 1990+
const LAST = P.lastBaseSeason;

// Coach names: researched spellings win; data/coach-aliases.json maps a CFBD
// spelling onto them (canonical -> [variants]).
let coachAliases = {};
try { coachAliases = read('data/coach-aliases.json').aliases ?? {}; } catch {}
const coachCanon = new Map();
for (const [canon, variants] of Object.entries(coachAliases)) for (const v of variants) coachCanon.set(v, canon);
const canonCoach = (n) => coachCanon.get(n) ?? n;

const researchDir = path.join(ROOT, 'data', 'research');
const researched = fs.readdirSync(researchDir)
  .filter((f) => /^tenures-.*\.json$/.test(f))
  .flatMap((f) => read(`data/research/${f}`).map((t) => ({ ...t, coach: canonCoach(t.coach) })));
const researchedNames = new Set(researched.map((t) => t.coach));
const researchedCovers = (school, season) =>
  researched.some((t) => t.school === school && season >= (t.start_season ?? -Infinity) && (t.end_season == null || season <= t.end_season));

// ---- the games, for turning a stint's first-game ordinal into a date
const G = P.games;
const epsBy = new Map(); // `${ti}|${se}` -> [ep, ...] in ep order
for (let i = 0; i < G.se.length; i++) {
  for (const ti of [G.hi[i], G.ai[i]]) {
    const k = `${ti}|${G.se[i]}`;
    const a = epsBy.get(k);
    if (a) a.push(G.ep[i]);
    else epsBy.set(k, [G.ep[i]]);
  }
}
for (const a of epsBy.values()) a.sort((x, y) => x - y);
const isoOf = (ep) => new Date(ep * 86400000).toISOString().slice(0, 10);
const dayBefore = (iso) => new Date(Date.parse(iso + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);

// ---- the scope rule
const PRE = rules.pre_1990_power;
const listed = new Set(Object.values(rules.school_assignments).flat());
function confOf(team, season) {
  for (const [s, e, ci] of team.conf ?? []) if (s <= season && season <= e) return P.confs[ci];
  return null;
}
function powerSeason(team, season) {
  const conf = confOf(team, season);
  const span = PRE.conferences[conf];
  if (span) return season >= span[0] && season <= span[1];
  return conf === 'Independent' && listed.has(display(team.id));
}

// ---- stints, one per (team, coach run); a stint runs until the next starts
const overrideReceipts = (teamId, from, to) => {
  const out = [];
  for (let y = from; y <= to; y++) {
    const o = overrides[`${teamId}|${y}`];
    if (o?.receipts) for (const r of o.receipts) out.push({ ...r, note: `${y}: ${r.note ?? o.note ?? 'coach-overrides ruling'}` });
  }
  return out;
};
const DATASET_RECEIPT = {
  sources: ['cfbd-coaches', 'howell'],
  note: "CFBD /coaches season rows resolved against Howell's results as a W-L prefix, in cfb-streak-king (scripts/lib/coach.mjs, data/payload-base.json).",
};

const stints = [];
const unknownSchool = new Set();
for (const team of P.teams) {
  const hc = team.hc ?? [];
  const school = display(team.id);
  if (school === team.id && !/^[a-z]/.test(school)) unknownSchool.add(team.id);
  for (let j = 0; j < hc.length; j++) {
    const [ci, startSe, startOrd, interim] = hc[j];
    if (ci < 0) continue;
    const next = hc[j + 1];
    const start_date = startOrd > 0 ? isoOf(epsBy.get(`${P.teams.indexOf(team)}|${startSe}`)?.[startOrd] ?? NaN) : null;
    let end_season = LAST;
    let end_date = null;
    if (next) {
      if (next[2] > 0) {
        end_season = next[1];
        end_date = dayBefore(isoOf(epsBy.get(`${P.teams.indexOf(team)}|${next[1]}`)[next[2]]));
      } else end_season = next[1] - 1;
    }
    if (end_season < startSe) continue;
    // A stint runs until the next one starts, so the last coach before a run
    // of non-major seasons (Idaho, Marshall and UConn were I-AA in 1989) would
    // carry across them. Clip to the team's major-college spans.
    for (const [ms, me] of team.major ?? [[startSe, end_season]]) {
      const from = Math.max(ms, startSe);
      const to = Math.min(me, end_season);
      if (from > to) continue;
      stints.push({
        teamId: team.id,
        team,
        school,
        cfbd_id: P.coachIds[ci],
        name: canonCoach(P.coachNames[ci]),
        start_season: from,
        end_season: to,
        start_date: from === startSe ? start_date : null,
        end_date: to === end_season ? end_date : null,
        interim: !!interim,
      });
    }
  }
}

// a coach is one CFBD id; scope is per coach
const byId = new Map();
for (const s of stints) (byId.get(s.cfbd_id) ?? byId.set(s.cfbd_id, []).get(s.cfbd_id)).push(s);
const scopedIds = new Set();
const scopeReason = new Map();
for (const [id, list] of byId) {
  if (researchedNames.has(list[0].name)) { scopedIds.add(id); scopeReason.set(id, 'researched'); continue; }
  for (const s of list) {
    for (let y = s.start_season; y <= Math.min(s.end_season, SEAM - 1); y++) {
      if (powerSeason(s.team, y)) { scopedIds.add(id); scopeReason.set(id, `${s.school} ${y}`); break; }
    }
    if (scopedIds.has(id)) break;
  }
}

// Two CFBD coaches with one name would merge into one record downstream.
const idsByName = new Map();
for (const id of scopedIds) {
  const n = byId.get(id)[0].name;
  (idsByName.get(n) ?? idsByName.set(n, new Set()).get(n)).add(id);
}
const collisions = [...idsByName].filter(([, ids]) => ids.size > 1);

// ---- rows: pre-1990 for every stint, 1990+ only for coaches the research
// never covered, and only in school-seasons no researched row covers
const rows = [];
let newScopedLate = 0;
for (const s of stints) {
  const scoped = scopedIds.has(s.cfbd_id);
  const base = { school: s.school, coach: s.name, cfbd_id: s.cfbd_id, interim: s.interim, scoped, grade: 'dataset' };
  if (s.start_season < SEAM) {
    const clipped = s.end_season >= SEAM;
    const from = s.start_season;
    const to = clipped ? SEAM - 1 : s.end_season;
    const ov = overrideReceipts(s.teamId, from, to);
    rows.push({
      ...base,
      start_season: from,
      end_season: to,
      start_date: s.start_date,
      end_date: clipped ? null : s.end_date,
      receipts: [DATASET_RECEIPT, ...ov],
    });
  }
  if (!scoped || researchedNames.has(s.name) || s.end_season < SEAM) continue;
  // a pre-1990-scoped coach's 1990+ seasons, in runs no researched row covers
  let run = null;
  const flush = () => {
    if (!run) return;
    const ov = overrideReceipts(s.teamId, run.from, run.to);
    rows.push({
      ...base,
      start_season: run.from,
      end_season: run.to,
      start_date: run.from === s.start_season ? s.start_date : null,
      end_date: run.to === s.end_season ? s.end_date : null,
      receipts: [DATASET_RECEIPT, ...ov],
    });
    newScopedLate++;
    run = null;
  };
  for (let y = Math.max(SEAM, s.start_season); y <= s.end_season; y++) {
    if (researchedCovers(s.school, y)) { flush(); continue; }
    if (run) run.to = y;
    else run = { from: y, to: y };
  }
  flush();
}

// Every school's pre-1990 power seasons as [from, to] runs, for the coverage
// report: a qualifying game in one of them with no coach is a gap.
const powerSeasons = {};
for (const team of P.teams) {
  const runs = [];
  for (let y = 1936; y < SEAM; y++) {
    if (!powerSeason(team, y)) continue;
    const last = runs.at(-1);
    if (last && last[1] === y - 1) last[1] = y;
    else runs.push([y, y]);
  }
  if (runs.length) powerSeasons[display(team.id)] = runs;
}

rows.sort((a, b) => a.school.localeCompare(b.school) || a.start_season - b.start_season || (a.start_date ?? '').localeCompare(b.start_date ?? ''));

fs.writeFileSync(path.join(ROOT, 'data', 'coach-stints.json'), JSON.stringify({
  version: 1,
  updated: new Date().toISOString().slice(0, 10),
  note: "Generated by scripts/build-coach-stints.mjs; don't edit by hand. Head-coaching stints from cfb-streak-king (CFBD /coaches resolved against Howell's results, plus its researched coach-overrides.json, whose receipts ride on the rows they rule). Covers every major-college stint 1936-1989, clipped at 1989, and the 1990+ stints of coaches scoped only by their pre-1990 careers in school-seasons no researched tenure covers. build-records.mjs attributes pre-1990 games from these rows only and 1990+ games from the researched tenures first. `scoped` follows data/rules.json (pre_1990_power for 1936-1989, power_conference_eras after). grade 'dataset' marks rows from the CFBD/Howell reconciliation, not row-by-row research.",
  source: { repo: 'DrewHoo/cfb-streak-king', payload_built: P.builtAt, last_season: LAST },
  power_seasons_pre_1990: powerSeasons,
  rows,
}, null, 1) + '\n');

const scopedRows = rows.filter((r) => r.scoped);
console.log(`stints ${stints.length}; rows ${rows.length} (${scopedRows.length} scoped); coaches ${byId.size}, scoped ${scopedIds.size} (${[...scopeReason.values()].filter((v) => v === 'researched').length} researched, ${[...scopeReason.values()].filter((v) => v !== 'researched').length} by pre-1990 power seasons)`);
console.log(`1990+ rows for pre-1990-scoped coaches: ${newScopedLate}`);
if (unknownSchool.size) console.log(`!! ${unknownSchool.size} team ids with no display name: ${[...unknownSchool].slice(0, 10).join(', ')}`);
if (collisions.length) {
  console.log(`!! ${collisions.length} names shared by 2+ scoped CFBD coaches:`);
  for (const [n, ids] of collisions) console.log(`   ${n}: ${[...ids].map((id) => `${id} (${byId.get(id).map((s) => `${s.school} ${s.start_season}`).join(', ')})`).join(' | ')}`);
}

// The seam: a stint running through 1989 into 1990 should name the coach the
// research names for that school's 1990 season. A mismatch is a spelling
// split (fix in data/coach-aliases.json) or a disagreement worth a look.
const seam = [];
for (const s of stints) {
  if (!(s.start_season < SEAM && s.end_season >= SEAM)) continue;
  const r = researched.filter((t) => t.school === s.school && SEAM >= (t.start_season ?? -Infinity) && (t.end_season == null || SEAM <= t.end_season));
  if (r.length && !r.some((t) => t.coach === s.name)) seam.push(`${s.school}: CFBD ${s.name} vs researched ${r.map((t) => t.coach).join(' / ')}`);
}
console.log(`seam check (1989 -> 1990 at the same school): ${seam.length ? seam.length + ' mismatches' : 'all names agree'}`);
for (const m of seam) console.log('   ' + m);
