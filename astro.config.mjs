import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
    // must match the domain in public/robots.txt; update both together
    site: 'https://doonung-movie.pages.dev',
    integrations: [sitemap()],
});
