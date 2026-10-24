// The other sports sites, for What to read next and llms.txt. The same list,
// in the same order and words, sits on every one of them.
/** Putting Up Numbers (puttingupnumbers.com), where the comparators live now: one link a sport */
const PUN_SPORTS = [['College Football', 'cfb'], ['NFL', 'nfl'], ['NBA', 'nba'], ['WNBA', 'wnba'], ['NHL', 'nhl'], ['Soccer', 'soccer']].map(([name, id]) => ({ name, url: `https://puttingupnumbers.com/${id}/` }))
export const SIBLINGS = [
  { name: 'Putting Up Numbers', url: 'https://puttingupnumbers.com/', words: 'compare players, coaches, and teams on wins.', links: PUN_SPORTS },
  { name: 'College Football Streak King', url: 'https://drewhoover.com/cfb-streak-king/', words: 'the longest active and all-time winning and losing streaks in college football, under any definition, every FBS game since 1936.' },
  { name: 'How Many Rings?', url: 'https://drewhoover.com/how-many-rings/', words: 'every person on a national-championship staff since 1990, ranked by the number of rings they can claim.' },
  { name: 'Collegiate Championships', url: 'https://drewhoover.com/collegiate-championships/', words: 'which schools have won the most NCAA championships, across 33 sports.' },
  { name: 'CFB All-Time Records', url: 'https://drewhoover.com/cfb-all-time-records/', words: 'all-time win-loss, bowl and national-title records for every FBS program.' },
]
