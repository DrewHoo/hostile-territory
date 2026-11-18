// llms.txt (llmstxt.org): the site in plain markdown for a language model
// that reads it, the way a person reads the board: what it is, where the
// games and polls come from, and the other sports sites. Said the way the
// page says it, nothing more. NBA Comparator's, in shape.
//
//   fs.writeFileSync(path.join(ROOT, 'dist', 'llms.txt'), llmsText({ ... }))

// The other sports sites, in the order and words every sports site shares. The
// page's What to read next is Putting Up Numbers' claims now (src/readNext.js);
// this list is for llms.txt alone.
/** Putting Up Numbers (puttingupnumbers.com), where the comparators live now: one link a sport */
const PUN_SPORTS = [['College Football', 'cfb'], ['NFL', 'nfl'], ['NBA', 'nba'], ['WNBA', 'wnba'], ['NHL', 'nhl'], ['Soccer', 'soccer']].map(([name, id]) => ({ name, url: `https://puttingupnumbers.com/${id}/` }))
const SIBLINGS = [
  { name: 'Putting Up Numbers', url: 'https://puttingupnumbers.com/', words: 'compare players, coaches, and teams on wins.', links: PUN_SPORTS },
  { name: 'College Football Streak King', url: 'https://drewhoover.com/cfb-streak-king/', words: 'the longest active and all-time winning and losing streaks in college football, under any definition, every FBS game since 1936.' },
  { name: 'How Many Rings?', url: 'https://drewhoover.com/how-many-rings/', words: 'every person on a national-championship staff since 1990, ranked by the number of rings they can claim.' },
  { name: 'Collegiate Championships', url: 'https://drewhoover.com/collegiate-championships/', words: 'which schools have won the most NCAA championships, across 33 sports.' },
  { name: 'CFB All-Time Records', url: 'https://drewhoover.com/cfb-all-time-records/', words: 'all-time win-loss, bowl and national-title records for every FBS program.' },
]

const REPO = 'https://github.com/DrewHoo/hostile-territory'

/**
 * The llms.txt markdown.
 * @param {{
 *   site: string,         // the site's URL, with the trailing slash
 *   title: string,        // site.config.js title
 *   description: string,  // site.config.js description
 *   generated: string,    // the data build date, site-data.json `generated`
 *   coaches: number,      // how many coaches the board carries, both payloads
 * }} o
 */
export function llmsText({ site, title, description, generated, coaches }) {
  return `# ${title}

> ${description}

Every row is a head coach's true road games against AP top-10 teams, in order, with the score, since the first AP poll in 1936; the board at ${site} ranks ${coaches.toLocaleString('en-US')} coaches by that record, top 10 or top 25, current coaches or everyone; a reader can also pick home games, neutral-site games or all of them (those from College Football Streak King's ledger, without receipts). No total on the page was reported by anyone: the records are computed by joining game results (cfbfastR 2001 to the present, jhowell.net 1936 to 2000), the weekly AP polls (College Poll Archive) and the head coach on each game's date (researched row by row with a citation each since 1990; CollegeFootballData's coach records checked against every season's results before that). Each game's date links its receipt. Data as of ${generated}; it updates weekly in season. Credit as "per Hostile Territory" with the page's link.

## Data

- [Method](${site}#method): what counts as a road game, whose record it goes on, and where each receipt points.
- [The repository](${REPO}): the pipeline, the rulings, the corrections and the saved receipt pages.

## Other sports sites

${SIBLINGS.map((s) => `- [${s.name}](${s.url}): ${s.words}${s.links ? ' ' + s.links.map((l) => `[${l.name}](${l.url})`).join(' | ') : ''}`).join('\n')}
`
}
