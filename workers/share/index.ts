// The share worker: sits on drewhoover.com/hostile-territory/* in front of
// GitHub Pages and serves the board with a coach open at his own address.
//
//   /coach/<slug>/            the board's HTML (Pages has one page), with his
//                             title, his record as the description, his
//                             address as the canonical and his card as
//                             og:image. The board reads the coach from the path.
//   ?coach=<name>             301 to his /coach/<slug>/, the older address
//   /share/coach/<slug>.png   the card (card.ts) from the data this bundle
//                             carries (src/data/*.json, worded by src/coach.js),
//                             cached at the edge
//
// Anything else, and anything that goes wrong, passes through untouched: this
// worker must never be the reason the site is down. A link preview of the
// board is counted in Mixpanel as `share unfurl`.
//
// Deploy: npm run worker:deploy. To see a card locally: npm run build,
// npm run preview (4173), then npm run worker:dev and open
//   http://localhost:8789/hostile-territory/share/coach/lane-kiffin.png

import DATA from '../../src/data/site-data.json';
import EARLY from '../../src/data/site-data-1936.json';
import VENUES from '../../src/data/venues.json';
import * as C from '../../src/coach.js';
import { renderCoachCard } from './card.ts';

interface Env { ORIGIN?: string; NO_REPORT?: string }

const BASE = '/hostile-territory';
const SITE = 'hostile-territory';

/** Bump on any change to what the card draws; it keys the edge cache. */
const CARD_VERSION = '2026-11-02c';

// Analytics: one Mixpanel event per link preview, sent server-side to the
// index site's project (the public token its embed carries; a project token
// only writes). Nothing personal goes: the crawler's name, its user agent
// only when it is a crawler, the country Cloudflare saw and the URL.
const MIXPANEL_TOKEN = '1c6a0f45b8a5768185a8d9a2f4d65452';
const AGENTS: [RegExp, string][] = [
  [/Slackbot|Slack-ImgProxy/i, 'slack'], [/Discordbot/i, 'discord'], [/TelegramBot/i, 'telegram'], [/WhatsApp/i, 'whatsapp'],
  [/LinkedInBot/i, 'linkedin'], [/redditbot/i, 'reddit'], [/Bluesky/i, 'bluesky'], [/Mastodon/i, 'mastodon'],
  [/Facebot.*Twitterbot|Twitterbot.*Facebot/i, 'imessage'], [/Twitterbot/i, 'twitter'], [/facebookexternalhit|Facebot/i, 'facebook'],
  [/Googlebot/i, 'google'], [/bingbot/i, 'bing'], [/Applebot/i, 'apple'], [/bot|crawler|spider|preview|fetch|embed|scraper/i, 'other-bot'],
];
const PREVIEWS = new Set(['slack', 'discord', 'telegram', 'whatsapp', 'linkedin', 'reddit', 'bluesky', 'mastodon', 'imessage', 'twitter', 'facebook']);
const agentOf = (ua: string | null): string => AGENTS.find(([re]) => re.test(ua ?? ''))?.[1] ?? 'browser';

function report(env: Env, ctx: ExecutionContext, request: Request, event: string, props: Record<string, unknown>) {
  if (env.NO_REPORT) return;
  try {
    const ua = request.headers.get('user-agent');
    const agent = agentOf(ua);
    const body = [{
      event,
      properties: {
        token: MIXPANEL_TOKEN, distinct_id: `unfurl:${agent}`, $insert_id: crypto.randomUUID(), time: Math.floor(Date.now() / 1000),
        site: SITE, agent, crawler: agent === 'browser' ? null : (ua ?? '').slice(0, 200),
        country: (request as Request & { cf?: { country?: string } }).cf?.country ?? null,
        ...props,
      },
    }];
    ctx.waitUntil(fetch('https://api.mixpanel.com/track?ip=0', {
      method: 'POST', headers: { 'content-type': 'application/json', accept: 'text/plain' }, body: JSON.stringify(body),
    }).then((r) => r.body?.cancel()).catch(() => {}));
  } catch {}
}

// every coach's record, keyed by slug, worked out once per isolate
let bySlug: Map<string, ReturnType<typeof C.coachRecord>> | null = null;
function records() {
  if (!bySlug) {
    const field = C.mergeEras(DATA.coaches, EARLY.coaches);
    const venues = (VENUES as { coaches: Record<string, unknown> }).coaches;
    bySlug = new Map(field.map((c: { n: string }) => [C.slugOf(c.n), C.coachRecord(c, venues[c.n], field)]));
  }
  return bySlug;
}

function coachCard(slug: string): Response {
  const r = records().get(slug);
  if (!r) throw new Error(`no coach ${slug}`);
  const t = r.table.find((x: { cut: number }) => x.cut === C.CUT);
  const lines = [
    ...(r.hasVenues ? [`${C.rec(t.all)} against the top 10 at every venue`] : []),
    `${C.rec(r.road[25])} on the road against the top 25`,
    ...(r.place ? [`${r.place.last ? 'last' : `${r.place.tied ? 'T-' : ''}${r.place.rank}${['th', 'st', 'nd', 'rd'][(r.place.rank % 100 > 10 && r.place.rank % 100 < 14) || r.place.rank % 10 > 3 ? 0 : r.place.rank % 10]}`} of ${r.place.of} coaches on the road`] : []),
  ];
  return renderCoachCard({
    name: r.name,
    road: C.rec(r.road[C.CUT]),
    lines,
    games: r.games.filter((g: unknown[]) => (g[C.D.RANK] as number) <= C.CUT).map((g: unknown[]) => g[C.D.RES] as string),
    footer: `drewhoover.com/hostile-territory · since 1936`,
  });
}

/** render, buffered: workers-og streams lazily, and a mid-stream failure would otherwise ship a 200 with an empty body */
async function buffered(res: Response): Promise<Response> {
  const png = await res.arrayBuffer();
  if (!png.byteLength) throw new Error('empty render');
  return new Response(png, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=3600, s-maxage=43200' } });
}

const CARD = new RegExp(`^${BASE}/share/coach/([a-z0-9-]+)\\.png$`);
const COACH = new RegExp(`^${BASE}/coach/(?:([a-z0-9-]+)/?)?$`);
const isBoard = (pathname: string) => pathname === `${BASE}/` || pathname === `${BASE}/index.html`;
const VENUE_WORDS: Record<string, string> = { home: 'at home', neutral: 'at neutral sites', all: '' };

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const origin = env.ORIGIN ?? 'https://drewhoover.com';

    // 1. a coach's card, cached at the edge under this deploy's version
    const card = CARD.exec(url.pathname);
    if (card) {
      try {
        const key = new Request(`${url.origin}${url.pathname}?v=${CARD_VERSION}`, { method: 'GET' });
        const cached = await caches.default.match(key);
        report(env, ctx, request, 'share card', { url: url.href, path: url.pathname.replace(BASE, ''), cached: !!cached });
        if (cached) return cached;
        const res = await buffered(coachCard(card[1]));
        ctx.waitUntil(caches.default.put(key, res.clone()));
        return res;
      } catch (e) {
        console.log(JSON.stringify({ event: 'og_render_failed', path: url.pathname, error: String((e as Error)?.stack ?? e) }));
        // the committed image, so a share still carries something
        return Response.redirect(`${origin}${BASE}/og.png`, 302);
      }
    }

    // 2. ?coach=<name>, the older address of an open coach: his path
    const named = isBoard(url.pathname) ? url.searchParams.get('coach') : null;
    if (named) {
      const r = records().get(C.slugOf(named));
      const to = new URL(url.href);
      to.searchParams.delete('coach');
      if (r) to.pathname = `${BASE}/coach/${C.slugOf(r.name)}/`;
      return Response.redirect(to.href, 301);
    }

    // 3. /coach/<slug>/: the board with his head; /coach/ or a slug nobody has goes to the board
    const coach = COACH.exec(url.pathname);
    const r = coach?.[1] ? records().get(coach[1]) : null;
    if (coach && !r) return Response.redirect(`${url.origin}${BASE}/${url.search}`, 301);
    if (coach && !url.pathname.endsWith('/')) return Response.redirect(`${url.origin}${url.pathname}/${url.search}`, 301);

    // 4. everything else from GitHub Pages. A same-zone subrequest skips the worker and lands on Pages.
    const res = await fetch(new Request(`${origin}${r ? `${BASE}/` : url.pathname}${url.search}`, request));
    try {
      if (request.method !== 'GET' || !(r || isBoard(url.pathname))) return res;
      if (PREVIEWS.has(agentOf(request.headers.get('user-agent')))) {
        report(env, ctx, request, 'share unfurl', { url: url.href, $current_url: url.href, path: url.pathname.replace(BASE, '') || '/', coach: r?.name ?? null });
      }
      if (!r || !res.ok || !(res.headers.get('content-type') ?? '').includes('text/html')) return res;
      const venue = url.searchParams.get('venue') ?? 'road';
      const title = venue in VENUE_WORDS
        ? `${r.name}'s record${VENUE_WORDS[venue] ? ` ${VENUE_WORDS[venue]}` : ''} vs top-10 teams`
        : `${r.name}'s road record vs top-10 teams`;
      const description = C.coachLead(r);
      const page = `https://drewhoover.com${BASE}/coach/${C.slugOf(r.name)}/`;
      const img = `${origin}${BASE}/share/coach/${C.slugOf(r.name)}.png`;
      const content = (v: string) => ({ element(e: Element) { e.setAttribute('content', v); } });
      const headers = new Headers(res.headers);
      headers.delete('content-length');
      return new HTMLRewriter()
        .on('title', { element(e) { e.setInnerContent(title); } })
        .on('link[rel="canonical"]', { element(e) { e.setAttribute('href', page); } })
        .on('meta[name="description"]', content(description))
        .on('meta[property="og:title"]', content(title))
        .on('meta[property="og:description"]', content(description))
        .on('meta[property="og:url"]', content(page + url.search))
        .on('meta[property="og:image"]', content(img))
        .on('meta[property="og:image:width"]', content('1200'))
        .on('meta[property="og:image:height"]', content('630'))
        .on('meta[property="og:image:alt"]', content(`${r.name}'s record vs top-10 teams, on a dark board.`))
        .on('meta[name="twitter:image"]', content(img))
        .on('meta[name="twitter:title"]', content(title))
        .on('meta[name="twitter:description"]', content(description))
        .transform(new Response(res.body, { status: res.status, headers }));
    } catch (e) {
      console.log(JSON.stringify({ event: 'share_rewrite_failed', url: url.pathname + url.search, error: String(e) }));
      return res;
    }
  },
} satisfies ExportedHandler<Env>;
