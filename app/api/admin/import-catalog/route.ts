import { adminApi, apiError, ApiError } from "@/lib/auth";
import { isDemo } from "@/lib/db";
import { importSupplierCatalog } from "@/lib/import-supplier";
export async function POST(req: Request) {
  try {
    await adminApi(req);
    if (isDemo())
      throw new ApiError(
        "Bitte zuerst die produktive Datenbank verbinden.",
        503,
      );
    return Response.json(await importSupplierCatalog());
  } catch (e) {
    return apiError(e);
  }
}
