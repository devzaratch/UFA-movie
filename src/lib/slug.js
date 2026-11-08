// Build a unique, stable URL slug for a movie/series entry.
// The id suffix guarantees uniqueness even for similar titles.
export function slugify(id, title) {
    const base = title
        .replace(/\([^)]*\)/g, ' ')                  // drop parenthesized parts (year, subtitle)
        .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')       // keep letters + Thai/Lao marks (vowels, tones) + numbers; other runs -> dash
        .replace(/^-+|-+$/g, '')
        .toLowerCase();
    return `${base || 'movie'}-${id}`;
}

// Release year parsed from the title (entries have no year field).
export function yearOf(title) {
    const match = title.match(/\((20\d{2}|19\d{2})\)/);
    return match ? match[1] : null;
}
