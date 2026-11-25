/**
 * Parse backend UTC ISO timestamps safely.
 * Backend stores naive UTC datetimes (e.g. "2026-11-25T10:16:00.123456") without a "Z" suffix.
 * Appending "Z" when no timezone offset is present ensures JS interprets them as UTC before converting to IST.
 */
export function parseUTCTimestamp(ts?: string | null): Date | null {
  if (!ts) return null;
  const trimmed = ts.trim();
  if (!trimmed) return null;
  const hasTZ = /([zZ]|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const normalized = hasTZ ? trimmed : `${trimmed}Z`;
  const d = new Date(normalized);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatISTDateTime(
  ts?: string | null,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
): string {
  const d = parseUTCTimestamp(ts);
  if (!d) return '';
  return d.toLocaleString('en-IN', { ...options, timeZone: 'Asia/Kolkata' });
}

export function formatISTTime(ts?: string | null): string {
  const d = parseUTCTimestamp(ts);
  if (!d) return '';
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata',
  });
}

export function formatISTDate(
  ts?: string | null,
  options: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }
): string {
  const d = parseUTCTimestamp(ts);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { ...options, timeZone: 'Asia/Kolkata' });
}
