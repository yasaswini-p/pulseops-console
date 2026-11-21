// Shared formatting helpers

export function formatRemaining(dueAt, now = Date.now()) {
  const ms = new Date(dueAt).getTime() - now;
  const abs = Math.abs(ms);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);
  const text = h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`;
  return { text: ms < 0 ? `${text} overdue` : `${text} left`, breached: ms < 0 };
}

export function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
  });
}

export function statusLabel(status) {
  return status.replace("_", " ").toLowerCase().replace(/^\w/, c => c.toUpperCase());
}