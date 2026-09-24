import { notFound } from "next/navigation";
import { settings } from "@/lib/settings";
import { safeHtml } from "@/lib/validation";
const titles = {
  impressum: "Impressum",
  agb: "Allgemeine Geschäftsbedingungen",
  datenschutz: "Datenschutz",
  widerruf: "Widerrufsrecht",
  versand: "Versand & Lieferung",
};
export default async function Legal({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page } = await params;
  if (!(page in titles)) notFound();
  const key = page as keyof typeof titles;
  const s = await settings();
  return (
    <article className="section legal">
      <p className="eyebrow">GUT ZU WISSEN</p>
      <h1>{titles[key]}</h1>
      <div
        className="rich-copy"
        dangerouslySetInnerHTML={{ __html: safeHtml(s.legal[key]) }}
      />
    </article>
  );
}
