
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [touched, setTouched] = useState({});
  const [submitError, setSubmitError] = useState("");

  const errors = useMemo(() => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required.";

    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Enter a valid email.";

    if (!form.password) e.password = "Password is required.";
    else if (form.password.length < 6) e.password = "Min 6 characters.";

    if (!form.confirm) e.confirm = "Confirm your password.";
    else if (form.confirm !== form.password) e.confirm = "Passwords do not match.";

    return e;
  }, [form]);

  const isValid = Object.keys(errors).length === 0;

  function onChange(e) {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  }

  function onBlur(e) {
    const { name } = e.target;
    setTouched((p) => ({ ...p, [name]: true }));
  }

  function showErr(field) {
    return touched[field] && errors[field];
  }

  function onSubmit(e) {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, confirm: true });
    setSubmitError("");

    if (!isValid) {
      setSubmitError("Please fix the highlighted fields and try again.");
      return;
    }

    
    navigate("/explore");
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-subtitle">Save favorites, write reviews, and get AI help.</p>

        {submitError ? <div className="auth-alert">{submitError}</div> : null}

        <form onSubmit={onSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label className="auth-label" htmlFor="name">
              Name
            </label>
            <input
              id="name"
              className="auth-input"
              name="name"
              value={form.name}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="Your name"
              autoComplete="name"
              aria-invalid={!!showErr("name")}
              aria-describedby={showErr("name") ? "name-error" : undefined}
            />
            {showErr("name") ? (
              <div id="name-error" className="auth-error">
                {errors.name}
              </div>
            ) : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              className="auth-input"
              name="email"
              value={form.email}
              onChange={onChange}
              onBlur={onBlur}
              placeholder="you@example.com"
              autoComplete="email"
              aria-invalid={!!showErr("email")}
              aria-describedby={showErr("email") ? "email-error" : undefined}
            />
            {showErr("email") ? (
              <div id="email-error" className="auth-error">
                {errors.email}
              </div>
            ) : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">
              Password
            </label>
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
              aria-invalid={!!showErr("password")}
              aria-describedby={showErr("password") ? "password-error" : undefined}
            />
            {showErr("password") ? (
              <div id="password-error" className="auth-error">
                {errors.password}
              </div>
            ) : null}
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="confirm">
              Confirm password
            </label>
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
              aria-invalid={!!showErr("confirm")}
              aria-describedby={showErr("confirm") ? "confirm-error" : undefined}
            />
            {showErr("confirm") ? (
              <div id="confirm-error" className="auth-error">
                {errors.confirm}
              </div>
            ) : null}
          </div>

          <button className="auth-primary" type="submit">
            Sign Up
          </button>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </div>
        </form>
      </div>
    </div>
  );
}