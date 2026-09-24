import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { adminApi, apiError, ApiError } from "@/lib/auth";
export async function POST(req: Request) {
  try {
    await adminApi(req);
    if (
      !process.env.STORAGE_BUCKET ||
      !process.env.STORAGE_BUCKET_URL ||
      !process.env.STORAGE_ACCESS_KEY ||
      !process.env.STORAGE_SECRET_KEY
    )
      throw new ApiError("Cloud-Speicher ist noch nicht konfiguriert.", 503);
    const b = z
      .object({
        type: z.enum([
          "image/jpeg",
          "image/png",
          "image/webp",
          "video/mp4",
          "video/webm",
        ]),
        size: z
          .number()
          .int()
          .positive()
          .max(100 * 1024 * 1024),
      })
      .parse(await req.json());
    if (b.type.startsWith("image/") && b.size > 10 * 1024 * 1024)
      throw new ApiError("Bilder dürfen maximal 10 MB groß sein.");
    const extension = b.type.split("/")[1];
    const key = `media/${randomUUID()}.${extension}`;
    const client = new S3Client({
      region: process.env.STORAGE_REGION || "auto",
      endpoint: process.env.STORAGE_ENDPOINT,
      credentials: {
        accessKeyId: process.env.STORAGE_ACCESS_KEY,
        secretAccessKey: process.env.STORAGE_SECRET_KEY,
      },
    });
    const url = await getSignedUrl(
      client,
      new PutObjectCommand({
        Bucket: process.env.STORAGE_BUCKET,
        Key: key,
        ContentType: b.type,
        ContentLength: b.size,
        CacheControl: "public, max-age=31536000, immutable",
      }),
      { expiresIn: 600 },
    );
    return Response.json({
      uploadUrl: url,
      url: `${process.env.STORAGE_BUCKET_URL.replace(/\/$/, "")}/${key}`,
    });
  } catch (e) {
    return apiError(e);
  }
}
