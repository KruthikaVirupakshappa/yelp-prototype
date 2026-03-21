import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../services/api";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
    role: "user",
    restaurant_location: "",
  });
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (!form.name.trim()) e.name = "Name is required.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Min 6 characters.";
    if (!form.confirm) e.confirm = "Confirm your password.";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match.";
    if (form.role === "owner" && !form.restaurant_location.trim())
      e.restaurant_location = "Restaurant location is required for owners.";
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
    setTouched({ name: true, email: true, password: true, confirm: true, restaurant_location: true });
    setSubmitError("");
    if (!isValid) {
      setSubmitError("Please fix the highlighted fields and try again.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        role: form.role,
      };
      if (form.role === "owner") {
        payload.restaurant_location = form.restaurant_location.trim();
      }
      await api.post("/auth/signup", payload);
      navigate("/login", { state: { message: "Account created! Please log in." } });
    } catch (err) {
      let msg = "Signup failed. Please try again.";
      const data = err?.response?.data;
      if (typeof data === "string") msg = data;
      else if (data?.detail)
        msg = typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail);
      else if (data?.message) msg = data.message;
      else if (err?.message) msg = err.message;
      setSubmitError(msg);
    } finally {
      setLoading(false);
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
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-subtitle">Save favorites, write reviews, and get AI help.</p>

          {submitError && <div className="auth-alert">{submitError}</div>}

          <form onSubmit={onSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label className="auth-label" htmlFor="name">Name</label>
              <input
                id="name"
                className="auth-input"
                name="name"
                value={form.name}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="Your name"
                autoComplete="name"
              />
              {showErr("name") && <div className="auth-error">{errors.name}</div>}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="email">Email</label>
              <input
                id="email"
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
              <label className="auth-label" htmlFor="password">Password</label>
              <input
                id="password"
                className="auth-input"
                type="password"
                name="password"
                value={form.password}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {showErr("password") && <div className="auth-error">{errors.password}</div>}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                className="auth-input"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={onChange}
                onBlur={onBlur}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              {showErr("confirm") && <div className="auth-error">{errors.confirm}</div>}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="role">I am a</label>
              <select
                id="role"
                className="auth-input"
                name="role"
                value={form.role}
                onChange={onChange}
              >
                <option value="user">User / Reviewer</option>
                <option value="owner">Restaurant Owner</option>
              </select>
            </div>

            {form.role === "owner" && (
              <div className="auth-field">
                <label className="auth-label" htmlFor="restaurant_location">Restaurant Location</label>
                <input
                  id="restaurant_location"
                  className="auth-input"
                  name="restaurant_location"
                  value={form.restaurant_location}
                  onChange={onChange}
                  onBlur={onBlur}
                  placeholder="City, State"
                />
                {showErr("restaurant_location") && (
                  <div className="auth-error">{errors.restaurant_location}</div>
                )}
              </div>
            )}

            <button className="auth-primary" type="submit" disabled={!isValid || loading}>
              {loading ? "Creating account…" : "Sign Up"}
            </button>

            <div className="auth-footer">
              Already have an account? <Link to="/login">Log in</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
