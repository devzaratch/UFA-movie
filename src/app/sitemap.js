// Auto-generated sitemap.xml (replaces the old @astrojs/sitemap integration and the
// generate-sitemap.mjs script). Build-time only; never hand-edit the output.
// The base URL must match the Sitemap line in public/robots.txt — update both together.
import { movieDatabase } from '../data/movies.js';
import { slugify } from '../lib/slug.js';

export const SITE = 'https://doonung-movie.pages.dev';

// Required for `output: 'export'`
export const dynamic = 'force-static';

export default function sitemap() {
    return [
        {
            url: `${SITE}/`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 1.0,
        },
        ...movieDatabase.map((m) => ({
            url: `${SITE}/movie/${slugify(m.id, m.title)}/`,
            lastModified: new Date(),
            changeFrequency: m.type === 'series' ? 'weekly' : 'monthly',
            priority: m.type === 'series' ? 0.9 : 0.8,
        })),
    ];
}
