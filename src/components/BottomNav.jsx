'use client';

// แถบนำทางล่างสำหรับมือถือ (bottom navigation): อยู่ติดขอบล่างตลอด,
// ไม่ต้องเลื่อนกลับขึ้นบนเพื่อเปลี่ยนหมวด — ตามกฎ UX ของ ui-ux-pro-max
// (bottom nav ≤ 5 รายการ, touch target ≥ 44px, deep link ได้ทุกรายการ)
// รายการที่เปิดหน้าใหม่เป็น <a> ปกติ (server-rendered, crawlable เช่นเดิม)
// รายการค้นหาเป็นปุ่มที่เลื่อนขึ้นบนและโฟกัสช่องค้นหาแทน
import { useEffect, useRef, useState } from 'react';

const ITEMS = [
    { label: 'หน้าแรก', icon: 'fa-house', href: '/' },
    { label: 'หนังใหม่', icon: 'fa-film', href: '/?year=2025' },
    { label: 'ซีรีส์', icon: 'fa-layer-group', href: '/?cat=serie' },
    { label: 'การ์ตูน', icon: 'fa-palette', href: '/?cat=anime' },
    { label: 'ค้นหา', icon: 'fa-magnifying-glass', href: null },
];

export default function BottomNav() {
    const [activeIdx, setActiveIdx] = useState(0);
    const searchRef = useRef(null);

    // ตั้งแท็บที่ใช้งานอยู่จาก path ปัจจุบัน (ไม่มี client router)
    useEffect(() => {
        const p = window.location.pathname + window.location.search;
        let idx = 0;
        if (p === '/' || p === '/index.html') idx = 0;
        else if (p.includes('year=')) idx = 1;
        else if (p.includes('cat=serie')) idx = 2;
        else if (p.includes('cat=anime')) idx = 3;
        setActiveIdx(idx);
    }, []);

    const goSearch = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        const input = searchRef.current || document.getElementById('search');
        if (input) {
            input.focus();
            input.select && input.select();
        }
    };

    return (
        <nav className="bottom-nav" aria-label="นำทางหลัก (มือถือ)">
            {ITEMS.map((item, i) => {
                const active = activeIdx === i;
                if (item.href) {
                    return (
                        <a
                            key={item.label}
                            href={item.href}
                            className={`bn-item${active ? ' active' : ''}`}
                            aria-current={active ? 'page' : undefined}
                        >
                            <i className={`fas ${item.icon} bn-icon`} aria-hidden="true"></i>
                            <span className="bn-label">{item.label}</span>
                        </a>
                    );
                }
                return (
                    <button
                        key={item.label}
                        className={`bn-item${active ? ' active' : ''} bn-search`}
                        ref={searchRef}
                        onClick={goSearch}
                        aria-label="ค้นหา"
                    >
                        <i className={`fas ${item.icon} bn-icon`} aria-hidden="true"></i>
                        <span className="bn-label">{item.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}
