// Poster resolver (plan items #2/#6): prefer the locally mirrored copy
// (see scripts/mirror-posters.mjs) so the site no longer depends on
// hotlinked external images; fall back to the original external url
// when no local mirror exists (e.g. dead-link titles).
import { LOCAL_POSTERS } from '../data/posters-local.js';

export function posterFor(m) {
    return LOCAL_POSTERS[m.id] || m.poster;
}
