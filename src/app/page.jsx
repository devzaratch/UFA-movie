import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import HomeGrid from '../components/HomeGrid.jsx';
import { movieDatabase } from '../data/movies.js';
import { slugify, yearOf } from '../lib/slug.js';

export default function HomePage() {
    // All entries are rendered server-side (build time): slider, sidebar and every card.
    // HomeGrid is a client component that only toggles visibility for
    // search / category / year filtering + pagination.
    const entries = movieDatabase.map((m) => ({
        ...m,
        slug: slugify(m.id, m.title),
        year: yearOf(m.title),
    }));

    return (
        <>
            <Header total={movieDatabase.length} />

            <div className="wrap">
                <ul className="top-slider">
                    {entries.slice(0, 28).map((m) => (
                        <li key={m.id}>
                            <a href={`/movie/${m.slug}/`}>
                                <img src={m.poster} alt={`${m.title} DOONUNG-MOVIE`} loading="eager" />
                            </a>
                        </li>
                    ))}
                </ul>

                <div className="layout">
                    <div className="content">
                        <div className="seo-box">
                            <h1>DOONUNG-MOVIE ‌ເບິ່ງໜັງອອນໄລນ໌ຟຣີ ดูหนังออนไลน์ฟรี ລວມໜັງໃຝ່ 2025 HD ພາກໄທ ເຕັມເລື່ອງ</h1>
                            <p>
                                <strong>DOONUNG-MOVIE</strong> ຍິນດີຕ້ອນຮັບສູ່ ເວັບເບິ່ງໜັງອອນໄລນ໌ທີ່ດີທີ່ສຸດ. ເຮົາຄືແຫຼ່ງຮວມ
                                <strong>ໜັງໃຝ່ຊົນໂຮງ 2025</strong> ແລະ ຊີລີ້ດັງຈາກທົ່ວໂລກ ຄົມຊັດລະດັບ 4K ແລະ HD
                                ພາກໄທ ເຕັມເລື່ອງ ເບິ່ງຟຣີບໍ່ມີຄ່າບໍລິການ ອັບເດດໜັງໃຝ່ໃນທຸກມື້.
                            </p>
                            <p>
                                • <strong>ມີຄັບໝວດທຸກທີ່ຢາກເບິ່ງ:</strong> ໜັງແອັກຊັນ ໜັງຜີ ສະຫຍອງຂວັນ ກາຕູນອານິເມະ ດຣາມ່າຮັກ
                                ແລະ ຊີລີ້ດັງ ພາກໄທ ພາກຊັບ ພາກອັງກິດ ຮອງຮັບການເບິ່ງທັງຜ່ານມືຖື ແລະ ຄອມພິວເຕີ.
                            </p>
                            <p>
                                • <strong>ອັບເດດທຸກມື້ ບໍ່ໃຫ້ພົ້ນທຸກແນວ:</strong> ໜັງຖືກຈັດກຸ່ມເປັນໝວດຫມວດຶດຕາມປີທີ່ອອກສະຫຍາຍ
                                ຊອກຫາໜັງໄດ້ງ່າຍຈາກຄອກສີສັນ ຫຼື ຂຽນຊື່ໜັງທີ່ຢາກເບິ່ງ ໃນກ່ອງຄັນຄາໂຍນ.
                            </p>
                        </div>

                        <HomeGrid entries={entries} />
                    </div>

                    <aside className="sidebar">
                        <div className="side-box">
                            <div className="side-title">ເລື່ອງລ້າສຸດ (ล่าสุด)</div>
                            <ul className="side-list">
                                {entries.slice(0, 12).map((m) => (
                                    <li key={m.id}>
                                        <a href={`/movie/${m.slug}/`}>
                                            <img src={m.poster} alt={m.title} loading="lazy" /> <span>{m.title}</span>
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
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
                        <a className="side-promo" href="https://ufasboclubauto.com/register" target="_blank" rel="noreferrer">
                            ສະໝັກສະມາຊິກ (สมัครสมาชิก)
                            <span>ຮັບໜັງຄົມຊັດ HD ພາກໄທ ເຕັມເລື່ອງ ທຸກຮູບແບບ</span>
                        </a>
                    </aside>
                </div>
            </div>

            <Footer />
        </>
    );
}
