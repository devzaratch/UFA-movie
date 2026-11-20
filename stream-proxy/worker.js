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

// ── Broken-link reports ────────────────────────────────────────────────────
// One KV namespace (REPORTS) stores one key per report:
//   report:<iso ts>:<rand> → { id, title, url, note, country, ua, ts }
// and a short-lived rate-limit key per client so a visitor cannot spam.
const REPORT_MAX_NOTE = 280;
const RATE_LIMIT_SECONDS = 600;

async function handleReport(request, env) {
    if (!env || !env.REPORTS) return json('reports not configured (bind KV as REPORTS)', 503);

    let body;
    try { body = await request.json(); } catch { return json('bad json', 400); }

    const id = String(body.id || '').trim();
    if (!/^[ms]\d{1,6}$/.test(id)) return json('bad id', 400);
    const title = String(body.title || '').slice(0, 200);
    const url = String(body.url || '').slice(0, 500);
    const note = String(body.note || '').slice(0, REPORT_MAX_NOTE);

    // Rate limit: the CF-Connecting-IP is only used as a hashed bucket, never stored.
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const bucket = 'rl:' + (await sha256(ip + id));
    if (await env.REPORTS.get(bucket)) {
        return new Response(JSON.stringify({ ok: true, duplicate: true }), {
            status: 200,
            headers: { ...corsHeaders, 'content-type': 'application/json' },
        });
    }
    await env.REPORTS.put(bucket, '1', { expirationTtl: RATE_LIMIT_SECONDS });

    const ts = new Date().toISOString();
    const key = `report:${ts}:${Math.random().toString(36).slice(2, 8)}`;
    await env.REPORTS.put(key, JSON.stringify({
        id, title, url, note, ts,
        country: request.headers.get('cf-ipcountry') || '',
        ua: (request.headers.get('user-agent') || '').slice(0, 160),
    }));

    return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
}

async function handleReportList(request, env, reqUrl) {
    if (!env || !env.REPORTS) return json('reports not configured', 503);
    const token = request.headers.get('x-admin-token') || '';
    if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) return json('forbidden', 403);

    const limit = Math.min(200, Math.max(1, parseInt(reqUrl.searchParams.get('limit') || '50', 10) || 50));
    const list = await env.REPORTS.list({ prefix: 'report:', limit });
    const items = [];
    for (const k of list.keys) {
        const raw = await env.REPORTS.get(k.name);
        if (raw) {
            try { items.push(JSON.parse(raw)); } catch {}
        }
    }
    items.sort((a, b) => (a.ts < b.ts ? 1 : -1));
    return new Response(JSON.stringify({ count: items.length, items }), {
        status: 200,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
}

async function sha256(text) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    return [...new Uint8Array(buf)].slice(0, 12).map((b) => b.toString(16).padStart(2, '0')).join('');
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
    async fetch(request, env) {
        if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

        const reqUrl = new URL(request.url);

        // ── Uptime probe (plan #4 item 10) ──────────────────────────────────
        // Public, read-only and dependency-free so the ops page can measure
        // worker availability/latency from a browser (no admin token needed).
        if (reqUrl.pathname === '/ping' || reqUrl.pathname === '/ping/') {
            return new Response(JSON.stringify({ ok: true, service: 'stream-proxy', ts: new Date().toISOString() }), {
                status: 200,
                headers: { ...corsHeaders, 'content-type': 'application/json', 'cache-control': 'no-store' },
            });
        }

        // ── Broken-link reports (plan item #9) ──────────────────────────────
        // POST /report  { id, title, url, note }  → stored in KV namespace REPORTS
        // GET  /reports?limit=50   (header x-admin-token: <ADMIN_TOKEN>)
        if (reqUrl.pathname === '/report' || reqUrl.pathname === '/report/') {
            if (request.method !== 'POST') return json('method not allowed', 405);
            return handleReport(request, env);
        }
        if (reqUrl.pathname === '/reports' || reqUrl.pathname === '/reports/') {
            if (request.method !== 'GET') return json('method not allowed', 405);
            return handleReportList(request, env, reqUrl);
        }

        if (request.method !== 'GET' && request.method !== 'HEAD') return json('method not allowed', 405);

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
