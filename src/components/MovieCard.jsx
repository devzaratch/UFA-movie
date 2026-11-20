// Catalog card — plain markup (no hooks), shared by the client grid
// (HomeGrid) and the static /page/N/ pages so the two can never drift apart.
// Markup stays identical to the original card: verify-build counts .card-title.
import { CATEGORY_LABEL } from '../lib/categories.js';
import { ratingOf } from '../lib/rating.js';

export default function MovieCard({ m, hidden = false }) {
    const rating = ratingOf(m);
    return (
        <a
            className={`card${hidden ? ' card-hide' : ''}`}
            href={`/movie/${m.slug}/`}
            data-cat={m.category}
        >
            <div className="ribbon">{m.quality || 'HD'}</div>
            <img
                src={m.poster}
                alt={`${m.title} ເບິ່ງໜັງອອນໄລນ໌ຟຣີ BOENGNANG`}
                width={252}
                height={378}
                loading="lazy"
            />
            <div className="rating-bar">
                {rating ? `ເບິ່ງໜັງອອນໄລນ໌ IMDb: ${rating.toFixed(1)}` : CATEGORY_LABEL[m.category] || ''}
            </div>
            <div className="card-title">{m.title}</div>
        </a>
    );
}
