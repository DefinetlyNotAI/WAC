/** Pure validation helpers for the deliberately awkward onboarding challenges. */
export type LetterResult = 'correct' | 'present' | 'absent';

/** Wordle matching accounts for repeated letters in two passes. */
export function evaluateGuess(guess: string, answer: string): LetterResult[] {
    const result: LetterResult[] = Array(guess.length).fill('absent');
    const available = new Map<string, number>();
    for (let i = 0; i < answer.length; i++) {
        if (guess[i] === answer[i]) result[i] = 'correct';
        else available.set(answer[i], (available.get(answer[i]) ?? 0) + 1);
    }
    for (let i = 0; i < guess.length; i++) {
        if (result[i] === 'correct') continue;
        const count = available.get(guess[i]) ?? 0;
        if (count > 0) {
            result[i] = 'present';
            available.set(guess[i], count - 1);
        }
    }
    return result;
}

/** Only small UTF-8 text declarations are eligible for free verification. */
export function isValidWakefulnessProof(filename: string, size: number, content: string): boolean {
    return /\.txt$/i.test(filename) && size <= 16 * 1024 && size >= 0
        && /\bI AM AWAKE\b/i.test(content);
}
