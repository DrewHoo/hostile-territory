// URL <-> state helpers. Read the URL only after mount (in a useEffect), never
// during render: the prerender runs without a window, and seeding state from
// the URL during render hydrates into a mismatch when the param is set.

export function readParam(key) {
  try {
    return new URLSearchParams(window.location.search).get(key)
  } catch {
    return null
  }
}

// replaceState, not pushState: changing a filter should not grow the back
// stack. The analytics embed counts each call as a pageview, so the shared
// URL and the report agree on what people looked at.
export function writeParam(key, value) {
  try {
    const url = new URL(window.location.href)
    if (value == null || value === '') url.searchParams.delete(key)
    else url.searchParams.set(key, value)
    window.history.replaceState(null, '', url)
  } catch {}
}

// The open coach is the path, /coach/<slug>/, the address the share worker
// serves the board at with his title and card. A ?coach= address still opens
// him, and opening or closing a row rewrites it as the path.
export function writeCoachPath(slug) {
  try {
    const url = new URL(window.location.href)
    url.pathname = `${import.meta.env.BASE_URL}${slug ? `coach/${slug}/` : ''}`
    url.searchParams.delete('coach')
    window.history.replaceState(null, '', url)
  } catch {}
}

/** the coach slug in the path, or null */
export function readCoachPath() {
  try {
    return window.location.pathname.match(/\/coach\/([a-z0-9-]+)\/?$/)?.[1] ?? null
  } catch {
    return null
  }
}
