import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, Trash2 } from "lucide-react";
import { P } from "../lib/format";
import { api, demo } from "../lib/api";
import { useSubmission } from "../hooks/useSubmission";
import Field from "../components/Field";
import Honeypot from "../components/Honeypot";
import Confirmation from "../components/Confirmation";
import EmptyState from "../components/EmptyState";
export function Cart({ items, setQty, clear, settings }) {
  const [step, setStep] = useState("cart"),
    [f, setF] = useState({
      name: "",
      email: "",
      phone: "",
      address: "",
      delivery_method: "pickup",
      payment_method: "cash",
    });
  const requestId = useRef(crypto.randomUUID());
  const attempt = useRef(null);
  const [locked, setLocked] = useState(false);
  const [receipt, setReceipt] = useState([]);
  const submission = useSubmission("orders", async (customer) => {
    attempt.current ??= {
      customer: { ...customer, request_id: requestId.current },
      items: items.map((i) => ({ productId: i.p.id, qty: i.q })),
      receipt: items,
    };
    setLocked(true);
    try {
      const result = await api.placeOrder(
        attempt.current.customer,
        attempt.current.items,
      );
      setReceipt(attempt.current.receipt);
      clear();
      return result;
    } catch (error) {
      if (error.status >= 400 && error.status < 500) {
        attempt.current = null;
        requestId.current = crypto.randomUUID();
        setLocked(false);
      }
      throw error;
    }
  });
  const { errors, busy, done } = submission;
  const displayItems = attempt.current?.receipt || items;
  const subtotal = displayItems.reduce((a, i) => a + i.p.price * i.q, 0),
    fee = f.delivery_method === "delivery" ? Number(settings.delivery_fee) : 0;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const Sum = (
    <div className="text-sm grid gap-1 border-t pt-3 mt-3">
      <div className="flex justify-between">
        <span>Subtotal</span>
        <b>{P(subtotal)}</b>
      </div>
      <div className="flex justify-between">
        <span>
          {f.delivery_method === "pickup" ? "Pickup (free)" : "Delivery fee"}
        </span>
        <b>{P(fee)}</b>
      </div>
      <div className="flex justify-between text-lg font-extrabold">
        <span>Total</span>
        <span>{P(subtotal + fee)}</span>
      </div>
    </div>
  );
  return (
    <div className="max-w-3xl mx-auto px-4 pt-10">
      {done ? (
        <Confirmation
          title={demo ? "Demo order confirmation" : "Order request received"}
          reference={done.ref}
        >
          <p className="text-sm text-goldText bg-amber-50 p-3 rounded-lg">
            DEMO PAYMENT FLOW — no online payment was taken. Owner verification
            is required before launch.
          </p>
          <ul>
            {receipt.map((i) => (
              <li key={i.p.id} className="flex justify-between gap-3 py-1">
                <span>
                  {i.q} × {i.p.name}
                </span>
                <span>{P(i.p.price * i.q)}</span>
              </li>
            ))}
          </ul>
          <p className="font-bold">
            {demo ? "Demo total:" : "Server-confirmed total:"} {P(done.total)}
          </p>
          <p>
            {f.delivery_method === "pickup" ? "Pickup" : "Delivery"} for{" "}
            {f.name}
          </p>
          <p>
            {f.payment_method === "manual_transfer"
              ? "Your order is awaiting payment. The business will mark it paid after verifying the transfer."
              : "Cash is due on pickup or delivery."}
          </p>
          {f.payment_method === "manual_transfer" && (
            <p className="whitespace-pre-line">
              {settings.payment_instructions}
            </p>
          )}
          <Link className="btn bs" to="/shop">
            Continue shopping
          </Link>
        </Confirmation>
      ) : !displayItems.length ? (
        <EmptyState title="Your cart is empty">
          <p>Add parts from the shop to get started.</p>
          <Link className="btn bp mt-4" to="/shop">
            Shop Computer Parts
          </Link>
        </EmptyState>
      ) : (
        <>
          <h1 className="text-3xl font-extrabold mb-5">
            {step === "cart" ? "Your cart" : "Checkout (demo payment flow)"}
          </h1>
          <section className="card p-5">
            {step === "cart" ? (
              <>
                <ul className="divide-y">
                  {displayItems.map((i) => (
                    <li
                      key={i.p.id}
                      className="py-3 flex gap-3 items-center flex-wrap"
                    >
                      <div className="flex-1 min-w-0">
                        <b>{i.p.name}</b>
                        <p className="text-sm text-stone-600">
                          {P(i.p.price)} each
                        </p>
                      </div>
                      <div className="flex items-center border rounded-xl">
                        <button
                          className="p-3 min-h-11 min-w-11"
                          aria-label={"Decrease " + i.p.name}
                          onClick={() => setQty(i.p.id, i.q - 1)}
                        >
                          <Minus size={16} />
                        </button>
                        <span
                          className="w-8 text-center font-bold"
                          aria-live="polite"
                        >
                          {i.q}
                        </span>
                        <button
                          className="p-3 min-h-11 min-w-11"
                          disabled={i.q >= i.p.stock}
                          aria-label={"Increase " + i.p.name}
                          onClick={() => setQty(i.p.id, i.q + 1)}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                      <b>{P(i.p.price * i.q)}</b>
                      <button
                        className="p-3 min-h-11 min-w-11 text-red-700"
                        aria-label={"Remove " + i.p.name}
                        onClick={() => setQty(i.p.id, 0)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </li>
                  ))}
                </ul>
                {Sum}
                <button
                  className="btn bp w-full mt-4"
                  onClick={() => setStep("checkout")}
                >
                  Proceed to Checkout
                </button>
              </>
            ) : (
              <form
                onSubmit={(e) => submission.submit(e, f)}
                noValidate
                className="grid gap-3"
              >
                <p className="bg-amber-50 border border-amber-300 text-goldText p-3 rounded-xl text-sm">
                  Demo order and payment flow. No card details are collected.{" "}
                  {demo
                    ? "Requests are sent only when the API is available."
                    : "This creates an order in the connected database."}
                </p>
                <Honeypot
                  value={submission.honeypot}
                  onChange={submission.setHoneypot}
                />
                <fieldset
                  disabled={busy || locked}
                  className="grid gap-3 min-w-0"
                >
                  <Field label="Full name" error={errors.name}>
                    <input
                      className="in mt-1"
                      maxLength={150}
                      autoComplete="name"
                      value={f.name}
                      onChange={set("name")}
                    />
                  </Field>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <Field label="Email" error={errors.email}>
                      <input
                        className="in mt-1"
                        type="email"
                        maxLength={254}
                        autoComplete="email"
                        value={f.email}
                        onChange={set("email")}
                      />
                    </Field>
                    <Field label="Phone" error={errors.phone}>
                      <input
                        className="in mt-1"
                        type="tel"
                        autoComplete="tel"
                        value={f.phone}
                        onChange={set("phone")}
                      />
                    </Field>
                  </div>
                  <fieldset>
                    <legend className="font-semibold text-sm">
                      Delivery method
                    </legend>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {["pickup", "delivery"].map((m) => (
                        <label
                          key={m}
                          className={
                            "flex-1 min-w-32 border rounded-xl p-3 " +
                            (f.delivery_method === m
                              ? "border-gold bg-amber-50"
                              : "")
                          }
                        >
                          <input
                            type="radio"
                            name="delivery"
                            checked={f.delivery_method === m}
                            onChange={() => setF({ ...f, delivery_method: m })}
                            className="mr-2"
                          />
                          {m === "pickup"
                            ? "Pickup (free)"
                            : "Delivery (" + P(settings.delivery_fee) + ")"}
                        </label>
                      ))}
                    </div>
                  </fieldset>
                  {f.delivery_method === "delivery" && (
                    <Field label="Delivery address" error={errors.address}>
                      <input
                        className="in mt-1"
                        maxLength={1000}
                        autoComplete="street-address"
                        value={f.address}
                        onChange={set("address")}
                      />
                    </Field>
                  )}
                  <Field label="Payment method">
                    <select
                      className="in mt-1"
                      value={f.payment_method}
                      onChange={set("payment_method")}
                    >
                      <option value="cash">Cash on Pickup/Delivery</option>
                      <option value="manual_transfer">
                        Bank/GCash manual transfer
                      </option>
                    </select>
                  </Field>
                  {f.payment_method === "manual_transfer" && (
                    <div className="bg-amber-50 p-3 rounded-xl text-sm text-goldText whitespace-pre-line">
                      {settings.payment_instructions}
                      <p className="mt-2">
                        The order stays awaiting payment until an admin verifies
                        your transfer.
                      </p>
                    </div>
                  )}
                </fieldset>
                {Sum}
                {locked && !busy && (
                  <p role="status" className="text-sm text-goldText">
                    Checkout details are held while we verify this request.
                    Retry to safely retrieve the same order.
                  </p>
                )}
                {errors.form && (
                  <p role="alert" className="text-red-700">
                    {errors.form}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    className="btn bs"
                    type="button"
                    disabled={busy || locked}
                    onClick={() => setStep("cart")}
                  >
                    Back
                  </button>
                  <button className="btn bp flex-1" disabled={busy}>
                    {busy ? "Placing order…" : "Place order (demo flow)"}
                  </button>
                </div>
              </form>
            )}
          </section>
        </>
      )}
    </div>
  );
}
