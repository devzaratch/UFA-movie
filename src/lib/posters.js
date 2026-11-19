// Poster resolver (plan items #2/#6): prefer the locally mirrored copy
// (see scripts/mirror-posters.mjs) so the site no longer depends on
// hotlinked external images; fall back to the original external url
// when no local mirror exists (e.g. dead-link titles).
import { LOCAL_POSTERS } from '../data/posters-local.js';
import { LOCAL_THUMBS } from '../data/thumbs-local.js';

export function posterFor(m) {
    return LOCAL_POSTERS[m.id] || m.poster;
}

// 120px thumbnail for the small sidebar lists (36×54 on screen) — plan item #8.
export function microPosterFor(m) {
    return LOCAL_THUMBS[m.id] || posterFor(m);
}
