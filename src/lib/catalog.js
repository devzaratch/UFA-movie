// Shared catalog data.
//
// One source of truth for the homepage grid and the static /page/N/ pages:
// - entries are NEWEST first (movies.js is stored oldest → newest),
// - dead links and duplicate titles are left out (the homepage never shows them).
//
// Paging maths lives in ./paging.js (no data imports) so client components can
// import it without dragging the 3MB title DB into the browser bundle.
import { movieDatabase } from '../data/movies.js';
import { DEAD_IDS } from '../data/dead-links.js';
import { DUPLICATE_TO_CANONICAL } from '../data/duplicates.js';
import { posterFor, microPosterFor } from './posters.js';
import { categoryOf } from './category.js';
import { slugify, yearOf } from './slug.js';
import { PER_PAGE } from './paging.js';

export const catalogEntries = movieDatabase
    .filter((m) => !DEAD_IDS.has(m.id) && !DUPLICATE_TO_CANONICAL[m.id])
    .map((m) => ({
        ...m,
        slug: slugify(m.id, m.title),
        year: yearOf(m.title),
        // corrected category (see scripts/rebalance-categories.mjs)
        category: categoryOf(m),
        // locally mirrored poster when available (posterFor falls back to the
        // external url) — slider, sidebar and grid all use m.poster
        poster: posterFor(m),
        // 120px thumb for the sidebar list (36×54 on screen)
        micro: microPosterFor(m),
    }))
    .reverse();

export const totalPages = Math.max(1, Math.ceil(catalogEntries.length / PER_PAGE));

// 1-based page slice (page 1 = newest titles).
export const pageSlice = (n) => catalogEntries.slice((n - 1) * PER_PAGE, n * PER_PAGE);
