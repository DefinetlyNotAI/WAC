'use client';
import { useEffect, useRef } from 'react';

/** Keep keyboard focus inside a modal, then restore focus when it closes. */
export function useModalFocus(escapeEnabled: boolean, onEscape?: () => void) {
    const element = useRef<HTMLElement>(null);
    const callback = useRef(onEscape);
    useEffect(() => { callback.current = onEscape; }, [onEscape]);

    useEffect(() => {
        const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const root = element.current;
        if (!root) return;
        const focusable = () => Array.from(root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        )).filter(node => node.getClientRects().length > 0);
        (focusable()[0] ?? root).focus();
        function onKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && escapeEnabled) {
                event.preventDefault();
                callback.current?.();
            }
            if (event.key !== 'Tab') return;
            const items = focusable();
            if (!items.length) { event.preventDefault(); root?.focus(); return; }
            const first = items[0], last = items[items.length - 1];
            if (event.shiftKey && (document.activeElement === first || !root?.contains(document.activeElement))) {
                event.preventDefault(); last.focus();
            } else if (!event.shiftKey && (document.activeElement === last || !root?.contains(document.activeElement))) {
                event.preventDefault(); first.focus();
            }
        }
        document.addEventListener('keydown', onKeyDown);
        return () => { document.removeEventListener('keydown', onKeyDown); previous?.focus(); };
    }, [escapeEnabled]);
    return element;
}
