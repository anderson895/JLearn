import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export async function getSignedUploadUrl(params: { folder: string; resourceType?: string }) {
  const timestamp = Math.round(Date.now() / 1000);
  const signatureParams: Record<string, string | number> = {
    timestamp,
    folder: params.folder,
    upload_preset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!,
  };
  const signature = cloudinary.utils.api_sign_request(signatureParams, process.env.CLOUDINARY_API_SECRET!);
  return {
    signature,
    timestamp,
    cloudName:    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    apiKey:       process.env.CLOUDINARY_API_KEY,
    folder:       params.folder,
    uploadPreset: process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET,
    resourceType: params.resourceType || "auto",
  };
}
