'use client';

// Plan #4 item 8: compact mobile-only ad docked just above the bottom nav.
// Impressions are capped per day and spaced out with a cooldown; dismissing
// also pauses the slot. All limits live in src/data/ads.js (STICKY_AD).
// The wrapper is server-rendered (hidden by CSS) so the slot is visible to
// static verification; only the timing/state logic runs on the client.
import { useEffect, useState } from 'react';
import { track } from '@vercel/analytics';
import { STICKY_AD } from '../data/ads.js';

const KEY = 'bn:stickyad';
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

function readState() {
    try {
        return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
        return {};
    }
}

function writeState(state) {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode */ }
}

export default function StickyAd() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (!STICKY_AD.enabled) return undefined;

        const now = new Date();
        const t = now.getTime();
        const state = readState();
        const today = dayKey(now);
        // Daily counters roll over at local midnight; a dismissal keeps its
        // own absolute expiry so it survives the rollover.
        if (state.day !== today) {
            state.day = today;
            state.count = 0;
            state.last = 0;
        }
        if (state.dismissedUntil && t < state.dismissedUntil) return undefined;

        const cap = STICKY_AD.maxPerDay;
        const cooldown = STICKY_AD.cooldownMinutes * 60_000;
        if ((state.count || 0) >= cap || t - (state.last || 0) < cooldown) return undefined;

        const timer = setTimeout(() => {
            const next = { ...state, count: (state.count || 0) + 1, last: Date.now() };
            writeState(next);
            setVisible(true);
            document.body.classList.add('sticky-ad-on');
            track('ad_impression', { slot: STICKY_AD.id });
        }, STICKY_AD.delayMs);

        return () => {
            clearTimeout(timer);
            document.body.classList.remove('sticky-ad-on');
        };
    }, []);

    const dismiss = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const state = readState();
        state.dismissedUntil = Date.now() + STICKY_AD.dismissHours * 3_600_000;
        writeState(state);
        setVisible(false);
        document.body.classList.remove('sticky-ad-on');
        track('ad_dismiss', { slot: STICKY_AD.id });
    };

    if (!STICKY_AD.enabled) return null;

    return (
        <div className={`sticky-ad${visible ? ' is-visible' : ''}`}>
            <a
                className="sa-link"
                href={STICKY_AD.link}
                target="_blank"
                rel="noreferrer"
                onClick={() => track('ad_click', { slot: STICKY_AD.id })}
            >
                <span className="sa-title">{STICKY_AD.title}</span>
                <span className="sa-sub">{STICKY_AD.subtitle}</span>
            </a>
            <button className="sa-close" type="button" onClick={dismiss} aria-label="ປິດໂຄສະນາ">×</button>
        </div>
    );
}
