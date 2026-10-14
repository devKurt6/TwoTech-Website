import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import Field from "../components/Field";
export default function Login() {
  const auth = useAuth(),
    location = useLocation();
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  if (auth.user && !auth.loading)
    return <Navigate to={location.state?.from || "/admin"} replace />;
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.login(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="min-h-screen grid place-items-center p-4 bg-ink">
      <form onSubmit={submit} className="card p-6 w-full max-w-sm grid gap-3">
        <h1 className="font-extrabold text-2xl">
          Two<span className="text-goldText">Tech</span> Admin
        </h1>
        <p className="text-sm text-stone-600">Owner sign-in</p>
        <Field label="Email">
          <input
            required
            className="in mt-1"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <input
            required
            className="in mt-1"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        {(auth.expired || location.state?.sessionExpired) && <p role="status" className="text-goldText">Your session expired. Please sign in again.</p>}        <button className="btn bp" disabled={busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <a href="/" className="btn bs">
          Back to website
        </a>
      </form>
    </div>
  );
}

