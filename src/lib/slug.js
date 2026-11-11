// Build a unique, stable URL slug for a movie/series entry.
// The id suffix guarantees uniqueness even for similar titles.
// The base is capped at 150 UTF-8 bytes: Thai/Lao letters cost 3 bytes each and
// long titles otherwise exceed the 255-byte filename limit on Linux (Vercel
// prerenders <slug>.rsc files), which crashes the build with ENAMETOOLONG.
const MAX_SLUG_BYTES = 150;

function byteSafeTruncate(text, maxBytes) {
    const bytes = Buffer.byteLength(text, 'utf8');
    if (bytes <= maxBytes) return text;
    let out = '';
    let used = 0;
    for (const ch of text) {                 // iterate by code points, never split a char
        const size = Buffer.byteLength(ch, 'utf8');
        if (used + size > maxBytes) break;
        out += ch;
        used += size;
    }
    return out;
}

export function slugify(id, title) {
    const full = title
        .replace(/\([^)]*\)/g, ' ')                  // drop parenthesized parts (year, subtitle)
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')       // keep letters + Thai/Lao marks (vowels, tones) + numbers; other runs -> dash
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    const base = byteSafeTruncate(full, MAX_SLUG_BYTES).replace(/-+$/g, '');
    return `${base || 'movie'}-${id}`;
}

// Release year parsed from the title (entries have no year field).
export function yearOf(title) {
    const match = title.match(/\((20\d{2}|19\d{2})\)/);
    return match ? match[1] : null;
}
