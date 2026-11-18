// Per-title player page: /movie/<slug>/ — one static page per entry, generated at build time.
import Header from '../../../components/Header.jsx';
import Footer from '../../../components/Footer.jsx';
import Player from '../../../components/Player.jsx';
import { movieDatabase } from '../../../data/movies.js';
import { DEAD_IDS } from '../../../data/dead-links.js';
import { DUPLICATE_TO_CANONICAL } from '../../../data/duplicates.js';
import { slugify } from '../../../lib/slug.js';
import { posterFor } from '../../../lib/posters.js';
import { CATEGORY_LABEL } from '../../../lib/categories.js';
import { SITE } from '../../sitemap.js';
import AdBanner from '../../../components/AdBanner.jsx';
import ShareRow from '../../../components/ShareRow.jsx';
import BottomNav from '../../../components/BottomNav.jsx';
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
    if (!m) return { title: 'BOENGNANG' };
    const title = `ເບິ່ງໜັງ ${m.title} ເຕັມເລື່ອງ HD | BOENGNANG`;
    const description = `ເບິ່ງໜັງ ${m.title} ອອນໄລນ໌ຟຣີ ຄົມຊັດ HD ທີ່ BOENGNANG`;
    const slug = slugify(m.id, m.title);
    // Duplicate entries (same title as another entry) point their canonical at
    // the main page so Google indexes one URL per film — plan item #5.
    const canonId = DUPLICATE_TO_CANONICAL[m.id];
    const canon = canonId ? movieDatabase.find((x) => x.id === canonId) : null;
    const canonicalUrl = canon ? `${SITE}/movie/${slugify(canon.id, canon.title)}/` : `${SITE}/movie/${slug}/`;
    return {
        title,
        description,
        robots: { index: true },
        // canonical + per-title og:image (poster)
        alternates: { canonical: canonicalUrl },
        openGraph: {
            title,
            description,
            images: [{ url: posterFor(m) }],
            type: m.type === 'series' ? 'video.tv_show' : 'video.movie',
        },
    };
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

    const title = `ເບິ່ງໜັງ ${m.title} ເຕັມເລື່ອງ HD | BOENGNANG`;
    const description = `ເບິ່ງໜັງ ${m.title} ອອນໄລນ໌ຟຣີ ຄົມຊັດ HD ທີ່ BOENGNANG`;
    const catLabel = CATEGORY_LABEL[m.category] || m.category;
    // Same-title duplicate → link the visitor to the main page (plan item #5).
    const canonId = DUPLICATE_TO_CANONICAL[m.id];
    const canonMovie = canonId ? movieDatabase.find((x) => x.id === canonId) : null;
    const schema = {
        "@context": "https://schema.org",
        "@type": m.type === 'series' ? "TVSeries" : "Movie",
        "name": m.title,
        "image": posterFor(m),
        "description": description,
    };
    // Only real IMDb-style ratings from the data get an aggregateRating.
    if (m.rating) {
        schema.aggregateRating = {
            "@type": "AggregateRating",
            "ratingValue": String(m.rating),
            "bestRating": "10",
            "worstRating": "1",
        };
    }
    const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "หน้าแรก", "item": `${SITE}/` },
            { "@type": "ListItem", "position": 2, "name": catLabel, "item": `${SITE}/?cat=${m.category}` },
            { "@type": "ListItem", "position": 3, "name": m.title },
        ],
    };

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

                {DEAD_IDS.has(m.id) && (
                    <div className="dead-note">
                        <i className="fas fa-triangle-exclamation" aria-hidden="true"></i>{' '}
                        ບໍ່ສາມາດເບິ່ງເລື່ອງນີ້ໄດ້ໃນຂະນະນີ້ (ดูเรื่องนี้ไม่ได้ชั่วคราว) — ແຫຼ່ງວິດີໂອໝົດອາຍຸ ພວກເຮົາກຳລັງຫາແຫຼ່ງໃໝ່.
                        ລອງເບິ່ງ <a href="/?cat=serie">ຊີລີ້ (ซีรีส์)</a> ຫຼື <a href="/?cat=action">ແອັກຊັນ (แอคชั่น)</a> ກ່ອນ.
                    </div>
                )}

                {canonMovie && (
                    <div className="dead-note dup-note">
                        <i className="fas fa-circle-info" aria-hidden="true"></i>{' '}
                        ເລື່ອງນີ້ມີຫຼາຍກວ່າໜຶ່ງໜ້າ (เรื่องนี้มีหน้าหลักแล้ว) — ລອງເບິ່ງທີ່{' '}
                        <a href={`/movie/${slugify(canonMovie.id, canonMovie.title)}/`}>{canonMovie.title}</a>{' '}
                        ເພື່ອລິ້ງທີ່ໃໝ່ກວ່າ.
                    </div>
                )}

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

                        <AdBanner />
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
                                            <img src={posterFor(r)} alt={r.title} loading="lazy" /> <span>{r.title}</span>
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

            <div className="share-wrap">
                <ShareRow />
            </div>

            <section className="related-section">
                <h2 className="related-title">ໜັງທີ່ກ່ຽວຂ້ອງ (หนังที่เกี่ยวข้อง)</h2>
                <div className="rel-grid">
                    {related.map((r) => (
                        <a className="rel-card" key={r.id} href={`/movie/${r.slug}/`}>
                            <img src={posterFor(r)} alt={r.title} loading="lazy" />
                            <div className="rel-t">{r.title}</div>
                        </a>
                    ))}
                </div>
            </section>

            <Footer />
            <BottomNav />

            {/* JSON-LD for AI/structured search */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
            />
        </>
    );
}
