"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers3,
  ShoppingBag,
  Package,
  Users,
  Tag,
  PanelsTopLeft,
  Settings,
  ArrowUpRight,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
const links = [
  ["/admin", "Übersicht", LayoutDashboard],
  ["/admin/orders", "Bestellungen", ShoppingBag],
  ["/admin/products", "Produkte", Package],
  ["/admin/categories", "Kategorien", Layers3],
  ["/admin/sales", "Aktionen", Tag],
  ["/admin/customers", "Kunden", Users],
  ["/admin/content", "Home & Hero", PanelsTopLeft],
  ["/admin/settings", "Einstellungen", Settings],
] as const;
export function AdminShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  async function logout() {
    const r = await fetch("/api/admin/logout", { method: "POST" });
    if (r.ok) window.location.assign("/admin/login");
  }
  return (
    <div className="admin-shell">
      <button
        className="admin-mobile-toggle icon-btn"
        aria-label="Admin-Menü umschalten"
        onClick={() => setOpen(!open)}
      >
        {open ? <X /> : <Menu />}
      </button>
      <aside className={`admin-sidebar ${open ? "opened" : ""}`}>
        <Link className="wordmark" href="/admin">
          BIGMAMA<span>REPS</span>
        </Link>
        <p className="eyebrow">SHOP MANAGEMENT</p>
        <nav>
          {links.map(([url, label, Icon]) => (
            <Link
              key={url}
              href={url}
              onClick={() => setOpen(false)}
              className={
                path === url || (url !== "/admin" && path.startsWith(url))
                  ? "active"
                  : ""
              }
            >
              <Icon size={18} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <Link href="/" target="_blank">
            <ArrowUpRight size={17} /> Shop ansehen
          </Link>
          <button onClick={logout}>
            <LogOut size={17} /> Abmelden
          </button>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-topbar">
          <span>BigMamaReps / Administration</span>
          <span className="admin-avatar">BM</span>
        </div>
        {children}
      </main>
    </div>
  );
}
