export default function LoginForm({ form, error, loading, onChange, onSubmit }) {
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={onSubmit}>
        <h1>PulseOps</h1>
        <p className="muted">Manager Dashboard</p>

        <label>
          Username
          <input name="username" value={form.username} onChange={onChange} autoComplete="username" required />
        </label>
        <label>
          Password
          <input name="password" type="password" value={form.password} onChange={onChange} autoComplete="current-password" required />
        </label>

        {error && <div className="alert">{error}</div>}
        <button className="btn" type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
      </form>
    </div>
  );
}