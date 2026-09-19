# Championship-week neutral-site audit

93 suspects from `data/research/ccg-suspects.json` — December games in
championship week (week 14+, `season_type` regular) whose venue field was empty
or looked like a campus stadium. Each one was checked against the AWAY team's
Sports-Reference season-schedule page served by the Wayback Machine. The
site-marker cell between the School and Opponent columns is the verdict:
`@` = SR agrees it was a true road game, `N` = SR calls it neutral.

Campus-hosted championship games (the 2011 Pac-12 CG at Autzen, the CUSA /
AAC / MWC / Sun Belt title games at the higher seed) come back `@`, so they stay
road games. Only the seven below are neutral.

## Counts

| verdict | games |
| --- | --- |
| road (confirmed true road game, keep) | 86 |
| neutral (flag for exclusion) | 7 |
| unresolved | 0 |
| **total** | **93** |

## Neutral — ready to paste into `data/game-corrections.json`

```json
[
  {
   "date": "2001-12-01",
   "away_team": "Colorado",
   "home_team": "Texas",
   "action": "exclude",
   "reason": "Sports-Reference lists this as a neutral-site game ('N' site marker): Big 12 Championship (Dallas, TX)"
  },
  {
   "date": "2002-12-07",
   "away_team": "Oklahoma",
   "home_team": "Colorado",
   "action": "exclude",
   "reason": "Sports-Reference lists this as a neutral-site game ('N' site marker): Big 12 Championship (Houston, TX)"
  },
  {
   "date": "2003-12-06",
   "away_team": "Kansas State",
   "home_team": "Oklahoma",
   "action": "exclude",
   "reason": "Sports-Reference lists this as a neutral-site game ('N' site marker): Big 12 Championship (Kansas City, MO)"
  },
  {
   "date": "2004-12-04",
   "away_team": "Colorado",
   "home_team": "Oklahoma",
   "action": "exclude",
   "reason": "Sports-Reference lists this as a neutral-site game ('N' site marker): Big 12 Championship (Kansas City, MO)"
  },
  {
   "date": "2006-12-02",
   "away_team": "Nebraska",
   "home_team": "Oklahoma",
   "action": "exclude",
   "reason": "Sports-Reference lists this as a neutral-site game ('N' site marker): Big 12 Championship (Kansas City, MO)"
  },
  {
   "date": "2006-12-02",
   "away_team": "Wake Forest",
   "home_team": "Georgia Tech",
   "action": "exclude",
   "reason": "Sports-Reference lists this as a neutral-site game ('N' site marker): ACC Championship (Jacksonville, FL)"
  },
  {
   "date": "2007-12-01",
   "away_team": "Virginia Tech",
   "home_team": "Boston College",
   "action": "exclude",
   "reason": "Sports-Reference lists this as a neutral-site game ('N' site marker): ACC Championship (Jacksonville, FL)"
  }
]
```

### Neutral games, with the SR row behind each call

- **2001-12-01 — Colorado at Texas (2001)**
  - SR notes: Big 12 Championship (Dallas, TX)
  - row: `12 | Dec 1, 2001 | Sat | (9) Colorado | N | (3) Texas | Big 12 | W | 39 | 37 | 10 | 2 | W 5 | Big 12 Championship (Dallas, TX)`
  - source: https://web.archive.org/web/2002/https://www.sports-reference.com/cfb/schools/colorado/2001-schedule.html
- **2002-12-07 — Oklahoma at Colorado (2002)**
  - SR notes: Big 12 Championship (Houston, TX)
  - row: `13 | Dec 7, 2002 | Sat | (8) Oklahoma | N | (12) Colorado | Big 12 | W | 29 | 7 | 11 | 2 | W 1 | Big 12 Championship (Houston, TX)`
  - source: https://web.archive.org/web/2003/https://www.sports-reference.com/cfb/schools/oklahoma/2002-schedule.html
- **2003-12-06 — Kansas State at Oklahoma (2003)**
  - SR notes: Big 12 Championship (Kansas City, MO)
  - row: `14 | Dec 6, 2003 | Sat | (13) Kansas State | N | (1) Oklahoma | Big 12 | W | 35 | 7 | 11 | 3 | W 7 | Big 12 Championship (Kansas City, MO)`
  - source: https://web.archive.org/web/2004/https://www.sports-reference.com/cfb/schools/kansas-state/2003-schedule.html
- **2004-12-04 — Colorado at Oklahoma (2004)**
  - SR notes: Big 12 Championship (Kansas City, MO)
  - row: `12 | Dec 4, 2004 | Sat | Colorado | N | (2) Oklahoma | Big 12 | L | 3 | 42 | 7 | 5 | L 1 | Big 12 Championship (Kansas City, MO)`
  - source: https://web.archive.org/web/2005/https://www.sports-reference.com/cfb/schools/colorado/2004-schedule.html
- **2006-12-02 — Nebraska at Oklahoma (2006)**
  - SR notes: Big 12 Championship (Kansas City, MO)
  - row: `13 | Dec 2, 2006 | Sat | (19) Nebraska | N | (8) Oklahoma | Big 12 | L | 7 | 21 | 9 | 4 | L 1 | Big 12 Championship (Kansas City, MO)`
  - source: https://web.archive.org/web/2007/https://www.sports-reference.com/cfb/schools/nebraska/2006-schedule.html
- **2006-12-02 — Wake Forest at Georgia Tech (2006)**
  - SR notes: ACC Championship (Jacksonville, FL)
  - row: `13 | Dec 2, 2006 | Sat | (16) Wake Forest | N | (23) Georgia Tech | ACC | W | 9 | 6 | 11 | 2 | W 2 | ACC Championship (Jacksonville, FL)`
  - source: https://web.archive.org/web/2007/https://www.sports-reference.com/cfb/schools/wake-forest/2006-schedule.html
- **2007-12-01 — Virginia Tech at Boston College (2007)**
  - SR notes: ACC Championship (Jacksonville, FL)
  - row: `13 | Dec 1, 2007 | Sat | (6) Virginia Tech | N | (12) Boston College | ACC | W | 30 | 16 | 11 | 2 | W 5 | ACC Championship (Jacksonville, FL)`
  - source: https://web.archive.org/web/2008/https://www.sports-reference.com/cfb/schools/virginia-tech/2007-schedule.html

## Sourcing exceptions

10 of the 93 could not be read off the away team's own schedule page — the Wayback
Machine has no post-game capture of it (CDX returns zero snapshots, or only
preseason ones, and SR's season-summary snapshots carry no schedule table).
Each fell back to another Sports-Reference page that *is* captured. On the home
team's page, and on SR's conference / season schedule pages, an EMPTY site
marker means the named home team played at home — so the visitor was on the
road; `N` still means neutral.

| date | game | verdict | fell back to |
| --- | --- | --- | --- |
| 2019-12-07 | Hawaii at Boise State | road | /cfb/schools/boise-state/2019-schedule.html |
| 2019-12-07 | Louisiana at Appalachian State | road | /cfb/schools/appalachian-state/2019-schedule.html |
| 2020-12-05 | Rice at Marshall | road | /cfb/schools/marshall/2020-schedule.html |
| 2020-12-05 | Stanford at Washington | road | /cfb/schools/washington/2020-schedule.html |
| 2020-12-12 | Akron at Buffalo | road | /cfb/boxscores/2020-12-12-buffalo.html |
| 2021-12-04 | Houston at Cincinnati | road | /cfb/schools/cincinnati/2021-schedule.html |
| 2023-12-01 | New Mexico State at Liberty | road | /cfb/schools/liberty/2023-schedule.html |
| 2023-12-02 | SMU at Tulane | road | /cfb/conferences/american/2023-schedule.html |
| 2024-12-06 | UNLV at Boise State | road | /cfb/schools/boise-state/2024-schedule.html |
| 2025-12-05 | Troy at James Madison | road | /cfb/years/2025-schedule.html |

## Road — confirmed true road games, leave alone

| date | away | home | SR notes |
| --- | --- | --- | --- |
| 1990-12-01 | Florida | Florida State | — |
| 1990-12-01 | Texas A&M | Texas | — |
| 1995-12-02 | Texas | Texas A&M | — |
| 1999-12-04 | Temple | Miami (FL) | — |
| 2001-12-01 | Auburn | LSU | — |
| 2001-12-01 | Houston | Georgia | — |
| 2001-12-01 | Miami (FL) | Virginia Tech | — |
| 2001-12-01 | Oregon State | Oregon | — |
| 2001-12-01 | Tennessee | Florida | — |
| 2001-12-01 | Utah State | Fresno State | — |
| 2002-12-07 | Virginia Tech | Miami (FL) | — |
| 2003-12-04 | Miami (OH) | Bowling Green | MAC Championship (Bowling Green, OH) |
| 2003-12-06 | Oregon State | USC | — |
| 2004-12-04 | Virginia Tech | Miami (FL) | — |
| 2005-12-02 | Louisiana Tech | Fresno State | — |
| 2005-12-03 | UCLA | USC | — |
| 2006-12-02 | Oregon State | Hawaii | — |
| 2006-12-02 | Rutgers | West Virginia | — |
| 2006-12-02 | Stanford | California | — |
| 2006-12-02 | UConn | Louisville | — |
| 2007-12-01 | Arizona | Arizona State | — |
| 2007-12-01 | Oregon State | Oregon | — |
| 2007-12-01 | Pittsburgh | West Virginia | — |
| 2007-12-01 | UCLA | USC | — |
| 2007-12-01 | Washington | Hawaii | — |
| 2009-12-03 | Oregon State | Oregon | — |
| 2009-12-05 | Arizona | USC | — |
| 2009-12-05 | Cincinnati | Pittsburgh | — |
| 2009-12-05 | New Mexico State | Boise State | — |
| 2010-12-04 | Rutgers | West Virginia | — |
| 2010-12-04 | UNLV | Hawaii | — |
| 2010-12-04 | Utah State | Boise State | — |
| 2011-12-02 | UCLA | Oregon | Pac 12 Championship (Eugene, OR) |
| 2011-12-03 | Iowa State | Kansas State | — |
| 2011-12-03 | New Mexico | Boise State | — |
| 2011-12-03 | Oklahoma | Oklahoma State | — |
| 2011-12-03 | Southern Miss | Houston | CUSA Championship (Houston, TX) |
| 2011-12-03 | Texas | Baylor | — |
| 2011-12-03 | UNLV | TCU | — |
| 2012-12-01 | Texas | Kansas State | — |
| 2013-12-07 | Oklahoma | Oklahoma State | — |
| 2013-12-07 | Stanford | Arizona State | — |
| 2013-12-07 | Texas | Baylor | — |
| 2013-12-07 | Utah State | Fresno State | — |
| 2014-12-06 | Fresno State | Boise State | — |
| 2014-12-06 | Iowa State | TCU | — |
| 2014-12-06 | Kansas State | Baylor | — |
| 2014-12-06 | Oklahoma State | Oklahoma | — |
| 2015-12-05 | Temple | Houston | American Championship Game |
| 2015-12-05 | Texas | Baylor | — |
| 2016-12-03 | Baylor | West Virginia | — |
| 2016-12-03 | Oklahoma State | Oklahoma | — |
| 2016-12-03 | Temple | Navy | American Championship Game |
| 2017-12-02 | Memphis | UCF | American Championship Game |
| 2018-12-01 | Fresno State | Boise State | MWC Championship Game |
| 2018-12-01 | Memphis | UCF | American Championship Game |
| 2019-12-07 | Cincinnati | Memphis | American Championship Game |
| 2019-12-07 | Hawaii | Boise State | MWC Championship Game [read from the home team's page: Boise State 2019 — the away team's own schedule page has no Wayback capture] |
| 2019-12-07 | Louisiana | Appalachian State | Sun Belt Championship Game [read from the home team's page: Appalachian State 2019 — the away team's own schedule page has no Wayback capture] |
| 2020-12-05 | Baylor | Oklahoma | — |
| 2020-12-05 | BYU | Coastal Carolina | — |
| 2020-12-05 | Indiana | Wisconsin | — |
| 2020-12-05 | Rice | Marshall | (notes cell empty) [read from the home team's page: Marshall 2020 — the away team's own schedule page has no Wayback capture] |
| 2020-12-05 | Stanford | Washington | (notes cell empty) [read from the home team's page: Washington 2020 — the away team's own schedule page has no Wayback capture] |
| 2020-12-05 | Syracuse | Notre Dame | — |
| 2020-12-05 | West Virginia | Iowa State | — |
| 2020-12-06 | Washington State | USC | United Airlines Field at Los Angeles Memorial Coliseum - Los Angeles, California |
| 2020-12-12 | Akron | Buffalo | neither akron/2020-schedule.html nor buffalo/2020-schedule.html has any Wayback capture; SR's boxscore page titles this game 'Akron AT Buffalo', and SR writes 'vs' (not 'at') for its neutral-site games |
| 2020-12-12 | Illinois | Northwestern | — |
| 2020-12-12 | LSU | Florida | — |
| 2020-12-12 | North Carolina | Miami (FL) | — |
| 2020-12-12 | San Diego State | BYU | — |
| 2020-12-12 | Utah | Colorado | — |
| 2020-12-12 | Wisconsin | Iowa | — |
| 2020-12-18 | Oregon | USC | Pac-12 Championship Game |
| 2020-12-19 | Tulsa | Cincinnati | American Championship Game |
| 2021-12-04 | Appalachian State | Louisiana | Sun Belt Championship Game |
| 2021-12-04 | Houston | Cincinnati | American Championship Game [read from the home team's page: Cincinnati 2021 — the away team's own schedule page has no Wayback capture] |
| 2021-12-04 | Utah State | San Diego State | MWC Championship Game |
| 2022-12-03 | UCF | Tulane | American Championship Game |
| 2023-12-01 | New Mexico State | Liberty | CUSA Championship Game [read from the home team's page: Liberty 2023 — the away team's own schedule page has no Wayback capture] |
| 2023-12-02 | SMU | Tulane | neither southern-methodist/2023-schedule.html nor tulane/2023-schedule.html has any Wayback capture; the AAC 2023 conference schedule page puts '@' between winner SMU and loser Tulane, i.e. played at Tulane, and its notes cell is empty |
| 2024-12-06 | Tulane | Army | American Championship Game |
| 2024-12-06 | UNLV | Boise State | MWC Championship Game [read from the home team's page: Boise State 2024 — the away team's own schedule page has no Wayback capture] |
| 2025-12-05 | North Texas | Tulane | — |
| 2025-12-05 | Troy | James Madison | troy/2025-schedule.html has one capture (Aug 31, 2025, preseason) and james-madison/2025-schedule.html one (Sep 6, 2025); SR's 2025 season schedule page carries the played game, with the site marker between winner James Madison and loser Troy EMPTY, i.e. JMU was at home, and an empty notes cell |
