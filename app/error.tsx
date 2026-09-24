"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>Das hat gerade nicht geklappt.</h1>
      <p>Bitte versuche es noch einmal.</p>
      <button className="btn" onClick={reset}>
        Erneut versuchen
      </button>
    </div>
  );
}
