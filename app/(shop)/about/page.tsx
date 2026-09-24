import { settings } from "@/lib/settings";
import { safeHtml } from "@/lib/validation";
export const metadata = { title: "Über uns" };
export default async function About() {
  const s = await settings();
  return (
    <article className="section legal">
      <p className="eyebrow">UNSERE GESCHICHTE</p>
      <h1>Wear it your way.</h1>
      <div
        className="rich-copy"
        dangerouslySetInnerHTML={{ __html: safeHtml(s.about) }}
      />
    </article>
  );
}
