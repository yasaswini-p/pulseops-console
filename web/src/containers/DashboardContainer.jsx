// CONTAINER — loads all dashboard data, refreshes it, and passes it down as props
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { api } from "../services/api";
import Header from "../components/Header";
import KpiCards from "../components/KpiCards";
import TeamPerformance from "../components/TeamPerformance";
import EscalationList from "../components/EscalationList";
import IncidentTable from "../components/IncidentTable";

// Code splitting: Webpack puts this component in a separate file, loaded only when needed
const CollectionsPanel = lazy(() => import(/* webpackChunkName: "collections" */ "../components/CollectionsPanel"));

const REFRESH_MS = 15000;

export default function DashboardContainer({ user, onLogout }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [showCollections, setShowCollections] = useState(false);
  const [collections, setCollections] = useState(null);

  const load = useCallback(async () => {
    try {
      const [summary, teams, incidents, escalations] = await Promise.all([
        api.summary(), api.teams(), api.activeIncidents(), api.escalations()
      ]);
      setData({
        summary,
        teams: teams.teams,
        incidents: incidents.incidents,
        escalations: escalations.escalations
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (err.status === 401) onLogout();
      else setError(err.message);
    }
  }, [onLogout]);

  // Load immediately, then refresh every 15 seconds
  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  // Tick every second so SLA countdowns stay live
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fetch collection statistics the first time the panel is opened
  useEffect(() => {
    if (showCollections && !collections) {
      api.collections().then(setCollections).catch(err => setError(err.message));
    }
  }, [showCollections, collections]);

  return (
    <div className="app">
      <Header user={user} lastUpdated={lastUpdated} onRefresh={load} onLogout={onLogout} />
      <main className="content">
        {error && <div className="alert">{error}</div>}

        {!data ? (
          <p className="muted">Loading dashboard…</p>
        ) : (
          <>
            <KpiCards summary={data.summary} />
            <div className="grid">
              <TeamPerformance teams={data.teams} />
              <EscalationList escalations={data.escalations} />
            </div>
            <IncidentTable incidents={data.incidents} now={now} />

            <section className="panel">
              <div className="panel-head">
                <h2>Data management</h2>
                <button className="btn-link" onClick={() => setShowCollections(v => !v)}>
                  {showCollections ? "Hide" : "Show"} collection statistics
                </button>
              </div>
              {showCollections && (
                <Suspense fallback={<p className="muted">Loading…</p>}>
                  <CollectionsPanel data={collections} />
                </Suspense>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}