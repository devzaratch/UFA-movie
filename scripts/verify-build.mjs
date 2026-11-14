// One-off verification of the exported site in out/ (UTF-8 safe).
import { readFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const OUT = 'out';

const home = readFileSync(join(OUT, 'index.html'), 'utf8');
const sitemap = readFileSync(join(OUT, 'sitemap.xml'), 'utf8');

// The homepage hides dead-link titles (see scripts/check-links.mjs).
let deadCount = 0;
try { deadCount = (await import('../src/data/dead-links.js')).DEAD_IDS.size; } catch {}

const checkHome = {
    cards: (home.match(/card-title/g) || []).length,
    hiddenCards: (home.match(/card-hide/g) || []).length,
    sliderLinks: (home.match(/top-slider/g) || []).length,
    deadLinkTitles: deadCount,
};

const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
const movieUrls = urls.filter(u => u.includes('/movie/'));

// pick: a movie (m1), a series (s1), and a random late entry (m144)
const pick = [movieUrls.find(u => u.endsWith('-m1/')), movieUrls.find(u => u.endsWith('-s1/')), movieUrls.find(u => u.endsWith('-m144/'))];

const results = pick.map(u => {
    // map URL -> disk path: decode the encodeURIComponent slugs, strip origin
    let path = u.replace(/^https?:\/\/[^/]+/, '');
    let decoded = decodeURIComponent(path);
    const file = join(OUT, decoded, 'index.html');
    let html = null;
    try { html = readFileSync(file, 'utf8'); } catch { return { url: decoded, error: 'FILE NOT FOUND' }; }

    const ld = html.match(/type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/);
    let schema = null;
    try { schema = JSON.parse(ld[1]); } catch {}

    const isSeries = (html.match(/class="ep-btn/g) || []).length > 0;
    return {
        url: decoded,
        ldType: schema && schema['@type'],
        relatedCards: (html.match(/rel-card/g) || []).length,
        epBtns: (html.match(/class="ep-btn/g) || []).length,
        playerCue: html.includes('Artplayer') || html.includes('artplayer'),
        adCue: html.includes('mog.mp4'),
        isSeries,
    };
});

console.log(JSON.stringify({ checkHome, sitemapUrls: urls.length, movieUrls: movieUrls.length, samples: results }, null, 1));
