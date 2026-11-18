// Analysis helper for plan item #4: how far can we rebalance categories safely?
import { normalizeText, stripMarks } from '../src/lib/search.js';
import { movieDatabase } from '../src/data/movies.js';

const cats = {};
for (const m of movieDatabase) cats[m.category] = (cats[m.category] || 0) + 1;
console.log('categories:', JSON.stringify(cats));

// type vs category mismatch
const typeMismatch = movieDatabase.filter((m) => (m.type === 'series') !== (m.category === 'serie'));
console.log('type/category mismatch:', typeMismatch.length);
console.log('  sample:', typeMismatch.slice(0, 8).map((m) => `${m.id}:${m.type || 'movie'}/${m.category}:${m.title.slice(0, 40)}`).join(' | '));

// how many non-serie entries have episodes?
const epButNotSerie = movieDatabase.filter((m) => m.category !== 'serie' && Array.isArray(m.episodes) && m.episodes.length > 1);
console.log('multi-episode entries outside serie:', epButNotSerie.length);

const has = (t, words) => words.some((w) => t.includes(w));

const HORROR = ['ผี', 'สยอง', 'หลอน', 'อาถรรพ์', 'คำสาป', 'ซอมบี้', 'ผีดิบ', 'ปีศาจ', 'วิญญาณ', 'horror', 'haunt', 'zombie', 'exorcist', 'conjuring', 'scream', 'ghost', 'demon', 'possess', 'evil dead', 'annabelle', 'insidious', 'sinister', 'saw', 'smile'];
const ANIME = ['อนิเมะ', 'อนิเม', 'การ์ตูน', 'anime', 'animation', 'studio ghibli', 'ghibli', 'demon slayer', 'one piece', 'naruto', 'doraemon', 'โดราเอมอน', 'โปเกมอน', 'pokemon', 'jujutsu', 'attack on titan', 'spy x family', 'chainsaw man', 'my hero academia', 'solo leveling'];
const DRAMA = ['ดราม่า', 'ดรามา', 'โรแมนติก', 'romance', 'love story', 'รัก', 'tears', 'melodrama'];

const hor = [], ani = [], dra = [];
for (const m of movieDatabase) {
    if (m.category === 'serie') continue;
    const t = stripMarks(normalizeText(m.title));
    if (m.category !== 'horror' && has(t, HORROR.map(stripMarks))) hor.push(m);
    else if (m.category !== 'anime' && has(t, ANIME.map(stripMarks))) ani.push(m);
    else if (m.category !== 'drama' && has(t, DRAMA.map(stripMarks))) dra.push(m);
}
console.log(`keyword candidates: horror ${hor.length}, anime ${ani.length}, drama ${dra.length}`);
console.log('horror sample:', hor.slice(0, 6).map((m) => m.title.slice(0, 40)).join(' | '));
console.log('anime sample:', ani.slice(0, 6).map((m) => m.title.slice(0, 40)).join(' | '));

// year spread (are titles in ?year= filters usable?)
const years = {};
for (const m of movieDatabase) {
    const y = (m.title.match(/\((\d{4})\)/) || [])[1];
    years[y] = (years[y] || 0) + 1;
}
const top = Object.entries(years).sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log('top years:', JSON.stringify(top));
console.log('no year:', years.undefined || 0);
