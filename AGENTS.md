# AGENTS.md

## Project overview

- Movie streaming site for a Thai/Lao audience; user-visible brand is **BOENGNANG** (the old folder name `UFA-movie-main` carries no branding).
- **Next.js 15 (App Router), fully static export, no server features.** `next.config.mjs` sets `output: 'export'`, `trailingSlash: true`, `images.unoptimized`. A build emits `out/` with 1 catalog page + one `/movie/<slug>/` page per entry (159 pages total) + `out/sitemap.xml`.
- Production: **Vercel at `https://boengnang.vercel.app`** (the old Cloudflare Pages URL `doonung-movie.pages.dev` is retired).
  **Deployment settings:** Vercel auto-detects Next.js — no build command/output overrides needed. Keep the domain in sync with `SITE` in `src/app/sitemap.js` and the Sitemap line in `public/robots.txt` (update both together).
- Domain is hardcoded in two connected places: `src/app/sitemap.js` (`SITE`) and `public/robots.txt` (Sitemap line). Change both together.

## Commands

- `npm install` (first setup), then:
- `npm run build` — must pass; produces `out/` with 158 `out/movie/<slug>/index.html` pages + `out/sitemap.xml`. Sanity checks: `out/movie` folder count = entries in data, sitemap `<url>` count = entries + 1.
- `npm run dev` — dev server (~3000) for quick checks; the in-app browser rejects `file://`, so use dev/preview over http.
- `node scripts/verify-build.mjs` — after every build: checks the homepage HTML (158 cards prerendered, 140 hidden = pagination boundary), sitemap URLs, and 3 sample title pages (JSON-LD type, related cards, player/ad cues, episode buttons for the series sample).
- `npm run preview` is next's own preview of a running server build — for this static output prefer `npx http-server out` or any static file server.
- `npm run validate:data` — dataset validator (`scripts/validate-data.mjs`): duplicate ids, unknown category, series without episodes, missing url, title without `(YYYY)`, bad rating. Errors exit 1; warnings only report (`--strict` fails on warnings too). Runs in CI before the build.
- `npm run dedupe` — regenerates `src/data/duplicates.js` from duplicate titles (alive stream first, then smaller id wins).
- `npm run ratings` — fills `src/data/ratings.js` from TMDB (`TMDB_READ_TOKEN` or `TMDB_API_KEY` in env or `.env.local`). Flags: `--selftest` (no key needed), `--dry`, `--force`, `--limit N`. Without a key the site keeps showing the category label on the card bar.
- `node scripts/rebalance-categories.mjs [--dry|--reset]` — regenerates `src/data/category-overrides.js` (keyword rules; `--dry` only prints, `--reset` empties it).
- `node scripts/mirror-posters.mjs [--fresh]` — mirrors playable titles' posters into `public/posters/` and regenerates `src/data/posters-local.js`.
- `node scripts/analyze-categories.mjs` — read-only health report (category spread, year spread, type/category mismatches).
- `.github/workflows/ci.yml` runs validate + build + verify on every push/PR; `.github/workflows/check-links.yml` refreshes link health daily and commits `dead-links.js`.

## Architecture

- `src/data/movies.js` — **the only data store**: `export const movieDatabase = [...]` array of movie and series entries. All content edits happen here, then `npm run build`.
- `src/app/layout.jsx` — root layout (metadata, font-awesome + Oswald font links, globals.css).
- `src/app/page.jsx` — catalog page. Renders **all cards statically at build time** inside a server component (they are `<a href="/movie/…/">` links, crawlable — that's the SEO point; keep it that way). `top-slider`, sidebar (latest + categories + member promo) render server-side too.
- `src/components/HomeGrid.jsx` — `'use client'`; only toggles the already-rendered cards (`card-hide` class) for search, category, year and pagination. Reads `?cat=` / `?year=` from `window.location.search` **once on mount**. **Never use `useSearchParams()`** — it forces a Suspense fallback shell in static export and the cards vanish from the HTML.
- `src/app/movie/[slug]/page.jsx` — per-title page via `generateStaticParams()` + `generateMetadata()`. Lookup uses `findMovie()` which tries exact/`decodeURIComponent`/`encodeURI`/NFC-normalized variants and finally the `-m<n>`/`-s<n>` id suffix (slugify always appends the id). Page has a top title-bar (title + `หน้าแรก > ดูหนัง... > category > quality` breadcrumb, server-rendered links), then content + right sidebar layout (`.movie-layout`; sidebar = categories + recent-related promo). Player runs ArtPlayer + hls.js (CDN, loaded client-side via `Player.jsx`), the 2-slot pre-roll ad system (`public/mog.mp4`/`lsp.mp4` with skip timer), per-page JSON-LD (`Movie`/`TVSeries`), and a build-time related grid (scored by `lib/related.js`, `.rel-card` class). Episode buttons render as gold-tab style (`.ep-tabs`/`.ep-btn`); `PlayHeader.jsx` exists but is currently unused.
- `src/lib/slug.js` — `slugify(id, title)` builds `/movie/<title-without-year>-<id>/` URLs (regex keeps Thai/Lao letters+marks+numbers); the `<id>` suffix guarantees uniqueness. `yearOf()` extracts the release year from the `(YYYY)` in the title.
- `src/lib/catalog.js` — the catalog list (newest first, dead links + duplicates removed) used by the homepage, `/page/N/` and the sitemap. `src/lib/paging.js` holds `PER_PAGE`/`pageItems`/`pageHref` with **no data imports** so client components don't pull in the 3MB DB.
- `src/app/page/[n]/page.jsx` — static `/page/2/` … `/page/<last>/` (24 cards, own metadata, `rel=prev/next`, real links); page 1 is the homepage, which still renders every card.
- `src/lib/related.js` — scored related titles (category + shared title words across Thai/Lao + year proximity + type + rating; dead/duplicate titles excluded).
- `src/lib/rating.js` + `src/data/ratings.js` — `ratingOf(m)` reads the entry's own rating, else the TMDB map, else 0 (card shows the category label).
- `src/lib/categories.js` — shared `CATEGORY_LABEL` map.
- `src/lib/search.js` — cross-script search: Lao→Thai character map + `normalizeText()` + mark-insensitive `stripMarks()`. Used by `HomeGrid` (two-level index), `scripts/validate-data.mjs`, `scripts/dedupe-titles.mjs`.
- `src/lib/posters.js` — `posterFor(m)` returns the mirrored `/posters/<id>.<ext>` when available (from `src/data/posters-local.js`, generated by `scripts/mirror-posters.mjs`) and falls back to the external URL.
- `src/lib/category.js` — `categoryOf(m)` applies `src/data/category-overrides.js` (generated by `scripts/rebalance-categories.mjs`) so category fixes never edit the 3MB `movies.js`.
- `src/lib/site.js` — `SITE_URL` for client components (importing `app/sitemap.js` would drag the whole title DB into the browser bundle).
- `src/data/duplicates.js` — `DUPLICATE_TO_CANONICAL` (generated by `scripts/dedupe-titles.mjs`): duplicate pages stay online but their canonical/OG point at the main entry, and they are excluded from the homepage + sitemap.
- `src/data/ads.js` — every ad/campaign setting (master switch, skip seconds, weighted slots with `enabled`/`from`/`to`, `PROMO` for the banner). Player and AdBanner read only this file.
- `src/data/site-info.js` — contact channels (`SITE_INFO`, hidden while empty) + `WORKER_BASE` for the Cloudflare Worker.
- `src/components/ReportButton.jsx` (`POST {WORKER_BASE}/report` → KV), `ShareRow.jsx` (LINE/FB/copy), `BottomNav.jsx` (mobile tabs).
- `src/app/privacy/page.jsx`, `src/app/contact/page.jsx` — static legal pages (ads.txt lives in `public/ads.txt`).
- `src/components/Header.jsx` (notice bar + `SearchBox` + nav; nav/footer links are plain `<a>` full navigations), `SearchBox.jsx` (debounced 180ms, dispatches `CustomEvent('dm:search')`), `Footer.jsx`, `PlayHeader.jsx` (player-page header).
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

Black background, gold accents `#ffcf18`/`#ffc900`, Arial body text, Oswald for nav/box titles (Google Fonts). Header: big logo left, white pill search center, social icons right, centered nav row. Catalog cards are dark panels (`.card`, `#181a1f`) with a **white** IMDb/rating bar (black text) and **white** title, red ribbon, 252px wide, centered wrapping flex (`.movie-grid` — center + stacked rows like the reference). Related grid shares the same dark style. Accents are gold, never blue. The layout closely mirrors a well-known Thai movie-site layout but intentionally keeps BOENGNANG branding, its own logo, and originally-written SEO copy — do not paste copy, logos or ad assets from other sites. Below ~900px the sidebars hide and cards go ~46% width.

## SEO (intentional, don't trim)

- SEO box, footer keyword paragraphs, Lao/Thai mixed copy, per-page JSON-LD (`TVSeries`/`Movie`), `<meta name="referrer" content="no-referrer">` on title pages — deliberate traffic strategy. Don't trim.
- The homepage renders every playable card statically (newest first, ~1,770); keep it that way.
- `robots.txt` points to `/sitemap.xml` (generated by `src/app/sitemap.js` — sitemap as route handler output, never hand-edit the output file). The sitemap lists only playable, non-duplicate titles plus `/page/N/`; dead links stay online with `noindex`. Domain change = update `sitemap.js` `SITE` + `public/robots.txt`, then rebuild.
- What's crawled: `/movie/<slug>/` new URLs. The old `play.html?id=x` URLs will 404 after cutover; a Vercel redirect (`redirects` in next.config.mjs works with static export too) would preserve them — only add if indexation of old URLs matters.

## Verifying changes

- `npm run build` passes + counts match, then `node scripts/verify-build.mjs` (all green).
- Static server (`npx http-server out`), then check: catalog (cards, search via the `dm:search` event, `?cat=`, `?year=`, pagination pages), one movie page and one series page (ep buttons, JSON-LD type, player ad cues).
- Console errors about failed poster/video hosts are external hotlinks — check before assuming a regression.
- Windows console mangles Thai/Lao text; never judge encoding from console output — read files with node/fs (e.g. `scripts/verify-build.mjs`).
