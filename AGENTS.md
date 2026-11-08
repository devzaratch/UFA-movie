# AGENTS.md

## Project overview

- Static, no-build movie streaming site (Thai/Lao audience; user-visible brand is **DOONUNG-MOVIE** — the folder is named `UFA-movie-main` but nothing in the site uses that brand).
- Plain HTML + inline CSS + vanilla JS. **No** package.json, bundler, test suite, or CI. Files ship as-is.
- Deploy target is Cloudflare Pages: `https://doonung-movie.pages.dev` (hardcoded in `robots.txt` and `sitemap.xml`; update both if the domain changes).

## Architecture

- `index.html` — catalog page. Renders `movieDatabase` into a card grid with client-side pagination (18/page), live search (`doSearch()`), and category filter (`filter()`). All logic is in an inline `<script>`. Layout mirrors a reference movie-site design (see "Design language"): top notice bar, header with white pill search, horizontal Oswald nav, a 28-poster top slider, content + right sidebar ("latest" list, category links, promo box), white cards with a gold category bar and red quality ribbon, gold-separated footer.
- `play.html` — detail/player page. Reads `?id=<id>` from the URL, looks the entry up in `movieDatabase`, and initializes ArtPlayer + hls.js (both loaded from CDN) for m3u8 playback. Also sets `document.title`, meta description, JSON-LD schema, runs a 2-slot pre-roll ad system over local MP4s (`mog.mp4`, `lsp.mp4`), builds an episode list for series, and a "related" grid per category.
- `data.js` — the only data store: one global `const movieDatabase = [...]` array containing both movies and series. Add/edit content only here (+ regenerate the sitemap, see below).
- `scripts/generate-sitemap.mjs` — regenerates `sitemap.xml` from `data.js`. Run `node scripts/generate-sitemap.mjs` after any data.js change. It exits with an error if ids are duplicated or entries can't be parsed.

## data.js entry schema (fields are load-bearing; pages read them directly)

- `id`: `"m<n>"` for movies, `"s<n>"` for series. Must be unique — `play.html` uses `Array.find()`, which silently resolves duplicates to the first match. Two duplicate ids (`s9`, `m66`) existed before and were renumbered to `s13`/`m145`; the sitemap generator now fails on duplicates, so this is enforced. Highest existing ids: `m145`, `s13`.
- Movies: `url` = direct m3u8 link. Series: `episodes: [{ title, url }]` and `type: "series"` — `play.html` dereferences `m.episodes[0].url` when `type === "series"`, so a series without a non-empty `episodes` array will crash.
- `category` must be one of: `action` | `horror` | `anime` | `serie` | `drama`. This list is hardcoded in the `index.html` sidebar; adding a category means editing that sidebar too.
- There is **no** `year` field. The sidebar's year links (`index.html?year=2025` etc.) work via `yearOf()` in `index.html`, which parses the release year out of the title — so new entries should keep the `"(YYYY)"` pattern in `title`, and titles without it are invisible to year filters.
- Posters are hotlinked external URLs (Amazon/kapook etc.); ad videos are local files in the repo root.

## SEO (intentional, don't trim)

- The SEO box, footer keyword paragraphs, Lao/Thai mixed metadata, JSON-LD, and `google752c542fc5705f57.html` (Search Console verification) are deliberate traffic strategy — not boilerplate. `<meta name="referrer" content="no-referrer">` on `play.html` hides the site as the HLS referrer; keep it.
- `sitemap.xml` is **generated, not hand-edited**: run `node scripts/generate-sitemap.mjs` — it covers every entry in `data.js` automatically. New titles therefore only need an entry in `data.js` plus one run of the script.

## Design language (keep new pages/components on-theme)

Black background, gold accents `#ffcf18`/`#ffc900`, Arial body text, Oswald for nav/box titles (Google Fonts). Cards are white with the title in black text, fixed at 216px wide, laid out with a centered wrapping flex container (`.movie-grid`), not a stretching CSS grid; a gold bar under the poster shows the category (or `m.rating` if an entry ever gains one) and a red ribbon shows `quality`. Promo/link accent color everywhere: gold, never blue. Year filter links in the nav use the `?year=` param.

## Verifying changes

A dev server is handy for the in-app browser (it rejects `file://`): `node scripts/serve.mjs` (serves the repo root on port 8321). Open `index.html`, check grid/search/filter/pagination/year links, then `play.html?id=<valid id>`.

No build or tests. Open `index.html` directly in a browser (works over `file://` since `data.js` is a plain `<script>` tag, no fetch): check the grid renders, search/filter/pagination work, and `play.html?id=<valid id>` reaches the player.
A failing video stream is usually a dead third-party HLS link, not your change — confirm the m3u8 URL is reachable before assuming a regression.
