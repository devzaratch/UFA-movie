var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// worker.js
var ALLOWED_HOSTS = /* @__PURE__ */ new Set([
  "vdohls.com",
  "master.streamhls.com",
  "master.steamhls88.com",
  "online225.com",
  "bdbx5i74v8f9pk2i.010014.xyz",
  "playerufa2.com"
]);
var UP_REFERER = "https://player77hdfree.xyz/";
var UP_ORIGIN = "https://player77hdfree.xyz";
var UP_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
var corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Range",
  "Access-Control-Expose-Headers": "Content-Length, Content-Range"
};
function json(err, status) {
  return new Response(JSON.stringify({ error: err }), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" }
  });
}
__name(json, "json");
function isAllowedHost(hostname) {
  if (ALLOWED_HOSTS.has(hostname)) return true;
  return /^vh\d+\.xyz$/.test(hostname);
}
__name(isAllowedHost, "isAllowedHost");
function isAllowed(u) {
  try {
    const p = new URL(u);
    return (p.protocol === "https:" || p.protocol === "http:") && isAllowedHost(p.hostname);
  } catch {
    return false;
  }
}
__name(isAllowed, "isAllowed");
function proxied(absUrl, base) {
  return base + "?u=" + encodeURIComponent(absUrl);
}
__name(proxied, "proxied");
function rewritePlaylist(text, targetUrl, base) {
  const out = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trimEnd();
    if (!line) {
      out.push("");
      continue;
    }
    if (line.startsWith("#")) {
      out.push(line.replace(/URI="([^"]+)"/g, (_, uri) => {
        let abs2;
        try {
          abs2 = new URL(uri, targetUrl).href;
        } catch {
          return `URI="${uri}"`;
        }
        if (!isAllowed(abs2)) return `URI="${uri}"`;
        return `URI="${proxied(abs2, base)}"`;
      }));
      continue;
    }
    let abs;
    try {
      abs = new URL(line, targetUrl).href;
    } catch {
      out.push(line);
      continue;
    }
    out.push(isAllowed(abs) ? proxied(abs, base) : line);
  }
  return out.join("\n");
}
__name(rewritePlaylist, "rewritePlaylist");
var worker_default = {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
    if (request.method !== "GET" && request.method !== "HEAD") return json("method not allowed", 405);
    const reqUrl = new URL(request.url);
    const base = reqUrl.origin + "/stream/";
    const target = reqUrl.searchParams.get("u");
    if (!target) return json("missing ?u=", 400);
    let targetUrl;
    try {
      targetUrl = new URL(target);
    } catch {
      return json("bad url", 400);
    }
    if (!isAllowedHost(targetUrl.hostname)) return json("host not allowed", 403);
    const headers = {
      "User-Agent": UP_UA,
      Referer: UP_REFERER,
      Origin: UP_ORIGIN,
      Accept: "*/*",
      "Accept-Language": "th,en;q=0.9"
    };
    const range = request.headers.get("range");
    if (range) headers.Range = range;
    let upstream;
    try {
      upstream = await fetch(targetUrl.href, { headers, redirect: "follow" });
    } catch (e) {
      return json("upstream fetch failed: " + String(e).slice(0, 120), 502);
    }
    const ct = (upstream.headers.get("content-type") || "").toLowerCase();
    const looksPlaylist = /\.m3u8($|\?)/.test(targetUrl.pathname + targetUrl.search) || ct.includes("mpegurl") || ct.includes("x-mpeg");
    if (looksPlaylist && upstream.ok) {
      const text = await upstream.text();
      return new Response(rewritePlaylist(text, upstream.url || targetUrl.href, base), {
        status: upstream.status,
        headers: { ...corsHeaders, "content-type": "application/vnd.apple.mpegurl" }
      });
    }
    const h = { ...corsHeaders, "content-type": ct || "application/octet-stream" };
    const cl = upstream.headers.get("content-length");
    const cr = upstream.headers.get("content-range");
    const ar = upstream.headers.get("accept-ranges");
    if (cl) h["content-length"] = cl;
    if (cr) h["content-range"] = cr;
    if (ar) h["accept-ranges"] = ar;
    return new Response(request.method === "HEAD" ? null : upstream.body, { status: upstream.status, headers: h });
  }
};

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-AVHq7X/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// ../../../../AppData/Local/npm-cache/_npx/32026684e21afda6/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-AVHq7X/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
