// Build-time generator for plan #4 item 5: one 1200×630 OG card per title.
// Reads the locally mirrored posters (no network, no external assets) and
// writes public/og/<id>.jpg + a branded default card. public/og/ is gitignored,
// so these files never bloat the repository — npm run build recreates them.
//
// Usage: node scripts/og-images.mjs [--selftest]
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const OG_DIR = path.join(PUBLIC, 'og');
const load = (rel) => import(pathToFileURL(path.join(ROOT, rel)).href);

const { movieDatabase } = await load('src/data/movies.js');
const { posterFor } = await load('src/lib/posters.js');
const { OG_SIZE, OG_DEFAULT } = await load('src/lib/og.js');

async function defaultCard(sharp) {
    const { w, h } = OG_SIZE;
    // SVG text is rendered by libvips/fontconfig — keeps the fallback card
    // on-brand without adding a font or canvas dependency.
    const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
        <rect width="${w}" height="${h}" fill="#0e0e12"/>
        <rect x="0" y="${h - 10}" width="${w}" height="10" fill="#ffcf18"/>
        <text x="${w / 2}" y="${h / 2 - 6}" text-anchor="middle" font-family="Arial, sans-serif" font-size="96" font-weight="bold" fill="#ffcf18">BOENGNANG</text>
        <text x="${w / 2}" y="${h / 2 + 56}" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="#ffffff">WATCH MOVIES ONLINE FREE</text>
    </svg>`);
    await sharp({ create: { width: w, height: h, channels: 3, background: '#0e0e12' } })
        .composite([{ input: svg, top: 0, left: 0 }])
        .jpeg({ quality: 82 })
        .toFile(path.join(OG_DIR, 'default.jpg'));
}

async function main() {
    const { default: sharp } = await import('sharp');
    fs.mkdirSync(OG_DIR, { recursive: true });

    // ogFor() maps every id with a local poster to /og/<id>.jpg, including
    // dead/duplicate pages (those pages still have OG metadata), so generate
    // for every such title — not just the live catalog.
    let done = 0;
    let skipped = 0;
    for (const m of movieDatabase) {
        const poster = posterFor(m);
        if (!poster || poster.startsWith('http')) continue;
        const src = path.join(PUBLIC, poster.slice(1));
        if (!fs.existsSync(src)) { skipped++; continue; }
        try {
            await sharp(src)
                .resize(OG_SIZE.w, OG_SIZE.h, { fit: 'cover', position: 'centre' })
                .jpeg({ quality: 80 })
                .toFile(path.join(OG_DIR, `${m.id}.jpg`));
            done++;
        } catch { skipped++; }
    }
    await defaultCard(sharp);
    console.log(`OG cards: ${done} made, ${skipped} skipped (poster missing), ${OG_DEFAULT} written`);
}

const args = process.argv.slice(2);
if (args.includes('--selftest')) {
    const { default: sharp } = await import('sharp');
    const meta = await sharp({ create: { width: OG_SIZE.w, height: OG_SIZE.h, channels: 3, background: '#000' } }).metadata();
    console.log('OG_SIZE:', JSON.stringify(OG_SIZE), 'sharp:', meta.width + 'x' + meta.height, 'default:', OG_DEFAULT);
    process.exit(0);
}
main().catch((e) => {
    console.error(e);
    process.exit(1);
});
