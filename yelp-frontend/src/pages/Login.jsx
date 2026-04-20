import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { login, clearError } from "../store/authSlice";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { loading, error: submitError } = useSelector((s) => s.auth);
  const successMessage = location.state?.message || "";
  const [form, setForm] = useState({ email: "", password: "" });
  const [touched, setTouched] = useState({});

  useEffect(() => { dispatch(clearError()); }, [dispatch]);

  // Slideshow
  const images = useMemo(() => {
    const modules = import.meta.glob("../assets/*.avif", { eager: true, import: "default" });
    return Object.entries(modules)
      .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
      .map(([, src]) => src);
  }, []);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!images.length) return;
    const id = setInterval(() => setIndex((p) => (p + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [images.length]);

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
    if (!isValid) return;
    const result = await dispatch(login({ email: form.email.trim(), password: form.password }));
    if (login.fulfilled.match(result)) {
      navigate("/explore");
    }
  }

  return (
    <div className="auth-bg">
      {images.map((img, i) => (
        <div
          key={`${img}-${i}`}
          className={`hero-slide ${i === index ? "active" : ""}`}
          style={{ backgroundImage: `url(${img})` }}
        />
      ))}
      <div className="auth-bg-overlay" />

      <div className="auth-center">
        <div className="auth-card">
          <div className="auth-logo">🍽️</div>
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Log in to write reviews and use the assistant.</p>

          {successMessage && (
            <div className="auth-alert auth-alert--success">{successMessage}</div>
          )}
          {submitError && <div className="auth-alert">{submitError}</div>}

          <form onSubmit={onSubmit} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email</label>
              <input
                className="auth-input"
                name="email"
                value={form.email}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="you@example.com"
                autoComplete="email"
              />
              {showErr("email") && <div className="auth-error">{errors.email}</div>}
            </div>

            <div className="auth-field">
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              {showErr("password") && <div className="auth-error">{errors.password}</div>}
            </div>

            <button className="auth-primary" type="submit" disabled={!isValid || loading}>
              {loading ? "Logging in…" : "Log In"}
            </button>

            <div className="auth-footer">
              New here? <Link to="/signup">Create an account</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
