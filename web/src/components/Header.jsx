import { formatTime } from "../utils/format";

export default function Header({ user, lastUpdated, onRefresh, onLogout }) {
  return (
    <header className="header">
      <div>
        <strong className="brand">PulseOps</strong>
        <span className="muted"> · Manager Dashboard</span>
      </div>
      <div className="header-right">
        <span className="muted small">Updated {lastUpdated ? formatTime(lastUpdated) : "—"}</span>
        <button className="btn-link" onClick={onRefresh}>Refresh</button>
        <span className="user">{user.name}</span>
        <button className="btn-outline" onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}