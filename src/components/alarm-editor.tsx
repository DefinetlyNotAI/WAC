import { X } from 'lucide-react';
import type { Alarm } from '@/lib/storage';

type Props = {
    alarm: Alarm;
    change: (alarm: Alarm) => void;
    save: () => void;
    cancel: () => void;
};

export function AlarmEditor({ alarm, change, save, cancel }: Props) {
    return <div className="overlay">
        <form className="dialog small" role="dialog" aria-modal="true" aria-label="Alarm settings"
            onSubmit={event => { event.preventDefault(); save(); }}>
            <header className="dialog-header">
                <h2>Alarm settings</h2>
                <button type="button" className="icon-button" aria-label="Close editor" onClick={cancel}>
                    <X size={18}/>
                </button>
            </header>
            <div className="dialog-content">
                <label className="field">Alarm time
                    <input type="time" required value={alarm.time}
                        onChange={event => change({ ...alarm, time: event.target.value })}/>
                </label>
                <p>Repeats daily in device time. A refresh catches up missed appointments while the browser is running.</p>
            </div>
            <footer className="dialog-footer">
                <button className="button" type="submit">Save alarm</button>
                <button className="button secondary" type="button" onClick={cancel}>Cancel</button>
            </footer>
        </form>
    </div>;
}
