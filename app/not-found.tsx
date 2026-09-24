import Link from "next/link";
export default function NotFound() {
  return (
    <main className="empty">
      <h1>Hier geht’s nicht weiter.</h1>
      <p>Diese Seite oder dieses Produkt ist nicht verfügbar.</p>
      <Link href="/shop" className="btn">
        Zurück zum Shop
      </Link>
    </main>
  );
}
