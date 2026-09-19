# Gap sweep 1 — notes

Slice: Air Force, Akron, Appalachian State, Arkansas State, Army, Ball State, Boise State, Bowling Green,
Buffalo, Cal State Fullerton, Central Michigan, Charlotte, Coastal Carolina, Colorado State, East Carolina,
East Tennessee State, Eastern Michigan, Florida A&M.

Swept 2026-09-19. Output: `data/research/tenures-gap-1.json` — **41 rows**.

## Method

1. Fetched the Wikipedia `List of <school> head football coaches` page as raw wikitext. Six of the eighteen
   are `#REDIRECT` stubs; for those I used the main `<school> <mascot> football` article's `Head coaches`
   section instead (listed per school below).
2. Enumerated **every** head coach, interim included, whose tenure touches the 1990 season or later
   (74 coaches across the 18 schools).
3. Matched that roster against `data/research/scoped-coaches.txt` three ways: exact string, last-name
   equality, and a difflib similarity pass (>0.78) to surface spelling variants. Every non-exact hit was
   run down and is listed in the rejection sections.
4. For each confirmed match, opened the coach's own article and required the school stint **and** the
   power-conference stint to appear in the same person's coaching history before emitting a row.
5. Every quote was mechanically checked against the rendered plaintext of its `source_url`
   (`action=query&prop=extracts&explaintext`) before writing. **41/41 match verbatim.**

## Conventions used

- Season ranges are the real stint, unclamped: Bill Lewis's East Carolina row starts 1989, not 1990.
- `end_date` is the coach's **last game**, not the announcement date, whenever a successor finished the
  season. Dates were read off the season article's schedule table, not inferred.
- Two rows quote a section heading rather than prose (`Dino Babers era (2014–2015)`,
  `Skip Holtz era (2005–2009)`). In both cases no single prose sentence on Wikipedia carries the full
  season range, and the heading does. Both strings verify verbatim. Flagged here so a reviewer can
  swap in a better source if headings are unwelcome.
- All rows are `grade: "secondary"` — every one is Wikipedia's own aggregation, not a schedule line or a
  school staff announcement.

## Division caveats (the join should know about these)

`rules.json` counts FBS head-coaching games only. Several of these stints are wholly or partly FCS/I-AA
and will contribute zero qualifying games:

| row | division status |
| --- | --- |
| East Tennessee State — Mike Cavan 1992–1996 | I-AA throughout |
| East Tennessee State — Carl Torbush 2015–2017 | FCS throughout (program restarted 2015) |
| Appalachian State — Scott Satterfield 2013 | FCS; App State transitioned to FBS in 2014 |
| Boise State — Tom Mason 1996 | 1996 was Boise State's **first** Division I-A season, so this one counts |

Everything else in the file is FBS for the seasons listed.

---

## Per-school outcomes

### Air Force — 0 rows
Page: `List of Air Force Falcons head football coaches` (exists).
1990+ coaches: Fisher DeBerry (1984–2006), Troy Calhoun (2007–present). Neither is scoped.
- **Out of range, not rejected:** Ken Hatfield coached Air Force 1979–1983. Same person as the scoped
  Ken Hatfield (Arkansas 1984–1989, Clemson 1990–1993, Rice 1994–2005), but the stint ends six years
  before the window opens, so no row.
- Rejected as different people: none on the coach list — the `Fisher` / `Golden` / `Hall` / `Key` /
  `Shaw` / `West` last-name hits were all reference-citation and prose noise, not Falcons head coaches.

### Akron — 2 rows
Page: `List of Akron Zips head football coaches` (exists).
1990+ coaches: Gerry Faust (1986–1994), Lee Owens (1995–2003), J. D. Brookhart (2004–2009),
Rob Ianello (2010–2011), **Terry Bowden (2012–2018)**, Tom Arth (2019–2021), Oscar Rodriguez
(interim, 2021), **Joe Moorhead (2022–present)**.
- Terry Bowden: confirmed Auburn 1993–1998 and Akron 2012–2018 are the same man (son of Bobby, brother
  of Tommy) from his article's coaching history.
- Joe Moorhead: confirmed Mississippi State 2018–2019 and Akron 2022–present in one article; his
  year-by-year record shows Akron 2026 in progress, so `end_season` is null.
- **REJECTED — different people:** Oscar Rodriguez (Akron interim 2021) is not Rich Rodriguez.
  Bobby Bowden and Tommy Bowden appear only as relatives in prose.

### Appalachian State — 2 rows
Page: `List of Appalachian State Mountaineers head football coaches` (exists).
1990+ coaches: Jerry Moore (1989–2012), **Scott Satterfield (2013–2018)**, Mark Ivey (interim, 2018
bowl), **Eliah Drinkwitz (2019)**, Shawn Clark (2019 bowl, then 2019–2024), Dowell Loggains
(2025–present).
- Satterfield resigned for Louisville on December 3, 2018; his last game was the Sun Belt Championship
  Game on December 1, 2018. Mark Ivey (not scoped) coached the New Orleans Bowl.
- Drinkwitz's only App State season ended with the Sun Belt Championship Game on December 7, 2019; he
  left for Missouri and Shawn Clark (not scoped) coached the bowl.
- **Out of range, not rejected:** Mack Brown was App State's head coach in **1983** and Sparky Woods in
  **1984–1988**. Both are the scoped coaches of that name (confirmed), but both stints end before 1990,
  so no rows.
- **REJECTED — different people:** Jerry Moore is not Kirby Moore or Sherrone Moore.

### Arkansas State — 4 rows
Page: `List of Arkansas State Red Wolves head football coaches` **redirects** to
`Arkansas State Red Wolves football#Head coaches`; used the main article.
1990+ coaches: Al Kincaid (1990–1991), Ray Perkins (1992), John Bobo (1993–1996), Joe Hollis
(1997–2001), Steve Roberts (2002–2010), **Hugh Freeze (2011)**, David Gunn (interim, 2011 bowl),
**Gus Malzahn (2012)**, John Thompson (interim, 2012 and 2013 bowls), **Bryan Harsin (2013)**,
Blake Anderson (2014–2020), **Butch Jones (2021–present)**.
- Three consecutive one-and-done coaches (Freeze → Ole Miss, Malzahn → Auburn, Harsin → Boise State)
  each left after the regular season and an interim coached the bowl. `end_date` is each man's last
  game: 2011-12-03, 2012-12-01, 2013-11-30.
- Butch Jones is in his sixth Arkansas State season (2026 in progress per his year-by-year record), so
  `end_season` is null.
- **REJECTED — different people:** John Bobo (1993–1996) is **not** Mike Bobo — Mike Bobo's only head
  coaching job is Colorado State 2015–2019, which is a separate row in this file. Steve Roberts is not
  Dave Roberts. Nick Saban and Johnny Majors appear on the page only in prose (Saban as the coach Blake
  Anderson's predecessor assisted at Alabama; Majors as the coach Larry Lacewell left for in 1989).
- **Not scoped, noted for the record:** Ray Perkins coached Arkansas State in 1992; his Alabama tenure
  (1983–1986) predates the window, which is why he is absent from `scoped-coaches.txt`.

### Army — 1 row
Page: `List of Army Black Knights head football coaches` (exists).
1990+ coaches: Jim Young (1983–1990), Bob Sutton (1991–1999), Todd Berry (2000–2003), John Mumford
(interim, 2003), **Bobby Ross (2004–2006)**, Stan Brock (2007–2008), Rich Ellerson (2009–2013),
Jeff Monken (2014–present).
- Bobby Ross confirmed: Georgia Tech 1987–1991 (overlaps 1990–1991) and Army 2004–2006, same article.
- **REJECTED — different people:** none. Every last-name hit on this page (`Jones`, `Smith`, `Ross`,
  `Saban`, `Williams`, `Herman`, `Joseph`, `Key`, `Robinson`, `West`, `Hall`) was reference or prose
  noise except Ross himself. Note the page uses `{{Sortname}}`, so a naive full-name grep returns
  **zero** hits here — the coach table had to be parsed to find Ross at all.

### Ball State — 2 rows
Page: `List of Ball State Cardinals head football coaches` (exists).
1990+ coaches: Paul Schudel (1985–1994), **Bill Lynch (1995–2002)**, **Brady Hoke (2003–2008)**,
Stan Parrish (2008 bowl, then 2008–2010), Pete Lembo (2011–2015), Mike Neu (2016–2024),
Colin Johnson (interim, 2024), Mike Uremovich (2025–present).
- Bill Lynch: confirmed Ball State 1995–2002 and Indiana 2007–2010 in one article.
- Brady Hoke: last Ball State game was the 2008 MAC Championship Game on December 5, 2008; he resigned
  for San Diego State on December 15 and Stan Parrish (not scoped) coached the GMAC Bowl.
- **REJECTED — different people:** Colin Johnson (Ball State interim 2024) is not Bobby, Mike, or
  Paul Johnson.

### Boise State — 7 rows (largest contributor in the slice)
Page: `List of Boise State Broncos head football coaches` **redirects** to
`Boise State Broncos football#Head coaches`; used the main article.
1990+ coaches: Skip Hall (1987–1992), Pokey Allen (1993–1996), **Tom Mason (interim, 1996)**,
**Houston Nutt (1997)**, **Dirk Koetter (1998–2000)**, **Dan Hawkins (2001–2005)**,
**Chris Petersen (2006–2013)**, **Bob Gregory (interim, 2013)**, **Bryan Harsin (2014–2020)**,
Andy Avalos (2021–2023), Spencer Danielson (2023–present).
- Tom Mason is a genuine mid-season case, not a bowl handoff: he was interim for the **first ten games**
  of 1996 while Pokey Allen was on leave with cancer, and Allen returned for the last two. Mason's games
  are 1996-08-31 through 1996-11-09 (1–9); Allen's return covers 1996-11-16 and 1996-11-23. Confirmed
  the same Tom Mason who was SMU's interim head coach in 2014 (which is why he is scoped).
- Chris Petersen's last game was 2013-11-30; Bob Gregory coached only the 2013 Hawaii Bowl on
  2013-12-24. Gregory is scoped via his 2021 Washington interim stint — same person, same article.
- Bryan Harsin appears twice in this file (Arkansas State 2013, Boise State 2014–2020). He coached all of
  2020 including the Mountain West Championship Game on 2020-12-19 and resigned for Auburn on
  December 22; Boise State played no bowl, so no handoff.
- **Division note:** Boise State was I-AA through 1995. Skip Hall's and Pokey Allen's stints are I-AA and
  neither man is scoped; Tom Mason's 1996 interim stint is Boise State's first I-A season.
- **REJECTED — different people:** Skip Hall is not Cory Hall. Pokey Allen is not Terry or Tom Allen.
  Tom Mason is not Derek Mason or Glen Mason. Dabo Swinney, Bobby Bowden, Nick Saban, Mack Brown,
  Mike Bellotti, Steve Sarkisian and Don James all appear on the page as prose or award trivia
  (Bowden as the name of a trophy Ashton Jeanty won; James as Skip Hall's former boss at Washington) —
  none of them coached Boise State.

### Bowling Green — 3 rows
Page: `List of Bowling Green Falcons head football coaches` **redirects** to
`Bowling Green Falcons football#Head coaches`; used the main article. Its coach table omits interims, so
I read the era sections for those.
1990+ coaches: Moe Ankney (1986–1990), Gary Blackney (1991–2000), **Urban Meyer (2001–2002)**,
Gregg Brandon (2003–2008), **Dave Clawson (2009–2013)**, Adam Scheier (interim, 2013 bowl),
**Dino Babers (2014–2015)**, Brian Ward (interim, 2015 bowl), Mike Jinks (2016–2018),
Carl Pelini (interim, 2018), Scot Loeffler (2019–2024), Eddie George (2025–present).
- Clawson left for Wake Forest on December 10, 2013; his last game was the MAC Championship Game on
  2013-12-06 and Adam Scheier (not scoped) coached the Little Caesars Pizza Bowl.
- Babers became Syracuse's coach on December 5, 2015; his last game was the MAC Championship Game on
  2015-12-04 and Brian Ward (not scoped) coached the bowl.
- **Out of range, not rejected:** Don Nehlen coached Bowling Green 1968–1976 — same man as the scoped
  West Virginia coach, but far outside the window.
- **REJECTED — different people:** **Carl Pelini** (Bowling Green interim 2018, after Mike Jinks was
  relieved on October 14, 2018) is **not Bo Pelini**. Brian Ward is not Lorenzo Ward. Ruffin McNeill and
  Skip Holtz appear on this page only in prose about Dave Clawson's East Carolina candidacy — both do
  have real rows in this file, but at East Carolina, not here.

### Buffalo — 3 rows
Page: `List of Buffalo Bulls head football coaches` **redirects** to
`Buffalo Bulls football#Head coaches`; used the main article.
1990+ coaches: Sam Sanders (1990–1991), Jim Ward (1992–1994), Craig Cirbus (1995–2000), Jim Hofher
(2001–2005), **Turner Gill (2006–2009)**, **Jeff Quinn (2010–2014)**, Alex Wood (interim, 2014),
**Lance Leipold (2015–2020)**, Maurice Linguist (2021–2023), Pete Lembo (2024–present).
- Jeff Quinn is the one true in-season firing in this slice that could touch road games: he coached the
  **first seven games** of 2014 and was fired on October 13. His last game was 2014-10-11 at Eastern
  Michigan; Alex Wood (not scoped) took the final four. `end_date` 2014-10-11.
- **REJECTED — different people:** Sam Sanders is not Deion Sanders. Jim Ward is not Lorenzo Ward.
  Alex Wood (Buffalo interim 2014) is not scoped and is a different Alex Wood problem than the Florida
  A&M one below — see that section. **Brent Pry** appears on the Buffalo page only in a list of notable
  alumni ("Virginia Tech football head coach"); he never coached Buffalo.

### Cal State Fullerton — 0 rows
Page: `List of Cal State Fullerton Titans head football coaches` (exists; program dropped after 1992).
1990+ coaches: Gene Murphy (1980–1992) only. Not scoped.
- **Out of range, not rejected:** Jim Colletto was Cal State Fullerton's head coach **1975–1979** —
  plausibly the same Jim Colletto who coached Purdue 1991–1996, but the stint is fifteen years outside
  the window, so no row and no identity check needed.
- **REJECTED — different people:** Gene Murphy is not Tim Murphy.

### Central Michigan — 5 rows
Page: `List of Central Michigan Chippewas head football coaches` **redirects** to
`Central Michigan Chippewas football#Head coaches`; used the main article.
1990+ coaches: Herb Deromedi (1978–1993), Dick Flynn (1994–1999), Mike DeBord (2000–2003),
**Brian Kelly (2004–2006)**, **Jeff Quinn (interim, 2006)**, **Butch Jones (2007–2009)**,
**Steve Stripling (interim, 2009)**, Dan Enos (2010–2014), John Bonamego (2015–2018),
**Jim McElwain (2019–2024)**, Matt Drinkall (2025–present).
- Two bowl-only interim handoffs, both between scoped coaches: Kelly's last game was the MAC
  Championship Game on 2006-11-30 and Quinn coached the Motor City Bowl on 2006-12-26; Jones's last game
  was the MAC Championship Game on 2009-12-04 and Stripling coached the GMAC Bowl on 2010-01-06.
  Note Stripling's row carries `start_season`/`end_season` 2009 with January 2010 dates — the bowl is
  attached to the 2009 season per `rules.json`.
- Jeff Quinn appears twice in this file (Central Michigan interim 2006, Buffalo 2010–2014); Butch Jones
  appears twice (Central Michigan 2007–2009, Arkansas State 2021–present); Jim McElwain appears twice
  (Colorado State 2012–2014, Central Michigan 2019–2024).
- **REJECTED — different people:** **Tony Elliott** shows up as a full-string match on this page, but it
  is `Tony F. Elliott`, a 1984 Central Michigan player who went on to the Green Bay Packers — listed
  under notable alumni, never a coach. Not the Virginia head coach. Brian Kelly is not Chip Kelly.

### Charlotte — 2 rows
Page: `List of Charlotte 49ers head football coaches` **redirects** to
`Charlotte 49ers football#Head coaches`; used the main article. (Program ran 1946–1948, then nothing
until 2013, so there is nothing to scan before 2013.)
1990+ coaches: Brad Lambert (2013–2018), Will Healy (2018–2022), Peter Rossomando (interim, 2022),
**Biff Poggi (2023–2024)**, **Tim Brewster (interim, 2024)**, Tim Albin (2025–present).
- The second real in-season change in this slice, and both men are scoped. Poggi was fired on
  November 18, 2024, two days after a 59–24 home loss to South Florida; his last game is 2024-11-16 and
  Brewster's two games are 2024-11-23 (at Florida Atlantic) and 2024-11-30 (UAB).
- Poggi is scoped via his 2025 Michigan interim stint; Brewster via Minnesota 2007–2010. Both confirmed
  from their own articles.
- Note Brewster's infobox writes his Charlotte interim spell as "2024–25"; the schedule and the
  Tim Albin hire on December 7, 2024 both cap it at the 2024 season, so `end_season` is 2024.
- **REJECTED — different people:** none.

### Coastal Carolina — 0 rows
Page: `List of Coastal Carolina Chanticleers head football coaches` (exists; program began 2003).
All coaches: David Bennett (2003–2011), Joe Moglia (2012–2016, 2018), Jamey Chadwell (2017, 2019–2022),
Chad Staggs (interim, 2022), Tim Beck (2023–2025), Jeremiah Johnson (interim, 2025), Ryan Beard
(2026–present). None scoped.
- **REJECTED — different people:** **David Bennett** is not Phil Bennett. **Tim Beck** — the former
  Nebraska/Ohio State/Texas offensive coordinator — is not Tim Beckman, and has never been a
  power-conference head coach, which is why he is correctly absent from `scoped-coaches.txt`.
  Jeremiah Johnson is not Bobby, Mike, or Paul Johnson.

### Colorado State — 4 rows
Page: `List of Colorado State Rams head football coaches` (exists).
1990+ coaches: Earle Bruce (1989–1992), Sonny Lubick (1993–2007), Steve Fairchild (2008–2011),
**Jim McElwain (2012–2014)**, Dave Baldwin (interim, 2014 bowl), **Mike Bobo (2015–2019)**,
**Steve Addazio (2020–2021)**, Jay Norvell (2022–2025), Tyson Summers (interim, 2025),
**Jim L. Mora (2026–present)**.
- McElwain left for Florida after the 2014 regular season; his last game was 2014-11-28 at Air Force and
  Dave Baldwin (not scoped) coached the Las Vegas Bowl.
- Steve Addazio is scoped via Temple 2011–2012 and Boston College 2013–2019 — confirmed same article.
- **Jim L. Mora is a live, current row.** He was hired away from UConn on November 26, 2025 and is
  Colorado State's head coach for the 2026 season now in progress (his infobox shows a 2–0 record
  through 2026-09-12). Confirmed the same Jim L. Mora who coached UCLA 2012–2017. `end_season` null.
- **Out of range, not rejected:** Earle Bruce's Colorado State stint straddles the window (1989–1992) but
  he is not scoped — his Ohio State tenure ended in 1987.
- **REJECTED — different people:** **Jay Norvell** (2022–2025) is not **Mike Norvell**. Dave Baldwin and
  Tyson Summers are not scoped under any spelling.

### East Carolina — 3 rows
Page: `List of East Carolina Pirates head football coaches` (exists).
1990+ coaches: **Bill Lewis (1989–1991)**, Steve Logan (1992–2002), John Thompson (2003–2004),
**Skip Holtz (2005–2009)**, **Ruffin McNeill (2010–2015)**, Scottie Montgomery (2016–2018),
David Blackwell (interim, 2018), Mike Houston (2019–2024), Blake Harrell (2024–present).
- Bill Lewis's row starts **1989**, unclamped as instructed; he coached East Carolina's Peach Bowl win on
  January 1, 1992 (attached to the 1991 season) before moving to Georgia Tech.
- Ruffin McNeill is scoped via his 2009 Texas Tech interim stint — confirmed from his own article.
- **Out of range, not rejected:** Pat Dye coached East Carolina **1974–1979**. Same man as the scoped
  Auburn coach, but sixteen years before the window.
- **REJECTED — different people:** **Scottie Montgomery** is not Philip Montgomery. John Thompson
  (East Carolina 2003–2004) also served as Arkansas State's bowl interim in 2012 and 2013 — the same
  person in both places, but not scoped either way. David Blackwell and Blake Harrell are not scoped.

### East Tennessee State — 2 rows
Page: `List of East Tennessee State Buccaneers head football coaches` (exists).
1990+ coaches: Don Riley (1988–1991), **Mike Cavan (1992–1996)**, Paul Hamilton (1997–2003),
*[program dormant 2004–2014]*, **Carl Torbush (2015–2017)**, Randy Sanders (2018–2021),
George Quarles (2022–2023), Tre Lamb (2024), Will Healy (2025–present).
- Mike Cavan is scoped via SMU 1997–2001 — confirmed same article.
- **Torbush date discrepancy, resolved:** his article's lead says "East Tennessee State University (ETSU)
  from 2013 to 2017," which is the *hire-to-retirement* span. He was hired in 2013 to rebuild a dormant
  program, signed the first class in 2014, and the team's first game was 2015-09-03 against Kennesaw
  State. His year-by-year record and the ETSU coach list both start at 2015, so the row is **2015–2017**
  and the quote is the one that pins the first game. He retired on December 8, 2017.
- **REJECTED — different people:** **John Robinson** is a full-string match on this page, but it is
  `John Robinson (East Tennessee)`, head coach **1925–1929** — not the USC/UNLV John Robinson. Don Riley
  is not Lincoln or Mike Riley. Randy Sanders is not Deion Sanders. George Quarles is not George Perles.

### Eastern Michigan — 1 row
Page: `List of Eastern Michigan Eagles head football coaches` (exists).
1990+ coaches: Jim Harkema (1983–1992), **Ron Cooper (1993–1994)**, Rick Rasnick (1995–1999),
Tony Lombardi (interim, 1999), Jeff Woodruff (2000–2003), Al Lavan (interim, 2003), Jeff Genyk
(2004–2008), Ron English (2009–2013), Stan Parrish (interim, 2013), Chris Creighton (2014–present).
- Ron Cooper is scoped via Louisville 1995–1997 — confirmed same article, which lists Eastern Michigan
  1993–1994 immediately before it.
- **REJECTED — different people:** this page produced five full-string scoped matches that are all
  false. **Kevin Sumlin, Mike Locksley, Randy Shannon, Michael Haywood and Turner Gill** appear in a
  single 2008 sentence listing the six Black head coaches in FBS at the time Ron English was hired
  (at Houston, New Mexico, Miami, Miami (OH) and Buffalo respectively). None of them coached Eastern
  Michigan. Turner Gill does have a real row in this file — at Buffalo. Ron Cooper is not John Cooper.

### Florida A&M — 0 rows
Page: `List of Florida A&M Rattlers head football coaches` (exists).
1990+ coaches: Ken Riley (1986–1993), Billy Joe (1994–2004), Rubin Carter (2005–2007), Joe Taylor
(2008–2012), Earl Holmes (2012–2014), Corey Fuller (2014), Alex Wood (2015–2017), Willie Simmons
(2018–2023), James Colzie III (2024–2025), Quinn Gray (2026–present). None scoped.
- **REJECTED — different people:** **Willie Simmons** is not Bob Simmons (and is neither Willie Fritz nor
  Willie Taggart). **Ken Riley** — the former Bengals cornerback — is not Lincoln or Mike Riley.
  **Joe Taylor** is not Trooper Taylor or Troy Taylor. **Quinn Gray** matched on the *first* name against
  Jeff Quinn; unrelated. Corey Fuller is not Phillip Fulmer.

---

## Ambiguities and open items for the merge pass

1. **Two heading-derived quotes.** `Dino Babers era (2014–2015)` (Bowling Green) and
   `Skip Holtz era (2005–2009)` (East Carolina) are section headings, not sentences. Both verify
   verbatim against the rendered page, and no prose sentence on Wikipedia gives either full range.
   If the checker rejects headings, the fallbacks are:
   Babers — `On December 18, 2013, Babers was hired as the new head coach at Bowling Green following the departure of previous Falcons' coach Dave Clawson to Wake Forest.`
   (start) plus `Babers left the program in December 2015 to accept the head coaching position at Syracuse.` (end), both on the school article;
   Holtz — `East Carolina announced Skip Holtz as their 19th head football coach on December 3, 2004.`
   (start, his own article) plus `On January 14, 2010, it was announced that Holtz was leaving his position at East Carolina to take the head football coach position at the South Florida, replacing the recently fired Jim Leavitt.` (end, school article).
2. **Duplicate coaches across rows.** Bryan Harsin (×2), Butch Jones (×2), Jeff Quinn (×2),
   Jim McElwain (×2) each appear twice in this file at different schools, and several of these names also
   exist in the conference tenure files. Dedupe must key on (coach, school, start_season), not coach
   alone.
3. **`Jim L. Mora` spelling.** The row uses `Jim L. Mora` exactly as `scoped-coaches.txt` spells it.
   Wikipedia's article title is `Jim L. Mora` but the infobox renders him as "Jim Mora" and the prose
   sometimes as "Jim Mora Jr." Watch for an alias split in the coverage report.
4. **Live rows.** Three rows have `end_season: null` — Joe Moorhead (Akron), Butch Jones (Arkansas
   State), Jim L. Mora (Colorado State). All three are confirmed active in the 2026 season, which is in
   progress as of the sweep date.
5. **Bowl-only interim boundaries.** Nine of these rows end on a regular-season or conference-championship
   date because a non-scoped (or scoped) interim coached only the bowl. Since `rules.json` treats bowls as
   neutral-site and excludes them, these boundaries cannot change any road-game total — but they are
   recorded precisely anyway so the coach-of-record audit is clean.
6. **Coverage is intentionally partial.** This file is a gap sweep for scoped coaches only. It does
   **not** provide continuous 1990→present coverage for these eighteen schools, and it should not be fed
   to the continuity check in phase 4 — the 74-coach rosters above are the record of what was scanned.
7. **One page-format trap worth flagging to sibling agents.** Pages built on `{{Sortname}}` (Air Force,
   Akron, Army, Appalachian State, Cal State Fullerton, Coastal Carolina, Colorado State, East Tennessee
   State, Florida A&M in this slice) do **not** contain coaches' full names as contiguous strings in
   wikitext. A grep of `scoped-coaches.txt` against the raw page returns zero hits for Army even though
   Bobby Ross is there. Any sweep that relied on full-name grep alone silently missed rows.
