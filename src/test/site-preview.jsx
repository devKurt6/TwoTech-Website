// Development-only UI fixture: no network requests and no live database writes.
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import { api } from "../lib/api";
import { PRODUCTS } from "../data/products";
import { defaults } from "../data/settings";
import "../styles.css";
if (!import.meta.env.DEV)
  throw new Error("QA fixtures run only in development.");
api.products = async () => PRODUCTS;
api.settings = async () => {
  const data = structuredClone(defaults);
  if (new URLSearchParams(location.search).get("prices") === "true") {
    data.services
      .filter((s) => s.starting_price !== null)
      .forEach((s) =>
        s.items.forEach((i) => {
          i.price = 900;
        }),
      );
  }
  return data;
};
api.submit = async () => ({ ref: "REQ-QA-ONLY" });
api.placeOrder = async (_customer, items) => ({
  ref: "ORD-QA-ONLY",
  total: items.reduce(
    (sum, item) =>
      sum + PRODUCTS.find((p) => p.id === item.productId).price * item.qty,
    0,
  ),
});
const path = new URLSearchParams(location.search).get("page") || "/";
createRoot(document.getElementById("root")).render(
  <MemoryRouter
    initialEntries={[path]}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <App />
  </MemoryRouter>,
);
