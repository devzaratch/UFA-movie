// Runs after `next build`: writes out/play.html, a tiny static page that
// redirects the legacy /play.html?id=<id> URLs to /movie/<slug>/.
// A JS lookup page is used instead of per-entry config redirects because
// Vercel caps routes (rewrites/redirects) at 2048 and the catalog is bigger.
// Google follows JavaScript redirects for indexing, so the legacy URLs stay
// discoverable through sitemap-less but still-linked entry points.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const { movieDatabase } = await import('../src/data/movies.js');
const { slugify } = await import('../src/lib/slug.js');

const map = {};
for (const m of movieDatabase) map[m.id] = `/movie/${slugify(m.id, m.title)}/`;

const html = `<!DOCTYPE html>
<html lang="lo"><head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>BOENGNANG</title>
<script>
// Legacy /play.html?id=<id> -> /movie/<slug>/ redirect table (generated at build time).
var MAP=${JSON.stringify(map)};
(function () {
    try {
        var id = new URLSearchParams(window.location.search).get('id') || '';
        var dest = MAP[id] || MAP[decodeURIComponent(id)] || '';
        if (dest) { window.location.replace(dest); return; }
    } catch (e) {}
    window.location.replace('/');
})();
</script>
<noscript><meta http-equiv="refresh" content="0;url=/"><a href="/">BOENGNANG</a></noscript>
</head><body></body></html>
`;

writeFileSync(join('out', 'play.html'), html, 'utf8');
console.log('play.html written: ' + Object.keys(map).length + ' id mappings');
