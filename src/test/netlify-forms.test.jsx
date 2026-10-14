import { it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { submitNetlifyCopy } from "../lib/netlifyForms";
import { netlifyForms, NETLIFY_FORMS_PATH } from "../data/netlifyForms";
import { api } from "../lib/api";
import RequestForm from "../components/RequestForm";
import { Cart } from "../pages/Cart";
import { defaults } from "../data/settings";
import fs from "node:fs";
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function contact() {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RequestForm kind="messages" />
    </MemoryRouter>,
  );
  for (const [label, value] of [
    ["Your name", "QA Customer"],
    ["Email", "qa@example.ph"],
    ["Message", "Please check repair availability."],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Send Message" }));
}
it("registers all four forms and their exact allowlisted fields in static HTML", () => {
  const doc = new DOMParser().parseFromString(
    fs.readFileSync("public/netlify-forms.html", "utf8"),
    "text/html",
  );
  for (const [kind, fields] of Object.entries(netlifyForms)) {
    const form = doc.querySelector(`form[name="${kind}"]`);
    expect(form.getAttribute("data-netlify")).toBe("true");
    expect(form.getAttribute("netlify-honeypot")).toBe("bot-field");
    expect(
      [...form.querySelectorAll("input")].map((i) => i.name).sort(),
    ).toEqual(["form-name", "bot-field", ...fields].sort());
  }
});
it("URL-encodes allowed fields, includes the saved reference and omits secrets", async () => {
  const fetcher = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetcher);
  for (const kind of Object.keys(netlifyForms)) {
    expect(
      await submitNetlifyCopy(
        kind,
        {
          name: "Kurt & Tech",
          email: "qa@example.ph",
          password: "private",
          website: "spam",
        },
        "REF-123",
      ),
    ).toBe(true);
    const [path, options] = fetcher.mock.calls.at(-1);
    expect(path).toBe(NETLIFY_FORMS_PATH);
    expect(options.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded",
    );
    const body = new URLSearchParams(options.body);
    expect(body.get("form-name")).toBe(kind);
    expect(body.get("reference")).toBe("REF-123");
    expect(body.get("name")).toBe("Kurt & Tech");
    expect(body.get("bot-field")).toBe("");
    expect(body.has("password")).toBe(false);
    expect(body.has("website")).toBe(false);
  }
});
it("does not mirror requests rejected by the database API", async () => {
  vi.spyOn(api, "submit").mockRejectedValue(new Error("Server unavailable"));
  const fetcher = vi.fn();
  vi.stubGlobal("fetch", fetcher);
  contact();
  await screen.findByRole("alert");
  expect(fetcher).not.toHaveBeenCalled();
});
it("keeps the saved confirmation and retries only the Netlify copy after failure", async () => {
  const save = vi.spyOn(api, "submit").mockResolvedValue({ ref: "MSG-QA-123" });
  const fetcher = vi
    .fn()
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true });
  vi.stubGlobal("fetch", fetcher);
  contact();
  await screen.findByRole("button", { name: "Retry notification" });
  expect(
    screen.getByRole("heading", { name: "Message sent" }),
  ).toBeInTheDocument();
  expect(screen.getByText("MSG-QA-123")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry notification" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Retry notification" }),
    ).not.toBeInTheDocument(),
  );
  expect(save).toHaveBeenCalledTimes(1);
  expect(fetcher).toHaveBeenCalledTimes(2);
  expect(fetcher.mock.calls[0][1].body).toBe(fetcher.mock.calls[1][1].body);
});
it("returns a recoverable failure for a network error", async () => {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Offline")));
  expect(await submitNetlifyCopy("messages", { name: "QA" }, "MSG-QA")).toBe(
    false,
  );
});
it("mirrors a completed order using the server total and leaves payment awaiting verification", async () => {
  const save = vi
    .spyOn(api, "placeOrder")
    .mockResolvedValue({ ref: "ORD-QA-123", total: 1250 });
  const fetcher = vi.fn().mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetcher);
  const clear = vi.fn();
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Cart
        items={[
          { p: { id: "product-1", name: "RAM", price: 1000, stock: 5 }, q: 1 },
        ]}
        settings={defaults}
        clear={clear}
        setQty={vi.fn()}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));
  for (const [label, value] of [
    ["Full name", "QA Customer"],
    ["Email", "qa@example.ph"],
    ["Phone", "09171234567"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.change(screen.getByLabelText("Payment method"), {
    target: { value: "manual_transfer" },
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Place Order", exact: true }),
  );
  await waitFor(() => expect(fetcher).toHaveBeenCalledTimes(1));
  const body = new URLSearchParams(fetcher.mock.calls[0][1].body);
  expect(body.get("form-name")).toBe("orders");
  expect(body.get("reference")).toBe("ORD-QA-123");
  expect(body.get("total")).toBe("1250");
  expect(body.get("payment_status")).toBe("awaiting_payment");
  expect(body.get("items")).toContain("1 × RAM");
  expect(clear).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledTimes(1);
});
