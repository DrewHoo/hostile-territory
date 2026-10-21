// Lane Kiffin's live road record vs the AP top 10, from the same payload the
// board renders. ESPN's graphic (9 games, 1-8, through 2025) is the factoid
// that started the site; the intro line and the meta description keep it and
// put the live number beside it, so neither can drift from the board.

export const ESPN = { w: 1, l: 8, games: 9 }

export function kiffinRecord(data) {
  const c = data.coaches.find((c) => c.n === 'Lane Kiffin')
  const games = c ? c.g.filter((g) => g[3] <= 10) : []
  let w = 0, l = 0, t = 0
  for (const g of games) g[4] === 'W' ? w++ : g[4] === 'L' ? l++ : t++
  return { w, l, t, games: games.length, since: Math.max(0, games.length - ESPN.games) }
}

const rec = ({ w, l, t }, dash = '-') => `${w}${dash}${l}${t ? `${dash}${t}` : ''}`

// The search snippet: the searched phrase stays, the live number leads.
export function kiffinDescription(data) {
  const k = kiffinRecord(data)
  const espn = rec(ESPN)
  const live = rec(k)
  const lead =
    live === espn
      ? `Lane Kiffin is ${espn} on the road against top-10 teams.`
      : `Lane Kiffin is ${live} on the road against top-10 teams (ESPN's ${espn} factoid, plus the ${k.since === 1 ? 'game' : `${k.since} games`} since).`
  return `${lead} Every head coach's true road record vs AP top-10 opponents since 1936, with a receipt for every game.`
}
