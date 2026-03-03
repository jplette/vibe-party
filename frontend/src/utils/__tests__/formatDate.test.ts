import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  toDateInputValue,
  isFuture,
} from '../formatDate';

// ─── formatDate ───────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    // Use a fixed date to avoid locale-dependent offset surprises
    const result = formatDate('2025-06-15T12:00:00Z');
    expect(result).toMatch(/Jun 15, 2025/);
  });

  it('returns dash for null', () => {
    expect(formatDate(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatDate(undefined)).toBe('—');
  });

  it('returns dash for empty string', () => {
    expect(formatDate('')).toBe('—');
  });

  it('returns dash for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('—');
  });

  it('formats a date with no time component', () => {
    const result = formatDate('2024-12-31');
    expect(result).toMatch(/Dec 3[01], 2024/);
  });
});

// ─── formatDateTime ───────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('includes date and time', () => {
    // 2025-06-15 at noon UTC → locale will show time
    const result = formatDateTime('2025-06-15T12:00:00Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2025/);
    // Should include some AM/PM indicator or numeric hour
    expect(result).toMatch(/\d+:\d+/);
  });

  it('returns dash for null', () => {
    expect(formatDateTime(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('returns dash for invalid input', () => {
    expect(formatDateTime('garbage')).toBe('—');
  });
});

// ─── formatRelativeTime ───────────────────────────────────────────────────────

describe('formatRelativeTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns dash for null', () => {
    expect(formatRelativeTime(null)).toBe('—');
  });

  it('returns dash for undefined', () => {
    expect(formatRelativeTime(undefined)).toBe('—');
  });

  it('returns dash for invalid date', () => {
    expect(formatRelativeTime('bad')).toBe('—');
  });

  it('shows "In Xm" for a date a few minutes in the future', () => {
    const soon = new Date('2026-01-01T00:05:00Z').toISOString();
    expect(formatRelativeTime(soon)).toBe('In 5m');
  });

  it('shows "Xm ago" for a date a few minutes in the past', () => {
    const ago = new Date('2025-12-31T23:55:00Z').toISOString();
    expect(formatRelativeTime(ago)).toBe('5m ago');
  });

  it('shows "In Xh" for a date hours in the future', () => {
    const future = new Date('2026-01-01T03:00:00Z').toISOString();
    expect(formatRelativeTime(future)).toBe('In 3h');
  });

  it('shows "Xh ago" for a date hours in the past', () => {
    const past = new Date('2025-12-31T21:00:00Z').toISOString();
    expect(formatRelativeTime(past)).toBe('3h ago');
  });

  it('shows "In Xd" for a date days in the future', () => {
    const future = new Date('2026-01-04T00:00:00Z').toISOString();
    expect(formatRelativeTime(future)).toBe('In 3d');
  });

  it('shows "Xd ago" for a date days in the past', () => {
    const past = new Date('2025-12-29T00:00:00Z').toISOString();
    expect(formatRelativeTime(past)).toBe('3d ago');
  });

  it('returns "Just now" for a date within one minute', () => {
    const now = new Date('2026-01-01T00:00:30Z').toISOString();
    expect(formatRelativeTime(now)).toBe('Just now');
  });
});

// ─── toDateInputValue ─────────────────────────────────────────────────────────

describe('toDateInputValue', () => {
  it('converts a Date object to YYYY-MM-DD string', () => {
    const date = new Date('2025-06-15T18:00:00Z');
    expect(toDateInputValue(date)).toBe('2025-06-15');
  });

  it('returns empty string for null', () => {
    expect(toDateInputValue(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(toDateInputValue(undefined)).toBe('');
  });
});

// ─── isFuture ─────────────────────────────────────────────────────────────────

describe('isFuture', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-01T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true for a date in the future', () => {
    expect(isFuture('2027-01-01T00:00:00Z')).toBe(true);
  });

  it('returns false for a date in the past', () => {
    expect(isFuture('2025-01-01T00:00:00Z')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isFuture(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isFuture(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isFuture('')).toBe(false);
  });
});
