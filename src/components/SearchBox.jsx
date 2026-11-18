'use client';

// White pill search box; dispatches the dm:search event that HomeGrid listens to.
// Debounced (~180ms) so typing fast doesn't re-filter the 1,700+ card catalog
// on every keystroke (plan item #1).
import { useRef } from 'react';

export default function SearchBox() {
    const timer = useRef(null);

    const onSearch = (e) => {
        const value = e.target.value;
        clearTimeout(timer.current);
        timer.current = setTimeout(() => {
            window.dispatchEvent(new CustomEvent('dm:search', { detail: value }));
        }, 180);
    };

    return (
        <form className="search-box" onSubmit={(e) => e.preventDefault()} role="search">
            <input
                type="search"
                id="search"
                inputMode="search"
                autoComplete="off"
                placeholder="พิมพ์ชื่อหนัง... ຄົ້ນຫາໜັງ"
                aria-label="ຄົ້ນຫາໜັງ (ค้นหาหนัง)"
                onInput={onSearch}
            />
            <button type="submit" className="search-btn" aria-label="ค้นหา">
                <i className="fas fa-search" aria-hidden="true"></i>
            </button>
        </form>
    );
}
