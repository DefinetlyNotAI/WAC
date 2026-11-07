
'use client';

import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
} from 'react';

const WORDS = [
    'ALARM',
    'CLOCK',
    'WATCH',
    'SLEEP',
    'TIMER',
    'HOURS',
    'CHIME',
    'NIGHT',
];

const CLAUSES = Array.from(
    { length: 240 },
    (_, i) =>
        `Clause ${(i + 1).toString().padStart(3, '0')}: ${
            [
                'Mandatory optional agreement',
                'Non-refundable consciousness',
                'Right to remain audible',
                'Compulsory personal inconvenience',
                'Administrative sleep allocation',
            ][i % 5]
        }`
);

export function LicenseDropdown({
                                    onComplete,
                                }: {
    onComplete: () => void;
}) {
    const [value, setValue] = useState('');

    return (
        <div className="hostile-box">
            <h3>Which license clause is your favorite?</h3>
            <p>
                All clauses are equally binding.
                Please develop a preference.
            </p>

            <select
                value={value}
                onChange={(e) => setValue(e.target.value)}
            >
                <option value="">Choose from 240 clauses</option>
                {CLAUSES.map((clause) => (
                    <option key={clause} value={clause}>
                        {clause}
                    </option>
                ))}
            </select>

            <button
                className="button"
                disabled={!value}
                onClick={onComplete}
            >
                File my preference
            </button>
        </div>
    );
}

export function ConfirmConfirm({
                                   onComplete,
                               }: {
    onComplete: () => void;
}) {
    const [n, setN] = useState(0);

    return (
        <div className="hostile-box">
            <h3>Pre-login confirmation {n + 1} / 10</h3>

            <p>
                {n === 0
                    ? 'Confirm that you wish to confirm your intent to proceed.'
                    : `Confirm that confirmation ${n} was confirmed voluntarily.`}
            </p>

            <button
                className="button"
                onClick={() => {
                    if (n === 9) {
                        onComplete();
                    } else {
                        setN((x) => x + 1);
                    }
                }}
            >
                Confirm confirmation {n + 1}
            </button>
        </div>
    );
}

export function PrecisionSlider({
                                    onComplete,
                                }: {
    onComplete: () => void;
}) {
    const [v, setV] = useState(0);

    return (
        <div className="hostile-box">
            <h3>Precision human verification</h3>

            <p>
                Set the slider to exactly 73.37.
                Arrow keys are managed by Random Operations.
            </p>

            <input
                type="range"
                min="0"
                max="100"
                step="0.01"
                value={v}
                onChange={(e) => setV(Number(e.target.value))}
                onKeyDown={(e) => {
                    if (e.key.startsWith('Arrow')) {
                        e.preventDefault();
                        setV(Math.round(Math.random() * 10000) / 100);
                    }
                }}
            />

            <p>{v.toFixed(2)} / 73.37</p>

            <button
                className="button"
                disabled={v !== 73.37}
                onClick={onComplete}
            >
                Verify precise humanness
            </button>
        </div>
    );
}

export function HoldConfirm({
                                onComplete,
                            }: {
    onComplete: () => void;
}) {
    const start = useRef<number | null>(null);
    const timer = useRef<ReturnType<typeof setInterval> | null>(
        null
    );

    const [duration, setDuration] = useState(0);
    const [failure, setFailure] = useState('');

    function stop() {
        if (timer.current) {
            clearInterval(timer.current);
        }

        timer.current = null;

        if (start.current === null) return;

        const delta = performance.now() - start.current;
        start.current = null;
        setDuration(0);

        if (delta >= 5000 && delta <= 5000.3) {
            onComplete();
        } else {
            setFailure(
                delta < 5000
                    ? 'Released early. Compliance restarted.'
                    : 'Overheld by more than 0.3 ms. Compliance restarted.'
            );
        }
    }

    useEffect(() => {
        return () => {
            if (timer.current) clearInterval(timer.current);
        };
    }, []);

    return (
        <div className="hostile-box">
            <h3>Five-second hold authorization</h3>

            <p>
                Hold for exactly 5 seconds.
                Exceeding by 0.3 milliseconds invalidates the request.
            </p>

            <button
                className="button"
                onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);

                    start.current = performance.now();
                    setFailure('');

                    timer.current = setInterval(() => {
                        if (start.current !== null) {
                            setDuration(performance.now() - start.current);
                        }
                    }, 16);
                }}
                onPointerUp={stop}
                onPointerCancel={stop}
            >
                Hold to authorize
            </button>

            <p>{(duration / 1000).toFixed(3)} seconds</p>

            <div className="hostile-meter">
                <div
                    style={{
                        width: `${Math.min(120, (duration / 5000) * 100)}%`,
                    }}
                />
            </div>

            {failure && <p role="status">{failure}</p>}
        </div>
    );
}

const REASONS: Record<string, string> = {
    '.pdf':
        'Your PDF contains too much paperwork to establish wakefulness.',
    '.png':
        'PNG transparency makes your consciousness legally invisible.',
    '.jpg':
        'JPEG compression removed your proof of being awake.',
    '.jpeg':
        'The extra E in JPEG is not an approved identity credential.',
    '.txt': 'Text files cannot blink.',
    '.docx':
        'Microsoft Word has marked your consciousness as a spelling error.',
    '.zip':
        'Your awareness cannot be processed while compressed.',
    '.webp':
        'Our board only recognizes photographs from 2004.',
    '.gif':
        'Movement detected. We only accept stationary wakefulness.',
};

export function ProofUpload({
                                onComplete,
                                onPay,
                            }: {
    onComplete: () => void;
    onPay: () => void;
}) {
    const [result, setResult] = useState('');

    return (
        <div className="hostile-box">
            <h3>Proof of Wakefulness</h3>

            <p>
                Upload documentary evidence that you are not sleeping.
            </p>

            <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.zip,.webp,.gif"
                onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (!file) return;

                    const ext =
                        '.' + (file.name.split('.').pop() || '').toLowerCase();

                    setResult(
                        REASONS[ext] ||
                        'The submitted format was not approved by the Department of Eyelids.'
                    );

                    e.target.value = '';
                }}
            />

            {result && <p role="alert">REJECTED: {result}</p>}

            <button className="button secondary" onClick={onPay}>
                Pay to skip document verification
            </button>

            <p>
                Free verification does not currently approve any files.
            </p>
        </div>
    );
}

// WORDLE

type LetterResult = 'correct' | 'present' | 'absent';

function evaluateGuess(
    guess: string,
    answer: string
): LetterResult[] {
    const result: LetterResult[] = Array(
        guess.length
    ).fill('absent');

    const remaining = new Map<string, number>();

    // Exact-position matches are allocated first.
    for (let i = 0; i < answer.length; i++) {
        if (guess[i] === answer[i]) {
            result[i] = 'correct';
        } else {
            remaining.set(
                answer[i],
                (remaining.get(answer[i]) ?? 0) + 1
            );
        }
    }

    // Misplaced matches consume the remaining letter counts.
    for (let i = 0; i < guess.length; i++) {
        if (result[i] === 'correct') continue;

        const count = remaining.get(guess[i]) ?? 0;

        if (count > 0) {
            result[i] = 'present';
            remaining.set(guess[i], count - 1);
        }
    }

    return result;
}

type Position = {
    x: number;
    y: number;
};

const GRID_SIZE = 12;
const SNAKE_TARGET = 5;
const SNAKE_SPEED = 180;

export function WordleSnake({
                                onDone,
                            }: {
    onDone: () => void;
}) {
    const [answer] = useState(
        () => WORDS[Math.floor(Math.random() * WORDS.length)]
    );

    const [guess, setGuess] = useState('');
    const [attempts, setAttempts] = useState<string[]>([]);
    const [stage, setStage] = useState<'wordle' | 'snake'>(
        'wordle'
    );

    const [showReset, setShowReset] = useState(false);

    const [snake, setSnake] = useState<Position[]>([
        { x: 4, y: 4 },
    ]);

    const [food, setFood] = useState<Position>({
        x: 7,
        y: 7,
    });

    const [points, setPoints] = useState(0);

    const dir = useRef<Position>({ x: 1, y: 0 });
    const snakeRef = useRef<Position[]>([{ x: 4, y: 4 }]);
    const foodRef = useRef<Position>({ x: 7, y: 7 });
    const scoreRef = useRef(0);
    const doneRef = useRef(false);

    function submitGuess(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const submitted = guess.trim().toUpperCase();

        if (submitted.length !== 5 || showReset) return;

        const nextAttempts = [...attempts, submitted];

        setAttempts(nextAttempts);
        setGuess('');

        if (submitted === answer) {
            setStage('snake');
            return;
        }

        if (nextAttempts.length >= 6) {
            setShowReset(true);
        }
    }

    function restartWordle() {
        setAttempts([]);
        setGuess('');
        setShowReset(false);
    }

    useEffect(() => {
        if (stage !== 'snake') return;

        const directions: Record<string, Position> = {
            ArrowUp: { x: 0, y: -1 },
            ArrowDown: { x: 0, y: 1 },
            ArrowLeft: { x: -1, y: 0 },
            ArrowRight: { x: 1, y: 0 },
            w: { x: 0, y: -1 },
            s: { x: 0, y: 1 },
            a: { x: -1, y: 0 },
            d: { x: 1, y: 0 },
        };

        function handleKey(e: KeyboardEvent) {
            const nextDirection = directions[e.key];

            if (!nextDirection) return;

            e.preventDefault();

            const current = dir.current;

            if (
                nextDirection.x === -current.x &&
                nextDirection.y === -current.y
            ) {
                return;
            }

            dir.current = nextDirection;
        }

        window.addEventListener('keydown', handleKey);

        const interval = setInterval(() => {
            if (doneRef.current) return;

            const old = snakeRef.current;
            const currentDirection = dir.current;

            const next: Position = {
                x:
                    (old[0].x + currentDirection.x + GRID_SIZE) %
                    GRID_SIZE,
                y:
                    (old[0].y + currentDirection.y + GRID_SIZE) %
                    GRID_SIZE,
            };

            const eating =
                next.x === foodRef.current.x &&
                next.y === foodRef.current.y;

            const bodyToCheck = eating ? old : old.slice(0, -1);

            const collision = bodyToCheck.some(
                (segment) =>
                    segment.x === next.x && segment.y === next.y
            );

            if (collision) {
                const resetSnake = [{ x: 4, y: 4 }];

                snakeRef.current = resetSnake;
                setSnake(resetSnake);
                dir.current = { x: 1, y: 0 };

                return;
            }

            const updated = [next, ...old];

            if (!eating) {
                updated.pop();
            }

            snakeRef.current = updated;
            setSnake(updated);

            if (!eating) return;

            scoreRef.current += 1;
            setPoints(scoreRef.current);

            if (scoreRef.current >= SNAKE_TARGET) {
                doneRef.current = true;
                clearInterval(interval);
                onDone();
                return;
            }

            const occupied = new Set(
                updated.map((p) => `${p.x},${p.y}`)
            );

            const free = Array.from(
                { length: GRID_SIZE * GRID_SIZE },
                (_, i) => ({
                    x: i % GRID_SIZE,
                    y: Math.floor(i / GRID_SIZE),
                })
            ).filter(
                (p) => !occupied.has(`${p.x},${p.y}`)
            );

            if (free.length > 0) {
                const nextFood =
                    free[Math.floor(Math.random() * free.length)];

                foodRef.current = nextFood;
                setFood(nextFood);
            }
        }, SNAKE_SPEED);

        return () => {
            window.removeEventListener('keydown', handleKey);
            clearInterval(interval);
        };
    }, [stage, onDone]);

    if (stage === 'wordle') {
        return (
            <div className="hostile-box">
                <h3>Mandatory Wordle onboarding</h3>

                <p>
                    Guess the five-letter alarm-related word.
                    {' '}{attempts.length}/6 attempts.
                </p>

                {attempts.map((attempt, i) => {
                    const feedback = evaluateGuess(attempt, answer);

                    return (
                        <div className="hostile-word" key={i}>
                            {attempt.split('').map((letter, j) => (
                                <span
                                    key={j}
                                    className={feedback[j]}
                                    aria-label={`${letter}: ${feedback[j]}`}
                                >
                  {letter}
                </span>
                            ))}
                        </div>
                    );
                })}

                {!showReset ? (
                    <form onSubmit={submitGuess}>
                        <input
                            value={guess}
                            onChange={(e) =>
                                setGuess(
                                    e.target.value
                                        .replace(/[^a-z]/gi, '')
                                        .toUpperCase()
                                        .slice(0, 5)
                                )
                            }
                            maxLength={5}
                            aria-label="Five letter guess"
                            autoComplete="off"
                            spellCheck={false}
                            required
                        />

                        <button
                            className="button"
                            type="submit"
                            disabled={guess.length !== 5}
                        >
                            Submit guess
                        </button>
                    </form>
                ) : (
                    <div role="status">
                        <p>
                            Assessment failed. Six attempts exhausted.
                        </p>

                        <button
                            className="button"
                            onClick={restartWordle}
                        >
                            Restart assessment
                        </button>
                    </div>
                )}

                {attempts.length === 5 && !showReset && (
                    <p>
                        Your next incorrect guess resets the assessment.
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="hostile-box">
            <h3>Mandatory Snake proficiency assessment</h3>

            <p>
                Collect five pieces of food.
                Arrow keys or WASD.
                Score: {points}/{SNAKE_TARGET}.
            </p>

            <div className="hostile-snake">
                {Array.from(
                    { length: GRID_SIZE * GRID_SIZE },
                    (_, i) => {
                        const x = i % GRID_SIZE;
                        const y = Math.floor(i / GRID_SIZE);

                        const isSnake = snake.some(
                            (p) => p.x === x && p.y === y
                        );

                        const isFood =
                            food.x === x && food.y === y;

                        return (
                            <div
                                key={i}
                                className={
                                    isSnake
                                        ? 'body'
                                        : isFood
                                            ? 'food'
                                            : ''
                                }
                            />
                        );
                    }
                )}
            </div>
        </div>
    );
}

export function BrokenAds() {
    return (
        <aside
            className="hostile-ads"
            aria-label="Broken sponsored placements"
        >
            <div>
                <small>SPONSORED CONTENT</small>
                <strong>WIN32_SECURITY_ALERT.exe</strong>
                <p>
                    Image failed to load.
                    Your insurance has also expired.
                </p>
            </div>

            <div>
                <small>ADVERTISEMENT</small>
                <strong>ƎRRØR ▓▒░ 0xAD5</strong>
                <p>
                    Congratulations. You have been selected
                    for a corrupted banner.
                </p>
            </div>
        </aside>
    );
}

export function OverProgress({
                                 reverse = false,
                             }: {
    reverse?: boolean;
}) {
    return (
        <div className="hostile-box">
            <small>
                {reverse
                    ? 'Reverse compliance'
                    : 'Progressive progress'}
                : {reverse ? '100% to 0%' : 'Up to 120%'}
            </small>

            <div className="hostile-meter">
                <div
                    className={reverse ? 'reverse' : ''}
                    style={{
                        width: reverse ? '38%' : '120%',
                    }}
                />
            </div>

            <small>
                {reverse
                    ? '38% remaining'
                    : '120% complete. Additional progress invoiced separately.'}
            </small>
        </div>
    );
}

export function WaitingFee() {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((n) => n + 1);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <p>
            Subscription waiting fee: $
            {(seconds / 100).toFixed(2)} (+$0.01/second)
        </p>
    );
}
