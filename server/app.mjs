import { database } from "./db.mjs";
import { publicHandler } from "./public.mjs";
import { errorResponse, fail } from "./core.mjs";
export function createHandler({ db, adminHandler } = {}) {
  return async (req, context = {}) => {
    try {
      const url = new URL(req.url);
      const path =
        url.pathname
          .replace(/^\/\.netlify\/functions\/api/, "")
          .replace(/^\/api/, "") || "/";
      const ip = context.ip || "local";
      if (path === "/admin" || path.startsWith("/admin/")) {
        if (!adminHandler)
          fail(401, "SESSION_EXPIRED", "Please sign in again.");
        return await adminHandler(req, path, db || database(), ip);
      }
      return await publicHandler(req, path, db || database(), ip);
    } catch (error) {
      return errorResponse(error);
    }
  };
}
