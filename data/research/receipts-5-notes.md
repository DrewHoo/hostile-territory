# Receipts slice 5 — notes

Beat: 100 Sports-Reference season-schedule pages, hosts Oregon through Texas (Oregon,
Oregon State, Penn State, Pittsburgh, Purdue, Rutgers, SMU, South Carolina, South
Florida, Stanford, Syracuse, TCU, Tennessee, Texas), covering 308 worklist games.
Spec: `data/research/receipts-README.md`. Output: `data/research/receipts-5.json`.

Tally: **302 confirmed, 5 discrepancy, 1 page_missing.**

Every one of the 100 pages came back from the Wayback Machine with a `<title>` naming the
right school and season, so nothing in this slice was lost to a bad slug or a dead URL.

## Discrepancies

**Two worklist dates are one day early.** The 2001 Oregon–Stanford game and the 2001
Texas–Colorado game are both dated 2001-10-19 in the worklist; SR dates both to Saturday,
Oct 20, 2001. 2001-10-19 was a Friday, and every other cell on both rows (rank, opponent,
empty site marker, score, result) matches the worklist exactly. These read as one slip in
whatever fed the worklist, not two separate games.

- Oregon 2001 vs Stanford — SR: `Oct 20, 2001 | Sat | (5) Oregon | | Stanford | Pac-10 | L | 42 | 49`
- Texas 2001 vs Colorado — SR: `Oct 20, 2001 | Sat | (9) Texas | | (14) Colorado | Big 12 | W | 41 | 7`

**Three games SR does not treat as true road games.** Each carries an `N` in the site-marker
cell, meaning SR has them at a neutral site, not at the listed host. Reported, not fixed:

- 2001-10-06 Oklahoma at Texas — marker `N`, SR notes column reads "Dallas, TX" (Red River, Cotton Bowl).
- 2005-10-08 Oklahoma at Texas — marker `N`, notes "Dallas, TX". Same series, same reason.
- 2001-12-01 Colorado at Texas — marker `N`, notes "Big 12 Championship (Dallas, TX)".

All three are the same pattern: a Dallas neutral-site game that the worklist assigns to Texas
as host. Ranks, scores, and results on all three rows otherwise match the worklist.

## page_missing

**2024-11-30 California at SMU.** The `web/2025/` picker returns a real, correctly titled
2024 SMU schedule page, but it is a preseason capture: every row shows `TBD` for time, SMU
ranked `(22)` all season long, and no scores or results at all. The CDX index has exactly one
snapshot of that URL — `20240804165509`, August 4, 2024 — and requesting later timestamps
(`20250601`) redirects back to it. So the page exists and the row for this game exists, but it
predates the game and carries nothing to verify. Recorded as page_missing with the empty row
quoted verbatim rather than confirmed off a blank.

## Method

`scripts/receipts/fetch-slice5.py` does both halves: `fetch [start] [end]` downloads pages
into a scratchpad cache (4.5s between Wayback requests, 60s back-off and one retry on
failure, title-verified before it counts as cached), and `build` parses the cache into
`receipts-5.json`.

Two snapshot quirks worth recording for the other slices:

- Snapshot markup varies. Newer captures carry `data-stat` attributes on the header cells
  (six column layouts across this slice, some with a `Time` column, some with `TV`, some with
  a `T` for ties); 41 of the 100 pages are older captures with no `data-stat` anywhere, so the
  parser falls back to mapping header labels to keys positionally. The two blank headers are
  the site marker (right after `School`) and the result (right after `Conf`). Naive positional
  indexing off the spec's column list silently mis-reads the older pages.
- Wayback returns a fair number of curl exit-0-with-no-body failures (`http_code` 000) under
  load; almost all of them succeed on the retry after the back-off. Two pages (Penn State 2009,
  South Carolina 2011) failed twice with truncated bodies and were re-fetched successfully on a
  third pass, so neither is a genuine page_missing.
