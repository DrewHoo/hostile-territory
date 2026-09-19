# Big 12 beat — tenure research notes

Scope: the 16 schools in `data/rules.json` → `school_assignments.big-12`. Every head-coaching
tenure that overlaps the 1990 season through the 2026 season in progress (today: 2026-09-19),
including interims. Seasons played in the WAC, C-USA, Big East, SWC, Big 8, Pac-10/12 and
I-AA are all in the file; the pipeline can filter by conference era later.

- 128 rows, 16 schools, no season gaps 1990→2026 for any school.
- 23 rows flagged `interim: true`.
- 27 mid-season (or mid-postseason) changes pinned to exact game dates.
- All 128 quotes were machine-checked against a live fetch of their own `source_url`
  (tags stripped, `&nbsp;` normalised to a space, runs of whitespace collapsed). 128/128 pass.
  Six quotes had to be shortened or re-sourced because rendered inline citation markers
  (`[1][2]`) break the sentence mid-string on the live page — worth knowing before anyone
  writes another Wikipedia-quoting agent.

## Tenure bounds are real bounds, not window-clipped

Where a tenure started before 1990 the row carries its true `start_season`
(Teaff 1972, LaVell Edwards 1972, Nehlen 1980, McCartney 1982, Wacker 1983, Pat Jones 1984,
McDowell 1985, Spike Dykes 1986, Walden 1987, Tomey 1987, Mason 1988, Marmie 1988,
Murphy 1989, Snyder 1989). Games before 1990 simply fall outside the study window; clipping
the row to 1990 would have made the join look like a coaching change happened in 1990.

## Grades: why almost everything is `secondary`

`rules.json` defines `primary` as the school's own list/announcement or a contemporaneous news
story. Every source I could actually fetch and string-check was Wikipedia, which is an
aggregator, so 122 rows are honestly graded `secondary`.

Six rows are `primary`, all Colorado, all backed by the school's own releases on cubuffs.com:

- `https://cubuffs.com/news/2022/10/2/dorrell-dismissed-as-head-football-coach-at-colorado`
  contains CU's own roll-call of its interim coaches: Hankwitz (2005 Champs Sports Bowl),
  Cabral (last three games of 2010), Roper (2018 finale at Cal), Sanford (rest of 2022).
  One release documents all four Colorado interim tenures, plus Dorrell's own dismissal.
- `https://cubuffs.com/news/2018/12/5/tucker-named-head-football-coach-at-colorado.aspx`
  gives the MacIntyre dismissal date and Roper's appointment.

**Upgrade path for a verification fleet.** I tried and failed to reach equivalent releases at
okstate.com and texastech.com (404 on guessed paths — I did not want to invent URLs). The
school-site URLs sitting in the Wikipedia refs for these seasons are almost all rosters,
schedules and box scores, not the firing announcements; the announcements are mostly only in
web.archive.org snapshots. Any pass that wants `primary` grades on the other 21 mid-season
rows should go at the archived athletics releases and contemporaneous wire copy (AP/ESPN)
directly, and re-run the string check against whatever it fetches.

## Rejected claims (things a source asserted that I disproved)

1. **Kansas State list page: "Collin Klein | 2025–present".** Wrong. Klieman's own article says
   he was head coach "from 2019 until his retirement in December 2025", the 2025 K-State season
   article says "On December 3, Klieman announced that he would be retiring following the
   Wildcats' bowl game", and the same list credits Klein with 0 games coached. The navbox on
   that very page says "Collin Klein (2026– )". Row filed as `start_season: 2026`.
2. **Utah list page navbox: "Morgan Scalley (2025– )"** conflicts with the same page's table
   ("2026–Present", 1 game coached). Scalley was *named* head coach in December 2025;
   Whittingham coached Utah's 2025 bowl ("what ended up being his final year as their head
   coach after 21 years"). Row filed as `start_season: 2026`.
3. **Rick Neuheisel's article: "head football coach at the University of Colorado Boulder from
   1995 to 1999".** He never coached a Colorado game in the 1999 season — he took the
   Washington job in January 1999 and coached CU's Aloha Bowl on 1998-12-25. The Colorado list
   and navbox both say 1995–1998. Row filed 1995–1998.
4. **Art Briles' article: "head coach of the Houston Cougars from 2002 to 2007".** 2002 is his
   hire year; his first season on the field was 2003 (Houston's list gives him 62 games, exactly
   2003–2007). Row filed 2003–2007.
5. **West Virginia list table: "Bill Stewart | 2008–2010".** The table hides a real mid-season
   change. Stewart's 40 games = the 2008-01-02 Fiesta Bowl plus 2008/2009/2010 (13 each), and
   the same page's navbox says "Bill Stewart (2007–2010)". Row filed `start_season: 2007`,
   `start_date: 2008-01-02`.
6. **Oklahoma State list page has no 2026 head coach** (it stops at Meacham 2025). Stale.
   Eric Morris is OSU's head coach; both the program infobox and the navbox confirm it.
   Row added.
7. **My own prior assumption that Glen Mason split the 1996 season with a bowl interim at
   Kansas — disproved.** Kansas went 4–7 in 1996 with 11 games and no bowl; "Mason resigned at
   the end of the season to become the head football coach at the University of Minnesota."
   Clean offseason transition. (The Kansas Aloha Bowl was 1995.)
8. **My own prior assumption that Houston played the 2007 C-USA Championship Game after Briles
   left — disproved.** Houston shared the C-USA West but Tulsa went to the title game; Houston
   played 13 games, Briles' last being 2007-11-24 vs Texas Southern.
9. **Colorado's own list page omits all four of its interim coaches.** Hankwitz 2005,
   Cabral 2010, Roper 2018 and Sanford 2022 appear nowhere in the table or navbox on
   `List_of_Colorado_Buffaloes_head_football_coaches`. Anyone trusting that page alone
   mis-attributes nine Colorado games. Recovered from the cubuffs.com release above.
10. **2005 Champs Sports Bowl article says Barnett "resigned".** CU's own release calls
    Hankwitz an interim after Barnett's departure and Barnett's own article describes a
    pressured exit; the framing differs by source. The row's *date* boundary is unaffected,
    but do not report "resigned" as settled fact.
11. **Eric Morris hire date is inconsistent across Wikipedia.** The 2025 OSU season article says
    "On November 25, North Texas head coach Eric Morris was named the Cowboys' new head coach";
    his own article says "He was introduced as the head coach on December 8, 2025." Either way
    his first season is 2026 and Meacham coached through 2025-11-29, so no row is affected.

## Ambiguities and judgement calls

- **Zero-game interims, deliberately excluded.** Two men held the interim title without ever
  coaching a game, so they cannot own a game row and would create phantom coverage:
  - *Emmett Jones*, Kansas: "Wide receivers coach Emmett Jones served as interim coach from
    March 11 through the team's spring practices at the end of April" (2021). Les Miles parted
    ways 2021-03-08, Leipold was hired 2021-04-30 — all offseason, no games.
  - *Todd Orlando*, Houston 2016: the Houston list page states outright, "Not included in the
    above listing is Todd Orlando, who was designated interim head coach for a brief period in
    2016 but did not coach any games."
  Flagging rather than filing, in case the coverage report wants them for completeness.
- **Bill Stewart's interim flag is `false`.** He coached the 2008 Fiesta Bowl *under* an interim
  title and was made permanent immediately after ("After the game, Stewart was rewarded by the
  WVU athletic department by being named the team's permanent head coach"). Filing him as one
  continuous 2007–2010 tenure avoids splitting one man into two rows for a single bowl. Bowls
  are neutral-site and excluded from the road-game universe anyway, so this cannot move a
  record — but if the coverage report wants interim purity, this is the row to split.
- **Tony Levine's interim flag is `false`** for the same reason in reverse: he was named interim
  when Sumlin left, but Houston "dropped the 'interim' from Levine's title" on 2011-12-21,
  eleven days *before* his first game (the 2012-01-02 TicketCity Bowl). He never coached a game
  as an interim.
- **Major Applewhite's interim flag is `false`**: "Houston was led by new head coach Major
  Applewhite in the Las Vegas Bowl" — he was already the permanent hire.
- **Jim Grobe is flagged `interim: true`** though his title was "acting head coach" and he
  coached all 13 games of 2016. Baylor's own list marks him with the acting-coach dagger. If
  the UI distinguishes "interim" from "acting", this row needs a third state.
- **Baylor 2015–16 is *not* a mid-season change.** Briles coached all 13 games of 2015 including
  the 2015-12-29 Russell Athletic Bowl; he was suspended and terminated on 2016-05-26, deep in
  the offseason; Grobe was hired 2016-05-30 and coached all 13 games of 2016. No dates needed.
  The messiness is institutional, not calendrical.
- **Kansas 2021 is *not* a mid-season change either.** Miles on leave 2021-03-05, parted ways
  2021-03-08, Leipold hired 2021-04-30. Season-level rows are correct.
- **Cincinnati 2006 (Dantonio → Kelly) is inferred, not directly stated.** No source says
  "Dantonio's last game was 2006-11-25". The 2007 International Bowl article establishes that
  "newly hired Cincinnati head coach Brian Kelly coached Central Michigan University during the
  2006 regular season", i.e. Kelly could not have coached UC before the bowl; Kelly's 40
  Cincinnati games = 1 (2006 bowl) + 13 + 13 + 13 confirms the split arithmetically; and CU's
  regular-season finale was 2006-11-25 at UConn. Both rows carry that quote. This is the
  weakest-sourced of the 27 pinned transitions — verify it first.
- **Gary Patterson's row carries both a `start_date` (2000-12-20) and an `end_date`
  (2021-10-30) but its quote only supports the 2000–2021 season range.** The start date comes
  from the 2000 TCU season article ("TCU's defensive coordinator, Gary Patterson, was appointed
  to succeed Franchione as head coach", Franchione "resigned at the conclusion of the regular
  season") plus the Mobile Alabama Bowl date; the end date comes from the 2021 article ("On
  Sunday after the game, TCU fired head coach Gary Patterson and will have Jerry Kill take
  over on an interim basis"). Same shape applies to Brian Kelly (both dates, one quote) and to
  Kevin Sumlin's Houston row (end date from the 2011 C-USA Championship, quote only gives
  seasons). One quote per row cannot carry two boundaries.
- **The Kansas 2001 quote contains a Wikipedia typo and I quoted it verbatim anyway.** The live
  page literally reads "All was fired on November 4, after the eighth game of the season" — the
  link markup swallowed "Allen". The same paragraph also misidentifies Tom Hayes as "Kansas
  State's defensive coordinator"; he was Kansas'. The *dates* are right (Allen's 8th game was
  2001-11-03 vs Nebraska; Hayes' first was 2001-11-10 at Texas) and Hayes' own article
  independently confirms "the final three games of the 2001 season".
- **Game dates from cfbfastR are UTC and silently off by one.** `start_date` in
  `cfb_schedules_<yr>.csv` is an ISO-8601 Zulu timestamp, so a Saturday night kickoff lands on
  Sunday (ASU–Eastern Michigan 2022 shows as `2022-09-18T03:00:00Z`; the game was 2022-09-17).
  I converted with `local_date = (utc - 12h).date()` and then cross-checked every pinned date
  against the Wikipedia season article's own schedule table, which carries local dates. Every
  one of the 27 agreed. **Whoever builds `games-candidates.json` must apply the same shift or
  every pinned coach boundary will be off by a day for night games.**
- **cfbfastR schedule CSVs contain regular-season games only** — `season_type` is `regular` for
  every row I sampled in 2009, 2012 and 2022, and there is no file for 2000. Fifteen of the 27
  transitions here hinge on a bowl or conference-championship date, all of which I took from
  Wikipedia season/bowl articles. The pipeline needs a separate postseason source.
- **Iowa State 2025 declined its bowl.** Campbell agreed to Penn State on 2025-12-05 and Rogers
  was announced 2025-12-08, but ISU finished 8–4 and "the team opted out of a bowl appearance
  following a vote by players". So the Campbell → Rogers handover is a clean offseason
  transition with no interim, which is *not* what the coaching-carousel dates would suggest.
- **Games-coached arithmetic was my main check on the "quiet" transitions** — where a coach left
  in November or December and the team still played a bowl, I reconciled the list page's
  games-coached column against the season's game count rather than trusting the year range.
  That is how I confirmed Koetter coached the 2006 Hawaii Bowl (74 games = six full seasons),
  Erickson the 2011 Maaco Bowl (62), Graham the 2017 Sun Bowl (78), Mendenhall the 2015 Las
  Vegas Bowl (142), Meyer the 2005 Fiesta Bowl (24), Holgorsen the 2018 Camping World Bowl
  (102), Beaty all of 2018 (48), Prince all of 2008 (37, and "asked to stay for the three final
  games"), Rhoads the 2015 finale ("He stayed on to coach the final game of the season on
  November 28"), Tomey the 2000 finale ("After the game ended, Tomey resigned as coach"), and
  Malzahn the 2024 finale ("On November 30, one day after their season concluded, head coach
  Gus Malzahn resigned"). The list pages' games-coached numbers are not all current, though —
  several appear frozen at the end of 2025 while others already include 2026 week-1 games, so
  treat the arithmetic as corroboration, never as the primary claim.
- **UCF 1990–1995 was Division I-AA.** Gene McDowell's tenure (1985–1997) is in the file because
  the brief says cover 1990–present wherever a school played, but `rules.json` defines
  `in_scope_coach` in FBS terms. UCF moved to I-A in 1996. Filter, don't delete.

## Coach-name spelling variants seen across sources

Canonical spelling in the file is on the left.

| filed as | also seen as / note |
| --- | --- |
| Jedd Fisch | rendered "Jedd Fisch" on the Arizona list; some news copy uses "Jedd Fisch" — no variance found in Wikipedia |
| Gene Chizik | frequently mis-typed "Chizek"/"Chizck" in fan sources; Wikipedia article title is "Gene Chizik" |
| Dana Holgorsen | commonly "Holgorsen" vs "Holgerson" in news copy; both his WVU and Houston rows use "Holgorsen" |
| Mike Sanford Jr. | cubuffs.com release calls him "Mike Sanford"; Wikipedia title is "Mike Sanford Jr."; his father coached UNLV/Indiana State, so the suffix matters |
| Major Applewhite | occasionally "Major Applewhite III"; Houston's list omits the suffix |
| Guy Morriss | double-r/double-s is correct; "Morris" is a common error and collides with Eric Morris (Oklahoma State, 2026–) |
| Eric Morris | distinct person from Guy Morriss — do not let a fuzzy matcher merge them |
| Tim Murphy | disambiguated as "Tim Murphy (American football)"; also appears as "Timothy Murphy" on the Cincinnati list |
| Bronco Mendenhall | full name "Marc Bronco Clay Mendenhall" |
| Kalani Sitake | article renders an apostrophe artifact: `"Kalani" 'Sitake` |
| Sonny Dykes | son of Spike Dykes (Texas Tech 1986–1999); two Dykes rows in this file, different men |
| Bill Snyder | two separate Kansas State stints (1989–2005, 2009–2018) filed as two rows, identical spelling |
| Rich Rodriguez | three rows (WVU 2001–2007, Arizona 2012–2017, WVU 2025–) — identical spelling; "Rodríguez" with an accent appears in some sources |
| Scott Frost | two UCF stints (2016–2017, 2025–) filed as two rows |
| Mike Hankwitz | two interim tenures at two schools (Arizona 2003, Colorado 2005); full name "George Michael Hankwitz" |
| Ruffin McNeill | "Ruffin McNeill Jr." in full |
| Terry Allen | disambiguated "Terry Allen (American football coach)"; distinct from the NFL running back Terry Allen |
| Tom Hayes | disambiguated "Tom Hayes (American football coach)" |
| David Beaty | disambiguated "David Beaty (American football)" |
| Danny Barrett | Wikipedia title is "Danny Barrett (gridiron football)" |
| Bill Stewart | Wikipedia title is "Bill Stewart (gridiron football)"; nicknamed "Stew" |
| Dan Hawkins | Wikipedia title is "Dan Hawkins (gridiron football)" |
| Jim Walden | died 2026-07-02; article title "Jim Walden (American football)" |
| Bob Simmons | died 2026-06-09; article title "Bob Simmons (American football coach)" |

## What a verification pass should attack first

1. Cincinnati 2006 Dantonio → Kelly (inferred boundary, see above).
2. The 15 bowl-date boundaries, none of which came from a structured schedule source.
3. The 21 mid-season rows still graded `secondary`; archived school releases exist for most.
4. Colorado's four interims, because the school's own Wikipedia list denies they happened —
   if the pipeline ever re-derives tenures from that page, it will silently regress.
