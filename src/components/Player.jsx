'use client';

// Player + pre-roll ad system, ported from the old vanilla play.html script.
// The movie entry is passed as a prop (build-time data), the CDN libraries
// (hls.js, Artplayer) are injected at runtime and awaited before init.
import { useEffect, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import { AD_CONFIG, activeAds } from '../data/ads.js';

// Pre-roll ads come from src/data/ads.js (edit campaigns there, not here).
const ADS = activeAds();
const SKIP_SECONDS = AD_CONFIG.skipSeconds;

// The vdohls.com hosts reject requests whose Referer is not one of their
// partner sites, so those m3u8s are fetched through our Cloudflare Worker
// proxy (stream-proxy/worker.js) which injects the accepted Referer and
// rewrites child playlists/segments to loop back through itself.
// master.streamhls.com / steamhls88.com are the opposite: any cross-site
// Referer gets a Cloudflare challenge, while no-referer requests pass — our
// title pages already send no referrer, so those play directly.
const STREAM_PROXY = 'https://boengnang-stream.phonthebtilavun25599.workers.dev/stream/';
const withProxy = (url) => {
    try {
        return new URL(url).hostname.endsWith('vdohls.com')
            ? STREAM_PROXY + '?u=' + encodeURIComponent(url)
            : url;
    } catch {
        return url;
    }
};

function loadScript(src) {
    return new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) return resolve();
        const s = document.createElement('script');
        s.src = src;
        s.onload = resolve;
        s.onerror = () => reject(new Error(`failed to load ${src}`));
        document.body.appendChild(s);
    });
}

export default function Player({ movie }) {
    const m = {
        ...movie,
        // guard: a series with no episodes quietly behaves like a movie (would play nothing)
        ...(movie.type === 'series' && (!movie.episodes || movie.episodes.length === 0)
            ? { type: 'movie' } : {}),
    };

    const artRef = useRef(null);
    const hlsRef = useRef(null);
    const adVideoRef = useRef(null);
    const [adIndex, setAdIndex] = useState(0);
    const [adsDone, setAdsDone] = useState(ADS.length === 0);
    const [timeLeft, setTimeLeft] = useState(SKIP_SECONDS);
    const [activeEp, setActiveEp] = useState(0);
    const [initError, setInitError] = useState(null);
    const [playError, setPlayError] = useState(false);
    // Bumping this re-runs the init effect: used by the "try again" button
    // after a fatal stream/player error.
    const [reloadKey, setReloadKey] = useState(0);

    const activeEpRef = useRef(0);

    // "ดูต่อจากที่ค้าง" (plan item #9): per-title { ep, t } in localStorage,
    // capped at 60 titles to stay small.
    const RESUME_KEY = 'bn:resume';
    const readResume = (id) => {
        try { return JSON.parse(localStorage.getItem(RESUME_KEY) || '{}')[id] || null; } catch { return null; }
    };
    const saveResume = (id, v) => {
        try {
            const all = JSON.parse(localStorage.getItem(RESUME_KEY) || '{}');
            all[id] = v;
            const keys = Object.keys(all);
            if (keys.length > 60) delete all[keys[0]];
            localStorage.setItem(RESUME_KEY, JSON.stringify(all));
        } catch {}
    };

    const destroyHls = () => {
        if (hlsRef.current) {
            try { hlsRef.current.destroy(); } catch {}
            hlsRef.current = null;
        }
    };

    // Load CDN libs + create the player once per entry (and on manual retry)
    useEffect(() => {
        let disposed = false;
        Promise.all([
            loadScript('https://cdn.jsdelivr.net/npm/hls.js@1/dist/hls.min.js'),
            loadScript('https://cdn.jsdelivr.net/npm/artplayer@5/dist/artplayer.js'),
        ])
            .then(() => {
                if (disposed || !window.Artplayer || !window.Hls) return;
                // Artplayer is a class — it must be constructed with `new`
                // (calling it bare throws "Class constructor cannot be invoked
                // without 'new'" and the player never initializes).
                const art = new window.Artplayer({
                    container: '.artplayer-app',
                    url: withProxy(m.type === 'series' ? m.episodes[0].url : m.url),
                    type: 'm3u8',
                    setting: true,
                    fullscreen: true,
                    pip: true,
                    customType: {
                        m3u8: (video, url) => {
                            // One live hls instance at a time: destroying the old one
                            // before every load prevents the memory leak that used to
                            // freeze long binge sessions / episode switching.
                            destroyHls();
                            const hls = new window.Hls();
                            hlsRef.current = hls;
                            // Dead/expired stream links would otherwise leave an
                            // endless buffering spinner — surface a clear notice
                            // and a retry button.
                            hls.on(window.Hls.Events.ERROR, (_, data) => {
                                if (data && data.fatal && !disposed) {
                                    destroyHls();
                                    setPlayError(true);
                                    if (artRef.current && artRef.current.notice) {
                                        artRef.current.notice.show = 'ບໍ່ສາມາດໂຫຼດວິດີໂອໄດ້ (โหลดวิดีโอไม่ได้) — ແຫຼ່ງສຕຼີມອາດໝົດອາຍຸ ກະລຸນາລອງໜັງອື່ນກ່ອນ';
                                    }
                                }
                            });
                            hls.loadSource(url);
                            hls.attachMedia(video);
                        },
                    },
                });
                artRef.current = art;

            // Analytics: first real playback of this title (plan item #8)
            let started = false;
            art.on('video:play', () => {
                if (started) return;
                started = true;
                track('play_started', { movie: m.id, category: m.category, type: m.type || 'movie' });
            });

            // Resume where the viewer left off: saved episode + position
            const saved = readResume(m.id);
            if (saved) {
                if (m.type === 'series' && saved.ep > 0 && m.episodes && m.episodes[saved.ep]) {
                    art.switchUrl(withProxy(m.episodes[saved.ep].url));
                    activeEpRef.current = saved.ep;
                    setActiveEp(saved.ep);
                }
                if (saved.t > 20) {
                    art.once('video:canplay', () => { try { art.seek(saved.t); } catch {} });
                }
            }
            // Save progress while watching (throttled to one write / 5s)
            let lastSave = 0;
            art.on('video:timeupdate', () => {
                const now = Date.now();
                if (now - lastSave < 5000) return;
                lastSave = now;
                try {
                    const t = art.getCurrentTime ? art.getCurrentTime() : 0;
                    if (t > 0) saveResume(m.id, { ep: activeEpRef.current, t });
                } catch {}
            });
            })
            .catch((err) => !disposed && setInitError(err.message));
        return () => {
            disposed = true;
            destroyHls();
            // destroy(false) keeps the .artplayer-app container div so a
            // re-init (retry) can rebuild into it.
            if (artRef.current) {
                try { artRef.current.destroy(false); } catch {}
                artRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movie.id, reloadKey]);

    // Skip timer for the current ad
    useEffect(() => {
        if (adsDone) return;
        setTimeLeft(SKIP_SECONDS);
        const t = setInterval(() => {
            setTimeLeft((left) => {
                if (left <= 1) { clearInterval(t); return 0; }
                return left - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [adIndex, adsDone]);

    const switchAd = () => {
        adVideoRef.current.pause();
        adVideoRef.current.currentTime = 0;

        if (adIndex < ADS.length - 1) {
            setAdIndex(adIndex + 1);
        } else {
            setAdsDone(true);
            const art = artRef.current;
            if (art) art.play();
        }
    };

    // Custom analytics events (plan item #8): tells us which titles and
    // campaigns actually get watched, so replacement streams go to the titles
    // people want first.
    const skipAd = () => {
        track('ad_skipped', { slot: ADS[adIndex]?.id || 'none', movie: m.id });
        switchAd();
    };
    const clickAd = () => {
        track('ad_click', { slot: ADS[adIndex]?.id || 'none', movie: m.id });
    };

    const pickEp = (i) => {
        const art = artRef.current;
        if (!art) return;
        setPlayError(false);
        activeEpRef.current = i;
        saveResume(m.id, { ep: i, t: 0 });
        art.switchUrl(withProxy(movie.episodes[i].url));
        setActiveEp(i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const retry = () => {
        setPlayError(false);
        setInitError(null);
        setReloadKey((k) => k + 1);
    };

    const currentAd = ADS[adIndex];

    return (
        <>
            <div className="player-container">
                {!adsDone && (
                    <section id="adLayer" className="ad-layer">
                        <div className="ad-count">ໂຄສະນາ: {adIndex + 1}/{ADS.length}</div>
                        <video
                            id="adVideo"
                            ref={adVideoRef}
                            autoPlay
                            onEnded={switchAd}
                            key={currentAd.src}
                        >
                            <source src={currentAd.src} type="video/mp4" />
                        </video>
                        <a href={currentAd.link} target="_blank" rel="noreferrer" className="btn-reg" onClick={clickAd}>{currentAd.label || 'ສະໝັກສະມາຊິກ'}</a>
                        <button
                            id="skipBtn"
                            className={`btn-skip${timeLeft === 0 ? ' ready' : ''}`}
                            disabled={timeLeft > 0}
                            onClick={skipAd}
                        >
                            {timeLeft > 0
                                ? <>ລໍຖ້າ... <span id="timer">{timeLeft}</span></>
                                : (adIndex < ADS.length - 1 ? 'ຂ້າມໄປຄິບຖັດໄປ' : 'ຂ້າມໂຄສະນາເພື່ອເບິ່ງໜັງ')}
                        </button>
                    </section>
                )}

                <div className="artplayer-app"></div>
                {(initError || playError) && (
                    <div className="retry-row">
                        <button type="button" className="retry-btn" onClick={retry}>
                            <i className="fas fa-rotate-right" aria-hidden="true"></i>{' '}
                            ລອງໂຫຼດໃໝ່ (ลองโหลดใหม่)
                        </button>
                    </div>
                )}
            </div>

            {m.type === 'series' && (
                <article className="info-box">
                    {/* title/meta are rendered server-side; only the episode picker needs interactivity */}
                    <div className="ep-list">
                        <p><i className="fas fa-list"></i> ເລືອກຕອນເບິ່ງ (เลือกตอน):</p>
                        <div className="ep-tabs">
                            {/* real buttons: keyboard/screen-reader operable (class kept for verify-build) */}
                            {m.episodes.map((ep, i) => (
                                <button
                                    type="button"
                                    key={i}
                                    className={`ep-btn${i === activeEp ? ' active' : ''}`}
                                    onClick={() => pickEp(i)}
                                >
                                    {ep.title}
                                </button>
                            ))}
                        </div>
                    </div>
                </article>
            )}
        </>
    );
}
