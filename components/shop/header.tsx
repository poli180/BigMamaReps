"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, ShoppingBag, Menu, X, ArrowUpRight } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import { useStore } from "./store-provider";
export function Header({
  announcement,
  logoUrl,
}: {
  announcement: string;
  logoUrl: string;
}) {
  const store = useStore();
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 25);
    fn();
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);
  useEffect(() => {
    setMobile(false);
    setSearch(false);
  }, [path]);
  const nav = (
    <>
      <Link className={path === "/shop" ? "active" : ""} href="/shop">
        Shop
      </Link>
      <Link href="/shop?sort=new">New Arrivals</Link>
      <Link href="/shop?category=Hoodies">Essentials</Link>
      <Link className="sale-nav" href="/sale">
        Sale <span>↗</span>
      </Link>
    </>
  );
  return (
    <>
      <div className="announcement">
        {announcement}
        <ArrowUpRight size={13} />
      </div>
      <header className={`header ${scrolled ? "scrolled" : ""}`}>
        <Link href="/" className="wordmark" aria-label="BigMamaReps Startseite">
          {logoUrl ? (
            <img src={logoUrl} alt="BigMamaReps" height={36} />
          ) : (
            <>
              BIGMAMA<span>REPS</span>
              <sup>®</sup>
            </>
          )}
        </Link>
        <nav className="desktop-nav" aria-label="Hauptnavigation">
          {nav}
        </nav>
        <div className="header-actions">
          <button
            className="icon-btn"
            aria-label="Suche öffnen"
            onClick={() => setSearch(true)}
          >
            <Search size={20} />
          </button>
          <button
            className="cart-trigger icon-btn"
            aria-label="Warenkorb öffnen"
            onClick={() => store.setOpen(true)}
          >
            <ShoppingBag size={20} />
            <span key={store.items.reduce((n, i) => n + i.quantity, 0)}>
              {store.items.reduce((n, i) => n + i.quantity, 0)}
            </span>
          </button>
          <button
            className="icon-btn mobile-only"
            aria-label="Menü öffnen"
            onClick={() => setMobile(true)}
          >
            <Menu size={21} />
          </button>
        </div>
      </header>
      <Dialog.Root open={mobile} onOpenChange={setMobile}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="mobile-menu">
            <Dialog.Title>Entdecken</Dialog.Title>
            <Dialog.Description className="sr-only">
              Shop-Navigation
            </Dialog.Description>
            <Dialog.Close
              className="icon-btn close"
              aria-label="Menü schließen"
            >
              <X />
            </Dialog.Close>
            <nav onClick={() => setMobile(false)}>{nav}</nav>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      <Dialog.Root open={search} onOpenChange={setSearch}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="search-modal">
            <Dialog.Title>Finde deinen Style.</Dialog.Title>
            <Dialog.Description>
              Suche nach Produkten und Kategorien.
            </Dialog.Description>
            <Dialog.Close
              className="icon-btn close"
              aria-label="Suche schließen"
            >
              <X />
            </Dialog.Close>
            <form action="/shop" onSubmit={() => setSearch(false)}>
              <label className="sr-only" htmlFor="search">
                Suchbegriff
              </label>
              <input
                id="search"
                name="q"
                placeholder="Hoodies, T-Shirts, …"
                autoFocus
              />
              <button className="btn">
                Suchen <Search size={18} />
              </button>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
