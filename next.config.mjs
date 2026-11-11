/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fully static export: every route becomes a real index.html in out/
    // Deploy target: Vercel (auto-detects Next.js)
    output: 'export',
    trailingSlash: true,      // keep /movie/<slug>/ style URLs like before
    images: { unoptimized: true }, // posters are hotlinked externals; no server needed
    // NOTE: legacy /play.html?id=<id> URLs are handled by a generated static
    // play.html (scripts/gen-play-redirect.mjs, run after build) — per-entry
    // config redirects exceed Vercel's 2048-route limit.
};

export default nextConfig;
