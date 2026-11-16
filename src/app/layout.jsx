import { Analytics } from '@vercel/analytics/react';
import { SITE } from './sitemap.js';
import './globals.css';

export const metadata = {
    metadataBase: new URL(SITE),
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
                {/* React hoists these link/meta tags to <head>.
                    preconnect to every third-party origin we load resources from
                    (fonts, icons, player CDNs) — saves a full DNS+TLS roundtrip
                    on slow mobile connections. */}
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
                <link rel="preconnect" href="https://cdn.jsdelivr.net" />
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" />
                <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600&display=swap" rel="stylesheet" />
                {children}
                {/* Vercel Analytics (privacy-friendly, no cookie banner needed) */}
                <Analytics />
            </body>
        </html>
    );
}
