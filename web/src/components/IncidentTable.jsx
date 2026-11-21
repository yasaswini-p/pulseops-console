import PriorityPill from "./PriorityPill";
import { formatRemaining, statusLabel } from "../utils/format";

export default function IncidentTable({ incidents, now }) {
  return (
    <section className="panel">
      <h2>Active incidents <span className="muted small">(most urgent first)</span></h2>
      {incidents.length === 0 ? (
        <p className="muted">No active incidents.</p>
      ) : (
        <table className="table">
          <thead>
            <tr><th>ID</th><th>Title</th><th>Priority</th><th>Team</th><th>Status</th><th>Assignee</th><th>SLA</th></tr>
          </thead>
          <tbody>
            {incidents.map(i => {
              const sla = formatRemaining(i.slaDueAt, now);
              return (
                <tr key={i.incidentId} className={sla.breached ? "row-breached" : ""}>
                  <td><strong>{i.incidentId}</strong></td>
                  <td>{i.title}</td>
                  <td><PriorityPill priority={i.priority} /></td>
                  <td>{i.team}</td>
                  <td><span className={`status status-${i.status}`}>{statusLabel(i.status)}</span></td>
                  <td>{i.assignee || <span className="muted">Unassigned</span>}</td>
                  <td className={sla.breached ? "text-danger" : "text-good"}>{sla.text}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}