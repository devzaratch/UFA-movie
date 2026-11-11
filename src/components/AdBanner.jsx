// Wide banner slot, shared between the homepage and title pages.
// Currently filled with the member promo; to run a different ad network later,
// replace the inner content with their <script>/<iframe> markup and keep the
// .ad-banner wrapper for styling.
export default function AdBanner() {
    return (
        <a className="ad-banner" href="https://ufasboclubauto.com/register" target="_blank" rel="noreferrer">
            <span className="ab-title">ສະໝັກສະມາຊິກຟຣີ (สมัครสมาชิกฟรี)</span>
            <span className="ab-sub">ຮັບໜັງຄົມຊັດ HD ເຕັມເລື່ອງ ພາກໄທ/ພາກລາວ ອັບເດດທຸກມື້ (รับหนังคมชัด HD เต็มเรื่อง อัปเดตทุกวัน)</span>
        </a>
    );
}
