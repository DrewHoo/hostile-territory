# Championship-week neutral-site audit

93 suspects from `data/research/ccg-suspects.json` — December games in
championship week (week 14+, `season_type` regular) whose venue field was empty
or looked like a campus stadium. Each one was checked against the AWAY team's
Sports-Reference season-schedule page served by the Wayback Machine. The
site-marker cell between the School and Opponent columns is the verdict:
`@` = SR agrees it was a true road game, `N` = SR calls it neutral.

## Counts

| verdict | games |
| --- | --- |
| road (confirmed true road game, keep) | 62 |
| neutral (flag for exclusion) | 6 |
| unresolved | 25 |
| **total** | **93** |

## Neutral — ready to paste into `data/game-corrections.json`

```json
[
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

## Unresolved

- **2001-12-01 — Auburn at LSU (2001)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2002/https://www.sports-reference.com/cfb/schools/auburn/2001-schedule.html
- **2001-12-01 — Colorado at Texas (2001)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2002/https://www.sports-reference.com/cfb/schools/colorado/2001-schedule.html
- **2001-12-01 — Houston at Georgia (2001)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2002/https://www.sports-reference.com/cfb/schools/houston/2001-schedule.html
- **2001-12-01 — Miami (FL) at Virginia Tech (2001)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2002/https://www.sports-reference.com/cfb/schools/miami-fl/2001-schedule.html
- **2001-12-01 — Oregon State at Oregon (2001)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2002/https://www.sports-reference.com/cfb/schools/oregon-state/2001-schedule.html
- **2001-12-01 — Tennessee at Florida (2001)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2002/https://www.sports-reference.com/cfb/schools/tennessee/2001-schedule.html
- **2007-12-01 — Arizona at Arizona State (2007)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2008/https://www.sports-reference.com/cfb/schools/arizona/2007-schedule.html
- **2009-12-05 — New Mexico State at Boise State (2009)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2010/https://www.sports-reference.com/cfb/schools/new-mexico-state/2009-schedule.html
- **2010-12-04 — UNLV at Hawaii (2010)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2011/https://www.sports-reference.com/cfb/schools/nevada-las-vegas/2010-schedule.html
- **2011-12-02 — UCLA at Oregon (2011)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2012/https://www.sports-reference.com/cfb/schools/ucla/2011-schedule.html
- **2011-12-03 — Iowa State at Kansas State (2011)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2012/https://www.sports-reference.com/cfb/schools/iowa-state/2011-schedule.html
- **2013-12-07 — Oklahoma at Oklahoma State (2013)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2014/https://www.sports-reference.com/cfb/schools/oklahoma/2013-schedule.html
- **2013-12-07 — Stanford at Arizona State (2013)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2014/https://www.sports-reference.com/cfb/schools/stanford/2013-schedule.html
- **2016-12-03 — Temple at Navy (2016)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2017/https://www.sports-reference.com/cfb/schools/temple/2016-schedule.html
- **2019-12-07 — Hawaii at Boise State (2019)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2020/https://www.sports-reference.com/cfb/schools/hawaii/2019-schedule.html
- **2019-12-07 — Louisiana at Appalachian State (2019)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2020/https://www.sports-reference.com/cfb/schools/louisiana-lafayette/2019-schedule.html
- **2020-12-05 — Rice at Marshall (2020)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2021/https://www.sports-reference.com/cfb/schools/rice/2020-schedule.html
- **2020-12-05 — Stanford at Washington (2020)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2021/https://www.sports-reference.com/cfb/schools/stanford/2020-schedule.html
- **2020-12-05 — West Virginia at Iowa State (2020)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2021/https://www.sports-reference.com/cfb/schools/west-virginia/2020-schedule.html
- **2020-12-12 — Akron at Buffalo (2020)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2021/https://www.sports-reference.com/cfb/schools/akron/2020-schedule.html
- **2021-12-04 — Houston at Cincinnati (2021)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2022/https://www.sports-reference.com/cfb/schools/houston/2021-schedule.html
- **2023-12-01 — New Mexico State at Liberty (2023)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2024/https://www.sports-reference.com/cfb/schools/new-mexico-state/2023-schedule.html
- **2023-12-02 — SMU at Tulane (2023)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2024/https://www.sports-reference.com/cfb/schools/southern-methodist/2023-schedule.html
- **2024-12-06 — UNLV at Boise State (2024)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2025/https://www.sports-reference.com/cfb/schools/nevada-las-vegas/2024-schedule.html
- **2025-12-05 — Troy at James Madison (2025)**: no usable Wayback snapshot (code=None, title=None)
  - source: https://web.archive.org/web/2026/https://www.sports-reference.com/cfb/schools/troy/2025-schedule.html

## Road — confirmed true road games, leave alone

| date | away | home | SR notes |
| --- | --- | --- | --- |
| 1990-12-01 | Florida | Florida State | — |
| 1990-12-01 | Texas A&M | Texas | — |
| 1995-12-02 | Texas | Texas A&M | — |
| 1999-12-04 | Temple | Miami (FL) | — |
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
| 2007-12-01 | Oregon State | Oregon | — |
| 2007-12-01 | Pittsburgh | West Virginia | — |
| 2007-12-01 | UCLA | USC | — |
| 2007-12-01 | Washington | Hawaii | — |
| 2009-12-03 | Oregon State | Oregon | — |
| 2009-12-05 | Arizona | USC | — |
| 2009-12-05 | Cincinnati | Pittsburgh | — |
| 2010-12-04 | Rutgers | West Virginia | — |
| 2010-12-04 | Utah State | Boise State | — |
| 2011-12-03 | New Mexico | Boise State | — |
| 2011-12-03 | Oklahoma | Oklahoma State | — |
| 2011-12-03 | Southern Miss | Houston | CUSA Championship (Houston, TX) |
| 2011-12-03 | Texas | Baylor | — |
| 2011-12-03 | UNLV | TCU | — |
| 2012-12-01 | Texas | Kansas State | — |
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
| 2017-12-02 | Memphis | UCF | American Championship Game |
| 2018-12-01 | Fresno State | Boise State | MWC Championship Game |
| 2018-12-01 | Memphis | UCF | American Championship Game |
| 2019-12-07 | Cincinnati | Memphis | American Championship Game |
| 2020-12-05 | Baylor | Oklahoma | — |
| 2020-12-05 | BYU | Coastal Carolina | — |
| 2020-12-05 | Indiana | Wisconsin | — |
| 2020-12-05 | Syracuse | Notre Dame | — |
| 2020-12-06 | Washington State | USC | United Airlines Field at Los Angeles Memorial Coliseum - Los Angeles, California |
| 2020-12-12 | Illinois | Northwestern | — |
| 2020-12-12 | LSU | Florida | — |
| 2020-12-12 | North Carolina | Miami (FL) | — |
| 2020-12-12 | San Diego State | BYU | — |
| 2020-12-12 | Utah | Colorado | — |
| 2020-12-12 | Wisconsin | Iowa | — |
| 2020-12-18 | Oregon | USC | Pac-12 Championship Game |
| 2020-12-19 | Tulsa | Cincinnati | American Championship Game |
| 2021-12-04 | Appalachian State | Louisiana | Sun Belt Championship Game |
| 2021-12-04 | Utah State | San Diego State | MWC Championship Game |
| 2022-12-03 | UCF | Tulane | American Championship Game |
| 2024-12-06 | Tulane | Army | American Championship Game |
| 2025-12-05 | North Texas | Tulane | — |
