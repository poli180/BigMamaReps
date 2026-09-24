import { db, isDemo } from "./db";
export const defaults = {
  heroType: "image",
  heroUrl:
    "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=2000&q=85",
  heroPoster: "",
  heroTitle: "Dein Style.\nDeine Regeln.",
  heroSubtitle:
    "Zeitlose Essentials. Entspannte Silhouetten. Gemacht für deinen Alltag.",
  heroCta: "Kollektion entdecken",
  heroLink: "/shop",
  saleTitle: "Guter Style. Besserer Preis.",
  primaryColor: "#222820",
  accentColor: "#d1e4bd",
  logoUrl: "",
  announcement: "Neue Saison. Neue Lieblingsstücke.",
  about:
    "BigMamaReps steht für unkomplizierten Style. Entdecke unsere Auswahl an Essentials und finde deinen eigenen Look.",
  shippingCost: 4.9,
  freeShippingFrom: 100,
  shippingCountries: ["DE", "AT", "CH"],
  shippingText: "Lieferzeit: 3–5 Werktage",
  instagram: "",
  tiktok: "",
  footerText: "Wear it your way.",
  emailNotifications: true,
  telegramNotifications: false,
  categoryBanners: [] as { category: string; title: string; image: string }[],
  legal: {
    impressum:
      "<p>Platzhalter — bitte vollständige Anbieterkennzeichnung ergänzen.</p>",
    agb: "<p>Platzhalter — bitte die für deinen Shop geltenden AGB ergänzen.</p>",
    datenschutz:
      "<p>Platzhalter — bitte Datenschutzerklärung passend zu deinen Diensten ergänzen.</p>",
    widerruf:
      "<p>Platzhalter — bitte Widerrufsbelehrung und Musterformular ergänzen.</p>",
    versand:
      "<p>Versandbedingungen, Liefergebiete und Retourenadresse hier ergänzen.</p>",
  },
};
export type Settings = typeof defaults;
export async function settings(): Promise<Settings> {
  if (isDemo()) return defaults;
  const row = await db.shopSettings.findUnique({ where: { id: "shop" } });
  return {
    ...defaults,
    ...((row?.data as Partial<Settings>) ?? {}),
    legal: {
      ...defaults.legal,
      ...((row?.data as Partial<Settings>)?.legal ?? {}),
    },
  };
}
