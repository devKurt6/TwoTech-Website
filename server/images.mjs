import { createHash, randomUUID } from "node:crypto";
import { fail } from "./core.mjs";
function config() {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME,
    key = process.env.CLOUDINARY_API_KEY,
    secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret || !/^[-a-zA-Z0-9_]+$/.test(cloud))
    fail(
      503,
      "IMAGES_UNAVAILABLE",
      "Image hosting is not configured. Please contact the owner.",
    );
  return { cloud, key, secret };
}
export function signParameters(params, secret) {
  return createHash("sha256")
    .update(
      Object.keys(params)
        .sort()
        .map((k) => k + "=" + params[k])
        .join("&") + secret,
    )
    .digest("hex");
}
async function cloudRequest(path, options = {}) {
  const c = config();
  let response;
  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${c.cloud}/${path}`,
      {
        ...options,
        headers: {
          Authorization:
            "Basic " + Buffer.from(c.key + ":" + c.secret).toString("base64"),
          ...options.headers,
        },
        signal: AbortSignal.timeout(10000),
      },
    );
  } catch {
    fail(
      503,
      "IMAGES_UNAVAILABLE",
      "Image hosting is unavailable. Please retry.",
    );
  }
  if (!response.ok)
    fail(
      400,
      "INVALID_IMAGE",
      "Could not verify the image. Please upload it again.",
    );
  return response.json();
}
export const images = {
  signature: async () => {
    const c = config();
    const params = {
      timestamp: Math.floor(Date.now() / 1000),
      public_id: "twotech/products/" + randomUUID(),
      overwrite: "false",
      allowed_formats: "jpg,webp",
      transformation: "c_limit,w_1200,h_1200",
    };
    return {
      cloud_name: c.cloud,
      api_key: c.key,
      params,
      signature: signParameters(params, c.secret),
      max_bytes: 2097152,
    };
  },
  verify: async (id, url) => {
    if (!/^twotech\/products\/[a-zA-Z0-9_-]+$/.test(id))
      fail(400, "INVALID_IMAGE", "Use a Two Tech product image upload.");
    const c = config();
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      fail(400, "INVALID_IMAGE", "Use a valid image upload.");
    }
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "res.cloudinary.com" ||
      !parsed.pathname.startsWith("/" + c.cloud + "/image/upload/")
    )
      fail(
        400,
        "INVALID_IMAGE",
        "Use an image from the configured Cloudinary account.",
      );
    const resource = await cloudRequest(
      "resources/image/upload/" + encodeURIComponent(id),
    );
    if (
      resource.public_id !== id ||
      resource.secure_url !== url ||
      resource.resource_type !== "image" ||
      !["jpg", "jpeg", "webp"].includes(resource.format) ||
      resource.bytes > 2097152 ||
      resource.width > 1200 ||
      resource.height > 1200
    )
      fail(
        400,
        "INVALID_IMAGE",
        "Choose a compressed JPEG or WebP image up to 2 MB and 1200 pixels.",
      );
  },
  destroy: async (id) => {
    if (!/^twotech\/products\/[a-zA-Z0-9_-]+$/.test(id))
      fail(400, "INVALID_IMAGE", "Invalid product image.");
    const result = await cloudRequest("image/destroy", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ public_id: id, invalidate: "true" }),
    });
    if (!["ok", "not found"].includes(result.result))
      fail(503, "IMAGE_CLEANUP", "Image cleanup is temporarily unavailable.");
  },
};
