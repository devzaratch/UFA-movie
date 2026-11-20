// Paging helpers with no data imports — safe for client components.
// (lib/catalog.js holds the entries and would drag the 3MB title DB into the
// browser bundle if a client component imported it.)

export const PER_PAGE = 24;

// Windowed pagination (1 … 4 5 6 … 210): never render one button per page.
export function pageItems(cur, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const wanted = new Set([1, 2, cur - 1, cur, cur + 1, total - 1, total].filter((p) => p >= 1 && p <= total));
    const out = [];
    let prev = 0;
    for (const p of [...wanted].sort((a, b) => a - b)) {
        if (p - prev > 1) out.push('…');
        out.push(p);
        prev = p;
    }
    return out;
}

// Static URL of a catalog page: 1 → "/", 3 → "/page/3/".
export const pageHref = (n) => (n <= 1 ? '/' : `/page/${n}/`);
