import { CheckoutForm } from "@/components/shop/checkout-form";
import { settings } from "@/lib/settings";
import { isDemo } from "@/lib/db";
export const metadata = { title: "Checkout" };
export default async function Checkout() {
  const s = await settings();
  return (
    <div className="section">
      <p className="eyebrow">FAST DEINS</p>
      <h1>Dein Checkout.</h1>
      <CheckoutForm
        demo={isDemo() || !process.env.STRIPE_SECRET_KEY}
        shippingCost={s.shippingCost}
        freeShippingFrom={s.freeShippingFrom}
        countries={s.shippingCountries}
      />
    </div>
  );
}
