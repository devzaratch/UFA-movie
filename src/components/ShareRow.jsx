'use client';

// Share row on title pages (plan item #9): LINE / Facebook / copy link.
// All buttons open on click so nothing touches window at build time.
import { useState } from 'react';

export default function ShareRow() {
    const [copied, setCopied] = useState(false);

    const url = () => window.location.href.split('#')[0];

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url());
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {}
    };

    const openLine = () => {
        window.open('https://social-plugins.line.me/lineit/share?url=' + encodeURIComponent(url()), '_blank', 'noopener');
    };

    const openFb = () => {
        window.open('https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(url()), '_blank', 'noopener,width=600,height=500');
    };

    return (
        <div className="share-row">
            <span className="share-label"><i className="fas fa-share-nodes" aria-hidden="true"></i> ແບ່ງປັນ (แชร์):</span>
            <button type="button" className="share-btn" onClick={openLine}>
                <i className="fab fa-line" aria-hidden="true"></i> LINE
            </button>
            <button type="button" className="share-btn" onClick={openFb}>
                <i className="fab fa-facebook-f" aria-hidden="true"></i> Facebook
            </button>
            <button type="button" className="share-btn" onClick={copy} aria-label="ຄັດລອກລິ້ງ (คัดลอกลิงก์)">
                <i className="fas fa-link" aria-hidden="true"></i>{' '}
                {copied ? 'ຄັດລອກແລ້ວ (คัดลอกแล้ว)' : 'ຄັດລອກລິ້ງ (คัดลอกลิงก์)'}
            </button>
        </div>
    );
}
