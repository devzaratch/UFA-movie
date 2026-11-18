// Data validator (plan item #2): catches mistakes in the 3MB movies.js before
// they reach Vercel. Errors exit 1 (blocking); warnings only report.
// Usage: node scripts/validate-data.mjs [--strict]   (--strict fails on warnings)
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { normalizeText, stripMarks } from '../src/lib/search.js';

const strict = process.argv.includes('--strict');
const CATS = new Set(['action', 'horror', 'anime', 'serie', 'drama']);

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const { movieDatabase } = await import(pathToFileURL(join(ROOT, 'src', 'data', 'movies.js')).href);

const errors = [];
const warnings = [];
const ids = new Map();

for (const m of movieDatabase) {
    const where = m.id || '(no id)';

    if (!/^[ms]\d+$/.test(where)) errors.push(`${where}: id must be m<n> or s<n>`);
    if (ids.has(where)) errors.push(`${where}: duplicate id (also used by another entry)`);
    ids.set(where, true);

    if (!CATS.has(m.category)) errors.push(`${where}: category "${m.category}" not in ${[...CATS].join('|')}`);
    if (!m.title) errors.push(`${where}: missing title`);
    else if (!/\(\d{4}\)/.test(m.title)) warnings.push(`${where}: title has no "(YYYY)" — invisible to ?year= filters`);
    if (!m.poster) warnings.push(`${where}: missing poster`);

    if (m.type === 'series') {
        if (!Array.isArray(m.episodes) || m.episodes.length === 0) {
            errors.push(`${where}: series with empty episodes (would play nothing)`);
        } else {
            m.episodes.forEach((ep, i) => {
                if (!ep || !ep.url) errors.push(`${where}: episode ${i + 1} has no url`);
                else if (!/^https?:\/\//.test(ep.url)) errors.push(`${where}: episode ${i + 1} url is not http(s)`);
            });
        }
    } else {
        if (!m.url) errors.push(`${where}: movie has no stream url`);
        else if (!/^https?:\/\//.test(m.url)) errors.push(`${where}: url is not http(s)`);
    }

    if (m.rating !== undefined && m.rating !== null) {
        const r = Number(m.rating);
        if (!Number.isFinite(r) || r < 0 || r > 10) warnings.push(`${where}: rating "${m.rating}" outside 0-10`);
    }
}

// Duplicate titles (same normalized title) — warnings, dedupe handles them.
const groups = new Map();
for (const m of movieDatabase) {
    const key = stripMarks(normalizeText(m.title || ''));
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m.id);
}
const dupes = [...groups.values()].filter((g) => g.length > 1);
if (dupes.length) {
    warnings.push(`${dupes.length} duplicate title groups (e.g. ${dupes.slice(0, 3).map((g) => g.join('=')).join(', ')}) — see src/data/duplicates.js`);
}

console.log(`entries: ${movieDatabase.length}`);
console.log(`errors: ${errors.length}, warnings: ${warnings.length}`);
for (const e of errors.slice(0, 40)) console.log('  ERROR ' + e);
for (const w of warnings.slice(0, 25)) console.log('  warn  ' + w);
if (errors.length) process.exit(1);
if (strict && warnings.length) process.exit(1);
