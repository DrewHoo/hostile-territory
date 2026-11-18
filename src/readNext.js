// What to read next: Putting Up Numbers' claims about the coach the reader has
// open, and his school. The index site's back-bar embed (data-read-next="cfb")
// fetches and shuffles them and draws the top bar; the block under the board
// shows the first five of the same order as sentences. The prerender bakes the
// sport's list into the page for a crawler and for a reader the embed never
// reaches. puttingupnumbers' specs/read-next-across-sites.spec.md.
import { slugOf } from './coach.js'
import PUN_SLUGS from './punSlugs.json'

export const PUN_ORIGIN = 'https://puttingupnumbers.com'
/** the block's length, and the fewest it shows */
const BLOCK = 5
const FEWEST = 3

/** PUN's address word for a coach: his name's, but where PUN spells him otherwise or a namesake has the plain one (punSlugs.json) */
export const punCoach = (name) => PUN_SLUGS.coaches[slugOf(name)] ?? slugOf(name)
/** PUN's slug for a school: the board's school names slug the way PUN's do, all 160 of them (2026-11-18) */
export const punTeam = (school) => slugOf(school)

/** the subject the embed reads off <html>: a coach and his school (the last he coached), or a school */
export function subjectOf(coachName, school) {
  if (coachName) return { subject: `coach:${punCoach(coachName)}`, team: school ? punTeam(school) : null }
  return { subject: school ? `team:${punTeam(school)}` : null, team: null }
}
/** the subject on <html>, or none (then the embed uses the last one any sports site set) */
export function setSubject(coachName, school) {
  const el = document.documentElement
  const { subject, team } = subjectOf(coachName, school)
  if (subject) el.setAttribute('data-dh-subject', subject)
  else el.removeAttribute('data-dh-subject')
  if (team) el.setAttribute('data-dh-team', team)
  else el.removeAttribute('data-dh-team')
}

let baked = []
/** the list the prerender baked into this page: set by the prerender before it renders, and by main.jsx from the page before it hydrates */
export const setBaked = (links) => { baked = links }
export const bakedLinks = () => baked

/** the embed's order, when it has drawn enough */
export const drawnLinks = () => {
  const d = typeof window === 'undefined' ? null : window.dhReadNext
  return d && d.links.length >= FEWEST ? d.links.slice(0, BLOCK) : null
}

const from = () => window.location.pathname.split('/')[1] || 'index'
const track = (name, props) => { try { window.dhAnalytics?.track(name, props) } catch {} }

/** a tap on the block, counted (and remembered, so the draw drops it for 30 days) by the embed, or here when it never loaded */
export function tapLink(l, slot) {
  if (window.dhReadNext) window.dhReadNext.tap(l, slot, 'block')
  else track('readnext', { from: from(), to: l.href, id: l.id, kind: l.kind, sport: l.sport, slot, where: 'block' })
}
/** the block came on screen */
export function blockShown(links) {
  const ids = links.map((l) => l.id)
  if (window.dhReadNext) window.dhReadNext.shown('block', ids)
  else track('readnext shown', { from: from(), subject: null, ids, where: 'block' })
}
export const isPun = (href) => href.startsWith(`${PUN_ORIGIN}/`)
