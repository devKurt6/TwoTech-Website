// Isolated development-only fixture entry. Not a production route or Vite build input.
import React from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AdminLayout from "../admin/AdminLayout";
import Dashboard from "../admin/Dashboard";
import Products from "../admin/Products";
import Settings from "../admin/Settings";
import Inbox from "../admin/Inbox";
import { api } from "../lib/api";
import { PRODUCTS } from "../data/products";
import { defaults } from "../data/settings";
import "../styles.css";
if (!import.meta.env.DEV)
  throw new Error("QA fixtures run only in development.");
let catalog = PRODUCTS.map((p) => ({ ...p, visible: true, id: String(p.id) }));
let settings = { ...defaults };
const rows = {
  orders: [
    {
      id: "order-1",
      ref: "DEMO-ORD-123",
      customer_name: "QA Customer",
      email: "qa@example.ph",
      phone: "09171234567",
      delivery_method: "pickup",
      payment_method: "manual_transfer",
      status: "awaiting_payment",
      subtotal: 7490,
      delivery_fee: 0,
      total: 7490,
      created_at: new Date().toISOString(),
      order_items: [
        { id: "item-1", name: catalog[0].name, qty: 1, unit_price: 7490 },
      ],
    },
  ],
  bookings: [],
  quotes: [],
  messages: [
    {
      id: "message-1",
      ref: "DEMO-MSG-123",
      name: "QA Customer",
      email: "qa@example.ph",
      body: "Please check compatibility with my motherboard.",
      handled: false,
      created_at: new Date().toISOString(),
    },
  ],
};
api.products = async () => catalog;
api.settings = async () => settings;
api.inbox = async (table) => rows[table];
api.saveProduct = async (p) => {
  catalog = p.id
    ? catalog.map((x) => (x.id === p.id ? p : x))
    : [...catalog, { ...p, id: crypto.randomUUID() }];
  window.dispatchEvent(new Event("tt-refresh"));
};
api.deleteProduct = async (id) => {
  catalog = catalog.filter((p) => p.id !== id);
  window.dispatchEvent(new Event("tt-refresh"));
};
api.saveSettings = async (data) => {
  settings = data;
  window.dispatchEvent(new Event("tt-refresh"));
};
api.updateRecord = async (table, id, patch) => {
  rows[table] = rows[table].map((r) => (r.id === id ? { ...r, ...patch } : r));
};
api.uploadImage = async () => {
  throw new Error(
    "Live uploads are disabled in the layout fixture. Use connected Supabase QA for upload verification.",
  );
};
api.logout = async () => {};
const page = new URLSearchParams(location.search).get("page") || "/admin";
createRoot(document.getElementById("root")).render(
  <MemoryRouter
    initialEntries={[page]}
    future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
  >
    <p className="p-2 text-center bg-gold text-ink text-sm font-bold">
      ISOLATED QA FIXTURE — no Auth bypass or live database writes
    </p>
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/admin" element={<Dashboard />} />
        <Route path="/admin/products" element={<Products />} />
        <Route path="/admin/inbox" element={<Inbox />} />
        <Route path="/admin/settings" element={<Settings />} />
      </Route>
    </Routes>
  </MemoryRouter>,
);
