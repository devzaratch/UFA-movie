// Privacy policy (plan item #10). Required by every ad network and by most
// in-app browsers before they trust the domain. Written from the site's real
// behaviour: no accounts, no cookies set by us, anonymous analytics and a
// browser-local watch history.
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import BottomNav from '../../components/BottomNav.jsx';
import { SITE_INFO } from '../../data/site-info.js';
import { SITE } from '../sitemap.js';

export const metadata = {
    title: 'ນະໂຍບາຍຄວາມສ່ວນຕົວ (Privacy Policy) | BOENGNANG',
    description: 'ນະໂຍບາຍຄວາມສ່ວນຕົວຂອງ BOENGNANG: ຂໍ້ມູນທີ່ເກັບ, ຄຸກກີ້, ການວິເຄາະ ແລະ ສິດຂອງຜູ້ໃຊ້',
    alternates: { canonical: `${SITE}/privacy/` },
};

export default function Privacy() {
    return (
        <>
            <Header />
            <main className="legal">
                <h1>ນະໂຍບາຍຄວາມສ່ວນຕົວ (นโยบายความเป็นส่วนตัว)</h1>
                <p className="legal-updated">ອັບເດດລ່າສຸດ (อัปเดตล่าสุด): 18 ພະຈິກ 2026</p>

                <h2>1. ຂໍ້ມູນທີ່ພວກເຮົາເກັບ (ข้อมูลที่เราเก็บ)</h2>
                <p>
                    BOENGNANG ບໍ່ມີລະບົບສະໝັກສະມາຊິກ ແລະ ບໍ່ຂໍຊື່, ເບີໂທ ຫຼື ອີເມວຈາກຜູ້ເບິ່ງ.
                    ຂໍ້ມູນທີ່ເກີດຂຶ້ນມີພຽງສອງຢ່າງ:
                </p>
                <ul>
                    <li>
                        <strong>ສະຖິຕິການເຂົ້າເບິ່ງແບບບໍ່ລະບຸຕົວຕົນ</strong> — ໜ້າທີ່ເຂົ້າ, ປະເພດເຄື່ອງ, ປະເທດ
                        (Vercel Analytics — ບໍ່ໃຊ້ຄຸກກີ້ ແລະ ບໍ່ຕິດຕາມຂ້າມເວັບໄຊອື່ນ).
                    </li>
                    <li>
                        <strong>ປະຫວັດການເບິ່ງ</strong> — ຕອນ ແລະ ເວລາທີ່ຢຸດໄວ້ ສຳລັບປຸ່ມ &quot;ເບິ່ງຕໍ່&quot;
                        ຖືກເກັບໄວ້ໃນບຣາວເຊີຂອງທ່ານເອງ (localStorage) ບໍ່ສົ່ງມາຫາເຊີບເວີ.
                        ລຶບໄດ້ໂດຍການລຶບຂໍ້ມູນເວັບໄຊໃນບຣາວເຊີ.
                    </li>
                </ul>

                <h2>2. ຄຸກກີ້ (Cookies)</h2>
                <p>
                    ເວັບໄຊນີ້ບໍ່ຕັ້ງຄຸກກີ້ເພື່ອການໂຄສະນາ ຫຼື ການຕິດຕາມ. ຖ້າມີການເພີ່ມເຄືອຂ່າຍໂຄສະນາໃນອະນາຄົດ
                    ໜ້ານີ້ຈະຖືກອັບເດດກ່ອນເລີ່ມໃຊ້.
                </p>

                <h2>3. ເນື້ອຫາ ແລະ ລິຂະສິດ (Content &amp; copyright)</h2>
                <p>
                    ວິດີໂອທັງໝົດຖືກເຊື່ອມຕໍ່ (embed) ຈາກເຊີບເວີພາກສ່ວນທີສາມ ພວກເຮົາບໍ່ໄດ້ເປັນເຈົ້າຂອງ ແລະ ບໍ່ໄດ້ຝາກໄຟລ໌ວິດີໂອໄວ້ເອງ.
                    ຖ້າທ່ານເປັນເຈົ້າຂອງລິຂະສິດ ແລະ ຕ້ອງການໃຫ້ລຶບລິ້ງ ຕິດຕໍ່ຕາມຊ່ອງທາງໃນໜ້າ{' '}
                    <a href="/contact/">ຕິດຕໍ່ເຮົາ</a> ພວກເຮົາຈະດຳເນີນການພາຍໃນ 72 ຊົ່ວໂມງ.
                </p>

                <h2>4. ຜູ້ໃຫ້ບໍລິການພາກສ່ວນທີສາມ (Third parties)</h2>
                <ul>
                    <li>Vercel — ໂຮສຕິ້ງເວັບໄຊ ແລະ ສະຖິຕິແບບບໍ່ລະບຸຕົວຕົນ</li>
                    <li>Cloudflare — ພຣັອກຊີສະຕຣີມ (ເຫັນ IP ຕາມປົກກະຕິຂອງ CDN)</li>
                    <li>Google Fonts / cdnjs — ຟອນ ແລະ ໄອຄອນ</li>
                    <li>ເຊີບເວີວິດີໂອພາກສ່ວນທີສາມ — ເມື່ອກົດຫຼິ້ນ ຜູ້ໃຫ້ບໍລິການນັ້ນຈະເຫັນ IP ຂອງທ່ານ</li>
                </ul>

                <h2>5. ເດັກນ້ອຍ (Children)</h2>
                <p>
                    ເວັບໄຊບໍ່ໄດ້ອອກແບບສຳລັບເດັກອາຍຸຕ່ຳກວ່າ 13 ປີ ແລະ ບໍ່ເກັບຂໍ້ມູນຈາກເດັກໂດຍເຈດຕະນາ.
                </p>

                <h2>6. ການຕິດຕໍ່ (Contact)</h2>
                <p>
                    ສຳລັບຄຳຖາມເລື່ອງຄວາມສ່ວນຕົວ ຕິດຕໍ່ຜ່ານໜ້າ <a href="/contact/">ຕິດຕໍ່ເຮົາ</a>
                    {SITE_INFO.email ? <> ຫຼື ອີເມວ <a href={`mailto:${SITE_INFO.email}`}>{SITE_INFO.email}</a></> : null}.
                </p>
            </main>
            <Footer />
            <BottomNav />
        </>
    );
}
