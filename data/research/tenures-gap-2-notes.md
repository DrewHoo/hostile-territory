# Gap sweep 2 — notes

Scope: head-coaching stints at 18 non-power schools, 1990 season → present, restricted to
the 471 names in `data/research/scoped-coaches.txt`. Output: `tenures-gap-2.json` (49 rows).

Method per school: fetch the Wikipedia "List of &lt;school&gt; head football coaches" page
(`?action=raw`), enumerate every head coach whose term touches 1990 or later, exact-match
and surname-match each name against `scoped-coaches.txt`, then open the coach's own article
to confirm it is the same person before emitting a row. Season ranges are the real stint
ranges, unclamped. Mid-season / pre-bowl handoffs carry exact last-game and first-game dates
taken from the relevant season article's schedule table.

Every one of the 49 quotes was re-fetched from its `source_url` via the MediaWiki parse API,
converted to plain text, and confirmed to appear verbatim (whitespace-insensitive compare —
Wikipedia's rendered HTML puts no space before punctuation that follows a link, so the quotes
match the visible text exactly).

---

## Per-school outcomes

### Florida Atlantic — 4 rows
Page used: `List of Florida Atlantic Owls head football coaches`. Quotes drawn from
`Florida Atlantic Owls football` (the main article has era headings with explicit year ranges
and dated hiring/firing sentences; the list page's per-coach data lives only in table cells).

- Howard Schnellenberger 2001–2011
- **Lane Kiffin 2017–2019** (the row the plan calls out). end_date 2019-12-07 — his last game
  was the Dec 7, 2019 C-USA Championship win over UAB; he left for Ole Miss before the Dec 21
  Boca Raton Bowl, which interim Glenn Spencer coached.
- Willie Taggart 2020–2022
- Tom Herman 2023–2024, end_date 2024-11-16. Fired Nov 18, 2024; the 2024 schedule runs
  … Nov 16, Nov 23, Nov 30, so Nov 16 was his last game and interim Chad Lunsford took the
  final two.

REJECTED — different person:
- **Carl Pelini** (FAU 2012–2013) vs. scoped **Bo Pelini**. Carl's article: "He is the older
  brother of Bo Pelini, the former head coach at Nebraska…". Brothers, not the same man.

Not scoped: Brian Wright (2013 int.), Charlie Partridge, Glenn Spencer (2019 int.),
Chad Lunsford (2024 int.), Zach Kittley.

### Florida International — 5 rows
The obvious title `List of Florida International Panthers head football coaches` is a **404**.
The real page is `List of FIU Panthers head football coaches`.

- Mario Cristobal 2007–2012
- Ron Turner 2013–2016, end_date 2016-09-24. Fired Sep 25, 2016; 2016 schedule Sep 1 / 9 / 17 /
  24 / Oct 1 …, so Sep 24 was his fourth and last game. Confirmed same person as the scoped
  Illinois coach: his article reads "He was the head coach at FIU from 2013 to 2016. Turner
  served as the head football coach at San Jose State University in 1992, and the University
  of Illinois Urbana–Champaign from 1997 to 2004."
- Ron Cooper 2016 (interim), start_date 2016-10-01 — "the final eight games of the 2016 season"
  = Oct 1 through Nov 26. Same person as the scoped Louisville coach (his article covers
  Eastern Michigan 1993–94, Louisville 1995–97, Alabama A&M 1998–2001, FIU interim 2016).
- Butch Davis 2017–2021 — same person as the Miami/UNC coach.
- Mike MacIntyre 2022–2024 — same person as the Colorado/San Jose State coach.

REJECTED — different person:
- **Willie Simmons** (FIU 2025–present) vs. scoped **Bob Simmons**. Unrelated.

Not scoped: Don Strock.

### Fresno State — 5 rows
Page used: `List of Fresno State Bulldogs head football coaches`.

- Tim DeRuyter 2012–2016, end_date 2016-10-22. Fired Oct 23, 2016 at 1–7; schedule
  … Oct 14, Oct 22, Oct 28 …, so Oct 22 was his last game (Eric Kiesau took the final four).
- Jeff Tedford 2017–2019
- Kalen DeBoer 2020–2021, end_date 2021-11-25. Regular season ended Nov 25, 2021; he resigned
  for Washington on Nov 29 and Lee Marks coached the Dec 18 New Mexico Bowl.
- Jeff Tedford 2022–2023, end_date 2023-11-25 (second stint). Regular season ended Nov 25, 2023;
  Tim Skipper took the Dec 16 bowl. Tedford then stepped down for health reasons in July 2024,
  i.e. before the 2024 season, so there is no 2024 mid-season change.
- Tim Skipper 2023–2024 (interim), start_date 2023-12-16 (the bowl) through the whole 2024 season.
  Same person as the scoped UCLA interim: his article covers Fresno State 2023 bowl + 2024 and
  UCLA 2025 after DeShaun Foster's firing. Note no game falls between 2023-11-25 and 2023-12-16,
  so the Tedford → Skipper boundary leaves no orphan game.

Not scoped: Jim Sweeney, Pat Hill, Eric Kiesau (2016 int.), Lee Marks (2021 int.), Matt Entz.

### Georgia Southern — 3 rows
`List of Georgia Southern Eagles head football coaches` is a **redirect** to
`Georgia Southern Eagles football#Head coaches`; the roster was read from that section.

- Paul Johnson 1997–2001 (I-AA; the same Paul Johnson who later coached Navy and Georgia Tech —
  article title `Paul Johnson (American football coach, born 1957)`)
- Willie Fritz 2014–2015, end_date 2015-12-05. Regular season ended Dec 5, 2015; he went to
  Tulane on Dec 7 and interim Dell McGee coached the Dec 23 GoDaddy Bowl (1 game).
- Clay Helton 2022–present (end_season null)

Not scoped: Tim Stowers, Frank Ellwood, Mike Sewak, Brian VanGorder, Chris Hatcher,
Jeff Monken, Dell McGee (2015 int. and 2024– HC), Tyson Summers, Chad Lunsford,
Kevin Whitley (2021 int.).

### Georgia State — 2 rows
Page used: `List of Georgia State Panthers head football coaches`.

- **Bill Curry 2010–2012.** The list page's Term column says "2008–2012" and counts 5 seasons,
  but the GC column is 33 games and the program did not play until 2010. Curry was hired in
  2008 to build the program and coached games only in 2010, 2011 and 2012, so the row uses
  2010–2012 (the seasons that can join to games). Same person as the scoped Georgia Tech /
  Alabama / Kentucky coach.
- Shawn Elliott 2017–2023. Hired Dec 8, 2016; resigned Feb 15, 2024 (offseason), so no
  mid-season change. Same person as the scoped South Carolina interim.

REJECTED — different person:
- **Trent Miles** (2013–2016) vs. scoped **Les Miles**. Unrelated.

Not scoped: Tim Lappano (2016 int.), Dell McGee.

Georgia State's one mid-season change in the window (Trent Miles → Tim Lappano, 2016)
involves no scoped coach, so no dates were chased.

### Hawaii — 3 rows
Page used: `List of Hawaii Rainbow Warriors head football coaches`.

- June Jones 1999–2007 (he coached the Jan 1, 2008 Sugar Bowl and was hired at SMU afterward)
- Nick Rolovich 2016–2019 — same person as the scoped Washington State (2020–21) and
  California (2025 interim) coach.
- Todd Graham 2020–2021 (resigned Jan 14, 2022; no mid-season change)

Not scoped: Bob Wagner, Fred von Appen, Greg McMackin, Norm Chow, Chris Naeole (2015 int.),
Timmy Chang.

### Idaho — 3 rows
`List of Idaho Vandals head football coaches` is a **redirect** to
`Idaho Vandals football#Head coaches`; roster read from that table.

- John L. Smith 1989–1994 (start is 1989, unclamped)
- Dennis Erickson 2006 (one season). His 1982–1985 Idaho stint is also his, but it ends
  entirely before 1990 and so contributes no in-window games; not emitted.
- Robb Akey 2007–2012, end_date 2012-10-20. Fired Oct 21, 2012 after the Oct 20 loss to
  Louisiana Tech; Jason Gesser took the final four (Nov 3 / 10 / 17 / 24). Same person as the
  scoped Oregon State 2025 interim.

REJECTED — different person:
- **Paul Petrino** (Idaho 2013–2021) vs. scoped **Bobby Petrino**. Brothers, not the same man.
- **Thomas Ford** (2025–present) vs. scoped **Danny Ford**. Unrelated.

Also noted and NOT emitted: **Keith Gilbertson** is scoped (California, Washington) and did
coach Idaho — but 1986–1988, wholly before the 1990 cutoff, so the stint contributes no games.

Not scoped: Chris Tormey, Tom Cable, Nick Holt, Jason Gesser (2012 int.), Jason Eck.

### Jacksonville State — 3 rows
Page used: `List of Jacksonville State Gamecocks head football coaches`.

- Jack Crowe 2000–2012 — same person as the scoped Arkansas coach (1990–1992).
- **Rich Rodriguez 2022–2024**, end_date 2024-12-06. **The list page's Term column is off by one
  year in this stretch** and should not be trusted: it prints Grass 2014–2020, Thurmond 2020,
  Rodriguez 2021–2024, while its own footnote says Grass coached the first nine games of the
  *2021* season and Thurmond the rest of *2021*. The 2021 season article confirms Grass and
  Thurmond, and the 2022 season article lists Rodriguez as head coach in his "1st" year (9–2).
  His own article's hiring date (Nov 30, 2021) and the list's own totals (4 "seasons" but 37
  games and a 27–10 record = 9–2, 9–4, 9–4) both fit 2022–2024, not 2021–2024. Row uses
  2022–2024. end_date is the Dec 6, 2024 C-USA Championship; he left for West Virginia
  (announced Dec 12) before the Dec 20 Cure Bowl.
- Rod Smith 2024 (interim), 2024-12-20 only — the Cure Bowl. **Confirmed same person** as the
  scoped Illinois 2020 interim: his article (`Rod Smith (American football coach)`) says
  "Smith previously served as the interim head coach, offensive coordinator and quarterbacks
  coach at Jacksonville State and Illinois," and separately that he was named Illinois interim
  after Lovie Smith's termination on Dec 13, 2020. Same man.

REJECTED — different person:
- **Maxwell Thurmond** (2021 int.) vs. scoped **Chris Thurmond** (Houston). Unrelated.
- **Mike Williams** (1997–1999) vs. scoped Bobby / Cadillac / Donte Williams. Unrelated.
- **Charles Kelly** (2025–present) vs. scoped **Brian Kelly** and **Chip Kelly**. Unrelated.

Not scoped: Bill Burgess, Jeff Richards (1999 int.), Bill Clark, John Grass.

### James Madison — 4 rows
`List of James Madison Dukes head football coaches` is a **redirect** to
`James Madison Dukes football#Head coaches`; roster read from that table.

- Everett Withers 2014–2015 — same person as the scoped UNC 2011 interim / Temple 2024 interim.
- Curt Cignetti 2019–2023, end_date 2023-11-25. Left for Indiana Nov 30, 2023; Damian
  Wroblewski coached the Dec 23 Armed Forces Bowl.
- Bob Chesney 2024–2025, end_date null. He was named UCLA's head coach on Dec 6, 2025 but
  "UCLA granted permission for Chesney to continue coaching James Madison University through
  its playoff run," so he coached JMU's whole 2025 season including the Dec 20 CFP game —
  no handoff, no orphan game. Same person as the scoped UCLA 2026 coach.
- **Billy Napier 2026–present.** Hired Dec 4, 2025 to succeed Chesney. This is Napier's second
  row in this file (see Louisiana below) and his third stint overall alongside Florida
  2022–2025 in `tenures-sec.json`.

REJECTED — different person: none. (Rip Scherer, JMU 1991–1994 and Memphis 1995–2000, is not
in the scoped list at all, under any spelling.)

Not scoped: Joe Purzycki, Rip Scherer, Alex Wood, Mickey Matthews, Mike Houston,
Damian Wroblewski (2023 int.).

### Kennesaw State — 0 rows
Page used: `List of Kennesaw State Owls head football coaches`. The program's entire coaching
history is Brian Bohannon (2015–2024), Chandler Burks (2024 interim) and Jerry Mack
(2025–present). None appears in `scoped-coaches.txt`, exactly or by surname.

### Kent State — 1 row
`List of Kent State Golden Flashes head football coaches` is a **redirect** to
`Kent State Golden Flashes football#Head coaches`; roster read from that table.

- Darrell Hazell 2011–2012, end_date null. Caveat: Hazell was named Purdue's head coach on
  Dec 5, 2012. His last Kent State game on the field was the Nov 30, 2012 MAC Championship;
  Kent State's Jan 6, 2013 GoDaddy Bowl is credited to him in Wikipedia's Kent State table
  (his 16–10 total requires the bowl) but neither the Kent State article nor the 2012 season
  article names a sideline coach for it. The bowl is a neutral-site game and therefore
  excluded from road games under `data/rules.json`, so the ambiguity cannot move any record;
  end_date is left null rather than asserting a boundary the sources don't state.

REJECTED — different person:
- **Sean Lewis** (2018–2022) vs. scoped **Bill Lewis**. Unrelated.

Also noted and NOT emitted: **Glen Mason** is scoped (Minnesota) and coached Kent State
1986–1987 — wholly pre-1990, no in-window games.

Not scoped: Dick Crum, Pete Cordelli, Jim Corrigall, Dean Pees, Doug Martin, Paul Haynes,
Kenni Burns, Mark Carney.

### Liberty — 2 rows
`List of Liberty Flames head football coaches` is a **redirect** to
`Liberty Flames football#Head coaches`; roster read from that table.

- Turner Gill 2012–2018 (FCS through 2017, FBS transition 2018)
- **Hugh Freeze 2019–2022**, end_date 2022-11-26. Discrepancy flagged: Freeze's own article
  says "Liberty University from 2018 to 2022," but he was *named* head coach on Dec 7, 2018
  and Turner Gill coached the 2018 season; the Liberty Flames football table gives his term as
  2019–2022. Row uses 2019–2022 and quotes the dated hiring sentence rather than the
  conflicting range. end_date is the Nov 26, 2022 regular-season finale — Auburn hired him
  Nov 28 and Liberty's Dec 20 Boca Raton Bowl went to an interim.

Not scoped: Sam Rutigliano, Ken Karcher, Danny Rocco, Jamey Chadwell.

### Long Beach State — 0 rows
Page used: `List of Long Beach State 49ers head football coaches`. The program was disbanded
after 1991, so only two coaches touch the window: George Allen (1990) and Willie Brown (1991).

REJECTED — different person:
- **George Allen** (1990) vs. scoped **Terry Allen** and **Tom Allen**. This is the NFL coach
  George Allen; unrelated to either.
- **Willie Brown** (1991) vs. scoped Fran / Mack / Neal / Watson Brown. Unrelated.

### Louisiana — 1 row
Page used: `List of Louisiana Ragin' Cajuns head football coaches`.

- Billy Napier 2018–2021, end_date 2021-12-04. His last game was the Dec 4, 2021 Sun Belt
  Championship; Florida hired him Dec 5 and Michael Desormeaux coached the Dec 18 New Orleans
  Bowl (the list page credits Desormeaux as a full head coach from 2021, not as an interim).

Not scoped: Nelson Stokley, Jerry Baldwin, Rickey Bustle, Mark Hudspeth, Michael Desormeaux.

### Louisiana Monroe — 2 rows
Page used: `List of Louisiana–Monroe Warhawks head football coaches` (note the en dash in the
title).

- Dave Roberts 1989–1993 (program was Northeast Louisiana then; start is 1989, unclamped).
  **Confirmed same person** as the scoped Baylor coach: `Dave Roberts (American football)`
  covers Western Kentucky 1984–1988, Northeast Louisiana 1989–1993 and Baylor 1997–1998, and
  is the same article URL cited by the Baylor row in `tenures-big-12.json`.
- Terry Bowden 2021–2023, end_date null. ULM fired him Nov 26, 2023, but the 2023 schedule
  ends Nov 25, so the firing came after the last game — no mid-season change.

REJECTED — different person:
- **Mike Collins** (2002 int.) vs. scoped **Geoff Collins**. Unrelated.

Not scoped: Ed Zaunbrecher, Bobby Keasler, Charlie Weatherbie, Todd Berry, Matt Viator,
Bryant Vincent.

### Louisiana Tech — 5 rows
Page used: `List of Louisiana Tech Bulldogs head football coaches`.

- Gary Crowton 1996–1998
- Derek Dooley 2007–2009
- Sonny Dykes 2010–2012 (left for California Dec 2012; Louisiana Tech played no 2012 bowl)
- Skip Holtz 2013–2021
- Sonny Cumbie 2022–present (end_season null)

REJECTED — different person, and the most dangerous near-miss in this slice:
- **Jack Bicknell Jr.** (Louisiana Tech 1999–2006) vs. scoped **Jack Bicknell** (Boston College
  1981–1990). Father and son. The elder Bicknell's article states "Bicknell's son, Jack Jr.,
  was the center for BC at the time of Flutie's miracle pass"; the younger's article covers
  only Louisiana Tech 1999–2006 as a head coach. A surname match would have silently credited
  eight Louisiana Tech seasons to the BC coach.

Not scoped: Joe Raymond Peace.

### Marshall — 2 rows
Page used: `List of Marshall Thundering Herd head football coaches`.

- Jim Donnan 1990–1995 (I-AA; won the 1992 I-AA title). Same person as the scoped Georgia coach.
- Rick Minter 2009 (interim), 2009-12-26 only — the Little Caesars Pizza Bowl. Same person as
  the scoped Cincinnati coach (1994–2003). The coach he replaced, Mark Snyder, is not scoped,
  so no boundary date was needed on the other side.

REJECTED — different person:
- **Mark Snyder** (2005–2009) vs. scoped **Bill Snyder** and **Bruce Snyder**. Unrelated.

Not scoped: George Chaump, Bob Pruett, Doc Holliday, Charles Huff, Tony Gibson.

### Memphis — 4 rows
Page used: `List of Memphis Tigers head football coaches`.

- Tommy West 2001–2009, end_date null — he was fired Nov 9, 2009 but, per his article,
  "West finished the season with Memphis," so there is no mid-season handoff. Same person as
  the scoped Clemson coach.
- Justin Fuente 2012–2015, end_date 2015-11-28. Virginia Tech hired him Nov 29, 2015; interim
  Darrell Dickey coached the Dec 30 Birmingham Bowl.
- Mike Norvell 2016–2019, end_date 2019-12-07. His last game was the Dec 7, 2019 AAC
  Championship; Florida State announced him Dec 8.
- Ryan Silverfield 2019–2025, start_date 2019-12-28, end_date 2025-11-27, interim **false**.
  He was named interim on Dec 8, 2019 and promoted to head coach on Dec 28, 2019 — the same
  day as the Cotton Bowl — and the Memphis list page numbers him as a full head coach, not an
  interim, so the flag is false. End: Arkansas hired him Nov 30, 2025; his last Memphis game
  was Nov 27, 2025 and interim Reggie Howard took the Dec 19 bowl.

REJECTED — different person / not scoped under any spelling:
- **Darrell Dickey** (2015 int.) — no Dickey in the scoped list; he is not a variant of
  **Sonny Dykes** or **Spike Dykes**, who are separate real people already in the list.
- **Rip Scherer** (1995–2000) — not scoped.

Not scoped: Chuck Stobart, Larry Porter, Reggie Howard (2025 int.), Charles Huff (2026–).

---

## Cross-file notes

- **Repeat coaches.** Billy Napier appears twice here (Louisiana 2018–2021, James Madison
  2026–) and once in `tenures-sec.json` (Florida 2022–2025). Jeff Tedford appears twice here
  (Fresno State 2017–2019 and 2022–2023) as two rows with the same source and quote, because
  the one sentence states both stints. Dell McGee, Chad Lunsford and Charles Huff each appear
  at two of these schools but are not scoped.
- **Division caveat (for the downstream game join, not a defect in these rows).** Several of
  these stints are wholly or partly outside FBS: Marshall 1990–1996 (I-AA), Georgia Southern
  1997–2001 and 2014–2015 partly, ULM 1989–1993 (I-AA), James Madison through 2021 (FCS),
  Jacksonville State 2000–2022 (FCS/transition), Liberty through 2017 (FCS), Kent State and
  the rest are FBS throughout. `rules.json` scopes records to FBS head-coaching games, so the
  pipeline — not this file — should decide which of these seasons produce eligible games.
  Season ranges here are the real stints, unclamped, as instructed.
- **Interim rows:** Ron Cooper (FIU 2016), Tim Skipper (Fresno State 2023–2024), Rod Smith
  (Jacksonville State 2024), Rick Minter (Marshall 2009). All four carry `interim: true`.
  Ryan Silverfield is deliberately `interim: false` (see Memphis above).
- **Grades:** all 49 rows are `secondary`. Every source is Wikipedia prose or a Wikipedia
  season-article lead, not a school staff announcement or a schedule line.
