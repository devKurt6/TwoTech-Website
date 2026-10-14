export const emailValid = (v) => /^\S+@\S+\.\S+$/.test(v || "");
export const phoneValid = (v) =>
  /^(\+63|0)9\d{9}$/.test((v || "").replace(/[\s-]/g, ""));
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export function validate(f, kind) {
  const e = {};
  const need = (k, min = 1, max = 500) => {
    if ((f[k] || "").trim().length < min)
      e[k] =
        `Enter ${min > 1 ? "at least " + min + " characters for " : "your "}${k}.`;
    else if (f[k].length > max) e[k] = `Use no more than ${max} characters.`;
  };
  need("name", 1, 150);
  if (!emailValid(f.email) || f.email.length > 254)
    e.email = "Enter a valid email, like name@example.com.";
  if (kind !== "messages" && !phoneValid(f.phone))
    e.phone = "Enter a PH mobile number, like 0917 123 4567.";
  if (kind === "bookings") {
    for (const k of ["service", "device", "preferred_time", "mode"]) need(k);
    need("problem", 10, 5000);
    if (!f.preferred_date || f.preferred_date < today())
      e.preferred_date = "Choose today or a later date.";
    if (f.mode === "Onsite") need("address", 8, 1000);
  }
  if (kind === "quotes") {
    need("category");
    need("title", 1, 200);
    need("requirements", 20, 10000);
    need("budget");
    if (f.hardware?.length > 5000)
      e.hardware = "Use no more than 5000 characters.";
    if (f.reference_link && !/^https?:\/\/\S+\.\S+$/.test(f.reference_link))
      e.reference_link = "Enter a full link starting with http:// or https://";
  }
  if (kind === "messages") need("body", 10, 5000);
  if (kind === "orders" && f.delivery_method === "delivery")
    need("address", 8, 1000);
  return e;
}
