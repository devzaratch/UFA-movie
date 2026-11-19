// Static 404 page: exported as out/404.html (Vercel serves it for unknown routes).
// Adds a few recommended titles so a lost visitor can start watching instead of
// bouncing (plan item #6).
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { movieDatabase } from '../data/movies.js';
import { DEAD_IDS } from '../data/dead-links.js';
import { DUPLICATE_TO_CANONICAL } from '../data/duplicates.js';
import { posterFor } from '../lib/posters.js';
import { slugify } from '../lib/slug.js';

export const metadata = {
    title: 'ບໍ່ພົບໜ້າ (404) | BOENGNANG',
    description: 'ໜ້າທີ່ຄົ້ນຫາບໍ່ມີຢູ່ໃນ BOENGNANG (หน้าที่ค้นหาไม่มีอยู่ใน BOENGNANG)',
};

// Deterministic picks at build time (no Math.random → the static file is stable):
// take every Nth playable title, newest-looking first.
function picks(n) {
    const alive = movieDatabase
        .filter((m) => !DEAD_IDS.has(m.id) && !DUPLICATE_TO_CANONICAL[m.id])
        .reverse();
    const step = Math.max(1, Math.floor(alive.length / n));
    return Array.from({ length: n }, (_, i) => alive[i * step]).filter(Boolean);
}

export default function NotFound() {
    const suggested = picks(8);
    return (
        <>
            <Header />
            <main className="notfound">
                <div className="nf-text">
                    <div className="nf-code">404</div>
                    <h1>ບໍ່ພົບໜ້າທີ່ຄົ້ນຫາ (ไม่พบหน้าที่ค้นหา)</h1>
                    <p>
                        ໜ້ານີ້ອາດຖືກຍ້າຍ ຫຼື ລຶບໄປແລ້ວ — ລອງຄົ້ນຫາໜັງທີ່ຢາກເບິ່ງຈາກໜ້າຫຼັກອີກເທື່ອ
                        (หน้านี้อาจถูกย้ายหรือลบไปแล้ว — ลองค้นหาหนังที่ต้องการดูจากหน้าแรกอีกครั้ง)
                    </p>
                    <a className="nf-btn" href="/">ກັບໜ້າຫຼັກ (กลับหน้าแรก)</a>
                </div>

                <section className="nf-suggest">
                    <h2 className="related-title">ໜັງແນະນຳ (หนังแนะนำ ลองดูสักเรื่อง)</h2>
                    <div className="rel-grid">
                        {suggested.map((m) => (
                            <a key={m.id} className="rel-card" href={`/movie/${slugify(m.id, m.title)}/`}>
                                <img src={posterFor(m)} alt={m.title} width={252} height={378} loading="lazy" />
                                <span>{m.title}</span>
                            </a>
                        ))}
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}
