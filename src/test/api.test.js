import { it, expect, vi, afterEach } from "vitest";
import { request } from "../lib/api";
import { compressImage } from "../lib/images";
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("retries a sleeping-server read once and keeps session cookies same-origin", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({
          error: { code: "SERVER_UNAVAILABLE", message: "Waking up" },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => [{ id: "a" }],
      }),
  );
  expect(await request("/products")).toEqual([{ id: "a" }]);
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(fetch.mock.calls[0][1].credentials).toBe("same-origin");
});
it("does not replay a non-idempotent request and preserves typed validation errors", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: {
          code: "VALIDATION",
          message: "Check the form",
          fields: { email: "Invalid" },
        },
      }),
    }),
  );
  await expect(
    request("/messages", { method: "POST", data: {} }),
  ).rejects.toMatchObject({
    status: 400,
    code: "VALIDATION",
    fields: { email: "Invalid" },
  });
  expect(fetch).toHaveBeenCalledOnce();
  expect(fetch.mock.calls[0][1].headers["X-Requested-With"]).toBe("TwoTech");
});
it("rejects oversized and unsupported image input before decoding", async () => {
  await expect(
    compressImage({ type: "image/png", size: 3000000 }),
  ).rejects.toThrow("up to 2 MB");
  await expect(compressImage({ type: "text/html", size: 10 })).rejects.toThrow(
    "up to 2 MB",
  );
});
it("resizes large images and falls back to JPEG when WebP encoding is unsupported", async () => {
  const bitmap = { width: 2400, height: 1200, close: vi.fn() };
  vi.stubGlobal("createImageBitmap", vi.fn().mockResolvedValue(bitmap));
  const canvas = {
    width: 0,
    height: 0,
    getContext: () => ({ fillRect: vi.fn(), drawImage: vi.fn() }),
    toBlob: vi.fn((callback, type) =>
      callback(
        new Blob(["image"], {
          type: type === "image/webp" ? "image/png" : "image/jpeg",
        }),
      ),
    ),
  };
  vi.spyOn(document, "createElement").mockReturnValue(canvas);
  const image = await compressImage({ type: "image/png", size: 1000 });
  expect(canvas.width).toBe(1200);
  expect(canvas.height).toBe(600);
  expect(image.type).toBe("image/jpeg");
  expect(bitmap.close).toHaveBeenCalledOnce();
});
