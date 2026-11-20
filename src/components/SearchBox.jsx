'use client';

// White pill search box; lives in the header, so it appears on every page.
// - On the catalog page it filters live (debounced ~180ms) through dm:search.
// - On a title page / legal page there is no grid to filter, so submitting
//   takes the visitor to /?q=… (which HomeGrid reads) instead of doing nothing.
import { useEffect, useRef, useState } from 'react';

export default function SearchBox() {
    const timer = useRef(null);
    const [value, setValue] = useState('');
    const isHome = () => typeof window !== 'undefined' && (window.location.pathname === '/' || window.location.pathname === '/index.html');

    // Let the grid clear/fill the box (e.g. the "reset filters" button).
    useEffect(() => {
        const sync = (e) => setValue(typeof e.detail === 'string' ? e.detail : '');
        window.addEventListener('dm:search', sync);
        return () => window.removeEventListener('dm:search', sync);
    }, []);

    const onInput = (e) => {
        const next = e.target.value;
        setValue(next);
        if (!isHome()) return; // navigating mid-typing would be hostile
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('dm:search', { detail: next }));
        }, 180);
    };

    const onSubmit = (e) => {
        e.preventDefault();
        const q = value.trim();
        if (!q) return;
        clearTimeout(timer.current);
        if (isHome()) {
            window.dispatchEvent(new CustomEvent('dm:search', { detail: q }));
            const grid = document.getElementById('grid') || document.querySelector('.catalog-wrap');
            if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
            window.location.href = '/?q=' + encodeURIComponent(q);
        }
    };

    return (
        <form className="search-box" onSubmit={onSubmit} role="search">
            <input
                type="search"
                id="search"
                inputMode="search"
                autoComplete="off"
                value={value}
                onChange={onInput}
                placeholder="พิมพ์ชื่อหนัง... ຄົ້ນຫາໜັງ"
                aria-label="ຄົ້ນຫາໜັງ (ค้นหาหนัง)"
            />
            <button type="submit" className="search-btn" aria-label="ค้นหา">
                <i className="fas fa-search" aria-hidden="true"></i>
            </button>
        </form>
    );
}
