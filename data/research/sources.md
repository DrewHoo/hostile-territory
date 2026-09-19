# Pipeline sources and evidence

Phase 1 of `docs/research-plan.md`. Everything here was produced by running
`scripts/fetch-data.mjs`, `scripts/build-candidates.mjs`, and
`scripts/candidate-stats.mjs` on 2026-09-19. Nothing in this file is an agent's
count; every number below is copied out of a script's stdout.

```
node scripts/fetch-data.mjs                      # ~8 min cold, 67 MB into data/raw/
node scripts/build-candidates.mjs                # writes data/games-candidates.json
node scripts/candidate-stats.mjs --kiffin        # per-season report + the cross-check
```

Extra flags worth knowing: `fetch-data.mjs --force --only=polls|games|jhowell`,
`build-candidates.mjs --unmatched` (every team name that resolved to nothing),
`build-candidates.mjs --ambiguous` (the jhowell alternate-site games that phase 3
has to adjudicate), `candidate-stats.mjs --team "Ole Miss"`.

## What got built

`data/games-candidates.json` — **5,323 rows**, seasons 1990–2025. One row per
true road game (away team, site not neutral) where the home team was ranked 1–25
in the AP poll in effect at kickoff. 1,548 rows come from jhowell (1990–2000),
3,775 from cfbfastR (2001–2025). Top-10 is left as a downstream filter.

## Sources chosen

| need | source | why |
| --- | --- | --- |
| games 2001–2025 | `cfbfastR-data` `schedules/csv/cfb_schedules_<year>.csv` | Bulk CSV, no key, carries an explicit `neutral_site` boolean and a venue name. The neutral flag is the whole reason this project can exist without hand-classifying 35 years of kickoff classics. |
| games 1990–2000 | jhowell.net per-team score files | Only bulk source found that encodes site unambiguously for the pre-2001 era, and it encodes it *better* than cfbfastR does (see below). 118 files, one per team that was I-A at some point in 1990–2000. |
| AP polls 1990–2025 | collegepollarchive.com `football/ap/seasons.cfm` | 597 weekly polls, each page carrying its **release date** in the heading and a stable per-team `teamid` in every row. 200 to plain curl, no key. |

### Rejected / not used

- **cfbfastR for 1990–2000.** `schedules/csv/cfb_schedules_<year>.csv` 404s for
  every year before 2001 (verified 1869, 1950, 1978, 1980, 1990, 1995, 2000 →
  all 404; 2001 → 200). `schedules/cfb_games_info.csv` in the same repo starts at
  2002 and stops at 2020, so it adds nothing.
- **Sports-Reference** as a bulk source. 403s to plain curl and it is a
  per-page-per-team crawl, not bulk files. It stays where the research plan put
  it: phase 3 per-game receipts, fetched with a browser.
- **David Wilson's by-date jhowell mirror** (`wilson.engr.wisc.edu/rsfc/history/howell/`,
  linked from jhowell's own index) — connection fails, host gone. The per-team
  files are the live path.
- **A GitHub bulk AP-poll CSV.** Looked for one inside `cfbfastR-data`; the repo
  has `schedules/`, `pbp/`, `rosters/`, `team_info/`, `betting/`, `models/` and no
  rankings directory. collegepollarchive is scraped instead, politely, once, and
  cached in `data/raw/`.
- **The 2026 season.** cfbfastR already publishes `cfb_schedules_2026.csv` (200,
  202 KB) and collegepollarchive has 2026 polls, but the brief scoped games to
  2001–2025 and the 2026 season is four weeks old. Extending is a two-constant
  change at the top of `fetch-data.mjs` (`CFB_LAST`, `POLL_LAST`).

## Coverage evidence

### cfbfastR, rows per season (from `fetch-data.mjs` stdout)

```
2001: 684   2002: 744   2003: 743   2004: 693   2005: 690
2006: 760   2007: 766   2008: 771   2009: 774   2010: 773
2011: 777   2012: 805   2013: 813   2014: 1542  2015: 1491
2016: 1502  2017: 1505  2018: 1511  2019: 1577  2020: 563
2021: 2408  2022: 3657  2023: 3734  2024: 3801  2025: 3831
```

The jump at 2014 and again at 2021 is the file adding FCS, then DII/DIII games.
Division counts across 2001–2025: `fbs 37,292 / fcs 16,969 / iii 9,799 / ii 9,218
/ NA 552`. `build-candidates.mjs` keeps 17,967 games (FBS visitor, both scores
present) and skips 18,940 non-FBS visitors plus 8 unplayed rows. A non-FBS
visitor can't have an in-scope FBS head coach, and a non-FBS *host* can't be
AP-ranked, so neither exclusion can drop a qualifying game.

### jhowell, rows per season, 1990–2000

`rows` counts every game row parsed out of the 118 team files for that season;
`away(@)` counts the rows marked `@`, which are the true road games.

```
1990 rows 1213  away 538     1996 rows 1265  away 565
1991 rows 1212  away 543     1997 rows 1281  away 587
1992 rows 1213  away 548     1998 rows 1288  away 575
1993 rows 1205  away 537     1999 rows 1308  away 582
1994 rows 1217  away 552     2000 rows 1336  away 598
1995 rows 1224  away 558
```

### AP polls, polls per season

```
1990:16 1991:16 1992:17 1993:17 1994:17 1995:17 1996:18 1997:18 1998:16
1999:17 2000:17 2001:17 2002:18 2003:17 2004:16 2005:16 2006:16 2007:16
2008:17 2009:16 2010:16 2011:16 2012:16 2013:17 2014:17 2015:16 2016:16
2017:16 2018:16 2019:17 2020:17 2021:16 2022:16 2023:16 2024:17 2025:17
total 597
```

Every one parsed to exactly 25 ranked teams, and **every ranked team name in all
597 polls resolved through `data/name-aliases.json`** — `--unmatched` reports
zero unresolved names tagged `[ap]`. That is the invariant that matters: an
unresolved poll name would silently un-rank a host and delete qualifying games.

### Rows dropped to unresolved names

269 distinct names resolved to nothing, and they are all small-school hosts:
322 cfbfastR road games and 13 jhowell road games were dropped because the *home*
team had no alias. Tagged `[jhowell]`: Youngstown State (7), Southern Illinois,
Indiana State, Illinois State, Montana, Idaho State, McNeese State — I-AA hosts.
Tagged `[cfbfastR]`: Virginia University of Lynchburg (60), Lincoln (CA) (25),
Stetson (15), Point University (14), and a long tail of the same kind. None of
them has ever appeared in an AP top 25, and by construction they can't: any name
that shares a slug with a resolved AP name resolves.

## Quirks found

### jhowell's site encoding is a three-value system disguised as two

Verified by reading both sides of 1990 games in `Alabama.htm`, `Auburn.htm`,
`Louisville.htm`, `Cincinnati.htm`, `SouthernMississippi.htm`:

- `@` — the listed team played at the opponent's own home venue. **True road game.**
- `vs.` with no location cell — ordinary home game.
- `vs.` **plus** an `@ City, ST` cell — the game was somewhere else, and jhowell
  writes `vs.` on **both** teams' pages. Bowls, kickoff classics, conference
  championships, and alternate "home" stadiums all land here.

Verbatim, the 1990 Fiesta Bowl from each file:

```
Alabama.htm     1/1  vs.  Louisville (10-1-1)  L   7  34  @ Tempe, AZ  Fiesta Bowl
Louisville.htm  1/1  vs.  Alabama (7-5)        W  34   7  @ Tempe, AZ  Fiesta Bowl
```

Two machine-checked consequences, both from `loadJhowellGames(1990, 2000)`:

1. **6,183 `@` rows, 0 of which carry a location cell.** The marker and the
   location cell never contradict each other.
2. **Symmetry holds.** For 6,100 of the 6,183 `@` rows, the opponent's own file
   has the mirror row: same date, marker `vs.`, no location, reversed score.
   0 rows disagree. The remaining 83 are I-A teams playing at I-AA hosts whose
   files aren't in the 118-file set.

So taking only `@` rows gives exactly the true road games *and* de-duplicates for
free — each game appears once, from the visitor's file. No neutral-site
classifier needed for 1990–2000.

**The cost**, and this is the real seam risk: jhowell is *conservative*. It calls
an alternate home stadium neutral for both teams, where cfbfastR/ESPN would call
it a home game and credit the visitor with a road game. 1990–2000 has 917 `vs.`
rows with a location cell; 536 are named games (bowls, "SEC Championship"), 381
are unnamed alternate sites. Top sites:

```
@ Little Rock, AR 71   @ Birmingham, AL 60   @ East Rutherford, NJ 43
@ Philadelphia, PA 32  @ Dallas, TX 30       @ Jacksonville, FL 20
@ Jackson, MS 15       @ Orlando, FL 14      @ Irving, TX 10
```

`build-candidates.mjs --ambiguous` prints the **110 distinct** alternate-site
games where at least one team was AP top-25. Some are genuinely neutral
(Florida–Georgia in Jacksonville, Army–Navy in Philadelphia, Colorado–Colorado
State in Denver). Others are functionally home games and are the concrete list of
possible misses:

```
1993-10-16  #2 Alabama vs #10 Tennessee   @ Birmingham, AL
1997-11-15  Arkansas vs #5 Tennessee      @ Little Rock, AR
1991-08-31  Arkansas vs #3 Miami (FL)     @ Little Rock, AR
```

Alabama at Legion Field accounts for 30 of the 110 and Arkansas at War Memorial
for 14. Phase 3 should rule on each; the count to beat is 110, not 6,183.

### cfbfastR's `start_date` is UTC, which silently poisons the poll join

`start_date` is a UTC instant, so a Saturday night kickoff is stamped Sunday —
and from 2000 on the AP poll comes out on Sunday. Left raw, 23% of games get the
poll published *after* they were played. This is exactly the "rank at game time
vs final rank" failure the research plan names, and it fires by default.

`kickoffDate()` shifts by 8 hours (US Pacific), which is correct for the whole
real kickoff window: 11:00–23:59 UTC stays on its date, 00:00–06:00 UTC moves
back a day. Checked against jhowell's independent dates for the **15,233**
FBS-vs-FBS non-neutral games both sources share, 2001–2025:

```
shift -0h: 11,674/15,233 exact dates (76.64%)   12,836/15,233 same AP poll (84.26%)
shift -3h: 14,861/15,233 (97.56%)               14,901/15,233 (97.82%)
shift -4h: 15,126/15,233 (99.30%)               15,131/15,233 (99.33%)
shift -8h: 15,160/15,233 (99.52%)               15,212/15,233 (99.86%)
```

`-8h` wins on the metric that matters, which is the assigned poll, not the date.
21 games still disagree on the poll, and 20 of those are an artifact of the
cross-check itself: it keys on team-pair-plus-season, so a December conference
championship game matches the October regular-season meeting of the same two
teams. The one real 1-day difference is `2006-10-14 Miami (OH) @ Buffalo`
(cfbfastR Oct 14, jhowell Oct 15).

Rows with `T00:00:00.000Z` are not date-only, they are genuinely UTC: across all
25 seasons the raw date matched jhowell **0 of 1,338 times** and the shifted date
matched **1,337 of 1,338**. 2001 has a second pattern — `T04:00:00.000Z`, which is
midnight Eastern standing in for an unknown kickoff time; `-8h` moves those
Saturday games to Friday. That never crosses a Sunday poll release, so it costs
nothing here, but it is why 2001's exact-date match rate is 544/594 instead of
587/594.

### AP poll dates are release dates, and the release day moved

The label on each poll is when it came out, not what it covers, and the weekday
shifts mid-window:

```
1990  Preseason  September 4 (Tue)  September 11 (Tue) …  December 4 (Tue)  Final
2000  Preseason  August 27 (Sun)    September 3 (Sun)  …  December 3 (Sun)  Final
2019  Preseason  September 3 (Tue)  September 8 (Sun)  …  December 8 (Sun)  Final
```

1990–1999 is a Tuesday poll; 2000 onward is Sunday, except that the first dated
poll of the year is still a Tuesday (after a Thursday/Saturday week-1 slate).
`pollAtKickoff()` takes the latest poll with `date <= game date`, which is right
under both regimes: in the Tuesday era a Saturday game uses that week's Tuesday
poll; in the Sunday era it uses that morning's Sunday poll, and a Labor Day
Monday game uses the Sunday poll released the day before.

Two labels carry no date, so the script assigns one:

- **Preseason** → `<season>-08-01`, before any game. 272 rows sit on a preseason
  poll, which is the late-August/Labor-Day slate.
- **Final** → `<season+1>-02-01`, after every bowl. **0 rows** land on a Final
  poll, which is the check that the season's last poll never leaks backward onto
  a bowl game. (It couldn't anyway — bowls are neutral and excluded.)

"Others receiving votes" rows are on the same page and are correctly ignored: a
ranked row wraps its rank in `<strong>`, an unranked row's rank cell is the bare
string `NR`. That is why Holy Cross (11-0, Patriot League, on the 1991-12-02
page) never became a ranked team.

### Small ones

- jhowell filenames contain parentheses — `Miami(Florida).htm`, `Miami(Ohio).htm`.
  The first version of the index regex excluded `(`/`)` and silently dropped both
  Miamis; the symmetry check caught it as 192 missing mirror rows.
- jhowell's season header is `<a name=1999>1999-Miami (Ohio) (MAC)</a>`. The team
  name itself has parentheses, so the conference is the *last* parenthetical.
- jhowell serves windows-1252, cfbfastR serves UTF-8. `fetch-data.mjs` writes raw
  bytes and each reader picks its own encoding; decoding at fetch time turned
  `San José State` into `San JosÃ© State`.
- cfbfastR reorders columns: `home_division`/`home_conference` swap places in
  2025. Everything is parsed by header name.
- cfbfastR itself uses two names for the same team in different seasons —
  `Southern Miss`/`Southern Mississippi`, `Connecticut`/`UConn`,
  `Massachusetts`/`UMass`, `UTSA`/`UT San Antonio`, `Louisiana Monroe`/`UL Monroe`.
  The alias map is not just a cross-source concern.
- jhowell's team names are the 1990s formal ones: `Mississippi` (not Ole Miss),
  `Southern California`, `Louisiana State`, `Texas Christian`, `Texas-El Paso`,
  `Brigham Young`, `Central Florida`, `Nevada-Las Vegas`, `Middle Tennessee State`.

## Sanity report

From `candidate-stats.mjs`. Median per season: 149 top-25, 60 top-10. **No season
flagged** — none zero, none above 2× the median.

```
season  source     top25  top10   top10 W-L-T
1990    jhowell      138     60   12-47-1
1991    jhowell      138     61   7-54-0
1992    jhowell      138     60   8-49-3
1993    jhowell      142     58   7-51-0
1994    jhowell      142     58   8-48-2
1995    jhowell      150     62   10-52-0
1996    jhowell      139     58   8-50-0
1997    jhowell      143     62   8-54-0
1998    jhowell      138     56   6-50-0
1999    jhowell      137     57   7-50-0
2000    jhowell      143     53   4-49-0
2001    cfbfastR     153     61   10-51-0
2002    cfbfastR     181     67   11-56-0
2003    cfbfastR     165     67   11-56-0
2004    cfbfastR     149     60   7-53-0
2005    cfbfastR     146     63   13-50-0
2006    cfbfastR     160     67   9-58-0
2007    cfbfastR     156     69   16-53-0
2008    cfbfastR     143     57   6-51-0
2009    cfbfastR     150     56   8-48-0
2010    cfbfastR     144     56   7-49-0
2011    cfbfastR     155     64   11-53-0
2012    cfbfastR     151     59   7-52-0
2013    cfbfastR     149     61   7-54-0
2014    cfbfastR     153     57   11-46-0
2015    cfbfastR     155     60   12-48-0
2016    cfbfastR     140     57   8-49-0
2017    cfbfastR     140     64   5-59-0
2018    cfbfastR     145     63   6-57-0
2019    cfbfastR     152     61   5-56-0
2020    cfbfastR     118     41   6-35-0
2021    cfbfastR     151     58   6-52-0
2022    cfbfastR     155     56   7-49-0
2023    cfbfastR     149     58   6-52-0
2024    cfbfastR     157     69   9-60-0
2025    cfbfastR     158     63   9-54-0
```

The seam is the healthiest thing in this file: median top-25 139 for 1990–2000
against 151 for 2001–2025, ratio **0.92**. The 8% gap is the jhowell
alternate-site convention plus a smaller FBS (106 teams in 1990, 136 in 2025).

Distribution checks, all flat where flat is what you want:

```
home rank 1..25: 220 228 200 209 223 223 224 210 213 209 206 203 216
                 210 203 221 220 213 220 215 212 181 207 217 220
ranked visitor in 1,449 of 5,323 rows (27.2%)
poll in effect: 272 rows preseason, 0 rows Final
postseason rows: 8
```

The 8 postseason rows are exactly the CFP first-round campus games, which
`data/rules.json` counts as road:

```
2024-12-20  Indiana at #3 Notre Dame       L 17-27  Notre Dame Stadium
2024-12-21  Clemson at #4 Texas            L 24-38  DKR-Texas Memorial Stadium
2024-12-21  SMU at #5 Penn State           L 10-38  Beaver Stadium
2024-12-21  Tennessee at #6 Ohio State     L 17-42  Ohio Stadium
2025-12-19  Alabama at #8 Oklahoma         W 34-24  Memorial Stadium (Norman, OK)
2025-12-20  James Madison at #5 Oregon     L 34-51  Autzen Stadium
2025-12-20  Miami (FL) at #7 Texas A&M     W 10-3   Kyle Field
2025-12-20  Tulane at #6 Ole Miss          L 10-41  Vaught-Hemingway Stadium
```

Spot checks against games I can name:

```
1990-11-03  #16 Georgia Tech 41 at #1 Virginia 38      W   jhowell
2007-10-06  Stanford 24 at #2 USC 23                   W   cfbfastR
2019-09-07  #6 LSU 45 at #9 Texas 38                   W   cfbfastR
2019-11-09  #1 LSU 46 at #2 Alabama 41                 W   cfbfastR
```

### Independent second read of 2001–2025

jhowell's files run to the present, so the same join was run on jhowell data for
2001–2025 as a check on cfbfastR: 3,504 qualifying games against cfbfastR's
3,775, a 7.2% shortfall. Broken down, 287 cfbfastR rows are absent from the
jhowell pass and **188 of them are visitors whose jhowell file was never
downloaded** — `fetch-data.mjs` only pulls teams that were I-A in 1990–2000, so
Troy (28), Florida Atlantic (23), Air Force (15), Western Kentucky (14),
Appalachian State (13), UMass (13), UTSA (11), Georgia State (11) and the rest of
the modern FBS have no file. The other 99 are jhowell's alternate-site
convention. So this is a coverage artifact of the download filter, not a source
disagreement — but it does mean the jhowell pass cannot be used as a real
two-directional count until the full ~300-file set is pulled.

## Kiffin cross-check

The known answer: an ESPN graphic put Lane Kiffin at **1-8** in true road games
against AP top-10 teams. `candidate-stats.mjs --kiffin` runs the filter twice,
because the tenure end date turns out to be the thing in dispute.

**Brief as written (Tennessee 2009, USC 2010–13, FAU 2017–19, Ole Miss 2020–24) →
8 games, 1-7.** One loss short.

**Same list with Ole Miss extended through 2025 → 9 games, 1-8. Exact match.**

```
2009-09-19  Tennessee         at # 1 Florida       L 13-23
2009-10-24  Tennessee         at # 1 Alabama       L 10-12
2011-11-19  USC               at # 4 Oregon        W 38-35
2017-09-09  Florida Atlantic  at # 9 Wisconsin     L 14-31
2018-09-01  Florida Atlantic  at # 7 Oklahoma      L 14-63
2019-08-31  Florida Atlantic  at # 5 Ohio State    L 21-45
2021-10-02  Ole Miss          at # 1 Alabama       L 21-42
2023-11-11  Ole Miss          at # 1 Georgia       L 17-52
2025-10-18  Ole Miss          at # 9 Georgia       L 35-43
```

The missing ninth game is **2025-10-18, Ole Miss at #9 Georgia, L 35-43**. So the
brief's `Ole Miss 2020–24` is the wrong end date, not the pipeline. Phase 2 owns
the real tenure row; this is a hint, not a finding.

Two things worth flagging for phase 3:

- **The date fix moved a rank inside this very list.** Before `kickoffDate()`,
  USC's 2011 win at Oregon was dated 2011-11-20 and scored against the poll
  released *that Sunday*, showing Oregon at **#9**. Correctly dated 2011-11-19 it
  is **#4**. Same nine games either way — but if it had straddled the top-10 line
  the cross-check would have broken for a reason having nothing to do with
  Kiffin.
- **Nothing was forced.** Kiffin's full top-25 road slate is 21 games, and the
  near-misses are honest: 2023-09-23 at **#13** Alabama and 2024-10-12 at **#13**
  LSU. If ESPN's graphic had been built off the Coaches poll or a CFP ranking,
  one of those could have been counted, which is why `data/rules.json` pins the
  definition to AP.

## Open problems

1. **The 110 jhowell alternate-site games** (`--ambiguous`). Alabama's Legion
   Field and Arkansas's War Memorial games are the likeliest real misses for
   1990–2000. Each needs a ruling; the pipeline currently excludes all of them.
2. **The jhowell download filter.** Only 118 of ~300 team files are pulled, which
   is complete for 1990–2000 I-A but blocks using jhowell as a genuine second
   read of 2001–2025. Widening it is one predicate in `fetchJhowell()`.
3. **2001's `T04:00:00.000Z` rows.** Harmless for the poll join, but 50 games in
   2001 carry a date one day early. Any downstream feature that shows the date
   should know.
4. **`week` is not one number.** cfbfastR's own `week` for 2001–2025 — which
   restarts at 1 for postseason games, so the CFP campus rows read `week: 1`. For
   1990–2000 it's a computed calendar week (weeks since the season's first game).
   Usable for grouping within a source, not comparable across the seam, and not
   safe to sort on. Sort on `date`.
5. **2020 is legitimately small** (118 top-25 road games vs a 149 median) and not
   flagged, because COVID. Any season-over-season chart needs to say so.
6. **The 2026 season is not in the data** and the site will be read during it.
