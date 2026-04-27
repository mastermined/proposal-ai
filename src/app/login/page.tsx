"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const params = useSearchParams();
  const from = params.get("from") || "/proposals";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Check if first-run setup is needed
  useEffect(() => {
    fetch("/api/setup")
      .then((r) => r.json())
      .then((d) => { if (d.needsSetup) window.location.href = "/setup"; })
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid email or password.");
        setLoading(false);
        return;
      }

      // Full page reload — ensures cookie is sent in the very next request
      // so middleware sees it immediately without any race condition.
      window.location.replace(from === "/" ? "/proposals" : from);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-bg">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--fg-muted)" }} />
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L10 3L17 10L10 17L3 10Z" fill="currentColor" opacity="0.8"/>
              <path d="M7 10L10 7L13 10L10 13L7 10Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="auth-logo-text">FPT Proposal AI</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your workspace</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="you@fpt.com"
              disabled={loading}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label">Password</label>
            <div className="auth-input-wrap">
              <input
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                style={{ paddingRight: "38px" }}
                placeholder="••••••••"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="auth-eye"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading
              ? <><Loader2 size={15} className="animate-spin" /> Signing in…</>
              : "Sign in"
            }
          </button>
        </form>
      </div>
    </div>
  );
}
