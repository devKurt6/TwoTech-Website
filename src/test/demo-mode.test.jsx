import { it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import DemoBanner from "../components/DemoBanner";
import Confirmation from "../components/Confirmation";
import { demoCopy } from "../data/demoCopy";
import { MemoryRouter } from "react-router-dom";
vi.mock("../data/demoCopy", async (original) => ({
  ...(await original()),
  DEMO_ENABLED: true,
}));
afterEach(cleanup);
it("shows the optional portfolio banner and allows dismissal", () => {
  render(<DemoBanner />);
  expect(screen.getByText(demoCopy.banner)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: demoCopy.dismiss }));
  expect(screen.queryByText(demoCopy.banner)).not.toBeInTheDocument();
});
it("keeps portfolio confirmation wording truthful about recorded requests", () => {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Confirmation title="Order received" reference="ORD-CHECK">
        Awaiting payment
      </Confirmation>
    </MemoryRouter>,
  );
  expect(screen.getByText(demoCopy.confirmation)).toBeInTheDocument();
  expect(screen.getByText("Awaiting payment")).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "Order received" }),
  ).toBeInTheDocument();
});
