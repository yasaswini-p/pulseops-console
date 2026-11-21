// All communication with the Express API goes through this module
const TOKEN_KEY = "pulseops.manager.token";
const USER_KEY = "pulseops.manager.user";

export function getSession() {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = JSON.parse(localStorage.getItem(USER_KEY) || "null");
    return token && user ? { token, user } : null;
  } catch {
    return null;
  }
}

export function saveSession({ token, user }) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* storage unavailable: session lasts until refresh */ }
}

export function clearSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* ignore */ }
}

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", body } = {}) {
  const session = getSession();
  const response = await fetch(`/api${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(response.status, data.error || `Request failed (${response.status})`);
  return data;
}

export const api = {
  login: (username, password) => request("/auth/login", { method: "POST", body: { username, password } }),
  summary: () => request("/analytics/summary"),
  teams: () => request("/analytics/teams"),
  escalations: () => request("/analytics/escalations"),
  activeIncidents: () => request("/incidents?status=active&sort=sla&limit=20"),
  collections: () => request("/admin/collections")
};
