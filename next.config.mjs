/** @type {import('next').NextConfig} */
const nextConfig = {
    // Fully static export: every route becomes a real index.html in out/
    // Deploy target: Cloudflare Pages -> build command "npx next build", output dir "out"
    output: 'export',
    trailingSlash: true,      // keep /movie/<slug>/ style URLs like before
    images: { unoptimized: true }, // posters are hotlinked externals; no server needed
};

export default nextConfig;
