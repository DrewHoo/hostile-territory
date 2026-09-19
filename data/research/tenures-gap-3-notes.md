# Gap sweep 3 — notes

Beat: non-power schools where a scoped coach (one of the 471 names in
`data/research/scoped-coaches.txt`) held a head-coaching job. Slice: Miami (OH), Middle
Tennessee, Montana State, Navy, Nevada, New Mexico, New Mexico State, North Texas, Northern
Illinois, Northwestern State, Ohio, Old Dominion, Pacific, Portland State, Sam Houston,
San Diego State, San Jose State, South Alabama.

Window: every head coach whose tenure touched the 1990 season or later, through the 2026 season
in progress (as of 2026-09-19). Season ranges are unclamped — a stint that began before 1990 is
reported at its real start (Pettibone 1985, Harris 1989).

Output: `data/research/tenures-gap-3.json` — 36 rows.

## Rows per school

| school | page used | rows |
| --- | --- | --- |
| Miami (OH) | List of Miami RedHawks head football coaches | 3 |
| Middle Tennessee | List of Middle Tennessee Blue Raiders head football coaches | 1 |
| Montana State | Montana State Bobcats football § Head coaches (list page is a redirect) | 0 |
| Navy | List of Navy Midshipmen head football coaches | 1 |
| Nevada | List of Nevada Wolf Pack head football coaches | 1 |
| New Mexico | List of New Mexico Lobos head football coaches | 4 |
| New Mexico State | List of New Mexico State Aggies head football coaches | 3 |
| North Texas | List of North Texas Mean Green head football coaches | 4 |
| Northern Illinois | Northern Illinois Huskies football § Head coaches (list page is a redirect) | 5 |
| Northwestern State | List of Northwestern State Demons head football coaches | 0 |
| Ohio | Ohio Bobcats football § Head coaches (list page is a redirect) | 2 |
| Old Dominion | List of Old Dominion Monarchs head football coaches | 0 |
| Pacific | List of Pacific Tigers head football coaches | 1 |
| Portland State | List of Portland State Vikings head football coaches | 0 |
| Sam Houston | List of Sam Houston Bearkats head football coaches | 2 |
| San Diego State | List of San Diego State Aztecs head football coaches | 2 |
| San Jose State | List of San Jose State Spartans head football coaches | 6 |
| South Alabama | South Alabama Jaguars football § History (list page is a redirect) | 1 |
| **total** | | **36** |

All 36 quotes were mechanically re-checked as whitespace-normalized substrings of the plain-text
rendering of their `source_url` (MediaWiki `prop=extracts&explaintext`). 36/36 pass.

### Pages that don't exist as standalone lists

Four of the eighteen "List of <school> head football coaches" titles are redirects into the main
football article; I used the target section, as instructed:

- `List of Montana State Bobcats head football coaches` → `Montana State Bobcats football#Head coaches`
- `List of Northern Illinois Huskies head football coaches` → `Northern Illinois Huskies football#Head coaches`
- `List of Ohio Bobcats head football coaches` → `Ohio Bobcats football#Head coaches`
- `List of South Alabama Jaguars head football coaches` → `South Alabama Jaguars football#History` (prose,
  no coach table; South Alabama has only had four head coaches, all named in the History section)

## Confirmed matches, by school

Every name below was confirmed to be the same human as the scoped-list entry by reading the
coach's own Wikipedia article and finding the power-conference tenure that put them in scope.

**Miami (OH)** — the expected hotbed, and it delivered three.
- **Randy Walker** (1990–1998). Same person as Northwestern's Randy Walker: his article ties Miami
  1990–1998 and Northwestern 1999–2005 in one sentence. Note the list page's own link target is
  `Randy Walker (American football coach)`, disambiguating him from other Randy Walkers.
- **Terry Hoeppner** (1999–2004). Indiana 2005–2006. Confirmed.
- **Michael Haywood** (2009–2010). Confirmed via his Pitt hire (Dec 2010, fired in Jan 2011 before
  coaching a game — the Pitt stint produces no games, but Miami's do).

**Middle Tennessee**
- **Derek Mason** (2024–present). Vanderbilt 2014–2020. Confirmed.

**Navy**
- **Paul Johnson** (2002–2007). The list page links `Paul Johnson (American football coach, born 1957)`;
  bare `Paul Johnson` is a disambiguation page with ~15 entries, so I used the dated title. Georgia
  Tech 2008–2018 confirms scope.

**Nevada**
- **Jeff Horton** (1993, one full season). Confirmed: his article names Nevada 1993, UNLV 1994–1998,
  and the Minnesota interim job in 2010 (replacing Tim Brewster) that puts him in scope.

**New Mexico**
- **Dennis Franchione** (1992–1997). TCU/Alabama/Texas A&M. Confirmed.
- **Mike Locksley** (2009–2011). Maryland. Confirmed. Spelled "Mike Locksley" to match both
  `scoped-coaches.txt` and the existing `tenures-big-ten.json` rows.
- **Bob Davie** (2012–2019). Notre Dame 1997–2001. The list page links
  `Bob Davie (American football)`; bare `Bob Davie` is a disambiguation page (also an ice hockey
  player and an orchestra leader).
- **Bronco Mendenhall** (2024, one season). BYU/Virginia. Confirmed; left for Utah State after 2024.

**New Mexico State**
- **Hal Mumme** (2005–2008). Kentucky 1997–2000. Confirmed.
- **DeWayne Walker** (2009–2012). In scope via UCLA: his article states he was asked to head-coach
  the Bruins in the 2007 Las Vegas Bowl after Karl Dorrell's dismissal.
- **Jerry Kill** (2022–2023). Minnesota, plus the 2021 TCU interim stint. Confirmed.

**North Texas**
- **Dan McCarney** (2011–2015). Iowa State 1995–2006. Confirmed.
- **Phil Bennett** (2022, interim, one game). The list page links
  `Phil Bennett (American football)`; bare `Phil Bennett` is the Welsh rugby union fly-half
  (1948–2022) — a genuine same-name trap that I hit on the first fetch. In scope via SMU 2002–2007
  and the Pitt interim bowl in 2011.
- **Eric Morris** (2023–2025). In scope because he is now Oklahoma State's head coach (hired
  Nov 25 / introduced Dec 8, 2025).
- **Neal Brown** (2026–present). West Virginia 2019–2024. Confirmed.

**Northern Illinois** — five rows, the most of any school here.
- **Jerry Pettibone** (1985–1990). Oregon State 1991–1996. Unclamped at 1985 per instruction.
- **Jerry Kill** (2008–2010).
- **Dave Doeren** (2011–2012). NC State.
- **Rod Carey** — two rows (see mid-season section). Temple 2019–2021 puts him in scope.

**Ohio**
- **Jim Grobe** (1995–2000). Wake Forest 2001–2013, Baylor 2016. Confirmed.
- **Frank Solich** (2005–2020). Nebraska 1998–2003. Confirmed.

**Pacific**
- **Walt Harris** (1989–1991). Pitt 1997–2004, Stanford 2005–2006. Unclamped at 1989. Pacific was a
  Division I-A program until it dropped football after 1995, so these are FBS-era games.

**Sam Houston**
- **Willie Fritz** (2010–2013). Tulane, now Houston. Confirmed.
- **K. C. Keeler** (2014–2024). Temple 2006–2012 and again from 2025. Confirmed.

**San Diego State**
- **Brady Hoke** — two non-adjacent stints, two rows (2009–2010 and 2020–2023). Michigan 2011–2014.
  The 2020 return was a full head-coaching appointment, not an interim one: "On January 8, 2020,
  Rocky Long announced his retirement from coaching and Hoke was named the head coach for the
  Aztecs."

**San Jose State** — six rows, the second hotbed.
- **Terry Shea** (1990–1991). Rutgers 1996–2000. Confirmed.
- **Ron Turner** (1992, one season). Illinois 1997–2004. Confirmed — his article names both jobs in
  one sentence, so this is not the other Ron Turner.
- **Dick Tomey** (2005–2009). Arizona 1987–2000. Confirmed.
- **Mike MacIntyre** (2010–2012). Colorado 2013–2018. Confirmed.
- **Kent Baer** (2012, interim, one game). In scope via the Notre Dame interim game in 2004; his
  article names both one-game interim stints in a single sentence.
- **Brent Brennan** (2017–2023). Arizona 2024–present. Confirmed.

**South Alabama**
- **Major Applewhite** (2024–present). Houston 2017–2018. Confirmed.

## Mid-season handoffs pinned (9 handoffs, 11 dated rows)

Every one of these involves a scoped coach on one side. `end_date` is the last game the coach
worked, matching the convention in the existing tenure files (cf. Gary Andersen at Oregon State).

| school | scoped coach | last/first game | why |
| --- | --- | --- | --- |
| Miami (OH) | Michael Haywood | last 2010-12-03 | Coached the regular season and the MAC Championship Game (Dec 3, 2010 vs Northern Illinois); left for Pitt on Dec 16; Lance Guidry (not scoped) took the GoDaddy.com Bowl on Jan 6, 2011. |
| New Mexico | Mike Locksley | last 2011-09-24 | Fired Sept 25, 2011 after an 0–4 start. Game 4 was Sept 24 vs Sam Houston State; George Barlow (not scoped) took the final 8. |
| North Texas | Dan McCarney | last 2015-10-10 | Fired the same day as the 66–7 loss to Portland State (Oct 10, 2015). Mike Canales (not scoped) took the final 7. |
| North Texas | Phil Bennett | 2022-12-17 only | Interim for the Frisco Bowl alone after Seth Littrell (not scoped) was fired Dec 4, 2022. One-game row, `interim: true`. |
| North Texas | Eric Morris | last 2025-12-05 | Hired at Oklahoma State Nov 25, 2025 but stayed through the American Championship Game (Dec 5); Drew Svoboda (not scoped) took the New Mexico Bowl on Dec 27. |
| Northern Illinois | Jerry Kill | last 2010-12-03 | Coached through the MAC title game, then left for Minnesota; Tom Matukewicz (not scoped) took the Humanitarian Bowl (Dec 18, 2010). |
| Northern Illinois | Dave Doeren / Rod Carey | last 2012-11-30 / 2013-01-01 | Doeren coached through the MAC Championship Game (Nov 30, 2012) then left for NC State. Carey was interim for the Orange Bowl (Jan 1, 2013) and then took the job permanently — split into two rows, mirroring the Zach Arnett pattern in `tenures-sec.json`. |
| Sam Houston | K. C. Keeler | last 2024-11-29 | Coached the regular season (final game Nov 29, 2024), accepted Temple on Dec 1; Brad Cornelsen (not scoped) took the New Orleans Bowl (Dec 19, 2024). |
| San Jose State | Mike MacIntyre / Kent Baer | last 2012-11-24 / 2012-12-27 | MacIntyre resigned at the end of the regular season (final game Nov 24) for Colorado; Baer, who *is* scoped, coached the Military Bowl on Dec 27 — his own one-game row. |

Checked and found to be *clean* full-season tenures with no handoff (no dates needed): Randy
Walker, Terry Hoeppner, Derek Mason, Paul Johnson, Jeff Horton (1993 in full), Dennis Franchione,
Bob Davie, Bronco Mendenhall (coached all of 2024 before leaving for Utah State), Hal Mumme (fired
Dec 1, 2008, after the season ended), DeWayne Walker, Jerry Kill at New Mexico State (Wikipedia's
2023 season page lists him as sole head coach, including the Dec 16, 2023 bowl), Jerry Pettibone,
Jim Grobe, Walt Harris, Willie Fritz, both Brady Hoke stints (he coached the 2010 Poinsettia Bowl
before the Michigan hire on Jan 11, 2011), Terry Shea, Ron Turner, Dick Tomey, Brent Brennan,
Major Applewhite, Neal Brown.

## REJECTED — names that looked like a scoped coach and are not

This is the required half of the sweep. Each of these is a head coach at one of my schools in the
window whose name collides with a scoped name; each was checked and rejected as a different person.
No row was emitted for any of them.

| school | coach on the page | scoped name it collides with | verdict |
| --- | --- | --- | --- |
| Miami (OH) | Shane Montgomery (2005–2008) | Philip Montgomery | Different people. Montgomery was a Miami QB and later NC State OC; Philip Montgomery is the Tulsa head coach / Auburn OC. REJECT. |
| Montana State | Rob Ash (2007–2015) | Chris Ash | Different people. Rob Ash also coached Drake and Juniata; Chris Ash is the Rutgers head coach / Ohio State DC. REJECT. |
| Nevada | Jay Norvell (2017–2021) | Mike Norvell | Different people, not related as coaching kin in any source I read. Jay Norvell went Nevada → Colorado State; Mike Norvell went Memphis → Florida State. REJECT. |
| Nevada | Ken Wilson (2022–2023) | Kevin Wilson (also Barry/Frank/Norries Wilson) | Different people. The list page itself links `Ken Wilson (American football)`, a career Oregon/Washington State assistant. Kevin Wilson is the Indiana and Tulsa head coach. REJECT. |
| New Mexico | Danny Gonzales (2020–2023) | Billy Gonzales | Different people. Danny Gonzales is a New Mexico alum and Arizona State DC; Billy Gonzales is an SEC receivers coach. REJECT. |
| North Texas | Dennis Parker (1991–1993) | Gerad Parker | Different people, and different eras entirely (Gerad Parker was born in 1981). REJECT. |
| Northwestern State | Steve Roberts (2000–2001) | Dave Roberts | Different people. REJECT. |
| Ohio | Brian Smith (2024–2025) | Rod Smith, Terry Smith, John L. Smith, Jonathan Smith, Larry Smith, Lovie Smith | Different from all six. The list page links `Brian Smith (American football coach, born 1980)`. REJECT. |
| Portland State | Pokey Allen (1986–1992) | Terry Allen, Tom Allen | Different people; Pokey Allen (d. 1996) went Portland State → Boise State. REJECT. |
| Portland State | Tim Walsh (1993–2006) | Bill Walsh | Different people. REJECT. |
| San Diego State | Sean Lewis (2024–present) | Bill Lewis | Different people; Sean Lewis came from Kent State and Colorado. REJECT. |
| South Alabama | Joey Jones (2009–2017) | Butch Jones, June Jones, Pat Jones | Different from all three; Joey Jones is the Alabama alum who founded the South Alabama program. REJECT. |
| South Alabama | Steve Campbell (2018–2020) | Matt Campbell | Different people. REJECT. |

Non-matches with no name collision at all, listed so the sweep is auditable — every other head
coach in the window, checked against the 471-name list and absent from it: Boots Donnelly, Andy
McCollum, Rick Stockstill (MTSU); Earle Solomonson, Cliff Hysell, Mike Kramer, Jeff Choate, Brent
Vigen (Montana State); Elliot Uzelac, George Chaump, Charlie Weatherbie, Rick Lantz, Ken
Niumatalolo, Brian Newberry (Navy); Chris Ault, Jeff Tisdel, Chris Tormey, Brian Polian, Vai Taua,
Jeff Choate (Nevada); Mike Sheppard, Rocky Long, George Barlow, Jason Eck (New Mexico); Mike Knoll,
Jim Hess, Tony Samuel, Doug Martin, Tony Sanchez (New Mexico State); Corky Nelson, Matt Simon,
Darrell Dickey, Todd Dodge, Mike Canales, Seth Littrell, Drew Svoboda (North Texas); Charlie
Sadler, Joe Novak, Tom Matukewicz, Thomas Hammock, Rob Harley (Northern Illinois); Sam Goodwin,
Scott Stoker, Bradley Dale Peveto, Jay Thomas, Brad Laird, Blaine McCorkle (Northwestern State);
Tom Lichtenberg, Brian Knorr, Tim Albin, John Hauser (Ohio); Bobby Wilder, Ricky Rahne (Old
Dominion); Chuck Shelton (Pacific); Jerry Glanville, Nigel Burton, Bruce Barnum, Chris Fisk
(Portland State); Ron Randleman, Todd Whitten, Brad Cornelsen, Phil Longo (Sam Houston); Al
Luginbill, Ted Tollner, Tom Craft, Chuck Long, Rocky Long (San Diego State); John Ralston, Dave
Baldwin, Fitz Hill, Ron Caragher, Ken Niumatalolo (San Jose State); Kane Wommack (South Alabama);
Lance Guidry, Don Treadwell, Mike Bath, Chuck Martin (Miami (OH)).

## Scoped coaches at these schools whose stints fall *outside* the window

These are real scoped coaches with real head-coaching stints at my schools, but every game is
before the 1990 season, so no row was emitted. Flagging them in case the window ever moves.

- **Bob Toledo** — Pacific, 1979–1982 (scoped via UCLA 1996–2002).
- **Doug Graber** — Montana State, 1982 (scoped via Rutgers 1990–1995).
- **Bill Mallory** — Northern Illinois, 1980–1983 (scoped via Indiana 1984–1996).

## Ambiguities and flags for downstream

1. **Frank Solich's end season (Ohio).** Wikipedia's lead says he "held" the Ohio job "from 2005
   until 2021," but he never coached a 2021 game: he retired in the offseason and Tim Albin was
   named head coach on July 14, 2021. The Ohio coach table gives him 2005–2020 / 16 seasons. I set
   `end_season: 2020` and used the Albin-succession sentence as the quote, because that is the
   sentence that actually fixes the boundary. The start is fixed by the same article's "Frank Solich
   was named the 28th football coach of the Bobcats on December 16, 2004."
2. **Jim Grobe's start season (Ohio).** His own article says he "obtained his first head coaching
   job in 1994 with Ohio University" — that is the hire date, not a coached season. The Ohio Bobcats
   football article's section is titled "Jim Grobe era (1995–2000)" and its prose opens "In 1995,
   Jim Grobe took over…", and the coach table agrees on 1995–2000 / six seasons. Row uses 1995–2000.
3. **Hal Mumme's quote covers the start, not the end.** No single sentence in his article states
   "2005 to 2008." I used the December 2004 hiring sentence; the end is fixed by the same article's
   "Mumme was fired on December 1, 2008, after finishing 3–9 during the 2008 season" plus the
   New Mexico State coach table (2005–2008). Verify if you want the tighter citation.
4. **Bob Davie's 2019 absence — this one matters for the headline stat.** Davie had a serious heart
   incident after New Mexico's 2019 opener, and on September 5, 2019, run-game coordinator/OL coach
   Saga Tuitele was named **acting** head coach. The very next game was **New Mexico at Notre Dame,
   September 14, 2019** — a true road game against an AP top-10 Notre Dame team, i.e. exactly the
   kind of game this project counts. Wikipedia's 2019 season page lists Davie as sole head coach
   (no `head_coach2`), so per `rules.json` this is an `attribution-overrides.json` decision, not a
   tenure-row decision. I emitted Davie 2012–2019 unbroken and did **not** emit a Tuitele row
   (Tuitele is not scoped either way). Somebody should decide explicitly whether the Notre Dame
   game lands on Davie's ledger. Source:
   https://en.wikipedia.org/wiki/2019_New_Mexico_Lobos_football_team
5. **Rod Carey is two rows for one continuous employment.** 2012 interim (Orange Bowl only, Jan 1,
   2013) and 2013–2018 permanent. The merge step must not dedupe these into one row or the
   `interim` flag on the bowl game is lost. Same shape as Zach Arnett / Mississippi State and
   Phillip Fulmer / Tennessee in the existing files.
6. **Subdivision, not my call.** Several of these stints are FCS, not FBS: Sam Houston under Willie
   Fritz (2010–2013) and K. C. Keeler (2014–2021 of his 2014–2024 run; Sam Houston moved to FBS for
   2022). `rules.json` scopes "all of a scoped coach's FBS head-coaching games," so the pipeline
   will need to decide whether those FCS seasons are dropped. I reported the true stint ranges
   rather than pre-filtering them. Montana State, Portland State and Northwestern State contributed
   zero rows, so their FCS status never came up.
7. **Pacific's program is defunct** (dropped football after 1995), so Walt Harris's 1989–1991 rows
   need 1989–1991 game data from the jhowell.net/Sports-Reference side of the pipeline, not
   cfbfastR.
8. **Neal Brown's North Texas row is sourced to the 2025 season article**, not his own, because his
   article says only "currently the head football coach at the University of North Texas" with no
   year. `start_season` is 2026 (hired December 2, 2025); the 2026 season is in progress, so
   `end_season` is null.
9. **Eric Morris and Neal Brown both have live power-conference rows elsewhere** (Oklahoma State and
   West Virginia respectively). Expect these North Texas rows to butt up against those; the
   Morris row ends 2025-12-05 for exactly that reason.
