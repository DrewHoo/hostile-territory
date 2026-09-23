import { useEffect, useMemo, useState } from 'react'
import DATA from './data/site-data.json'
import LOGO_IDS from './data/team-ids.json'
import { readParam, writeParam } from './urlState.js'

// site-data game row: [date, school, opponent, opp_rank, result, away_pts,
// home_pts, interim, home_coach|null, overtimes (0 = regulation/unknown)]
const [D_DATE, D_SCHOOL, D_OPP, D_RANK, D_RES, D_AP, D_HP, D_INT, D_HC, D_OT, D_URL, D_QUOTE, D_CREDIT] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

const logoSrc = (team) => (LOGO_IDS[team] ? `${import.meta.env.BASE_URL}logos/${LOGO_IDS[team]}.png` : null)

const fmtDate = (iso) => {
  const [y, m, d] = iso.split('-')
  return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${+d}, ${y}`
}

function tally(games) {
  let w = 0, l = 0, t = 0
  for (const g of games) g[D_RES] === 'W' ? w++ : g[D_RES] === 'L' ? l++ : t++
  return { w, l, t, gp: games.length, pct: games.length ? (w + t / 2) / games.length : 0 }
}

const fmtPct = (p) => (p >= 1 ? '1.000' : p.toFixed(3).replace(/^0/, ''))

// One popover at a time, anchored to the hovered/tapped stamp. Fixed
// positioning, clamped to the viewport, flipped below when near the top.
function GamePopover({ pop, onClose }) {
  useEffect(() => {
    const close = (e) => { if (!e.target.closest?.('.popover') && !e.target.closest?.('.chip')) onClose() }
    const esc = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', esc)
    window.addEventListener('scroll', onClose, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', esc)
      window.removeEventListener('scroll', onClose)
    }
  }, [onClose])
  if (!pop) return null
  const { g, coach, rect } = pop
  const W = 264
  const left = Math.min(Math.max(8, rect.left + rect.width / 2 - W / 2), window.innerWidth - W - 8)
  const above = rect.top > 150
  const style = above
    ? { left, bottom: window.innerHeight - rect.top + 8 }
    : { left, top: rect.bottom + 8 }
  const ot = g[D_OT] ? ` (${g[D_OT] > 1 ? g[D_OT] : ''}OT)` : ''
  return (
    <div className="popover" style={style} role="tooltip">
      <div className="pop-date mono">{fmtDate(g[D_DATE])}</div>
      <div className="pop-match">{g[D_SCHOOL]} at #{g[D_RANK]} {g[D_OPP]}</div>
      <div className={`pop-score mono ${g[D_RES] === 'W' ? 'win' : ''}`}>{g[D_RES]} {g[D_AP]}–{g[D_HP]}{ot}</div>
      <div className="pop-coaches">
        <span><i>{g[D_SCHOOL]}:</i> {coach}{g[D_INT] ? ' (interim)' : ''}</span>
        {g[D_HC] ? <span><i>{g[D_OPP]}:</i> {g[D_HC]}</span> : null}
      </div>
      {g[D_CREDIT] ? <div className="pop-credit mono">{g[D_CREDIT]}</div> : null}
    </div>
  )
}

export default function App() {
  const [cut, setCut] = useState(10) // opponent ranked within this
  const [minGames, setMinGames] = useState(4)
  const [activeOnly, setActiveOnly] = useState(true)
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(null)
  const [pop, setPop] = useState(null)

  const showPop = (e, g, coach) => setPop({ g, coach, rect: e.currentTarget.getBoundingClientRect() })
  const chipHandlers = (g, coach) => ({
    onPointerEnter: (e) => { if (e.pointerType === 'mouse') showPop(e, g, coach) },
    onPointerLeave: (e) => { if (e.pointerType === 'mouse') setPop(null) },
    onClick: (e) => e.stopPropagation(),
    onPointerUp: (e) => {
      if (e.pointerType === 'mouse') return
      const rect = e.currentTarget.getBoundingClientRect()
      setPop((p) => (p && p.g === g ? null : { g, coach, rect }))
    },
  })

  useEffect(() => {
    const c = readParam('cut')
    if (c === '25') setCut(25)
    const m = readParam('min')
    if (m && ['1', '4', '10'].includes(m)) setMinGames(+m)
    if (readParam('all') === '1') setActiveOnly(false)
    const q = readParam('q')
    if (q) setQuery(q)
    const coach = readParam('coach')
    if (coach && DATA.coaches.some((x) => x.n === coach)) { setOpen(coach); setActiveOnly(false) }
  }, [])

  const setAndWrite = (setter, key, value, defaultValue) => {
    setter(value)
    writeParam(key, String(value) === String(defaultValue) ? null : String(value))
  }

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return DATA.coaches
      .map((c) => {
        const games = c.g.filter((g) => g[D_RANK] <= cut)
        return { ...c, games, ...tally(games) }
      })
      .filter((c) => c.gp >= Math.max(minGames, 1))
      .filter((c) => !activeOnly || c.a)
      .filter((c) => !q || c.n.toLowerCase().includes(q) || c.s.some((s) => s.toLowerCase().includes(q)))
      .sort((a, b) => b.pct - a.pct || b.w - a.w || a.l - b.l || a.n.localeCompare(b.n))
  }, [cut, minGames, activeOnly, query])

  // Highlight every OTHER coach's road game at the same host while a game is
  // hovered or selected. The active coach's own row stays unlit.
  const hlOpp = pop ? pop.g[D_OPP] : null
  const toggleOpen = (name) => {
    const next = open === name ? null : name
    setOpen(next)
    writeParam('coach', next)
    window.dhAnalytics?.track('coach_open', { coach: name })
  }

  return (
    <main>
      <div className="field-rule" aria-hidden="true"></div>
      <h1>Hostile Territory</h1>
      <div className="dateline">Road games vs the AP Top 10 · 1990 – present</div>
      {/* Pinned to the ESPN factoid that started the site; the board carries the live record. */}
      <p className="sub">
        Lane Kiffin is <s>1–8</s> 1–9 on the road against top 10 teams. Here's how his record
        matches up against everyone else.
      </p>

      <h2>Every coach since 1990</h2>
      <div className="h2-note">
        Every true road game against a top-{cut} team, per head coach. Tap a game for details,
        or the coach for their full record.
      </div>

      <div className="filters">
        <div className="toggle" role="group" aria-label="Opponent rank cut">
          <button className={cut === 10 ? 'on' : ''} onClick={() => setAndWrite(setCut, 'cut', 10, 10)}>Top 10</button>
          <button className={cut === 25 ? 'on' : ''} onClick={() => setAndWrite(setCut, 'cut', 25, 10)}>Top 25</button>
        </div>
        <div className="toggle" role="group" aria-label="Minimum games">
          {[1, 4, 10].map((m) => (
            <button key={m} className={minGames === m ? 'on' : ''} onClick={() => setAndWrite(setMinGames, 'min', m, 4)}>{m === 1 ? 'all' : `${m}+ games`}</button>
          ))}
        </div>
        <label>
          <input type="checkbox" checked={activeOnly} onChange={(e) => { setActiveOnly(e.target.checked); writeParam('all', e.target.checked ? null : '1') }} />
          current coaches only
        </label>
        <input type="search" placeholder="coach or school" value={query} onChange={(e) => { setQuery(e.target.value); writeParam('q', e.target.value || null) }} aria-label="Filter by coach or school" />
      </div>

      <div className="board">
        {[rows.slice(0, Math.ceil(rows.length / 2)), rows.slice(Math.ceil(rows.length / 2))].map((col, ci) => (
          <div className="bcol" key={ci}>
        {col.map((c) => (
          <div key={c.n}>
            <button className="row-btn" onClick={() => toggleOpen(c.n)} aria-expanded={open === c.n}>
              <span className="coach-cell">
                <span className="coach">{c.n}</span>
                {c.s.map((sch) =>
                  logoSrc(sch)
                    ? <img key={sch} src={logoSrc(sch)} alt={sch} title={sch} loading="lazy" width="15" height="15" />
                    : <span key={sch} className="school">{sch}</span>
                )}
              </span>
              <span className="dots" aria-label={`${c.w} wins, ${c.l} losses`}>
                {c.games.map((g, i) => (
                  <span
                    key={i}
                    className={`chip ${g[D_RES].toLowerCase()}${hlOpp && c.n !== pop.coach && g[D_OPP] === hlOpp ? ' hl' : ''}`}
                    {...chipHandlers(g, c.n)}
                  >
                    {logoSrc(g[D_OPP])
                      ? <img src={logoSrc(g[D_OPP])} alt="" loading="lazy" width="18" height="18" />
                      : g[D_RES]}
                  </span>
                ))}
              </span>
              <span className="rec">
                {c.w}–{c.l}{c.t ? `–${c.t}` : ''}
                <span className="pct">{fmtPct(c.pct)}</span>
              </span>
            </button>
            {open === c.n && (
              <div className="detail">
                {c.games.map((g, i) => (
                  <div key={i} className="log-row">
                    <span className="d">
                      {g[D_URL]
                        ? <a href={g[D_URL]} target="_blank" rel="noopener" title={g[D_QUOTE]}>{fmtDate(g[D_DATE])}</a>
                        : fmtDate(g[D_DATE])}
                    </span>
                    <span className="m">
                      <b>{g[D_SCHOOL]}</b> at #{g[D_RANK]} <b>{g[D_OPP]}</b>
                      {g[D_INT] ? <span className="int"> · interim</span> : null}
                      {g[D_CREDIT] ? <span className="credit"> · {g[D_CREDIT]}</span> : null}
                    </span>
                    <span className={`sc ${g[D_RES] === 'W' ? 'w' : ''}`}>{g[D_RES]} {g[D_AP]}–{g[D_HP]}{g[D_OT] ? ` (${g[D_OT] > 1 ? g[D_OT] : ''}OT)` : ''}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
          </div>
        ))}
        {!rows.length && <p className="h2-note">No coaches match — loosen the filters.</p>}
      </div>
      <div className="legend">
        <span><span className="chip w">W</span> Win</span>
        <span><span className="chip l">L</span> Loss</span>
        <span className="legend-note">each mark is the host team</span>
      </div>

      {/* Each trailing section is one centered 700px column so the heading
          and its body share a left edge at every width — the board above
          stays full-width. */}
      <section className="notes">
        <h2>What counts as a road game</h2>
        <div className="rules-note">
          <ul>
            <li>The team is the away team and the site is not neutral. Bowls, kickoff classics, and conference championship games are out. CFP first-round campus games count.</li>
            <li>The opponent is ranked in the most recent AP poll published before kickoff — not the Coaches poll, not the CFP rankings, not the final poll.</li>
            <li>The coach of record is whoever was head coach on the game date. Interim games count for the interim.</li>
            <li>Coaches qualify by having led a power-conference program since 1990; all of their FBS head-coaching games count, including stops elsewhere.</li>
          </ul>
        </div>
      </section>

      <section className="notes">
        <h2>Where every number comes from</h2>
        <div className="method">
          <p>
            No total on this page was reported by anyone — records are computed by joining three
            sources: game results (cfbfastR 2001–2025, jhowell.net 1990–2000), weekly AP polls
            (College Poll Archive), and coaching tenures researched row by row with a citation each.
          </p>
        </div>
      </section>

      <section className="notes">
        <h2>What to read next</h2>
        <div className="method">
          <p>
            <a href="https://drewhoover.com/how-many-rings/">How Many Rings?</a> — every person on a
            national-championship staff since 1990, ranked by rings, each one cited.
          </p>
          <p>
            <a href="https://drewhoover.com/collegiate-championships/">Who has the most college championships?</a> — every
            NCAA champion since 1972, 33 sports, one grid.
          </p>
          <p>
            <a href="https://drewhoover.com/cfb-all-time-records/football">All-time FBS records</a> — all
            136 programs ranked by total wins, win percentage and bowl record.
          </p>
        </div>
      </section>

      <footer>Data: Sports-Reference, College Poll Archive, cfbfastR. Rules and receipts above.</footer>
      <GamePopover pop={pop} onClose={() => setPop(null)} />
    </main>
  )
}
