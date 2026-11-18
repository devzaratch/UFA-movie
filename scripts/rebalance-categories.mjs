// Category rebalancer (plan item #4).
// The catalog had 4,055 of 5,046 titles in "action" (80%) because action is the
// default bucket, which makes the horror/anime/drama pages nearly empty and
// makes ?cat= landing pages useless for SEO.
//
// This script never touches movies.js. It writes
//   src/data/category-overrides.js   { id: 'horror' | 'anime' | 'drama' }
// and the site applies it through lib/category.js, so the move is reversible
// (delete the file / re-run with --reset) and reviewable in one small diff.
//
// Rules are deliberately conservative: a title only moves when it matches a
// strong keyword AND no comedy/series exclusion applies. Action stays the
// default bucket for everything we are not sure about.
//
// Usage:
//   node scripts/rebalance-categories.mjs            # write overrides
//   node scripts/rebalance-categories.mjs --dry      # preview only
//   node scripts/rebalance-categories.mjs --reset    # empty overrides
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeText, stripMarks } from '../src/lib/search.js';
import { movieDatabase } from '../src/data/movies.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'src', 'data', 'category-overrides.js');
const dry = process.argv.includes('--dry');
const reset = process.argv.includes('--reset');

const ANIME = [
    'อนิเมะ', 'อนิเม', 'การ์ตูน', 'anime', 'animation', 'ghibli',
    'doraemon', 'โดราเอมอน', 'pokemon', 'โปเกมอน', 'digimon', 'digimon adventure',
    'one piece', 'naruto', 'boruto', 'bleach', 'dragon ball', 'dragonball',
    'demon slayer', 'kimetsu', 'jujutsu kaisen', 'attack on titan', 'shingeki',
    'my hero academia', 'boku no hero', 'spy x family', 'chainsaw man',
    'solo leveling', 'sword art online', 'tokyo ghoul', 'evangelion',
    'detective conan', 'ยอดนักสืบจิ๋วโคนัน', 'โคนัน',
    'slam dunk', 'saint seiya', 'sailor moon', 'sailormoon', 'hunter x hunter',
    'fullmetal alchemist', 'death note', 'blue lock',
    'haikyu', 'haikyuu', 'vinland saga', 'mob psycho', 'fire force',
];

const HORROR = [
    'ผี', 'สยอง', 'หลอน', 'อาถรรพ์', 'คำสาป', 'ซอมบี้', 'ผีดิบ', 'ปีศาจ',
    'วิญญาณ', 'ยมทูต',
    'horror', 'haunt', 'zombie', 'exorcis', 'conjuring', 'scream', 'ghost',
    'annabelle', 'insidious', 'sinister', 'evil dead', 'halloween kills',
    'the nun', 'possess', 'poltergeist', 'cannibal', 'slasher', 'bloodbath',
];

const DRAMA = [
    'โรแมนติก', 'romance', 'love story', 'รักแท้', 'ความรัก',
    'รักครั้ง', 'รักสุดท้าย', 'รักนี้', 'น้ำตา',
    'titanic', 'the notebook', 'fault in our stars',
];

// Comedy / family titles that would otherwise be pulled into horror by "ผี".
const NOT_HORROR = ['ตลก', 'ป่วน', 'ฮา', 'comedy', 'funny', 'family', 'addams'];
// Action signals: keep these in action even if the title mentions ghosts/hell.
const NOT_HORROR_ACTION = ['บู๊', 'ระห่ำ', 'แอ็คชั่น', 'action', 'ซัด', 'ลุย', 'ล่าล้าง', 'john wick', 'fast', 'mission impossible'];

const norm = (t) => normalizeText(t);

function classify(m) {
    if (m.category === 'serie') return null;              // series stay series
    const t = norm(m.title);
    const hits = (words) => words.some((w) => t.includes(norm(w)));

    // 1) anime wins over everything (Demon Slayer is anime, not horror)
    if (m.category !== 'anime' && hits(ANIME)) return 'anime';
    // 2) horror, unless the title is clearly a comedy
    if (m.category !== 'horror' && hits(HORROR) && !hits(NOT_HORROR) && !hits(NOT_HORROR_ACTION)) return 'horror';
    // 3) drama / romance
    if (m.category !== 'drama' && hits(DRAMA)) return 'drama';
    return null;
}

if (reset && !dry) {
    writeFileSync(OUT, header(0) + 'export const CATEGORY_OVERRIDES = {};\n', 'utf8');
    console.log('overrides reset');
    process.exit(0);
}

const overrides = {};
const samples = { horror: [], anime: [], drama: [] };
for (const m of movieDatabase) {
    const c = classify(m);
    if (!c) continue;
    overrides[m.id] = c;
    if (samples[c].length < 8) samples[c].push(`${m.title.slice(0, 46)}`);
}
const moves = Object.values(overrides).reduce((a, c) => ((a[c] = (a[c] || 0) + 1), a), {});

console.log('moves:', JSON.stringify(moves), '| total:', Object.keys(overrides).length);
for (const k of Object.keys(samples)) {
    console.log(`  ${k}: ${samples[k].join(' | ')}`);
}
const before = {};
const after = {};
for (const m of movieDatabase) {
    before[m.category] = (before[m.category] || 0) + 1;
    const c = overrides[m.id] || m.category;
    after[c] = (after[c] || 0) + 1;
}
console.log('before:', JSON.stringify(before));
console.log('after: ', JSON.stringify(after));

if (dry) {
    console.log('(dry run — nothing written)');
    process.exit(0);
}

const body = Object.entries(overrides)
    .sort(([a], [b]) => a.localeCompare(b, 'en', { numeric: true }))
    .map(([id, cat]) => `    '${id}': '${cat}',`)
    .join('\n');
writeFileSync(OUT, header(Object.keys(overrides).length) + `export const CATEGORY_OVERRIDES = {\n${body}\n};\n`, 'utf8');
console.log(`wrote ${Object.keys(overrides).length} overrides to src/data/category-overrides.js`);

function header(n) {
    return '// AUTO-GENERATED by scripts/rebalance-categories.mjs — do not edit by hand.\n'
        + '// Category corrections for entries that were parked in the default "action"\n'
        + '// bucket but are clearly horror / anime / drama by title. Applied through\n'
        + '// src/lib/category.js so movies.js stays untouched and this is reversible.\n'
        + `// Last run: ${new Date().toISOString()} (${n} overrides)\n`;
}
