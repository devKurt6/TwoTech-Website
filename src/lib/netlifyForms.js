import { NETLIFY_FORMS_PATH, netlifyForms } from "../data/netlifyForms";

export async function submitNetlifyCopy(kind, data, reference) {
  const fields = netlifyForms[kind];
  if (!fields) return false;
  const values = { ...data, reference };
  const body = new URLSearchParams({ "form-name": kind, "bot-field": "" });
  for (const field of fields) body.set(field, String(values[field] ?? ""));
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(NETLIFY_FORMS_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      credentials: "same-origin",
      body: body.toString(),
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    // The primary database request has already succeeded; never replay it here.
    return false;
  } finally {
    clearTimeout(timer);
  }
}
