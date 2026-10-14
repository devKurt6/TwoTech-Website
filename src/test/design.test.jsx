import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { Services } from "../pages/Services";
import { Home } from "../pages/Home";
import Header from "../components/Header";
import { defaults } from "../data/settings";
const router = (ui, path = "/") =>
  render(
    <MemoryRouter
      initialEntries={[path]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      {ui}
      <Location />
    </MemoryRouter>,
  );
function Location() {
  const loc = useLocation();
  return <output aria-label="Current path">{loc.pathname}</output>;
}
afterEach(cleanup);
it("defaults to five repair groups and persists development in the route", () => {
  router(<Services go={vi.fn()} book={vi.fn()} />, "/services");
  expect(
    screen.getByRole("tab", { name: "Repair & IT Support" }),
  ).toHaveAttribute("aria-selected", "true");
  expect(
    screen.getAllByRole("button", { name: "Book a Service" }),
  ).toHaveLength(5);
  expect(
    screen.queryByRole("heading", { name: "Automation & AI" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("tab", { name: "Custom Development" }));
  expect(screen.getByLabelText("Current path")).toHaveTextContent(
    "/services/development",
  );
  expect(
    screen.queryByRole("button", { name: "Book a Service" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByRole("button", { name: "Request a Quote" }),
  ).toHaveLength(1);
  expect(
    screen.getByRole("heading", { name: "Automation & AI" }),
  ).toBeInTheDocument();
});
it("opens development directly and supports arrow-key tabs", () => {
  router(<Services go={vi.fn()} book={vi.fn()} />, "/services/development");
  const tab = screen.getByRole("tab", { name: "Custom Development" });
  expect(tab).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(tab, { key: "ArrowLeft" });
  expect(screen.getByLabelText("Current path")).toHaveTextContent("/services");
  expect(
    screen.getByRole("tab", { name: "Repair & IT Support" }),
  ).toHaveFocus();
});
it("routes home journeys to the correct pages", () => {
  const go = vi.fn();
  router(
    <Home
      settings={defaults}
      products={[]}
      go={go}
      add={vi.fn()}
      view={vi.fn()}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: /Automation & AI/ }));
  expect(go).toHaveBeenLastCalledWith("/services/development");
  fireEvent.click(
    screen.getByRole("button", { name: /Computer Setup & Upgrades/ }),
  );
  expect(go).toHaveBeenLastCalledWith("Services");
  fireEvent.click(screen.getByRole("button", { name: "Explore Services" }));
  expect(go).toHaveBeenLastCalledWith("Services");
  fireEvent.click(screen.getByRole("button", { name: /Book a repair/ }));
  expect(go).toHaveBeenLastCalledWith("Services");
});
it("closes mobile navigation on Escape, outside interaction and link selection", () => {
  router(<Header settings={defaults} count={0} />, "/services/development");
  const menu = document.getElementById("mobile-navigation");
  expect(menu).toHaveAttribute("aria-hidden", "true");
  expect(menu.querySelector("a")).toHaveAttribute("tabindex", "-1");
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  expect(menu).toHaveAttribute("aria-hidden", "false");
  expect(menu.querySelector('[aria-current="page"]')).toHaveTextContent(
    "Services",
  );
  fireEvent.keyDown(document, { key: "Escape" });
  expect(menu).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByRole("button", { name: "Open menu" })).toHaveFocus();
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  fireEvent.pointerDown(document.body);
  expect(menu).toHaveAttribute("aria-hidden", "true");
  fireEvent.click(screen.getByRole("button", { name: "Open menu" }));
  fireEvent.click(menu.querySelector('a[href="/quote"]'));
  expect(menu).toHaveAttribute("aria-hidden", "true");
  expect(screen.getByLabelText("Current path")).toHaveTextContent("/quote");
});
