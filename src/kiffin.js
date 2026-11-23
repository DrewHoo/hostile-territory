// Lane Kiffin's live road record vs the AP top 10, from the same payload the
// board renders. ESPN's graphic (9 games, 1-8, through 2025) is the factoid
// that started the site; the intro line and the meta description keep it and
// put the live number beside it, so neither can drift from the board.

export const ESPN = { w: 1, l: 8, games: 9 }

/** `cut`: 10 (the factoid's) or 25, the board's other opponent cut */
export function kiffinRecord(data, cut = 10) {
  const c = data.coaches.find((c) => c.n === 'Lane Kiffin')
  const games = c ? c.g.filter((g) => g[3] <= cut) : []
  let w = 0, l = 0, t = 0
  for (const g of games) g[4] === 'W' ? w++ : g[4] === 'L' ? l++ : t++
  return { w, l, t, games: games.length, since: Math.max(0, games.length - ESPN.games) }
}

export const rec = ({ w, l, t }, dash = '-') => `${w}${dash}${l}${t ? `${dash}${t}` : ''}`

/**
 * The intro line's records, oldest first: ESPN's factoid, then his record
 * after each top-10 road game since, the last one live. The page strikes
 * every one but the last ("1-8 1-9 1-10", Drew's call 2026-11-22), and so
 * does the og card.
 */
export function kiffinSteps(data) {
  const c = data.coaches.find((c) => c.n === 'Lane Kiffin')
  const games = c ? c.g.filter((g) => g[3] <= 10) : []
  const steps = [{ ...ESPN }]
  let w = ESPN.w, l = ESPN.l, t = 0
  for (const g of games.slice(ESPN.games)) {
    g[4] === 'W' ? w++ : g[4] === 'L' ? l++ : t++
    steps.push({ w, l, t })
  }
  return steps
}

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
