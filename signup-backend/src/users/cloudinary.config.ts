import { v2 as cloudinary } from 'cloudinary';

// Configure immediately with hardcoded fallbacks
const cloudName = process.env.CLOUDINARY_CLOUD_NAME ?? 'ddgpdvhlv';
const apiKey = process.env.CLOUDINARY_API_KEY ?? '581541426446914';
const apiSecret = process.env.CLOUDINARY_API_SECRET ?? 'sViGFLEFdZu0HfGqiBK7JsoCMD0';

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

console.log('Cloudinary configured with cloud:', cloudName);

export { cloudinary };