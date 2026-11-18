// Cross-script search normalization (plan item #1).
// Thai and Lao are closely related languages but use different code points, so
// a Thai query never substring-matches a Lao title (and vice versa). We map
// Lao characters onto their Thai equivalents, lowercase, drop zero-width
// characters and expose a mark-insensitive variant for forgiving matching.
const LAO_TO_THAI = {
    'ກ': 'ก', 'ຂ': 'ข', 'ຄ': 'ค', 'ຆ': 'ฆ', 'ງ': 'ง', 'ຈ': 'จ', 'ຉ': 'ฉ',
    'ຊ': 'ช', 'ຌ': 'ฌ', 'ຍ': 'ย', 'ຎ': 'ญ', 'ຏ': 'ฏ', 'ຐ': 'ฎ',
    'ຑ': 'ฐ', 'ຒ': 'ฑ', 'ຓ': 'ฒ', 'ດ': 'ด', 'ຕ': 'ต', 'ຖ': 'ถ', 'ທ': 'ท', 'ຘ': 'ธ',
    'ນ': 'น', 'ບ': 'บ', 'ປ': 'ป', 'ຜ': 'ผ', 'ຝ': 'ฝ', 'ພ': 'พ', 'ຟ': 'ฟ', 'ຠ': 'ภ',
    'ມ': 'ม', 'ຢ': 'ย', 'ຣ': 'ร', 'ລ': 'ล', 'ວ': 'ว', 'ຫ': 'ห', 'ຬ': 'ฬ', 'ອ': 'อ', 'ຮ': 'ฮ',
    'ະ': 'ะ', 'ັ': 'ั', 'າ': 'า', 'ຳ': 'ำ', 'ິ': 'ิ', 'ີ': 'ี', 'ຶ': 'ึ', 'ື': 'ื',
    'ຸ': 'ุ', 'ູ': 'ู', 'ົ': '็', 'ຼ': 'ล', 'ຽ': 'ย',
    'ເ': 'เ', 'ແ': 'แ', 'ໂ': 'โ', 'ໃ': 'ใ', 'ໄ': 'ไ',
    '່': '่', '້': '้', '໊': '๊', '໋': '๋', '໌': '์', 'ໍ': 'ํ',
    '໐': '0', '໑': '1', '໒': '2', '໓': '3', '໔': '4',
    '໕': '5', '໖': '6', '໗': '7', '໘': '8', '໙': '9',
    'ໜ': 'หน', 'ໝ': 'หม',
};

// Lowercase + NFC + map Lao → Thai + collapse whitespace.
export function normalizeText(input) {
    if (!input) return '';
    let s = String(input).toLowerCase();
    if (typeof s.normalize === 'function') s = s.normalize('NFC');
    s = s.replace(/[\u200B-\u200D\uFEFF]/g, '');
    let out = '';
    for (const ch of s) out += LAO_TO_THAI[ch] || ch;
    return out.replace(/\s+/g, ' ').trim();
}

// Remove Thai/Lao combining marks so "ซอมบี้" also matches "ซอมบี" etc.
export function stripMarks(s) {
    return s.replace(/[ัิีึืุู็์ํ่้๊๋]/g, '');
}

// True when a normalized title matches a normalized query (exact or
// mark-insensitive).
export function titleMatches(title, query) {
    const nq = normalizeText(query);
    if (!nq) return true;
    const nt = normalizeText(title);
    return nt.includes(nq) || stripMarks(nt).includes(stripMarks(nq));
}
