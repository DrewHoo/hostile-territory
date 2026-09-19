# Receipts slice 1 — notes

Hosts Alabama through Florida: 100 season-schedule pages, 288 worklist games.

| status | count |
| --- | --- |
| confirmed | 287 |
| discrepancy | 0 |
| page_missing | 1 |

Helper: `scripts/receipts/fetch_slice1.py` (`fetch` / `retry` / `parse`). Cached HTML
lives outside the repo, in the session scratchpad under `slice1/html/`.

## Pages missing or unusable

One, and it is a partial rather than a true blank:

- **Clemson 2024 (2024-10-19 vs Virginia)** — the Wayback Machine has exactly one
  capture of this page, `20240828002226`, and the CDX index confirms it is the only
  one. That capture is **preseason**: the Oct 19 row exists but is unplayed — time
  `TBD`, empty result, empty points, and the school cell shows Clemson's *preseason*
  rank of 14 rather than the AP 10 the worklist records for game day. What the
  snapshot *does* corroborate is the home/away sense: the site-marker cell is empty
  and the opponent is Virginia. The score and the game-day rank are simply not on any
  archived copy of this page, so the row is `page_missing` rather than `discrepancy` —
  SR does not contradict us here, it just has not got the result.

Every other one of the 99 pages returned a post-season snapshot whose `<title>` names
the right school and season.

## Discrepancies

None. All 287 verifiable games passed every check in the spec: the school cell's AP
rank equals `home_rank_ap`, the opponent is the worklist's `away_team`, the site-marker
cell is **empty** (no `@`, no `N`), the home-side result inverts the visitor result,
and the two points cells match `home_points` / `away_points`.

A clean sweep invites suspicion, so it was tested rather than trusted:

- **The site-marker check is real, not a parsing artifact.** Across every schedule row
  on the 100 cached pages, the cell this script reads holds `''` 670 times, `'@'` 470
  times, and `'N'` 163 times. It is reading the column that distinguishes home from
  road from neutral, and all 287 worklist rows land in the empty bucket.
- **Mutation testing.** Perturbing the worklist one field at a time and re-running the
  verifier flips essentially everything to `discrepancy`: home rank +1 → 287
  discrepancies; opponent swapped → 287; home score +1 → 287; away score +1 → 287;
  result flipped → 287; date moved to the 1st of the month → 284 (the 4 survivors are
  games genuinely played on the 1st). No check is a no-op.
- **A free cross-check.** 101 of the 288 games carry a non-null `away_rank_ap`. SR's
  rank for the visitor matched the worklist in all 101, though the spec does not
  require that comparison.

## Things worth knowing

- **Wayback throttling dominated the run.** At the spec's 4-second floor, the archive
  started refusing connections (curl exit code 000, not an HTTP status) in bursts of
  6–10 pages. Raising the gap to 9 seconds cut the failure rate to ~10%, and a second
  pass at 12 seconds with four attempts recovered all 10 stragglers. None of the ten
  was a genuinely absent snapshot — every one was throttling. Anything a sibling slice
  reports as `page_missing` off a single fast pass is worth re-fetching before it is
  believed.
- **Three SR table layouts, one parser.** Pre-2000 snapshots emit bare `<td align=...>`
  cells with no `time` column; the 2010-era snapshots add `data-stat` attributes but
  still no time column; modern ones have both plus `broadcaster` and `notes`. The
  positional cell map in the spec ("game#, date, time, day, school, ...") only matches
  the third of those. The parser therefore locates the school cell by its link to the
  home team's own season page and reads the site/opponent/result/points cells relative
  to it, falling back to `data-stat` names when they are present. Quotes are the full
  row, so cell counts differ between eras — that is the page, not a truncation.
- **Ties.** Three games are ties, where the visitor result and the home result are both
  `T` rather than inverses: Auburn–Tennessee 26–26 (1990-09-29), Auburn–Georgia 23–23
  (1994-11-12), Colorado–Oklahoma 24–24 (1992-10-17). A result check written as
  "home W = our L" flags all three as false discrepancies; the mapping has to be
  W↔L, T→T.
- **BYU's page title is "Brigham Young Cougars."** A title check that looks for the
  common name marks all four BYU pages missing even though they fetched fine. Same
  trap as the slug exception, one layer up.
- **Opponent names are matched by SR slug, not display text**, because SR renders
  Ole Miss as "Mississippi", LSU as "Louisiana State" on older pages and "LSU" on
  newer ones, and UCF as "Central Florida". 64 opponent cells on these pages have no
  school link at all (non-D1 teams); those fall back to a normalized-name comparison.
  None of the 288 worklist games hit that fallback.
- **Snapshot vintage varies wildly** — captures range from 2010-08 to 2026-01, with
  the season+1 year picker often landing years later than the season. That is fine for
  a settled schedule table, and every page but Clemson 2024 was captured after its
  season ended.
