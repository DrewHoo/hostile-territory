#!/usr/bin/env node
/**
 * candidate-stats.mjs — sanity report over data/games-candidates.json.
 *
 * Prints per-season counts of qualifying games (top-25 and top-10 cuts) and
 * flags seasons that look wrong: zero games, or more than 2x the median. The
 * 1990-2000 / 2001-2025 source seam is the expected failure point, so the
 * report also prints the two eras' medians side by side.
 *
 *   node scripts/candidate-stats.mjs
 *   node scripts/candidate-stats.mjs --team "Ole Miss"   # one away team's rows
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib/util.mjs';

const argv = process.argv.slice(2);
const teamArg = (() => {
  const i = argv.indexOf('--team');
  return i >= 0 ? argv[i + 1] : null;
})();

const doc = JSON.parse(
  fs.readFileSync(path.join(ROOT, 'data', 'games-candidates.json'), 'utf8')
);
const games = doc.games;

function median(nums) {
  const s = [...nums].sort((a, b) => a - b);
  if (!s.length) return 0;
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

const seasons = [...new Set(games.map((g) => g.season))].sort((a, b) => a - b);
const first = Math.min(...seasons);
const last = Math.max(...seasons);

const rowsBySeason = new Map();
for (const g of games) {
  if (!rowsBySeason.has(g.season)) rowsBySeason.set(g.season, []);
  rowsBySeason.get(g.season).push(g);
}

const allSeasons = [];
for (let s = 1990; s <= last; s++) allSeasons.push(s);

const stat = allSeasons.map((season) => {
  const rows = rowsBySeason.get(season) ?? [];
  const top10 = rows.filter((r) => r.home_rank_ap <= 10);
  const sources = [...new Set(rows.map((r) => r.source))].join('+') || '-';
  const w = top10.filter((r) => r.result === 'W').length;
  const l = top10.filter((r) => r.result === 'L').length;
  const t = top10.filter((r) => r.result === 'T').length;
  return { season, source: sources, top25: rows.length, top10: top10.length, w, l, t };
});

const med25 = median(stat.filter((s) => s.top25 > 0).map((s) => s.top25));
const med10 = median(stat.filter((s) => s.top25 > 0).map((s) => s.top10));

console.log(`data/games-candidates.json — ${games.length} rows, seasons ${first}-${last}`);
console.log(`median per season: top-25 ${med25}, top-10 ${med10}\n`);
console.log('season  source     top25  top10   top10 W-L-T   flag');
const flagged = [];
for (const s of stat) {
  const flags = [];
  if (s.top25 === 0) flags.push('ZERO');
  else if (s.top25 > 2 * med25) flags.push(`>2x median (${med25})`);
  if (s.top25 > 0 && s.top10 === 0) flags.push('ZERO top-10');
  if (flags.length) flagged.push(s.season);
  console.log(
    `${s.season}    ${s.source.padEnd(10)} ${String(s.top25).padStart(5)}  ${String(
      s.top10
    ).padStart(5)}   ${`${s.w}-${s.l}-${s.t}`.padEnd(12)}  ${flags.join('; ')}`
  );
}

// Era comparison across the source seam.
const era = (lo, hi) => {
  const rows = stat.filter((s) => s.season >= lo && s.season <= hi && s.top25 > 0);
  return {
    seasons: rows.length,
    median25: median(rows.map((r) => r.top25)),
    median10: median(rows.map((r) => r.top10)),
    total25: rows.reduce((n, r) => n + r.top25, 0),
  };
};
const early = era(1990, 2000);
const late = era(2001, last);
console.log('\nsource seam');
console.log(`  1990-2000 (jhowell):  ${early.seasons} seasons, median top-25 ${early.median25}, top-10 ${early.median10}, total ${early.total25}`);
console.log(`  2001-${last} (cfbfastR): ${late.seasons} seasons, median top-25 ${late.median25}, top-10 ${late.median10}, total ${late.total25}`);
const ratio = late.median25 ? (early.median25 / late.median25).toFixed(2) : 'n/a';
console.log(`  early/late median ratio: ${ratio}${Math.abs(ratio - 1) > 0.25 ? '   <-- SEAM LOOKS WRONG' : ''}`);

// Distribution checks that catch a broken poll join.
const byRank = new Array(26).fill(0);
for (const g of games) byRank[g.home_rank_ap]++;
console.log('\nhome rank distribution (1..25)');
console.log('  ' + byRank.slice(1).map((n, i) => `${i + 1}:${n}`).join('  '));

const awayRanked = games.filter((g) => g.away_rank_ap != null).length;
console.log(`\nranked visitor in ${awayRanked} of ${games.length} rows (${((100 * awayRanked) / games.length).toFixed(1)}%)`);

const pollLabels = new Map();
for (const g of games) pollLabels.set(g.poll_label, (pollLabels.get(g.poll_label) ?? 0) + 1);
const preseason = [...pollLabels].filter(([l]) => /preseason/i.test(l)).reduce((n, [, c]) => n + c, 0);
const final = [...pollLabels].filter(([l]) => /final/i.test(l)).reduce((n, [, c]) => n + c, 0);
console.log(`poll in effect: ${preseason} rows on a preseason poll, ${final} on a Final poll (Final should be 0)`);

const postseason = games.filter((g) => g.season_type === 'postseason').length;
console.log(`postseason rows: ${postseason} (bowls are neutral; CFP campus games are legitimately here)`);

// ------------------------------------------------------- Kiffin cross-check
// A known-answer test, not a target: an ESPN graphic put Lane Kiffin at 1-8 in
// true road games against AP top-10 teams. Tenures are season ranges only --
// the real tenure table (phase 2) carries exact mid-season dates, and Kiffin's
// 2013 USC firing (Sept 29, 2013) is the one seam that matters here.
// Two cuts, because the tenure end date is exactly what's in dispute: the
// research brief wrote Ole Miss 2020-24, but Kiffin coached Ole Miss through
// the 2025 season, and the 2025 season is what closes the gap to the graphic.
const KIFFIN_CUTS = {
  'brief as written (Ole Miss 2020-24)': [
    { team: 'Tennessee', from: 2009, to: 2009 },
    { team: 'USC', from: 2010, to: 2013 },
    { team: 'Florida Atlantic', from: 2017, to: 2019 },
    { team: 'Ole Miss', from: 2020, to: 2024 },
  ],
  'Ole Miss through 2025': [
    { team: 'Tennessee', from: 2009, to: 2009 },
    { team: 'USC', from: 2010, to: 2013 },
    { team: 'Florida Atlantic', from: 2017, to: 2019 },
    { team: 'Ole Miss', from: 2020, to: 2025 },
  ],
};
if (argv.includes('--kiffin')) {
  for (const [name, tenures] of Object.entries(KIFFIN_CUTS)) {
    console.log(`\n--- cross-check: Lane Kiffin, true road games vs AP top-10 -- ${name}`);
    const rows = games.filter(
      (g) =>
        g.home_rank_ap <= 10 &&
        tenures.some((k) => g.away_team === k.team && g.season >= k.from && g.season <= k.to)
    );
    for (const r of rows) {
      console.log(
        `  ${r.date}  ${r.away_team.padEnd(16)} at #${String(r.home_rank_ap).padStart(2)} ${r.home_team.padEnd(16)} ${r.result} ${r.away_points}-${r.home_points}`
      );
    }
    const w = rows.filter((r) => r.result === 'W').length;
    const l = rows.filter((r) => r.result === 'L').length;
    const t = rows.filter((r) => r.result === 'T').length;
    console.log(`  ${rows.length} games, ${w}-${l}${t ? `-${t}` : ''}  (ESPN graphic: 9 games, 1-8)`);
  }
  console.log('\n  Kiffin road games vs AP top-25 (the wider cut, for the audit trail)');
  const wide = games.filter(
    (g) =>
      KIFFIN_CUTS['Ole Miss through 2025'].some(
        (k) => g.away_team === k.team && g.season >= k.from && g.season <= k.to
      )
  );
  for (const r of wide) {
    console.log(
      `  ${r.date}  ${r.away_team.padEnd(16)} at #${String(r.home_rank_ap).padStart(2)} ${r.home_team.padEnd(16)} ${r.result} ${r.away_points}-${r.home_points}  poll ${r.poll_date}`
    );
  }
}

if (teamArg) {
  console.log(`\n--- ${teamArg} as the visitor`);
  const rows = games.filter((g) => g.away_team === teamArg);
  for (const r of rows) {
    console.log(
      `  ${r.date}  #${String(r.home_rank_ap).padStart(2)} ${r.home_team.padEnd(18)} ${r.result} ${r.away_points}-${r.home_points}  [${r.source}]`
    );
  }
  console.log(`  ${rows.length} rows, ${rows.filter((r) => r.home_rank_ap <= 10).length} vs top-10`);
}

if (flagged.length) {
  console.log(`\nFLAGGED SEASONS: ${flagged.join(', ')}`);
  process.exitCode = 0; // report-only; the pipeline still succeeds
} else {
  console.log('\nno seasons flagged');
}
