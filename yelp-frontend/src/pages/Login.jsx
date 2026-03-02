import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const errors = useMemo(() => {
    const e = {};
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function onBlur(e) {
    setTouched((p) => ({ ...p, [e.target.name]: true }));
  }

  function showErr(field) {
    return touched[field] && errors[field];
  }

  async function onSubmit(e) {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setSubmitError("");
    if (!isValid) return;

    const email = form.email.trim();
    const password = form.password;

    try {
      setLoading(true);

      // ✅ Send JSON because your /api/auth/login accepts JSON (per Swagger curl example)
      const res = await api.post("/api/auth/login", { email, password });

      const token = res?.data?.access_token;
      const tokenType = res?.data?.token_type || "bearer";

      if (!token) throw new Error("No access_token returned from server.");

      localStorage.setItem("token", token);
      localStorage.setItem("token_type", tokenType);
      if (res?.data?.user) localStorage.setItem("user", JSON.stringify(res.data.user));

      navigate("/explore");
    } catch (err) {
      // ✅ Make sure we never try to render an object as an error message
      let msg = "Login failed. Please try again.";

      const data = err?.response?.data;
      if (typeof data === "string") msg = data;
      else if (data?.detail) msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      else if (data?.message) msg = data.message;
      else if (err?.message) msg = err.message;

      setSubmitError(msg);
      console.error("LOGIN ERROR:", err?.response || err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Log in to write reviews and use the assistant.</p>

        {submitError ? <div className="auth-alert">{submitError}</div> : null}

        <form onSubmit={onSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              className="auth-input"
              name="email"
              value={form.email}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="you@example.com"
              autoComplete="email"
            />
            {showErr("email") ? <div className="auth-error">{errors.email}</div> : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="login-password">Password</label>
            <input
              id="login-password"
              className="auth-input"
              type="password"
              name="password"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {showErr("password") ? <div className="auth-error">{errors.password}</div> : null}
          </div>

          <button className="auth-primary" type="submit" disabled={!isValid || loading}>
            {loading ? "Logging in..." : "Log In"}
          </button>

          <div className="auth-footer">
            New here? <Link to="/signup">Create an account</Link>
          </div>
        </form>
      </div>
    </div>
  );
}