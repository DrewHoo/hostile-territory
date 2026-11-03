// A coach's card: his road record against the AP top 10 in Graduate numbers,
// his record at every venue under it, and his road games against the top 10
// as the board's cream and dark squares. 1200x630 through workers-og (satori
// + resvg wired for workerd). Fonts ride in the bundle (OFL; the site's own,
// copied from College Football Streak King's worker).

import { ImageResponse } from 'workers-og';
import graduate from './fonts/Graduate-Regular.ttf';
import mono from './fonts/IBMPlexMono-Regular.ttf';
import monoBold from './fonts/IBMPlexMono-SemiBold.ttf';
import serif from './fonts/SourceSerif4-Regular.ttf';

const BG = '#282127';
const LIFT = '#322a30';
const INK = '#efe6d9';
const MUTED = '#bfb2a6';
const FAINT = '#857a75';
const LINE = '#453a42';
const CREAM = '#f3e2bc';
const RUST = '#c36c36';

export interface CoachCard {
  name: string;
  /** "1-9", his road record against the top 10 */
  road: string;
  /** the lines beside it: "6-17 against the top 10 at every venue" */
  lines: string[];
  /** his road games against the top 10, oldest first: 'W' | 'L' | 'T' */
  games: string[];
  footer: string;
}

const esc = (s: string) => s.replace(/</g, '&lt;').replace(/"/g, '&quot;');
const MAX_SQUARES = 53; // three rows of 18 in the 720px column, the last square's room for "+N earlier"

export function renderCoachCard(c: CoachCard): Response {
  const shown = c.games.slice(-MAX_SQUARES);
  const more = c.games.length - shown.length;
  // fewer games, bigger squares: one row of 12 at 54px, else rows of 18 at 34px
  const size = c.games.length <= 12 ? 54 : 34
  const square = (r: string) => {
    const style = r === 'W'
      ? `background-color:${CREAM};`
      : r === 'L'
        ? `background-color:${LIFT}; border:1px solid ${LINE};`
        : `background-color:${LIFT}; border:1px dashed ${CREAM};`;
    return `<div style="display:flex; width:${size}px; height:${size}px; border-radius:4px; ${style}"></div>`;
  };
  const nameSize = Math.max(38, Math.min(64, Math.floor(720 / (0.5 * Math.max(1, c.name.length)))));
  // every meaningful glyph stays inside the centered 720px column: Reddit's
  // compact feed center-crops the 1.91:1 card to a near-square thumbnail
  const html = `
  <div style="display:flex; flex-direction:column; align-items:center; width:1200px; height:630px; background-color:${BG}; padding:44px 0 34px;">
    <div style="display:flex; font-family:'Plex'; font-size:17px; letter-spacing:4px; color:${RUST};">HOSTILE TERRITORY · VS THE AP TOP 10</div>
    <div style="display:flex; font-family:'Serif'; font-size:${nameSize}px; color:${CREAM}; margin-top:10px; white-space:nowrap;">${esc(c.name)}</div>
    <div style="display:flex; flex-direction:column; justify-content:center; flex-grow:1;">
    <div style="display:flex; flex-direction:row; align-items:center; gap:28px; width:720px;">
      <div style="display:flex; flex-direction:column; align-items:center;">
        <div style="display:flex; font-family:'Graduate'; font-size:92px; color:${CREAM}; line-height:1;">${esc(c.road)}</div>
        <div style="display:flex; font-family:'Plex'; font-size:14px; letter-spacing:2px; color:${MUTED}; margin-top:8px;">ON THE ROAD</div>
      </div>
      <div style="display:flex; flex-direction:column; gap:6px; flex-grow:1;">
        ${c.lines.map((l) => `<div style="display:flex; font-family:'Serif'; font-size:21px; color:${INK}; white-space:nowrap;">${esc(l)}</div>`).join('')}
      </div>
    </div>
    <div style="display:flex; flex-direction:row; flex-wrap:wrap; gap:6px; width:720px; margin-top:30px;">
      ${shown.map(square).join('')}
      ${more > 0 ? `<div style="display:flex; align-items:center; height:${size}px; font-family:'Plex'; font-size:15px; color:${FAINT}; margin-left:6px;">+${more} earlier</div>` : ''}
    </div>
    </div>
    <div style="display:flex; font-family:'Plex'; font-weight:600; font-size:14px; letter-spacing:2px; color:${FAINT};">${esc(c.footer.toUpperCase())}</div>
  </div>`;
  return new ImageResponse(html, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Graduate', data: graduate as ArrayBuffer, weight: 400, style: 'normal' },
      { name: 'Plex', data: mono as ArrayBuffer, weight: 400, style: 'normal' },
      { name: 'Plex', data: monoBold as ArrayBuffer, weight: 600, style: 'normal' },
      { name: 'Serif', data: serif as ArrayBuffer, weight: 400, style: 'normal' },
    ],
  });
}
