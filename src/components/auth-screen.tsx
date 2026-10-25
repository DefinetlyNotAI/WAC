import { AlarmClock } from 'lucide-react';

type Props = {
    login: number;
    email: string;
    password: string;
    setEmail: (value: string) => void;
    setPassword: (value: string) => void;
    submit: () => void;
    reset: () => void;
    enter: () => void;
};

export function AuthScreen({ login, email, password, setEmail, setPassword, submit, reset, enter }: Props) {
    return <div className="auth-shell">
        <header className="auth-header">
            <div className="wordmark"><span className="mark"><AlarmClock size={20}/></span>
                WakeUp <span className="wordmark-light">Enterprise</span>
            </div>
            <span className="auth-system">Identity services</span>
        </header>
        <main className="auth-main">
            <section className="auth-card">
                <span className="eyebrow">WAKEUP IDENTITY SERVICES</span>
                <h1>{['Create your account', 'Sign in to WakeUp', 'Create your account again', 'Account located'][login]}</h1>
                {login === 3 ? <>
                    <p>Your password belongs to jordan.miller@wakeup.example, an existing account. We have assigned it to you.</p>
                    <button type="button" className="button" onClick={enter}>Go to workspace</button>
                </> : <form onSubmit={event => { event.preventDefault(); submit(); }}>
                    <p className="muted">Manage your schedule and continued eligibility for sleep.</p>
                    <label className="field">Email
                        <input type="email" required value={email} onChange={event => setEmail(event.target.value)}
                            placeholder="name@company.com"/>
                    </label>
                    <label className="field">Password
                        <input type="password" required minLength={3} value={password}
                            onChange={event => setPassword(event.target.value)}/>
                    </label>
                    <button type="submit" className="button full">{login === 1 ? 'Sign in' : 'Continue'}</button>
                    <div className="auth-switch">
                        <button type="button" onClick={reset}>Forgot password?</button>
                    </div>
                </form>}
            </section>
            <p className="auth-legal">WakeUp Enterprise · Keep the browser open and device awake for alarms.</p>
        </main>
    </div>;
}
