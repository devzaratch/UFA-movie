// Footer: gold border + category keyword links (plain <a> full navigation,
// same as the header — no client routing) + copyright.
export default function Footer() {
    const links = [
        { label: 'ดูหนังออนไลน์', href: '/' },
        { label: 'หนังใหม่ 2025', href: '/?year=2025' },
        { label: 'ซีรีย์ออนไลน์', href: '/?cat=serie' },
        { label: 'หนังแอ็คชั่น', href: '/?cat=action' },
        { label: 'หนังผี สยองขวัญ', href: '/?cat=horror' },
        { label: 'หนังการ์ตูน', href: '/?cat=anime' },
        { label: 'หนังดราม่า', href: '/?cat=drama' },
    ];

    return (
        <>
            <div id="footborder"></div>
            <footer className="footer-seo">
                <p style={{ marginBottom: 8 }}>
                    {links.map((l) => (
                        <a key={l.label} href={l.href}>{l.label}</a>
                    ))}
                </p>
                <p>
                    DOONUNG-MOVIE ຄືເວັບດ່ວນໜັງອອນໄລນ໌ ທີ່ລວມໜັງຊົນໂຮງ ໜັງຜີ ກາຕູນ ແລະ ຊີລີ້ໄວ້ຄັບທຸກໝວດ
                    ອັບເດດໜັງໃຝ່ທຸກມື້ ຮອງຮັບການເບິ່ງຜ່ານມືຖື ແລະ ຄອມພິວເຕີ ຕະຫຼອດ 24 ຊົ່ວໂມງ
                    ອອກແບບໃຫ້ຮ້າຍໃຊ້ງ່າຍ ຊອກຫາໜັງໄດ້ຢ່າງລະອຽດ.
                </p>
                <p className="copy">Copyright © 2025-2026 DOONUNG-MOVIE. All Rights Reserved. | ເບິ່ງໜັງອອນໄລນ໌ຟຣີ</p>
            </footer>
        </>
    );
}
