/**
 * Timezone-aware helpers. Timestamps are stored in UTC; the dashboard displays and filters in
 * the configured zone (default Africa/Cairo, which observes DST from the last Friday of April to
 * the last Thursday of October). Uses the platform's IANA data through Intl.
 */
export const DEFAULT_TIMEZONE = 'Africa/Cairo';

export function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

function parts(date: Date, tz: string) {
  const f = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const p = Object.fromEntries(f.formatToParts(date).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, h: +p.hour, min: +p.minute, s: +p.second };
}

/** Offset (ms) of the zone at a given instant: local wall clock minus UTC. */
export function zoneOffsetMs(instant: Date, tz: string): number {
  const p = parts(instant, tz);
  const asUtc = Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s);
  return asUtc - Math.floor(instant.getTime() / 1000) * 1000;
}

/**
 * Converts a local wall-clock time in `tz` to a UTC instant. For a wall time that occurs twice
 * (DST fall-back) the earlier instant is returned; for a skipped time (spring-forward gap)
 * the result is shifted forward by the gap.
 */
export function zonedTimeToUtc(y: number, m: number, d: number, h: number, min: number, tz: string): Date {
  const wall = Date.UTC(y, m - 1, d, h, min, 0);
  const HALF_DAY = 12 * 60 * 60 * 1000;
  // Offsets in force shortly before and after this wall time (they differ only near a transition).
  const before = zoneOffsetMs(new Date(wall - HALF_DAY), tz);
  const after = zoneOffsetMs(new Date(wall + HALF_DAY), tz);
  const matches = (u: number) => {
    const p = parts(new Date(u), tz);
    return p.y === y && p.m === m && p.d === d && p.h === h && p.min === min;
  };
  const valid = [wall - before, wall - after].filter(matches);
  // Repeated wall time (fall-back): the earlier instant. Skipped wall time (spring-forward gap):
  // interpret with the pre-transition offset, i.e. shifted forward by the gap.
  return new Date(valid.length ? Math.min(...valid) : wall - before);
}

/** YYYY-MM-DD of the instant in the zone. */
export function zonedDayKey(instant: Date, tz: string): string {
  const p = parts(instant, tz);
  return `${p.y}-${String(p.m).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
}

/** [start, end) UTC instants of a local calendar day (handles 23/25-hour DST days). */
export function zonedDayRange(dayKey: string, tz: string): { start: Date; end: Date } {
  const [y, m, d] = dayKey.split('-').map(Number);
  const start = zonedTimeToUtc(y, m, d, 0, 0, tz);
  const next = new Date(Date.UTC(y, m - 1, d + 1));
  const end = zonedTimeToUtc(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate(), 0, 0, tz);
  return { start, end };
}

export type DueState = 'overdue' | 'today' | 'upcoming';

/** Overdue once the due instant has passed; "today" when it falls on the current local day. */
export function dueState(dueAt: Date, now: Date, tz: string): DueState {
  if (dueAt.getTime() < now.getTime()) return 'overdue';
  return zonedDayKey(dueAt, tz) === zonedDayKey(now, tz) ? 'today' : 'upcoming';
}

/** Parses an <input type="datetime-local"> value interpreted in `tz`. */
export function parseLocalDateTime(value: string, tz: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const [, y, mo, d, h, mi] = m.map(Number);
  if (mo < 1 || mo > 12 || d < 1 || h > 23 || mi > 59) return null;
  const check = new Date(Date.UTC(y, mo - 1, d));
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null; // e.g. 30 February
  return zonedTimeToUtc(y, mo, d, h, mi, tz);
}

/** Formats an instant as a datetime-local value in `tz` (for edit forms). */
export function toLocalInputValue(instant: Date, tz: string): string {
  const p = parts(instant, tz);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${p.y}-${pad(p.m)}-${pad(p.d)}T${pad(p.h)}:${pad(p.min)}`;
}

/** Last-N-days window ending now, aligned to local day starts. */
export function windowRange(days: number, now: Date, tz: string): { start: Date; end: Date } {
  const todayKey = zonedDayKey(now, tz);
  const [y, m, d] = todayKey.split('-').map(Number);
  const first = new Date(Date.UTC(y, m - 1, d - (days - 1)));
  const start = zonedTimeToUtc(first.getUTCFullYear(), first.getUTCMonth() + 1, first.getUTCDate(), 0, 0, tz);
  return { start, end: zonedDayRange(todayKey, tz).end };
}
