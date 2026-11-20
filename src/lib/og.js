// Open-graph image resolver (plan #4 item 5).
//
// Social cards want 1200×630; the mirrored posters are portrait-sized, so
// scripts/og-images.mjs crops every locally mirrored poster into a landscape
// card at public/og/<id>.jpg during npm run build. Titles without a local
// poster use the branded default card instead. Both are gitignored: the
// generator is the single source of truth for which /og/<id>.jpg files exist,
// so this resolver must use the same LOCAL_POSTERS map as the generator.
import { LOCAL_POSTERS } from '../data/posters-local.js';

export const OG_DEFAULT = '/og/default.jpg';
export const OG_SIZE = { w: 1200, h: 630 };

export function ogFor(movie) {
    if (!movie) return OG_DEFAULT;
    return LOCAL_POSTERS[movie.id] ? `/og/${movie.id}.jpg` : OG_DEFAULT;
}
