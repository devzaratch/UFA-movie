// Scored "related titles" (plan #4 item 4).
//
// The old version took the first six entries of the same category, so every
// page in a category showed the identical six films. This scores candidates
// instead and always returns a page-specific list:
//   same category            +40
//   shared title words       +12 each (max 3)  ← cross-script (Thai ⇄ Lao)
//   same release year        +10 / ±1y +6 / ±2y +3
//   same type (movie/series)  +5
//   rating within 0.5        +2
//   same quality tag          +1
// Ties break toward the newer id so results stay deterministic but varied.
//
// Dead links and duplicate titles are never suggested: with ~3,200 dead
// entries, a big slice of the catalog would otherwise link to pages that
// cannot play.
import { movieDatabase } from '../data/movies.js';
import { DEAD_IDS } from '../data/dead-links.js';
import { DUPLICATE_TO_CANONICAL } from '../data/duplicates.js';
import { categoryOf } from './category.js';
import { normalizeText, stripMarks } from './search.js';
import { slugify, yearOf } from './slug.js';

// Words that say nothing about what a film is (and would otherwise link
// everything to everything).
const STOP = new Set([
    'the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'at', 'from',
    'movie', 'film', 'series', 'part', 'vol', 'ep', 'episode', 'season', 'full', 'hd',
    'ซับไทย', 'พากย์ไทย', 'ดูหนัง', 'หนัง', 'ໜັງ', 'ເບິ່ງ', 'ພາກ', 'ຕອນ', 'ພາສາ', 'ໄທ', 'ລາວ',
]);

const tokensOf = (title) => {
    const base = normalizeText(title)
        .replace(/\(\s*\d{4}\s*\)/g, ' ')       // drop the release year
        .replace(/[^\p{L}\p{N}]+/gu, ' ');
    const out = new Set();
    for (const raw of base.split(' ')) {
        const t = stripMarks(raw);
        if (t.length < 2 || STOP.has(t) || /^\d+$/.test(t)) continue;
        out.add(t);
    }
    return out;
};

// Build the index once; every title page reuses it.
// Candidates exclude dead links + duplicates, but the metadata covers every
// entry so a dead page (which still exists, with a "can't play" note) can also
// suggest playable titles.
const pool = movieDatabase.filter((m) => !DEAD_IDS.has(m.id) && !DUPLICATE_TO_CANONICAL[m.id]);
const lookup = new Map(pool.map((x) => [x.id, x]));
const byCategory = new Map();
const byToken = new Map();
const meta = new Map();

for (const m of movieDatabase) {
    meta.set(m.id, {
        cat: categoryOf(m),
        tokens: tokensOf(m.title),
        year: yearOf(m.title),
        series: m.type === 'series',
        quality: m.quality || '',
        rating: m.rating || 0,
        n: Number(String(m.id).slice(1)) || 0,
    });
}

for (const m of pool) {
    const cat = categoryOf(m);
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat).push(m);
    for (const t of meta.get(m.id).tokens) {
        if (!byToken.has(t)) byToken.set(t, []);
        byToken.get(t).push(m.id);
    }
}

export function relatedFor(movie, limit = 12) {
    const me = meta.get(movie.id);
    if (!me) return [];

    // Candidates: the category + anything sharing a title word (any category).
    const cands = new Set((byCategory.get(me.cat) || []).map((x) => x.id));
    for (const t of me.tokens) for (const id of byToken.get(t) || []) cands.add(id);
    cands.delete(movie.id);

    const scored = [];
    for (const id of cands) {
        const x = lookup.get(id);
        if (!x) continue;
        const it = meta.get(id);
        let shared = 0;
        for (const t of me.tokens) if (it.tokens.has(t)) shared++;
        let score = 0;
        if (it.cat === me.cat) score += 40;
        score += Math.min(shared, 3) * 12;
        if (me.year && it.year) {
            const d = Math.abs(me.year - it.year);
            score += d === 0 ? 10 : d === 1 ? 6 : d === 2 ? 3 : 0;
        }
        if (it.series === me.series) score += 5;
        if (me.rating && it.rating && Math.abs(me.rating - it.rating) <= 0.5) score += 2;
        if (me.quality && it.quality === me.quality) score += 1;
        scored.push({ x, score, n: it.n });
    }
    scored.sort((a, b) => b.score - a.score || b.n - a.n);

    return scored.slice(0, limit).map(({ x }) => ({ ...x, slug: slugify(x.id, x.title) }));
}
