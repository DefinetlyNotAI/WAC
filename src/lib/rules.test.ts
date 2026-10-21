import { test } from 'node:test';
import assert from 'node:assert/strict';
import { accrueDebt, businessDue, freeDismissal, invoice, makeCaptcha, nextAlarm, snoozePrice } from './rules.ts';
import { totp } from './totp.ts';

test('snooze doubles and applies consistent credit adjustments', () => {
  assert.deepEqual([0, 1, 2, 3].map(n => snoozePrice(n, 650)), [99, 198, 396, 792]);
  assert.equal(snoozePrice(0, 550), 124); assert.equal(snoozePrice(0, 499), 149);
});
test('invoice cents sum exactly with surge and optional tip', () => {
  for (const base of [99, 299, 2999, 4999]) for (const tip of [0, 20, 25, 30]) {
    const result = invoice(base, true, tip);
    assert.equal(result.total, result.lines.reduce((n, l) => n + l.cents, 0));
    assert.ok(result.lines.every(l => Number.isInteger(l.cents)));
  }
  assert.equal(invoice(99, false).total, 790);
});
test('dismissal hours respect boundaries and credit allowances', () => {
  assert.equal(freeDismissal(8, 650), false); assert.equal(freeDismissal(9, 650), true);
  assert.equal(freeDismissal(16, 650), true); assert.equal(freeDismissal(17, 650), false);
  assert.equal(freeDismissal(12, 499), false);
});
test('future alarm scheduling crosses the local date boundary', () => {
  const now = new Date(2026, 9, 21, 7, 0).getTime();
  assert.equal(nextAlarm('08:00', now), new Date(2026, 9, 21, 8).getTime());
  assert.equal(nextAlarm('06:00', now), new Date(2026, 9, 22, 6).getTime());
});
test('debt accrual is invariant under refresh and timer segmentation', () => {
  assert.equal(accrueDebt(123, 0), 123);
  assert.ok(Math.abs(accrueDebt(0, 120) - accrueDebt(accrueDebt(0, 60), 60)) < .00001);
  assert.ok(accrueDebt(0, 60) >= 60); assert.ok(accrueDebt(10000, 1) > 10001);
});
test('government business days skip weekends', () => {
  assert.equal(businessDue(3, new Date(2026, 9, 23, 10).getTime()), new Date(2026, 9, 28, 10).getTime());
});
test('random CAPTCHA answers match the generated tiles', () => {
  const layouts = new Set<string>();
  for (let i = 0; i < 100; i++) {
    const c = makeCaptcha(); assert.equal(c.tiles.length, 9); assert.ok(c.correct.length > 0);
    const target = c.tiles[c.correct[0]];
    assert.deepEqual(c.correct, c.tiles.flatMap((tile, j) => tile === target ? [j] : []));
    layouts.add(c.tiles.join(','));
  }
  assert.ok(layouts.size > 1);
});
test('local TOTP matches RFC 6238 six-digit vector', async () => {
  assert.equal(await totp('12345678901234567890', 59000), '287082');
});
