# stream-proxy (Cloudflare Worker)

One worker does two jobs:

1. `GET /stream/?u=<urlencoded url>` — proxies HLS playlists/segments, injecting
   the `Referer`/`Origin` the upstream hosts require and rewriting every child
   playlist / segment / key so it also comes back through the worker.
2. `POST /report` — receives broken-link reports from the title pages and stores
   them in KV; `GET /reports` (admin token) lists them.

## Deploy

```sh
cd stream-proxy
npx wrangler login
npx wrangler deploy
```

## Enable broken-link reports (plan item #9)

Without the KV binding the worker still proxies streams; `/report` answers
`503 reports not configured`.

```sh
npx wrangler kv namespace create REPORTS
# paste the printed id into wrangler.jsonc, uncomment the kv_namespaces block
npx wrangler deploy

# optional admin token for reading reports
npx wrangler secret put ADMIN_TOKEN
curl -H "x-admin-token: <token>" \
  "https://boengnang-stream.phonthebtilavun25599.workers.dev/reports?limit=50"
```

The site calls the report endpoint from `src/components/ReportButton.jsx`
(worker base url is `WORKER_BASE` in `src/data/site-info.js`).

## Rate limiting / privacy

- one report per title per client IP per 10 minutes (hashed, never stored raw)
- stored fields: title id, title, page url, ISO timestamp, country code, trimmed UA
- nothing else is collected; no cookies are involved
