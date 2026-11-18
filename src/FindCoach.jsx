// The dateline's search icon: a box over every coach on the board (and every
// school), in a small dropdown under the icon. Picking a coach opens his row,
// the way Streak King's search icon opens a team.

import { useEffect, useMemo, useRef, useState } from 'react'
import { SearchIcon } from './Icons.jsx'

const plain = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

/** `coaches`: the board's coaches; `onPick(name)` opens one; `recordOf(c)` is his record in the view on screen. */
export function FindCoach({ coaches, onPick, recordOf }) {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const ref = useRef(null)
  const close = () => { setOpen(false); setQ('') }

  useEffect(() => {
    if (!open) return
    const out = (e) => { if (!ref.current?.contains(e.target)) close() }
    const esc = (e) => { if (e.key === 'Escape') close() }
    window.addEventListener('pointerdown', out)
    window.addEventListener('keydown', esc)
    return () => {
      window.removeEventListener('pointerdown', out)
      window.removeEventListener('keydown', esc)
    }
  }, [open])

  // names where a word starts with what's typed, then names or schools that contain it; current coaches first
  const list = useMemo(() => {
    const want = plain(q)
    if (!want) return []
    const starts = [], has = []
    for (const c of coaches) {
      if (c.n.split(/\s+/).some((w) => plain(w).startsWith(want)) || plain(c.n).startsWith(want)) starts.push(c)
      else if (plain(c.n).includes(want) || c.s.some((s) => plain(s).includes(want))) has.push(c)
    }
    const order = (a, b) => (b.a ? 1 : 0) - (a.a ? 1 : 0) || a.n.localeCompare(b.n)
    return [...starts.sort(order), ...has.sort(order)].slice(0, 40)
  }, [coaches, q])

  const pick = (c) => { close(); onPick(c.n) }

  return (
    <span className="find" ref={ref}>
      <button className="ico" onClick={() => (open ? close() : setOpen(true))} aria-label="Find a coach" aria-expanded={open}><SearchIcon /></button>
      {open && (
        <div className="find-pop">
          <input
            type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a coach or school" aria-label="Find a coach or school" autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && list.length) pick(list[0]) }}
          />
          {q && (
            <div className="find-list">
              {list.length === 0 && <p className="find-none">No coach or school matches.</p>}
              {list.map((c) => (
                <button key={c.n} className="find-row" onClick={() => pick(c)}>
                  <span className="find-name">{c.n}</span>
                  <span className="find-sch">{c.s.join(', ')}</span>
                  <span className="find-rec">{recordOf(c)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </span>
  )
}
