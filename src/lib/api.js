import { compressImage } from "./images";
export class ApiError extends Error {
  constructor(message, status = 0, code = "NETWORK", fields = {}) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}
export const demo = false;
let freshUntil = 0;
export function imageURL(url) {
  if (!url) return null;
  return url.replace(
    "/image/upload/",
    "/image/upload/f_auto,q_auto,w_800,c_limit/",
  );
}
export const normalizeProduct = (p) => ({
  ...p,
  cat: p.category ?? p.cat,
  desc: p.description ?? p.desc,
  img: imageURL(p.image_url),
});
export async function request(
  path,
  { method = "GET", data, retry = method === "GET" } = {},
) {
  for (let attempt = 0; attempt < (retry ? 2 : 1); attempt++) {
    const controller = new AbortController(),
      timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch("/api" + path, {
        method,
        credentials: "same-origin",
        signal: controller.signal,
        headers:
          method === "GET"
            ? {}
            : {
                "Content-Type": "application/json",
                "X-Requested-With": "TwoTech",
              },
        ...(data !== undefined ? { body: JSON.stringify(data) } : {}),
      });
      let value;
      try {
        value = await response.json();
      } catch {
        throw new ApiError(
          "The API is unavailable. Run this app using Netlify Dev.",
          response.status,
          "INVALID_RESPONSE",
        );
      }
      if (!response.ok) {
        const error = new ApiError(
          value.error?.message || "Please try again.",
          response.status,
          value.error?.code,
          value.error?.fields,
        );
        if (
          response.status === 401 &&
          path.startsWith("/admin/") &&
          path !== "/admin/login" &&
          typeof window !== "undefined"
        )
          window.dispatchEvent(new Event("tt-auth-expired"));
        throw error;
      }
      return value;
    } catch (error) {
      const err =
        error instanceof ApiError
          ? error
          : new ApiError(
              error.name === "AbortError"
                ? "The server is waking up or taking longer than expected. Please retry."
                : "Could not reach the server. Check your connection and retry.",
              0,
              error.name === "AbortError" ? "TIMEOUT" : "NETWORK",
            );
      if (attempt === 0 && retry && (err.status === 0 || err.status >= 500)) {
        await new Promise((resolve) => setTimeout(resolve, 700));
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}
const fresh = () => (Date.now() < freshUntil ? "?_fresh=" + Date.now() : "");
function changed() {
  freshUntil = Date.now() + 60000;
  window.dispatchEvent(new Event("tt-refresh"));
}
export const api = {
  products: async (all = false) =>
    (await request(all ? "/admin/products" : "/products" + fresh())).map(
      normalizeProduct,
    ),
  product: async (id) =>
    normalizeProduct(await request("/products/" + encodeURIComponent(id))),
  settings: () => request("/settings" + fresh()),
  dashboard: () => request("/admin/dashboard"),
  saveSettings: async (data) => {
    await request("/admin/settings", { method: "PUT", data });
    changed();
  },
  saveProduct: async (p) => {
    const data = {
      name: p.name.trim(),
      category: p.cat,
      price: Number(p.price),
      stock: Number(p.stock),
      description: p.desc || "",
      specs: p.specs || "",
      image_url: p.image_url || null,
      image_public_id: p.image_public_id || null,
      visible: p.visible,
    };
    await request("/admin/products" + (p.id ? "/" + p.id : ""), {
      method: p.id ? "PATCH" : "POST",
      data,
    });
    changed();
  },
  deleteProduct: async (id) => {
    await request("/admin/products/" + id, { method: "DELETE", data: {} });
    changed();
  },
  inbox: (table) => request("/admin/inbox?type=" + encodeURIComponent(table)),
  updateRecord: (table, id, data) =>
    request("/admin/inbox/" + table + "/" + id, { method: "PATCH", data }),
  me: () => request("/admin/me"),
  login: async (email, password) => {
    await request("/admin/login", {
      method: "POST",
      data: { email, password },
    });
    window.dispatchEvent(new Event("tt-auth-change"));
  },
  logout: async () => {
    try {
      await request("/admin/logout", { method: "POST", data: {} });
    } finally {
      window.dispatchEvent(new Event("tt-auth-expired"));
    }
  },
  submit: (kind, data) => request("/" + kind, { method: "POST", data }),
  placeOrder: (customer, items) => {
    const { website = "", ...profile } = customer;
    return request("/orders", {
      method: "POST",
      data: { customer: profile, items, website },
      retry: true,
    });
  },
  uploadImage: async (file) => {
    const image = await compressImage(file);
    const signed = await request("/admin/upload-signature", {
      method: "POST",
      data: {},
    });
    const body = new FormData();
    body.append(
      "file",
      image,
      image.type === "image/webp" ? "product.webp" : "product.jpg",
    );
    body.append("api_key", signed.api_key);
    body.append("signature", signed.signature);
    for (const [key, value] of Object.entries(signed.params))
      body.append(key, String(value));
    let response;
    try {
      response = await fetch(
        "https://api.cloudinary.com/v1_1/" +
          encodeURIComponent(signed.cloud_name) +
          "/image/upload",
        { method: "POST", body, signal: AbortSignal.timeout(30000) },
      );
    } catch {
      throw new Error(
        "Image upload failed. Please check your connection and retry.",
      );
    }
    if (!response.ok)
      throw new Error("Image upload could not be completed. Please retry.");
    const data = await response.json();
    if (data.public_id !== signed.params.public_id || !data.secure_url)
      throw new Error("Image upload could not be verified.");
    return { image_url: data.secure_url, image_public_id: data.public_id };
  },
  removeImage: (public_id) =>
    request("/admin/images", { method: "DELETE", data: { public_id } }),
};
