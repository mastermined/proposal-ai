"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus, Loader2, Shield, User, ToggleLeft, ToggleRight,
  Trash2, KeyRound, Check, X, ChevronDown
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  isActive: boolean;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-MY", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

function RoleBadge({ role }: { role: "admin" | "user" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium",
      role === "admin"
        ? "bg-fpt-muted text-fpt border border-fpt/20"
        : "bg-surface-2 text-muted border border-border"
    )}>
      {role === "admin" ? <Shield size={10} /> : <User size={10} />}
      {role === "admin" ? "Admin" : "User"}
    </span>
  );
}

// ── Create User Modal ─────────────────────────────────────────────────────────

function CreateUserModal({ onCreated, onClose }: { onCreated: (u: UserRow) => void; onClose: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "user">("user");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create user."); }
      else { onCreated(data); onClose(); }
    } catch { setError("Network error."); }
    finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add user</h2>
          <button onClick={onClose} className="icon-btn"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body space-y-4">
          <div className="auth-field">
            <label className="auth-label">Full name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="auth-input" placeholder="Ahmad Ali" disabled={loading} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Email</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="auth-input" placeholder="user@fpt.com" disabled={loading} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Password <span className="text-xs text-muted">(min 8 chars)</span></label>
            <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} className="auth-input" placeholder="••••••••" disabled={loading} />
          </div>
          <div className="auth-field">
            <label className="auth-label">Role</label>
            <div className="relative">
              <select value={role} onChange={e => setRole(e.target.value as "admin" | "user")} className="auth-input appearance-none pr-8" disabled={loading}>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? <Loader2 size={14} className="animate-spin" /> : <><Plus size={14} />Create user</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (user: UserRow) => {
    setTogglingId(user.id);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
      }
    } finally { setTogglingId(null); }
  };

  const toggleRole = async (user: UserRow) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    setTogglingId(user.id + "-role");
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      }
    } finally { setTogglingId(null); }
  };

  const deleteUser = async (id: string) => {
    setDeletingId(id);
    try {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      setUsers(prev => prev.filter(u => u.id !== id));
    } finally { setDeletingId(null); setConfirmDelete(null); }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Control who has access to FPT Proposal AI</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={15} />
          Add user
        </button>
      </div>

      {/* Stats */}
      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">Total users</p>
          <p className="stat-value">{users.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Admins</p>
          <p className="stat-value">{users.filter(u => u.role === "admin").length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Active</p>
          <p className="stat-value">{users.filter(u => u.isActive).length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Disabled</p>
          <p className="stat-value text-red-400">{users.filter(u => !u.isActive).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-muted text-sm">No users found.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleRole(user)}
                      disabled={!!togglingId}
                      className="cursor-pointer hover:opacity-70 transition-opacity"
                      title="Click to toggle role"
                    >
                      <RoleBadge role={user.role} />
                    </button>
                  </td>
                  <td>
                    <button
                      onClick={() => toggleActive(user)}
                      disabled={togglingId === user.id}
                      className="flex items-center gap-1.5 text-xs transition-colors"
                      title={user.isActive ? "Click to disable" : "Click to enable"}
                    >
                      {togglingId === user.id ? (
                        <Loader2 size={15} className="animate-spin text-muted" />
                      ) : user.isActive ? (
                        <><ToggleRight size={18} className="text-green-500" /><span className="text-green-500">Active</span></>
                      ) : (
                        <><ToggleLeft size={18} className="text-muted" /><span className="text-muted">Disabled</span></>
                      )}
                    </button>
                  </td>
                  <td className="text-xs text-muted">{formatDate(user.createdAt)}</td>
                  <td>
                    {confirmDelete === user.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-red-400">Delete?</span>
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={deletingId === user.id}
                          className="p-1 rounded text-red-500 hover:bg-red-500/10"
                        >
                          {deletingId === user.id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                        </button>
                        <button onClick={() => setConfirmDelete(null)} className="p-1 rounded text-muted hover:text-foreground">
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(user.id)}
                        className="icon-btn text-muted hover:text-red-400"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateUserModal
          onCreated={(u) => setUsers(prev => [u, ...prev])}
          onClose={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}
