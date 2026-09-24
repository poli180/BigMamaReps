"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import Image from "next/image";
import { X, Minus, Plus, ArrowRight, ShoppingBag } from "lucide-react";
import { money } from "@/lib/pricing";
export type CartItem = {
  variantId: string;
  name: string;
  color: string;
  size: string;
  image: string;
  price: number;
  quantity: number;
  max: number;
};
type Store = {
  items: CartItem[];
  add: (item: CartItem) => void;
  quantity: (id: string, n: number) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
  clear: () => void;
  ready: boolean;
};
const Context = createContext<Store | null>(null);
export const useStore = () => useContext(Context)!;
export function StoreProvider({
  children,
  shippingCost,
  freeShippingFrom,
}: {
  children: ReactNode;
  shippingCost: number;
  freeShippingFrom: number;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const value = JSON.parse(localStorage.getItem("bmr-cart") ?? "[]");
      if (Array.isArray(value))
        setItems(
          value
            .filter(
              (i) =>
                typeof i.variantId === "string" &&
                Number.isInteger(i.quantity) &&
                i.quantity > 0 &&
                Number.isFinite(i.price),
            )
            .slice(0, 30),
        );
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) localStorage.setItem("bmr-cart", JSON.stringify(items));
  }, [items, ready]);
  function add(item: CartItem) {
    setItems((prev) => {
      const old = prev.find((i) => i.variantId === item.variantId);
      return old
        ? prev.map((i) =>
            i.variantId === item.variantId
              ? {
                  ...item,
                  quantity: Math.min(i.quantity + item.quantity, item.max, 20),
                }
              : i,
          )
        : [...prev, item];
    });
    setOpen(true);
  }
  function quantity(id: string, n: number) {
    setItems((prev) =>
      n <= 0
        ? prev.filter((i) => i.variantId !== id)
        : prev.map((i) =>
            i.variantId === id ? { ...i, quantity: Math.min(n, i.max, 20) } : i,
          ),
    );
  }
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return (
    <Context.Provider
      value={{
        items,
        add,
        quantity,
        open,
        setOpen,
        clear: () => setItems([]),
        ready,
      }}
    >
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="overlay" />
          <Dialog.Content className="cart-drawer">
            <div className="drawer-top">
              <Dialog.Title>
                Dein Warenkorb{" "}
                <small>({items.reduce((n, i) => n + i.quantity, 0)})</small>
              </Dialog.Title>
              <Dialog.Close className="icon-btn" aria-label="Schließen">
                <X />
              </Dialog.Close>
            </div>
            <Dialog.Description className="muted">
              Deine nächsten Lieblingsstücke.
            </Dialog.Description>
            {items.length ? (
              <>
                <p className="shipping-hint">
                  {total >= freeShippingFrom
                    ? "Deine Bestellung ist versandkostenfrei."
                    : `Noch ${money(freeShippingFrom - total)} bis zum kostenlosen Versand.`}
                </p>
                <div className="cart-items">
                  {items.map((i) => (
                    <article className="cart-item" key={i.variantId}>
                      {i.image && (
                        <Image
                          src={i.image}
                          alt={i.name}
                          width={90}
                          height={112}
                        />
                      )}
                      <div>
                        <h3>{i.name}</h3>
                        <p>
                          {i.color} / {i.size}
                        </p>
                        <div className="quantity">
                          <button
                            aria-label={`${i.name} weniger`}
                            onClick={() =>
                              quantity(i.variantId, i.quantity - 1)
                            }
                          >
                            <Minus size={14} />
                          </button>
                          <span>{i.quantity}</span>
                          <button
                            aria-label={`${i.name} mehr`}
                            disabled={i.quantity >= i.max}
                            onClick={() =>
                              quantity(i.variantId, i.quantity + 1)
                            }
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <button
                          className="text-btn"
                          onClick={() => quantity(i.variantId, 0)}
                        >
                          Entfernen
                        </button>
                      </div>
                      <strong>{money(i.price * i.quantity)}</strong>
                    </article>
                  ))}
                </div>
                <div className="cart-bottom">
                  <div className="between">
                    <span>Zwischensumme</span>
                    <strong>{money(total)}</strong>
                  </div>
                  <p className="muted">
                    Versand{" "}
                    {total >= freeShippingFrom
                      ? "kostenlos"
                      : money(shippingCost)}
                    . Verbindliche Preise werden an der Kasse geprüft.
                  </p>
                  <Link
                    className="btn full"
                    href="/checkout"
                    onClick={() => setOpen(false)}
                  >
                    Zur Kasse <ArrowRight size={18} />
                  </Link>
                  <button
                    className="text-btn full"
                    onClick={() => setOpen(false)}
                  >
                    Weiter einkaufen
                  </button>
                </div>
              </>
            ) : (
              <div className="empty">
                <ShoppingBag size={48} strokeWidth={1} />
                <h3>Platz für etwas Neues.</h3>
                <p>Dein Warenkorb ist noch leer.</p>
                <Link
                  href="/shop"
                  className="btn"
                  onClick={() => setOpen(false)}
                >
                  Shop entdecken
                </Link>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </Context.Provider>
  );
}
