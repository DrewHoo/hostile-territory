# Receipts fleet spec (shared by all six slices)

Goal: an independent, verbatim receipt for every true road game vs an AP top-10
team, from Sports-Reference season-schedule pages served by the Wayback Machine
(live SR blocks non-browser fetchers).

## Fetching
- URL shape: `https://web.archive.org/web/<season+1>/https://www.sports-reference.com/cfb/schools/<slug>/<season>-schedule.html` with `curl -sL` (follow redirects). The `<season+1>` year picker lands on a snapshot after the season ended.
- Slug rule: lowercase, spaces to hyphens, drop punctuation. Exceptions: LSU=louisiana-state, USC=southern-california, Ole Miss=mississippi, TCU=texas-christian, SMU=southern-methodist, BYU=brigham-young, UCF=central-florida, South Florida=south-florida, Pitt=pittsburgh, NC State=north-carolina-state, UConn=connecticut, Miami (FL)=miami-fl, Miami (OH)=miami-oh, Texas A&M=texas-am, Washington State=washington-state.
- Verify the page `<title>` names the school and season before extracting. Wrong slug: fix and refetch once; still wrong, mark the page missing.
- Politeness: sleep at least 4 seconds between Wayback requests; on 429/5xx back off 60s and retry once; two consecutive failures, mark missing and move on.

## Extraction (home-side page)
The schedule table row for each worklist game (match on date). Cells run:
game#, date, time, day, school (with AP rank in parens), site marker, opponent
(with rank), conf, result, points, opp points, ...
We fetch the HOME team's page, so: the school cell's rank must equal our
`home_rank_ap`, the opponent must be our `away_team`, the site marker cell must
be EMPTY (an `@` or `N` there means SR disagrees that this was the visitor's
true road game — that is a discrepancy, report it, do not fix it), the result
is from the home side (home W = our L), and points map home/opp accordingly.

## Output row (data/research/receipts-<slice>.json, one per worklist game)
{ "date", "away_team", "home_team", "season",
  "source_url": the exact wayback URL fetched,
  "quote": the row's cell texts joined with " | ", verbatim after tag-stripping,
  "sr_home_rank": int|null, "sr_away_rank": int|null,
  "sr_home_points": int, "sr_away_points": int, "site_marker": "",
  "status": "confirmed" | "discrepancy" | "page_missing",
  "note": required for any non-confirmed status }
A page with no snapshot yields one page_missing row per worklist game.
Report discrepancies faithfully — a sweep that only confirms is a yes-machine.
