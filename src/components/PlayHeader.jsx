// Compact header for the per-title player pages: back link + brand.
import Link from 'next/link';

export default function PlayHeader() {
    return (
        <header className="nav-back">
            <Link href="/" className="back-link">
                <i className="fas fa-chevron-left" style={{ color: 'var(--gold)' }}></i> ກັບໜ້າຫລັກ (กลับหน้าหลัก)
            </Link>
            <Link href="/" className="brand">
                <img src="/favicon.png" alt="DOONUNG-MOVIE" loading="eager" /> DOONUNG-MOVIE
            </Link>
        </header>
    );
}
