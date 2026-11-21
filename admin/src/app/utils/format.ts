export function formatRemaining(dueAt: string, now: number): { text: string; breached: boolean } {
  const ms = new Date(dueAt).getTime() - now;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const text = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  return { text: ms < 0 ? `${text} overdue` : `${text} left`, breached: ms < 0 };
}

// Turns an HTTP or application error into a readable message
export function errorMessage(err: unknown): string {
  const e = err as { status?: number; message?: string; error?: { error?: string; details?: string[] } };
  if (e?.status === 0) return 'Cannot reach the API. Is the Express server running?';
  const base = e?.error?.error ?? e?.message ?? 'Something went wrong';
  const details = e?.error?.details;
  return details && details.length ? `${base}: ${details.join('; ')}` : base;
}