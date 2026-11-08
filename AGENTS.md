# AGENTS.md

## Project overview

- Movie streaming site for a Thai/Lao audience; user-visible brand is **DOONUNG-MOVIE** (the old folder name `UFA-movie-main` carries no branding).
- **Astro v5 static site, no server features.** Content lives in one JS module; a build renders 1 catalog page + one `/movie/<slug>/` page per entry (159 pages) plus an auto sitemap.
- Production: Cloudflare Pages at `https://doonung-movie.pages.dev`.
  **Deployment settings (user switches these once in the Pages dashboard):** build command `npx astro build`, output dir `dist`, framework preset "Astro". The old settings (commit root / no build) are obsolete.
- Domain is hardcoded in two connected places: `astro.config.mjs` (`site`) and `public/robots.txt` (Sitemap line). Change both together.

## Commands

- `npm install` (first setup), then:
- `npm run build` — must pass; produces 159 pages + `dist/sitemap-index.xml`. **The page count is a sanity check: 1 + number of entries in data + 0.** If it drops, an entry failed to parse.
- `npm run dev` — dev server (~4321) for quick checks; the in-app browser rejects `file://`, so use dev/preview over http.
- `npm run preview` — serves the built `dist/` for realistic testing.

## Architecture

- `src/data/movies.js` — **the only data store**: `export const movieDatabase = [...]` array of movie and series entries. All content edits happen here, then `npm run build`.
- `src/pages/index.astro` — catalog page. Renders **all cards statically at build time** (they are `<a href="/movie/…/">` links, crawlable). The inline script at the bottom only does client-side pagination (18/page), search (`doSearch()`), category filter (`filter()`, must stay on `window` because it's called from inline `onclick` attributes), and the `?year=` filter.
- `src/pages/movie/[slug].astro` — per-title player page via `getStaticPaths()`. Entry data is injected into the inline script with `define:vars` (no URL-param lookup anymore). Runs ArtPlayer + hls.js (CDN) for m3u8, the 2-slot pre-roll ad system over `public/mog.mp4`/`lsp.mp4`, and static-HTML episode buttons (`data-url`) + related grid (build-time pick of same-category items).
- `src/lib/slug.js` — `slugify()` builds `/movie/<title-without-year>-<id>/` URLs; the `<id>` suffix guarantees uniqueness. `yearOf()` extracts the release year from the `(YYYY)` in the title.
- `src/components/Header.astro` (notice bar + search + nav), `PlayHeader.astro` (player-page header), `Footer.astro` (gold-bordered footer; uses `window.filter()`, so keep that function global).
- `public/` — favicon.png, ad videos, `google752c542fc5705f57.html` (Search Console verification — don't delete), robots.txt.
- `astro.config.mjs` — `@astrojs/sitemap` generates `sitemap-index.xml` on every build. **Never hand-edit sitemaps.**

## data.js entry schema (fields are load-bearing; pages read them directly)

- `id`: `"m<n>"` for movies, `"s<n>"` for series, must be unique (two duplicate ids, `s9`/`m66`, were once hidden state bugs — renumbered to `s13`/`m145`). Highest existing ids: `m145`, `s13`. New entries take the next number.
- Movies: `url` = direct m3u8 link. Series: `type: "series"` and non-empty `episodes: [{ title, url }]` — a series with an empty `episodes` array has a runtime fallback (`type` flipped to `movie`), so it silently plays nothing instead of crashing; don't rely on it.
- `category` must be one of: `action` | `horror` | `anime` | `serie` | `drama`. Hardcoded in the nav (`Header.astro`), sidebar (`index.astro`), and category-label map duplicated in both pages — update all if adding a category.
- No `year` field: it is parsed from the title. **Keep the `"(YYYY)"` pattern in `title`** or the entry becomes invisible to `?year=` filters.
- `rating` is optional — the gold bar shows it as "IMDb: x.x" when present, otherwise the category label.
- Posters are hotlinked external URLs; they may die independently of your changes. Ad videos are local files in `public/`.

## Design language (keep new pages/components on-theme)

Black background, gold accents `#ffcf18`/`#ffc900`, Arial body text, Oswald for nav/box titles (Google Fonts). Cards are white (catalog) or dark (related grid), title in black/hidden text, fixed 216px wide, centered wrapping flex (`.movie-grid`), gold bar under the poster, red ribbon with `quality`. Accents are gold, never blue. The layout closely mirrors a well-known Thai movie-site layout but intentionally keeps DOONUNG-MOVIE branding, its own logo, and originally-written SEO copy — do not paste copy or assets from other sites.

## SEO (intentional, don't trim)

- SEO box, footer keyword paragraphs, Lao/Thai mixed copy, per-page JSON-LD (`TVSeries`/`Movie`) on title pages, `<meta name="referrer" content="no-referrer">` on title pages — deliberate traffic strategy. Don't trim.
- The homepage renders all 158 cards statically; keep it that way (that's the SEO point of the migration).
- `robots.txt` points to `/sitemap-index.xml` (generated). Domain change = update `astro.config.mjs` + `public/robots.txt`, then rebuild.
- What's crawled: `/movie/<slug>/` new URLs. The old `play.html?id=x` URLs will 404 after cutover; a Cloudflare Pages redirect rule `_redirects` (`/play.html?id=m1 /movie/<slug>/ 301`) would preserve them — request it from the user before deploying if indexation matters.

## Verifying changes

- `npm run build` passes + page count still equals 1 + entries.
- `npm run preview`, then check: catalog (cards, search/filter/pagination, `?year=2024`), one movie page and one series page (`class="ep-btn"` count matches episodes), JSON-LD type, and player init code present in the page.
- A failing video stream is a dead third-party HLS link, not your change — check the m3u8 URL separately before assuming a regression.
