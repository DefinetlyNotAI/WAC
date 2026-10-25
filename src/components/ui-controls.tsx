import type { ReactNode } from 'react';
import { Star } from 'lucide-react';

/** Shared presentation helpers for legacy gate and settings actions. */
export function button(label: string, action: () => void, disabled = false, secondary = false) {
    return <button type="button" className={`button${secondary ? ' secondary' : ''}`}
        disabled={disabled} onClick={action}>{label}</button>;
}

export function row(label: string, description: string, control: ReactNode) {
    return <div className="setting-row"><div><strong>{label}</strong><p>{description}</p></div>{control}</div>;
}

export function stars(value: number, rate: (rating: number) => void) {
    return <div className="star-rating" role="group" aria-label="Service rating">
        {[1, 2, 3, 4, 5].map(rating => <button type="button" key={rating}
            aria-label={`Rate ${rating} ${rating === 1 ? 'star' : 'stars'}`}
            aria-pressed={value === rating} onClick={() => rate(rating)}>
            <Star size={32} fill={rating <= value ? 'currentColor' : 'none'}/>
        </button>)}
    </div>;
}
