import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import Logo from "../components/Logo.jsx";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [message, setMessage] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setSubmitting(true);
    try {
      const data = await api.forgotPassword(identifier);
      setMessage(data.message);
      if (data.resetUrl) setResetUrl(data.resetUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={onSubmit}>
        <Logo />
        <p className="kicker">Account recovery</p>
        <h1>Forgot password</h1>
        {error ? <div className="error">{error}</div> : null}
        {message ? <div className="success">{message}</div> : null}
        {resetUrl ? (
          <p>
            <Link to={resetUrl.replace(/^https?:\/\/[^/]+/, "")}>Continue to reset password</Link>
          </p>
        ) : null}
        <label className="field">
          <span className="required">Email or member alias</span>
          <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} required />
        </label>
        <button className="btn wide" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
        <div className="links">
          <Link to="/login">Back to sign in</Link>
        </div>
      </form>
    </div>
  );
}
