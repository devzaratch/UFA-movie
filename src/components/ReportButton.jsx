'use client';

// "Report a broken stream" button (plan item #9).
// Sends the title id to the Cloudflare Worker (stream-proxy/worker.js), which
// stores it in KV so the owner can see exactly which titles people want fixed
// instead of waiting for the nightly link check.
//
// Degrades quietly: if the worker has no KV binding yet (503) or the request
// fails, the visitor still gets a clear next step instead of an error dump.
import { useState } from 'react';
import { track } from '@vercel/analytics';
import { WORKER_BASE } from '../data/site-info.js';

const KEY = 'bn:reported';
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;

function recentlyReported(id) {
    try {
        const all = JSON.parse(localStorage.getItem(KEY) || '{}');
        return !!all[id] && Date.now() - all[id] < COOLDOWN_MS;
    } catch {
        return false;
    }
}

function markReported(id) {
    try {
        const all = JSON.parse(localStorage.getItem(KEY) || '{}');
        all[id] = Date.now();
        const keys = Object.keys(all);
        if (keys.length > 80) delete all[keys[0]];
        localStorage.setItem(KEY, JSON.stringify(all));
    } catch {}
}

export default function ReportButton({ movie }) {
    const [state, setState] = useState('idle'); // idle | sending | sent | soft

    const send = async () => {
        if (state === 'sending' || state === 'sent') return;
        if (recentlyReported(movie.id)) {
            setState('sent');
            return;
        }
        setState('sending');
        track('dead_report', { movie: movie.id });
        try {
            const res = await fetch(`${WORKER_BASE}/report`, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    id: movie.id,
                    title: movie.title,
                    url: typeof window !== 'undefined' ? window.location.href : '',
                    note: '',
                }),
            });
            if (res.ok) {
                markReported(movie.id);
                setState('sent');
            } else {
                setState('soft');
            }
        } catch {
            setState('soft');
        }
    };

    return (
        <div className="report-row">
            <button
                type="button"
                className={`report-btn${state === 'sent' ? ' done' : ''}`}
                onClick={send}
                disabled={state === 'sending' || state === 'sent'}
            >
                <i className={`fas ${state === 'sent' ? 'fa-circle-check' : 'fa-flag'}`} aria-hidden="true"></i>{' '}
                {state === 'sent'
                    ? 'ຮັບແຈ້ງແລ້ວ ຂອບໃຈ (ได้รับแจ้งแล้ว ขอบคุณ)'
                    : state === 'sending'
                        ? 'ກຳລັງສົ່ງ... (กำลังส่ง...)'
                        : 'ແຈ້ງລິ້ງເສຍ (แจ้งลิงก์เสีย)'}
            </button>
            {state === 'soft' && (
                <span className="report-hint">
                    ສົ່ງບໍ່ສຳເລັດ — ລອງອີກເທື່ອ ຫຼື ເບິ່ງ <a href="/contact/">ຕິດຕໍ່ເຮົາ</a>
                </span>
            )}
            {state === 'sent' && (
                <span className="report-hint">ພວກເຮົາຈະຫາແຫຼ່ງໃໝ່ໃຫ້ໄວທີ່ສຸດ (จะหาแหล่งใหม่ให้เร็วที่สุด)</span>
            )}
        </div>
    );
}
