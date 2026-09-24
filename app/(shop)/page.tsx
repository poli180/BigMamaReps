import Image from "next/image";
import Link from "next/link";
import {
  ArrowUpRight,
  ArrowRight,
  Truck,
  ShieldCheck,
  Package,
  Play,
} from "lucide-react";
import { products } from "@/lib/catalog";
import { settings } from "@/lib/settings";
import { priceFor, money } from "@/lib/pricing";
import { ProductCard } from "@/components/shop/product-card";
import { Reveal } from "@/components/shop/motion";
export default async function Home() {
  const [all, s] = await Promise.all([products(), settings()]);
  const featured = all.filter((p) => p.featured).slice(0, 4);
  const sale = all.filter((p) => priceFor(p).onSale).slice(0, 4);
  const categories = s.categoryBanners.length
    ? s.categoryBanners
    : [...new Set(all.map((p) => p.category))]
        .slice(0, 3)
        .map((category) => ({ category, title: category, image: "" }));
  return (
    <>
      <section className="hero">
        {s.heroUrl ? (
          s.heroType === "video" ? (
            <video
              className="hero-media"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              poster={s.heroPoster || undefined}
            >
              <source src={s.heroUrl} />
            </video>
          ) : (
            <Image
              className="hero-media"
              src={s.heroUrl}
              alt="Fashion für deinen Alltag"
              fill
              priority
              sizes="100vw"
            />
          )
        ) : (
          <div className="hero-placeholder">
            <Play size={30} />
            <span>
              Noch kein Hero-{s.heroType === "video" ? "Video" : "Bild"}{" "}
              hinterlegt
            </span>
          </div>
        )}
        <div className="hero-shade" />
        <Reveal className="hero-copy">
          <span className="hero-kicker">
            <span /> THE EVERYDAY COLLECTION — 2026
          </span>
          <h1>
            {s.heroTitle.split("\n").map((line, i) => (
              <span key={i}>
                {line}
                <br />
              </span>
            ))}
          </h1>
          <p>{s.heroSubtitle}</p>
          <Link href={s.heroLink} className="btn light">
            {s.heroCta}
            <ArrowUpRight size={20} />
          </Link>
        </Reveal>
        <div className="hero-bottom">
          <span>WENIGER REGELN. MEHR DU.</span>
          <span>Entdecke deinen nächsten Lieblingslook ↓</span>
        </div>
        <div className="hero-index">
          01 <span>/ 03</span>
        </div>
      </section>
      <div className="benefit-strip">
        <span>
          <Truck size={19} /> Kostenloser Versand ab {money(s.freeShippingFrom)}
        </span>
        <span>
          <ShieldCheck size={19} /> Sicher bezahlen mit Stripe
        </span>
        <span>
          <Package size={19} />
          {s.shippingText}
        </span>
      </div>
      <section className="section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">CURATED FOR YOUR EVERYDAY</p>
            <h2>Deine neuen Essentials.</h2>
          </div>
          <Link className="arrow-link" href="/shop">
            Alle Produkte <ArrowUpRight size={18} />
          </Link>
        </Reveal>
        <div className="product-grid">
          {featured.map((p, i) => (
            <Reveal key={p.id} delay={i * 0.05}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="section category-section">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">FINDE DEINEN LOOK</p>
            <h2>So vielseitig wie du.</h2>
          </div>
          <p className="muted">Dein Alltag. Deine Auswahl.</p>
        </Reveal>
        <div className="category-grid">
          {categories.map((banner, i) => {
            const category = banner.category;
            const p = all.find((p) => p.category === category);
            const url = banner.image || p?.variants[0]?.images[0]?.url;
            return (
              <Reveal key={category} delay={i * 0.08}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className="category-card"
                >
                  {url && (
                    <Image
                      src={url}
                      alt={category}
                      fill
                      sizes="(max-width:640px) 100vw, 33vw"
                    />
                  )}
                  <div>
                    <h3>{banner.title}</h3>
                    <span className="circle-arrow">
                      <ArrowUpRight />
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>
      {sale.length > 0 && (
        <section className="section sale-section">
          <Reveal className="section-heading">
            <div>
              <p className="eyebrow">
                <span className="dot" /> THE GOOD FINDS
              </p>
              <h2>{s.saleTitle}</h2>
            </div>
            <Link className="arrow-link" href="/sale">
              Zum Sale <ArrowUpRight size={18} />
            </Link>
          </Reveal>
          <div className="product-grid">
            {sale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
      <section className="brand-section">
        <Reveal>
          <p className="eyebrow">BIGMAMAREPS®</p>
          <h2>
            Kein Dresscode.
            <br />
            Nur du.
          </h2>
          <p>
            Für lange Tage, spontane Nächte und alles dazwischen.
            <br />
            Entdecke Pieces, die sich nach dir anfühlen.
          </p>
          <Link href="/about" className="arrow-link">
            Lerne uns kennen <ArrowRight size={18} />
          </Link>
        </Reveal>
        <span className="brand-watermark" aria-hidden="true">
          BMR®
        </span>
      </section>
    </>
  );
}
