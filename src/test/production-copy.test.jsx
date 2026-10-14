import { it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Home } from "../pages/Home";
import { Shop } from "../pages/Shop";
import { Services } from "../pages/Services";
import { Booking } from "../pages/Book";
import { Project } from "../pages/Quote";
import { About } from "../pages/About";
import { Cart } from "../pages/Cart";
import { Detail } from "../pages/ProductDetail";
import Policy from "../pages/Policy";
import NotFound from "../pages/NotFound";
import Header from "../components/Header";
import Footer from "../components/Footer";
import DemoBanner from "../components/DemoBanner";
import { defaults } from "../data/settings";
import { PRODUCTS } from "../data/products";
import { DEMO_ENABLED } from "../data/demoCopy";
import { api } from "../lib/api";
import App from "../App";
import * as notifications from "../lib/netlifyForms";
const productionIt = DEMO_ENABLED ? it.skip : it;
const props = {
  settings: defaults,
  products: PRODUCTS,
  go: vi.fn(),
  add: vi.fn(),
  view: vi.fn(),
};
const wrap = (component, path = "/") =>
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {component}
    </MemoryRouter>,
  );
function clean() {
  expect(document.body.textContent).not.toMatch(
    /\b(demo|prototype|sample)s?\b/i,
  );
  for (const el of document.querySelectorAll("meta[content]"))
    expect(el.content).not.toMatch(/\b(demo|prototype|sample)s?\b/i);
  expect(document.title).not.toMatch(/\b(demo|prototype|sample)s?\b/i);
}
beforeEach(() => {
  vi.spyOn(notifications, "submitNetlifyCopy").mockResolvedValue(true);
  sessionStorage.clear();
  localStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
  vi.spyOn(api, "settings").mockResolvedValue(defaults);
  vi.spyOn(api, "products").mockResolvedValue(PRODUCTS);
  vi.spyOn(api, "submit").mockResolvedValue({ ref: "REQ-COPY-CHECK" });
  vi.spyOn(api, "placeOrder").mockResolvedValue({
    ref: "ORD-COPY-CHECK",
    total: PRODUCTS[0].price,
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
productionIt("renders public pages without development warnings", async () => {
  const pages = [
    <Home {...props} />,
    <Shop {...props} />,
    <Services {...props} book={vi.fn()} />,
    <Booking pre="setup" />,
    <Project />,
    <About />,
    <Cart items={[]} settings={defaults} />,
    <Detail p={PRODUCTS[0]} add={vi.fn()} onClose={vi.fn()} />,
    <Policy type="privacy" />,
    <Policy type="terms" />,
    <NotFound />,
    <>
      <DemoBanner />
      <Header count={0} settings={defaults} />
      <Footer settings={defaults} />
    </>,
  ];
  for (const page of pages) {
    wrap(page);
    await screen.findAllByRole("heading");
    clean();
    cleanup();
  }
  wrap(<Services {...props} book={vi.fn()} />, "/services/development");
  clean();
  expect(
    screen.getAllByRole("button", { name: "Request a Quote" }),
  ).toHaveLength(1);
  cleanup();
  for (const path of [
    "/",
    "/shop",
    "/services",
    "/services/development",
    "/book",
    "/quote",
    "/about",
    "/cart",
    "/privacy",
    "/terms",
    "/missing",
    "/shop/1",
  ]) {
    wrap(<App />, path);
    await screen.findByRole("navigation", { name: "Main" });
    await screen.findAllByRole("heading");
    clean();
    cleanup();
  }
});
productionIt(
  "renders checkout and an unpaid order receipt without warnings",
  async () => {
    wrap(
      <Cart
        items={[{ p: PRODUCTS[0], q: 1 }]}
        settings={defaults}
        clear={vi.fn()}
        setQty={vi.fn()}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Proceed to Checkout" }),
    );
    clean();
    fireEvent.change(screen.getByLabelText("Payment method"), {
      target: { value: "manual_transfer" },
    });
    for (const [label, value] of [
      ["Full name", "Copy check"],
      ["Email", "copy@example.ph"],
      ["Phone", "09171234567"],
    ])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(
      screen.getByRole("button", { name: "Place Order", exact: true }),
    );
    await screen.findByRole("heading", { name: "Order received" });
    expect(screen.getByText(/awaiting payment/)).toBeInTheDocument();
    clean();
  },
);
productionIt(
  "keeps booking requests and quotation review truthful in confirmations",
  async () => {
    wrap(<Booking pre="setup" />);
    for (const [label, value] of [
      ["Full name", "Copy check"],
      ["Email", "copy@example.ph"],
      ["Phone number", "09171234567"],
      ["Device type and model", "Desktop PC"],
      ["Problem description", "Please check this desktop computer"],
      ["Preferred date", "2099-01-01"],
      ["Preferred time", "9:00 AM"],
      ["Service mode", "Drop-off"],
    ])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Request Booking" }));
    await screen.findByRole("heading", { name: "Booking request received" });
    expect(screen.getByText(/not final until we confirm/)).toBeInTheDocument();
    clean();
    cleanup();
    sessionStorage.clear();
    wrap(<Project />);
    for (const [label, value] of [
      ["Your name", "Copy check"],
      ["Email", "copy@example.ph"],
      ["Phone number", "09171234567"],
      ["Project category", "Website"],
      ["Project title", "Business website"],
      [
        "Requirements and desired features",
        "A business website with a catalog and booking requests",
      ],
      ["Estimated budget range", "Not sure yet"],
    ])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(
      screen.getByRole("button", { name: "Submit Quote Request" }),
    );
    await screen.findByRole("heading", { name: "Quotation request received" });
    expect(
      screen.getByText(/reviewed before a quotation is provided/),
    ).toBeInTheDocument();
    clean();
    cleanup();
    sessionStorage.clear();
    wrap(<About />);
    await screen.findByRole("button", { name: "Send Message" });
    for (const [label, value] of [
      ["Your name", "Copy check"],
      ["Email", "copy@example.ph"],
      ["Message", "A message about repair availability"],
    ])
      fireEvent.change(screen.getByLabelText(label), { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Send Message" }));
    await screen.findByRole("heading", { name: "Message sent" });
    expect(screen.getByText(/reply as soon as we can/)).toBeInTheDocument();
    clean();
  },
);
