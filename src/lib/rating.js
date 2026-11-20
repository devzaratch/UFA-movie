// Rating lookup: the entry's own value first, then the TMDB-enriched map
// (scripts/enrich-ratings.mjs → data/ratings.js). Returns 0 when neither has a
// score, which is what the UI treats as "show the category instead".
import { RATINGS } from '../data/ratings.js';

export function ratingOf(movie) {
    if (!movie) return 0;
    const own = Number(movie.rating);
    if (Number.isFinite(own) && own > 0) return own;
    const enriched = Number(RATINGS[movie.id]);
    return Number.isFinite(enriched) && enriched > 0 ? enriched : 0;
}

// "IMDb: 6.4" style label used on the card bar, or '' when there is no score.
export function ratingLabel(movie) {
    const r = ratingOf(movie);
    return r ? `ເບິ່ງໜັງອອນໄລນ໌ IMDb: ${r.toFixed(1)}` : '';
}
