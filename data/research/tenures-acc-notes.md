# ACC beat notes — `tenures-acc.json`

Scope: every head-coaching tenure overlapping the 1990 season through today (Sept 19, 2026) at
Boston College, California, Clemson, Duke, Florida State, Georgia Tech, Louisville, Miami (FL),
NC State, North Carolina, Pittsburgh, SMU, Stanford, Syracuse, Virginia, Virginia Tech, Wake Forest.
Pre-ACC seasons are included (Big East, Pac-10/12, SWC/WAC/C-USA/AAC).

138 rows, 128 distinct coaches, zero season gaps 1990→2026 for any school, exactly one open
(`end_season: null`) row per school.

## Conventions used

- **Quote verification.** Every `quote` was mechanically checked as an exact substring of the
  rendered text of its `source_url` (HTML fetched, tags stripped, whitespace collapsed). All 138
  pass. Watch one gotcha if the checker is re-implemented: a naive `<tag> → ' '` substitution
  inserts a space before punctuation that follows a wikilink ("Brent Pry ,"), so quotes here were
  deliberately trimmed to spans that do not end on a linked entity, and never span a citation
  marker.
- **Grades.** Wikipedia is an aggregator, so every Wikipedia-sourced row is `secondary`, including
  the "List of *School* head football coaches" pages named in the research plan. Only one row is
  `primary`: Duke's Trooper Taylor, sourced to a contemporaneous Duke Chronicle game story. Two
  rows cite non-Wikipedia sites and are still graded `secondary` (see below).
- **Dates.** `start_date`/`end_date` are populated only where a handoff happened with games left in
  the season (including a bowl still to play). They are the date of the outgoing coach's last game
  coached and the incoming coach's first game coached — not the firing/hiring date. Game dates
  2001–2025 come from the cfbfastR-data schedule CSVs (UTC timestamps converted to US local
  calendar date); 1990s dates come from the Wikipedia season articles' schedule tables; bowl dates
  come from each bowl game's own article.
- **Interim who got the job.** Dabo Swinney (Clemson 2008), Ted Roof (Duke 2003) and Brent Key
  (Georgia Tech 2022) each took over as interim mid-season and were later made permanent. Each is
  one continuous row with `interim: false` and a `start_date` on their first game. Their interim
  windows: Swinney Oct 13 – Dec 1, 2008; Roof from Oct 2003 (permanent Dec 2003); Key Sept 26 –
  Nov 29, 2022. If the UI wants to render the interim flag for the 2008/2003/2022 games
  specifically, that split has to be made downstream.
- **Same coach, several rows.** Records must not be split by school: Bobby Petrino (Louisville
  ×2), Mack Brown (North Carolina ×2), Frank Spaziani (Boston College ×2), Odell Haggins (Florida
  State ×2), Butch Davis (Miami + North Carolina), Tom O'Brien (Boston College + NC State), Walt
  Harris (Pittsburgh + Stanford), Sonny Dykes (California + SMU), Phil Bennett (SMU + Pittsburgh
  interim), Manny Diaz (Miami + Duke).

## Mid-season / mid-postseason handoffs pinned with dates (29)

Outgoing coach's last game → incoming coach's first game.

**Regular-season handoffs (14)** — these are the ones that can move a road game between coaches:

| school | season | out (last game) | in (first game) |
| --- | --- | --- | --- |
| Clemson | 2008 | Tommy Bowden 2008-10-09 (at Wake Forest) | Dabo Swinney 2008-10-18 (Georgia Tech) |
| Duke | 2003 | Carl Franks 2003-10-18 | Ted Roof 2003-10-25 |
| Florida State | 2017 | Jimbo Fisher 2017-11-25 (at Florida) | Odell Haggins 2017-12-02 (UL Monroe) |
| Florida State | 2019 | Willie Taggart 2019-11-02 (Miami) | Odell Haggins 2019-11-09 (at Boston College) |
| Georgia Tech | 1994 | Bill Lewis 1994-11-05 (Florida State) | George O'Leary 1994-11-12 (at Clemson) |
| Georgia Tech | 2022 | Geoff Collins 2022-09-24 (at UCF) | Brent Key 2022-10-01 (at Pittsburgh) |
| Louisville | 2018 | Bobby Petrino 2018-11-09 (at Syracuse) | Lorenzo Ward 2018-11-17 (NC State) |
| Miami (FL) | 2015 | Al Golden 2015-10-24 (Clemson) | Larry Scott 2015-10-31 (at Duke) |
| Pittsburgh | 1992 | Paul Hackett 1992-11-21 (at Penn State) | Sal Sunseri 1992-12-05 (at Hawaii) |
| SMU | 2014 | June Jones 2014-09-06 (at North Texas) | Tom Mason 2014-09-20 (Texas A&M) |
| Syracuse | 2023 | Dino Babers 2023-11-18 (at Georgia Tech) | Nunzio Campanile 2023-11-25 (Wake Forest) |
| Virginia Tech | 2021 | Justin Fuente 2021-11-13 (Duke) | J. C. Price 2021-11-20 (at Miami) |
| Virginia Tech | 2025 | Brent Pry 2025-09-13 (Old Dominion) | Philip Montgomery 2025-09-20 (Wofford) |
| California | 2025 | Justin Wilcox 2025-11-22 (at Stanford) | Nick Rolovich 2025-11-29 (SMU) |

(Bowden resigned Oct 13, 2008, four days after that Wake Forest loss.)

**Bowl-only handoffs (15)** — the incoming coach's only game is a neutral-site bowl, so these
produce no qualifying road games, but the dates are pinned anyway so game attribution can't drift:

Boston College 2006 (Tom O'Brien 2006-11-23 → Frank Spaziani
2006-12-30, Meineke Car Care Bowl); Boston College 2019 (Steve Addazio 2019-11-30 → Rich Gunnell
2020-01-02, Birmingham Bowl); Clemson 1993 (Ken Hatfield 1993-11-20 → Tommy West 1993-12-31, Peach
Bowl); Duke 2023 (Mike Elko 2023-11-25 → Trooper Taylor 2023-12-23, Birmingham Bowl); Georgia Tech
2001 (George O'Leary 2001-12-01 → Mac McWhorter 2001-12-27, Seattle Bowl); Georgia Tech 2007 (Chan
Gailey 2007-11-24 → Jon Tenuta 2007-12-31, Humanitarian Bowl); Louisville 2022 (Scott Satterfield
2022-11-26 → Deion Branch 2022-12-17, Fenway Bowl); Miami 2010 (Randy Shannon 2010-11-27 → Jeff
Stoutland 2010-12-31, Sun Bowl); NC State 2012 (Tom O'Brien 2012-11-24 → Dana Bible 2012-12-31,
Music City Bowl); North Carolina 1997 (Mack Brown 1997-11-22 → Carl Torbush 1998-01-01, Gator
Bowl); North Carolina 2024 (Mack Brown 2024-11-30 → Freddie Kitchens 2024-12-28, Fenway Bowl);
Pittsburgh 2010 (Dave Wannstedt 2010-12-04 → Phil Bennett 2011-01-08, BBVA Compass Bowl);
Pittsburgh 2011 (Todd Graham 2011-12-03 → Keith Patterson 2012-01-07, BBVA Compass Bowl);
Pittsburgh 2014 (Paul Chryst 2014-11-29 → Joe Rudolph 2015-01-02, Armed Forces Bowl); SMU 2017
(Chad Morris 2017-11-25 → Sonny Dykes 2017-12-20, Frisco Bowl).

Interim stints that ran to the end of a season carry an `end_date` on their last game
(e.g. Haggins 2019-12-31 Sun Bowl, Campanile 2023-12-21 Boca Raton Bowl, Montgomery 2025-11-29 at
Virginia, Mason 2014-12-06 at UConn, Scott 2015-12-26 Sun Bowl, Rolovich 2025-12-24 Hawaii Bowl,
Price 2021-12-29 Pinstripe Bowl, Ward 2018-11-24 Kentucky).

**Deliberately date-free** changes that look mid-season but aren't:
- North Carolina 2011: Butch Davis was fired July 27, 2011, before the season. Everett Withers
  coached all of 2011; no dates needed.
- Stanford 2025: Troy Taylor was fired in March 2025. Frank Reich was interim for the whole 2025
  season; no dates needed.
- Virginia 2021 and SMU 2021: Bronco Mendenhall and Sonny Dykes both left after the regular season,
  and the 2021 Fenway Bowl (Virginia vs. SMU) was canceled, so no game changed hands.
- Miami 2021: Manny Diaz's tenure ended after the regular season; Miami played no bowl game.
- Larry Coker (Miami) was fired November 24, 2006 but still coached the 2006 MPC Computers Bowl —
  season-level row, no interim, confirmed on the 2006 Miami season page.

## Rejected claims (sources said it, the row says otherwise)

1. **Jack Bicknell's Wikipedia bio** says he coached "at Boston College from 1981 to 1988."
   Wrong: the 1990 Boston College season article says he was "in his 10th and final season with
   Boston College," and the BC coach list has 1981–1990. Row uses 1981–1990.
2. **Dabo Swinney's bio** says he "took over as head coach of the Clemson Tigers seven games into
   the 2008 season." Clemson had played six games under Bowden (Aug 30, Sept 6, 13, 20, 27, Oct 9);
   the Clemson list page says Swinney got "the final 7 games." Off by one; row pins his first game
   at 2008-10-18.
3. **Geoff Collins's bio** says "head coach at Georgia Tech from 2018 until 2022." He was hired
   Dec 7, 2018; the 2019 Georgia Tech season page calls him "in his first season." Row uses
   2019–2022.
4. **Bill Lewis's bio** says he "assumed the head coaching position at Georgia Tech in 1991."
   The 1992 Georgia Tech season page calls him "first-year head coach." Row uses 1992–1994.
5. **The Syracuse and Duke head-coach list pages are incomplete.** Neither lists the 2023 interim:
   Syracuse's 2023 season page has Nunzio Campanile ("interim; remainder of season") and Duke's
   2023 season page has Trooper Taylor ("interim, bowl game"). Both are rows here; without them
   the Nov 25 / Dec 21, 2023 Syracuse games and the Dec 23, 2023 Duke bowl would be attributed to
   fired coaches.
6. **Sonny Dykes's bio** says SMU "from 2018 to 2021"; the SMU Mustangs football page says
   2017–2021. Resolved for 2017: the 2017 SMU season page lists Dykes as the bowl-game coach and
   contemporaneous coverage of the Dec 20, 2017 Frisco Bowl has SMU playing "under the direction of
   new coach Sonny Dykes." Row is 2017–2021 with `start_date` 2017-12-20.
7. **Working assumption disproved during the sweep:** I expected SMU's 2017 Frisco Bowl to have
   been coached by interim Jeff Traylor. It was Dykes. Likewise I expected FSU's 2019 interim stint
   to be three games; it was four, because FSU did reach the 2019 Sun Bowl (Dec 31, 2019).
8. **Pittsburgh's list page marks Michael Haywood "Int."** His own article says he "was offered and
   accepted the head football coaching position" on Dec 16, 2010 — the permanent job, not an
   interim one. Row has `interim: false`.
9. **The Boston College list page's lead is currently garbled** ("Since February 2024, Bill O'Brien
   and Sterling has served as head coach at Boston College"). Not used as a source; Bill O'Brien's
   row cites the 2026 BC season page instead.

## Open ambiguities

1. **Zero-game tenures.**
   - *Michael Haywood, Pittsburgh* is included as a row (2010, 2010-12-16 → 2011-01-01) but he
     never coached a game: hired Dec 16, 2010, arrested Dec 31, fired Jan 1, 2011, with Phil
     Bennett coaching the Jan 8, 2011 bowl. His dates are bounded so he cannot collect a game in a
     date join, but if the pipeline joins on season alone he will wrongly pick up Pitt's 2010 games.
   - *Jim Leavitt, SMU* is **excluded**. The 2021 SMU season page names him interim head coach for
     the bowl game, but the 2021 Fenway Bowl was canceled and no prose source for the appointment
     exists outside that infobox, so there is no quotable row and no game to attribute.
2. **Quotes that pin one boundary, not both.** Where no single sentence covered a full range, the
   quote pins the boundary that matters (usually the end, or the mid-season handoff) and the other
   boundary comes from the school's coach list page: David Cutcliffe (end 2021 quoted; start 2008
   from his bio's Dec 14, 2007 hire), Jimbo Fisher (end 2017 quoted; start 2010 from his Jan 7,
   2010 introduction), Paul Johnson (hire quoted; 2008–2018 from the GT list), Bill Walsh (1992
   return quoted; through 1994 from the 1994 Stanford season page), Forrest Gregg (1990 as "second
   and final year"; 1989 start from the 1989 SMU season page), Steve Addazio, Ken Hatfield, Tommy
   West, Dennis Green, Jim Caldwell, Dave Clawson, Mike London, Carl Torbush.
3. **Non-Wikipedia citations, graded `secondary` on purpose.** SMU's Sonny Dykes 2017 row cites
   saturdayblitz.com (a FanSided game story) and Duke's Trooper Taylor row cites the Duke
   Chronicle. The Chronicle is contemporaneous student-paper reporting and is graded `primary`;
   saturdayblitz is contemporaneous but low-authority, so it stays `secondary`. If the verification
   fleet wants a stronger source for the Dykes/Frisco Bowl row, an AP or Dallas Morning News
   game story from Dec 20–21, 2017 would upgrade it.
4. **Bowl vs. season attribution.** Several coaches' first or last game is a bowl played in January
   of the following calendar year (Torbush 1998-01-01, Bennett 2011-01-08, Patterson 2012-01-07,
   Rudolph 2015-01-02, Gunnell 2020-01-02). Those bowls belong to the prior season per
   `rules.json`, so `start_season`/`end_season` and the date year disagree by one on those rows by
   design.
5. **cfbfastR timestamps.** Schedule CSV `start_date` values are UTC; a night kickoff lands on the
   next UTC day (e.g. Georgia Tech at Pittsburgh reads `2022-10-02T00:00:00Z` for a game played
   Oct 1, 2022). Dates here are local US calendar dates. If the games pipeline converts differently,
   every handoff boundary will be off by a day on night games — worth a cross-check.
6. **Vacated wins.** Several tenures here overlap NCAA vacatur (North Carolina 2008–09 under Butch
   Davis, Syracuse 2005–06 under Greg Robinson, California 1999 under Tom Holmoe). Tenure rows are
   unaffected, but any record display downstream has to decide whether vacated games count.
7. **2026 currency.** All 17 current coaches were confirmed against their school's 2026 season
   article as of Sept 19, 2026 (three weeks into the season), so no in-season 2026 change is
   missed as of that date. First-year 2026 hires: Tosh Lupoi (California), Tavita Pritchard
   (Stanford), James Franklin (Virginia Tech).

## Coach-name spelling variants seen across sources

- **J. C. Price** — Wikipedia article title "J. C. Price"; Virginia Tech's list and season pages
  write "J.C. Price". Canonical here: `J. C. Price`.
- **Walt Harris** — Wikipedia article is now "Walt Harris (American football coach)"; the
  Pittsburgh and Stanford list pages still link the old title "Walt Harris (coach)". One person,
  two tenures (Pittsburgh 1997–2004, Stanford 2005–2006).
- **Manny Diaz** — Wikipedia disambiguates as "Manny Diaz (American football)"; Duke's list page
  links it as `{{Sortname|Manny|Diaz|dab=American football}}`. The Miami 2019–2021 coach and the
  current Duke coach are the same man.
- **Paul Johnson** — needs "Paul Johnson (American football coach, born 1957)"; the bare title is a
  disambiguation page, and a second football coach named Paul Johnson (born 1984) exists.
- **Dana Bible** — "Dana Bible (American football)", NC State's 2012 bowl interim; not to be
  confused with Dana X. Bible.
- **Tommy West** — "Tommy West (American football)"; also coached Chattanooga in 1993, the same
  year he took over at Clemson.
- **Bill O'Brien / Tom O'Brien** — two different Boston College head coaches (2024–present and
  1997–2006).
- **Bobby Bowden / Tommy Bowden** — father (Florida State) and son (Clemson).
- **Fran Brown / Mack Brown**, **Trooper Taylor / Troy Taylor** — unrelated coaches with shared
  surnames; do not merge.
- Nickname-vs-legal-name pairs that show up in school records: Dabo Swinney (William Christopher
  Swinney), Bronco Mendenhall (Kyle Mendenhall), Buddy Teevens (Eugene Teevens III), Trooper
  Taylor (Leroy Taylor), Jimbo Fisher (John James Fisher Jr.).
- **Steve Addazio** — Boston College and Temple records both use "Steve Addazio"; some aggregators
  render it "Steve Adazzio". Canonical here: `Steve Addazio`.

## Sources leaned on

- Wikipedia "List of *School* head football coaches" pages for the tenure spine and for the interim
  footnotes (Boston College, California, Clemson, Georgia Tech, Miami, NC State, North Carolina).
- Wikipedia season articles (`<year> <Team> football team`) for the authoritative "who coached which
  games" split — the infobox `hc_games` / `hc_games2` fields are how every handoff in this file was
  counted, and they caught the two interims the list pages omit.
- Wikipedia coach biographies for tenure ranges and firing/resignation dates.
- cfbfastR-data `schedules/csv/cfb_schedules_<year>.csv` for 2001–2025 game dates; Wikipedia season
  schedule tables for 1990s dates; individual bowl-game articles for bowl dates.
- Duke Chronicle (Dec 2023) and saturdayblitz.com (Dec 2017) for the two rows Wikipedia could not
  support with prose.
