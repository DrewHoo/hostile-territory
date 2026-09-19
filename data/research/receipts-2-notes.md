# Receipts slice 2 — notes

Hosts Florida through Kansas State. 100 Sports-Reference season-schedule pages,
304 worklist games, one receipt row each in `data/research/receipts-2.json`.

## Counts

| status | rows |
| --- | --- |
| confirmed | 294 |
| discrepancy | 9 |
| page_missing | 1 |

All 100 pages were retrieved from the Wayback Machine at the spec's
`web/<season+1>/` year picker. No page was a dead end.

## How it ran

`scripts/receipts/build_receipts_slice2.py` does it in two passes: `--fetch`
pulls each page into a local HTML cache, `--build` parses the cache and writes
the JSON. Notes on the mechanics:

- Wayback refuses connections fairly often under load (curl exit 7, not an HTTP
  status). Those get a short retry; only real 429/5xx responses take the 60s
  backoff the spec calls for. Five pages needed a second pass; all five then
  returned 200.
- Column layout is not stable across snapshot eras. Snapshots from ~2011 and
  earlier have no Time column, and both the site-marker and result headers are
  blank, so there is nothing to key on by name. The parser prefers modern
  `data-stat` attributes and falls back to locating the cell that names the host
  school and walking right from there.
- Page identity is verified against the archived original URL in curl's
  `url_effective` (it carries the school slug and season) plus the season in the
  `<title>`. That is stricter than a title match alone, since "Florida" is a
  substring of "Florida State".
- Spelling differences where SR and the worklist plainly mean the same school
  (Louisiana State/LSU, Mississippi/Ole Miss, North Carolina State/NC State,
  Alabama-Birmingham/UAB, Central Florida/UCF, Southern Mississippi/Southern
  Miss, Southern California/USC, Texas Christian/TCU, Connecticut/UConn) stay
  `confirmed` and carry the SR spelling in the `note`. 31 rows are in that
  bucket. The verbatim `quote` always has SR's own wording.

## Discrepancies

### Six neutral-site games SR marks `N`

SR puts an `N` in the site cell, so by the spec these are not true road games for
the visitor. Reported, not repaired.

| season | game | SR's own label |
| --- | --- | --- |
| 2001 | Georgia at Florida, Oct 27 | Jacksonville, FL |
| 2002 | Florida at Georgia, Nov 2 | Jacksonville, FL |
| 2003 | LSU at Georgia, Dec 6 | SEC Championship (Atlanta, GA) |
| 2006 | Arkansas at Florida, Dec 2 | SEC Championship (Atlanta, GA) |
| 2007 | Georgia at Florida, Oct 27 | Jacksonville, FL |
| 2007 | Missouri at Kansas, Nov 24 | Kansas City, MO |

Four of the six are the Florida–Georgia Jacksonville series and two conference
title games; the sixth is the Border War at Arrowhead. None of them is a visit to
the host's stadium, and SR says so.

### Kansas State 2003, California, Aug 23 — score is wrong in the worklist

SR: `(7) Kansas State | California | W | 42 | 28`. The worklist has 10-7. A
second snapshot (`web/2025`) reads 42-28 as well, so SR is consistent and the
worklist row is the outlier. Note also that SR's own notes cell calls this the
BCA Classic in Kansas City yet still leaves the site marker empty — SR books it
as a Kansas State home game, so it passes the site test.

### Fresno State 2001, Boise State — date off by one

SR dates this Friday-nighter Oct 19, 2001; the worklist says Oct 18. Rank (8),
result and score (L 30-35) all match. Confirmed against a later snapshot, which
also says Oct 19. The row was matched on the neighbouring date and flagged rather
than silently re-dated.

### Georgia 2017, Kentucky, Nov 18 — stale rank in the archived snapshot

The snapshot the spec's year picker lands on (post-2017 season) reads
`(2) Georgia`; the worklist says 7. Georgia lost to Auburn the week before and
fell to 7 in the AP poll, and the current page — snapshot `20251213231945` —
reads `(7) Georgia` for this row. So SR has since corrected its own rank column
and the worklist is right. Left as a discrepancy because the receipt taken from
the URL the spec specifies genuinely disagrees; the cross-check is recorded in
the row's `note`.

## Page missing

### Georgia Tech 2025, Syracuse, Oct 25

The Wayback Machine has exactly one capture of
`georgia-tech/2025-schedule.html`, timestamp `20250802160957` — three weeks
before the season started. The row for Syracuse exists and confirms Georgia Tech
hosting with an empty site marker, but the rank, result and score cells are still
blank, so there is no score to verify. Recorded as `page_missing` with the row's
verbatim (empty-celled) quote kept, because the honest reading is "no receipt
available", not "SR disagrees". Verified via the CDX API that no later snapshot
exists; worth re-running this one row once the Archive captures the page again.
