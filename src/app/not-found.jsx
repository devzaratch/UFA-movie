// Static 404 page: exported as out/404.html (Vercel serves it for unknown routes).
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';

export const metadata = {
    title: 'ບໍ່ພົບໜ້າ (404) | BOENGNANG',
    description: 'ໜ້າທີ່ຄົ້ນຫາບໍ່ມີຢູ່ໃນ BOENGNANG (หน้าที่ค้นหาไม่มีอยู่ใน BOENGNANG)',
};

export default function NotFound() {
    return (
        <>
            <Header />
            <main className="notfound">
                <div className="nf-code">404</div>
                <h1>ບໍ່ພົບໜ້າທີ່ຄົ້ນຫາ (ไม่พบหน้าที่ค้นหา)</h1>
                <p>
                    ໜ້ານີ້ອາດຖືກຍ້າຍ ຫຼື ລຶບໄປແລ້ວ — ລອງຄົ້ນຫາໜັງທີ່ຢາກເບິ່ງຈາກໜ້າຫຼັກອີກເທື່ອ
                    (หน้านี้อาจถูกย้ายหรือลบไปแล้ว — ลองค้นหาหนังที่ต้องการดูจากหน้าแรกอีกครั้ง)
                </p>
                <a className="nf-btn" href="/">ກັບໜ້າຫຼັກ (กลับหน้าแรก)</a>
            </main>
            <Footer />
        </>
    );
}
