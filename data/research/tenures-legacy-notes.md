# Tenure research notes — legacy & independents

Beat: Oregon State, Washington State, Notre Dame, Temple, UConn, South Florida, Rice.
Coverage: every head-coaching tenure overlapping the 1990 season through the 2026 season in progress (as of 2026-09-19).
Output: `data/research/tenures-legacy.json` — 70 rows.

| school | rows | interim rows | mid-season handoffs pinned |
| --- | --- | --- | --- |
| Oregon State | 12 | 3 | 3 |
| Washington State | 10 | 2 | 3 |
| Notre Dame | 7 | 1 | 2 |
| Temple | 13 | 3 | 3 |
| UConn | 11 | 3 | 3 |
| South Florida | 10 | 3 | 3 |
| Rice | 7 | 1 | 1 |
| **total** | **70** | **16** | **18** |

All 70 quotes were mechanically re-checked as substrings of their fetched `source_url`
(whitespace-insensitive, because Wikipedia's rendered HTML injects whitespace around inline
links). 70/70 pass.

Coverage is continuous 1990→2026 for every school except South Florida, whose program did not
exist before 1997 — the 1990–1996 gap there is real, not missing research.

## Mid-season handoffs

18 within-season changes, all with the outgoing coach's last game and the incoming coach's first
game pinned to a date. Two flavors:

**In-season firing/resignation with regular-season games left (8).** Dates come from the school's
season article schedule table, cross-checked against the games-coached split stated in the same
article's infobox and against the coach's own article.

| school | out → in | out's last game | in's first game | firing/resignation date |
| --- | --- | --- | --- | --- |
| Oregon State 2017 | Gary Andersen → Cory Hall | 2017-10-07 | 2017-10-14 | Oct 9, 2017 |
| Oregon State 2025 | Trent Bray → Robb Akey | 2025-10-11 | 2025-10-18 | Oct 12, 2025 |
| Washington State 2021 | Nick Rolovich → Jake Dickert | 2021-10-16 | 2021-10-23 | Oct 18, 2021 |
| Temple 2024 | Stan Drayton → Everett Withers | 2024-11-16 | 2024-11-22 | Nov 17, 2024 |
| UConn 2013 | Paul Pasqualoni → T. J. Weist | 2013-09-28 | 2013-10-12 | Sep 30, 2013 |
| UConn 2021 | Randy Edsall → Lou Spanos | 2021-09-04 | 2021-09-11 | Sep 6, 2021 |
| South Florida 2022 | Jeff Scott → Daniel Da Prato | 2022-11-05 | 2022-11-12 | Nov 6, 2022 |
| Rice 2024 | Mike Bloomgren → Pete Alamar | 2024-10-26 | 2024-11-02 | Oct 27, 2024 |

**Coach leaves after the regular season, someone else coaches the bowl (10).** These are still
within-season under `rules.json` ("postseason included with its season"), so they are dated too.
Every one of these bowl games is a neutral-site game and therefore cannot produce a qualifying
road game — they matter only for making sure the outgoing coach's regular-season games are not
mis-attributed and for tenure-coverage continuity.

Oregon State 2023 (Jonathan Smith → Kefense Hynson, Sun Bowl 2023-12-29) ·
Washington State 2024 (Jake Dickert → Pete Kaligis, Holiday Bowl 2024-12-27) ·
Washington State 2025 (Jimmy Rogers → Jesse Bobbit, Famous Idaho Potato Bowl 2025-12-22) ·
Notre Dame 2004 (Tyrone Willingham → Kent Baer, Insight Bowl 2004-12-28) ·
Notre Dame 2021 (Brian Kelly → Marcus Freeman, Fiesta Bowl 2022-01-01) ·
Temple 2016 (Matt Rhule → Ed Foley, Military Bowl 2016-12-27) ·
Temple 2018 (Geoff Collins → Ed Foley, Independence Bowl 2018-12-27) ·
UConn 2025 (Jim L. Mora → Gordon Sammis, Fenway Bowl 2025-12-27) ·
South Florida 2016 (Willie Taggart → T. J. Weist, Birmingham Bowl 2016-12-29) ·
South Florida 2025 (Alex Golesh → Kevin Patrick, Cure Bowl 2025-12-17).

Single-game bowl interims carry **both** `start_date` and `end_date` set to that one game's date.
The second date is a season boundary rather than a mid-season change, so it is technically beyond
what the rules require; it is set deliberately so the one-game window is unambiguous.

## Rejected claims

Things a source asserted that were checked and found wrong.

1. **Rice's coach list omits an entire interim tenure.** `List of Rice Owls head football coaches`
   (redirects to `Rice Owls football`) shows "Mike Bloomgren | 2018–2024 | 22–46" with no interim
   row at all, and the 68 games implied by that record cannot cover the 82 games Rice played
   2018–2024. Both `2024 Rice Owls football team` ("hc_games = first 8 games" / "Pete Alamar …
   interim; final 4 games") and Bloomgren's own article ("Rice fired Bloomgren on October 27, 2024,
   after a 2–6 start") show Bloomgren coached 8 games and Alamar the last 4. Added the Alamar row;
   the Rice list page is the single worst list page in this beat.
2. **UConn's coach list undercounts Lou Spanos.** `List of UConn Huskies football head coaches`
   credits Spanos with 7 games and a 1–6 record in 2021. UConn played 12 games in 2021 and finished
   1–11; Edsall's row on the same page (38 games across 2017–2021) only reconciles if Edsall coached
   2 games in 2021, leaving 10 for Spanos. The 2021 season article says Spanos was interim "for the
   remainder of the year" and its roster footer says "Lou Spanos (games 3–12)". Spanos coached 10
   games, 1–9. The row is season-level so this does not change the data, but the list page's numbers
   should not be trusted.
3. **Alex Golesh's article misdates USF's 2025 finale.** It says the season "ended with a 52–3 rout
   of Rice on November 30". Both `2025 South Florida Bulls football team` (schedule row and game box)
   and `2025 Rice Owls football team` date that game **November 29, 2025**. Used 2025-11-29 as
   Golesh's `end_date`.
4. **"Jim Leavitt era (1997–2010)".** That section heading in `South Florida Bulls football`
   contradicts the coach table on the same page ("1997–2009") and Leavitt's own article ("until
   2009"). Leavitt coached USF's 2009 season through the Jan 2, 2010 bowl and was fired Jan 8, 2010 —
   a calendar year, not a season. Row is 1997–2009.
5. **Notre Dame 2009→2010 was flagged as messy; it isn't.** Charlie Weis's last game was
   2009-11-28 at Stanford, he was fired 2009-11-30, and Notre Dame *declined* a bowl bid (announced
   Dec 4, 2009). Rob Ianello was put in charge of football operations and recruiting but coached no
   game. Brian Kelly was hired Dec 10, 2009 and his first game was the 2010 opener. No interim row,
   no mid-season dates. The 2016 Kelly season is likewise clean.
6. **Two "head coaches" who coached zero games are excluded from the JSON.** George O'Leary
   (Notre Dame, 2001) — the ND list's own footnote says he "did not coach a single practice or game,
   being fired five days after being hired" — and Manny Diaz (Temple, 2019), who is row 30 on
   Temple's list with the note "Diaz left Temple for Miami before ever coaching a game". Neither can
   be coach of record for any game, so a row for them would only create a false tenure window. Both
   are recorded here instead.
7. **UConn 2021 roster footer is internally inconsistent.** It lists "Randy Edsall (games 1)" and
   "Lou Spanos (games 3–12)", leaving game 2 unattributed. The same article's lead says Edsall led
   the team "for the first two games of the season", and he resigned Sept 6, 2021 — two days after
   the Sept 4 Holy Cross loss. Edsall is credited with games 1–2 (`end_date` 2021-09-04).

## Open ambiguities

1. **UConn, 2021-10-09 at UMass — not encoded.** Interim head coach Lou Spanos tested positive for
   COVID-19 the day before, and defensive line coach **Dennis Dottin-Carter** "served as the
   Huskies' head coach for the game" (`2021 UConn Huskies football team`). Spanos kept the interim
   title, so no row was created and that game falls inside the Spanos window. If the pipeline wants
   strictly-who-was-on-the-sideline attribution, 2021-10-09 belongs to Dottin-Carter. Flagged rather
   than guessed. (The game was at UMass, unranked — it will not qualify either way.)
2. **Jake Dickert is one row with `interim: false`,** but he was interim at Washington State from
   2021-10-23 and was made permanent after the Nov 26, 2021 Apple Cup. Same person either way, so
   splitting the row cannot change any record; the interim sub-window is 2021-10-23 → 2021-11-26 if
   the UI needs to render the flag per game.
3. **Rice, 2024-11-30 vs South Florida.** Scott Abell was named Rice head coach on Nov 26, 2024,
   four days before the finale, but the 2024 season article credits Alamar with the "final 4 games",
   which includes Nov 30. No source was found that explicitly puts Alamar on the sideline that day
   rather than Abell. Encoded as Alamar; Abell starts in 2025.
4. **Every row is graded `secondary`.** All 70 rows are sourced to Wikipedia (coach biographies,
   season articles, bowl-game articles), which is an aggregator under the rules' definition of
   `primary`. No school announcement or contemporaneous news story was fetched directly: espn.com,
   oregonlive.com and tampabay.com all return nothing to plain curl, and sports-reference.com 403s
   (already known from the research plan). The underlying contemporaneous stories are cited in the
   Wikipedia wikitext for every dated row — ESPN (Andersen, Bray, Rolovich, Drayton, Pasqualoni,
   Edsall, Taggart, Golesh), The Oregonian, Hartford Courant, KXLY, On3, Fox Sports — so a later pass
   with a real browser can upgrade the 18 dated rows to `primary` without redoing the date work.
5. **Temple's early-1990s rows are the thinnest in the file,** as expected. Jerry Berndt
   (1989–1992), Ron Dickerson (1993–1997) and Bobby Wallace (1998–2005) are documented only at
   season granularity, by biography prose plus one summary sentence on Temple's list page ("Berndt
   (11–33), Ron Dickerson (1993–97: 8–47) and Bobby Wallace (1998–2005: 19–71) were unable to halt
   the decline"). No evidence of any mid-season change in that span was found, and none of Temple's
   1990–1997 season articles document one — but "no evidence found" is weaker here than elsewhere.
   Same caveat, to a lesser degree, for Rice's Fred Goldsmith (1989–1993) and UConn's Tom Jackson
   (1983–1993) / Skip Holtz (1994–1998).
6. **Tom Jackson's 1993 resignation looks mid-season but isn't.** He resigned Nov 17, 1993 (Hartford
   Courant, Nov 18: "UConn's Jackson Out After 11 Seasons"); UConn's 1993 season ended Nov 13 vs
   Boston University. Row is season-level.
7. **Bill Doba's article says he "was fired on November 26" with no year.** Washington State's 2007
   season ended Nov 24, 2007 (Apple Cup), so the firing is an offseason event and the row is
   season-level 2003–2007.
8. **Marcus Freeman's `start_season` is 2021, not 2022.** His first game was the Jan 1, 2022 Fiesta
   Bowl, which `rules.json` attaches to the 2021 season. His first regular-season game was
   2022-09-03. If downstream code assumes `start_season` means "first regular season", Freeman is
   the one row that will trip it.
9. **Subdivision context, for anyone puzzled by "power conference" rows with no plausible AP
   top-10 opponents.** UConn was I-AA/FCS through 1999 and an FBS transitional member 2000–2001;
   South Florida began play in 1997 at I-AA and moved to I-A in 2001; Temple's Big East football
   membership ran 1991–2004 (expulsion vote Feb 2001, negotiated stay through 2004); Rice left the
   SWC when it dissolved after 1995. Rows exist for continuous coverage, not because those
   school-seasons were power-conference seasons.

## Coach-name spelling variants

Canonical spelling used in the JSON is on the left.

- **Mike Riley** — Wikipedia article is now `Mike Riley (gridiron football)`; Oregon State's list
  page still links the old `Mike Riley (American football)` title. Two separate Oregon State
  tenures (1997–1998, 2003–2014), two rows, one spelling.
- **Jim L. Mora** — also "Jim Mora" and "Jim Mora Jr."; his own article notes "To avoid confusion
  with his father, Mora is sometimes called Jim Mora Jr." UConn pages use "Jim L. Mora". Do not
  merge with his father, Jim E. Mora.
- **K. C. Keeler** — also rendered "K.C. Keeler" and "KC Keeler".
- **T. J. Weist** — also "TJ Weist". Appears twice in this beat as two different schools' interim:
  UConn 2013 (8 games) and South Florida 2016 (Birmingham Bowl). Same person, two rows.
- **Skip Holtz** — appears twice in this beat (UConn 1994–1998, South Florida 2010–2012). His
  father **Lou Holtz** is the Notre Dame 1986–1996 row. Do not merge; both are "Holtz".
- **Randy Edsall** — two separate UConn tenures (1999–2010, 2017–2021), two rows.
- **Ed Foley** — two separate Temple interim tenures (2016 and 2018 bowls), two rows. Temple's list
  page numbers him twice (rows 27 and 29) with the footnote "Foley has twice been interim head
  coach".
- **Al Golden** — article title is `Al Golden`; `Al Golden (American football)` is a redirect used
  by Temple's list page.
- **Alex Golesh** — birth name Aleksey Golesh (Алексей Голеш).
- **Dennis Erickson** — coached Washington State 1987–1988 *and* Oregon State 1999–2002. Only the
  Oregon State row is in range; the WSU stint ended before 1990.
- **Jerry Berndt** — coached Rice 1986–1988 *and* Temple 1989–1992. Only the Temple row is in
  range; the Rice stint ended before 1990.
- **Steve Addazio** — full name Stephen Robert Addazio; always "Steve" in coaching sources.
- **Jonathan Smith** — disambiguated article `Jonathan Smith (American football coach)`; not to be
  confused with any other Smith on these rosters.

## Method

Primary path per school: `List of <School> head football coaches` wikitext via the MediaWiki API
(`action=parse&prop=wikitext`) for the tenure table, then each coach's biography intro
(`prop=extracts&exintro`) for the tenure quote, then the specific `<year> <School> football team`
article for any season with a coaching change — its infobox states the games-coached split
(`hc_games` / `hc_games2`) and its schedule table gives the dates. Bowl-game articles
(`2024 Holiday Bowl`, `2025 Famous Idaho Potato Bowl`, `2025 Cure Bowl`, `2023 Sun Bowl`) were used
where an interim's own biography didn't mention the assignment. Every date in the file is the
intersection of a stated games-coached count and a dated schedule table, not an inference from a
firing date alone.
