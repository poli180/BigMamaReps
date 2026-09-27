import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { adminApi, apiError, ApiError } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      request,
      body,
      onBeforeGenerateToken: async (pathname, payload) => {
        await adminApi(request);
        if (!/^media\/[a-f0-9-]+\.(jpeg|png|webp|mp4|webm)$/.test(pathname))
          throw new ApiError("Ungültiger Dateiname.");
        const video = /\.(mp4|webm)$/.test(pathname);
        return {
          allowedContentTypes: video
            ? ["video/mp4", "video/webm"]
            : ["image/jpeg", "image/png", "image/webp"],
          maximumSizeInBytes: (video ? 100 : 10) * 1024 * 1024,
          addRandomSuffix: true,
          allowOverwrite: false,
          validUntil: Date.now() + 10 * 60 * 1000,
        };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error);
  }
}
