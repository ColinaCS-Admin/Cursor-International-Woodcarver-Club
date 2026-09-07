import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import Logo from "../components/Logo.jsx";

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(identifier, password);
      navigate("/home");
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
        <p className="kicker">International Woodcarver Club</p>
        <h1>Sign in</h1>
        {error ? <div className="error">{error}</div> : null}
        <label className="field">
          <span className="required">Email address or member alias</span>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="field">
          <span className="required">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        <button className="btn wide" type="submit" disabled={submitting}>
          {submitting ? "Signing in…" : "Submit"}
        </button>
        <div className="links">
          <Link to="/forgot-password">Forgot password</Link>
          <Link to="/register">Join the club</Link>
        </div>
        <p className="muted">
          Demo admin: clubadmin / CarvingAdmin1!
          <br />
          Demo member: oakcarver / CarvingMember1!
        </p>
      </form>
    </div>
  );
}
