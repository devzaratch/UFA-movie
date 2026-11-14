// BOENGNANG stream proxy — Cloudflare Worker
// Injects the Referer/Origin the upstream stream hosts require, and rewrites
// HLS playlists so every child playlist / segment / key also goes through us.
// Usage:  https://<worker>/stream/?u=<urlencoded m3u8 or segment url>

const ALLOWED_HOSTS = new Set([
    'vdohls.com',
    'master.streamhls.com',
    'master.steamhls88.com',
    'online225.com',
    'bdbx5i74v8f9pk2i.010014.xyz',
    'playerufa2.com',
]);

// Referer the upstream hosts accept (observed 200 OK from this origin).
const UP_REFERER = 'https://player77hdfree.xyz/';
const UP_ORIGIN = 'https://player77hdfree.xyz';
const UP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Range',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Range',
};

function json(err, status) {
    return new Response(JSON.stringify({ error: err }), {
        status,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
}

function isAllowedHost(hostname) {
    if (ALLOWED_HOSTS.has(hostname)) return true;
    // segment shards of the vdohls network: vh001.xyz … vhNNN.xyz
    return /^vh\d+\.xyz$/.test(hostname);
}

function isAllowed(u) {
    try {
        const p = new URL(u);
        return (p.protocol === 'https:' || p.protocol === 'http:') && isAllowedHost(p.hostname);
    } catch {
        return false;
    }
}

function proxied(absUrl, base) {
    return base + '?u=' + encodeURIComponent(absUrl);
}

// Rewrite an HLS playlist: wrap every URI (segments, child playlists, keys,
// maps) so they loop back through this worker.
function rewritePlaylist(text, targetUrl, base) {
    const out = [];
    for (const raw of text.split(/\r?\n/)) {
        const line = raw.trimEnd();
        if (!line) { out.push(''); continue; }
        if (line.startsWith('#')) {
            // #EXT-X-KEY:...URI="..." and #EXT-X-MAP:...URI="..."
            out.push(line.replace(/URI="([^"]+)"/g, (_, uri) => {
                let abs;
                try { abs = new URL(uri, targetUrl).href; } catch { return `URI="${uri}"`; }
                if (!isAllowed(abs)) return `URI="${uri}"`;
                return `URI="${proxied(abs, base)}"`;
            }));
            continue;
        }
        // plain line = child playlist or segment URI
        let abs;
        try { abs = new URL(line, targetUrl).href; } catch { out.push(line); continue; }
        out.push(isAllowed(abs) ? proxied(abs, base) : line);
    }
    return out.join('\n');
}

export default {
    async fetch(request) {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });
        if (request.method !== 'GET' && request.method !== 'HEAD') return json('method not allowed', 405);

        const reqUrl = new URL(request.url);
        const base = reqUrl.origin + '/stream/';
        const target = reqUrl.searchParams.get('u');
        if (!target) return json('missing ?u=', 400);

        let targetUrl;
        try { targetUrl = new URL(target); } catch { return json('bad url', 400); }
        if (!isAllowedHost(targetUrl.hostname)) return json('host not allowed', 403);

        const headers = {
            'User-Agent': UP_UA,
            Referer: UP_REFERER,
            Origin: UP_ORIGIN,
            Accept: '*/*',
            'Accept-Language': 'th,en;q=0.9',
        };
        const range = request.headers.get('range');
        if (range) headers.Range = range;

        let upstream;
        try {
            upstream = await fetch(targetUrl.href, { headers, redirect: 'follow' });
        } catch (e) {
            return json('upstream fetch failed: ' + String(e).slice(0, 120), 502);
        }

        const ct = (upstream.headers.get('content-type') || '').toLowerCase();
        const looksPlaylist = /\.m3u8($|\?)/.test(targetUrl.pathname + targetUrl.search)
            || ct.includes('mpegurl')
            || ct.includes('x-mpeg');

        if (looksPlaylist && upstream.ok) {
            const text = await upstream.text();
            return new Response(rewritePlaylist(text, upstream.url || targetUrl.href, base), {
                status: upstream.status,
                headers: { ...corsHeaders, 'content-type': 'application/vnd.apple.mpegurl' },
            });
        }

        // Binary passthrough (segments, keys, mp4…)
        const h = { ...corsHeaders, 'content-type': ct || 'application/octet-stream' };
        const cl = upstream.headers.get('content-length');
        const cr = upstream.headers.get('content-range');
        const ar = upstream.headers.get('accept-ranges');
        if (cl) h['content-length'] = cl;
        if (cr) h['content-range'] = cr;
        if (ar) h['accept-ranges'] = ar;
        return new Response(request.method === 'HEAD' ? null : upstream.body, { status: upstream.status, headers: h });
    },
};
