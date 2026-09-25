import { catalogChanged } from "@/lib/catalog-revision";
import { adminApi, apiError } from "@/lib/auth";
import { saveCategory, deleteCategory } from "@/lib/category-actions";
import { z } from "zod";
async function action(req: Request, remove = false) {
  try {
    await adminApi(req);
    const result = await (remove ? deleteCategory : saveCategory)(
      await req.json(),
    );
    await catalogChanged();
    return Response.json(result);
  } catch (e) {
    if (e instanceof z.ZodError)
      return Response.json(
        { error: e.issues.map((i) => i.message).join(" ") },
        { status: 400 },
      );
    return apiError(e);
  }
}
export const POST = (req: Request) => action(req);
export const DELETE = (req: Request) => action(req, true);
