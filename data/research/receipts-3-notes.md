# Receipts slice 3 notes

Scope: 100 Sports-Reference season-schedule pages, hosts Kansas State through
North Carolina (Kansas State, Kentucky, LSU, Louisville, Miami (FL), Michigan,
Michigan State, Minnesota, Mississippi State, Missouri, NC State, Nebraska,
North Carolina), seasons 1990-2025. 331 worklist games.

Output: `data/research/receipts-3.json`.
Script: `scripts/receipts/fetch-slice3.py` (`fetch` phase caches the HTML, `extract`
phase parses and writes the JSON). Cached HTML lives in the session scratchpad
under `slice3/html/`, not in the repo.

## Counts

| status | rows |
| --- | --- |
| confirmed | 324 |
| discrepancy | 7 |
| page_missing | 0 |

All 100 pages fetched on the first pass with a verified `<title>`; no slug
corrections were needed, no HTTP failures, no 429 backoffs.

## Method notes

- Column positions are not fixed across eras: pre-2000s pages have no kickoff-time
  column, later ones do. The parser anchors on the date cell, then finds the cell
  naming the host school, so the site marker is always the next cell and the
  opponent the one after that; result/points are taken from the first W/L/T cell
  after the conference cell. That keeps 1990 and 2025 rows on the same code path.
- Team-name comparison uses an alias table (SR renders LSU as "Louisiana State",
  UConn as "Connecticut", TCU as "Texas Christian", Ole Miss as "Mississippi",
  NC State as "North Carolina State", UAB as "Alabama-Birmingham", etc.), so name
  spelling differences are not reported as discrepancies. Only substantive
  mismatches (rank, site marker, result, points, date, opponent identity) are.
- Two pages needed a pinned Wayback timestamp instead of the bare `<season+1>`
  year picker, which resolved to a capture taken *before* that season ended (the
  schedule rows existed but the result and score cells were blank):
  - Michigan 2017: the year picker landed on 20170712 (July 2017). The CDX index
    shows no post-season capture until 20210119, so that snapshot is pinned in
    `TIMESTAMP_OVERRIDES` and appears in the row's `source_url`.
  - Nebraska 2010: the year picker landed on 20101029 (mid-season). Pinned to the
    earliest post-season capture, 20141204.
  Both then matched the worklist exactly. No other page produced blank cells, so
  no other snapshot was stale for the games in question.

## Discrepancies (7)

Site-marker disagreements — SR does not record these as the visitor's true road
game, and per the spec they are reported, not fixed:

1. **2005-12-03 Georgia at LSU** — site marker `N`; the row's note cell reads
   "SEC Championship (Atlanta, GA)". Neutral site, not a road game. Ranks and the
   34-14 Georgia win otherwise match.
2. **2007-12-01 Tennessee at LSU** — site marker `N`, "SEC Championship
   (Atlanta, GA)". LSU won 21-14; everything else matches.
3. **2007-12-01 Oklahoma at Missouri** — site marker `N`, Big 12 Championship at
   a neutral site. Scores and ranks otherwise match.
4. **2015-10-10 South Carolina at LSU** — site marker `@` on LSU's page, i.e. SR
   records LSU as the *visitor*, with the note "At Baton Rouge, LA due to
   flooding". The game was physically played at LSU but SR keeps South Carolina as
   the home team, so the worklist's home/away assignment is the reverse of SR's.
   Points in the row (45-24 in the cells) are LSU's then South Carolina's, matching
   the worklist's values but under SR's opposite orientation.

Date disagreements (one day earlier in the worklist than on SR; scores, ranks and
the empty site marker all match):

5. **2001-08-24 TCU at Nebraska** — SR dates this Aug 25, 2001, with the note
   "Pigskin Classic (Lincoln, NE)". Nebraska 21-7.
6. **2001-10-19 Texas Tech at Nebraska** — SR dates this Oct 20, 2001 (a
   Saturday; the worklist's Oct 19 is a Friday). Nebraska 41-31.

Rank disagreement:

7. **2013-09-01 Ohio at Louisville** — SR shows Louisville as `(8)`; the worklist
   carries `home_rank_ap` 9. Score (49-7) and the empty site marker match. Only the
   host's ranking differs, so the "top-10 host" premise survives either way.
