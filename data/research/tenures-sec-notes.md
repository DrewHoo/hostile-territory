# SEC coach-tenure research notes

Beat: the `sec` list in `data/rules.json` — Alabama, Arkansas, Auburn, Florida, Georgia, Kentucky, LSU, Ole Miss, Mississippi State, Missouri, South Carolina, Tennessee, Texas, Texas A&M, Oklahoma, Vanderbilt. Coverage runs the 1990 season through the in-progress 2026 season (today: 2026-09-19), regardless of which conference a school played in for a given season.

Output: `data/research/tenures-sec.json`, 146 rows, 124 distinct coaches, 16 schools.

| school | rows | school | rows |
| --- | --- | --- | --- |
| Alabama | 7 | Missouri | 5 |
| Arkansas | 13 | Ole Miss | 11 |
| Auburn | 12 | Oklahoma | 7 |
| Florida | 13 | South Carolina | 8 |
| Georgia | 5 | Tennessee | 10 |
| Kentucky | 7 | Texas | 6 |
| LSU | 11 | Texas A&M | 10 |
| Mississippi State | 11 | Vanderbilt | 10 |

34 rows carry `interim: true`. 36 mid-season handoffs are pinned with exact dates (70 rows carry at least one date). Every school has unbroken season coverage 1990→2026, and no season at any school is covered by more than one row that lacks dates — so a season-level join is unambiguous everywhere except the 36 dated handoffs, which need the date join.

## Method and how to re-verify

Every `source_url` is a Wikipedia `?action=raw` URL, so the fetched body is wikitext, and every `quote` is a byte-exact substring of that body — extracted programmatically, never retyped. Two shapes:

- **Tenure rows** quote the coach's name cell and the years cell from the school's `List of <School> head football coaches` table. Those two cells are adjacent lines in the wikitext, so the quote is a two-line span. Where the name cell carries a long `{{#tag:ref|…}}` footnote the quote is long and ugly; that is the price of byte-exactness against this source. It is not a paraphrase and it is not trimmed.
- **Three rows** (Bryan McClendon / Georgia 2015, Frank Wilson / LSU 2025, Todd Fitch / Vanderbilt 2020) quote the season article's infobox instead, because those coaches are missing from their school's list page entirely. See "Rejected claims".

Mid-season dates are *not* carried in the row quote. Each one is receipted below in "Mid-season date receipts", with its own source URL and verbatim quote. Game dates come from the `{{CFB schedule entry}}` tables in the same season articles that state the coaching split, so the split and the dates are from one document.

## Grades: everything is `secondary`, on purpose

`grade` is `secondary` on all 146 rows. The rule in the brief is `primary` for the school's own list or announcement, or a contemporaneous news story; Wikipedia list and season articles are an aggregator's summary, so they are `secondary`. Grading them `primary` would have been the comfortable lie.

Upgrading is a job for the verification fleet, and the Wikipedia refs already name the targets. Ones I confirmed are live to a plain `curl` with a browser UA:

- `https://arkansasrazorbacks.com/arkansas-announces-change-in-leadership-of-its-football-program/` (Chad Morris out, 2019-11-10)
- `https://auburntigers.com/news/2022/11/28/football-hugh-freeze-named-head-football-coach-at-auburn.aspx`

Ones cited by Wikipedia but *not* worth planning around: `espn.com` article URLs return HTTP 202 with an empty body to `curl` — they need a real browser, and the school sites are Vue/JS apps whose article text may not survive a naive substring check. Any primary-grade upgrade should re-extract the quote from whatever the checker actually fetches.

## Ambiguities

1. **Texas A&M 2023 — who coached the Texas Bowl.** The 2023 season article contradicts itself: the infobox says Elijah Robinson had "interim; remainder of season", the prose says he "served as the team's interim head coach for the final 2 games of the season." A&M played three games after Jimbo Fisher's 2023-11-12 firing (Nov 18 Abilene Christian, Nov 25 at LSU, Dec 27 Texas Bowl), and Mike Elko was hired 2023-11-27 — before the bowl. Robinson's first game (2023-11-18) is pinned and Fisher's last (2023-11-11) is pinned, so the regular-season attribution is safe. The bowl's coach of record is open. Robinson's row carries no `end_date`; if the bowl turns out to be Elko's, the Robinson row needs one and Elko needs a 2023 row.
2. **Tennessee 1992 has a hole inside Johnny Majors's tenure.** Phillip Fulmer coached games 1–3 as interim while Majors recovered from bypass surgery, Majors came back for games 4–11, Fulmer took the Hall of Fame Bowl and stayed. One row can't express a hole, so Majors is `1977–1992` with `end_date: 1992-11-28` and the two Fulmer rows carry the exact edges (`1992-09-05`→`1992-09-19`, then `1993-01-01`→). **A date join must prefer the narrower dated row over Majors's span for 1992-09-05, 1992-09-12 and 1992-09-19.** This is the only row in the file whose season span covers games the coach did not coach.
3. **Ole Miss 2025 / Pete Golding's game count.** The list page credits Golding with 3 games, which is exactly the three 2025 playoff games (Dec 20 vs Tulane, Jan 1 Sugar Bowl, Jan 8 semifinal) — meaning the page has not been updated for the 2026 season now in progress. His 2026 coverage rests on the "2025–present" cell alone.
4. **Florida 2026 / Jon Sumrall's game count.** The list credits him with 0 games although the 2026 season is roughly three weeks old. Same staleness. Row is season-level with no dates, which is correct either way.
5. **Oklahoma 1994 / the Copper Bowl.** The 1994 season article says Gary Gibbs "resigned at the conclusion of the season" and Oklahoma's list shows no 1994 interim, so I credit Gibbs with the 1994-12-29 Copper Bowl. Not independently confirmed; if an interim coached it, Oklahoma gains a row.
6. **Arkansas 2025 / Petrino's end.** Petrino's interim row has no `end_date`: Ryan Silverfield was hired 2025-11-30, after Arkansas's 2025 finale (Nov 29), and Arkansas played no postseason. So the handoff is an offseason one and needs no date. Flagged only because a 2025 bowl appearance would change that.
7. **Alabama 2003 / Mike Price is deliberately absent.** Alabama's list carries him as coach #25 for 2003, but he was hired in December 2002 and fired in May 2003 without coaching a game. Including him would have put two undated coaches on Alabama's 2003 season and broken the join for no gain. The list's own footnote is the evidence: "Price was hired in December 2002 and fired in May 2003 without coaching an official game." If the downstream coverage report expects every numbered coach on every list, this is the one intentional omission.
8. **Interim-then-permanent stints.** Where a coach's interim period ends on a clean season or postseason boundary I split it into two rows so the flag is right: Matt Luke (Ole Miss 2017 interim / 2018–2019) and Zach Arnett (Mississippi State 2022 interim bowl / 2023 permanent). Where the promotion happened mid-season and changed nothing about who was on the sideline, I did not split: **Ed Orgeron is one LSU row, 2016–2021, `interim: false`**, though he was interim from 2016-10-01 until his 2016-11-26 promotion. Same call for Pete Golding, who was named permanent (not interim) when Kiffin left, so his row is `interim: false` from his first game.

## Rejected claims

Things a source asserted that I did not carry through.

1. **Arkansas's list gives Chad Morris "2017–2019". He coached zero games in 2017.** Bret Bielema coached all 12 of Arkansas's 2017 games (fired 2017-11-24, after the finale; no bowl) and Morris was hired 2017-12-06. The 22 games the same table credits Morris equal 12 (2018) + 10 (2019) exactly. Recorded as **2018–2019**. Carrying 2017 would have invented a Bielema/Morris overlap in a season where nothing changed.
2. **Florida's list marks nobody as interim.** Charlie Strong (2004), D. J. Durkin (2014), Randy Shannon (2017), Greg Knox (2021) and Billy Gonzales (2025) all get sequential head-coach numbers (21, 24, 26, 28, 30) as if they were hires. Each season article calls them interim. `interim: true` set from the season articles.
3. **Florida's list credits Greg Knox with 1 game in 2021. It was 2.** Dan Mullen was fired 2021-11-21 after game 11 of 13; Knox had Florida State (2021-11-27) and the Gasparilla Bowl (2021-12-23). The 2021 season article's infobox says Mullen had the "first 11 games", and the schedule table puts game 11 on 2021-11-20. Dates in this file follow the season article, not the games column.
4. **Ole Miss's list numbers Joe Lee Dunn as head coach #31 for 1994 with no interim marker.** The 1994 season article: "The Rebels were led by interim coach [[Joe Lee Dunn]]". `interim: true`. (Billy Brewer was fired in August 1994, so this handoff is preseason and needs no dates — Brewer ends at 1993.)
5. **Georgia's list page has no interim rows at all, and Bryan McClendon is missing entirely.** He coached the 2016-01-02 TaxSlayer Bowl after Mark Richt was relieved and then took the Miami job. Row sourced from the 2015 season article. Georgia's list goes Richt `2001–2015` → Smart `2016–present`, which silently hands a 2015-season game to nobody.
6. **LSU's list page jumps Brian Kelly (2022–2025) → Lane Kiffin (2026–present) with no 2025 interim.** Frank Wilson coached LSU's last five games of 2025 after Kelly's 2025-10-26 firing. Row sourced from the 2025 season article.
7. **Vanderbilt's list page jumps Derek Mason (2014–2020) → Clark Lea (2021–present).** Todd Fitch coached Vanderbilt's 2020 finale (2020-12-12 vs Tennessee) after Mason's 2020-11-29 firing. Row sourced from the 2020 season article.
8. **Arkansas's list folds two Bobby Petrino tenures into one row** (`2008–2011<br>2025`, one games total). Split into a non-interim 2008–2011 row and an interim 2025 row. Same for Oklahoma's Bob Stoops, which the list does separate correctly (1999–2016 and a 2021 "(Interim)" row).
9. **Mississippi State's list gives Zach Arnett one "2022–2023" row**, which hides that 2022 was a single interim bowl game after Mike Leach's death and 2023 was a permanent season ended by a 2023-11-13 firing. Split. Both rows quote the same list line, so the quote does not distinguish them; the dates and the receipts below do.
10. **Ole Miss's list gives Matt Luke one "2017–2019" row** while its own footnote says the interim tag was removed after 2017. Split.
11. **Don't cross-check interims with the games column on every list.** Tennessee's and Kentucky's tables put *seasons* where Florida's and Arkansas's put *games*. Reading Tennessee's "1" for Brady Hoke as one game would be wrong — Hoke coached two (2017-11-18 LSU, 2017-11-25 Vanderbilt).

## Name aliases — candidates for `data/name-aliases.json` (not edited)

Canonical spelling in this file is on the left.

- `Phillip Fulmer` — press and most aggregators use **Phil Fulmer**. Highest-risk split in the file.
- `Eliah Drinkwitz` — widely **Eli Drinkwitz**.
- `Cadillac Williams` — legal name **Carnell Williams**; the al.com story cited by Auburn's own list is headlined "Carnell 'Cadillac' Williams".
- `D. J. Durkin` — three spellings across the pages I fetched: `D. J.|Durkin` (Auburn list), `D. J. |Durkin` with a stray space (Florida list), `D.J. Durkin` (2014 Florida article prose). Appears at two schools (Florida 2014, Auburn 2025).
- `Barry Lunney Jr.` — also **Barry Lunney**.
- `R. C. Slocum` — also **R.C. Slocum**, **RC Slocum**.
- `Mike DuBose` — also **Mike Dubose**.
- `Guy Morriss` — two s's. Do not normalize toward "Morris": Arkansas's **Chad Morris** is a different person and a fuzzy match would collide.
- `Gene Chizik` — common misspelling **Chizek**.
- `Rockey Felker` — not **Rocky**.
- `John L. Smith` (Arkansas 2012) and `Larry Smith` (Missouri 1994–2000) — never collapse to "Smith".
- Wikipedia disambiguators to strip, since they appear inside the quotes and could leak into a parser: `Mike Archer (American football)`, `Hal Hunter (American football, born 1959)`, `Brad Davis (American football coach)`, `Brian Kelly (American football coach)`, `Matt Luke (American football)`, `Shawn Elliott (American football)`, `Bill Oliver (American football)`, `Brad Scott (American football)`, `Watson Brown (American football)`, `James Franklin (American football coach)`, `Derek Dooley (American football)`, `Tom Herman (American football)`, `John Blake (American football)`, `Larry Smith (American football coach)`, `Mike Leach (American football coach)`, `Frank Wilson (American football)`, `Jeff Banks (American football)`, `Bill Edwards (American football coach)`.

### One person, two or three of my schools — must resolve to a single coach

Steve Spurrier (Florida 1990–2001, South Carolina 2005–2015) · Nick Saban (LSU 2000–2004, Alabama 2007–2023) · Lane Kiffin (Tennessee 2009, Ole Miss 2020–2025, LSU 2026–) · Dennis Franchione (Alabama 2001–2002, Texas A&M 2003–2007) · Tommy Tuberville (Ole Miss 1995–1998, Auburn 1999–2008) · Houston Nutt (Arkansas 1998–2007, Ole Miss 2008–2011) · Hugh Freeze (Ole Miss 2012–2016, Auburn 2023–2025) · Ed Orgeron (Ole Miss 2005–2007, LSU 2016–2021) · Will Muschamp (Florida 2011–2014, South Carolina 2016–2020) · Dan Mullen (Mississippi State 2009–2017, Florida 2018–2021) · Greg Knox (Mississippi State 2017 and 2023, Florida 2021 — three separate interim stints) · Joe Kines (Arkansas 1992, Alabama 2006) · Gerry DiNardo (Vanderbilt 1991–1994, LSU 1995–1999) · Charlie Strong (Florida 2004, Texas 2014–2016) · D. J. Durkin (Florida 2014, Auburn 2025) · Bobby Petrino (Arkansas twice) · Bob Stoops (Oklahoma twice) · Jackie Sherrill (Texas A&M 1982–1988, Mississippi State 1991–2003) · Woody Widenhofer (Missouri 1985–1988, Vanderbilt 1997–2001) · Bill Curry (Alabama 1987–1989, Kentucky 1990–1996) · Gary Darnell (Florida 1989, Texas A&M 2007) · Gene Stallings (Texas A&M 1965–1971, Alabama 1990–1996).

Note the pre-1990 halves above are outside the window and are not rows in this file — Bill Curry's Alabama tenure ends with the 1989 season (including the Jan 1, 1990 Sugar Bowl, which belongs to 1989), so Alabama's first row is Gene Stallings, 1990.

## Mid-season date receipts

36 handoffs. Each gives the outgoing coach's last game and the incoming coach's first game. Game dates are read from the `{{CFB schedule entry}}` table in the same article that states the split.

### Alabama 2006 — Mike Shula → Joe Kines

- outgoing coach's last game: **2006-11-18**; incoming coach's first game: **2006-12-28**
- source: https://en.wikipedia.org/wiki/2006_Alabama_Crimson_Tide_football_team?action=raw
- verbatim:

```
| head_coach = [[Mike Shula]]
| hc_year = 4th
| hc_games = regular season
| head_coach2 = [[Joe Kines]]
| hc_games2 = bowl game
```

### Arkansas 1992 — Jack Crowe → Joe Kines

- outgoing coach's last game: **1992-09-05**; incoming coach's first game: **1992-09-12**
- source: https://en.wikipedia.org/wiki/1992_Arkansas_Razorbacks_football_team?action=raw
- verbatim:

```
| head_coach = [[Jack Crowe]]
| hc_games = first game
| hc_year = 3rd
| head_coach2 = [[Joe Kines]]
| hc_games2 = interim; final 10 games
```

### Arkansas 2007 — Houston Nutt → Reggie Herring

- outgoing coach's last game: **2007-11-23**; incoming coach's first game: **2008-01-01**
- source: https://en.wikipedia.org/wiki/2007_Arkansas_Razorbacks_football_team?action=raw
- verbatim:

```
| head_coach = [[Houston Nutt]]
| hc_year = 10th
| hc_games = regular season
| head_coach2 = [[Reggie Herring]]
| hc_games2 = interim; bowl game
```

### Arkansas 2019 — Chad Morris → Barry Lunney Jr.

- outgoing coach's last game: **2019-11-09**; incoming coach's first game: **2019-11-23**
- source: https://en.wikipedia.org/wiki/2019_Arkansas_Razorbacks_football_team?action=raw
- verbatim:

```
| head_coach = [[Chad Morris]]
| hc_year = 2nd
| hc_games = first 10 games
| head_coach2 = [[Barry Lunney Jr.]]
| hc_games2 = interim; final 2 games
```

### Arkansas 2025 — Sam Pittman → Bobby Petrino

- outgoing coach's last game: **2025-09-27**; incoming coach's first game: **2025-10-11**
- source: https://en.wikipedia.org/wiki/2025_Arkansas_Razorbacks_football_team?action=raw
- verbatim:

```
| head_coach = [[Sam Pittman]]
| hc_year = 6th
| hc_games = first 5 games
| head_coach2 =[[Bobby Petrino]]
| hc_games2 = interim, remainder of season
```

### Auburn 1998 — Terry Bowden → Bill Oliver

- outgoing coach's last game: **1998-10-17**; incoming coach's first game: **1998-10-24**
- source: https://en.wikipedia.org/wiki/1998_Auburn_Tigers_football_team?action=raw
- verbatim:

```
| head_coach = [[Terry Bowden]]
| hc_year = 6th
| hc_games = first 6 games
| head_coach2 = [[Bill Oliver (American football)|Bill Oliver]]
| hc_games2 = interim; final 5 games
```

### Auburn 2020 — Gus Malzahn → Kevin Steele

- outgoing coach's last game: **2020-12-12**; incoming coach's first game: **2021-01-01**
- source: https://en.wikipedia.org/wiki/2020_Auburn_Tigers_football_team?action=raw
- verbatim:

```
  |head_coach= [[Gus Malzahn]]
  |hc_year=8th
  |hc_games=regular season
  |head_coach2 = [[Kevin Steele]]
  |hc_games2 = interim; bowl game
```

### Auburn 2022 — Bryan Harsin → Cadillac Williams

- outgoing coach's last game: **2022-10-29**; incoming coach's first game: **2022-11-05**
- source: https://en.wikipedia.org/wiki/2022_Auburn_Tigers_football_team?action=raw
- verbatim:

```
| head_coach = [[Bryan Harsin]]
| hc_year = 2nd
| hc_games = first 8 games
| head_coach2 = [[Cadillac Williams]]
| hc_games2 = interim; final 4 games
```

### Auburn 2025 — Hugh Freeze → D. J. Durkin

- outgoing coach's last game: **2025-11-01**; incoming coach's first game: **2025-11-08**
- source: https://en.wikipedia.org/wiki/2025_Auburn_Tigers_football_team?action=raw
- verbatim:

```
| head_coach = [[Hugh Freeze]]
| hc_year = 3rd
| hc_games = first 9 games
| head_coach2 = [[D. J. Durkin]]
| hc_games2 = interim; remainder of season
```

### Florida 2004 — Ron Zook → Charlie Strong

- outgoing coach's last game: **2004-11-20**; incoming coach's first game: **2004-12-31**
- source: https://en.wikipedia.org/wiki/2004_Florida_Gators_football_team?action=raw
- verbatim:

```
Defensive coordinator [[Charlie Strong]] was interim head coach for the bowl game.
```

### Florida 2014 — Will Muschamp → D. J. Durkin

- outgoing coach's last game: **2014-11-29**; incoming coach's first game: **2015-01-03**
- source: https://en.wikipedia.org/wiki/2014_Florida_Gators_football_team?action=raw
- verbatim:

```
|head_coach         = [[Will Muschamp]]
|hc_games = regular season
|hc_year = 4th
| head_coach2 = [[D. J. Durkin]]
|hc_games2 = interim; bowl game
```

### Florida 2017 — Jim McElwain → Randy Shannon

- outgoing coach's last game: **2017-10-28**; incoming coach's first game: **2017-11-04**
- source: https://en.wikipedia.org/wiki/2017_Florida_Gators_football_team?action=raw
- verbatim:

```
|head_coach  = [[Jim McElwain]]
|hc_year = 3rd
|hc_games = first 7 games
|head_coach2 = [[Randy Shannon]]
|hc_games2 = interim; remainder of season
```

### Florida 2021 — Dan Mullen → Greg Knox

- outgoing coach's last game: **2021-11-20**; incoming coach's first game: **2021-11-27**
- source: https://en.wikipedia.org/wiki/2021_Florida_Gators_football_team?action=raw
- verbatim:

```
| head_coach = [[Dan Mullen]]
| hc_year = 4th
| hc_games = first 11 games
| head_coach2 = [[Greg Knox]]
| hc_games2 = interim
```

### Florida 2025 — Billy Napier → Billy Gonzales

- outgoing coach's last game: **2025-10-18**; incoming coach's first game: **2025-11-01**
- source: https://en.wikipedia.org/wiki/2025_Florida_Gators_football_team?action=raw
- verbatim:

```
| head_coach = [[Billy Napier]]
| hc_year = 4th
| hc_games = first 7 games
| head_coach2 = [[Billy Gonzales]]
| hc_games2 = interim; remainder of season
```

### Georgia 2015 — Mark Richt → Bryan McClendon

- outgoing coach's last game: **2015-11-28**; incoming coach's first game: **2016-01-02**
- source: https://en.wikipedia.org/wiki/2015_Georgia_Bulldogs_football_team?action=raw
- verbatim:

```
| head_coach = [[Mark Richt]]
| hc_year = 15th
| hc_games = regular season
| head_coach2 = [[Bryan McClendon]]
| hc_games2 = interim; bowl game
```

### LSU 1999 — Gerry DiNardo → Hal Hunter

- outgoing coach's last game: **1999-11-13**; incoming coach's first game: **1999-11-26**
- source: https://en.wikipedia.org/wiki/1999_LSU_Tigers_football_team?action=raw
- verbatim:

```
| head_coach = [[Gerry DiNardo]]
| hc_year = 5th
| hc_games = first 10 games
| head_coach2 = [[Hal Hunter (American football, born 1959)|Hal Hunter]]
| hc_games2 = interim, final game
```

### LSU 2016 — Les Miles → Ed Orgeron

- outgoing coach's last game: **2016-09-24**; incoming coach's first game: **2016-10-01**
- source: https://en.wikipedia.org/wiki/2016_LSU_Tigers_football_team?action=raw
- verbatim:

```
| head_coach = [[Les Miles]]
| hc_year = 12th
| hc_games = first 4 games
| head_coach2 = [[Ed Orgeron]]
| hc_games2 = interim; final 8 games
```

### LSU 2021 — Ed Orgeron → Brad Davis

- outgoing coach's last game: **2021-11-27**; incoming coach's first game: **2022-01-04**
- source: https://en.wikipedia.org/wiki/2021_LSU_Tigers_football_team?action=raw
- verbatim:

```
  |head_coach=[[Ed Orgeron]]
  |hc_year= 5th
  |hc_games= regular season
  |head_coach2= [[Brad Davis (American football coach)|Brad Davis]]
  |hc_games2=interim; bowl game
```

### LSU 2025 — Brian Kelly → Frank Wilson

- outgoing coach's last game: **2025-10-25**; incoming coach's first game: **2025-11-08**
- source: https://en.wikipedia.org/wiki/2025_LSU_Tigers_football_team?action=raw
- verbatim:

```
| head_coach = [[Brian Kelly (American football coach)|Brian Kelly]]
| hc_year = 4th
| hc_games = first 8 games
| head_coach2 = [[Frank Wilson (American football)|Frank Wilson]]
| hc_games2 = interim; remainder of season
```

### Mississippi State 2017 — Dan Mullen → Greg Knox

- outgoing coach's last game: **2017-11-23**; incoming coach's first game: **2017-12-30**
- source: https://en.wikipedia.org/wiki/2017_Mississippi_State_Bulldogs_football_team?action=raw
- verbatim:

```
  |head_coach=[[Dan Mullen]]
  |hc_year=9th
  |hc_games=regular season
  |head_coach2 = [[Greg Knox]]
  |hc_games2=interim; bowl game
```

### Mississippi State 2022 — Mike Leach → Zach Arnett

- outgoing coach's last game: **2022-11-24**; incoming coach's first game: **2023-01-02**
- source: https://en.wikipedia.org/wiki/2022_Mississippi_State_Bulldogs_football_team?action=raw
- verbatim:

```
| head_coach = [[Mike Leach (American football coach)|Mike Leach]]
| hc_year = 3rd
| hc_games = regular season
| head_coach2 = [[Zach Arnett]]
| hc_games2 = bowl game
```

### Mississippi State 2023 — Zach Arnett → Greg Knox

- outgoing coach's last game: **2023-11-11**; incoming coach's first game: **2023-11-18**
- source: https://en.wikipedia.org/wiki/2023_Mississippi_State_Bulldogs_football_team?action=raw
- verbatim:

```
| head_coach = [[Zach Arnett]]
| hc_year = 1st
| hc_games = first 10 games
| head_coach2 = [[Greg Knox]]
| hc_games2 = interim; remainder of season
```

### Ole Miss 1998 — Tommy Tuberville → David Cutcliffe

- outgoing coach's last game: **1998-11-26**; incoming coach's first game: **1998-12-31**
- source: https://en.wikipedia.org/wiki/1998_Ole_Miss_Rebels_football_team?action=raw
- verbatim:

```
| head_coach = [[Tommy Tuberville]]
| hc_year = 4th
| hc_games = regular season
| head_coach2 = [[David Cutcliffe]]
| hc_games2 = bowl game
```

### Ole Miss 2025 — Lane Kiffin → Pete Golding

- outgoing coach's last game: **2025-11-28**; incoming coach's first game: **2025-12-20**
- source: https://en.wikipedia.org/wiki/2025_Ole_Miss_Rebels_football_team?action=raw
- verbatim:

```
| head_coach = [[Lane Kiffin]]
| hc_year = 6th
| hc_games = regular season{{efn|Left after the regular season to be head coach at [[LSU Tigers football|LSU]].}}
| head_coach2 = [[Pete Golding]]
| hc_games2 = postseason{{efn|Became head coach after Kiffin left.}}
```

### Oklahoma 2021 — Lincoln Riley → Bob Stoops

- outgoing coach's last game: **2021-11-27**; incoming coach's first game: **2021-12-29**
- source: https://en.wikipedia.org/wiki/2021_Oklahoma_Sooners_football_team?action=raw
- verbatim:

```
| head_coach        = [[Lincoln Riley]]
| hc_year           = 5th
| hc_games          = regular season
| head_coach2       = [[Bob Stoops]] (interim; bowl game)        
```

### South Carolina 2015 — Steve Spurrier → Shawn Elliott

- outgoing coach's last game: **2015-10-10**; incoming coach's first game: **2015-10-17**
- source: https://en.wikipedia.org/wiki/2015_South_Carolina_Gamecocks_football_team?action=raw
- verbatim:

```
| head_coach = [[Steve Spurrier]]
| hc_year = 11th
| hc_games = first 6 games
| head_coach2 = [[Shawn Elliott (American football)|Shawn Elliott]]
| hc_games2 = interim; remainder of season
```

### South Carolina 2020 — Will Muschamp → Mike Bobo

- outgoing coach's last game: **2020-11-14**; incoming coach's first game: **2020-11-21**
- source: https://en.wikipedia.org/wiki/2020_South_Carolina_Gamecocks_football_team?action=raw
- verbatim:

```
  |head_coach=[[Will Muschamp]]
  |hc_year=5th
  |hc_games=first 7 games
  |head_coach2=[[Mike Bobo]]
  |hc_games2=interim; remainder of the year
```

### Tennessee 1992 — Phillip Fulmer (interim, games 1-3) → Johnny Majors (returned, games 4-11)

- outgoing coach's last game: **1992-09-19**; incoming coach's first game: **1992-09-26**
- source: https://en.wikipedia.org/wiki/1992_Tennessee_Volunteers_football_team?action=raw
- verbatim:

```
| head_coach = [[Johnny Majors]]
| hc_games = games 4–11
| hc_year = 16th
| head_coach2 = [[Phillip Fulmer]]
| hc_games2 = games 1–3, bowl game
```

### Tennessee 1992 — Johnny Majors → Phillip Fulmer (bowl, then permanent)

- outgoing coach's last game: **1992-11-28**; incoming coach's first game: **1993-01-01**
- source: https://en.wikipedia.org/wiki/1992_Tennessee_Volunteers_football_team?action=raw
- verbatim:

```
| head_coach = [[Johnny Majors]]
| hc_games = games 4–11
| hc_year = 16th
| head_coach2 = [[Phillip Fulmer]]
| hc_games2 = games 1–3, bowl game
```

### Tennessee 2012 — Derek Dooley → Jim Chaney

- outgoing coach's last game: **2012-11-17**; incoming coach's first game: **2012-11-24**
- source: https://en.wikipedia.org/wiki/2012_Tennessee_Volunteers_football_team?action=raw
- verbatim:

```
  |head_coach=[[Derek Dooley (American football)|Derek Dooley]]
  |hc_year = 3rd
  |hc_games = first 11 games
  |head_coach2=[[Jim Chaney]]
  |hc_games2 = interim; final game
```

### Tennessee 2017 — Butch Jones → Brady Hoke

- outgoing coach's last game: **2017-11-11**; incoming coach's first game: **2017-11-18**
- source: https://en.wikipedia.org/wiki/2017_Tennessee_Volunteers_football_team?action=raw
- verbatim:

```
| head_coach = [[Butch Jones]]
| hc_year = 5th
| hc_games = first 10 games
| head_coach2 = [[Brady Hoke]]
| hc_games2 = interim; final 2 games
```

### Texas A&M 2007 — Dennis Franchione → Gary Darnell

- outgoing coach's last game: **2007-11-23**; incoming coach's first game: **2007-12-29**
- source: https://en.wikipedia.org/wiki/2007_Texas_A&M_Aggies_football_team?action=raw
- verbatim:

```
|head_coach=[[Dennis Franchione]]
|hc_year=5th
|hc_games=regular season
| head_coach2 = [[Gary Darnell]]
|hc_games2=interim; bowl game
```

### Texas A&M 2011 — Mike Sherman → Tim DeRuyter

- outgoing coach's last game: **2011-11-24**; incoming coach's first game: **2011-12-31**
- source: https://en.wikipedia.org/wiki/2011_Texas_A&M_Aggies_football_team?action=raw
- verbatim:

```
| head_coach = [[Mike Sherman]]
| hc_games = regular season
| head_coach2 = [[Tim DeRuyter]]
| hc_games2 = interim; bowl game
```

### Texas A&M 2017 — Kevin Sumlin → Jeff Banks

- outgoing coach's last game: **2017-11-25**; incoming coach's first game: **2017-12-29**
- source: https://en.wikipedia.org/wiki/2017_Texas_A&M_Aggies_football_team?action=raw
- verbatim:

```
| head_coach = [[Kevin Sumlin]]
| hc_games = regular season
| hc_year = 6th
| head_coach2 = [[Jeff Banks (American football)|Jeff Banks]]
| hc_games2 = interim; bowl game
```

### Texas A&M 2023 — Jimbo Fisher → Elijah Robinson

- outgoing coach's last game: **2023-11-11**; incoming coach's first game: **2023-11-18**
- source: https://en.wikipedia.org/wiki/2023_Texas_A&M_Aggies_football_team?action=raw
- verbatim:

```
| head_coach = [[Jimbo Fisher]] 
| hc_games = first 10 games
| hc_year = 6th
| head_coach2 = [[Elijah Robinson]]
| hc_games2 = interim; remainder of season
```

### Vanderbilt 2020 — Derek Mason → Todd Fitch

- outgoing coach's last game: **2020-11-28**; incoming coach's first game: **2020-12-12**
- source: https://en.wikipedia.org/wiki/2020_Vanderbilt_Commodores_football_team?action=raw
- verbatim:

```
  |head_coach=[[Derek Mason]]
  |hc_year=7th
  |hc_games=first 8 games
  |head_coach2=[[Todd Fitch]]
  |hc_games2 =interim; final game
```

