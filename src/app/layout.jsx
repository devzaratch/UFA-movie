import './globals.css';

export const metadata = {
    title: 'BOENGNANG ເບິ່ງໜັງອອນໄລນ໌ຟຣີ ดูหนังออนไลน์ฟรี หนังใหม่ 2025 HD',
    description: 'BOENGNANG ເວັບເບິ່ງໜັງອອນໄລນ໌ຟຣີ ລວມໜັງໃຝ່ 2025 ຄົມຊັດລະດັບ HD ເຕັມເລື່ອງ ມີທັງໜັງແອັກຊັນ ໜັງຜີ ໜັງຮັກ ແລະ ກາຕູນ ອັບເດດໃໝ່ທຸກມື້',
    keywords: ['ເບິ່ງໜັງອອນໄລນ໌', 'ໜັງໃຝ່ 2025', 'ເບິ່ງໜັງຟຣີ', 'BOENGNANG', 'ดูหนังออนไลน์', 'หนังใหม่ 2025', 'ดูหนังฟรี'],
    openGraph: {
        title: 'BOENGNANG | ເບິ່ງໜັງອອນໄລນ໌ຟຣີ 2025',
        description: 'ລວມໜັງໃຝ່ຊົນໂຮງ ແລະ ຊີລີ້ດັງ ພາກໄທ HD',
        images: ['/favicon.png'],
    },
    icons: { icon: '/favicon.png' },
};

export default function RootLayout({ children }) {
    return (
        <html lang="th">
            <body>
                {/* React hoists these stylesheet/font links to <head> */}
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
                <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&display=swap" rel="stylesheet" />
                {children}
            </body>
        </html>
    );
}
