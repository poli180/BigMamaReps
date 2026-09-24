import { BrandTicker } from "@/components/shop/brand-ticker";
import { Hero } from "@/components/shop/hero";
import { categories as getCategories } from "@/lib/categories";
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
  const categories = await getCategories();
  return (
    <>
      <Hero settings={s} />
      <BrandTicker />
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
      <section className="section home-edit" id="home-edit">
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
      <section className="section category-section" id="kollektionen">
        <Reveal className="section-heading">
          <div>
            <p className="eyebrow">FINDE DEINEN LOOK</p>
            <h2>So vielseitig wie du.</h2>
          </div>
          <p className="muted">Dein Alltag. Deine Auswahl.</p>
        </Reveal>
        <div className="category-grid">
          {categories.map((banner, i) => {
            const category = banner.name;
            const p = all.find((p) => p.category === category);
            const url = banner.image || p?.variants[0]?.images[0]?.url;
            return (
              <Reveal key={category} delay={i * 0.08}>
                <Link
                  href={`/shop?category=${encodeURIComponent(category)}`}
                  className="category-card"
                >
                  {url && <img src={url} alt={category} loading="lazy" />}
                  <div>
                    <div>
                      <span className="category-number">
                        0{i + 1} / COLLECTION
                      </span>
                      <h3>{banner.name}</h3>
                      <p>{banner.description || "Finde deinen neuen Look."}</p>
                    </div>
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
      <section className="style-story section">
        <Reveal className="style-story-image">
          <Image
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1200&q=85"
            alt="Inspiration für deinen persönlichen Alltagslook"
            fill
            sizes="(max-width:700px) 100vw, 50vw"
          />
          <span>THE EVERYDAY EDIT / BMR STUDIO</span>
        </Reveal>
        <Reveal className="style-story-copy">
          <p className="eyebrow">DEIN STYLE BRAUCHT KEINE ERLAUBNIS</p>
          <h2>
            Weniger müssen.
            <br />
            <em>Mehr du sein.</em>
          </h2>
          <p>
            Die besten Pieces passen nicht nur zu deinem Outfit. Sie passen zu
            deinem Leben. Entdecke entspannte Silhouetten und Essentials, die du
            immer wieder tragen willst.
          </p>
          <Link href="/shop?sort=new" className="btn">
            Entdecke den Edit
            <ArrowUpRight size={18} />
          </Link>
          <div className="story-details">
            <span>01 / EASY TO WEAR</span>
            <span>02 / MADE TO MIX</span>
          </div>
        </Reveal>
      </section>
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
