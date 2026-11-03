// A coach's page: his record against ranked teams at each venue, the road row
// the board's own, then every road game with its receipt. Rendered to static
// HTML by scripts/prerender.mjs, with the site's styles and no app script.

import { Notes } from './Notes.jsx'
import { D, rec, fmtPct, pctOf, coachTitle, coachLead, coachPlace } from './coach.js'

const isHowell = (g) => g[D.URL]?.startsWith('h:')
const receiptHref = (g) => (isHowell(g) ? `https://www.jhowell.net/cf/scores/${g[D.URL].slice(2)}` : g[D.URL])
const receiptTitle = (g) => (isHowell(g) ? `Howell's page, the source row (not an independent check): ${g[D.QUOTE]}` : g[D.QUOTE])
const pollHref = (g) => `https://www.collegepollarchive.com/football/ap/seasons.cfm?appollid=${g[D.POLL][0]}`

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${+d}, ${y}`
}

function Cell({ r }) {
  if (r[0] + r[1] + r[2] === 0) return <td className="none">–</td>
  return (
    <td>
      {rec(r)}
      <span className="pct">{fmtPct(pctOf(r))}</span>
    </td>
  )
}

/** @param {{ r: ReturnType<import('./coach.js').coachRecord>, board: string }} props */
export function CoachPage({ r, board }) {
  const place = coachPlace(r)
  const rows = r.hasVenues
    ? [['Home', 'home'], ['Road', 'road'], ['Neutral', 'neutral'], ['All', 'all']]
    : [['Road', 'road']]
  return (
    <main className="coach-page">
      <div className="field-rule" aria-hidden="true"></div>
      <p className="crumb"><a href={board}>Hostile Territory</a> · every coach&rsquo;s road record against the AP top 10</p>
      <h1 className="coach-h1">{coachTitle(r)}</h1>
      <p className="sub">{coachLead(r)}{place ? ` ${place}` : ''}</p>

      <h2>Against ranked teams, at each venue</h2>
      <div className="h2-note">
        Ranked in the AP poll in effect at kickoff. The road row is this site&rsquo;s own count, every game with a receipt below
        {r.hasVenues ? '; home and neutral games are College Football Streak King’s ledger' : ''}.
      </div>
      <div className="venues-wrap">
        <table className="venues">
          <thead>
            <tr><th scope="col"><span className="sr-only">Venue</span></th><th scope="col">vs top 5</th><th scope="col">vs top 10</th><th scope="col">vs top 25</th></tr>
          </thead>
          <tbody>
            {rows.map(([label, k]) => (
              <tr key={k} className={k === 'road' ? 'lit' : k === 'all' ? 'total' : null}>
                <th scope="row">{label}</th>
                {r.table.map((x) => <Cell key={x.cut} r={x[k]} />)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2>Every road game against a ranked team</h2>
      <div className="h2-note">Each date links its receipt. The AP ranked 20 teams before 1989, and 10 in 1961–67.</div>
      <div className="detail coach-log">
        {r.games.map((g, i) => (
          <div key={i} className="log-row">
            <span className="d">
              {g[D.URL]
                ? <a href={receiptHref(g)} className={isHowell(g) ? 'src' : null} target="_blank" rel="noopener" title={receiptTitle(g)}>{fmtDate(g[D.DATE])}</a>
                : fmtDate(g[D.DATE])}
            </span>
            <span className="m">
              <b>{g[D.SCHOOL]}</b> at {g[D.POLL]
                ? <a href={pollHref(g)} className="poll" target="_blank" rel="noopener" title={`AP poll in effect at kickoff: ${g[D.POLL][1]}`}>#{g[D.RANK]}</a>
                : `#${g[D.RANK]}`} <b>{g[D.OPP]}</b>
              {g[D.INT] ? <span className="int"> · interim</span> : null}
              {g[D.CREDIT] ? <span className="credit"> · {g[D.CREDIT]}</span> : null}
            </span>
            <span className={`sc ${g[D.RES] === 'W' ? 'w' : ''}`}>{g[D.RES]} {g[D.AP]}–{g[D.HP]}{g[D.OT] ? ` (${g[D.OT] > 1 ? g[D.OT] : ''}OT)` : ''}</span>
          </div>
        ))}
      </div>
      <p className="to-board"><a href={`${board}?coach=${encodeURIComponent(r.name)}`}>{r.name} on the board, against every other coach</a></p>

      <Notes />
    </main>
  )
}

/** /coach/: every coach, a line each, by surname */
export function CoachIndex({ coaches, board }) {
  return (
    <main className="coach-page">
      <div className="field-rule" aria-hidden="true"></div>
      <p className="crumb"><a href={board}>Hostile Territory</a></p>
      <h1 className="coach-h1">Every college football coach&rsquo;s record vs top-10 teams</h1>
      <p className="sub">
        Every head coach on the board since 1936, with his road record against AP top-10 teams and his record against them at every venue.
      </p>
      <ul className="coach-index">
        {coaches.map((c) => (
          <li key={c.path}>
            <a href={c.path}>{c.name}</a> <span className="mono">{rec(c.road)} on the road{c.all ? `, ${rec(c.all)} in all` : ''}</span>
          </li>
        ))}
      </ul>
      <Notes />
    </main>
  )
}
