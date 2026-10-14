#!/usr/bin/env node
// The hallucination gate (the receipts-research skill's check-receipts.mjs,
// with this repo's page store). Walks JSON for any object carrying
// receipts: [...] and requires each receipt's quote to appear,
// whitespace-collapsed, in the text of its url. A quote that isn't on its
// page prints as MISS and the script exits 1.
//
//   node scripts/check-receipts.mjs [--offline] FILE.json ...
//
// Page text lives gzipped under data/research/pages/<sha1(url)>.txt.gz with
// index.json beside it, committed, so the check runs again after a page
// changes or disappears. scripts/save-pages.mjs fills it from data/raw/;
// without --offline a page it doesn't have is fetched and saved.
//
// Receipt forms (the skill's claims.md):
//   { url, quote, note?, retrieved? }   checked here
//   { sources: [...], note? }           a vote across named datasets; counted, not checked

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT } from './lib/util.mjs';
import { sha1, normalize, htmlToText } from './lib/receipts.mjs';

const args = process.argv.slice(2);
const offline = args.includes('--offline');
const files = args.filter((a) => !a.startsWith('--'));
if (!files.length) {
  console.error('usage: check-receipts.mjs [--offline] FILE.json ...');
  process.exit(2);
}
const PAGES = path.join(ROOT, 'data', 'research', 'pages');
fs.mkdirSync(PAGES, { recursive: true });
const indexPath = path.join(PAGES, 'index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};

const cache = new Map();
async function pageText(url) {
  if (cache.has(url)) return cache.get(url);
  const file = path.join(PAGES, `${sha1(url)}.txt.gz`);
  let result;
  if (fs.existsSync(file)) result = { text: normalize(zlib.gunzipSync(fs.readFileSync(file)).toString('utf8')) };
  else if (offline) result = { error: 'no saved page; run save-pages.mjs, or this without --offline' };
  else {
    try {
      const res = await fetch(url, { headers: { 'user-agent': 'hostile-territory check-receipts (github.com/DrewHoo/hostile-territory)' }, redirect: 'follow', signal: AbortSignal.timeout(30000) });
      const type = res.headers.get('content-type') ?? '';
      if (!res.ok) result = { error: `HTTP ${res.status}` };
      else if (/pdf/i.test(type)) result = { error: `PDF; extract its text to ${path.relative(ROOT, file)}` };
      else {
        const body = await res.text();
        const text = /html/i.test(type) || /^\s*</.test(body) ? htmlToText(body) : body;
        fs.writeFileSync(file, zlib.gzipSync(text));
        index[sha1(url)] = url;
        fs.writeFileSync(indexPath, JSON.stringify(Object.fromEntries(Object.entries(index).sort((a, b) => a[1].localeCompare(b[1]))), null, 1) + '\n');
        result = { text: normalize(text) };
      }
      await new Promise((r) => setTimeout(r, 1000));
    } catch (e) {
      result = { error: e.name === 'TimeoutError' ? 'timeout' : e.message };
    }
  }
  cache.set(url, result);
  return result;
}

function* claims(value, where) {
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) yield* claims(value[i], `${where}[${i}]`);
  } else if (value && typeof value === 'object') {
    if (Array.isArray(value.receipts)) yield { obj: value, where };
    for (const [k, v] of Object.entries(value)) if (k !== 'receipts') yield* claims(v, where ? `${where}.${k}` : k);
  }
}
const label = (obj) => ['date', 'season', 'school', 'coach', 'away_team', 'home_team'].filter((k) => obj[k] !== undefined && typeof obj[k] !== 'object').map((k) => `${k}=${obj[k]}`).join(' ');

let failed = 0;
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const t = { total: 0, ok: 0, miss: 0, err: 0, vote: 0 };
  const lines = [];
  for (const { obj, where } of claims(data, '')) {
    for (let i = 0; i < obj.receipts.length; i++) {
      const r = obj.receipts[i];
      t.total++;
      const at = `${where || '<root>'}.receipts[${i}]${label(obj) ? ` (${label(obj)})` : ''}`;
      if (r?.sources && !r.url) { t.vote++; continue; }
      if (!r?.url || !r?.quote) { t.err++; lines.push(`ERR  ${at}: needs url and quote, or the sources form`); continue; }
      const page = await pageText(r.url);
      if (page.error) { t.err++; lines.push(`ERR  ${at}: ${page.error}\n       ${r.url}`); continue; }
      if (page.text.includes(normalize(r.quote))) t.ok++;
      else { t.miss++; lines.push(`MISS ${at}\n       ${r.url}\n       "${r.quote.length > 120 ? r.quote.slice(0, 117) + '...' : r.quote}"`); }
    }
  }
  console.log(`${path.relative(ROOT, path.resolve(file))}: ${t.total} receipts — ${t.ok} ok, ${t.miss} miss, ${t.err} unfetched, ${t.vote} votes`);
  for (const l of lines.slice(0, 40)) console.log('  ' + l);
  if (lines.length > 40) console.log(`  … ${lines.length - 40} more`);
  failed += t.miss + t.err;
}
process.exit(failed ? 1 : 0);
