// Internal ops dashboard (plan #4 item 10): catalog health at build time +
// live worker uptime in the browser. noindex — this page is for the owner,
// not a landing page. Fully static; the only runtime request is GET /ping.
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import BottomNav from '../../components/BottomNav.jsx';
import UptimeMonitor from '../../components/UptimeMonitor.jsx';
import { catalogHealth } from '../../lib/catalog-health.js';

export const metadata = {
    title: 'Ops / ສະຖານະລະບົບ | BOENGNANG',
    description: 'ສະຖານະຄັງໜັງ ແລະ ການເຮັດວຽກຂອງ stream proxy',
    robots: { index: false, follow: false },
};

const stamp = (iso) => (iso ? `${iso.replace('T', ' ').slice(0, 19)} UTC` : '—');
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0);

export default function Ops() {
    const h = catalogHealth();
    const stats = [
        ['ທັງໝົດ (Total)', h.total],
        ['ເຜີຍແຜ່ (Live)', h.live],
        ['ລິ້ງເສຍ (Dead)', h.dead],
        ['ຊ້ຳກັນ (Duplicates)', h.duplicates],
        ['ໜັງ (Movies)', h.movies],
        ['ຊີຣີ (Series)', h.series],
        ['ຕອນທັງໝົດ (Episodes)', h.episodes],
        ['ສຸຂະພາບ (Healthy)', `${h.healthPercent}%`],
    ];

    return (
        <>
            <Header />
            <main className="legal ops">
                <h1>ສະຖານະລະບົບ (Ops Dashboard)</h1>
                <p className="legal-updated">
                    ສ້າງຂໍ້ມູນຕອນ build: {stamp(h.builtAt)} · ກວດລິ້ງລ່າສຸດ: {stamp(h.lastCheck)}
                </p>

                <h2>1. ສະຫຼຸບຄັງຂໍ້ມູນ (Catalog snapshot)</h2>
                <div className="ops-stats">
                    {stats.map(([label, value]) => (
                        <div className="ops-stat" key={label}>
                            <strong>{value}</strong>
                            <span>{label}</span>
                        </div>
                    ))}
                </div>

                <h2>2. ການແຈກຢາຍໝວດໝູ່ (Categories)</h2>
                <div className="ops-bars">
                    {h.categories.map((c) => (
                        <div className="ops-bar-row" key={c.key}>
                            <span className="ops-bar-label">{c.label}</span>
                            <div className="ops-bar-track">
                                <span style={{ width: `${pct(c.count, h.live)}%` }} />
                            </div>
                            <span className="ops-bar-num">{c.count}</span>
                        </div>
                    ))}
                </div>

                <h2>3. ຄວາມຄົບຖ້ວນຂອງຂໍ້ມູນ (Coverage)</h2>
                <ul className="ops-list">
                    <li>ໂປສເຕີທ້ອງຖິ່ນ (Local posters): <strong>{h.withPoster}/{h.live}</strong> ({pct(h.withPoster, h.live)}%)</li>
                    <li>ຄະແນນ (Ratings): <strong>{h.withRating}/{h.live}</strong> ({pct(h.withRating, h.live)}%) — ທີ່ເຫຼືອສະແດງຊື່ໝວດແທນ</li>
                    <li>ປີອອກ (Release years): <strong>{h.yearMin ?? '—'} – {h.yearMax ?? '—'}</strong></li>
                    <li>OG cards 1200×630: ສ້າງຕອນ build ຈາກໂປສເຕີທ້ອງຖິ່ນ (ບໍ່ເກັບໃນ repo)</li>
                </ul>

                <h2>4. ການເຮັດວຽກຂອງ Stream proxy (Uptime)</h2>
                <UptimeMonitor />
                <p className="ops-note">
                    ວັດຈາກເບົາເຊີຂອງທ່ານ ຜ່ານ GET /ping. ຖ້າຂຶ້ນ Offline ໃຫ້ກວດ
                    <code> stream-proxy/worker.js</code> ແລະ deployment ຂອງ Worker.
                </p>

                <h2>5. ຄຳສັ່ງບຳລຸງຮັກສາ (Maintenance commands)</h2>
                <ul className="ops-list ops-code">
                    <li><code>npm run validate:data</code> — ກວດຄວາມຖືກຕ້ອງຂອງຂໍ້ມູນ</li>
                    <li><code>npm run check:links</code> — ອັບເດດລາຍຊື່ລິ້ງເສຍ</li>
                    <li><code>npm run ratings</code> — ເຕີມຄະແນນຈາກ TMDB (ຕ້ອງໃສ່ key)</li>
                    <li><code>npm run build &amp;&amp; node scripts/verify-build.mjs</code> — ກວດກ່ອນປ່ອຍ</li>
                </ul>
            </main>
            <Footer />
            <BottomNav />
        </>
    );
}
