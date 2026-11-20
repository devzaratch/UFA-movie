// Enrich titles with a TMDB score (plan #4 item 6).
//
// The dataset has no ratings at all (0 of ~5,000), so cards show only the
// category. This script asks TMDB for each *playable* title and writes
// src/data/ratings.js: { entryId: 7.4, … }. The site reads it through
// src/lib/rating.js, falling back to the category label when a title has no
// score — so running this is optional and an empty file is a valid state.
//
// Credential (either one works, from the environment or .env.local / .env):
//   TMDB_READ_TOKEN=eyJhbGciOi…      (v4 read access token, preferred)
//   TMDB_API_KEY=0123456789abcdef…   (v3 api key)
// Get one free at https://www.themoviedb.org/settings/api
//
// Usage:
//   npm run ratings                 # fill every playable title that has no score
//   npm run ratings -- --force      # re-check everything
//   npm run ratings -- --limit 50   # quick test run
//   npm run ratings -- --dry        # print matches, write nothing
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { normalizeText, stripMarks } from '../src/lib/search.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(ROOT, 'src', 'data', 'ratings.js');

const args = process.argv.slice(2);
const DRY = args.includes('--dry');
const FORCE = args.includes('--force');
const limitArg = args.indexOf('--limit');
const LIMIT = limitArg >= 0 ? Number(args[limitArg + 1]) || 0 : 0;

// ── credential ───────────────────────────────────────────────────────────────
const fromEnvFile = (name) => {
    for (const file of ['.env.local', '.env']) {
        const p = join(ROOT, file);
        if (!existsSync(p)) continue;
        const line = readFileSync(p, 'utf8')
            .split(/\r?\n/)
            .find((l) => l.trim().startsWith(`${name}=`));
        if (line) return line.slice(line.indexOf('=') + 1).trim().replace(/^["']|["']$/g, '');
    }
    return '';
};
const TOKEN = process.env.TMDB_READ_TOKEN || fromEnvFile('TMDB_READ_TOKEN');
const KEY = process.env.TMDB_API_KEY || fromEnvFile('TMDB_API_KEY');

const { movieDatabase } = await import(pathToFileURL(join(ROOT, 'src', 'data', 'movies.js')).href);
const { DEAD_IDS } = await import(pathToFileURL(join(ROOT, 'src', 'data', 'dead-links.js')).href);
const { DUPLICATE_TO_CANONICAL } = await import(pathToFileURL(join(ROOT, 'src', 'data', 'duplicates.js')).href);
const existing = existsSync(OUT_FILE)
    ? (await import(pathToFileURL(OUT_FILE).href)).RATINGS || {}
    : {};

// ── title helpers ────────────────────────────────────────────────────────────
const YEAR = /\(\s*(\d{4})\s*\)/;
const NATIVE = /[\u0E00-\u0E7F\u0E80-\u0EFF]/;
const yearOfTitle = (t) => (t.match(YEAR) || [])[1] || '';
const latinPart = (t) => t.replace(YEAR, ' ').split(NATIVE)[0].replace(/\s+/g, ' ').trim();
const nativePart = (t) => {
    const m = t.replace(YEAR, ' ').match(/[\u0E00-\u0E7F\u0E80-\u0EFF][\u0E00-\u0E7F\u0E80-\u0EFF\s\d.':!-]*/);
    return m ? m[0].replace(/\s+/g, ' ').trim() : '';
};
const norm = (s) => stripMarks(normalizeText(s)).replace(/[^\p{L}\p{N} ]/gu, ' ').replace(/\s+/g, ' ').trim();
const similarity = (a, b) => {
    const x = norm(a);
    const y = norm(b);
    if (!x || !y) return 0;
    if (x === y) return 1;
    const X = new Set(x.split(' '));
    const Y = new Set(y.split(' '));
    let hit = 0;
    for (const t of X) if (Y.has(t)) hit++;
    return hit / Math.max(X.size, Y.size);
};

// ── TMDB client (2 req/s-ish, retries on 429/5xx) ────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (path, params) => {
    const qs = new URLSearchParams({ language: 'th-TH', ...params });
    const headers = { accept: 'application/json' };
    if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;
    else qs.set('api_key', KEY);
    for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch(`https://api.themoviedb.org/3${path}?${qs}`, { headers });
        if (res.status === 429 || res.status >= 500) {
            await sleep(1200 * (attempt + 1));
            continue;
        }
        if (!res.ok) return null;
        return res.json();
    }
    return null;
};

// Best candidate: same year + a title that actually matches + enough votes.
const pickBest = (results, title) => {
    const year = yearOfTitle(title);
    let best = null;
    for (const r of results || []) {
        if (!r.vote_average || (r.vote_count || 0) < 5) continue;
        const yearHit = year && (r.release_date || r.first_air_date || '').startsWith(year);
        const simLatin = Math.max(similarity(latinPart(title), r.title || ''), similarity(latinPart(title), r.original_title || ''));
        const simNative = Math.max(
            similarity(nativePart(title), r.title || ''),
            similarity(nativePart(title), r.original_title || ''),
        );
        const sim = Math.max(simLatin, simNative);
        if (sim < 0.5) continue;
        const score = sim * 40 + (yearHit ? 40 : 0) + Math.min(20, Math.log10(1 + (r.vote_count || 0)) * 6);
        if (!best || score > best.score) best = { score, rating: r.vote_average, votes: r.vote_count, name: r.title || r.original_title, year: (r.release_date || r.first_air_date || '').slice(0, 4) };
    }
    return best;
};

const search = async (title, type) => {
    const path = type === 'series' ? '/search/tv' : '/search/movie';
    const year = yearOfTitle(title);
    const tryQuery = async (query, withYear) => {
        if (!query) return null;
        const params = { query };
        if (withYear && year) params[path === '/search/tv' ? 'first_air_date_year' : 'year'] = year;
        const data = await api(path, params);
        return data && data.results;
    };
    let results = await tryQuery(latinPart(title), true);
    let best = pickBest(results, title);
    if (!best) { results = await tryQuery(latinPart(title), false); best = pickBest(results, title); }
    if (!best && nativePart(title)) { results = await tryQuery(nativePart(title), false); best = pickBest(results, title); }
    return best;
};

// ── self test (no credential needed): npm run ratings -- --selftest ──────────
if (args.includes('--selftest')) {
    const t = 'Scream 7 (2026) หวีดสุดขีด 7';
    const good = pickBest([
        { title: 'Scream 7', original_title: 'Scream 7', release_date: '2026-02-27', vote_average: 6.4, vote_count: 812 },
        { title: 'Scream', original_title: 'Scream', release_date: '1996-12-20', vote_average: 7.4, vote_count: 8000 },
    ], t);
    const noisy = pickBest([{ title: 'Totally Unrelated', release_date: '2026-01-01', vote_average: 9, vote_count: 900 }], t);
    const checks = [
        ['picks the same-year sequel', good && Math.abs(good.rating - 6.4) < 0.01],
        ['ignores unrelated titles', noisy === null],
        ['similarity is exact for equal titles', similarity('Scream 7', 'Scream 7') === 1],
        ['similarity separates sequels', similarity('Scream 7', 'Scream 6') < 0.9],
        ['latin part strips the year', latinPart(t) === 'Scream 7'],
    ];
    for (const [name, ok] of checks) console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
    process.exit(checks.every(([, ok]) => ok) ? 0 : 1);
}

if (!TOKEN && !KEY) {
    console.error(
        'No TMDB credential found.\n'
        + 'Set TMDB_READ_TOKEN (or TMDB_API_KEY) in the environment or in .env.local, then run again.\n'
        + 'Free key: https://www.themoviedb.org/settings/api\n'
        + 'Nothing was changed — the site keeps using the category label as it does today.',
    );
    process.exit(2);
}

// ── run ──────────────────────────────────────────────────────────────────────
const targets = movieDatabase.filter(
    (m) => !DEAD_IDS.has(m.id) && !DUPLICATE_TO_CANONICAL[m.id] && (FORCE || !existing[m.id]),
);
const queue = LIMIT ? targets.slice(0, LIMIT) : targets;
console.log(`titles to check: ${queue.length} (of ${targets.length} pending, ${Object.keys(existing).length} already scored)`);

const ratings = { ...existing };
let hit = 0;
let miss = 0;
const CONCURRENCY = 6;
let cursor = 0;
const worker = async () => {
    while (cursor < queue.length) {
        const m = queue[cursor++];
        const best = await search(m.title, m.type === 'series' ? 'series' : 'movie');
        if (best) {
            ratings[m.id] = Math.round(best.rating * 10) / 10;
            hit++;
            if (hit <= 15 || hit % 100 === 0) console.log(`  ✓ ${m.id} ${m.title} → ${ratings[m.id]} (${best.name} ${best.year}, ${best.votes} votes)`);
        } else {
            miss++;
        }
    }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const sorted = Object.fromEntries(Object.entries(ratings).sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true })));
const body = Object.entries(sorted).map(([id, r]) => `    '${id}': ${r},`).join('\n');

if (DRY) {
    console.log(`\n[dry] matched ${hit}, missed ${miss} — nothing written.`);
} else {
    writeFileSync(
        OUT_FILE,
        '// AUTO-GENERATED by scripts/enrich-ratings.mjs — do not edit by hand.\n'
        + '// IMDb-style score from TMDB (vote_average) keyed by BOENGNANG entry id.\n'
        + '//\n'
        + '// Re-run with `npm run ratings` after adding titles. A title without a\n'
        + '// score falls back to its category label in the UI, so this file may be\n'
        + '// partial.\n'
        + `// Last run: ${new Date().toISOString()} — ${Object.keys(sorted).length} titles\n`
        + `export const RATINGS = {\n${body}\n};\n`,
        'utf8',
    );
    console.log(`\nwrote ${Object.keys(sorted).length} ratings to src/data/ratings.js (matched ${hit}, missed ${miss})`);
    console.log('next: npm run build');
}
