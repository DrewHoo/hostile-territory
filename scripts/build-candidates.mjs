#!/usr/bin/env node
/**
 * build-candidates.mjs — join every game since the 1990 season to the AP poll
 * in effect at kickoff and emit data/games-candidates.json: TRUE ROAD games
 * (away team, not neutral) against a home team ranked in the AP top 25.
 *
 * Top-10 is a downstream filter; this file keeps the full top 25.
 *
 * Inputs (all under data/raw/, produced by scripts/fetch-data.mjs):
 *   cfbfastr/cfb_schedules_<year>.csv   2001-2025 games, has neutral_site
 *   jhowell/teams/<Team>.htm            1990-2000 games, one file per team
 *   ap-polls/polls/poll-<id>.html       weekly AP polls 1990-2025
 *
 * Name normalization goes through data/name-aliases.json. Any source name with
 * no alias entry is reported (see --unmatched) rather than silently dropped.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  ROOT,
  RAW,
  parseCsv,
  cellText,
  decodeEntities,
  stripTags,
  isoDate,
  parseLongDate,
} from './lib/util.mjs';

const REPORT_UNMATCHED = process.argv.includes('--unmatched');
const REPORT_AMBIGUOUS = process.argv.includes('--ambiguous');

// ----------------------------------------------------------- name aliases

const aliasFile = path.join(ROOT, 'data', 'name-aliases.json');
const aliasDoc = JSON.parse(fs.readFileSync(aliasFile, 'utf8'));

/** Loose fallback key: lowercase, drop punctuation and common noise words. */
export function slug(name) {
  return String(name)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '');
}

const aliasIndex = new Map();
for (const [raw, key] of Object.entries(aliasDoc.aliases)) {
  aliasIndex.set(slug(raw), key);
}
for (const key of Object.keys(aliasDoc.canonical)) aliasIndex.set(slug(key), key);

const unmatched = new Map();

export function canon(name, source) {
  if (!name) return null;
  const s = slug(name);
  const hit = aliasIndex.get(s);
  if (hit) return hit;
  const key = `${name} [${source}]`;
  unmatched.set(key, (unmatched.get(key) ?? 0) + 1);
  return null;
}

export const display = (key) => aliasDoc.canonical[key] ?? key;

// ------------------------------------------------------------- AP polls

/**
 * Parse one collegepollarchive poll page.
 * Returns { label, date, ranks: Map<canonKey, rank>, rawNames: [..] }.
 */
export function parsePollPage(html, seasonYear, label) {
  const heading =
    (/<h2[^>]*>([\s\S]*?)<\/h2>/i.exec(html)?.[1] ?? '') +
    ' ' +
    (/<title>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? '');
  let date = parseLongDate(cellText(heading));

  // Preseason polls carry no date; the Final poll lands after the bowls.
  if (!date) {
    if (/preseason/i.test(label)) date = isoDate(seasonYear, 8, 1);
    else if (/final/i.test(label)) date = isoDate(seasonYear + 1, 2, 1);
  }

  const ranks = new Map();
  const rawNames = [];
  const trRe = /<tr\b[^>]*>([\s\S]*?)<\/tr>/gi;
  let m;
  while ((m = trRe.exec(html))) {
    const row = m[1];
    const rankM = /<td[^>]*>\s*<strong>\s*(\d{1,2})\s*<\/strong>\s*<\/td>/i.exec(row);
    const teamM = /teamid=\d+"[^>]*>([\s\S]*?)<\/a>/i.exec(row);
    if (!rankM || !teamM) continue;
    const rank = Number(rankM[1]);
    if (!(rank >= 1 && rank <= 25)) continue;
    const raw = decodeEntities(stripTags(teamM[1])).trim();
    rawNames.push(raw);
    const key = canon(raw, 'ap');
    if (key && !ranks.has(key)) ranks.set(key, rank);
  }
  return { label, date, ranks, rawNames };
}

/** All AP polls by season, sorted by release date. */
export function loadPolls() {
  const dir = path.join(RAW, 'ap-polls');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));
  const bySeason = new Map();
  for (const season of manifest) {
    const polls = [];
    for (const p of season.polls) {
      const file = path.join(dir, 'polls', `poll-${p.id}.html`);
      if (!fs.existsSync(file)) continue;
      const parsed = parsePollPage(fs.readFileSync(file, 'utf8'), season.year, p.label);
      if (!parsed.date || parsed.ranks.size === 0) continue;
      polls.push({ ...parsed, id: p.id });
    }
    polls.sort((a, b) => a.date.localeCompare(b.date));
    bySeason.set(season.year, polls);
  }
  return bySeason;
}

/** The poll in effect at kickoff: the latest one released on or before the game. */
export function pollAtKickoff(polls, gameDate) {
  let best = null;
  for (const p of polls) {
    if (p.date <= gameDate) best = p;
    else break;
  }
  return best ?? polls[0] ?? null;
}

// ------------------------------------------------------------ cfbfastR games

const TRUE_VALUES = new Set(['TRUE', 'true', 'True', '1']);

/**
 * cfbfastR's start_date is UTC, so a Saturday night kickoff lands on Sunday --
 * and from 2000 on the AP poll is released on Sunday, which would hand the game
 * the poll published *after* it was played. Shifting by 8 hours (US Pacific)
 * recovers the US calendar date for every real kickoff window: 11:00-23:59 UTC
 * stays on its own date, 00:00-06:00 UTC moves back one day.
 *
 * Checked against jhowell's independent dates for the 15,213 FBS-vs-FBS
 * non-neutral games both sources share, 2001-2025:
 *   raw UTC date   11,674 exact / 3,539 off by one day
 *   UTC minus 8h   15,160 exact /    53 off by one day
 */
export function kickoffDate(startDate) {
  const t = Date.parse(startDate);
  if (!Number.isFinite(t)) return String(startDate).slice(0, 10);
  return new Date(t - 8 * 3600000).toISOString().slice(0, 10);
}

export function loadCfbfastrGames(firstSeason, lastSeason) {
  const dir = path.join(RAW, 'cfbfastr');
  const games = [];
  const skipped = { nonFbsAway: 0, noScore: 0 };
  // A few hundred rows carry no away_division. Build the season's FBS set from
  // the rows that do, and hold division-less visitors to membership in it, so
  // an FCS money-game visitor can't slip through as a road team.
  const fbsBySeason = new Map();
  for (let year = firstSeason; year <= lastSeason; year++) {
    const file = path.join(dir, `cfb_schedules_${year}.csv`);
    if (!fs.existsSync(file)) continue;
    const set = new Set();
    for (const r of parseCsv(fs.readFileSync(file, 'utf8'))) {
      if (r.home_division === 'fbs') set.add(r.home_team);
      if (r.away_division === 'fbs') set.add(r.away_team);
    }
    fbsBySeason.set(year, set);
  }
  for (let year = firstSeason; year <= lastSeason; year++) {
    const file = path.join(dir, `cfb_schedules_${year}.csv`);
    if (!fs.existsSync(file)) continue;
    for (const r of parseCsv(fs.readFileSync(file, 'utf8'))) {
      const homePts = Number(r.home_points);
      const awayPts = Number(r.away_points);
      if (!Number.isFinite(homePts) || !Number.isFinite(awayPts)) {
        skipped.noScore++;
        continue;
      }
      // FCS/DII/DIII visitors can't have an in-scope FBS head coach.
      if (r.away_division && r.away_division !== 'NA' && r.away_division !== 'fbs') {
        skipped.nonFbsAway++;
        continue;
      }
      if ((!r.away_division || r.away_division === 'NA') && !fbsBySeason.get(year)?.has(r.away_team)) {
        skipped.nonFbsAway++;
        continue;
      }
      games.push({
        game_id: r.game_id,
        season: Number(r.season),
        week: Number(r.week) || null,
        season_type: r.season_type,
        date: kickoffDate(r.start_date),
        start_date_utc: r.start_date,
        neutral: TRUE_VALUES.has(r.neutral_site),
        home_raw: r.home_team,
        away_raw: r.away_team,
        home_points: homePts,
        away_points: awayPts,
        venue: r.venue && r.venue !== 'NA' ? r.venue : null,
        notes: r.notes && r.notes !== 'NA' ? r.notes : null,
        source: 'cfbfastR',
      });
    }
  }
  return { games, skipped };
}

// ------------------------------------------------------------- jhowell games

/**
 * jhowell.net site convention, verified against 1990 Alabama / Auburn /
 * Louisville / Cincinnati / Southern Mississippi files:
 *   "@"   the listed team played at the opponent's own home venue -> TRUE ROAD
 *   "vs." everything else -- real home games AND every game at any other site
 *         (bowls, kickoff classics, alternate "home" stadiums). A game at a
 *         non-home site shows "vs." on BOTH teams' pages plus a location cell.
 * So "@" rows are exactly the true road games, and taking only "@" rows also
 * de-duplicates: each game appears once, from the visitor's file.
 */
export function parseJhowellFile(html, teamName) {
  const games = [];
  // Season header looks like: <a name=1999>1999-Miami (Ohio) (MAC)</a>
  // The team name itself can contain parentheses, so take the LAST parenthetical
  // in the header as the conference.
  const blockRe = /<a\s+name=(\d{4})>([\s\S]*?)<\/a>([\s\S]*?)<\/table>/gi;
  let b;
  while ((b = blockRe.exec(html))) {
    const season = Number(b[1]);
    const confM = /\(([^()]*)\)\s*$/.exec(cellText(b[2]));
    const conference = confM ? confM[1].trim() : null;
    const body = b[3];
    const trRe = /<tr>([\s\S]*?)<\/tr>/gi;
    let t;
    while ((t = trRe.exec(body))) {
      const rowHtml = t[1];
      const tds = [...rowHtml.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((x) => x[1]);
      if (tds.length < 6) continue;
      const cells = tds.map((c) => cellText(c));
      const dm = /^(\d{1,2})\/(\d{1,2})$/.exec(cells[0]);
      if (!dm) continue; // header row or the season-total row
      const month = Number(dm[1]);
      const day = Number(dm[2]);
      const marker = cells[1];
      const site = marker === '@' ? 'away' : 'vs';
      const result = cells[3];
      const pf = Number(cells[4]);
      const pa = Number(cells[5]);
      if (!'WLT'.includes(result) || !Number.isFinite(pf) || !Number.isFinite(pa)) continue;

      // Opponent cell: "*Florida (9-2)", "Murray State (non-IA)", "Miami (Ohio) (5-5-1)"
      let oppText = cells[2];
      const conf_game = oppText.startsWith('*');
      oppText = oppText.replace(/^\*/, '');
      let oppNonIA = false;
      const tail = /\s*\(([^()]*)\)\s*$/.exec(oppText);
      if (tail) {
        if (/non-?IA/i.test(tail[1])) oppNonIA = true;
        oppText = oppText.slice(0, tail.index).trim();
      }
      // The href is the unambiguous id; the text can repeat across eras.
      const href = /<a\s+href="([A-Za-z0-9()_.'-]+)\.htm#\d{4}"/i.exec(tds[2]);
      const oppFile = href ? href[1] : null;

      const year = month >= 7 ? season : season + 1;
      games.push({
        season,
        conference,
        date: isoDate(year, month, day),
        team: teamName,
        opponent: oppText,
        opponent_file: oppFile,
        opponent_non_ia: oppNonIA,
        site,
        location: cells[6] || null,
        game_name: cells[7] || null,
        conf_game,
        points_for: pf,
        points_against: pa,
        result,
      });
    }
  }
  return games;
}

export function loadJhowellGames(firstSeason, lastSeason) {
  const dir = path.join(RAW, 'jhowell');
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8'));
  const fileToName = new Map(manifest.map((m) => [m.file.replace(/\.htm$/, ''), m.name]));
  const all = [];
  for (const t of manifest) {
    const file = path.join(dir, 'teams', t.file);
    if (!fs.existsSync(file)) continue;
    // jhowell serves windows-1252; latin1 is a safe byte-preserving read here.
    const html = fs.readFileSync(file, 'latin1');
    for (const g of parseJhowellFile(html, t.name)) {
      if (g.season < firstSeason || g.season > lastSeason) continue;
      all.push(g);
    }
  }
  return { games: all, fileToName };
}

// ------------------------------------------------------------------ build

function weekFromSeasonStart(date, seasonStart) {
  const ms = Date.parse(date + 'T00:00:00Z') - Date.parse(seasonStart + 'T00:00:00Z');
  return Math.max(1, Math.floor(ms / (7 * 86400000)) + 1);
}

function resultFor(awayPts, homePts) {
  if (awayPts > homePts) return 'W';
  if (awayPts < homePts) return 'L';
  return 'T';
}

function main() {
  const polls = loadPolls();
  const pollSeasons = [...polls.keys()].sort();
  console.log(
    `AP polls: ${pollSeasons[0]}-${pollSeasons[pollSeasons.length - 1]}, ` +
      `${[...polls.values()].reduce((n, p) => n + p.length, 0)} weekly polls`
  );

  const rows = [];
  const diag = {
    cfbfastr: { total: 0, road: 0, qualifying: 0, unresolvedHome: 0, noPoll: 0 },
    jhowell: { total: 0, road: 0, qualifying: 0, unresolvedHome: 0, noPoll: 0 },
  };

  // ---- 2001-2025 from cfbfastR
  const { games: cfb, skipped: cfbSkipped } = loadCfbfastrGames(2001, 2025);
  diag.cfbfastr.total = cfb.length;
  for (const g of cfb) {
    if (g.neutral) continue;
    diag.cfbfastr.road++;
    const homeKey = canon(g.home_raw, 'cfbfastR');
    const awayKey = canon(g.away_raw, 'cfbfastR');
    if (!homeKey) {
      diag.cfbfastr.unresolvedHome++;
      continue;
    }
    const seasonPolls = polls.get(g.season);
    if (!seasonPolls || !seasonPolls.length) {
      diag.cfbfastr.noPoll++;
      continue;
    }
    const poll = pollAtKickoff(seasonPolls, g.date);
    const homeRank = poll.ranks.get(homeKey);
    if (!homeRank) continue;
    diag.cfbfastr.qualifying++;
    rows.push({
      date: g.date,
      season: g.season,
      week: g.week,
      away_team: awayKey ? display(awayKey) : g.away_raw,
      home_team: display(homeKey),
      home_rank_ap: homeRank,
      away_rank_ap: awayKey ? poll.ranks.get(awayKey) ?? null : null,
      away_points: g.away_points,
      home_points: g.home_points,
      result: resultFor(g.away_points, g.home_points),
      source: 'cfbfastR',
      poll_date: poll.date,
      poll_label: poll.label,
      season_type: g.season_type,
      venue: g.venue,
      game_id: g.game_id,
    });
  }

  // ---- 1990-2000 from jhowell
  const { games: jh, fileToName } = loadJhowellGames(1990, 2000);
  diag.jhowell.total = jh.length;
  const seasonStart = new Map();
  for (const g of jh) {
    const cur = seasonStart.get(g.season);
    if (!cur || g.date < cur) seasonStart.set(g.season, g.date);
  }
  for (const g of jh) {
    if (g.site !== 'away') continue; // "@" == at the opponent's home venue
    diag.jhowell.road++;
    const homeName = g.opponent_file ? fileToName.get(g.opponent_file) ?? g.opponent : g.opponent;
    const homeKey = canon(homeName, 'jhowell');
    const awayKey = canon(g.team, 'jhowell');
    if (!homeKey) {
      diag.jhowell.unresolvedHome++;
      continue;
    }
    const seasonPolls = polls.get(g.season);
    if (!seasonPolls || !seasonPolls.length) {
      diag.jhowell.noPoll++;
      continue;
    }
    const poll = pollAtKickoff(seasonPolls, g.date);
    const homeRank = poll.ranks.get(homeKey);
    if (!homeRank) continue;
    diag.jhowell.qualifying++;
    rows.push({
      date: g.date,
      season: g.season,
      week: weekFromSeasonStart(g.date, seasonStart.get(g.season)),
      away_team: awayKey ? display(awayKey) : g.team,
      home_team: display(homeKey),
      home_rank_ap: homeRank,
      away_rank_ap: awayKey ? poll.ranks.get(awayKey) ?? null : null,
      away_points: g.points_for,
      home_points: g.points_against,
      result: g.result,
      source: 'jhowell',
      poll_date: poll.date,
      poll_label: poll.label,
      season_type: g.date.slice(5) < '07' ? 'postseason' : 'regular',
      venue: null,
      game_id: null,
    });
  }

  // jhowell counts any game away from a team's primary stadium as neutral for
  // BOTH teams -- Arkansas at Little Rock, Alabama at Legion Field, Temple at
  // Veterans Stadium. cfbfastR/ESPN would call several of those home games, so
  // these are the 1990-2000 rows most likely to be missing road games. Print
  // the ones where a team was AP-ranked so phase 3 can adjudicate them.
  if (REPORT_AMBIGUOUS) {
    const seen = new Set();
    const out = [];
    for (const g of jh) {
      if (g.site !== 'vs' || !g.location || g.game_name) continue;
      const a = canon(g.team, 'jhowell');
      const b = canon(g.opponent_file ? fileToName.get(g.opponent_file) ?? g.opponent : g.opponent, 'jhowell');
      const key = [g.date, ...[a, b].filter(Boolean).sort()].join('|');
      if (seen.has(key)) continue;
      seen.add(key);
      const poll = pollAtKickoff(polls.get(g.season) ?? [], g.date);
      if (!poll) continue;
      const ra = a ? poll.ranks.get(a) : null;
      const rb = b ? poll.ranks.get(b) : null;
      if (!ra && !rb) continue;
      out.push(
        `  ${g.date}  ${(ra ? `#${ra} ` : '') + display(a ?? g.team)} vs ${(rb ? `#${rb} ` : '') + display(b ?? g.opponent)}  ${g.location}`
      );
    }
    console.log(`\n-- jhowell alternate-site games with an AP top-25 team (${out.length})`);
    console.log(out.join('\n'));
  }

  rows.sort((a, b) => a.date.localeCompare(b.date) || a.away_team.localeCompare(b.away_team));

  const out = {
    generated: new Date().toISOString().slice(0, 10),
    rules_version: JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'rules.json'), 'utf8')).version,
    definition:
      'True road games (away team, neutral_site false) since the 1990 season where the home team was ranked 1-25 in the AP poll in effect at kickoff.',
    sources: {
      'cfbfastR (2001-2025)':
        'https://raw.githubusercontent.com/sportsdataverse/cfbfastR-data/main/schedules/csv/cfb_schedules_<year>.csv',
      'jhowell.net (1990-2000)': 'https://www.jhowell.net/cf/scores/byname.htm',
      'AP polls (1990-2025)': 'https://www.collegepollarchive.com/football/ap/seasons.cfm?seasonid=<year>',
    },
    count: rows.length,
    games: rows,
  };
  const outFile = path.join(ROOT, 'data', 'games-candidates.json');
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));

  console.log(`cfbfastR games ${cfb.length} (skipped: ${cfbSkipped.nonFbsAway} non-FBS visitors, ${cfbSkipped.noScore} unplayed)`);
  console.log(`jhowell games  ${jh.length}`);
  console.log(JSON.stringify(diag, null, 2));
  console.log(`wrote ${outFile}: ${rows.length} candidate games`);

  if (unmatched.size) {
    console.log(`\n!! ${unmatched.size} unresolved team names`);
    if (REPORT_UNMATCHED) {
      for (const [n, c] of [...unmatched].sort((a, b) => b[1] - a[1])) console.log(`   ${c}\t${n}`);
    } else {
      console.log('   re-run with --unmatched to list them');
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
