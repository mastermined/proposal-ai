"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // If already set up, redirect to login
    fetch("/api/setup")
      .then((r) => r.json())
      .then((d) => {
        if (!d.needsSetup) router.replace("/login");
        else setChecking(false);
      })
      .catch(() => setChecking(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed.");
      } else {
        // Hard navigation so the session cookie is included in the first request
        window.location.replace("/proposals");
      }
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="auth-bg">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="auth-bg">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M3 10L10 3L17 10L10 17L3 10Z" fill="currentColor" opacity="0.8"/>
              <path d="M7 10L10 7L13 10L10 13L7 10Z" fill="currentColor"/>
            </svg>
          </div>
          <span className="auth-logo-text">FPT Proposal AI</span>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck size={18} className="text-blue-500" />
          <h1 className="auth-title" style={{ marginBottom: 0 }}>First-time setup</h1>
        </div>
        <p className="auth-subtitle">Create your admin account to get started</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label className="auth-label">Full name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="auth-input"
              placeholder="Ahmad Ali"
              disabled={loading}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              placeholder="admin@fpt.com"
              disabled={loading}
            />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password <span className="text-muted-foreground text-xs">(min 8 chars)</span></label>
            <div className="auth-input-wrap">
              <input
                type={showPw ? "text" : "password"}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                placeholder="••••••••"
                disabled={loading}
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="auth-eye" tabIndex={-1}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" disabled={loading} className="auth-btn">
            {loading ? <Loader2 size={16} className="animate-spin" /> : "Create admin account"}
          </button>
        </form>
      </div>
    </div>
  );
}
