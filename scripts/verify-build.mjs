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

// Sample pages are picked from the data (not the sitemap): dead links are
// deliberately absent from the sitemap but their pages still exist on disk.
const SITE = 'https://boengnang.vercel.app';
const { movieDatabase } = await import('../src/data/movies.js');
const { slugify } = await import('../src/lib/slug.js');
const { DUPLICATE_TO_CANONICAL } = await import('../src/data/duplicates.js');
const { DEAD_IDS } = await import('../src/data/dead-links.js');
const sampleOf = (pred) => {
    const m = movieDatabase.find(pred);
    return m ? `${SITE}/movie/${slugify(m.id, m.title)}/` : null;
};
const pick = [
    sampleOf((m) => !DEAD_IDS.has(m.id)),                                  // a live movie
    sampleOf((m) => m.type === 'series' && !DEAD_IDS.has(m.id)),           // a live series
    sampleOf((m) => m.id === 'm144'),                                      // a late entry (may be dead)
];

const results = pick.filter(Boolean).map(u => {
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

// ── Feature checks (plan items 1-10) ─────────────────────────────────────────
const readPage = (p) => {
    try { return readFileSync(join(OUT, p), 'utf8'); } catch { return ''; }
};
const ldGraph = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
    .map((m) => { try { return JSON.parse(m[1]); } catch { return null; } })
    .filter(Boolean);

const homeHtml = readPage('index.html');
const notFound = readPage('404.html');

// VideoObject only exists on live titles; homepage cards are alive-only, so
// read a few of those card links and look for the VideoObject node.
let videoObjectOnLiveTitle = false;
const cardLinks = [...homeHtml.matchAll(/class="card[^"]*"\s+href="([^"]+)"/g)].map((m) => m[1]).slice(0, 20);
for (const href of cardLinks) {
    const p = decodeURIComponent(href.replace(/^\/|\/$/g, ''));
    if (ldGraph(readPage(join(p, 'index.html'))).some((x) => x['@type'] === 'VideoObject')) {
        videoObjectOnLiveTitle = true;
        break;
    }
}

// ── Dead-link hygiene (plan #4 item 1) ───────────────────────────────────────
const idOfUrl = (u) => {
    const m = decodeURIComponent(u).match(/-([ms]\d+)\/$/);
    return m ? m[1] : null;
};
const sitemapDeadCount = movieUrls.filter((u) => DEAD_IDS.has(idOfUrl(u))).length;
const expectedLive = movieDatabase.filter((m) => !DUPLICATE_TO_CANONICAL[m.id] && !DEAD_IDS.has(m.id)).length;
const deadSample = movieDatabase.find((m) => DEAD_IDS.has(m.id));
const deadPage = deadSample ? readPage(join('movie', slugify(deadSample.id, deadSample.title), 'index.html')) : '';
const liveSample = movieDatabase.find((m) => !DEAD_IDS.has(m.id));
const livePage = liveSample ? readPage(join('movie', slugify(liveSample.id, liveSample.title), 'index.html')) : '';

// ── Catalog ordering / static pagination (plan #4 item 2) ────────────────────
const { PER_PAGE } = await import('../src/lib/paging.js');
const expectedPages = Math.ceil(expectedLive / PER_PAGE);
const pageDirs = (() => { try { return readdirSync(join(OUT, 'page')).length; } catch { return 0; } })();
const homeCardHrefs = [...homeHtml.matchAll(/class="card[^"]*"\s+href="([^"]+)"/g)].map((m) => m[1]);
const newestTitle = movieDatabase.filter((m) => !DEAD_IDS.has(m.id) && !DUPLICATE_TO_CANONICAL[m.id]).at(-1);
const newestSlug = newestTitle ? `/movie/${slugify(newestTitle.id, newestTitle.title)}/` : null;
const pageTwo = readPage(join('page', '2', 'index.html'));

const features = {
    // item #1 search: bundle contains the cross-script matcher and ?q= support
    searchQParam: homeHtml.includes('search_used') || homeHtml.includes('q='),
    // item #4 categories rebalanced (override file applied)
    categoryOverrides: homeHtml.includes('category-overrides') || homeHtml.includes('data-cat="horror"'),
    // item #5 duplicates excluded from sitemap + homepage
    duplicatePagesExcluded: !movieUrls.some((u) => u.endsWith('-m900/')),
    // item #6 random button + 404 recommendations
    randomButton: homeHtml.includes('random-btn'),
    notFoundSuggestions: (notFound.match(/class="rel-card"/g) || []).length,
    // item #3 structured data
    websiteSearchAction: ldGraph(homeHtml).some((x) => x['@type'] === 'WebSite'),
    videoObjectOnLiveTitle,
    // item #10
    privacyPage: readPage('privacy/index.html').length > 0,
    contactPage: readPage('contact/index.html').length > 0,
    adsTxt: readPage('ads.txt').length > 0,
    // item #2 local posters
    localPostersOnHome: (homeHtml.match(/\/posters\//g) || []).length,
    // plan #4 item 1: dead links out of the sitemap, pages noindexed, robots.txt valid
    deadExcludedFromSitemap: sitemapDeadCount === 0,
    sitemapMatchesLiveTitles: movieUrls.length === expectedLive,
    deadPageNoindex: /name="robots"[^>]*content="noindex/i.test(deadPage),
    livePageIndexable: !/name="robots"[^>]*content="noindex/i.test(livePage),
    robotsTxtSitemapSpacing: readPage('robots.txt').includes('Sitemap: http'),
    // plan #4 item 2: newest-first catalog + real /page/N/ pages
    newestFirstOnHome: !!newestSlug && homeCardHrefs[0] === newestSlug,
    homepagePagerIsLinks: homeHtml.includes('href="/page/2/"'),
    staticPageCount: pageDirs === Math.max(0, expectedPages - 1),
    pageTwoHasCards: (pageTwo.match(/class="card/g) || []).length >= PER_PAGE,
    pageTwoRelLinks: /rel="prev" href="\/"/.test(pageTwo) && /rel="next" href="\/page\/3\/"/.test(pageTwo),
    sitemapHasPages: movieUrls.length === expectedLive && urls.filter((u) => u.includes('/page/')).length === Math.max(0, expectedPages - 1),
};

console.log(JSON.stringify({ checkHome, sitemapUrls: urls.length, movieUrls: movieUrls.length, samples: results, features }, null, 1));
