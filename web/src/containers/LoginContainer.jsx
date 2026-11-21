// CONTAINER — owns the login form state and talks to the API
import { useState } from "react";
import LoginForm from "../components/LoginForm";
import { api } from "../services/api";

export default function LoginContainer({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = event => setForm({ ...form, [event.target.name]: event.target.value });

  const handleSubmit = async event => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const result = await api.login(form.username, form.password);
      if (result.user.role !== "manager") {
        throw new Error("This dashboard is for managers. Operators should use the Operator Console.");
      }
      onLogin(result);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return <LoginForm form={form} error={error} loading={loading} onChange={handleChange} onSubmit={handleSubmit} />;
}