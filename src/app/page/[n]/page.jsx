// Static catalog pagination — /page/2/, /page/3/, … up to the last page.
//
// Why real pages instead of the client-side pager alone: they are crawlable,
// shareable and work without JavaScript, and each one carries its own title +
// prev/next links. Page 1 stays the homepage (it keeps every card prerendered
// for SEO); from page 2 on we only render that page's slice to keep the HTML
// small.
import Header from '../../../components/Header.jsx';
import Footer from '../../../components/Footer.jsx';
import BottomNav from '../../../components/BottomNav.jsx';
import MovieCard from '../../../components/MovieCard.jsx';
import { catalogEntries, totalPages, pageSlice } from '../../../lib/catalog.js';
import { PER_PAGE, pageItems, pageHref } from '../../../lib/paging.js';
import { SITE } from '../../sitemap.js';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
    return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => ({ n: String(i + 2) }));
}

export async function generateMetadata({ params }) {
    const n = Number(params.n);
    const title = `ໜ້າ ${n}/${totalPages} ລວມໜັງໃໝ່ ເບິ່ງໜັງອອນໄລນ໌ຟຣີ | BOENGNANG`;
    const description = `ລວມໜັງໃໝ່ ໜ້າ ${n} ເບິ່ງໜັງອອນໄລນ໌ຟຣີ ຄົມຊັດ HD ພາກໄທ ເຕັມເລື່ອງ ທີ່ BOENGNANG`;
    return {
        title,
        description,
        alternates: { canonical: `${SITE}/page/${n}/` },
        openGraph: { title, description, type: 'website' },
    };
}

export default function CatalogPage({ params }) {
    const n = Number(params.n);
    const list = pageSlice(n);

    return (
        <>
            {/* prev/next tell crawlers how the catalog is paginated */}
            <link rel="prev" href={pageHref(n - 1)} />
            {n < totalPages && <link rel="next" href={pageHref(n + 1)} />}
            <Header total={catalogEntries.length} />

            <div className="wrap">
                <div className="layout">
                    <div className="content">
                        <div className="seo-box page-head">
                            <h1>
                                ລວມໜັງໃໝ່ ໜ້າ {n}/{totalPages} (รวมหนังใหม่ หน้า {n})
                            </h1>
                            <p>
                                ໜັງອອນໄລນ໌ ອັບເດດໃໝ່ ລຽງຈາກໃໝ່ໄປເກົ່າ ໜ້າລະ {PER_PAGE} ເລື່ອງ —{' '}
                                <a href="/">ກັບໜ້າທຳອິດ (กลับหน้าแรก)</a>
                            </p>
                        </div>

                        <div className="movie-grid">
                            {list.map((m) => (
                                <MovieCard key={m.id} m={m} />
                            ))}
                        </div>

                        <nav id="pagination" aria-label="ໜ້າລວມໜັງ (หน้ารวมหนัง)">
                            <a href={pageHref(n - 1)} aria-label="ໜ້າກ່ອນ (หน้าก่อน)">‹</a>                            {pageItems(n, totalPages).map((it, i) =>
                                it === '…' ? (
                                    <span key={`d${i}`} className="dots">…</span>
                                ) : (
                                    <a
                                        key={it}
                                        href={pageHref(it)}
                                        className={it === n ? 'cur' : ''}
                                        aria-current={it === n ? 'page' : undefined}
                                    >
                                        {it}
                                    </a>
                                ),
                            )}
                            {n < totalPages ? (
                                <a href={pageHref(n + 1)} aria-label="ໜ້າຕໍ່ໄປ (หน้าต่อไป)">›</a>
                            ) : (
                                <span className="off" aria-hidden="true">›</span>
                            )}
                            <span className="page-note">ໜ້າ {n}/{totalPages}</span>
                        </nav>
                    </div>
                </div>
            </div>

            <Footer />
            <BottomNav />
        </>
    );
}
