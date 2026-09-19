# Receipts slice 4 — notes

Scope: 100 Sports-Reference season-schedule pages (hosts North Carolina, Northwestern,
Notre Dame, Ohio State, Oklahoma, Oklahoma State, Ole Miss, Oregon), 345 worklist games.

Counts: **335 confirmed, 9 discrepancy, 1 page_missing.**

## Method

`scripts/receipts/fetch-slice4.py` (subcommands `fetch`, `retry`, `refresh`, `build`).
Pages come from the Wayback Machine via `curl -sL` with >=4s between requests, cached
under the session scratchpad's `slice4/html/`. Extraction maps each `<td>` to the
`data-stat` key from the table head; on older snapshots that carry no `data-stat`
attributes the header *labels* are mapped instead (the two blank headers are the site
marker, after School, and the result, after Conf) — one page needed that path
(notre-dame-1991). Rows are matched on date; `quote` is the row's cells joined with
` | ` after tag-stripping, verbatim.

Checks per row, all against the home-side page: school cell rank == `home_rank_ap`,
opponent == `away_team` (school-name aliases normalized: Ole Miss/Mississippi,
LSU/Louisiana State, TCU, USC, Pitt/Pittsburgh, NC State, Texas A&M, Miami FL/OH…),
site marker empty, home-side result inverted against the worklist's visitor result
(T maps to T), and home/opp points mapped to home/away.

Independent post-hoc sweep: all 100 cached pages carry the right school and season in
`<title>`, a closed schedule table, and school cells that all name the expected host;
all 335 confirmed rows re-check clean on score, both AP ranks and empty site marker.

### Snapshot pickers

33 of the 100 pages carry a `source_url` whose year picker is not `season+1`. Two
reasons:

- ohio-state-2008: the `season+1` picker resolves to a snapshot that was itself a
  404 at crawl time, and so do the 2010/2011/2013 pickers. The 2014 picker
  (snapshot 20150730) serves the real page.
- The rest were refetched with a 2026 picker after an early fetch pass overlapped
  itself and left some cached files written twice. The refetch pass only keeps a page
  when every worklist row on it parses with a score, so each page in the cache is a
  post-season snapshot of the right school and season. Spot-checked
  notre-dame-1993 against its `season+1` picker: identical rows.

`source_url` is always the URL actually fetched, so every quote is re-fetchable.

## page_missing (1)

- **2025-11-22 Syracuse at Notre Dame.** The only Wayback snapshot of
  `notre-dame/2025-schedule.html` is 2025-10-06 — mid-season. Every later picker
  (20260101/20260401/20260915) resolves back to it, and CDX lists nothing after
  2025-12-01. The Nov 22 row exists but is unplayed: no result, no points, and the
  school cell's `(16)` is Notre Dame's rank *at snapshot time*, not at kickoff. So the
  worklist's 70-7 and `home_rank_ap` 9 cannot be verified from SR and the row is not
  reported as a rank/score conflict. The other Notre Dame 2025 worklist game
  (2025-09-13 vs Texas A&M) verifies from the same snapshot.

## Discrepancies (9)

### Neutral-site markers — SR says these were not the visitor's road games (5)

SR puts an `N` in the site column, i.e. it disagrees that the visiting team traveled to
the host's home field. Scores, ranks and results otherwise match the worklist exactly.
Left as-is per spec.

| date | game | SR note on the row |
|---|---|---|
| 2002-10-12 | Texas at Oklahoma | (no note on the row, only the `N`) |
| 2003-12-06 | Kansas State at Oklahoma | Big 12 Championship (Kansas City, MO) |
| 2004-10-09 | Texas at Oklahoma | Dallas, TX |
| 2004-12-04 | Colorado at Oklahoma | Big 12 Championship (Kansas City, MO) |
| 2006-12-02 | Nebraska at Oklahoma | Big 12 Championship Game |

All five are Oklahoma home-side pages: three Big 12 championship games and the two
Dallas editions of Oklahoma-Texas, booked upstream as Oklahoma home games.

### AP rank of the host (2)

- **2017-11-18 Illinois at Ohio State** — SR row reads `(11) Ohio State`; worklist says
  `home_rank_ap` 8. Score (52-14) and result match. The AP poll table on the same page
  reads 11/5 = 11, 11/19 = 8, so 8 is Ohio State's rank *after* the game; 11 is the
  standing it played at.
- **2017-11-18 Kansas State at Oklahoma State** — SR row reads `(12) Oklahoma State`;
  worklist says 10. Score (40-45) and result match. Poll table on the page: 11/5 = 12,
  11/19 = 18; 10 matches neither.

Both are 2017-11-18 games and both worklist ranks are stronger than SR's. If SR is
right, neither host was a top-10 team at kickoff and both games fall out of scope.

### Oklahoma 2001 (2)

- **2001-08-25 North Carolina at Oklahoma** — worklist has the visitor losing 10-0; SR
  has `W | 41 | 27` from Oklahoma's side, i.e. Oklahoma 41, North Carolina 27, with the
  row note "Hispanic Coaches Classic (Norman, OK)" and an empty site marker. Nothing
  about 10-0 appears on the page. Corroborated in a second, much later snapshot
  (20250123): same 41-27.
- **2001-10-19 Baylor at Oklahoma** — the worklist date is off by one day. SR lists this
  matchup (33-17, ranks and result otherwise matching) on **2001-10-20**, and there is no
  2001-10-19 row on the page. The 20250123 snapshot agrees on Oct 20. The receipt row
  quotes the Oct 20 row and keeps the worklist's date in `date`.
