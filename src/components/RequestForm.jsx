import { useState } from "react";
import { useSubmission } from "../hooks/useSubmission";
import { api } from "../lib/api";
import { BOOKABLE, SVC } from "../data/services";
import { today } from "../lib/validators";
import Field from "./Field";
import Honeypot from "./Honeypot";
import Confirmation from "./Confirmation";
import FormConsent from "./FormConsent";
const initial = {
  name: "",
  email: "",
  phone: "",
  service: "",
  device: "",
  problem: "",
  preferred_date: "",
  preferred_time: "",
  mode: "",
  address: "",
  category: "",
  title: "",
  requirements: "",
  hardware: "",
  budget: "",
  target_date: "",
  reference_link: "",
  body: "",
};
export default function RequestForm({ kind, pre }) {
  const [f, setF] = useState({
    ...initial,
    service: BOOKABLE.find((b) => b.g === pre)?.n || "",
  });
  const submission = useSubmission(kind, (data) => api.submit(kind, data));
  const { errors, busy, done } = submission;
  const book = kind === "bookings",
    quote = kind === "quotes";
  const selected = BOOKABLE.find((b) => b.n === f.service);
  const set = (key, value) => setF({ ...f, [key]: value });
  const input = (key, label, type = "text", min) => (
    <Field label={label} error={errors[key]}>
      <input
        className="in mt-1"
        type={type}
        min={min}
        maxLength={key === "email" ? 254 : key === "address" ? 1000 : 500}
        value={f[key]}
        onChange={(e) => set(key, e.target.value)}
        autoComplete={
          ["name", "email", "phone", "address"].includes(key)
            ? {
                name: "name",
                email: "email",
                phone: "tel",
                address: "street-address",
              }[key]
            : undefined
        }
      />
    </Field>
  );
  const area = (key, label, rows = 4, max = 5000) => (
    <Field label={label} error={errors[key]}>
      <textarea
        className="in mt-1"
        rows={rows}
        maxLength={max}
        value={f[key]}
        onChange={(e) => set(key, e.target.value)}
      />
    </Field>
  );
  const select = (key, label, options) => (
    <Field label={label} error={errors[key]}>
      <select
        className="in mt-1"
        value={f[key]}
        onChange={(e) => set(key, e.target.value)}
      >
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
    </Field>
  );
  if (done)
    return (
      <Confirmation
        title={
          book
            ? "Booking request received"
            : quote
              ? "Quotation request received"
              : "Message sent"
        }
        reference={done.ref}
        onReset={() => {
          submission.setDone(null);
          setF(initial);
        }}
      >
        {book ? (
          <>
            <p>
              <b>{f.service}</b> for {f.device}
            </p>
            <p>
              Requested: {f.preferred_date} at {f.preferred_time} ({f.mode})
            </p>
            <p>
              Your selected schedule is a request and is not final until we
              confirm it with you.
            </p>
          </>
        ) : quote ? (
          <>
            <p>
              <b>{f.title}</b> ({f.category})
            </p>
            <p>
              Your project will be reviewed before a quotation is provided. A
              review does not commit either side.
            </p>
          </>
        ) : (
          <p>We'll reply as soon as we can.</p>
        )}
      </Confirmation>
    );
  return (
    <div className={book ? "grid lg:grid-cols-3 gap-5" : ""}>
      <form
        onSubmit={(e) => submission.submit(e, f)}
        noValidate
        className={
          "card p-5 grid gap-4 " +
          (kind === "messages" ? "" : "sm:grid-cols-2 max-w-4xl ") +
          (book ? "lg:col-span-2" : "")
        }
      >
        <Honeypot
          value={submission.honeypot}
          onChange={submission.setHoneypot}
        />
        {input("name", book ? "Full name" : "Your name")}
        {input("email", "Email", "email")}
        {kind !== "messages" && input("phone", "Phone number", "tel")}
        {book && (
          <>
            <Field label="Service" error={errors.service}>
              <select
                className="in mt-1"
                value={f.service}
                onChange={(e) =>
                  setF({ ...f, service: e.target.value, mode: "" })
                }
              >
                <option value="">Select a service</option>
                {SVC.filter((s) => s.mode === "book").map((g) => (
                  <optgroup key={g.id} label={g.t}>
                    {g.items.map((i) => (
                      <option key={i}>{i}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            {input("device", "Device type and model")}
            <Field
              label="Service mode"
              error={errors.mode}
              help={!selected ? "Choose a service first." : undefined}
            >
              <select
                className="in mt-1"
                disabled={!selected}
                value={f.mode}
                onChange={(e) => set("mode", e.target.value)}
              >
                <option value="">Select mode</option>
                {selected?.modes.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </Field>
            {f.mode === "Onsite" && (
              <div className="sm:col-span-2">
                {input("address", "Onsite address")}
              </div>
            )}
            <div className="sm:col-span-2">
              {area("problem", "Problem description")}
            </div>
            {input("preferred_date", "Preferred date", "date", today())}
            {select("preferred_time", "Preferred time", [
              "9:00 AM",
              "11:00 AM",
              "1:00 PM",
              "3:00 PM",
              "5:00 PM",
            ])}
          </>
        )}
        {quote && (
          <>
            {select("category", "Project category", [
              "Website",
              "Desktop Application",
              "Automation",
              "AI/Image Processing",
              "Embedded Systems/IoT",
              "Other",
            ])}
            <div className="sm:col-span-2">
              {input("title", "Project title")}
            </div>
            <div className="sm:col-span-2">
              {area(
                "requirements",
                "Requirements and desired features",
                5,
                10000,
              )}
            </div>
            <div className="sm:col-span-2">
              {area("hardware", "Hardware requirements (optional)", 2)}
            </div>
            {select("budget", "Estimated budget range", [
              "Under ₱10,000",
              "₱10,000 – ₱30,000",
              "₱30,000 – ₱100,000",
              "Above ₱100,000",
              "Not sure yet",
            ])}
            {input("target_date", "Target completion date (optional)", "date")}
            <div className="sm:col-span-2">
              {input("reference_link", "Reference link (optional)", "url")}
            </div>
          </>
        )}
        {kind === "messages" && area("body", "Message")}
        {errors.form && (
          <p role="alert" className="text-red-700 sm:col-span-2">
            {errors.form}
          </p>
        )}
        <div className={kind === "messages" ? "" : "sm:col-span-2"}>
          <FormConsent />
          <button className="btn bp" disabled={busy}>
            {busy
              ? "Sending…"
              : book
                ? "Request Booking"
                : quote
                  ? "Submit Quote Request"
                  : "Send Message"}
          </button>
        </div>
      </form>
      {book && (
        <aside className="card p-5 h-fit lg:sticky lg:top-20">
          <h2 className="font-extrabold">Booking summary</h2>
          <dl className="mt-2 text-sm grid gap-2">
            <div>
              <dt className="text-stone-600">Service</dt>
              <dd className="font-semibold">{f.service || "Not selected"}</dd>
            </div>
            <div>
              <dt className="text-stone-600">Schedule request</dt>
              <dd>
                {f.preferred_date || "Not selected"} {f.preferred_time}
              </dd>
            </div>
            <div>
              <dt className="text-stone-600">Mode</dt>
              <dd>{f.mode || "Not selected"}</dd>
            </div>
          </dl>
          <p className="mt-3 bg-amber-50 text-goldText p-3 rounded-xl text-sm">
            Schedules are requests and need confirmation. Final price depends on
            inspection.
          </p>
        </aside>
      )}
    </div>
  );
}
