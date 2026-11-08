# AGENTS.md

## Project overview

- Movie streaming site for a Thai/Lao audience; user-visible brand is **DOONUNG-MOVIE** (the old folder name `UFA-movie-main` carries no branding).
- **Next.js 15 (App Router), fully static export, no server features.** `next.config.mjs` sets `output: 'export'`, `trailingSlash: true`, `images.unoptimized`. A build emits `out/` with 1 catalog page + one `/movie/<slug>/` page per entry (159 pages total) + `out/sitemap.xml`.
- Production: Cloudflare Pages at `https://doonung-movie.pages.dev`.
  **Deployment settings:** build command `npx next build`, output dir `out`, framework preset — none/"other" (Static). Do NOT use the old settings (commit root / no build / Astro preset).
- Domain is hardcoded in two connected places: `src/app/sitemap.js` (`SITE`) and `public/robots.txt` (Sitemap line). Change both together.

## Commands

- `npm install` (first setup), then:
- `npm run build` — must pass; produces `out/` with 158 `out/movie/<slug>/index.html` pages + `out/sitemap.xml`. Sanity checks: `out/movie` folder count = entries in data, sitemap `<url>` count = entries + 1.
- `npm run dev` — dev server (~3000) for quick checks; the in-app browser rejects `file://`, so use dev/preview over http.
- `node scripts/verify-build.mjs` — after every build: checks the homepage HTML (158 cards prerendered, 140 hidden = pagination boundary), sitemap URLs, and 3 sample title pages (JSON-LD type, related cards, player/ad cues, episode buttons for the series sample).
- `npm run preview` is next's own preview of a running server build — for this static output prefer `npx http-server out` or any static file server.

## Architecture

- `src/data/movies.js` — **the only data store**: `export const movieDatabase = [...]` array of movie and series entries. All content edits happen here, then `npm run build`.
- `src/app/layout.jsx` — root layout (metadata, font-awesome + Oswald font links, globals.css).
- `src/app/page.jsx` — catalog page. Renders **all cards statically at build time** inside a server component (they are `<a href="/movie/…/">` links, crawlable — that's the SEO point; keep it that way). `top-slider`, sidebar (latest + categories + member promo) render server-side too.
- `src/components/HomeGrid.jsx` — `'use client'`; only toggles the already-rendered cards (`card-hide` class) for search, category, year and pagination. Reads `?cat=` / `?year=` from `window.location.search` **once on mount**. **Never use `useSearchParams()`** — it forces a Suspense fallback shell in static export and the cards vanish from the HTML.
- `src/app/movie/[slug]/page.jsx` — per-title page via `generateStaticParams()` + `generateMetadata()`. Lookup uses `findMovie()` which tries exact/`decodeURIComponent`/`encodeURI`/NFC-normalized variants and finally the `-m<n>`/`-s<n>` id suffix (slugify always appends the id). Page has a top title-bar (title + `หน้าแรก > ดูหนัง... > category > quality` breadcrumb, server-rendered links), then content + right sidebar layout (`.movie-layout`; sidebar = categories + recent-related promo). Player runs ArtPlayer + hls.js (CDN, loaded client-side via `Player.jsx`), the 2-slot pre-roll ad system (`public/mog.mp4`/`lsp.mp4` with skip timer), per-page JSON-LD (`Movie`/`TVSeries`), and a build-time related grid (same category, `.rel-card` class). Episode buttons render as gold-tab style (`.ep-tabs`/`.ep-btn`); `PlayHeader.jsx` exists but is currently unused.
- `src/lib/slug.js` — `slugify(id, title)` builds `/movie/<title-without-year>-<id>/` URLs (regex keeps Thai/Lao letters+marks+numbers); the `<id>` suffix guarantees uniqueness. `yearOf()` extracts the release year from the `(YYYY)` in the title.
- `src/lib/categories.js` — shared `CATEGORY_LABEL` map.
- `src/components/Header.jsx` (notice bar + `SearchBox` + nav; nav/footer links are plain `<a>` full navigations), `SearchBox.jsx` (dispatches `CustomEvent('dm:search')`), `Footer.jsx`, `PlayHeader.jsx` (player-page header).
- `public/` — favicon.png, ad videos, `google752c542fc5705f57.html` (Search Console verification — don't delete), robots.txt.
- `next.config.mjs` — export config; don't add server features without revisiting deploy.

## data.js entry schema (fields are load-bearing; pages read them directly)

- `id`: `"m<n>"` for movies, `"s<n>"` for series, must be unique. Highest existing ids: `m145`, `s13`. New entries take the next number.
- Movies: `url` = direct m3u8 link. Series: `type: "series"` and non-empty `episodes: [{ title, url }]` — a series with an empty `episodes` array has a runtime fallback (`type` flipped to `movie` in `Player.jsx`), so it silently plays nothing instead of crashing; don't rely on it.
- `category` must be exactly one of: `action` | `horror` | `anime` | `serie` | `drama`. Hardcoded in the nav (`Header.jsx`), sidebar (`page.jsx`), and the `CATEGORY_LABEL` map — update all if adding a category.
- No `year` field: it is parsed from the title. **Keep the `"(YYYY)"` pattern in `title`** or the entry becomes invisible to `?year=` filters.
- `rating` is optional — the gold bar shows it as "IMDb: x.x" when present, otherwise the category label.
- Posters are hotlinked external URLs; they may die independently of your changes.

## Design language (keep new pages/components on-theme)

Black background, gold accents `#ffcf18`/`#ffc900`, Arial body text, Oswald for nav/box titles (Google Fonts). Header: big logo left, white pill search center, social icons right, centered nav row. Catalog cards are dark panels (`.card`, `#181a1f`) with a **white** IMDb/rating bar (black text) and **white** title, red ribbon, 252px wide, centered wrapping flex (`.movie-grid` — center + stacked rows like the reference). Related grid shares the same dark style. Accents are gold, never blue. The layout closely mirrors a well-known Thai movie-site layout but intentionally keeps DOONUNG-MOVIE branding, its own logo, and originally-written SEO copy — do not paste copy, logos or ad assets from other sites. Below ~900px the sidebars hide and cards go ~46% width.

## SEO (intentional, don't trim)

- SEO box, footer keyword paragraphs, Lao/Thai mixed copy, per-page JSON-LD (`TVSeries`/`Movie`), `<meta name="referrer" content="no-referrer">` on title pages — deliberate traffic strategy. Don't trim.
- The homepage renders all 158 cards statically; keep it that way.
- `robots.txt` points to `/sitemap.xml` (generated by `src/app/sitemap.js` — sitemap as route handler output, never hand-edit the output file). Domain change = update `sitemap.js` `SITE` + `public/robots.txt`, then rebuild.
- What's crawled: `/movie/<slug>/` new URLs. The old `play.html?id=x` URLs will 404 after cutover; a Cloudflare Pages redirect rule `_redirects` would preserve them — only add if indexation of old URLs matters.

## Verifying changes

- `npm run build` passes + counts match, then `node scripts/verify-build.mjs` (all green).
- Static server (`npx http-server out`), then check: catalog (cards, search via the `dm:search` event, `?cat=`, `?year=`, pagination pages), one movie page and one series page (ep buttons, JSON-LD type, player ad cues).
- Console errors about failed poster/video hosts are external hotlinks — check before assuming a regression.
- Windows console mangles Thai/Lao text; never judge encoding from console output — read files with node/fs (e.g. `scripts/verify-build.mjs`).
