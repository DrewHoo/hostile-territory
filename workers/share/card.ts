// A coach's card renders the view the shared URL names (?cut=&venue=), not
// the site's premise: his record in Graduate beside his name, the one
// sentence, and every game of the view as the board's chips, the opponent's
// mark on a cream or dark square. 1200x630 through workers-og (satori +
// resvg wired for workerd). satori can't run CSS filters, so the chips'
// marks are the committed logos-ink/ (win) and logos-dim/ (loss, tie)
// variants, baked by scripts/gen-chip-logos.mjs. The chip rows are chunked
// by hand because satori's flex-wrap insets the first wrapped line by one
// gap. Fonts ride in the bundle (OFL; the site's own, copied from College
// Football Streak King's worker).

import { ImageResponse } from 'workers-og';
import graduate from './fonts/Graduate-Regular.ttf';
import mono from './fonts/IBMPlexMono-Regular.ttf';
import monoBold from './fonts/IBMPlexMono-SemiBold.ttf';
import serif from './fonts/SourceSerif4-Regular.ttf';

const BG = '#282127';
const LIFT = '#322a30';
const MUTED = '#bfb2a6';
const FAINT = '#857a75';
const LINE = '#453a42';
const CREAM = '#f3e2bc';
const RUST = '#c36c36';

export interface ChipGame {
  res: string; // 'W' | 'L' | 'T'
  /** the opponent's mark as a data URI (logos-ink for a win, logos-dim otherwise), or null for a letter chip */
  logo: string | null;
}

export interface CoachCard {
  name: string;
  /** the view's cut, for the kicker */
  cut: number;
  /** "22-8", the view's record */
  record: string;
  /** ".733", or '' for an empty view */
  pct: string;
  /** "against the top 25, at every venue" */
  sentence: string;
  games: ChipGame[];
  footer: string;
}

const esc = (s: string) => s.replace(/</g, '&lt;').replace(/"/g, '&quot;');

// the chip grid lives in the centered 720px column (Reddit's compact feed
// center-crops the 1.91:1 card to a near-square, so nothing meaningful may
// leave it) and about 330px of height: the biggest chip that fits.
const GAP = 8;
function chipSize(n: number): number {
  for (const s of [56, 48, 40, 34, 28, 22]) {
    const perRow = Math.floor((720 + GAP) / (s + GAP));
    const rows = Math.ceil(Math.max(1, n) / perRow);
    if (rows * s + (rows - 1) * GAP <= 330) return s;
  }
  return 18;
}

export function renderCoachCard(c: CoachCard): Response {
  const size = chipSize(c.games.length);
  const mark = Math.round(size * 0.72);
  const chip = (g: ChipGame) => {
    const style = g.res === 'W'
      ? `background-color:${CREAM};`
      : g.res === 'L'
        ? `background-color:${LIFT}; border:1px solid ${LINE};`
        : `background-color:${LIFT}; border:1px dashed rgba(243,226,188,0.6);`;
    const inner = g.logo
      ? `<img src="${g.logo}" style="width:${mark}px; height:${mark}px;">`
      : `<span style="font-family:'Plex'; font-weight:600; font-size:${Math.round(size * 0.42)}px; color:${g.res === 'W' ? '#241d12' : MUTED};">${g.res}</span>`;
    return `<div style="display:flex; align-items:center; justify-content:center; width:${size}px; height:${size}px; border-radius:4px; ${style}">${inner}</div>`;
  };
  const perRow = Math.floor((720 + GAP) / (size + GAP));
  const rows: ChipGame[][] = [];
  for (let i = 0; i < c.games.length; i += perRow) rows.push(c.games.slice(i, i + perRow));
  const nameSize = Math.max(34, Math.min(50, Math.floor(430 / (0.48 * Math.max(1, c.name.length)))));
  // every meaningful glyph stays inside the centered 720px column
  const html = `
  <div style="display:flex; flex-direction:column; align-items:center; width:1200px; height:630px; background-color:${BG}; padding:42px 0 30px;">
    <div style="display:flex; font-family:'Plex'; font-weight:600; font-size:17px; letter-spacing:4px; color:${RUST};">HOSTILE TERRITORY · VS THE AP TOP ${c.cut}</div>
    <div style="display:flex; flex-direction:column; justify-content:center; flex-grow:1; width:720px; margin-bottom:44px;">
      <div style="display:flex; flex-direction:row; align-items:flex-end; justify-content:center; gap:30px;">
        <div style="display:flex; font-family:'Serif'; font-size:${nameSize}px; color:${CREAM}; line-height:1; white-space:nowrap;">${esc(c.name)}</div>
        <div style="display:flex; font-family:'Graduate'; font-size:58px; color:${CREAM}; line-height:1;">${esc(c.record)}</div>
      </div>
      <div style="display:flex; flex-direction:row; align-items:center; justify-content:center; gap:12px; margin-top:12px;">
        <div style="display:flex; font-family:'Serif'; font-size:20px; color:${MUTED};">${esc(c.sentence)}</div>
        ${c.pct ? `<div style="display:flex; font-family:'Plex'; font-size:17px; letter-spacing:1px; color:${FAINT};">${esc(c.pct)}</div>` : ''}
      </div>
      <div style="display:flex; flex-direction:column; gap:${GAP}px; margin-top:28px; align-items:flex-start;">
        ${rows.map((row) => `<div style="display:flex; flex-direction:row; gap:${GAP}px;">${row.map(chip).join('')}</div>`).join('')}
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
