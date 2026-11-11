// Site header: notice bar (optional), logo + white pill search, social icons, horizontal nav.
// Filter links are plain <a> so landing on the homepage always does a full load
// and the grid reads ?cat= / ?year= from the URL on mount. Search is the only
// interactive control, extracted into the small client component below.
import Link from 'next/link';
import SearchBox from './SearchBox.jsx';

export default function Header({ total = null }) {
    const navItems = [
        { label: 'หน้าแรก', href: '/' },
        { label: 'หนังใหม่ 2025', href: '/?year=2025' },
        { label: 'หนังใหม่ 2024', href: '/?year=2024' },
        { label: 'ຊີລີ່ອອນໄລນ໌ (ซีรีย์)', href: '/?cat=serie' },
        { label: 'หนังแอ็คชั่น', href: '/?cat=action' },
        { label: 'หนังผี สยองขวัญ', href: '/?cat=horror' },
        { label: 'การ์ตูน', href: '/?cat=anime' },
        { label: 'ດຣາມ່າ (Drama)', href: '/?cat=drama' },
    ];

    return (
        <>
            {total !== null && (
                <div className="notice">
                    ดูหนังออนไลน์ฟรี BOENG NANG MOVIE มีหนังและซีรีส์ทั้งหมด {total} ເລື່ອງ ອັບເດດໜັງໃຝ່ທຸກວັນ.
                </div>
            )}

            <header className="header">
                <Link href="/" className="logo">
                    <img src="/favicon.png" alt="BOENG NANG MOVIE" loading="eager" />
                </Link>
                <SearchBox />
                <div className="social-icons">
                    <a href="#" aria-label="Facebook"><i className="fab fa-facebook" style={{ color: '#1877f2' }}></i></a>
                    <a href="#" aria-label="Twitter / X"><i className="fab fa-twitter" style={{ color: '#fff' }}></i></a>
                    <a href="#" aria-label="RSS"><i className="fas fa-rss" style={{ color: '#ff8c00' }}></i></a>
                </div>
            </header>

            <nav className="mainnav">
                {navItems.map((item) => (
                    <a key={item.label} href={item.href}>{item.label}</a>
                ))}
            </nav>
        </>
    );
}
