import type { Metadata } from "next";
import "./globals.css";
import "./admin/admin.css";
import "./upgrade.css";
import "./interactions.css";
export const metadata: Metadata = {
  title: {
    default: "BigMamaReps — Wear it your way.",
    template: "%s | BigMamaReps",
  },
  description:
    "Zeitlose Essentials, entspannte Silhouetten und dein eigener Style.",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/favicon.svg?v=2", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-touch-icon.png?v=2", sizes: "180x180" },
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  );
}
