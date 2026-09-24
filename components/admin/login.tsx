"use client";
import { useState } from "react";
import { LockKeyhole, ArrowRight } from "lucide-react";
export function Login({ configured }: { configured: boolean }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(e.currentTarget);
    try {
      const r = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.get("email"),
          password: data.get("password"),
        }),
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error);
      window.location.assign("/admin");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Anmeldung fehlgeschlagen.");
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <a href="/" className="wordmark">
          BIGMAMA<span>REPS</span>
        </a>
        <div className="login-icon">
          <LockKeyhole />
        </div>
        <p className="eyebrow">NUR FÜR ADMINISTRATOREN</p>
        <h1>Willkommen zurück.</h1>
        <p className="muted">Melde dich an, um deinen Shop zu verwalten.</p>
        <label>
          E-Mail
          <input type="email" name="email" autoComplete="username" required />
        </label>
        <label>
          Passwort
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
          />
        </label>
        {!configured && (
          <p className="notice">
            Admin-Zugang noch nicht eingerichtet. Datenbank, ADMIN_EMAIL,
            ADMIN_PASSWORD_HASH und NEXTAUTH_SECRET in der Umgebung
            konfigurieren.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn full" disabled={busy || !configured}>
          {busy ? "Anmeldung läuft …" : "Anmelden"}
          <ArrowRight size={17} />
        </button>
        <a href="/" className="text-btn">
          Zurück zum Shop
        </a>
      </form>
    </div>
  );
}
