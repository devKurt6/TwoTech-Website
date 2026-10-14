export async function compressImage(file) {
  if (
    !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
      file.type,
    ) ||
    file.size > 2097152
  )
    throw new Error("Choose a JPEG, PNG, WebP or GIF image up to 2 MB.");
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This file could not be decoded as an image.");
  }
  try {
    let scale = Math.min(1, 1200 / bitmap.width, 1200 / bitmap.height),
      blob;
    const canvas = document.createElement("canvas");
    for (let size = 0; size < 4; size++) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx)
        throw new Error("Image processing is unavailable in this browser.");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.85, 0.75, 0.65, 0.55]) {
        blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/webp", quality),
        );
        if (blob && blob.type !== "image/webp") {
          blob = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/jpeg", quality),
          );
        }
        if (blob && blob.size <= 250000) return blob;
      }
      scale *= 0.8;
    }
    if (!blob || blob.size > 2097152)
      throw new Error("Please choose a smaller image.");
    return blob;
  } finally {
    bitmap.close();
  }
}
