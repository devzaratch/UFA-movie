// Ad configuration (plan item #7).
//
// The pre-roll ads used to be hardcoded inside Player.jsx, so changing a
// campaign (or fixing the redirect link) meant editing player logic. Everything
// revenue-related now lives here and nowhere else.
//
// Each slot:
//   id      stable name, used for analytics events ("ad_click:slotId")
//   src     mp4 in /public
//   link    destination — put the final advertiser URL here (the shorturl.at
//           links are blocked inside LINE/Facebook in-app browsers)
//   label   button text
//   weight  higher = earlier in the pre-roll order
//   enabled false to pause a campaign without deleting it
//   from/to optional ISO dates (campaign window, inclusive)
import { SITE_URL } from '../lib/site.js';

export const AD_CONFIG = {
    // Master switch: set to false to disable every pre-roll instantly.
    enabled: true,
    // Seconds before the skip button becomes clickable.
    skipSeconds: 5,
    slots: [
        {
            id: 'member-mog',
            src: '/mog.mp4',
            link: 'https://ufasboclubauto.com/register',
            label: 'ສະໝັກສະມາຊິກ (สมัครสมาชิก)',
            weight: 2,
            enabled: true,
        },
        {
            id: 'member-lsp',
            src: '/lsp.mp4',
            link: 'https://ufasboclubauto.com/register',
            label: 'ສະໝັກສະມາຊິກ (สมัครสมาชิก)',
            weight: 1,
            enabled: true,
        },
    ],
};

const inWindow = (slot, now) => {
    if (slot.from && now < new Date(slot.from)) return false;
    if (slot.to && now > new Date(slot.to)) return false;
    return true;
};

// Slots that should run right now, highest weight first.
export function activeAds(now = new Date()) {
    if (!AD_CONFIG.enabled) return [];
    return AD_CONFIG.slots
        .filter((s) => s.enabled && s.src && inWindow(s, now))
        .sort((a, b) => (b.weight || 0) - (a.weight || 0))
        .map((s) => ({ ...s, link: resolveLink(s.link) }));
}

// Relative links (e.g. "/register") become absolute so the ad still works when
// the player is embedded; absolute ones are returned untouched.
function resolveLink(link) {
    if (!link) return SITE_URL;
    return /^https?:\/\//i.test(link) ? link : SITE_URL + link;
}

// Sidebar / in-page promo box (AdBanner.jsx) reads the same config.
export const PROMO = {
    link: 'https://ufasboclubauto.com/register',
    title: 'ສະໝັກສະມາຊິກ (สมัครสมาชิก)',
    subtitle: 'ຮັບໜັງຄົມຊັດ HD ພາກໄທ ເຕັມເລື່ອງ ທຸກຮູບແບບ',
};
