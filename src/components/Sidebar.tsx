"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FilePlus2,
  FolderOpen,
  Settings,
  Users,
  Moon,
  Sun,
  LogOut,
  ChevronRight,
  Loader2,
  Shield,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useTheme } from "./ThemeProvider";
import { useState } from "react";

interface SidebarProps {
  userRole: string;
  userName: string;
  userEmail: string;
}

const NAV = [
  { href: "/", label: "New Proposal", icon: FilePlus2, exact: true },
  { href: "/proposals", label: "My Proposals", icon: FolderOpen },
  { href: "/info", label: "Info", icon: Info },
];

const ADMIN_NAV = [
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

function NavItem({ href, label, icon: Icon, exact }: { href: string; label: string; icon: React.ElementType; exact?: boolean }) {
  const pathname = usePathname();
  const active = exact ? pathname === href : pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={cn("nav-item", active && "nav-item-active")}
    >
      <Icon size={16} />
      <span>{label}</span>
      {active && <ChevronRight size={12} className="ml-auto opacity-40" />}
    </Link>
  );
}

export function Sidebar({ userRole, userName, userEmail }: SidebarProps) {
  const { theme, toggle } = useTheme();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
            <path d="M3 10L10 3L17 10L10 17L3 10Z" fill="currentColor" opacity="0.8"/>
            <path d="M7 10L10 7L13 10L10 13L7 10Z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <p className="sidebar-logo-name">Proposal AI</p>
          <p className="sidebar-logo-sub">by Adnan from FPT Software</p>
        </div>
      </div>

      {/* Divider */}
      <div className="sidebar-divider" />

      {/* Main nav */}
      <nav className="sidebar-nav">
        <p className="nav-section-label">Workspace</p>
        {NAV.map((item) => <NavItem key={item.href} {...item} />)}

        {userRole === "admin" && (
          <>
            <p className="nav-section-label mt-4">Admin</p>
            {ADMIN_NAV.map((item) => <NavItem key={item.href} {...item} />)}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="sidebar-divider" />

        {/* Theme toggle */}
        <button onClick={toggle} className="sidebar-theme-btn">
          {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
        </button>

        {/* User card */}
        <div className="sidebar-user">
          <div className="sidebar-avatar">{initials}</div>
          <div className="flex-1 min-w-0">
            <p className="sidebar-user-name">{userName}</p>
            <p className="sidebar-user-email truncate">{userEmail}</p>
          </div>
          {userRole === "admin" && (
            <span title="Admin"><Shield size={12} className="text-fpt shrink-0" /></span>
          )}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="sidebar-logout"
            title="Sign out"
          >
            {loggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}
