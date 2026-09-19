# Big Ten tenure research notes

Beat: the 18 schools in `data/rules.json` → `school_assignments["big-ten"]`. Coverage 1990 season through the 2026 season in progress (as of 2026-09-19). 160 rows in `tenures-big-ten.json`.

## Method and grading

Every row is sourced to an English Wikipedia page — the school's "List of X head football coaches" article for the tenure spine, the coach's own article for the season-range quote, and the relevant "YYYY School football team" article for anything that turned over mid-season. Mid-season game dates come from the season article's schedule table (`CFB schedule entry` rows), cross-checked against the coach's own article and the game-count split implied by the interim's win-loss record on the school's coach list. Where the two disagreed I went with the school's own coach list and recorded the conflict under **Rejected claims**.

**Every one of the 160 quotes was re-fetched and string-matched** against `action=parse` rendered text of its `source_url` (HTML stripped, reference markers removed, whitespace collapsed). 160/160 match. Quotes use the exact Unicode the page serves, including en dashes and the `1⁄3` fraction glyph in the Chris Ash row — do not "clean" them or the check breaks.

**All 160 rows are graded `secondary`, and that is deliberate.** Wikipedia is an aggregator, so by the project's own definition it cannot be primary. The obvious primary upgrades are not re-fetchable, which is the whole point of the mechanical quote check: `espn.com` returns 202 with an empty body to plain curl, `apnews.com` 403s, `washingtonpost.com` hangs, `mlive.com` 403s, and the Seattle Times article cited by Wikipedia's Washington list is now a 404. A quote that cannot be re-fetched fails verification by design, so pinning rows to those stories would make the file *look* better-sourced while being less auditable. Two curl-able primary paths do exist if someone wants to upgrade a subset later: official athletics sites (`msuspartans.com` serves the Pat Fitzgerald hiring announcement at 200) and `cbssports.com` (200). Everything else needs a browser.

## Ambiguities — rows the games pipeline must resolve

These are real forks, not hedging. In each case I emitted the row with dates and left the conflict visible rather than silently picking a side.

### 1. Michigan, 2023-11-11 — the one that changes a record

The Big Ten barred Jim Harbaugh from game-day coaching for the final three regular-season games of 2023 (sign-stealing). Sherrone Moore was the acting head coach on the sideline for all three. The NCAA's coaching records — and therefore Wikipedia's Michigan list — **credit those three games to Harbaugh**, while crediting the three September suspension games to the interims who coached them. That is internally inconsistent, and one of the three November games is exactly the kind of game this project measures:

- 2023-11-11 Michigan **at** Penn State — true road game, Penn State ranked **AP #9** at kickoff (College Poll Archive's Nov 12, 2023 AP poll annotates Michigan's prior result as `W 24-15 A #9 Penn State`).
- 2023-11-18 at Maryland — road, Maryland unranked.
- 2023-11-25 vs Ohio State — home, does not qualify.

So the Harbaugh-or-Moore decision moves exactly one qualifying road-vs-top-10 game, and it moves it between two coaches who both have small samples. The file carries a `Sherrone Moore` interim row dated `2023-11-11` → `2023-11-25` that **overlaps** Harbaugh's season-level `2015–2023` row. Pick one and say which in the UI; do not let both rows claim the game.

### 2. Michigan, 2023-09-09 — one game, two coaches

Jay Harbaugh was acting head coach for the first half against UNLV and Mike Hart for the second half. Two rows share the date `2023-09-09`. There is no correct single attribution. It is a home game against UNLV, so it cannot qualify as a road game and the ambiguity is harmless — but a naive dedupe on (school, date) will trip over it.

### 3. Minnesota, 2013 — Claeys's unlisted acting stretch

Jerry Kill had a seizure before the 2013-10-05 game at Michigan and Tracy Claeys coached that entire game; Kill then took an open-ended leave announced 2013-10-10 and, per his own article, "returned to the field for the 2014 football season." Minnesota's own coach list credits Kill with all 58 of his games including every 2013 game and does not list Claeys for 2013 at all. The file carries a `Tracy Claeys` interim row `2013-10-05` → `2013-12-27` that overlaps Kill's `2011–2015` row. Road exposure in that window: at Michigan (2013-10-05, Michigan ranked but outside the top 10), at Northwestern, at Indiana, at Michigan State, plus the Texas Bowl. Top-25 splits are affected; top-10 probably is not.

### 4. Rutgers, 2015 — a suspension, not a firing

Kyle Flood served a three-game suspension and returned. Norries Wilson coached 2015-09-19 (at Penn State), 2015-09-26, and 2015-10-10. Rutgers' own list numbers Wilson as coach #31 with a dagger rather than marking him "Int." — I set `interim: true` because he was covering a suspension and Flood came back. Flood's row is season-level `2012–2015` and **overlaps** Wilson's dated row; the 2015-09-19 trip to Penn State is the only road game in the window.

### 5. Ohio State, 2018 — Day's three games are double-claimed

Ryan Day was acting head coach for games 1–3 of 2018 during Urban Meyer's suspension, and Ohio State's own list states explicitly that Day's statistics include those three games. Meyer's `2012–2018` row therefore overlaps Day's dated `2018-09-01` → `2018-09-15` row. All three games were home or neutral (TCU at AT&T Stadium), so there is no road exposure and the overlap is cosmetic.

### 6. The 2011 Pac-12 Championship Game breaks the neutral-site rule

`rules.json` says conference championship games are neutral and excluded. The 2011 Pac-12 title game was played **at Oregon's Autzen Stadium** — a campus site, with UCLA as the visitor. I pinned Rick Neuheisel's `end_date` to 2011-12-02 because that is genuinely his last game, but the games pipeline needs a carve-out: early Pac-12 championship games (and the 2011 edition specifically) were hosted on campus, not at a neutral site. If the rule is applied literally, UCLA loses a true road game at a ranked Oregon.

### 7. Postseason dates cross the calendar year

Six rows carry a January date attached to the prior season. `start_season`/`end_season` follow the **season**, not the calendar:

| row | season | date |
| --- | --- | --- |
| Michigan State, Bobby Williams (start) | 1999 | 2000-01-01 |
| Penn State, Tom Bradley (end) | 2011 | 2012-01-02 |
| Purdue, Patrick Higgins | 2012 | 2013-01-01 |
| Wisconsin, Barry Alvarez | 2012 | 2013-01-01 |
| Wisconsin, Barry Alvarez | 2014 | 2015-01-01 |
| Purdue, Brian Brohm | 2022 | 2023-01-02 |

### 8. Sherrone Moore's 2024–2025 row is not contiguous

Moore's `2024–2025` row spans a stretch in which he did not coach three games: 2025 games 3 and 4 (self-imposed suspension) and the bowl (fired 2025-12-10). Biff Poggi's two dated rows cover those. Anyone expanding Moore's row into a date range must subtract the Poggi dates.

### 9. Wisconsin's Luke Fickell start season

Wikipedia's Wisconsin list and Fickell's own article both say "2022–present" because he was hired in November 2022 — but Jim Leonhard coached the 2022 bowl. Fickell's first game as Wisconsin head coach was the 2023 opener, so the row uses `start_season: 2023`.

### 10. Maryland 2018: D. J. Durkin coached zero games

Durkin was placed on administrative leave 2018-08-11, before the opener, and fired 2018-10-31 without coaching a game that season. Matt Canada coached all 12. Maryland's own list still shows Durkin as "2016–2018"; the row ends at `2017` so the seasons partition cleanly and no mid-season dates are needed.

### 11. Cross-beat spillover (not my rows, but they exist)

`rules.json` says all of a scoped coach's FBS head-coaching games count. Several Big Ten coaches have FBS stints that belong to other beats and will be missed if nobody claims them — most notably **Jerry Kill was interim head coach at TCU for the final four games of the 2021 season**, which sits in the big-12 beat's TCU list. Also worth a merge check: Chip Kelly (Oregon + UCLA), Rick Neuheisel (Colorado + Washington + UCLA), Steve Sarkisian (Washington + USC + Alabama), Bret Bielema (Wisconsin + Arkansas + Illinois), Luke Fickell (Ohio State + Cincinnati + Wisconsin), Jedd Fisch (UCLA + Arizona + Washington), Mike Riley (Oregon State + Nebraska), Bo Pelini (Nebraska + Youngstown State, FCS so out of scope), Kyle Whittingham (Utah + Michigan), Pat Fitzgerald (Northwestern + Michigan State), Tim Skipper (Fresno State + UCLA), Lane Kiffin (Tennessee + USC + FAU + Ole Miss).

### 12. Illinois, Bill Cubit's interim flag

Cubit was named interim on 2015-08-28 after Tim Beckman was fired in the preseason, then promoted full-time late in the year and dismissed 2016-03-05. Illinois' own list numbers him as coach #25 rather than "Int.", so `interim: false`. Same person either way, so no date split is needed — but a display that keys off the interim flag will show him as a full-time coach who never coached a full-time game.

## Rejected claims — things a source said that I disproved

1. **Ralph Friedgen "2000 to 2010" at Maryland** (his own article's lead). Maryland's coach list has him at 1997–2000 → Vanderlinden, then Friedgen 2001–2010; he was hired in December 2000 and his first game was in 2001. Row uses `2001`. The quote on that row still says "from 2000 to 2010" because it is verbatim — the row is right, the sentence is loose.
2. **D. J. Durkin "began serving as the head coach ... in 2015"** (his own article). He was hired in December 2015; first season 2016. Row uses `2016`.
3. **"The Huskies were led by second year head coach Jimmy Lake for the first ten games"** (2021 Washington season article). Wrong. Bob Gregory's article: "Gregory took over as interim head coach at Washington on November 14, 2021 ... Gregory also coached in Lake's place the day prior while Lake was serving a suspension." Gregory coached game 10 (2021-11-13 vs Arizona State) as well as games 11–12. Lake coached **nine**. Row uses Lake `end_date: 2021-11-06` and Gregory `2021-11-13` → `2021-11-26`. Note also that Wikipedia's "List of Washington Huskies head football coaches" omits Gregory entirely — if another agent builds Washington from that list alone, the last three games of 2021 land on the wrong coach.
4. **"MSU president M. Peter McPherson fired Perles before the end of the 1994 season"** (Michigan State Spartans football article). Reads like a mid-season handoff; it is not. The 1994 season article: "Perles was fired on November 8, although he was allowed to coach the remaining games on the schedule." No interim, no dates on the Perles row.
5. **John Gutekunst "from 1985 to 1991" at Minnesota** (his own article). Minnesota's own list has 1986–1991 — he took over for the 1985 Independence Bowl after Lou Holtz left. Pre-1990 so it does not affect this beat; row uses `1986` to match the school list.
6. **Jim Tressel "the Youngstown State Penguins and later the Ohio State Buckeyes from 1986 to 2010"** (his article's lead). A merged range that reads as though he coached Ohio State from 1986. He succeeded John Cooper in 2001. Row uses `2001–2010` and quotes a body sentence instead of the lead.
7. **Luke Fickell hired by Wisconsin "On November 21"** (2022 Wisconsin season article) vs. the ESPN story dated **November 27, 2022** cited by Wikipedia's Wisconsin coaches list. Unresolved six-day conflict; neither page should be trusted alone for the hire date. Irrelevant to game attribution because Fickell coached no 2022 games.
8. **Chip Kelly, section heading "UCLA (2018–2024)"** (his article). He coached his last UCLA season in 2023 and left in February 2024 for Ohio State's staff; UCLA's own list says 2018–2023 with DeShaun Foster starting in 2024. Row uses `2023`.
9. **Michigan coach list footnote: Moore was "fired before the 2025 Citrus Bowl."** That wikilink points at the January 1, 2025 Citrus Bowl, a game Michigan did not play. Michigan's 2025 bowl was played **2025-12-31** vs Texas at Camping World Stadium per the 2025 season schedule. Row uses `2025-12-31`.
10. **Tom Allen "head coach at Indiana from 2017 to 2023"** (his lead) vs Indiana's own list (`2016–2023`) and the body of his own article, which says he was named head coach 2016-12-01 and made his debut in the 2016 Foster Farms Bowl. Row uses `start_season: 2016`, `start_date: 2016-12-28`.

## Coach-name spelling variants

Canonical spelling on the left; variants seen in sources on the right.

| canonical (used in the file) | variants encountered |
| --- | --- |
| Mike Locksley | Michael Locksley (Maryland athletics style), "Mike Locksley" (Wikipedia, media) |
| Jim L. Mora | Jim Mora, Jim Mora Jr. (Wikipedia disambiguates from his father, Jim E. Mora) |
| D. J. Durkin | DJ Durkin, D.J. Durkin |
| P. J. Fleck | PJ Fleck |
| John L. Smith | John Smith (ambiguous — two other Smiths in this file) |
| Jonathan Smith | Jonathan Smith (American football coach) — distinct from Michigan State's later hire |
| Terry Smith | Wikipedia title is "Terry Smith (American football, born 1969)"; Penn State lists him as associate head coach |
| Rod Smith | Wikipedia title "Rod Smith (American football coach)"; Illinois' 2020 staff page shows "Rod Smith — Interim; final game". Note Illinois had **both** Lovie Smith and Rod Smith in 2020, and the 2020 season article's sentence "Prior to the team's final game, Smith was fired as head coach" refers to Lovie |
| Mike Hart | Wikipedia title "Mike Hart (American football)" |
| Ron Turner | Wikipedia title "Ron Turner (American football)" |
| Kevin Wilson | Wikipedia title "Kevin Wilson (American football)" |
| Tom Allen | Wikipedia title "Tom Allen (American football)" |
| Randy Walker | Wikipedia title "Randy Walker (American football coach)" |
| Larry Smith | Wikipedia title "Larry Smith (American football coach)" |
| Bill Callahan | Wikipedia title "Bill Callahan (American football coach)" |
| Mark Helfrich | Wikipedia title "Mark Helfrich (American football)" — the bare "Mark Helfrich" is a disambiguation page |
| Tim Skipper | Wikipedia title "Tim Skipper (American football)" — the bare name is a disambiguation page |
| Bob Gregory | Wikipedia title "Bob Gregory (American football)" — not to be confused with NFL player Bob Gregor |
| Matt Campbell | Wikipedia title "Matt Campbell (American football coach)" |
| Bill O'Brien | Wikipedia title "Bill O'Brien (American football)" |
| Ryan Walters | Wikipedia title "Ryan Walters (American football)" |
| David Braun | Wikipedia title "David Braun (American football)" |
| Patrick Higgins | Wikipedia title "Patrick Higgins (American football)"; some Purdue sources use "Pat Higgins" |
| Jedd Fisch | frequently misspelled "Jedd Fische"/"Jed Fisch" in secondary coverage |

## Coaches appearing more than once in this file

Any dedupe pass must keep these separate rather than merging on name:

- **Barry Alvarez** — Wisconsin ×3 (1990–2005 full, plus two one-game bowl interims: 2013-01-01 and 2015-01-01)
- **Sherrone Moore** — Michigan ×3 (one 2023 acting game, the disputed 2023 November stretch, 2024–2025 full)
- **Biff Poggi** — Michigan ×2 (2025 suspension games, 2025 bowl)
- **Clay Helton** — USC ×2 (2013 bowl interim, 2015–2021 full)
- **Bo Pelini** — Nebraska ×2 (2003 bowl interim, 2008–2014 full)
- **Tracy Claeys** — Minnesota ×2 (2013 acting stretch, 2015–2016 full)
- **Mike Locksley** — Maryland ×2 (2015 interim, 2019–present)
- **Greg Schiano** — Rutgers ×2 (2001–2011, 2020–present)
- **Ryan Day** — Ohio State ×2 (2018 acting stretch, 2019–present)
- Across schools: Chip Kelly (Oregon, UCLA), Rick Neuheisel (Washington, UCLA), Steve Sarkisian (Washington, USC), Bret Bielema (Wisconsin, Illinois), Luke Fickell (Ohio State, Wisconsin), Jedd Fisch (UCLA, Washington), Pat Fitzgerald (Northwestern, Michigan State)

## Coverage check

Ran a season-by-season scan: every one of the 18 schools has at least one row covering every season from 1990 through 2026, no gaps. Exactly one row per school has `end_season: null`, and the 18 current coaches were each confirmed against that school's "2026 ... football team" article infobox: Bielema (ILL), Cignetti (IND), Ferentz (IOWA), Locksley (MD), Whittingham (MICH), Fitzgerald (MSU), Fleck (MINN), Rhule (NEB), Braun (NW), Day (OSU), Lanning (ORE), Campbell (PSU), Odom (PUR), Schiano (RUT), Chesney (UCLA), Riley (USC), Fisch (WASH), Fickell (WIS). No school has had an in-season change through the first three weeks of 2026.

Seven schools changed head coach between the 2025 and 2026 seasons, which is unusually heavy and worth re-verifying before the viz ships: Michigan (Moore fired 2025-12-10 → Whittingham), Michigan State (Jonathan Smith fired 2025-11-30 → Fitzgerald 2025-12-01), Penn State (Franklin fired 2025-10-12 → Terry Smith interim → Campbell 2025-12-05), UCLA (Foster fired 2025-09-14 → Skipper interim → Chesney 2025-12-06).
