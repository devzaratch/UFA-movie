// Build-time health snapshot for the /ops/ dashboard (plan #4 item 10).
// Imported by a server component only — the 3MB title DB never reaches the
// browser bundle. All figures come from the same generated files the site
// itself uses, so the dashboard cannot drift from what is actually published.
import { movieDatabase } from '../data/movies.js';
import { DEAD_IDS, LAST_CHECK } from '../data/dead-links.js';
import { DUPLICATE_TO_CANONICAL } from '../data/duplicates.js';
import { LOCAL_POSTERS } from '../data/posters-local.js';
import { categoryOf } from './category.js';
import { CATEGORY_LABEL } from './categories.js';
import { yearOf } from './slug.js';
import { ratingOf } from './rating.js';

export function catalogHealth(builtAt = new Date().toISOString()) {
    const live = movieDatabase.filter(
        (m) => !DEAD_IDS.has(m.id) && !DUPLICATE_TO_CANONICAL[m.id],
    );
    const deadInDb = movieDatabase.filter((m) => DEAD_IDS.has(m.id)).length;
    const dupsInDb = movieDatabase.filter((m) => DUPLICATE_TO_CANONICAL[m.id]).length;

    const categories = Object.entries(
        live.reduce((acc, m) => {
            const key = categoryOf(m);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {}),
    ).map(([key, count]) => ({ key, label: CATEGORY_LABEL[key] || key, count }))
        .sort((a, b) => b.count - a.count);

    const years = live.map((m) => yearOf(m.title)).filter((y) => Number.isFinite(y));
    const series = live.filter((m) => m.type === 'series');
    const episodes = series.reduce((n, m) => n + (m.episodes?.length || 0), 0);

    return {
        builtAt,
        lastCheck: LAST_CHECK,
        total: movieDatabase.length,
        live: live.length,
        dead: deadInDb,
        duplicates: dupsInDb,
        movies: live.length - series.length,
        series: series.length,
        episodes,
        withPoster: live.filter((m) => LOCAL_POSTERS[m.id]).length,
        withRating: live.filter((m) => ratingOf(m) > 0).length,
        yearMin: years.length ? Math.min(...years) : null,
        yearMax: years.length ? Math.max(...years) : null,
        categories,
        healthPercent: Math.round((live.length / movieDatabase.length) * 1000) / 10,
    };
}
