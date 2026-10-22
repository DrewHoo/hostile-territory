# Hostile Territory

Every head coach's true road record against AP top-10 teams since 1936, with a receipt for every game. Live at [drewhoover.com/hostile-territory](https://drewhoover.com/hostile-territory/).

No total on the page was reported by anyone. A road game is one where the team is the away team at a non-neutral site and the host is ranked in the AP poll in effect at kickoff; the record goes to whoever was head coach that day. The rulings are in the page's Method and in `data/rules.json`; the backfill to 1936 is `specs/back-to-1936.spec.md`.

## Data and credit

- Game results 2001 to the present: [cfbfastR](https://github.com/sportsdataverse/cfbfastR-data) schedules (sportsdataverse).
- Game results 1936 to 2000: [jhowell.net](https://www.jhowell.net/cf/scores/byname.htm), James Howell's historical scores.
- Weekly AP polls since 1936: [College Poll Archive](https://www.collegepollarchive.com/).
- Head coaches: researched row by row with a citation each since 1990 (`data/research/tenures-*.json`); before that, CollegeFootballData's coach records checked against every season's results, the work behind [Streak King](https://drewhoover.com/cfb-streak-king/) (`data/coach-stints.json`).
- Receipts: the home team's Sports-Reference schedule page as captured by the Internet Archive's Wayback Machine since 1990; Howell's row and the poll page before that. Overtime counts from ESPN.

The pipeline writes `data/games-candidates.json` (every candidate game), `data/records.json` (per coach, with receipts) and `src/data/site-data*.json` (what the page loads). Corrections are a visible layer in `data/game-corrections.json`, never edits to a source.

## Refresh

`node scripts/refresh.mjs` runs the whole in-season refresh: the current season's schedule and poll pages download again, `build-candidates.mjs` joins games to polls, `build-records.mjs` attributes them to coaches, `fetch-ot.mjs` fills the overtime counts, and `candidate-stats.mjs` reports per season. The bulk sources live under `data/raw/` (gitignored, about 100 MB; `fetch-data.mjs` fills it from empty in about 15 minutes). Commit the four data files it changes. A game played after the bulk fetch can be hand-added in `data/game-corrections.json` and yields to cfbfastR's row when it lands. `CLAUDE.md` has the rest of the runbook (the pre-1990 receipts, the poster, Kiffin's line).

## Deploy

`npm run build` is `vite build` plus `scripts/prerender.mjs`, which bakes the rendered page, the head, the sitemap and `llms.txt` into `dist/`. `.github/workflows/deploy.yml` builds and publishes to GitHub Pages on every push to `main`, and every Sunday morning in season it runs the refresh first, with `data/raw/` restored from the Actions cache, so the week's games land without a commit. `npm run dev` serves it locally.
