'use client';

// Interactive part of the catalog: hides/shows the statically rendered cards.
// All cards stay in the prerendered HTML (SEO); this component only toggles visibility.
// Filters: reads ?cat= / ?year= once on mount (nav/footer links are plain <a>,
// so landing here always does a full load), listens to dm:search from the header box.
import { useEffect, useState } from 'react';
import { CATEGORY_LABEL } from '../lib/categories.js';

const PER_PAGE = 18;

export default function HomeGrid({ entries }) {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('all');
    const [year, setYear] = useState('');
    const [page, setPage] = useState(1);

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const urlCat = sp.get('cat');
        const urlYear = sp.get('year');
        if (urlCat) setCat(urlCat);
        if (urlYear) setYear(urlYear);

        const onSearch = (e) => { setQ(e.detail || ''); setPage(1); };
        window.addEventListener('dm:search', onSearch);
        return () => window.removeEventListener('dm:search', onSearch);
    }, []);

    const filtered = entries.filter((m) =>
        (cat === 'all' || m.category === cat) &&
        (!year || m.year === year) &&
        (!q || m.title.toLowerCase().includes(q))
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const cur = Math.min(page, totalPages);
    const visible = new Set(filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE).map((m) => m.id));

    return (
        <>
            <div className="movie-grid" id="grid">
                {entries.map((m) => (
                    <a
                        key={m.id}
                        className={`card${visible.has(m.id) ? '' : ' card-hide'}`}
                        href={`/movie/${m.slug}/`}
                        data-cat={m.category}
                    >
                        <div className="ribbon">{m.quality || 'HD'}</div>
                        <img src={m.poster} alt={`${m.title} ເບິ່ງໜັງອອນໄລນ໌ຟຣີ BOENG NANG MOVIE`} loading="lazy" />
                        <div className="rating-bar">
                            {m.rating ? `ເບິ່ງໜັງອອນໄລນ໌ IMDb: ${m.rating}` : CATEGORY_LABEL[m.category] || ''}
                        </div>
                        <div className="card-title">{m.title}</div>
                    </a>
                ))}
            </div>

            <div id="pagination">
                {totalPages > 1 &&
                    Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                        <button
                            key={n}
                            className={n === cur ? 'cur' : ''}
                            onClick={() => { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        >
                            {n}
                        </button>
                    ))}
            </div>
        </>
    );
}
