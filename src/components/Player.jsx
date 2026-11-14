'use client';

// Player + pre-roll ad system, ported from the old vanilla play.html script.
// The movie entry is passed as a prop (build-time data), the CDN libraries
// (hls.js, Artplayer) are injected at runtime and awaited before init.
import { useEffect, useRef, useState } from 'react';

const ADS = [
    { src: '/mog.mp4', link: 'https://shorturl.at/riU34' },
    { src: '/lsp.mp4', link: 'https://shorturl.at/Ej7uF' },
];

// The upstream stream hosts (vdohls.com etc.) reject requests whose Referer is
// not one of their partner sites, so every m3u8 is fetched through our
// Cloudflare Worker proxy (stream-proxy/worker.js) which injects the accepted
// Referer and rewrites child playlists/segments to loop back through itself.
const STREAM_PROXY = 'https://boengnang-stream.phonthebtilavun25599.workers.dev/stream/';
const withProxy = (url) => STREAM_PROXY + '?u=' + encodeURIComponent(url);

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
    const adVideoRef = useRef(null);
    const [adIndex, setAdIndex] = useState(0);
    const [adsDone, setAdsDone] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3);
    const [activeEp, setActiveEp] = useState(0);
    const [initError, setInitError] = useState(null);

    // Load CDN libs + create the player once per entry
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
                            const hls = new window.Hls();
                            // Dead/expired stream links would otherwise leave an
                            // endless buffering spinner — surface a clear notice.
                            hls.on(window.Hls.Events.ERROR, (_, data) => {
                                if (data && data.fatal && artRef.current && artRef.current.notice) {
                                    artRef.current.notice.show = 'ບໍ່ສາມາດໂຫຼດວິດີໂອໄດ້ (โหลดวิดีโอไม่ได้) — ແຫຼ່ງສຕຼີມອາດໝົດອາຍຸ ກະລຸນາລອງໜັງອື່ນກ່ອນ';
                                }
                            });
                            hls.loadSource(url);
                            hls.attachMedia(video);
                        },
                    },
                });
                artRef.current = art;
            })
            .catch((err) => !disposed && setInitError(err.message));
        return () => { disposed = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [movie.id]);

    // Skip timer for the current ad
    useEffect(() => {
        if (adsDone) return;
        setTimeLeft(3);
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

    const pickEp = (i) => {
        const art = artRef.current;
        if (!art) return;
        art.switchUrl(withProxy(movie.episodes[i].url));
        setActiveEp(i);
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
                        <a href={currentAd.link} target="_blank" rel="noreferrer" className="btn-reg">ສະໝັກສະມາຊິກ</a>
                        <button
                            id="skipBtn"
                            className={`btn-skip${timeLeft === 0 ? ' ready' : ''}`}
                            disabled={timeLeft > 0}
                            onClick={switchAd}
                        >
                            {timeLeft > 0
                                ? <>ລໍຖ້າ... <span id="timer">{timeLeft}</span></>
                                : (adIndex < ADS.length - 1 ? 'ຂ້າມໄປຄິບຖັດໄປ' : 'ຂ້າມໂຄສະນາເພື່ອເບິ່ງໜັງ')}
                        </button>
                    </section>
                )}

                <div className="artplayer-app"></div>
                {initError && (
                    <p style={{ color: '#f39c12', fontSize: 13, marginTop: 8 }}>โหลดเครื่องเล่นไม่สำเร็จ: {initError}</p>
                )}
            </div>

            {m.type === 'series' && (
                <article className="info-box">
                    {/* title/meta are rendered server-side; only the episode picker needs interactivity */}
                    <div className="ep-list">
                        <p><i className="fas fa-list"></i> ເລືອກຕອນເບິ່ງ (เลือกตอน):</p>
                        <div className="ep-tabs">
                            {m.episodes.map((ep, i) => (
                                <div
                                    key={i}
                                    className={`ep-btn${i === activeEp ? ' active' : ''}`}
                                    onClick={() => pickEp(i)}
                                >
                                    {ep.title}
                                </div>
                            ))}
                        </div>
                    </div>
                </article>
            )}
        </>
    );
}
