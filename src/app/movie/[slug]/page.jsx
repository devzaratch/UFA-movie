// Per-title player page: /movie/<slug>/ — one static page per entry, generated at build time.
import Header from '../../../components/Header.jsx';
import Footer from '../../../components/Footer.jsx';
import Player from '../../../components/Player.jsx';
import { movieDatabase } from '../../../data/movies.js';
import { slugify } from '../../../lib/slug.js';
import { CATEGORY_LABEL } from '../../../lib/categories.js';
import Link from 'next/link';

// Robust slug lookup. Preferred: exact string match (with decode/encode/NFC
// variants, since the static-export segment may arrive percent-encoded or in a
// different unicode form). Fallback that always works: the slug always ends in
// the entry id (`-m<n>` / `-s<n>`), so match on the id suffix.
function findMovie(rawSlug) {
    if (!rawSlug) return null;
    const variants = new Set([rawSlug]);
    try { variants.add(decodeURIComponent(rawSlug)); } catch {}
    try { variants.add(encodeURI(rawSlug)); } catch {}
    for (const v of [...variants]) {
        variants.add(v.normalize('NFC'));
    }
    for (const v of variants) {
        const found = movieDatabase.find((x) => slugify(x.id, x.title) === v);
        if (found) return found;
    }
    // Last resort: `-<id>` suffix match — slugify always appends the id
    const suffix = rawSlug.match(/-([ms]\d+)$/);
    if (suffix) {
        const byId = movieDatabase.find((x) => x.id === suffix[1]);
        if (byId) return byId;
    }
    return null;
}

// Every entry gets its own static page
export function generateStaticParams() {
    return movieDatabase.map((m) => ({ slug: slugify(m.id, m.title) }));
}

export async function generateMetadata({ params }) {
    const m = findMovie(params.slug);
    if (!m) return { title: 'BOENG NANG MOVIE' };
    const title = `ເບິ່ງໜັງ ${m.title} ເຕັມເລື່ອງ HD | BOENG NANG MOVIE`;
    const description = `ເບິ່ງໜັງ ${m.title} ອອນໄລນ໌ຟຣີ ຄົມຊັດ HD ທີ່ BOENG NANG MOVIE`;
    return { title, description, robots: { index: true } };
}

export default function MoviePage({ params }) {
    const m = findMovie(params.slug);

    if (!m) {
        return (
            <>
                <PlayHeader />
                <main style={{ textAlign: 'center', padding: '100px 20px' }}>
                    <h1>ບໍ່ພົບຂໍ້ມູນໜັງ (ไม่พบข้อมูลหนัง)</h1>
                    <Link href="/" style={{ color: 'var(--gold)' }}>ກັບໜ້າຫລັກ</Link>
                </main>
                <Footer />
            </>
        );
    }

    const title = `ເບິ່ງໜັງ ${m.title} ເຕັມເລື່ອງ HD | BOENG NANG MOVIE`;
    const description = `ເບິ່ງໜັງ ${m.title} ອອນໄລນ໌ຟຣີ ຄົມຊັດ HD ທີ່ BOENG NANG MOVIE`;
    const schema = {
        "@context": "https://schema.org",
        "@type": m.type === 'series' ? "TVSeries" : "Movie",
        "name": m.title,
        "image": m.poster,
        "description": description,
    };

    const catLabel = CATEGORY_LABEL[m.category] || m.category;

    // "Related" is picked once at build time: same category, deterministic order
    const related = movieDatabase
        .filter((x) => x.category === m.category && x.id !== m.id)
        .slice(0, 6)
        .map((x) => ({ ...x, slug: slugify(x.id, x.title) }));

    return (
        <>
            {/* keeps the site hidden as the HLS referrer, ported from the old play page */}
            <meta name="referrer" content="no-referrer" />
            <Header />
            <main>
                {/* title bar: title left, breadcrumb right (server-side crawlable) */}
                <div className="title-bar">
                    <a className="tb-title" href={`/movie/${slugify(m.id, m.title)}/`}>{m.title}</a>
                    <span className="crumbs">
                        <a href="/">หน้าแรก</a> &gt; <a href={`/?cat=${m.category}`}>ดูหนังออนไลน์</a> &gt; <a href={`/?cat=${m.category}`}>{catLabel}</a> &gt; {m.quality || 'HD'}
                    </span>
                </div>

                <div className="movie-layout">
                    <div className="movie-main">
                        <Player movie={m} />

                        <article className="info-box">
                            <h1>{m.title}</h1>
                            <div className="meta-tags">
                                <span><i className="fas fa-video"></i> {m.quality || 'HD'}</span>
                                <span><i className="fas fa-tag"></i> <a href={`/?cat=${m.category}`} style={{ color: '#aaa', textDecoration: 'none' }}>{catLabel}</a></span>
                                <span><i className="fas fa-calendar-alt"></i> Update: 2025</span>
                            </div>
                        </article>
                    </div>

                    <aside className="movie-side">
                        <div className="side-box">
                            <div className="side-title">ໝວດໝູ່ (หมวดหมู่)</div>
                            <ul className="side-list">
                                <li><a href="/">ທັງໝົດ (ทั้งหมด)</a></li>
                                <li><a href="/?cat=action">ແອັກຊັນ (Action)</a></li>
                                <li><a href="/?cat=horror">ໜັງຜີ (Horror)</a></li>
                                <li><a href="/?cat=anime">ອານິເມະ (Anime)</a></li>
                                <li><a href="/?cat=serie">ຊີລີ້ (Series)</a></li>
                                <li><a href="/?cat=drama">ດຣາມ່າ (Drama)</a></li>
                            </ul>
                        </div>
                        <div className="side-box">
                            <div className="side-title">ໜັງທີ່ກ່ຽວຂ້ອງ (หนังแนะนำ)</div>
                            <ul className="side-list">
                                {related.slice(0, 6).map((r) => (
                                    <li key={r.id}>
                                        <a href={`/movie/${r.slug}/`}>
                                            <img src={r.poster} alt={r.title} loading="lazy" /> <span>{r.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <a className="side-promo" href="https://ufasboclubauto.com/register" target="_blank" rel="noreferrer">
                            ສະໝັກສະມາຊິກ (สมัครสมาชิก)
                            <span>ຮັບໜັງຄົມຊັດ HD ພາກໄທ ເຕັມເລື່ອງ ທຸກຮູບແບບ</span>
                        </a>
                    </aside>
                </div>
            </main>

            <section className="related-section">
                <h2 className="related-title">ໜັງທີ່ກ່ຽວຂ້ອງ (หนังที่เกี่ยวข้อง)</h2>
                <div className="rel-grid">
                    {related.map((r) => (
                        <a className="rel-card" key={r.id} href={`/movie/${r.slug}/`}>
                            <img src={r.poster} alt={r.title} loading="lazy" />
                            <div className="rel-t">{r.title}</div>
                        </a>
                    ))}
                </div>
            </section>

            <Footer />

            {/* JSON-LD for AI/structured search */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
        </>
    );
}
