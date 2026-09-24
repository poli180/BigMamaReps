export type PriceSource = {basePrice: unknown; onSale: boolean; salePrice?: unknown; saleStart?: Date | string | null; saleEnd?: Date | string | null};
export function priceFor(product: PriceSource, override?: unknown, now = new Date()) {
  const base = Number(override ?? product.basePrice);
  const sale = Number(product.salePrice);
  const active = product.onSale && product.salePrice != null && sale < base && sale >= 0 && (!product.saleStart || new Date(product.saleStart) <= now) && (!product.saleEnd || new Date(product.saleEnd) > now);
  return {price: active ? sale : base, original: base, onSale: active, discount:active?Math.round((1-sale/base)*100):0};
}
export const money = (n: number | string) => new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(n));
export const cents = (n: unknown) => Math.round(Number(n)*100);
