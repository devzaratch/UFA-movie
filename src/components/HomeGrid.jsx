'use client';

// Interactive part of the catalog: hides/shows the statically rendered cards.
// All cards stay in the prerendered HTML (SEO); this component only toggles visibility.
//
// Catalog controls (redesigned):
//   - A sticky filter bar (category chips with live counts + year select) that
//     stays reachable while scrolling instead of hiding in the sidebar.
//   - Windowed pagination (1 … 4 5 6 … 210) right under the grid instead of
//     rendering one button per page (the catalog has hundreds of pages).
// Filters: reads ?cat= / ?year= / ?page= once on mount (nav/footer links are
// plain <a>, so landing here always does a full load), listens to dm:search
// from the header box, and keeps the URL in sync via history.replaceState.
import { useEffect, useMemo, useRef, useState } from 'react';
import { CATEGORY_LABEL } from '../lib/categories.js';

const PER_PAGE = 24;
const CATS = ['all', 'action', 'horror', 'anime', 'serie', 'drama'];
const fmt = (n) => n.toLocaleString('en-US');

function pageItems(cur, total) {
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

export default function HomeGrid({ entries }) {
    const [q, setQ] = useState('');
    const [cat, setCat] = useState('all');
    const [year, setYear] = useState('');
    const [page, setPage] = useState(1);
    const [ready, setReady] = useState(false);   // suppresses replaceState during URL hydration
    const barRef = useRef(null);

    useEffect(() => {
        const sp = new URLSearchParams(window.location.search);
        const urlCat = sp.get('cat');
        const urlYear = sp.get('year');
        const urlPage = parseInt(sp.get('page') || '1', 10);
        if (urlCat && CATS.includes(urlCat)) setCat(urlCat);
        if (urlYear) setYear(urlYear);
        if (urlPage > 1) setPage(urlPage);
        setReady(true);

        const onSearch = (e) => { setQ(e.detail || ''); setPage(1); };
        window.addEventListener('dm:search', onSearch);
        return () => window.removeEventListener('dm:search', onSearch);
    }, []);

    // Keep the address bar shareable/refreshable without spamming history.
    useEffect(() => {
        if (!ready) return;
        const sp = new URLSearchParams(window.location.search);
        cat === 'all' ? sp.delete('cat') : sp.set('cat', cat);
        year ? sp.set('year', year) : sp.delete('year');
        page > 1 ? sp.set('page', String(page)) : sp.delete('page');
        const qs = sp.toString();
        window.history.replaceState(null, '', qs ? `/?${qs}` : '/');
    }, [cat, year, page, ready, q]);

    const years = useMemo(
        () => [...new Set(entries.map((m) => m.year).filter(Boolean))].sort((a, b) => b - a),
        [entries],
    );

    const base = useMemo(
        () => entries.filter((m) => (!year || m.year === year) && (!q || m.title.toLowerCase().includes(q))),
        [entries, year, q],
    );
    const counts = useMemo(() => {
        const c = { all: base.length };
        for (const k of CATS.slice(1)) c[k] = 0;
        for (const m of base) if (c[m.category] !== undefined) c[m.category]++;
        return c;
    }, [base]);

    const filtered = useMemo(
        () => (cat === 'all' ? base : base.filter((m) => m.category === cat)),
        [base, cat],
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
    const cur = Math.min(page, totalPages);
    const visible = new Set(filtered.slice((cur - 1) * PER_PAGE, cur * PER_PAGE).map((m) => m.id));

    const scrollToBar = () => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const top = barRef.current ? barRef.current.getBoundingClientRect().top + window.scrollY : 0;
        window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
    };
    const goPage = (n) => {
        setPage(n);
        scrollToBar();
    };
    const setCatAndReset = (k) => { setCat(k); setPage(1); scrollToBar(); };

    return (
        <div className="catalog-wrap">
            <div className="filter-bar" ref={barRef}>
                <div className="chip-list" role="tablist" aria-label="ໝວດໝູ່ (หมวดหมู่)">
                    {CATS.map((k) => (
                        <button
                            key={k}
                            role="tab"
                            aria-selected={cat === k}
                            className={`chip${cat === k ? ' cur' : ''}`}
                            onClick={() => setCatAndReset(k)}
                        >
                            {k === 'all' ? 'ທັງໝົດ (ทั้งหมด)' : CATEGORY_LABEL[k]}
                            <span className="cnt">{fmt(counts[k] || 0)}</span>
                        </button>
                    ))}
                </div>
                <div className="bar-right">
                    <label className="year-wrap">
                        <span className="visually-hidden">ປີ (ปี)</span>
                        <select className="year-select" value={year} onChange={(e) => { setYear(e.target.value); setPage(1); scrollToBar(); }}>
                            <option value="">ທຸກປີ (ทุกปี)</option>
                            {years.map((y) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </label>
                    <span className="result-info" aria-live="polite">
                        {q ? `ພົບ (พบ) ${fmt(filtered.length)} ເລື່ອງ` : `${fmt(filtered.length)} ເລື່ອງ`}
                    </span>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="grid-empty">ບໍ່ພົບໜັງທີ່ຄົ້ນຫາ (ไม่พบหนังที่ค้นหา) — ລອງຄຳອື່ນ ຫຼື ເລືອກໝວດໃໝ່</div>
            ) : (
                <div className="movie-grid" id="grid">
                    {entries.map((m) => (
                        <a
                            key={m.id}
                            className={`card${visible.has(m.id) ? '' : ' card-hide'}`}
                            href={`/movie/${m.slug}/`}
                            data-cat={m.category}
                        >
                            <div className="ribbon">{m.quality || 'HD'}</div>
                            <img src={m.poster} alt={`${m.title} ເບິ່ງໜັງອອນໄລນ໌ຟຣີ BOENGNANG`} loading="lazy" />
                            <div className="rating-bar">
                                {m.rating ? `ເບິ່ງໜັງອອນໄລນ໌ IMDb: ${m.rating}` : CATEGORY_LABEL[m.category] || ''}
                            </div>
                            <div className="card-title">{m.title}</div>
                        </a>
                    ))}
                </div>
            )}

            <div id="pagination">
                {totalPages > 1 && (
                    <>
                        <button
                            aria-label="ໜ້າກ່ອນ (หน้าก่อน)"
                            disabled={cur === 1}
                            onClick={() => cur > 1 && goPage(cur - 1)}
                        >
                            ‹
                        </button>
                        {pageItems(cur, totalPages).map((it, i) =>
                            it === '…' ? (
                                <span key={`d${i}`} className="dots">…</span>
                            ) : (
                                <button key={it} className={it === cur ? 'cur' : ''} onClick={() => goPage(it)}>
                                    {it}
                                </button>
                            ),
                        )}
                        <button
                            aria-label="ໜ້າຕໍ່ໄປ (หน้าต่อไป)"
                            disabled={cur === totalPages}
                            onClick={() => cur < totalPages && goPage(cur + 1)}
                        >
                            ›
                        </button>
                        <span className="page-note">ໜ້າ {cur}/{totalPages}</span>
                    </>
                )}
            </div>
        </div>
    );
}
