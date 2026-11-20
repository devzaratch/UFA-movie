// Auto-generated sitemap.xml (replaces the old @astrojs/sitemap integration and the
// generate-sitemap.mjs script). Build-time only; never hand-edit the output.
// The base URL must match the Sitemap line in public/robots.txt — update both together.
//
// What is listed here decides what Google spends its crawl budget on:
// - duplicate titles are excluded (their canonical points at the main entry), and
// - dead links are excluded too (see scripts/check-links.mjs → DEAD_IDS). Those
//   pages stay online as a landing page with a "stream is down" notice and are
//   served with noindex, so they must not be advertised in the sitemap.
// Both files change when the daily link check runs, so this list heals itself.
import { movieDatabase } from '../data/movies.js';
import { DUPLICATE_TO_CANONICAL } from '../data/duplicates.js';
import { DEAD_IDS } from '../data/dead-links.js';
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
        ...movieDatabase
            .filter((m) => !DUPLICATE_TO_CANONICAL[m.id] && !DEAD_IDS.has(m.id))
            .map((m) => ({
                url: `${SITE}/movie/${slugify(m.id, m.title)}/`,
                lastModified: new Date(),
                changeFrequency: m.type === 'series' ? 'weekly' : 'monthly',
                priority: m.type === 'series' ? 0.9 : 0.8,
            })),
    ];
}
