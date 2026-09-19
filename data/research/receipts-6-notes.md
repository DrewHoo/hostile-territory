# Receipts slice 6 notes (hosts Texas through Wisconsin)

Worklist: `receipts-worklist-6.json` — 100 Sports-Reference season-schedule pages,
275 games. Output: `receipts-6.json`, one row per worklist game.

## Result

| status | rows |
| --- | --- |
| confirmed | 268 |
| discrepancy | 3 |
| page_missing | 4 |

All 100 pages were fetched successfully. The 4 `page_missing` rows are not missing
pages — they are pages whose only Wayback capture predates the game (below).

## Method

`scripts/receipts/receipts-slice6.py` does both halves:

- `fetch` — `curl -sL` on
  `https://web.archive.org/web/<season+1>/https://www.sports-reference.com/cfb/schools/<slug>/<season>-schedule.html`,
  4.5s+ between requests, one attempt per page per pass, caching the HTML and the
  `<title>` check (title must start with the season and name the school).
- `parse` — pulls the `id="schedule"` table, maps columns, matches each worklist
  game on date, and compares every field: school cell rank vs `home_rank_ap`,
  opponent cell vs `away_team`, site marker must be empty, home/opp points, and
  the home result as the flip of the worklist's visitor result. Any mismatch is a
  discrepancy with the specific fields named in `note`; nothing is auto-corrected.

Wayback was heavily throttled during this sweep — 62 of the first 100 requests
returned curl code 000 (timeout), so fetching ran as five sequential passes plus a
long-timeout pass for three stubborn pages (Texas A&M 1994, UCLA 1998,
Wisconsin 1999). Every page eventually returned a real snapshot. `parse` trusts the
cached file (title + schedule table) rather than curl's exit status, because several
downloads completed and then reported a timeout.

Two column layouts appear across the era covered here — four header variants total,
differing by the presence of `Time`, `TV`, and a ties column — so column mapping is
driven by the header row (or `data-stat` attributes on modern pages), not fixed
offsets. Opponent-name comparison normalizes SR's formal names to the worklist's
common ones (Southern Methodist/SMU, Texas Christian/TCU, Nevada-Las Vegas/UNLV,
Ole Miss/Mississippi, Miami (FL), and so on), with accents stripped.

## Discrepancies (3)

1. **UCLA 2001, listed 2001-10-19 vs California.** SR has no row on 10-19; its only
   California row is **Oct 20, 2001**, and that row otherwise matches exactly —
   `(4) UCLA | | California | Pac-10 | W | 56 | 17`, site marker empty. The worklist
   date looks off by one day. Not corrected.
2. **Wisconsin 2010-11-27 vs Northwestern.** SR shows **(6) Wisconsin**; worklist
   says `home_rank_ap` 5. Everything else agrees (site marker empty, 70-23).
3. **Wisconsin 2017-11-18 vs Michigan.** SR shows **(6) Wisconsin** and
   **(21) Michigan**; worklist says 5 and 19. Score and empty site marker agree.

No site-marker disagreements anywhere in the slice: in all 271 rows with a played
row to read, the site cell is empty, so SR treats each as a true home game for the
host — a true road game for the visitor.

## Pre-game-only captures (the 4 page_missing rows)

Two pages have no post-game capture, so no receipt exists yet for four games. Both
were probed with later year/timestamp pickers (`2026`, `2027`, `20241231`,
`20250301`, `20251231`, `20260919`); Wayback redirects every picker to the same
early capture, so a later snapshot does not exist.

- **Texas Tech 2025** — only capture is 2025-10-04, before the Oct 11 (Kansas),
  Nov 8 (BYU) and Nov 15 (UCF) games. Their rows exist but show `TBD` kickoff and no
  result. The pre-game rank in the capture, `(11) Texas Tech`, is a snapshot artifact
  rather than a disagreement with the worklist's 8/9, so these are marked
  `page_missing`, not `discrepancy`; the pre-game row is kept as the quote.
- **Utah 2024** — only capture is 2024-08-04 (preseason), before the 2024-09-28
  Arizona game; that row is unplayed and the school cell is unranked.

Re-running `receipts-slice6.py fetch` after Wayback picks these pages up again would
resolve all four.
