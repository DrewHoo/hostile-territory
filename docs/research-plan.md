# Research plan: road records vs AP top-10, 1990–present

The question: for head coaches of power-conference schools since 1990, what is their record in true road games against teams ranked in the AP top 10 at kickoff? The trigger was an ESPN factoid that Lane Kiffin is 1-8 on the road against top-10 teams. Top-25 splits ride along as a secondary cut.

## Inversion

The naive framing is "research every coach's road record," which is unbounded and asks agents to count. The fixed list on the other side of the join is coach tenures: every head-coaching tenure at a power-conference school since 1990, a few hundred rows. Games are computed from structured sources, not researched. The join is in code:

```
tenures (researched)  ×  games with AP rank at kickoff (computed)  →  join on team + date  →  records
```

No agent ever reports a win-loss total. A wrong record can only come from a wrong tenure row or a wrong game row, and both are auditable one row at a time.

## Definitions (versioned in data/rules.json)

- **Road game**: the team is the away team and the site is not neutral. Bowls, kickoff classics, and conference championship games are neutral and excluded. CFP first-round campus games count.
- **Top-10 at kickoff**: the opponent is ranked 1–10 in the most recent AP poll published before the game. Preseason poll covers week 1. AP only, not Coaches and not CFP rankings; ESPN mixes these, we don't.
- **Since 1990**: the 1990 season onward, including postseason games attached to a season.
- **Coach of record**: whoever was head coach on the game date. Interim coaches count as themselves and carry an interim flag.
- **In scope**: any coach with an FBS head-coaching tenure that overlaps a school-season in a power conference (see rules.json for the conference-era table; pre-1996 the equivalents are Big 8, SWC, Big East football, and the major independents). All of a scoped coach's FBS head-coaching games count toward their record, including G5 stints, because that is how the ESPN-style stat works.

## Sources (validated 2026-09-19)

| need | source | status |
| --- | --- | --- |
| Games 2001–2025 (venue, neutral flag, scores) | cfbfastR-data GitHub CSVs (`schedules/csv/cfb_schedules_<yr>.csv`) | 200, has `neutral_site`, no key needed |
| Games 1990–2000 | jhowell.net scores archive (redirects to https), Sports-Reference as fallback | 301→live |
| Weekly AP polls 1990–2025 | collegepollarchive.com | 200 to plain curl |
| Coach tenures + mid-season change dates | Wikipedia "List of X head football coaches" pages, school sources, news for change dates | curl-able |
| Per-game verification receipts | Sports-Reference season schedule pages (show opponent rank at game time, @/N site, result) | 403 to curl; needs browser or real UA |

## Phases

1. **Pipeline (agent, code)**: fetch the bulk sources, normalize team names into `data/name-aliases.json`, align poll weeks to game dates, emit `data/games-candidates.json` — every true road game since 1990 where the home team was AP top-25 at kickoff (top-10 is a filter downstream). Journal source decisions in `data/research/sources.md`.
2. **Tenures (5 agents by conference)**: every HC tenure at the in-scope schools since 1990, with season ranges, exact dates for mid-season changes, and a verbatim quote + URL per row. Output `data/research/tenures-<conf>.json`.
3. **Verification fleet (after 1+2)**: per-coach sweeps against Sports-Reference. Every qualifying game gets a receipt (the verbatim schedule line + URL). Agents report rejections too: candidate games that shouldn't qualify, and games the pipeline missed. Named failure modes to hunt: neutral-site games misclassified as road (NFL stadiums, kickoff classics), rank at game time vs final rank, poll-week misalignment around bye weeks, team-name aliases, wrong coach around a mid-season firing.
4. **Merge + coverage (code)**: dedupe merges, then `scripts/coverage-report.mjs`:
   - every in-scope school has continuous coach coverage 1990→present, no date gaps
   - qualifying-game counts computed from both directions (road team's schedule vs top-10 team's home slate) match
   - the Kiffin row reproduces 1-8, or the discrepancy is documented with the specific games
   - no name-variant splits across tenures (same coach spelled two ways)
   - every displayed row's quote string-matches its fetched source
5. **Build**: the viz, styled per the chosen look, copy drafted by a separate agent.

## Evidence format

Every researched row carries `source_url`, `quote` (verbatim from the source), and `grade` (`primary` for a schedule line or staff announcement, `secondary` for an aggregate someone else computed). Grades render in the UI; mixing them silently is how a reader loses trust when one soft claim breaks.
