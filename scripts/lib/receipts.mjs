// The receipt object and the text normalization the quote gate uses
// (the receipts-research skill's claims.md and check-receipts.mjs). The
// pipeline writes quotes with pageText()/normalize() from here, and
// scripts/check-receipts.mjs checks them with the same functions, so a quote
// cut from a page's HTML is a substring of that page's saved text.

import { createHash } from 'node:crypto';

export const sha1 = (s) => createHash('sha1').update(s).digest('hex');

// Whitespace collapsed, curly quotes straightened, Wikipedia's "[12]" markers
// dropped, and no space before punctuation (a tag boundary before a period
// leaves one).
export function normalize(s) {
  return s
    .replace(/[‘’‚‛]/g, "'")
    .replace(/[“”„‟]/g, '"')
    .replace(/\u00a0/g, ' ')
    .replace(/\[\d+\]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?)\]*])/g, '$1')
    .replace(/([(\[])\s+/g, '$1')
    .trim();
}

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…' };

export function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    // a tag ends at the first '>' outside a quoted attribute: Wikipedia's
    // Parsoid HTML carries wikitext in data-mw attributes, '>' included
    .replace(/<(?:[^>"']|"[^"]*"|'[^']*')*>/g, ' ')
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
}

/** The quotable text of an HTML fragment (a table row): what the gate will look for. */
export const quoteOf = (html) => normalize(htmlToText(html));

export const howellUrl = (file) => `https://www.jhowell.net/cf/scores/${file}`;
export const cpaPollUrl = (id) => `https://www.collegepollarchive.com/football/ap/seasons.cfm?appollid=${id}`;
