import { it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Cart } from "../pages/Cart";
import RequestForm from "../components/RequestForm";
import Modal from "../components/Modal";
import { defaults } from "../data/settings";
import { api } from "../lib/api";
beforeEach(() => {
  sessionStorage.clear();
  vi.stubGlobal("scrollTo", vi.fn());
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it("validates booking, honors preselection, and restricts modes", () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <RequestForm kind="bookings" pre="setup" />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText("Service")).toHaveValue("Custom PC assembly");
  expect(screen.getByLabelText("Service mode")).not.toHaveTextContent("Remote");
  fireEvent.click(screen.getByRole("button", { name: "Request Booking" }));
  expect(screen.getByLabelText("Email")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
});
it("keeps cart on network failure and shows receipt after retry", async () => {
  const place = vi
    .spyOn(api, "placeOrder")
    .mockRejectedValueOnce(new Error("Network error"))
    .mockResolvedValueOnce({ ref: "DEMO-ORD-TEST", total: 1000 });
  const clear = vi.fn();
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Cart
        items={[
          { p: { id: "a", name: "Sample RAM", price: 1000, stock: 3 }, q: 1 },
        ]}
        setQty={vi.fn()}
        clear={clear}
        settings={defaults}
      />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Proceed to Checkout" }));
  for (const [label, value] of [
    ["Full name", "Test"],
    ["Email", "test@example.ph"],
    ["Phone", "09171234567"],
  ])
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  fireEvent.click(screen.getByRole("button", { name: "Place Order" }));
  await screen.findByRole("alert");
  expect(clear).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Place Order" }));
  await screen.findByText("DEMO-ORD-TEST");
  expect(clear).toHaveBeenCalledOnce();
  expect(place.mock.calls[0][0].request_id).toBe(
    place.mock.calls[1][0].request_id,
  );
});
it("closes dialogs with Escape and restores focus", async () => {
  // jsdom has no layout; give focusable controls visible geometry.
  vi.spyOn(HTMLElement.prototype, "getClientRects").mockReturnValue([
    { width: 100, height: 44 },
  ]);
  const close = vi.fn();
  render(<button>Launch</button>);
  const launch = screen.getByRole("button", { name: "Launch" });
  launch.focus();
  const modal = render(
    <Modal title="Test dialog" onClose={close}>
      <button>First</button>
      <button>Last</button>
    </Modal>,
  );
  screen.getByRole("button", { name: "Last" }).focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(screen.getByRole("button", { name: "Close dialog" })).toHaveFocus();
  fireEvent.keyDown(document, { key: "Escape" });
  await waitFor(() => expect(close).toHaveBeenCalledOnce());
  modal.unmount();
  expect(launch).toHaveFocus();
});
