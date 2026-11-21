import PriorityPill from "./PriorityPill";
import { formatTime, statusLabel } from "../utils/format";

export default function EscalationList({ escalations }) {
  return (
    <section className="panel">
      <h2>Recent escalations</h2>
      {escalations.length === 0 ? (
        <p className="muted">No escalations.</p>
      ) : (
        <ul className="list">
          {escalations.map(e => (
            <li key={e.incidentId}>
              <div className="list-top">
                <PriorityPill priority={e.priority} />
                <strong>{e.incidentId}</strong>
                <span className={`status status-${e.status}`}>{statusLabel(e.status)}</span>
              </div>
              <div>{e.title}</div>
              <div className="muted small">Escalated to {e.escalatedTo} · {formatTime(e.escalatedAt)}</div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}