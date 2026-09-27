import Stripe from "stripe";
import { adminEnv } from "./admin-config";
let client: Stripe | undefined;
export function stripe() {
  const key = adminEnv("STRIPE_SECRET_KEY");
  if (!key) throw new Error("Stripe ist nicht konfiguriert");
  return (client ??= new Stripe(key, {
    maxNetworkRetries: 2,
  }));
}
