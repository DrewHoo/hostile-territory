# Gap sweep 4 — notes

Scope: head-coaching stints at 18 non-power schools, 1990 season → present, restricted to
coaches whose exact name appears in `data/research/scoped-coaches.txt` (471 names).
Output: `data/research/tenures-gap-4.json` — 50 rows.

## Method

1. For each school, fetched `List of <school> head football coaches` wikitext (`action=raw`).
   Where that page did not exist or redirected, fell back to the program's main article and,
   for completeness, to `Template:<school> football coach navbox` — the navbox is the most
   compact reliable coach sequence and caught coaches the main-article fallback omitted
   (notably Bo Pelini at Youngstown State, whose article section had no coach table).
2. Matched every 1990+ coach by **last name** against the scoped list (not full-string), so
   spelling variants surface as candidates rather than silently missing.
3. For every candidate, opened the coach's own Wikipedia article and confirmed the stint —
   same person, same school, same seasons. Rejections listed per school below.
4. Mid-season handoffs: pulled the season team article, read the infobox
   `head_coach` / `hc_games` / `head_coach2` fields plus the prose, and read the exact
   last-game / first-game dates off that season's schedule table.
5. Every `quote` was mechanically re-checked as a substring of the rendered text of its
   `source_url` (whitespace-normalized). 50/50 pass.

### Quote convention

One quote per row, and it backs the **season range** (the assertion a same-name mix-up would
corrupt). Exact mid-season dates are cited in the per-school notes below with their own URLs,
since the schema carries only one `source_url`. Three rows quote the mid-season fact instead
because it is the more fragile claim (Bob Toledo, Mike Price 2017, Gary Andersen 2019–20).

All rows are graded `secondary`: Wikipedia coach lists and biography leads are aggregates
someone else computed, not schedule lines or staff announcements.

### Clamping

Not clamped. Stints that begin before 1990 carry their real start season
(Curley Hallman 1988, Jim Tressel 1986). Stints that ended **entirely** before the 1990
season are excluded — they produce no games in the study window — and are listed below as
out-of-window so the omission is auditable.

---

## Per-school outcomes

### Southern Miss — 2 rows
- Page: `List of Southern Miss Golden Eagles head football coaches` ✅
- Found: **Curley Hallman** (1988–1990), **Larry Fedora** (2008–2011).
- Mid-season: the 1990 season infobox gives Hallman `hc_games = regular season` and Jeff Bower
  `interim; bowl game`. Hallman's last game = **Nov 10, 1990** at Auburn (game 11 of 11 regular);
  Bower took the Dec 28, 1990 All-American Bowl.
  Source: <https://en.wikipedia.org/wiki/1990_Southern_Miss_Golden_Eagles_football_team>
- Fedora: the 2011 season article says he "resigned at the end of the regular season," but the
  bowl article is explicit — "The game was also coach Larry Fedora's last game with the Golden
  Eagles" — so he coached the Dec 24, 2011 Hawaii Bowl and needs no mid-season split.
  Source: <https://en.wikipedia.org/wiki/2011_Hawaii_Bowl>
- **Rejected (different people):** Bobby Collins 1975–81 ≠ Geoff Collins; Reed Green 1937–48
  ≠ Dennis Green; Ellis Johnson 2012 ≠ Bobby/Mike/Paul Johnson; Will Hall 2021–24 ≠ Cory Hall;
  Scotty Walden (2020 interim) ≠ Jim Walden; Austin Peay (a school, matched on "Peay")
  ≠ Francis Peay.
- Not scoped: Jeff Bower, Todd Monken, Jay Hopson, Tim Billings, Reed Stringer, Charles Huff,
  Blake Anderson.

### Texas State — 4 rows
- Page: `List of Texas State Bobcats head football coaches` ✅
- Found: **Dennis Franchione** (1990–1991, as Southwest Texas State), **David Bailiff**
  (2004–2006), **Everett Withers** (2016–2018), **Dennis Franchione** again (2011–2015).
  Two separate Franchione rows, per the two stints.
- Mid-season: Withers was fired **Nov 18, 2018**; the infobox gives him the `first 11 games`
  and Chris Woods the `final game`. Last Withers game = **Nov 17, 2018** at Troy; Woods took
  Nov 24 vs Arkansas State.
  Source: <https://en.wikipedia.org/wiki/2018_Texas_State_Bobcats_football_team>
- **Rejected:** Chris Woods (2018 interim) ≠ Sparky Woods.
- **Out of window:** Jim Wacker (scoped) coached Texas State 1979–1982 — ends before 1990.
- Not scoped: John O'Hara, Jim Bob Helduser, Bob DeBesse, Manny Matsakis, Brad Wright,
  Jake Spavital, G. J. Kinne.

### The Citadel — 0 rows
- Page: `List of The Citadel Bulldogs head football coaches` ✅ (note: the title needs the
  leading "The" — `List of Citadel Bulldogs head football coaches` 404s).
- 1990+ sequence: Charlie Taaffe (1987–95), Don Powers (1996–2000), Ellis Johnson (2001–03),
  John Zernhelt (2004), Kevin Higgins (2005–13), Mike Houston (2014–15), Brent Thompson
  (2016–22), Maurice Drayton (2023– ). None scoped.
- **Rejected:** Kevin Higgins ≠ Patrick Higgins; Maurice Drayton ≠ Stan Drayton;
  Ellis Johnson ≠ Bobby/Mike/Paul Johnson; Tom Moore 1983–86 ≠ Kirby/Sherrone Moore.
- **Out of window:** Bobby Ross (scoped) coached The Citadel 1973–1977.

### Toledo — 5 rows
- Page: `List of Toledo Rockets head football coaches` ✅
- Found: **Nick Saban** (1990), **Gary Pinkel** (1991–2000), **Tim Beckman** (2009–2011),
  **Matt Campbell** (2011–2015), **Jason Candle** (2015–2025).
- Pinkel: Toledo played no bowl in 2000 (11 games, ended Nov 22), so his tenure ended cleanly
  with the season; he was hired at Missouri in December. No mid-season dates needed.
- Beckman → Campbell: the 2011 infobox reads `Tim Beckman (regular season) / Matt Campbell
  (bowl game)`. Beckman's last game = **Nov 25, 2011** vs Ball State; Campbell's first =
  **Dec 28, 2011** Military Bowl.
  Source: <https://en.wikipedia.org/wiki/2011_Toledo_Rockets_football_team>
- Campbell → Candle: Campbell's last game = **Nov 27, 2015** at Western Michigan; Candle's
  first = **Dec 22, 2015** Boca Raton Bowl.
  Source: <https://en.wikipedia.org/wiki/2015_Toledo_Rockets_football_team>
- **Judgment call on Candle's `interim` flag.** The 2015 season infobox labels him
  "interim; bowl game", but his own article says "Toledo named Candle as their head coach on
  December 2, 2015, after Campbell departed for Iowa State University" — i.e. he was the
  permanent hire *before* the Dec 22 bowl. Recorded as one row, 2015–2025, `interim: false`.
  Source: <https://en.wikipedia.org/wiki/Jason_Candle>
- Candle's end: he left for UConn in early December 2025; Robert Weiner (not scoped) took the
  Boca Raton Bowl as interim. Candle's last game = **Nov 29, 2025** vs Central Michigan
  (Toledo did not reach the MAC title game).
  Source: <https://en.wikipedia.org/wiki/2025_Toledo_Rockets_football_team>
- **Rejected:** Jack Murphy 1971–76 ≠ Tim Murphy (also pre-1990).
- Not scoped: Dan Simrell, Tom Amstutz, Robert Weiner, Mike Jacobs.

### Troy — 3 rows
- Page: `List of Troy Trojans head football coaches` ✅
- Found: **Neal Brown** (2015–2018), **Jon Sumrall** (2022–2023), **Gerad Parker**
  (2024–present).
- Mid-season: Sumrall was hired at Tulane **Dec 8, 2023**; the 2023 infobox gives Greg
  Gasparato the bowl game as interim. Sumrall's last Troy game = **Dec 2, 2023**, the Sun Belt
  Championship Game (Gasparato took the Dec 23 Birmingham Bowl).
  Sources: <https://en.wikipedia.org/wiki/2023_Troy_Trojans_football_team>,
  <https://en.wikipedia.org/wiki/Jon_Sumrall>
- Neal Brown coached all of 2015–2018 including the 2018 bowl; no mid-season split.
- **Rejected:** Brandon Hall (2021 interim) ≠ Cory Hall.
- **Out of window:** Chan Gailey (scoped) coached Troy 1983–1984.
- Not scoped: Robert Maddox, Larry Blakeney, Chip Lindsey, Greg Gasparato.

### Tulane — 5 rows
- Page: `List of Tulane Green Wave head football coaches` ✅
- Found: **Buddy Teevens** (1992–1996), **Tommy Bowden** (1997–1998), **Bob Toledo**
  (2007–2011), **Willie Fritz** (2016–2023), **Jon Sumrall** (2024–2025).
- Bowden: infobox gives him the regular season, Chris Scelfo the bowl. Last Bowden game =
  **Nov 26, 1998** vs Louisiana Tech; Scelfo took the Dec 31, 1998 Liberty Bowl.
  Source: <https://en.wikipedia.org/wiki/1998_Tulane_Green_Wave_football_team>
- Toledo: resigned **Oct 18, 2011** at 2–5; infobox gives him the `first 7 games`, Mark Hutson
  the remainder. Last Toledo game = **Oct 15, 2011** vs UTEP.
  Source: <https://en.wikipedia.org/wiki/2011_Tulane_Green_Wave_football_team>
- Fritz: left for Houston in December 2023; Slade Nagle took the Military Bowl as interim.
  Last Fritz game = **Dec 2, 2023**, the AAC Championship Game.
  Source: <https://en.wikipedia.org/wiki/2023_Tulane_Green_Wave_football_team>
- Sumrall: Florida's hire was reported **Nov 30, 2025**, but he coached Tulane's whole
  postseason — the Dec 5 AAC title game and the Dec 20, 2025 CFP first-round game at Ole Miss.
  No interim is listed in the 2025 infobox and his article says "Sumrall coached Tulane's 2025
  postseason game while also working to recruit and retain talent at Florida." So the row has
  no mid-season dates. **This one matters:** under `rules.json`, a CFP first-round campus game
  is a road game, so Tulane at Ole Miss (Dec 20, 2025) is Sumrall's, not a successor's.
  Source: <https://en.wikipedia.org/wiki/Jon_Sumrall>
- **Rejected:** Curtis Johnson 2012–15 ≠ Bobby/Mike/Paul Johnson; Will Hall 2026– ≠ Cory Hall;
  Greg Davis 1988–91 ≠ Brad/Butch Davis; Claude Simons Jr. 1942–45 ≠ Barry Lunney Jr./Mike
  Sanford Jr.; Jim Pittman 1966–70 ≠ Sam Pittman; R. R. Brown (pre-war) ≠ any scoped Brown;
  "Tulane Green" / "Bowling Green" ≠ Dennis Green (link-text artifacts).
- **Out of window:** Mack Brown (scoped) 1985–1987; Larry Smith (scoped) 1976–1979.
- Not scoped: Chris Scelfo, Mark Hutson, Slade Nagle.

### Tulsa — 4 rows
- List page **redirects** to `Tulsa Golden Hurricane football#Head coaches`; used that article's
  coach table plus the navbox.
- Found: **Steve Kragthorpe** (2003–2006), **Todd Graham** (2007–2010),
  **Philip Montgomery** (2015–2022), **Kevin Wilson** (2023–2024).
- No mid-season handoffs: Kragthorpe and Graham each coached their final bowl before leaving
  (Louisville Jan 2007, Pittsburgh Jan 2011); Montgomery was let go after the 2022 regular
  season (no bowl); the 2024 season infobox lists Wilson alone for all 12 games, with the
  firing after the Nov 30, 2024 finale.
  Source: <https://en.wikipedia.org/wiki/2024_Tulsa_Golden_Hurricane_football_team>
- Todd Graham's biography lead does not name Tulsa, so his row cites the program article's
  "Todd Graham era (2007–2010)" heading. Identity confirmed via his article: "Graham was
  introduced as Tulsa's 27th head football coach on January 12, 2007."
- **Rejected:** Gus Malzahn, Art Briles and June Jones all appear on the Tulsa page but **never
  as Tulsa head coach** (Malzahn and Briles as assistants/prose, Jones in an unrelated
  mention) — no rows. Also: John Cooper 1977–84 is the scoped John Cooper but pre-1990 at
  Tulsa; Fred Taylor 1898–99 ≠ Trooper/Troy Taylor; Arthur F. Smith 1918 ≠ any scoped Smith;
  Harvey L. Allen 1912 ≠ Terry/Tom Allen; Dale Hall ≠ Cory Hall; "St. Gregory"/"Bowling Green"
  are schools, not Bob Gregory / Dennis Green.
- Not scoped: David Rader, Pat Henderson, Keith Burns, Bill Blankenship, Tre Lamb.

### UAB — 1 row
- Page: `List of UAB Blazers head football coaches` ✅
- Found: **Watson Brown** (1995–2006). No mid-season change.
- Not scoped: Jim Hilyer, Neil Callaway, Garrick McGee, Bill Clark, Bryant Vincent,
  Trent Dilfer, Alex Mortensen.

### UMass — 0 rows
- List page **redirects** to `UMass Minutemen football#Head coaches`; used that table + navbox.
- 1990+ sequence: Jim Reid (1986–91), Mike Hodges (1992–97), Mark Whipple (1998–2003),
  Don Brown (2004–08), Kevin Morris (2009–11), Charley Molnar (2012–13), Mark Whipple
  (2014–18), Walt Bell (2019–21), Alex Miller (2021 interim), Don Brown (2022–24),
  Shane Montgomery (2024 interim), Joe Harasymiak (2025– ). None scoped.
- **Rejected:** Don Brown ≠ Fran/Mack/Neal/Watson Brown; Kevin Morris ≠ Chad/Eric Morris;
  Shane Montgomery ≠ Philip Montgomery; Josh Wallace ≠ Bobby Wallace; Fred W. Murphy
  1899–1900 ≠ Tim Murphy; John Johnson ≠ any scoped Johnson; "Shannon James" ≠ Don James.
- **Out of window:** Dick MacPherson (scoped) 1971–1977; Bob Stull (scoped) 1984–1985 — both
  end before 1990. (Bob Stull's UTEP stint, 1986–1988, is also pre-1990; see UTEP.)

### UNLV — 4 rows
- Page: `List of UNLV Rebels head football coaches` ✅
- Found: **Jeff Horton** (1994–1998), **John Robinson** (1999–2004), **Barry Odom**
  (2023–2024), **Dan Mullen** (2025–present).
- John Robinson identity confirmed: the scoped John Robinson is the USC head coach
  (1976–82, 1993–97) and the same man coached UNLV 1999–2004 — his article's coaching-record
  table runs USC → UNLV continuously. His biography lead omits UNLV, so the row cites the
  UNLV coach list.
- Mid-season: Odom accepted the Purdue job **Dec 8, 2024**; the 2024 infobox gives him the
  `first 13 games` and Del Alexander the bowl. Odom's last UNLV game = **Dec 6, 2024**, the
  Mountain West Championship Game (Alexander took the Dec 18 LA Bowl).
  Source: <https://en.wikipedia.org/wiki/2024_UNLV_Rebels_football_team>
- Mullen's row is open-ended (`end_season: null`) — 2026 season in progress.
- **Rejected:** Jim Strong 1990–93 ≠ Charlie Strong; Ron Meyer 1973–75 ≠ Urban Meyer;
  Mike Sanford Sr. 2005–09 ≠ Mike Sanford Jr. (father/son — the exact failure mode this sweep
  was told to watch for; Sanford Jr.'s only scoped-slice stint is Western Kentucky).
- Not scoped: Wayne Nunnely, Bobby Hauck, Tony Sanchez, Marcus Arroyo, Del Alexander.

### UTEP — 3 rows
- Page: `List of UTEP Miners head football coaches` ✅
- Found: **Mike Price** (2004–2012), **Mike Price** again (2017, interim), **Dana Dimel**
  (2018–2023).
- **The UTEP list page misses Price's second stint.** It shows Sean Kugler as 2013–2017 with no
  interim row, but Kugler resigned **Oct 2, 2017** and the season infobox reads
  `Sean Kugler (first 5 games) / Mike Price (interim; final 7 games)`. Price's 2017 window:
  first game **Oct 7, 2017** vs Western Kentucky, last game **Nov 25, 2017** at UAB.
  Recorded as a separate row with `interim: true`.
  Source: <https://en.wikipedia.org/wiki/2017_UTEP_Miners_football_team>
- Dimel: **no** mid-season split. The 2023 infobox lists Dimel alone for all 12 games
  (season ended Nov 25, 2023); his dismissal came after the finale.
  Source: <https://en.wikipedia.org/wiki/2023_UTEP_Miners_football_team>
- **Rejected:** Scotty Walden 2024– ≠ Jim Walden.
- **Out of window:** Bob Stull (scoped) coached UTEP 1986–1988.
- Not scoped: David Lee, Charlie Bailey, Gary Nord, Sean Kugler.

### UTSA — 2 rows
- Page: `List of UTSA Roadrunners head football coaches` ✅
- Found: **Larry Coker** (2011–2015), **Frank Wilson** (2016–2019). No mid-season changes.
- **Season-range discrepancy, resolved:** Coker's biography lead says "UTSA from 2011 to 2016,"
  but that counts the calendar year of his exit — the same article says "He resigned as UTSA
  coach on January 5, 2016," and UTSA's own coach list gives the seasons as 2011–2015. Row uses
  2011–2015 and cites the list page.
- **Rejected:** Frank Wilson is the scoped Frank Wilson (later LSU/Ole Miss assistant, UTSA HC
  2016–19) — confirmed, *not* Barry/Kevin/Norries Wilson.
- Not scoped: Jeff Traylor.

### Utah State — 5 rows
- Page: `List of Utah State Aggies head football coaches` ✅
- Found: **John L. Smith** (1995–1997), **Gary Andersen** (2009–2012), **Matt Wells**
  (2013–2018), **Gary Andersen** again (2019–2020), **Bronco Mendenhall** (2025–present).
  Two separate Andersen rows.
- Mid-season (Wells): left for Texas Tech **Nov 29, 2018**; infobox gives him the regular
  season and Frank Maile the bowl. Wells' last game = **Nov 24, 2018** at Boise State
  (Maile took the Dec 15 New Mexico Bowl).
  Source: <https://en.wikipedia.org/wiki/2018_Utah_State_Aggies_football_team>
- Mid-season (Andersen, 2nd stint): fired **Nov 7, 2020** after an 0–3 start; infobox gives him
  the `first three games`, Maile the remainder. Andersen's last game = **Nov 5, 2020** at
  Nevada.
  Source: <https://en.wikipedia.org/wiki/2020_Utah_State_Aggies_football_team>
- Andersen's biography lead does not date either Utah State stint, so the first-stint row cites
  the coach list. Identity is unambiguous (Wisconsin 2013–14, Oregon State 2015–17).
- **Rejected:** "Mysterious Walker" (a 1910s coach) ≠ DeWayne/Randy Walker; Blake Anderson
  2021–23 ≠ Gary Andersen (different spelling, different person — both appear on this page,
  which is exactly the trap); Nate Dreiling (2024 interim) and Frank Maile not scoped.
- **Out of window:** Bruce Snyder (scoped) coached Utah State 1976–1982.
- Not scoped: Chuck Shelton, Charlie Weatherbie, Dave Arslanian, Mick Dennehy, Brent Guy.
- Coverage gap in the source, noted: the navbox jumps Blake Anderson (2021–23) → Mendenhall
  (2025), omitting Dreiling's 2024 interim season. Irrelevant here (neither is scoped).

### Western Kentucky — 4 rows
- Page: `List of Western Kentucky Hilltoppers head football coaches` ✅
- Found: **Willie Taggart** (2010–2012), **Bobby Petrino** (2013), **Jeff Brohm** (2014–2016),
  **Mike Sanford Jr.** (2017–2018).
- **Season-range discrepancy, resolved (Taggart):** his biography lead says "Western Kentucky
  (2009 to 2012 seasons)," which counts his December 2009 hire. His own article's section
  heading and the WKU list both give 2010–2012; the row uses 2010–2012.
- Mid-season (Taggart): left for South Florida in December 2012; Lance Guidry took the bowl.
  Last Taggart game = **Nov 24, 2012** at North Texas (Guidry took the Dec 26 Little Caesars
  Bowl). Source: <https://en.wikipedia.org/wiki/2012_Western_Kentucky_Hilltoppers_football_team>
- Mid-season (Brohm): resigned for Purdue **Dec 5, 2016**; Nick Holt took the bowl. Brohm's
  last game = **Dec 3, 2016**, the C-USA Championship Game (Holt took the Dec 20 Boca Raton
  Bowl). Source: <https://en.wikipedia.org/wiki/2016_Western_Kentucky_Hilltoppers_football_team>
- Petrino coached all of 2013 (WKU played no bowl) and left for Louisville in January 2014.
- **Rejected:** Jack Harbaugh 1989–2002 ≠ Jay Harbaugh / Jim Harbaugh (father of both — a
  genuine near-miss, and his tenure covers most of the window, so this rejection carries
  weight); Tyson Helton 2019– ≠ Clay/Kim Helton; L. T. Smith 1920–21 ≠ any scoped Smith;
  Jeff Brohm **is** scoped and confirmed, distinct from scoped Brian Brohm (his brother, who
  was WKU co-OC in 2016 and never head coach there).
- **Out of window:** Dave Roberts (scoped) coached WKU 1984–1988.
- Not scoped: David Elson, Lance Guidry, Nick Holt.

### Western Michigan — 3 rows
- Page: `List of Western Michigan Broncos head football coaches` ✅
- Found: **Gary Darnell** (1997–2004), **Bill Cubit** (2005–2012), **P. J. Fleck**
  (2013–2016). No mid-season changes: Cubit's 2012 team went 4–8 with no bowl, and Fleck left
  for Minnesota after the 2016 season, WMU's list page and navbox both giving him 2013–2016
  with no interim successor in 2016.
- Note: this page uses `{{sortname}}` templates with no wikilinks for most rows, so a
  link-only scan misses the whole table. Caught by re-parsing with sortname support and
  cross-checking the navbox.
- **Rejected:** Jack Harbaugh 1982–86 ≠ Jay/Jim Harbaugh (pre-1990 anyway);
  Lance Taylor 2023– ≠ Trooper/Troy Taylor.
- Not scoped: Al Molde, Tim Lester.

### Wofford — 0 rows
- No list page (`List of Wofford Terriers head football coaches` 404s). Used
  `Wofford Terriers football` plus `Template:Wofford Terriers football coach navbox`.
- 1990+ sequence: Mike Ayers (1988–2017), Josh Conklin (2018–2022), Shawn Watson (2022– ).
  None scoped. Cross-checked against the article's year-by-year results table, which lists a
  coach per season — same three names, no gaps.
- **Rejected:** Steve Satterfield 1974–76 ≠ Scott Satterfield; Miles Brown (a player) ≠ any
  scoped Brown.

### Wyoming — 3 rows
- Page: `List of Wyoming Cowboys head football coaches` ✅
- Found: **Joe Tiller** (1991–1996), **Dana Dimel** (1997–1999), **Vic Koenning**
  (2000–2002). No mid-season changes; each left or was dismissed at a season boundary.
- **Out of window (all scoped, all end before 1990):** Fred Akers 1975–1976; Bill Lewis
  1977–1979; Pat Dye 1980; Dennis Erickson 1986. Four scoped names on this page produce zero
  rows — worth flagging because a careless sweep would emit them.
- Not scoped: Al Kincaid, Paul Roach, Joe Glenn, Dave Christensen, Craig Bohl, Jay Sawvel.

### Youngstown State — 2 rows
- **No list page** (`List of Youngstown State Penguins head football coaches` 404s), and the
  `Youngstown State Penguins football` article has **no head-coach table** — its sections run
  History / championships / postseason / venue / rivalries, with coaches only in prose. The
  fallback that worked was `Template:Youngstown State Penguins football coach navbox`.
  Without it, Bo Pelini would have been missed entirely.
- Found: **Jim Tressel** (1986–2000) — the row the brief called out — and **Bo Pelini**
  (2015–2019). Neither is a mid-season case: Tressel left for Ohio State in January 2001,
  Pelini for LSU in January 2020.
- Full 1990+ sequence for the record: Tressel (1986–2000), Jon Heacock (2001–2009),
  Eric Wolford (2010–2014), Pelini (2015–2019), Doug Phillips (2020– ).
- **Rejected:** Bill Narduzzi 1975–85 ≠ Pat Narduzzi (also pre-1990); Doug Phillips ≠ Joker
  Phillips; Brandian Ross (a player) ≠ Bobby Ross; Mark Mangino and Bob Davie appear on the
  page in unrelated prose, **never as YSU head coach** — no rows; "Robert Morris" is a school,
  not Chad/Eric Morris.

---

## Ambiguities and judgment calls, collected

1. **Jason Candle's 2015 bowl game** — the season infobox says "interim"; his biography says he
   was named head coach on Dec 2, 2015, before the Dec 22 bowl. Recorded as one non-interim row,
   2015–2025. If the pipeline prefers the infobox reading, split into a 2015 interim row plus
   2016–2025.
2. **Larry Coker's end season** — 2015 (last season coached), not the lead's "2016"
   (resignation calendar year).
3. **Willie Taggart's start season** — 2010 (first season coached), not the lead's "2009"
   (hire year).
4. **Jon Sumrall coached Tulane's Dec 20, 2025 CFP first-round game at Ole Miss** while already
   committed to Florida. Under `rules.json` that is a true road game, so it attributes to
   Sumrall. Flagging it because it is the one row in this file where a coach-attribution error
   would directly change a qualifying-game count.
5. **Two-stint coaches** get two rows each: Dennis Franchione (Texas State 1990–91, 2011–15),
   Mike Price (UTEP 2004–12, 2017 interim), Gary Andersen (Utah State 2009–12, 2019–20).
   Merge logic must not collapse them.
6. **UTEP's list page is incomplete** — it omits Mike Price's 2017 interim stint. The row here
   comes from the season article plus Price's biography. Anyone re-deriving UTEP from the list
   page alone will not reproduce it.
7. **Row count is higher than the brief's "0–3 per school" estimate** (50 rows across 15
   schools). These are G5 programs that churn head coaches and are a common landing spot for
   power-conference coaches before and after their P5 jobs.
