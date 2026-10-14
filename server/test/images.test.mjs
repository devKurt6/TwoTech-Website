// @vitest-environment node
import { it, expect, vi, afterEach } from "vitest";
import { images, signParameters } from "../images.mjs";
afterEach(() => vi.unstubAllGlobals());
it("signs only restricted upload parameters and never returns the secret", async () => {
  process.env.CLOUDINARY_CLOUD_NAME = "fixture-cloud";
  process.env.CLOUDINARY_API_KEY = "fixture-key";
  process.env.CLOUDINARY_API_SECRET = "private-fixture-secret";
  const result = await images.signature();
  expect(result.signature).toBe(
    signParameters(result.params, process.env.CLOUDINARY_API_SECRET),
  );
  expect(result.params.allowed_formats).toBe("jpg,webp");
  expect(result.params.overwrite).toBe("false");
  expect(result.params.public_id).toMatch(/^twotech\/products\//);
  expect(JSON.stringify(result)).not.toContain(
    process.env.CLOUDINARY_API_SECRET,
  );
});
it("checks stored metadata and rejects oversized or unexpected images", async () => {
  process.env.CLOUDINARY_CLOUD_NAME = "fixture-cloud";
  process.env.CLOUDINARY_API_KEY = "fixture-key";
  process.env.CLOUDINARY_API_SECRET = "private-fixture-secret";
  const id = "twotech/products/fixture",
    url =
      "https://res.cloudinary.com/fixture-cloud/image/upload/v1/" +
      id +
      ".webp";
  const resource = {
    public_id: id,
    secure_url: url,
    resource_type: "image",
    format: "webp",
    bytes: 200000,
    width: 1200,
    height: 800,
  };
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({ ok: true, json: async () => resource }),
  );
  await expect(images.verify(id, url)).resolves.toBeUndefined();
  resource.bytes = 3000000;
  await expect(images.verify(id, url)).rejects.toMatchObject({ status: 400 });
  await expect(images.verify("another-folder/id", url)).rejects.toMatchObject({
    status: 400,
  });
  await expect(
    images.verify(id, "https://attacker.example/test.webp"),
  ).rejects.toMatchObject({ status: 400 });
});
