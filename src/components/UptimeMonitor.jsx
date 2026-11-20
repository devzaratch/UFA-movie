'use client';

// Live uptime for the stream proxy (plan #4 item 10). The worker exposes a
// public GET /ping; this widget checks it on mount and every 60s, reporting
// status and round-trip latency. A failure is shown plainly — no retries that
// could hammer a down worker.
import { useEffect, useState } from 'react';
import { WORKER_BASE } from '../data/site-info.js';

const TIMEOUT_MS = 5000;
const INTERVAL_MS = 60_000;

export default function UptimeMonitor() {
    const [state, setState] = useState({ status: 'checking', latency: null, at: null });

    useEffect(() => {
        let alive = true;
        const ping = async () => {
            const started = performance.now();
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
            try {
                const res = await fetch(`${WORKER_BASE}/ping`, {
                    cache: 'no-store',
                    signal: controller.signal,
                });
                const data = res.ok ? await res.json() : null;
                if (!alive) return;
                setState({
                    status: res.ok && data && data.ok ? 'ok' : 'down',
                    latency: Math.round(performance.now() - started),
                    at: new Date().toLocaleTimeString(),
                });
            } catch {
                if (alive) setState({ status: 'down', latency: null, at: new Date().toLocaleTimeString() });
            } finally {
                clearTimeout(timer);
            }
        };
        ping();
        const id = setInterval(ping, INTERVAL_MS);
        return () => { alive = false; clearInterval(id); };
    }, []);

    const label = state.status === 'ok'
        ? 'ອອນລາຍ (Online)'
        : state.status === 'down'
            ? 'ບໍ່ຕອບສະໜອງ (Offline)'
            : 'ກຳລັງກວດສອບ... (Checking...)';

    return (
        <div className="uptime-card">
            <div className="up-head">
                <strong>Stream proxy</strong>
                <span className={`up-pill up-${state.status}`}>{label}</span>
            </div>
            <p className="up-meta">
                {state.latency !== null ? `${state.latency} ms` : '—'}
                {state.at ? ` · ${state.at}` : ''}
                {' · '}ตรวจทุก 60 ວິນາທີ (checks every 60s)
            </p>
        </div>
    );
}
