// Wide banner slot, shared between the homepage and title pages.
// The campaign lives in src/data/ads.js (PROMO) — edit it there, not here.
// To run a different ad network later, replace the inner content with their
// <script>/<iframe> markup and keep the .ad-banner wrapper for styling.
import { PROMO } from '../data/ads.js';

export default function AdBanner() {
    return (
        <a className="ad-banner" href={PROMO.link} target="_blank" rel="noreferrer">
            <span className="ab-title">{PROMO.title}</span>
            <span className="ab-sub">{PROMO.subtitle}</span>
        </a>
    );
}
