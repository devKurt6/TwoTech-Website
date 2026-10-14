import { useToast } from "../hooks/useToast";
import { useState } from "react";
import { useSettings } from "../hooks/useSettings";
import DataState from "../components/DataState";
import Field from "../components/Field";
import Toast from "../components/Toast";
import { api } from "../lib/api";
import { emailValid, phoneValid } from "../lib/validators";
import ServiceSettings from "./ServiceSettings";
import PolicySettings from "./PolicySettings";
import { serviceErrors, getServices } from "../data/services";
const choiceFields = ["booking_times", "quote_categories", "quote_budgets"];
const parseChoices = (v) =>
  typeof v === "string"
    ? v
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : v;
function Editor({ data }) {
  const [section, setSection] = useState("Business details");
  const [f, setF] = useState(data),
    [errors, setErrors] = useState({}),
    [busy, setBusy] = useState(false),
    [toast, setToast] = useToast();
  const fields = [
    ["headline", "Home page headline"],
    ["banner", "Announcement banner (optional)"],
    ["phone", "Phone"],
    ["email", "Email"],
    ["address", "Address"],
    ["hours", "Business hours"],
    ["facebook", "Facebook page link"],
    ["delivery_fee", "Delivery fee (₱)"],
    ["payment_instructions", "Payment instructions"],
    ["founder_bio", "Founder bio"],
    ["low_stock_threshold", "Low stock threshold"],
    ["maps", "Google Maps link"],
    ["founder_name", "Founder name"],
    ["service_area", "Service area"],
    ["business_intro", "Business introduction"],
    ["booking_times", "Booking times (one per line)"],
    ["quote_categories", "Quote categories (one per line)"],
    ["quote_budgets", "Quote budget ranges (one per line)"],
  ];
  async function submit(e) {
    e.preventDefault();
    const x = serviceErrors(f.services);
    for (const key of choiceFields) {
      const choices = parseChoices(f[key]);
      if (
        !choices.length ||
        choices.length > 40 ||
        choices.some((v) => v.length > 150) ||
        new Set(choices).size !== choices.length
      )
        x[key] = "Enter 1–40 unique choices, up to 150 characters each.";
    }
    try {
      if (new URL(f.maps).protocol !== "https:")
        x.maps = "Enter a full HTTPS Maps link.";
    } catch {
      x.maps = "Enter a full HTTPS Maps link.";
    }
    for (const [k] of fields)
      if (
        k !== "banner" &&
        (String(f[k]).trim().length === 0 || String(f[k]).length > 5000)
      )
        x[k] = "Enter a value up to 5,000 characters.";
    if (!emailValid(f.email)) x.email = "Enter a valid email.";
    if (!phoneValid(f.phone)) x.phone = "Enter a PH mobile number.";
    try {
      const url = new URL(f.facebook);
      if (
        url.protocol !== "https:" ||
        !/(^|\.)facebook\.com$/.test(url.hostname)
      )
        x.facebook = "Enter an HTTPS Facebook link.";
    } catch {
      x.facebook = "Enter a full HTTPS Facebook link.";
    }
    if (
      !Number.isFinite(+f.delivery_fee) ||
      +f.delivery_fee < 0 ||
      +f.delivery_fee > 999999
    )
      x.delivery_fee = "Enter a delivery fee from 0 to 999,999.";
    if (!Number.isInteger(+f.low_stock_threshold) || +f.low_stock_threshold < 0)
      x.low_stock_threshold = "Enter a whole number, 0 or more.";
    setErrors(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    try {
      await api.saveSettings({
        ...f,
        delivery_fee: +f.delivery_fee,
        low_stock_threshold: +f.low_stock_threshold,
        ...Object.fromEntries(choiceFields.map((k) => [k, parseChoices(f[k])])),
        services: f.services.map((s) => ({
          ...s,
          title: s.title.trim(),
          description: s.description.trim(),
          items: s.items.map((i) => ({ ...i, name: i.name.trim() })),
        })),
      });
      setToast("Website details saved");
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="grid lg:grid-cols-2 gap-5 mt-4">
      <form
        onSubmit={submit}
        className="card p-5 grid gap-3 min-w-0"
        noValidate
      >
        <div className="sticky top-3 z-10 bg-white border-b pb-3 flex flex-wrap gap-2">
          {["Business details", "Services & prices", "Policies"].map((v) => (
            <button
              key={v}
              type="button"
              className={"btn " + (section === v ? "bp" : "bs")}
              aria-pressed={section === v}
              onClick={() => setSection(v)}
            >
              {v}
            </button>
          ))}
          <button className="btn bp" disabled={busy}>
            {busy ? "Saving…" : "Save changes"}
          </button>
        </div>
        {section === "Services & prices" && (
          <ServiceSettings
            services={f.services}
            errors={errors}
            onChange={(services) => setF({ ...f, services })}
          />
        )}
        {section === "Policies" && (
          <PolicySettings
            policies={f.policies}
            onChange={(policies) => setF({ ...f, policies })}
          />
        )}
        {section === "Business details" &&
          fields.map(([k, l]) => (
            <Field key={k} label={l} error={errors[k]}>
              {[
                "headline",
                "founder_bio",
                "payment_instructions",
                "business_intro",
                ...choiceFields,
              ].includes(k) ? (
                <textarea
                  className="in mt-1"
                  rows={3}
                  maxLength={5000}
                  value={Array.isArray(f[k]) ? f[k].join("\n") : f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                />
              ) : (
                <input
                  className="in mt-1"
                  type={
                    ["delivery_fee", "low_stock_threshold"].includes(k)
                      ? "number"
                      : k === "email"
                        ? "email"
                        : "text"
                  }
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                />
              )}
            </Field>
          ))}
        {Object.keys(errors).length > 0 && (
          <p role="alert" className="text-red-700">
            Check the highlighted fields in Business details and Services &
            prices before saving.
          </p>
        )}
        {errors.form && (
          <p role="alert" className="text-red-700">
            {errors.form}
          </p>
        )}
      </form>
      <div className="h-fit lg:sticky lg:top-4">
        <h2 className="font-bold mb-2">Live preview</h2>
        <div className="rounded-2xl bg-ink text-stone-300 p-5 text-sm grid gap-2">
          {section === "Business details" && (
            <>
              {f.banner && (
                <p className="bg-gold text-ink font-bold rounded-lg p-3">
                  {f.banner}
                </p>
              )}
              <p className="text-white text-xl font-extrabold">{f.headline}</p>
              <hr className="border-white/20 my-2" />
              <p>Phone: {f.phone}</p>
              <p>Email: {f.email}</p>
              <p>{f.address}</p>
              <p>Hours: {f.hours}</p>
              <p>Delivery fee: ₱{f.delivery_fee}</p>
              <p>{f.payment_instructions}</p>
              <p>{f.founder_bio}</p>
            </>
          )}
          {section === "Policies" &&
            Object.entries(f.policies).map(([key, p]) => (
              <div key={key}>
                <h3 className="text-white font-bold">{p.title}</h3>
                <p>{p.intro || "Review note removed"}</p>
              </div>
            ))}
          {section === "Services & prices" &&
            getServices(f).map((s) => (
              <div key={s.id} className="bg-white text-ink rounded-xl p-3">
                <b>{s.t}</b>
                <p className="text-goldText font-bold">{s.from}</p>
                <p>{s.d}</p>
              </div>
            ))}
        </div>
      </div>
      <Toast message={toast} />
    </div>
  );
}
export default function Settings() {
  const resource = useSettings();
  return (
    <>
      <h1 className="text-2xl font-extrabold">Website settings</h1>
      <p className="text-stone-600 mt-1">
        Edit the details shown on the public website. Do not put secrets here.
      </p>
      <DataState resource={resource}>
        <Editor data={resource.data} />
      </DataState>
    </>
  );
}
