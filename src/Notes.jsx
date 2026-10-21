// What to read next, the Ko-fi line, and the Method notes: the page's static copy.

export const KOFI_URL = 'https://ko-fi.com/drewhooverdotcom'

const track = (name, props) => window.dhAnalytics?.track(name, props)

export function Notes() {
  return (
    <>
      {/* Each trailing section is one centered 700px column so the heading
          and its body share a left edge at every width — the board above
          stays full-width. */}
      <section className="notes">
        <h2>What to read next</h2>
        <div className="method">
          <p>
            <a href="https://drewhoover.com/cfb-streak-king/">Streak King</a> — the longest winning and losing
            streaks in college football under any definition you can think of, every FBS team since 1936.
          </p>
          <p>
            <a href="https://drewhoover.com/nfl-comparator/">NFL Comparator</a> — compare NFL players at the same
            point in their careers, since 1999.
          </p>
          <p>
            <a href="https://drewhoover.com/wnba-comparator/">WNBA Comparator</a> — compare WNBA players at the
            same point in their careers, since 1997.
          </p>
          <p>
            <a href="https://drewhoover.com/how-many-rings/">How Many Rings?</a> — every person on a
            national-championship staff since 1990, ranked by the rings they can claim; the leader isn't Nick Saban.
          </p>
          <p>
            <a href="https://drewhoover.com/collegiate-championships/">Who has the most college championships?</a> — every
            NCAA champion across 33 sports since 1972.
          </p>
          <p>
            <a href="https://drewhoover.com/cfb-all-time-records/football">All-time FBS records</a> — all
            136 programs ranked by total wins, win percentage and bowl record.
          </p>
        </div>
      </section>

      <section className="notes">
        <h2>Method</h2>
        <div className="method">
          <p>
            No total on this page was reported by anyone — records are computed by joining three
            sources: game results (cfbfastR 2001–present, <a href="https://www.jhowell.net/cf/scores/byname.htm">jhowell.net</a> 1936–2000),
            weekly AP polls (<a href="https://www.collegepollarchive.com/">College Poll Archive</a>), and head
            coaches: researched row by row with a citation each since 1990, and before that
            CollegeFootballData's coach records checked against every team's results season by season
            (the work behind <a href="https://drewhoover.com/cfb-streak-king/">Streak King</a>).
          </p>
          <p>
            Each game's date links its receipt. Since 1990, for all but a handful, that's the home team's
            Sports-Reference schedule page as captured by the Internet Archive's{' '}
            <a href="https://web.archive.org/">Wayback Machine</a>, with the matching row quoted on hover. The
            captures keep the receipts checkable after the live page changes. Before 1990 the date links the game's
            row on Howell's page, which is where the game came from rather than a second source (so the link is
            dashed), and the rank links the AP poll that was in effect at kickoff.
          </p>
          <p>
            The site is free and serves no ads. If you enjoyed using it, consider{' '}
            <a href={KOFI_URL} onClick={() => track('kofi', { from: 'notes' })}>buying me some server compute</a> or
            donating to The Internet Archive's <a href="https://archive.org/donate">Wayback Machine</a> (I am a monthly donor, FTR).
          </p>
          <p>What counts as a road game, and whose record it goes on:</p>
          <ul>
            <li>The team is the away team and the site is not neutral. Bowls, kickoff classics, and conference championship games are out. CFP first-round campus games count.</li>
            <li>The opponent is ranked in the most recent AP poll published before kickoff — not the Coaches poll, not the CFP rankings, not the final poll.</li>
            <li>There was no preseason poll before 1950, so a game played before that season's first poll (mid-October) has no rank and can't count. The AP ranked 20 teams before 1989, and 10 in 1961–67.</li>
            <li>Before 2001 a game at a team's regular second home (Alabama at Legion Field, Arkansas at Little Rock) is treated as neutral, so it isn't counted yet.</li>
            <li>The coach of record is whoever was head coach on the game date. Interim games count for the interim.</li>
            <li>Coaches qualify by having led a power-conference program: since 1990, the conferences you'd expect; before that the SEC, Big Ten, Southwest, Big 8 (and the Big Six and Seven), the Pacific Coast through the Pac-10, the ACC, the Southern Conference through 1952, and independents that later joined one of them. All of their major-college head-coaching games count, including stops elsewhere.</li>
          </ul>
        </div>
      </section>

      <footer>
        <div>Data: Sports-Reference, College Poll Archive, jhowell.net, cfbfastR, CollegeFootballData. Rules and receipts above.</div>
        <div>
          <a href="https://drewhoover.com/">drewhoover.com</a> ·{' '}
          <a href="https://github.com/DrewHoo/hostile-territory">source & receipts</a> ·{' '}
          <a href={KOFI_URL} onClick={() => track('kofi', { from: 'footer' })}>buy me a coffee</a>
        </div>
      </footer>
    </>
  )
}
