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

export function formatRelativeTime(iso?: string | null): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const absSec = Math.abs(diffSeconds);

  if (absSec < 60) return 'Just now';
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

export function toDateInputValue(date?: Date | null): string {
  if (!date) return '';
  return date.toISOString().split('T')[0];
}

export function isFuture(iso?: string | null, endIso?: string | null): boolean {
  const effective = endIso || iso;
  if (!effective) return false;
  return new Date(effective).getTime() > Date.now();
}

export function formatDateRange(startIso?: string, endIso?: string): string {
  if (!startIso) return '—';
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return '—';

  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (!endIso) {
    return start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const end = new Date(endIso);
  if (isNaN(end.getTime())) {
    return start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) {
    return start.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  const endStr = end.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return `${startStr} \u2013 ${endStr}`;
}

export function getDurationDays(startIso?: string, endIso?: string): number | null {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;

  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endDay = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  const diffDays = Math.round((endDay - startDay) / 86_400_000);
  if (diffDays <= 0) return null;

  return diffDays + 1;
}

export function formatDuration(startIso?: string, endIso?: string): string | null {
  const days = getDurationDays(startIso, endIso);
  if (days === null) return null;
  return `${days} days`;
}

export function formatDateTimeRange(startIso?: string, endIso?: string): string {
  if (!startIso) return '—';
  const start = new Date(startIso);
  if (isNaN(start.getTime())) return '—';

  const fmtOpts: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  };

  const startStr = start.toLocaleDateString('en-US', fmtOpts);

  if (!endIso) return startStr;

  const end = new Date(endIso);
  if (isNaN(end.getTime())) return startStr;

  if (start.getTime() === end.getTime()) return startStr;

  const endStr = end.toLocaleDateString('en-US', fmtOpts);
  return `${startStr} \u2013 ${endStr}`;
}
