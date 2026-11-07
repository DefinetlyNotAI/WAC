import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateGuess, isValidWakefulnessProof } from './verification';

test('Wordle prioritizes exact matches when guesses repeat letters', () => {
    assert.deepEqual(evaluateGuess('CCCCC', 'CLOCK'), ['correct', 'absent', 'absent', 'correct', 'absent']);
    assert.deepEqual(evaluateGuess('LLAMA', 'ALARM'), ['absent', 'correct', 'correct', 'present', 'present']);
    assert.deepEqual(evaluateGuess('ALARM', 'ALARM'), Array(5).fill('correct'));
});

test('text proof approval requires an eligible declaration and bounded size', () => {
    assert.equal(isValidWakefulnessProof('awake.txt', 10, 'I AM AWAKE'), true);
    assert.equal(isValidWakefulnessProof('awake.PDF', 10, 'I AM AWAKE'), false);
    assert.equal(isValidWakefulnessProof('awake.txt', 16385, 'I AM AWAKE'), false);
    assert.equal(isValidWakefulnessProof('awake.txt', 10, 'I AM ASLEEP'), false);
});
