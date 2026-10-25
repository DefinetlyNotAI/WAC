import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { AlarmClock, LogOut } from 'lucide-react';
import { nav, titles } from '@/app/config.ts';
import type { Gate, Page } from '@/app/page.types';

export function Notice({ message, dismiss }: { message: string; dismiss: () => void }) {
    if (!message) return null;
    return <div className="notice" role="status"><span>{message}</span>
        <button aria-label="Dismiss notification" onClick={dismiss}><X size={16}/></button>
    </div>;
}

export function Dialog({ gate, content, close, canClose, canReturn }: {
    gate: Exclude<Gate, null>;
    content: ReactNode;
    close: () => void;
    canClose: boolean;
    canReturn: boolean;
}) {
    return <div className="overlay">
        <section className="dialog" role="dialog" aria-modal="true" aria-label={titles[gate]}>
            <header className="dialog-header">
                <div><span className="eyebrow">WAKEUP ENTERPRISE · ACCOUNT SERVICES</span><h2>{titles[gate]}</h2></div>
                {canClose && <button className="icon-button" aria-label="Close dialog" onClick={close}><X size={18}/></button>}
            </header>
            <div className="dialog-content">{content}</div>
            <footer className="dialog-footer">
                <span>WakeUp Service Assurance</span>
                {canReturn && <button className="text-button" onClick={close}>Return</button>}
            </footer>
        </section>
    </div>;
}

export function Sidebar({ page, premium, navigate, signOut }: {
    page: Page;
    premium: boolean;
    navigate: (page: Page) => void;
    signOut: () => void;
}) {
    return <aside className="sidebar">
        <div className="brand"><span className="mark"><AlarmClock size={19}/></span>
            <div>WakeUp <small>ENTERPRISE</small></div>
        </div>
        <div className="sidebar-heading">WORKSPACE</div>
        <nav>{nav.map(item => <button key={item.key}
            className={`nav-link ${page === item.key ? 'is-active' : ''}`}
            onClick={() => navigate(item.key)}>
            <item.icon size={17}/>{item.label}
        </button>)}</nav>
        <div className="sidebar-end">
            <div className="profile"><span className="avatar">JM</span>
                <div><strong>Jordan Miller</strong><small>{premium ? 'Premium' : 'Free'} workspace</small></div>
            </div>
            <button className="signout" onClick={signOut}><LogOut size={15}/>Sign out</button>
        </div>
    </aside>;
}
