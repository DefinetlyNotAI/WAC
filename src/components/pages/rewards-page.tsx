'use client';
import type { useAlarmController } from '../use-alarm-controller';
import { button } from '../ui-controls';
import type { SavedState } from '@/lib/storage';
import { day } from '@/app/config';
import { row } from '../ui-controls';

export function RewardsPage({ app }: { app: ReturnType<typeof useAlarmController> }) {
    const { state, level, ringing, update, snooze } = app;
    return <>

                    <section className="section-card">
                        <div className="rewards-top">
                            <span>ALARM BATTLE PASS · SEASON 01</span><strong>Level {level}</strong></div>
                        <h2>Progress toward a better morning</h2>
                        <div className="loader">
                            <div style={{width: `${state.xp % 100}%`}}/>
                        </div>
                        <p>{state.xp} XP · Dismissal +25 XP · Snooze +5
                            XP</p>{button(state.rewardDay === day() ? 'Daily reward claimed' : 'Claim daily reward (+5 XP)', () => update(previous => ({
                        xp: previous.xp + 5,
                        rewardDay: day()
                    })), state.rewardDay === day())}{row('Alarm sounds', 'Alternative sounds unlock at level 30.', level >= 30 ?
                        <select aria-label="Alarm sound" value={state.sound}
                                onChange={e => update({sound: e.target.value as SavedState['sound']})}>
                            <option value="standard">Standard pulse</option>
                            <option value="chime">Corporate chime</option>
                        </select> : <span>Level 30 required</span>)}{[1, 10, 20, 30].map(n => <div className="detail"
                                                                                                   key={n}>
                        <span>Level {n}</span><strong>{n === 30 ? 'Sound customization' : n === 20 ? 'Senior Sleeper designation' : n === 10 ? 'Sleep Associate designation' : 'Standard pulse'} · {level >= n ? 'Unlocked' : 'Locked'}</strong>
                    </div>)}</section>
                    <section
                        className="section-card">{row('Random snooze crate', 'An equal chance of 0 through 60 seconds.', button('Buy crate · $2.99', () => snooze('loot'), !ringing))}</section>
                
    </>;
}
