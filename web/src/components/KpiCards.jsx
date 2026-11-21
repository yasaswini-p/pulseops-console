function StatCard({ label, value, sub, tone }) {
  return (
    <div className={`card stat ${tone || ""}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export default function KpiCards({ summary }) {
  const p1 = summary.openByPriority.P1 || 0;
  return (
    <div className="kpis">
      <StatCard label="Open incidents" value={summary.open} sub={`${p1} critical (P1)`} />
      <StatCard label="SLA breached (open)" value={summary.breachedOpen} tone={summary.breachedOpen > 0 ? "danger" : "good"} />
      <StatCard label="Escalated (open)" value={summary.escalatedOpen} tone={summary.escalatedOpen > 0 ? "warn" : ""} />
      <StatCard
        label="SLA compliance"
        value={summary.compliancePct === null ? "—" : `${summary.compliancePct}%`}
        sub={`${summary.resolved} resolved incidents`}
        tone={summary.compliancePct >= 90 ? "good" : "warn"}
      />
    </div>
  );
}