import { it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  cleanup,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Settings from "../admin/Settings";
import { defaults } from "../data/settings";
import { api } from "../lib/api";
import { Services } from "../pages/Services";
import RequestForm from "../components/RequestForm";
import Policy from "../pages/Policy";
beforeEach(() => {
  vi.spyOn(api, "settings").mockResolvedValue(structuredClone(defaults));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const wrap = (ui) =>
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {ui}
    </MemoryRouter>,
  );
it("persists owner policy text and renders it on the public policy page", async () => {
  const save = vi.spyOn(api, "saveSettings").mockResolvedValue({ ok: true });
  wrap(<Settings />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Policies", exact: true }),
  );
  fireEvent.change(
    screen.getByLabelText("privacy introduction / review note"),
    { target: { value: "Owner-approved privacy notice." } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  cleanup();
  api.settings.mockResolvedValue(save.mock.calls[0][0]);
  wrap(<Policy type="privacy" />);
  expect(
    await screen.findByText("Owner-approved privacy notice."),
  ).toBeInTheDocument();
});
it("saves edited starting and individual prices from the admin and renders them publicly", async () => {
  const save = vi.spyOn(api, "saveSettings").mockResolvedValue({ ok: true });
  wrap(<Settings />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Services & prices" }),
  );
  fireEvent.change(screen.getByLabelText("Starting price (repair) — ₱"), {
    target: { value: "725.50" },
  });
  fireEvent.change(
    screen.getByLabelText("Inclusion 1 price (repair) — ₱ (optional)"),
    { target: { value: "850" } },
  );
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
  const saved = save.mock.calls[0][0];
  expect(saved.services.find((s) => s.id === "repair").starting_price).toBe(
    725.5,
  );
  cleanup();
  wrap(<Services settings={saved} go={vi.fn()} book={vi.fn()} />);
  expect(screen.getByText("Diagnosis from ₱725.5*")).toBeInTheDocument();
  expect(screen.getByText("₱850*")).toBeInTheDocument();
});
it("shows current renamed booking services, modes, times and custom quote options", () => {
  const settings = structuredClone(defaults);
  settings.services.find((s) => s.id === "setup").items[0].name =
    "Owner assembly";
  settings.services.find((s) => s.id === "setup").modes = ["Remote"];
  settings.services.find((s) => s.id === "repair").visible = false;
  settings.booking_times = ["10:30 AM"];
  settings.quote_categories = ["Business software"];
  settings.quote_budgets = ["Discuss budget"];
  wrap(<RequestForm kind="bookings" pre="setup" settings={settings} />);
  expect(screen.getByLabelText("Service")).toHaveValue("Owner assembly");
  expect(screen.getByLabelText("Service mode")).toHaveTextContent("Remote");
  expect(screen.getByLabelText("Service mode")).not.toHaveTextContent(
    "Drop-off",
  );
  expect(screen.getByLabelText("Preferred time")).toHaveTextContent("10:30 AM");
  expect(
    screen.queryByRole("option", { name: "No-display & boot issue diagnosis" }),
  ).not.toBeInTheDocument();
  cleanup();
  wrap(<RequestForm kind="quotes" settings={settings} />);
  expect(screen.getByLabelText("Project category")).toHaveTextContent(
    "Business software",
  );
  expect(screen.getByLabelText("Estimated budget range")).toHaveTextContent(
    "Discuss budget",
  );
});
it("blocks invalid service prices before sending an admin save", async () => {
  const save = vi.spyOn(api, "saveSettings").mockResolvedValue({ ok: true });
  wrap(<Settings />);
  fireEvent.click(
    await screen.findByRole("button", { name: "Services & prices" }),
  );
  fireEvent.change(screen.getByLabelText("Starting price (repair) — ₱"), {
    target: { value: "-5" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  expect(save).not.toHaveBeenCalled();
  expect(screen.getByText(/Enter a starting price from/)).toBeInTheDocument();
});
