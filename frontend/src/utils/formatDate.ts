/**
 * Format an ISO date string into a human-readable date.
 * e.g. "2025-06-15T18:00:00Z" → "Jun 15, 2025"
 */
export function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format an ISO date string into date + time.
 * e.g. "2025-06-15T18:00:00Z" → "Jun 15, 2025, 6:00 PM"
 */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Return relative time string.
 * e.g. "3 days from now", "2 hours ago"
 */
export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSeconds);

  if (absSec < 60) return diffSeconds >= 0 ? 'Just now' : 'Just now';
  if (absSec < 3600) {
    const mins = Math.round(absSec / 60);
    return diffSeconds > 0 ? `In ${mins}m` : `${mins}m ago`;
  }
  if (absSec < 86400) {
    const hours = Math.round(absSec / 3600);
    return diffSeconds > 0 ? `In ${hours}h` : `${hours}h ago`;
  }
  const days = Math.round(absSec / 86400);
  return diffSeconds > 0 ? `In ${days}d` : `${days}d ago`;
}

/**
 * Convert a Date object to an ISO date-only string for form inputs.
 * e.g. Date → "2025-06-15"
 */
export function toDateInputValue(date?: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

/**
 * Check if a date is in the future.
 */
export function isFuture(iso?: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() > Date.now();
}
