// Auto-generated sitemap.xml (replaces the old @astrojs/sitemap integration and the
// generate-sitemap.mjs script). Build-time only; never hand-edit the output.
// The base URL must match the Sitemap line in public/robots.txt — update both together.
import { movieDatabase } from '../data/movies.js';
import { DUPLICATE_TO_CANONICAL } from '../data/duplicates.js';
import { slugify } from '../lib/slug.js';

export const SITE = 'https://boengnang.vercel.app';

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
        {
            url: `${SITE}/privacy/`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        {
            url: `${SITE}/contact/`,
            lastModified: new Date(),
            changeFrequency: 'yearly',
            priority: 0.3,
        },
        ...movieDatabase.filter((m) => !DUPLICATE_TO_CANONICAL[m.id]).map((m) => ({
            url: `${SITE}/movie/${slugify(m.id, m.title)}/`,
            lastModified: new Date(),
            changeFrequency: m.type === 'series' ? 'weekly' : 'monthly',
            priority: m.type === 'series' ? 0.9 : 0.8,
        })),
    ];
}
