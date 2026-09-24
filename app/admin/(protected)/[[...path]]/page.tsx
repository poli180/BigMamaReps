import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Plus,
  ArrowUpRight,
  ShoppingBag,
  Package,
  TrendingUp,
  Clock,
} from "lucide-react";
import { db } from "@/lib/db";
import { products } from "@/lib/catalog";
import { settings } from "@/lib/settings";
import { money, priceFor } from "@/lib/pricing";
import {
  ProductEditor,
  SettingsEditor,
  OrderEditor,
} from "@/components/admin/editors";
import { requireAdmin } from "@/lib/auth";
import { ProductToggle, BulkSale } from "@/components/admin/quick-actions";
const payment: Record<string, string> = {
  PENDING: "Ausstehend",
  PAID: "Bezahlt",
  FAILED: "Fehlgeschlagen",
  REFUNDED: "Erstattet",
};
const shipping: Record<string, string> = {
  NOT_SHIPPED: "Nicht versendet",
  SHIPPED: "Versendet",
  DELIVERED: "Zugestellt",
};
function Header({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="admin-heading">
      <div>
        <p className="eyebrow">{subtitle}</p>
        <h1>{title}</h1>
      </div>
      {action}
    </div>
  );
}
function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value.toLowerCase()}`}>
      {payment[value] ?? shipping[value] ?? value}
    </span>
  );
}
const date = (d: Date) =>
  new Intl.DateTimeFormat("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
type OrderRow = {
  id: string;
  orderNumber: string;
  createdAt: Date;
  totalAmount: unknown;
  paymentStatus: string;
  shippingStatus: string;
  customer: { name: string };
};
function OrdersTable({ orders }: { orders: OrderRow[] }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Bestellung</th>
            <th>Kunde</th>
            <th>Datum</th>
            <th>Betrag</th>
            <th>Zahlung</th>
            <th>Versand</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link className="table-link" href={`/admin/orders/${o.id}`}>
                  {o.orderNumber}
                </Link>
              </td>
              <td>{o.customer.name}</td>
              <td>{date(o.createdAt)}</td>
              <td>{money(Number(o.totalAmount))}</td>
              <td>
                <Status value={o.paymentStatus} />
              </td>
              <td>
                <Status value={o.shippingStatus} />
              </td>
              <td>
                <Link
                  href={`/admin/orders/${o.id}`}
                  aria-label="Bestellung öffnen"
                >
                  <ArrowUpRight size={16} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && (
        <div className="admin-empty">Noch keine Bestellungen gefunden.</div>
      )}
    </div>
  );
}
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ path?: string[] }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requireAdmin();
  const { path = [] } = await params;
  const q = await searchParams;
  const [area, id] = path;
  if (path.length > 2) notFound();
  if (!area) {
    const now = new Date();
    const day = new Date(now);
    day.setHours(0, 0, 0, 0);
    const week = new Date(day);
    week.setDate(week.getDate() - 6);
    const [today, weekly, open, recent, unresolved, notificationCount] =
      await Promise.all([
        db.order.count({
          where: { createdAt: { gte: day }, paymentStatus: "PAID" },
        }),
        db.order.aggregate({
          where: {
            createdAt: { gte: week },
            paymentStatus: { in: ["PAID", "REFUNDED"] },
          },
          _sum: { totalAmount: true, refundedAmount: true },
          _count: true,
        }),
        db.order.count({
          where: { paymentStatus: "PAID", shippingStatus: "NOT_SHIPPED" },
        }),
        db.order.findMany({
          include: { customer: true },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
        db.order.count({
          where: {
            reservationState: "HELD",
            reservationExpiresAt: { lt: new Date(Date.now() - 3600000) },
          },
        }),
        db.notification.count({ where: { sentAt: null } }),
      ]);
    return (
      <>
        <Header
          title="Dein Shop im Überblick."
          subtitle="WILLKOMMEN ZURÜCK"
          action={
            <Link href="/admin/products/new" className="btn">
              <Plus size={16} />
              Produkt erstellen
            </Link>
          }
        />
        <div className="stat-grid">
          {[
            [ShoppingBag, "Bestellungen heute", String(today)],
            [
              TrendingUp,
              "Umsatz letzte 7 Tage",
              money(
                Number(weekly._sum.totalAmount ?? 0) -
                  Number(weekly._sum.refundedAmount ?? 0),
              ),
            ],
            [Package, "Bereit zum Versand", String(open)],
            [Clock, "Bestellungen letzte 7 Tage", String(weekly._count)],
          ].map(([Icon, label, value]) => {
            const I = Icon as typeof ShoppingBag;
            return (
              <div className="stat-card" key={String(label)}>
                <div className="between">
                  <span>{String(label)}</span>
                  <I size={18} />
                </div>
                <strong>{String(value)}</strong>
              </div>
            );
          })}
        </div>
        {unresolved > 0 && (
          <p className="notice">
            {unresolved} Reservierungen benötigen Abgleich mit Stripe.
            Cron-Abgleich ausführen und offene Vorgänge kontrollieren.
          </p>
        )}
        {notificationCount > 0 && (
          <p className="notice">
            {notificationCount} Benachrichtigungen warten auf Versand.
            E-Mail-Konfiguration und Cronjob prüfen.
          </p>
        )}
        <section className="panel">
          <div className="between">
            <h2>Letzte Bestellungen</h2>
            <Link href="/admin/orders" className="arrow-link">
              Alle ansehen <ArrowUpRight size={16} />
            </Link>
          </div>
          <OrdersTable orders={recent} />
        </section>
        <div className="admin-quicklinks">
          <Link href="/admin/orders?shipping=NOT_SHIPPED">
            Offene Sendungen <ArrowUpRight size={18} />
          </Link>
          <Link href="/admin/orders?payment=PENDING">
            Ausstehende Zahlungen <ArrowUpRight size={18} />
          </Link>
          <Link href="/admin/content">
            Startseite bearbeiten <ArrowUpRight size={18} />
          </Link>
        </div>
      </>
    );
  }
  if (area === "products") {
    const all = await products(true);
    if (id === "new") return <ProductEditor />;
    if (id) {
      const p = all.find((p) => p.id === id);
      if (!p) notFound();
      return <ProductEditor initial={p} />;
    }
    const filtered = all.filter(
      (p) =>
        !q.q ||
        `${p.name} ${p.category}`.toLowerCase().includes(q.q.toLowerCase()),
    );
    return (
      <>
        <Header
          title="Produkte"
          subtitle={`${all.length} PRODUKTE IM KATALOG`}
          action={
            <Link className="btn" href="/admin/products/new">
              <Plus size={16} />
              Neues Produkt
            </Link>
          }
        />
        <section className="panel">
          <form className="admin-filters">
            <input
              name="q"
              placeholder="Produkt oder Kategorie suchen"
              defaultValue={q.q}
            />
            <button className="btn outline">Suchen</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Kategorie</th>
                  <th>Preis</th>
                  <th>Bestand / reserviert</th>
                  <th>Sichtbarkeit</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <Link
                        className="product-cell"
                        href={`/admin/products/${p.id}`}
                      >
                        {p.variants[0]?.images[0] && (
                          <img src={p.variants[0].images[0].url} alt="" />
                        )}
                        <span>
                          <strong>{p.name}</strong>
                          {p.featured && <small>Featured</small>}
                        </span>
                      </Link>
                    </td>
                    <td>{p.category}</td>
                    <td>{money(priceFor(p).price)}</td>
                    <td>
                      {p.variants.reduce((n, v) => n + v.stock, 0)} /{" "}
                      {p.variants.reduce((n, v) => n + v.reserved, 0)}
                    </td>
                    <td>
                      <span
                        className={`status ${p.active ? "status-paid" : ""}`}
                      >
                        {p.active ? "Aktiv" : "Entwurf"}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="text-btn"
                        href={`/admin/products/${p.id}`}
                      >
                        Bearbeiten
                      </Link>
                      <ProductToggle id={p.id} active={p.active} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </>
    );
  }
  if (area === "sales") {
    const catalog = await products(true);
    const all = catalog.filter((p) => p.onSale);
    return (
      <>
        <Header
          title="Aktionen & Sale"
          subtitle="GEPLANT, AKTIV UND ABGELAUFEN"
        />
        <BulkSale products={catalog.map((p) => ({ id: p.id, name: p.name }))} />
        <section className="panel">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Produkt</th>
                  <th>Regulär</th>
                  <th>Sale</th>
                  <th>Zeitraum</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {all.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>{money(p.basePrice)}</td>
                    <td>{money(p.salePrice ?? p.basePrice)}</td>
                    <td>
                      {p.saleStart ? date(new Date(p.saleStart)) : "Sofort"} –{" "}
                      {p.saleEnd ? date(new Date(p.saleEnd)) : "Unbegrenzt"}
                    </td>
                    <td>
                      <span
                        className={`status ${priceFor(p).onSale ? "status-paid" : ""}`}
                      >
                        {priceFor(p).onSale
                          ? "Aktiv"
                          : p.saleStart && new Date(p.saleStart) > new Date()
                            ? "Geplant"
                            : "Abgelaufen"}
                      </span>
                    </td>
                    <td>
                      <Link
                        className="text-btn"
                        href={`/admin/products/${p.id}`}
                      >
                        Bearbeiten
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!all.length && (
              <div className="admin-empty">
                Noch keine Aktionen. Aktiviere Sale im Produkteditor.
              </div>
            )}
          </div>
        </section>
      </>
    );
  }
  if (area === "orders") {
    if (id) {
      const o = await db.order.findUnique({
        where: { id },
        include: { items: true, customer: true },
      });
      if (!o) notFound();
      const address = o.shippingAddress as Record<string, string>;
      return (
        <>
          <Header
            title={o.orderNumber}
            subtitle={`BESTELLUNG VOM ${date(o.createdAt)}`}
          />
          <div className="editor-columns">
            <div>
              <section className="panel">
                <div className="between">
                  <h2>Bestellte Artikel</h2>
                  <Status value={o.paymentStatus} />
                </div>
                <table>
                  <thead>
                    <tr>
                      <th>Artikel</th>
                      <th>Menge</th>
                      <th>Einzelpreis</th>
                      <th>Gesamt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {o.items.map((i) => (
                      <tr key={i.id}>
                        <td>
                          {i.productName}
                          <small className="block">
                            {i.color} / {i.size}
                          </small>
                        </td>
                        <td>{i.quantity}</td>
                        <td>{money(Number(i.unitPrice))}</td>
                        <td>{money(Number(i.unitPrice) * i.quantity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="order-totals">
                  <p>Versand: {money(Number(o.shippingAmount))}</p>
                  <strong>Gesamt: {money(Number(o.totalAmount))}</strong>
                  {Number(o.refundedAmount) > 0 && (
                    <p>Erstattet: {money(Number(o.refundedAmount))}</p>
                  )}
                </div>
                <p className="muted">
                  Zahlungsmethode: {o.paymentMethod ?? "Noch nicht bestätigt"} ·
                  Zahlungsstatus wird ausschließlich von Stripe aktualisiert.
                </p>
              </section>
              <OrderEditor
                order={{
                  id: o.id,
                  shippingStatus: o.shippingStatus,
                  notes: o.notes,
                  trackingNumber: o.trackingNumber,
                }}
              />
            </div>
            <aside>
              <section className="panel">
                <h2>Kunde & Lieferadresse</h2>
                <p>
                  {address.name ?? o.customer.name}
                  <br />
                  {address.street} {address.houseNr}
                  <br />
                  {address.zip} {address.city}
                  <br />
                  {address.country}
                </p>
                <p>
                  {address.email ?? o.customer.email}
                  <br />
                  {address.phone ?? o.customer.phone}
                </p>
                <Link
                  className="text-btn"
                  href={`/admin/customers/${o.customerId}`}
                >
                  Kunde ansehen
                </Link>
              </section>
              <section className="panel">
                <h2>Versandverlauf</h2>
                <Status value={o.shippingStatus} />
                <p className="muted">
                  Letzte Änderung:{" "}
                  {o.shippingUpdatedAt
                    ? date(o.shippingUpdatedAt)
                    : "Noch nicht versendet"}
                </p>
                <p className="muted">Reservierung: {o.reservationState}</p>
              </section>
            </aside>
          </div>
        </>
      );
    }
    const page = Math.max(1, Number(q.page) || 1);
    const where = {
      ...(q.q
        ? {
            OR: [
              { orderNumber: { contains: q.q, mode: "insensitive" as const } },
              {
                customer: {
                  name: { contains: q.q, mode: "insensitive" as const },
                },
              },
            ],
          }
        : {}),
      ...(q.payment && q.payment in payment
        ? { paymentStatus: q.payment as "PAID" }
        : {}),
      ...(q.shipping && q.shipping in shipping
        ? { shippingStatus: q.shipping as "SHIPPED" }
        : {}),
      ...(q.date && /^\d{4}-\d{2}-\d{2}$/.test(q.date)
        ? {
            createdAt: {
              gte: new Date(q.date),
              lt: new Date(+new Date(q.date) + 86400000),
            },
          }
        : {}),
    };
    const [rows, total] = await Promise.all([
      db.order.findMany({
        where,
        include: { customer: true },
        orderBy: { createdAt: "desc" },
        take: 50,
        skip: (page - 1) * 50,
      }),
      db.order.count({ where }),
    ]);
    return (
      <>
        <Header title="Bestellungen" subtitle={`${total} VORGÄNGE`} />
        <section className="panel">
          <form className="admin-filters">
            <input
              name="q"
              placeholder="Name oder Bestellnummer"
              defaultValue={q.q}
            />
            <select name="payment" defaultValue={q.payment ?? ""}>
              <option value="">Alle Zahlungen</option>
              {Object.entries(payment).map(([v, t]) => (
                <option value={v} key={v}>
                  {t}
                </option>
              ))}
            </select>
            <select name="shipping" defaultValue={q.shipping ?? ""}>
              <option value="">Alle Versandstatus</option>
              {Object.entries(shipping).map(([v, t]) => (
                <option value={v} key={v}>
                  {t}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="date"
              aria-label="Bestelldatum"
              defaultValue={q.date}
            />
            <button className="btn outline">Filtern</button>
          </form>
          <OrdersTable orders={rows} />
          <div className="pagination">
            {page > 1 && (
              <Link
                href={`?${new URLSearchParams({ ...(Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined)) as Record<string, string>), page: String(page - 1) })}`}
              >
                ← Zurück
              </Link>
            )}
            <span>Seite {page}</span>
            {page * 50 < total && (
              <Link
                href={`?${new URLSearchParams({ ...(Object.fromEntries(Object.entries(q).filter(([, v]) => v !== undefined)) as Record<string, string>), page: String(page + 1) })}`}
              >
                Weiter →
              </Link>
            )}
          </div>
        </section>
      </>
    );
  }
  if (area === "customers") {
    if (id) {
      const customer = await db.customer.findUnique({
        where: { id },
        include: {
          addresses: true,
          orders: {
            include: { customer: true },
            orderBy: { createdAt: "desc" },
          },
        },
      });
      if (!customer) notFound();
      return (
        <>
          <Header title={customer.name} subtitle={customer.email} />
          <section className="panel">
            <h2>Gespeicherte Adressen</h2>
            {customer.addresses.map((a) => (
              <p key={a.id}>
                {a.street} {a.houseNr}, {a.zip} {a.city}, {a.country}
              </p>
            ))}
            <p>{customer.phone}</p>
          </section>
          <section className="panel">
            <h2>Bestellhistorie</h2>
            <OrdersTable orders={customer.orders} />
          </section>
        </>
      );
    }
    const list = await db.customer.findMany({
      where: q.q
        ? {
            OR: [
              { name: { contains: q.q, mode: "insensitive" } },
              { email: { contains: q.q, mode: "insensitive" } },
            ],
          }
        : {},
      include: {
        orders: {
          select: {
            paymentStatus: true,
            totalAmount: true,
            refundedAmount: true,
          },
        },
      },
      orderBy: { name: "asc" },
      take: 200,
    });
    return (
      <>
        <Header title="Kunden" subtitle="KUNDEN & BESTELLHISTORIE" />
        <section className="panel">
          <form className="admin-filters">
            <input name="q" defaultValue={q.q} placeholder="Name oder E-Mail" />
            <button className="btn outline">Suchen</button>
          </form>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>E-Mail</th>
                  <th>Bestellungen</th>
                  <th>Umsatz</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.email}</td>
                    <td>{c.orders.length}</td>
                    <td>
                      {money(
                        c.orders
                          .filter(
                            (o) =>
                              o.paymentStatus === "PAID" ||
                              o.paymentStatus === "REFUNDED",
                          )
                          .reduce(
                            (sum, o) =>
                              sum +
                              Number(o.totalAmount) -
                              Number(o.refundedAmount),
                            0,
                          ),
                      )}
                    </td>
                    <td>
                      <Link
                        className="text-btn"
                        href={`/admin/customers/${c.id}`}
                      >
                        Ansehen
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted">
            Bis zu 200 Treffer. Suche verwenden, um die Auswahl einzugrenzen.
          </p>
        </section>
      </>
    );
  }
  if (area === "content" || area === "settings")
    return <SettingsEditor initial={await settings()} mode={area} />;
  notFound();
}
