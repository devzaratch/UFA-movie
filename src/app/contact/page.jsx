// Contact page (plan item #10): what people actually need — a way to report a
// broken stream or a copyright issue. Channels come from src/data/site-info.js
// so no address is invented here.
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import BottomNav from '../../components/BottomNav.jsx';
import { SITE_INFO } from '../../data/site-info.js';
import { SITE } from '../sitemap.js';

export const metadata = {
    title: 'ຕິດຕໍ່ເຮົາ (Contact) | BOENGNANG',
    description: 'ຕິດຕໍ່ BOENGNANG — ແຈ້ງລິ້ງເສຍ, ລິຂະສິດ, ໂຄສະນາ ແລະ ຄຳຖາມທົ່ວໄປ',
    alternates: { canonical: `${SITE}/contact/` },
};

const CHANNELS = [
    { key: 'email', label: 'ອີເມວ (อีเมล)', value: SITE_INFO.email, prefix: 'mailto:' },
    { key: 'telegram', label: 'Telegram', value: SITE_INFO.telegram, prefix: '' },
    { key: 'facebook', label: 'Facebook Page', value: SITE_INFO.facebook, prefix: '' },
].filter((c) => c.value);

export default function Contact() {
    return (
        <>
            <Header />
            <main className="legal">
                <h1>ຕິດຕໍ່ເຮົາ (ติดต่อเรา)</h1>
                <p>
                    ພວກເຮົາອ່ານທຸກຂໍ້ຄວາມ. ຖ້າເປັນເລື່ອງລິ້ງເສຍ ບອກຊື່ໜັງ ຫຼື ລິ້ງໜ້າມາໄດ້ເລີຍ
                    ພວກເຮົາຈະຫາແຫຼ່ງໃໝ່ໃຫ້ໄວທີ່ສຸດ (ປົກກະຕິພາຍໃນ 72 ຊົ່ວໂມງ).
                </p>

                <h2>ແຈ້ງລິ້ງເສຍໄດ້ໄວທີ່ສຸດ (แจ้งลิงก์เสีย)</h2>
                <p>
                    ເປີດໜ້າໜັງເລື່ອງນັ້ນ ແລ້ວກົດປຸ່ມ <strong>ແຈ້ງລິ້ງເສຍ</strong> ທີ່ຢູ່ໃຕ້ຈໍຫຼິ້ນ —
                    ລະບົບຈະສົ່ງຊື່ໜັງມາໃຫ້ໂດຍອັດຕະໂນມັດ ບໍ່ຕ້ອງພິມຫຍັງ.
                </p>

                <h2>ຊ່ອງທາງອື່ນ (ช่องทางอื่น)</h2>
                {CHANNELS.length > 0 ? (
                    <ul>
                        {CHANNELS.map((c) => (
                            <li key={c.key}>
                                <strong>{c.label}:</strong>{' '}
                                <a href={c.prefix + c.value} target="_blank" rel="noreferrer">
                                    {c.value.replace(/^https?:\/\//, '')}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="legal-note">
                        ຊ່ອງທາງຕິດຕໍ່ຈະປະກາດໃນໄວໆນີ້ — ຕອນນີ້ໃຊ້ປຸ່ມ ແຈ້ງລິ້ງເສຍ ໃນໜ້າໜັງໄດ້ເລີຍ
                        (ช่องทางติดต่อจะประกาศเร็ว ๆ นี้ — ตอนนี้ใช้ปุ่มแจ้งลิงก์เสียในหน้าหนังได้เลย)
                    </p>
                )}

                <h2>ລິຂະສິດ (Copyright / DMCA)</h2>
                <p>
                    BOENGNANG ບໍ່ໄດ້ເປັນເຈົ້າຂອງວິດີໂອ ແລະ ບໍ່ໄດ້ເກັບໄຟລ໌ໄວ້ເທິງເຊີບເວີ
                    ເນື້ອຫາທັງໝົດມາຈາກແຫຼ່ງພາກສ່ວນທີສາມ. ຖ້າທ່ານເປັນເຈົ້າຂອງລິຂະສິດ ແລະ ຕ້ອງການໃຫ້ລຶບລິ້ງ
                    ສົ່ງລາຍລະອຽດ (ຊື່ເລື່ອງ + ລິ້ງໜ້າ + ຫຼັກຖານສິດ) ມາທາງຊ່ອງທາງຂ້າງເທິງ
                    ພວກເຮົາຈະລຶບພາຍໃນ 72 ຊົ່ວໂມງ.
                </p>

                <h2>ໂຄສະນາ (Advertising)</h2>
                <p>
                    ສົນໃຈລົງໂຄສະນາ ຫຼື ຮ່ວມງານ ຕິດຕໍ່ມາທາງຊ່ອງທາງຂ້າງເທິງ ພ້ອມບອກງົບ ແລະ ໄລຍະເວລາ.
                </p>

                <p>
                    ເບິ່ງ <a href="/privacy/">ນະໂຍບາຍຄວາມສ່ວນຕົວ</a> ສຳລັບລາຍລະອຽດຂໍ້ມູນທີ່ເກັບ.
                </p>
            </main>
            <Footer />
            <BottomNav />
        </>
    );
}
