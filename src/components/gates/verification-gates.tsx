'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button } from '../ui-controls';
import { makeCaptcha } from '@/lib/rules';

export function VerificationGates({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { gate, setGate, round, setRound, captcha, setCaptcha, selected, setSelected, captchaFor, captchaOrder, update, notify, complete, open } = app;
    switch (gate) {
            case 'captcha':
                return captcha && <><p>{captcha.prompt}</p>
                    <div className="captcha-grid">{captchaOrder.map(i => <button type="button" key={i}
                                                                                 aria-label={`Tile ${i + 1}: ${captcha.tiles[i]}`}
                                                                                 aria-pressed={selected.includes(i)}
                                                                                 className={selected.includes(i) ? 'chosen' : ''}
                                                                                 onClick={() => setSelected(s => s.includes(i) ? s.filter(v => v !== i) : [...s, i])}>{captcha.tiles[i]}</button>)}</div>
                    <p>{round} of 3 rounds confirmed</p>{button('Verify selection', () => {
                        const valid = selected.length === captcha.correct.length && selected.every(v => captcha.correct.includes(v));
                        setCaptcha(makeCaptcha());
                        setSelected([]);
                        if (!valid) {
                            setRound(0);
                            notify('Selection rejected. A fresh challenge has been issued.');
                        } else if (round < 2) {
                            setRound(r => r + 1);
                            notify('Human status provisionally acknowledged. Continue verification.');
                        } else {
                            complete('captcha');
                            if (captchaFor === 'accessibility') {
                                update({accessibility: true});
                                complete('accessibility');
                                setGate(null);
                            } else open('paperwork');
                        }
                    })}</>;
        default: return null;
    }
}
