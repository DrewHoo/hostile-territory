# Back to 1936

Hostile Territory starts in 1990 because that's where the first build's sources started. cfb-streak-king has since put together every major-college game, AP poll and head coach back to 1936 (the first AP poll), so we can take the board back to 1936 without new research. This spec covers what that takes, what it doesn't do yet, and how to check it.

## What changes for a reader

The board's window becomes 1936 to the present. The default view (current coaches only) doesn't change, since no current coach has a game before 1990. "All coaches" gains 406 coaches, most of them with only pre-1990 games (Leahy, Bryant, Royal, Wilkinson, Neely), and fills in the early careers of coaches already on the board (Bowden's West Virginia years, Paterno before 1990, Holtz at William & Mary, NC State, Arkansas and Minnesota). The Kiffin line stays pinned to 1-8.

The numbers, from the build on 2026-10-13: 4,451 qualifying road games before 1990 (2,421 against a top-10 host), 3,932 of them attributed to a scoped coach (2,170 top-10, road teams 349-1768-53).

## Sources and lineage

Everything comes from the sources this repo already parses, run back further:

- Games 1936-2000: Howell's team pages (jhowell.net), the same `@`-marker parse the 1990-2000 rows use. `fetch-data.mjs` now pulls every team page that overlaps 1936-2000 (228 files).
- AP polls 1936-present: collegepollarchive, same parser.
- Team names: cfb-streak-king's `name-aliases.json` replaces ours. It descends from ours and every entry we had is unchanged there; it adds the teams Howell counts as major before 1990 and the wartime service teams the AP ranked.
- Coaches 1936-1989: cfb-streak-king's resolved stints. That repo matched CFBD's `/coaches` season records against Howell's results as W-L prefixes and researched every season that didn't resolve (`coach-overrides.json`, with receipts). We read its committed `payload-base.json` and `coach-overrides.json`, never its raw cache.

Lineage worth saying out loud: Howell is the game source and CFBD's games descend from Howell, so the coach reconciliation checks CFBD's coach records against Howell's results, not Howell against anything. The pre-1990 rows have one game source. The independent check, Sports-Reference, is a later phase (below).

## Rules (data/rules.json, version 2)

- **Since**: 1936 season onward.
- **Rank at kickoff**: same rule (the last AP poll released on or before the game date), with two changes that only bite before 1990:
  1. There was no preseason poll before 1950, so a 1936-49 game played before that season's first poll (mid-October) has no rank in effect. It's unknown, not unranked, and it doesn't count. `pollAtKickoff` used to fall back to the season's first poll, which would have handed a September game an October ranking; it now returns null. 360 road games at a team ranked in its season's first poll fall in that window (206 at a first-poll top 10). The coverage report prints the count and the Method section says it.
  2. Before 1965, and in 1966-67, the AP's final poll came out after the regular season and before the bowls. CPA doesn't date final polls, so those get dated a week after the last weekly poll (the same rule as cfb-streak-king's `parse-polls.mjs`); from 1968 the final stays on Feb 1. Bowls are neutral, so this only matters for a December regular-season game.
- **Poll depth**: the AP ranked 20 teams before 1989 and 10 in 1961-67. Top 10 exists every season, so the headline number is comparable across eras. The Top 25 toggle is really a top-20 (or top-10) cut in those seasons, and the page says so under the heading when the Top 25 toggle is on.
- **Who counts (`pre_1990_power`)**: before 1990 a power school-season is a season in the SEC, Big Ten, SWC, Big 8 (Howell's label, which covers the Big Six and Big Seven), Pac-12 (the PCC, AAWU, Pac-8 and Pac-10), the ACC from 1953 and the Southern Conference through 1952, plus an independent season by a school on the existing `school_assignments` list. That last part is the 1990 rule's own treatment of independents (Miami, Florida State and Penn State count via their independent years) run backward. A coach is in scope when they have a tenure overlapping a power school-season in either era, and then all of their major-college games count, the same as today.

I went with the conference list because it's the rule we already have, read from data we already have. It does feel a little arbitrary for the 1940s though: Army and Navy are out (24 and 19 qualifying top-10 games with no scoped coach), and so are Fordham and the pre-1956 Ivies. Adding "Army and Navy, 1936-1989" to `pre_1990_power` is a one-line change and re-scores everything, so this is a call for Drew, not a data problem. WDYT?

## What doesn't count yet: alternate home fields

Howell writes `vs.` on both teams' pages for every off-campus game, so the `@` parse treats Alabama at Legion Field and Arkansas at Little Rock as neutral. The 1990-2000 rows already work this way (it's open problem 1 in `data/research/sources.md`), and before 1990 it costs a lot more. Measured against cfb-streak-king's `alt-home.json` ruling (a city counts as a team's home when it's in the team's state and the team played 5+ regular-season games there against 3+ opponents; a city both teams claim stays neutral), 186 pre-1990 top-10 games and 8 from 1990-2000 would become road games: Alabama in Birmingham 60, Arkansas in Little Rock 43, Navy in Baltimore 15, Ole Miss in Jackson 10, Tennessee in Memphis 10, Fordham in New York 10.

So this change keeps the `@` rule and says so in the Method section and in `rules.json`. Adopting the alt-home ruling is the next phase. It changes 8 rows on the existing 1990-2000 board, which is why it isn't bundled into a backfill that otherwise leaves every existing row alone.

## Pipeline

The apply order, with what's new:

1. `fetch-data.mjs`: `JH_FIRST` and `POLL_FIRST` are 1936. Raw stays gitignored. A checkout can seed `data/raw/` from cfb-streak-king's cache (same URLs, same bytes) instead of re-fetching.
2. `build-candidates.mjs`: Howell 1936-2000, cfbfastR 2001-present, as before. Every pre-1990 row carries two receipts (below), `poll_id` and `howell_file`. Pre-poll games go to `pre_poll` in `games-candidates.json`. The script exits 1 when `data/raw/` doesn't reach back to 1936, since an old cache would otherwise drop every earlier game without a word.
3. `build-coach-stints.mjs` (new; `CSK_DIR` points at a cfb-streak-king checkout): writes `data/coach-stints.json`. One row per stint, clipped to the school's major-college seasons (a stint otherwise ran across Idaho's, Marshall's and UConn's I-AA years) and cut at 1989. It also writes the 1990+ stints of coaches scoped only by their pre-1990 careers, in school-seasons no researched row covers: 10 rows, which add 22 games (Earle Bruce at Colorado State, Ted Tollner at San Diego State, John Ralston at San Jose State, Dick Crum at Kent State, and others). Every row carries a vote-form receipt naming CFBD and Howell, plus the coach-overrides receipts for any season that file rules. It prints the seam check (the 1989 coach at each school against the researched 1990 coach) and any name shared by two CFBD coaches.
4. `build-records.mjs`: pre-1990 games are attributed from the stint rows only. The researched rows don't apply there; 69 of them carry a real pre-1990 start season they were never researched for. From 1990 the researched rows win and a scoped stint row fills in only where none covers the game. The site payload splits in two: `site-data.json` (1990+, all the prerender reads) and `site-data-1936.json`, which the app imports after mount. The main bundle stays at 1.0 MB (212 KB gzipped); the 1936 chunk is 180 KB gzipped.
5. `save-pages.mjs`, then `check-receipts.mjs --offline` (the quote gate).
6. `candidate-stats.mjs` (flags now use a median per poll era) and `coverage-report.mjs` (section 7 is the backfill).

`data/coach-aliases.json` is new and holds two spellings so far: R.C. Slocum (CFBD) is R. C. Slocum, and Ron Dowhower (CFBD, Stanford 1979) is Rod Dowhower.

## Receipts

This follows the receipts-research method (the receipt object, a quote gate against committed pages):

- Each pre-1990 game carries `receipts: [{ url, quote, note }]`: the visitor's row on its Howell page (`10/11 @*Georgia (11-0) L 13 28`) and the host's row in the AP poll in effect (`8 < N/A Georgia SEC 2-0 247`). The quotes are cut from the raw HTML with the same text normalization the gate uses (`scripts/lib/receipts.mjs`).
- `save-pages.mjs` writes each quoted page's text to `data/research/pages/<sha1(url)>.txt.gz` from `data/raw/`, or copies cfb-streak-king's saved page for a coach-overrides receipt. 826 pages, 4.6 MB, committed.
- `check-receipts.mjs --offline`: 8,902 game receipts and 84 coach-override receipts match; the 1,132 vote-form coach receipts are counted, not checked. Since the quotes are cut from the same pages they're checked against, a clean pass mostly proves the plumbing, so I mutation-tested it: 60 receipts perturbed (a score off by one, W and L swapped, `@` changed to `vs.`), and the gate caught all 55 that actually changed (the other 5 mutations were no-ops).
- On the page, a pre-1990 date links Howell's row with a dashed underline and a title that says it's the source, not an independent check; the rank links the poll with its row on hover. A 1990+ date still links the Sports-Reference capture.

## Checks

- 1990+ is untouched: `games-candidates.json` rows for 1990+ are identical to before the change (5,385 of 5,385). Against the committed `records.json`, every existing game keeps its coach, school, rank, result and interim flag. The diff is the 22 games above plus one home coach that gained a name (1995 Wyoming at San Diego State now names Ted Tollner). The 1990+ `site-data.json` differs from the committed one only by those 8 new coaches and that one home coach.
- Known answers (`coverage-report.mjs` section 7, checked by hand against Howell and the poll first): 1966 Notre Dame at #2 Michigan State, T 10-10 (Parseghian); 1969 Texas at #2 Arkansas, W 15-14 (Royal); 1971 Nebraska at #2 Oklahoma, W 35-31 (Devaney).
- Coverage: every pre-1990 game on the board carries both receipts (3,932 of 3,932). 19 qualifying games come from power school-seasons with no coach (The Citadel, Furman and VMI in the Southern Conference, Sewanee in the SEC, Idaho and Montana in the PCC) because CFBD has no row for those team-seasons. They're triaged in `data/research/coach-gaps-pre-1990.json`, and the report fails on any gap not listed there or any listed gap that's gone.
- Name splits: stint coaches against researched coaches by surname and first initial. Dowhower was a real split. Biff Jones, Bud Davis, D.C. Walker and Tony Mason are different people from their matches and are listed as checked.
- `candidate-stats.mjs`: no season flagged. Top-10 games per season run 18-41 in 1936-49 (seven to ten polls a season) and 40-60 after, against about 60 a season since 1990.
- Hydration: no console errors with the 1936 chunk merged in, and the 1990+ prerender is the same page it was.

## Not in this change

1. **Alternate home fields** (above): adopt `alt-home.json` for 1936-2000. It's the biggest known undercount, and it touches 8 existing rows.
2. **Army, Navy and the eastern independents** (above): a scope call.
3. **An independent check of the pre-1990 games.** The 1990+ top-10 games carry a Sports-Reference receipt from the verification fleet (98.1%). The pre-1990 ones carry Howell's row, which is the source. A fleet against archived SR season pages, grouped by host-season like the first one, would cover 2,170 games. The first fleet did 1,851 games in six slices.
4. **The 19 coach gaps**: research each team-season into cfb-streak-king's `coach-overrides.json` with receipts and rebuild here. It's upstream because the same gap is in Streak King.
5. **The index site's project card** still says "since 1990"; it lives in the index repo.

These go in `data/research/leads.json` so they don't get dropped.

## Refresh

The weekly refresh doesn't change. `coach-stints.json` is committed and only needs `build-coach-stints.mjs` again when cfb-streak-king's coach data changes. `build-candidates.mjs` stops with a message if a checkout's `data/raw/` predates the backfill. On a fresh checkout, `fetch-data.mjs --only=jhowell` and `--only=polls` fill it (or seed it from cfb-streak-king's cache).
