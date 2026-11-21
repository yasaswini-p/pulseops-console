// Root component: shows the login screen or the dashboard depending on the session
import { useState } from "react";
import LoginContainer from "./containers/LoginContainer";
import DashboardContainer from "./containers/DashboardContainer";
import { getSession, saveSession, clearSession } from "./services/api";

export default function App() {
  const [session, setSession] = useState(getSession);

  const handleLogin = newSession => {
    saveSession(newSession);
    setSession(newSession);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  return session
    ? <DashboardContainer user={session.user} onLogout={handleLogout} />
    : <LoginContainer onLogin={handleLogin} />;
}