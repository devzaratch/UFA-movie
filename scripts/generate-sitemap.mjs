// Generates sitemap.xml from data.js so it never falls out of sync.
// Usage: node scripts/generate-sitemap.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = 'https://doonung-movie.pages.dev'; // must match robots.txt; update both if the domain changes
const lastmod = new Date().toISOString().slice(0, 10);

const source = readFileSync(join(ROOT, 'data.js'), 'utf8');

// Parse { id, type, title } from each entry without evaluating data.js
const items = [...source.matchAll(
    /\{\s*id:\s*"([^"]+)",\s*type:\s*"([^"]+)",\s*title:\s*"([^"]+)"/g
)].map(m => ({ id: m[1], type: m[2], title: m[3] }));

if (!items.length) {
    console.error("ERROR: parsed 0 entries - data.js format changed, fix the regex");
    process.exit(1);
}

// Uniqueness check: play.html uses Array.find(), so duplicate ids silently hide the later entry
const ids = items.map(x => x.id);
const dups = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dups.length) {
    console.error(`ERROR: duplicate ids in data.js: ${dups.join(', ')}`);
    process.exit(1);
}

const series = items.filter(x => x.type === 'series');
const movies = items.filter(x => x.type !== 'series');

const entry = (id, extra) =>
    `  <url><loc>${BASE}/play.html?id=${id}</loc><lastmod>${lastmod}</lastmod>${extra}</url>`;

const out = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${BASE}/</loc><lastmod>${lastmod}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>`,
    ...series.map(s => entry(s.id, '<changefreq>weekly</changefreq><priority>0.9</priority>')),
    ...movies.map(m => entry(m.id, '<priority>0.8</priority>')),
    '</urlset>',
    '',
].join('\n');

writeFileSync(join(ROOT, 'sitemap.xml'), out);
console.log(`sitemap.xml written: homepage + ${series.length} series + ${movies.length} movies = ${series.length + movies.length + 1} URLs`);
