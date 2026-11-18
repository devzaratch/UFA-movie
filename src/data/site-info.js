// Site-wide contact details. Fill in a real address to enable the e-mail links
// on /contact/ and /privacy/ (they stay hidden while empty).
export const SITE_INFO = {
    brand: 'BOENGNANG',
    email: '',            // e.g. 'contact@yourdomain.com'
    telegram: '',         // e.g. 'https://t.me/yourchannel'
    facebook: '',         // e.g. 'https://facebook.com/yourpage'
};

// Cloudflare Worker (stream-proxy/worker.js): stream proxy + broken-link
// reports under the same origin.
export const WORKER_BASE = 'https://boengnang-stream.phonthebtilavun25599.workers.dev';
