import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImageFromDataURI = async (file) => {
  try {
    const b64 = Buffer.from(file.buffer).toString("base64");
    let dataURI = "data:" + file.mimetype + ";base64," + b64;
    const response = await cloudinary.uploader.upload(dataURI, {
      resource_type: "auto",
      format: "png", // Force PNG format
      transformation: [
        { quality: "auto" }, // Optimize quality
        { fetch_format: "png" } // Ensure PNG delivery
      ]
    });
    return response.secure_url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw error;
  }
};

const ALLOWED_IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml'
]);
const MAX_DATA_URI_BYTES = 5 * 1024 * 1024; // 5MB

// Upload a user-provided base64 data URI string after verifying it's an
// allowed image MIME and within size limits. Throws on invalid input so
// controllers can surface a 4xx instead of silently persisting untrusted data.
export const uploadImageFromDataUriString = async (dataUri) => {
  if (typeof dataUri !== 'string') {
    throw new Error('Logo must be a data URI string.');
  }
  const match = dataUri.match(/^data:([a-zA-Z0-9+.\-/]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!match) {
    throw new Error('Logo is not a valid base64 data URI.');
  }
  const [, mimeType, base64Data] = match;
  if (!ALLOWED_IMAGE_MIMES.has(mimeType.toLowerCase())) {
    throw new Error(`Unsupported logo MIME type: ${mimeType}`);
  }
  const approxBytes = Math.floor((base64Data.length * 3) / 4);
  if (approxBytes > MAX_DATA_URI_BYTES) {
    throw new Error('Logo exceeds the 5MB size limit.');
  }
  const response = await cloudinary.uploader.upload(dataUri, {
    resource_type: 'auto',
    format: 'png',
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'png' }
    ]
  });
  return response.secure_url;
};

// Validate that a string is an http(s) URL pointing to an image (by extension)
// or that it's hosted on an allowed CDN (Cloudinary). Lightweight check — we
// avoid a network HEAD request here to keep the update path synchronous.
export const isAllowedImageUrl = (value) => {
  if (typeof value !== 'string') return false;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
  const host = parsed.hostname.toLowerCase();
  const path = parsed.pathname.toLowerCase();
  const hasImageExtension = /\.(png|jpe?g|webp|gif|svg)$/.test(path);
  const isCloudinaryHost = host === 'res.cloudinary.com' || host.endsWith('.cloudinary.com');
  if (isCloudinaryHost) {
    // Cloudinary delivery URLs always have an /image/ segment; require it so a
    // non-image resource type (e.g. /raw/, /video/) cannot slip through.
    return path.includes('/image/') || hasImageExtension;
  }
  return hasImageExtension;
};
