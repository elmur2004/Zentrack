import './env';
import { eq } from 'drizzle-orm';
import { describe, expect, it } from 'vitest';
import { quoteRequest } from '@/server/db/schema';
import { defaultQuery } from '@/lib/admin/query';
import { listRequests } from '@/server/admin/requests';
import { dueState, parseLocalDateTime, toLocalInputValue, windowRange, zonedDayKey, zonedDayRange } from '@/server/admin/time';
import { db, member, submit } from './fixtures';

const TZ = 'Africa/Cairo';
const hours = (r: { start: Date; end: Date }) => (r.end.getTime() - r.start.getTime()) / 3_600_000;

describe('Africa/Cairo calendar handling (stored UTC, local-day boundaries)', () => {
  it('treats 29 Oct 2026 (DST ends at midnight) as a 25-hour local day', () => {
    const day = zonedDayRange('2026-10-29', TZ);
    expect(day.start.toISOString()).toBe('2026-10-28T21:00:00.000Z');
    expect(day.end.toISOString()).toBe('2026-10-29T22:00:00.000Z');
    expect(hours(day)).toBe(25);
    expect(hours(zonedDayRange('2026-10-28', TZ))).toBe(24);
    expect(hours(zonedDayRange('2026-10-30', TZ))).toBe(24);
  });

  it('treats 24 Apr 2026 (DST starts at midnight) as a 23-hour local day', () => {
    const day = zonedDayRange('2026-04-24', TZ);
    expect(day.start.toISOString()).toBe('2026-04-23T22:00:00.000Z');
    expect(hours(day)).toBe(23);
  });

  it('resolves repeated and skipped wall-clock times predictably', () => {
    // 23:30 on 29 Oct happens twice: the earlier (summer time) instant is used.
    expect(parseLocalDateTime('2026-10-29T23:30', TZ)?.toISOString()).toBe('2026-10-29T20:30:00.000Z');
    // 00:30 on 24 Apr never happens: it moves forward by the one-hour gap (01:30 summer time).
    expect(parseLocalDateTime('2026-04-24T00:30', TZ)?.toISOString()).toBe('2026-04-23T22:30:00.000Z');
    expect(parseLocalDateTime('2026-10-28T10:00', TZ)?.toISOString()).toBe('2026-10-28T07:00:00.000Z');
    expect(parseLocalDateTime('2026-11-02T10:00', TZ)?.toISOString()).toBe('2026-11-02T08:00:00.000Z');
    expect(toLocalInputValue(new Date('2026-10-29T20:30:00Z'), TZ)).toBe('2026-10-29T23:30');
    expect(toLocalInputValue(new Date('2026-10-29T21:30:00Z'), TZ)).toBe('2026-10-29T23:30');
    expect(parseLocalDateTime('2026-02-30T10:00', TZ)).toBeNull();
    expect(parseLocalDateTime('not a date', TZ)).toBeNull();
  });

  it('labels follow-ups overdue / due today / upcoming around local midnight', () => {
    const now = new Date('2026-10-28T20:00:00Z'); // 23:00 local, 28 Oct
    expect(dueState(new Date('2026-10-28T19:59:00Z'), now, TZ)).toBe('overdue');
    expect(dueState(new Date('2026-10-28T20:30:00Z'), now, TZ)).toBe('today'); // 23:30 local
    expect(dueState(new Date('2026-10-28T21:01:00Z'), now, TZ)).toBe('upcoming'); // 00:01 local, 29 Oct
    expect(zonedDayKey(new Date('2026-10-29T21:30:00Z'), TZ)).toBe('2026-10-29'); // repeated hour is still 29 Oct
  });

  it('builds metric windows from whole local days', () => {
    const w = windowRange(7, new Date('2026-10-28T12:00:00Z'), TZ);
    expect(w.start.toISOString()).toBe('2026-10-21T21:00:00.000Z');
    expect(w.end.toISOString()).toBe('2026-10-28T21:00:00.000Z');
  });

  it('filters received dates with timezone-aware, inclusive local days across the DST change', async () => {
    const owner = await member('owner');
    const d = await db();
    const at = async (iso: string, company: string) => {
      const r = await submit({ company });
      await d.update(quoteRequest).set({ createdAt: new Date(iso) }).where(eq(quoteRequest.id, r.id));
    };
    await at('2026-10-28T20:59:00Z', 'Day 28 late'); // 23:59 local 28 Oct
    await at('2026-10-28T21:01:00Z', 'Day 29 early'); // 00:01 local 29 Oct
    await at('2026-10-29T21:30:00Z', 'Day 29 repeated hour'); // 23:30 (second time) local 29 Oct
    await at('2026-10-29T22:01:00Z', 'Day 30 early'); // 00:01 local 30 Oct
    const res = await listRequests(d, owner, { ...defaultQuery('inbox'), from: '2026-10-29', to: '2026-10-29', pageSize: 50 }, TZ);
    expect(res.rows.map((r) => r.company).sort()).toEqual(['Day 29 early', 'Day 29 repeated hour']);
  }, 60_000);
});
