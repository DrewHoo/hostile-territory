#!/usr/bin/env node
// Save the text of every page a receipt quotes under data/research/pages/
// (<sha1(url)>.txt.gz, index.json beside it), so scripts/check-receipts.mjs
// can check every quote offline against a committed copy.
//
//   CSK_DIR=../cfb-streak-king node scripts/save-pages.mjs data/games-candidates.json data/coach-stints.json
//
// Where the text comes from, in order:
//   1. data/raw/, when the url is a page fetch-data.mjs cached (Howell's team
//      pages, read as windows-1252 the way build-candidates reads them; CPA
//      poll pages, as UTF-8). These are the bytes the quotes were cut from.
//   2. cfb-streak-king's committed data/research/pages/, same sha1 naming,
//      for the coach-overrides receipts that ride on data/coach-stints.json.
// A page already saved is left alone; delete it to re-save. A url neither
// source has is listed, and check-receipts.mjs (without --offline) fetches it.

import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { ROOT, RAW } from './lib/util.mjs';
import { sha1, htmlToText } from './lib/receipts.mjs';

const PAGES = path.join(ROOT, 'data', 'research', 'pages');
const CSK_PAGES = path.join(path.resolve(process.env.CSK_DIR ?? path.join(ROOT, '..', 'cfb-streak-king')), 'data', 'research', 'pages');
fs.mkdirSync(PAGES, { recursive: true });
const indexPath = path.join(PAGES, 'index.json');
const index = fs.existsSync(indexPath) ? JSON.parse(fs.readFileSync(indexPath, 'utf8')) : {};

function urls(value, out) {
  if (Array.isArray(value)) for (const v of value) urls(v, out);
  else if (value && typeof value === 'object') {
    if (Array.isArray(value.receipts)) for (const r of value.receipts) if (r?.url) out.add(r.url);
    for (const [k, v] of Object.entries(value)) if (k !== 'receipts') urls(v, out);
  }
  return out;
}

function rawFor(url) {
  let m = /^https:\/\/www\.jhowell\.net\/cf\/scores\/([^/#?]+\.htm)$/.exec(url);
  if (m) {
    const f = path.join(RAW, 'jhowell', 'teams', m[1]);
    return fs.existsSync(f) ? fs.readFileSync(f, 'latin1') : null;
  }
  m = /^https:\/\/www\.collegepollarchive\.com\/football\/ap\/seasons\.cfm\?appollid=(\d+)$/.exec(url);
  if (m) {
    const f = path.join(RAW, 'ap-polls', 'polls', `poll-${m[1]}.html`);
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null;
  }
  return null;
}

const want = new Set();
for (const f of process.argv.slice(2)) urls(JSON.parse(fs.readFileSync(f, 'utf8')), want);
const t = { kept: 0, raw: 0, csk: 0, missing: [] };
for (const url of [...want].sort()) {
  const sha = sha1(url);
  const file = path.join(PAGES, `${sha}.txt.gz`);
  if (fs.existsSync(file)) { t.kept++; index[sha] = url; continue; }
  const html = rawFor(url);
  if (html != null) {
    fs.writeFileSync(file, zlib.gzipSync(htmlToText(html).replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n')));
    index[sha] = url;
    t.raw++;
    continue;
  }
  const csk = path.join(CSK_PAGES, `${sha}.txt.gz`);
  if (fs.existsSync(csk)) {
    fs.copyFileSync(csk, file);
    index[sha] = url;
    t.csk++;
    continue;
  }
  t.missing.push(url);
}
fs.writeFileSync(indexPath, JSON.stringify(Object.fromEntries(Object.entries(index).sort((a, b) => a[1].localeCompare(b[1]))), null, 1) + '\n');
console.log(`${want.size} urls: ${t.kept} already saved, ${t.raw} from data/raw, ${t.csk} from cfb-streak-king, ${t.missing.length} not found`);
for (const u of t.missing) console.log('  missing ' + u);
