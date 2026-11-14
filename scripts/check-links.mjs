// Link health checker for the whole catalog.
// Checks every stream URL and writes the result to two places:
//   1. src/data/dead-links.js          — ids whose stream(s) are all dead
//                                        (the homepage hides these cards)
//   2. scripts/link-health-report.json — per-host summary for humans
//
// Rules discovered so far:
//   - vdohls.com (and vhNNN.xyz shards) only answer when the Referer is
//     one of their partner sites, so checks go through the stream proxy
//     Worker (same one the player uses).
//   - master.streamhls.com / steamhls88.com challenge any cross-site
//     Referer but answer a plain no-referer request.
//   - A stream is "alive" only if it answers 200 with a non-empty m3u8
//     playlist body.
//
// Usage:
//   node scripts/check-links.mjs            # incremental (uses cache)
//   node scripts/check-links.mjs --fresh    # re-check everything
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE_FILE = join(ROOT, 'scripts', '.link-health-cache.json');
const REPORT_FILE = join(ROOT, 'scripts', 'link-health-report.json');
const DEAD_FILE = join(ROOT, 'src', 'data', 'dead-links.js');

const STREAM_PROXY = 'https://boengnang-stream.phonthebtilavun25599.workers.dev/stream/';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const CONCURRENCY = 24;
const TIMEOUT_MS = 20000;

const fresh = process.argv.includes('--fresh');

const { movieDatabase } = await import(pathToFileURL(join(ROOT, 'src', 'data', 'movies.js')).href);

const cache = existsSync(CACHE_FILE) && !fresh ? JSON.parse(readFileSync(CACHE_FILE, 'utf8')) : {};
const now = Date.now();
const ALIVE_TTL = 3 * 24 * 3600 * 1000;   // trust "alive" for 3 days
const DEAD_TTL = 12 * 3600 * 1000;        // re-check dead twice a day at most

function proxiable(u) {
    try {
        const h = new URL(u).hostname;
        return h.endsWith('vdohls.com') || /^vh\d+\.xyz$/.test(h);
    } catch { return false; }
}

async function checkUrl(url) {
    const target = proxiable(url) ? STREAM_PROXY + '?u=' + encodeURIComponent(url) : url;
    const headers = { 'User-Agent': UA, Accept: '*/*' };
    for (let attempt = 1; attempt <= 2; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
        try {
            const res = await fetch(target, { headers, signal: ctrl.signal, redirect: 'follow' });
            clearTimeout(timer);
            if (res.status === 429) { await new Promise(r => setTimeout(r, 3000)); continue; }
            if (!res.ok) return { alive: false, status: res.status };
            const body = await res.text();
            if (!body.trim()) return { alive: false, status: 200, note: 'empty body' };
            const alive = body.includes('#EXTM3U') || (res.headers.get('content-type') || '').toLowerCase().includes('mpegurl');
            return { alive, status: 200 };
        } catch (e) {
            clearTimeout(timer);
            if (attempt === 2) return { alive: false, status: 0, note: String(e).slice(0, 60) };
            await new Promise(r => setTimeout(r, 1500));
        }
    }
    return { alive: false, status: 0, note: 'unreachable' };
}

// Every unique URL we need an answer for.
const urls = new Set();
const titleChecks = [];   // { id, urls }
for (const m of movieDatabase) {
    const list = m.type === 'series'
        ? (m.episodes || []).map(e => e.url).filter(Boolean)
        : [m.url].filter(Boolean);
    if (!list.length) continue;               // nothing to play → leave to the player's runtime fallback
    for (const u of list) urls.add(u);
    titleChecks.push({ id: m.id, urls: list });
}

// Work out cached answers and what still needs fetching.
const need = [...urls].filter(u => {
    const c = cache[u];
    if (!c) return true;
    return now - c.t > (c.alive ? ALIVE_TTL : DEAD_TTL);
});

console.log(`titles: ${titleChecks.length}, unique urls: ${urls.size}, to check now: ${need.length}`);

let done = 0;
const pool = [];
async function worker() {
    while (need.length) {
        const u = need.pop();
        const r = await checkUrl(u);
        cache[u] = { alive: r.alive, status: r.status, t: now };
        done++;
        if (done % 500 === 0) {
            writeFileSync(CACHE_FILE, JSON.stringify(cache));
            console.log(`progress: ${done}/${need.length + done} checked`);
        }
    }
}
for (let i = 0; i < CONCURRENCY; i++) pool.push(worker());
await Promise.all(pool);

// Determine dead titles: a title is dead when every one of its stream urls is dead.
const deadIds = [];
const aliveIds = [];
const perTitle = [];
for (const t of titleChecks) {
    const deadAll = t.urls.every(u => cache[u] && cache[u].alive === false);
    (deadAll ? deadIds : aliveIds).push(t.id);
    perTitle.push({ id: t.id, dead: deadAll, urls: t.urls.length });
}

const hosts = {};
for (const u of urls) {
    let host;
    try { host = new URL(u).hostname; } catch { host = '?'; }
    hosts[host] = hosts[host] || { total: 0, alive: 0 };
    hosts[host].total++;
    if (cache[u]?.alive) hosts[host].alive++;
}

writeFileSync(CACHE_FILE, JSON.stringify(cache));
writeFileSync(REPORT_FILE, JSON.stringify({ checkedAt: new Date().toISOString(), titles: titleChecks.length, deadTitles: deadIds.length, hosts }, null, 1));

const body = '// AUTO-GENERATED by scripts/check-links.mjs — do not edit by hand.\n'
    + '// Ids whose every stream url answered dead (file gone / empty playlist).\n'
    + '// The homepage hides these cards; the per-title pages still exist.\n'
    + `// Last check: ${new Date().toISOString()}\n`
    + `export const DEAD_IDS = new Set(${JSON.stringify(deadIds)});\n`;
writeFileSync(DEAD_FILE, body);

console.log(`\ndone: ${aliveIds.length} alive titles, ${deadIds.length} dead titles`);
console.log(JSON.stringify(hosts, null, 1));
