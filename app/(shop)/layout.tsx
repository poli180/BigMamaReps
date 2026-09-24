import Link from "next/link";
import { categories } from "@/lib/categories";
import { ScrollProgress } from "@/components/shop/motion";
import { settings } from "@/lib/settings";
import { isDemo } from "@/lib/db";
import { StoreProvider } from "@/components/shop/store-provider";
import { Header } from "@/components/shop/header";
export const dynamic = "force-dynamic";
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [s, categoryList] = await Promise.all([settings(), categories()]);
  return (
    <div
      style={
        {
          "--primary": s.primaryColor,
          "--accent": s.accentColor,
        } as React.CSSProperties
      }
    >
      <StoreProvider
        shippingCost={s.shippingCost}
        freeShippingFrom={s.freeShippingFrom}
      >
        <a className="skip-link" href="#main">
          Zum Inhalt
        </a>
        <ScrollProgress />
        <Header
          announcement={s.announcement}
          logoUrl={s.logoUrl}
          categories={categoryList.map((c) => c.name)}
        />
        {(isDemo() || process.env.SHOP_PREVIEW === "true") && (
          <div className="demo-banner">
            SHOP-VORSCHAU · Beispielprodukte · Kein echter Kauf möglich
          </div>
        )}
        <main id="main">{children}</main>
        <footer>
          <div className="footer-main">
            <div>
              <Link href="/" className="wordmark">
                BIGMAMA<span>REPS</span>
                <sup>®</sup>
              </Link>
              <h2>{s.footerText}</h2>
              <p>
                Essentials für deinen Alltag.
                <br />
                Style, der zu dir gehört.
              </p>
              <div className="socials">
                {s.instagram && (
                  <a href={s.instagram} target="_blank" rel="noreferrer">
                    Instagram ↗
                  </a>
                )}
                {s.tiktok && (
                  <a href={s.tiktok} target="_blank" rel="noreferrer">
                    TikTok ↗
                  </a>
                )}
              </div>
            </div>
            <div>
              <h3>Entdecken</h3>
              <Link href="/shop">Alle Produkte</Link>
              <Link href="/shop?sort=new">New Arrivals</Link>
              <Link href="/sale">Sale</Link>
              <Link href="/about">Über uns</Link>
            </div>
            <div>
              <h3>Gut zu wissen</h3>
              <Link href="/legal/versand">Versand & Lieferung</Link>
              <Link href="/legal/widerruf">Rückgabe & Widerruf</Link>
              <Link href="/legal/agb">AGB</Link>
              <Link href="/legal/datenschutz">Datenschutz</Link>
              <Link href="/legal/impressum">Impressum</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} BigMamaReps</span>
            <span>Sichere Zahlung über Stripe</span>
            <Link href="/admin">Admin</Link>
          </div>
        </footer>
      </StoreProvider>
    </div>
  );
}
