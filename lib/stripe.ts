import Stripe from "stripe";
let client: Stripe | undefined;
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("Stripe ist nicht konfiguriert");
  return (client ??= new Stripe(process.env.STRIPE_SECRET_KEY, {
    maxNetworkRetries: 2,
  }));
}
