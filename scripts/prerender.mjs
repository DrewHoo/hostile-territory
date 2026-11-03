// Runs after `vite build`. Bakes the rendered app into dist/index.html and
// writes the <head> from site.config.js.
//
// Without this the deployed page is `<div id="root"></div>` and every word on
// it exists only after React runs. Google usually renders JS in a deferred
// second pass; Bing, DuckDuckGo, social unfurlers, and the LLM crawlers
// largely don't. Prerendering makes the content plain HTML.
import { createServer } from 'vite'
import { renderToString } from 'react-dom/server'
import React from 'react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import config from '../site.config.js'
import pkg from '../package.json' with { type: 'json' }
import DATA from '../src/data/site-data.json' with { type: 'json' }
import EARLY from '../src/data/site-data-1936.json' with { type: 'json' }
import { llmsText } from './lib/llms.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SLUG = pkg.name
const ORIGIN = `https://${config.domain}`
const SITE = `${ORIGIN}/${SLUG}/`
const OUT = path.join(ROOT, 'dist/index.html')

if (config.domain === 'example.com') {
  console.warn('prerender: site.config.js still says example.com; the canonical and OG URLs will be wrong until you set your domain')
}

const vite = await createServer({
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'warn',
})
const { default: App } = await vite.ssrLoadModule('/src/App.jsx')
const appHtml = renderToString(React.createElement(App))
const { CoachPage, CoachIndex } = await vite.ssrLoadModule('/src/CoachPage.jsx')
const C = await vite.ssrLoadModule('/src/coach.js')
const VENUES = (await vite.ssrLoadModule('/src/data/venues.json')).default.coaches
const coachHtml = (props) => renderToString(React.createElement(CoachPage, props))
const indexHtml = (props) => renderToString(React.createElement(CoachIndex, props))
await vite.close()

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

// Add page-specific structured data here (an ItemList of the rows, a Dataset,
// a TheaterEvent) generated from the same data the page renders, so it can't
// drift from what is on screen.
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      '@id': SITE,
      url: SITE,
      name: config.title,
      description: config.description,
      isPartOf: { '@type': 'WebSite', url: `${ORIGIN}/`, name: config.domain },
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: config.domain, item: `${ORIGIN}/` },
        { '@type': 'ListItem', position: 2, name: config.title, item: SITE },
      ],
    },
  ],
}

const head = `
    <meta name="description" content="${esc(config.description)}" />
    <link rel="canonical" href="${SITE}" />

    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(config.domain)}" />
    <meta property="og:title" content="${esc(config.title)}" />
    <meta property="og:description" content="${esc(config.description)}" />
    <meta property="og:url" content="${SITE}" />
    <meta property="og:image" content="${SITE}${config.ogImage ?? 'og.png'}" />
    <meta property="og:image:width" content="${config.ogImageWidth ?? 1200}" />
    <meta property="og:image:height" content="${config.ogImageHeight ?? 630}" />
    <meta property="og:image:alt" content="${esc(config.ogImageAlt)}" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(config.title)}" />
    <meta name="twitter:description" content="${esc(config.description)}" />
    <meta name="twitter:image" content="${SITE}og.png" />

    <!-- Cross-site chrome served by the index site: back bar, comments, analytics. -->
    <script src="${ORIGIN}/embed/back-bar.js" data-section="sports" async></script>
    <script src="${ORIGIN}/embed/giscus.js" async></script>
    <script src="${ORIGIN}/embed/analytics.js" async></script>

    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>`

let html = fs.readFileSync(OUT, 'utf8')
// the built page's own <link>s (the stylesheet, the fonts, the icons), for the coach pages
const builtLinks = (html.match(/<link [^>]+>/g) ?? []).join('\n    ')

// Throw rather than no-op: a Vite change that renames the marker would
// otherwise quietly ship an empty page again.
if (!html.includes('<div id="root"></div>')) {
  throw new Error('prerender: could not find an empty #root in dist/index.html')
}
if (!/<title>[^<]*<\/title>/.test(html)) {
  throw new Error('prerender: could not find <title> in dist/index.html')
}
html = html.replace(/<title>[^<]*<\/title>/, `<title>${esc(config.title)}</title>`)
html = html.replace('</head>', head)
html = html.replace('<div id="root"></div>', `<div id="root">${appHtml}</div>`)
fs.writeFileSync(OUT, html)

// A page per coach, /coach/<slug>/, and the list of them at /coach/: static
// HTML with the site's styles and no app script. Each one's head says its own
// title and lead; the card is the site's poster until the share worker draws one.
const field = C.mergeEras(DATA.coaches, EARLY.coaches)
const pageHead = ({ url, title, description, crumbs }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${esc(title)}</title>
    ${builtLinks}
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(config.domain)}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE}${config.ogImage ?? 'og.png'}" />
    <meta property="og:image:width" content="${config.ogImageWidth ?? 1200}" />
    <meta property="og:image:height" content="${config.ogImageHeight ?? 630}" />
    <meta property="og:image:alt" content="${esc(config.ogImageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${SITE}og.png" />
    <script src="${ORIGIN}/embed/back-bar.js" data-section="sports" async></script>
    <script src="${ORIGIN}/embed/analytics.js" async></script>
    <script type="application/ld+json">${JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebPage', '@id': url, url, name: title, description, isPartOf: { '@type': 'WebSite', url: `${ORIGIN}/`, name: config.domain } },
        { '@type': 'BreadcrumbList', itemListElement: [{ name: config.domain, item: `${ORIGIN}/` }, { name: 'Hostile Territory', item: SITE }, ...crumbs].map((c, i) => ({ '@type': 'ListItem', position: i + 1, ...c })) },
      ],
    })}</script>
  </head>
  <body>
`
const pages = []
const writePage = (rel, head, body) => {
  const dir = path.join(ROOT, 'dist', rel)
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), `${head}${body}\n  </body>\n</html>\n`)
  pages.push(`${SITE}${rel}`)
}
const records = field.map((c) => C.coachRecord(c, VENUES[c.n], field)).sort((a, b) => a.name.localeCompare(b.name))
for (const r of records) {
  const rel = C.coachPath(r.name)
  const url = `${SITE}${rel}`
  writePage(rel, pageHead({ url, title: C.coachTitle(r), description: C.coachDescription(r), crumbs: [{ name: 'Coaches', item: `${SITE}coach/` }, { name: r.name, item: url }] }), coachHtml({ r, board: `/${SLUG}/` }))
}
const surname = (n) => n.split(' ').slice(-1)[0]
const indexRows = records
  .map((r) => ({ name: r.name, path: `/${SLUG}/${C.coachPath(r.name)}`, road: r.road[C.CUT], all: r.hasVenues ? r.table.find((x) => x.cut === C.CUT).all : null }))
  .sort((a, b) => surname(a.name).localeCompare(surname(b.name)) || a.name.localeCompare(b.name))
const indexTitle = "Every college football coach's record vs top-10 teams"
writePage('coach/', pageHead({ url: `${SITE}coach/`, title: indexTitle, description: `${records.length.toLocaleString('en-US')} head coaches since 1936, each with his road record against AP top-10 teams and his record against them at home and on neutral fields.`, crumbs: [{ name: 'Coaches', item: `${SITE}coach/` }] }), indexHtml({ coaches: indexRows, board: `/${SLUG}/` }))

// The sitemap: the board, the list of coaches and every coach's page, with lastmod.
const lastmod = new Date().toISOString().slice(0, 10)
fs.writeFileSync(
  path.join(ROOT, 'dist/sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[SITE, ...pages].map((u) => `  <url>\n    <loc>${esc(u)}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`).join('\n')}
</urlset>
`,
)

// llms.txt (llmstxt.org): the site in plain markdown for a language model.
fs.writeFileSync(path.join(ROOT, 'dist/llms.txt'), llmsText({ site: SITE, title: config.title, description: config.description, generated: DATA.generated, coaches: new Set([...DATA.coaches, ...EARLY.coaches].map((c) => c.n)).size, pages: records.map((r) => ({ url: `${SITE}${C.coachPath(r.name)}`, title: C.coachTitle(r), lead: C.coachLead(r) })) }))
console.log(`prerender: ${records.length} coach pages and the list at ${SITE}coach/`)

const words = appHtml.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
console.log(`prerendered ${(appHtml.length / 1024).toFixed(0)}KB into #root (~${words} words); head written for ${SITE}`)
