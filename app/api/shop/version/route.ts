import { catalogRevision } from "@/lib/catalog-revision";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    return Response.json(
      { revision: await catalogRevision() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { error: "Temporarily unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
