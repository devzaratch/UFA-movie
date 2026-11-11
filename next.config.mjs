/** @type {import('next').NextConfig} */
import { movieDatabase } from './src/data/movies.js';
import { slugify } from './src/lib/slug.js';

// Preserve the old play.html?id=<id> URLs (still indexed by search engines):
// one 301 per entry, matched on the ?id= query. Vercel serves these rules even
// with a fully static export.
const playRedirects = movieDatabase.map((m) => ({
    source: '/play.html',
    has: [{ type: 'query', key: 'id', value: m.id }],
    destination: `/movie/${slugify(m.id, m.title)}/`,
    permanent: true,
}));

const nextConfig = {
    // Fully static export: every route becomes a real index.html in out/
    // Deploy target: Vercel (auto-detects Next.js)
    output: 'export',
    trailingSlash: true,      // keep /movie/<slug>/ style URLs like before
    images: { unoptimized: true }, // posters are hotlinked externals; no server needed
    redirects: playRedirects,
};

export default nextConfig;
