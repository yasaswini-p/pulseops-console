export default function TeamPerformance({ teams }) {
  return (
    <section className="panel">
      <h2>Team performance</h2>
      <table className="table">
        <thead>
          <tr><th>Team</th><th>Open</th><th>SLA compliance</th></tr>
        </thead>
        <tbody>
          {teams.map(t => (
            <tr key={t.code}>
              <td>
                <div>{t.name}</div>
                <div className="muted small">Lead: {t.lead}</div>
              </td>
              <td>{t.open}</td>
              <td className="bar-cell">
                <div className="bar">
                  <div className={`bar-fill ${t.compliancePct < 80 ? "low" : ""}`} style={{ width: `${t.compliancePct || 0}%` }} />
                </div>
                <span className="bar-value">{t.compliancePct ?? "—"}%</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}