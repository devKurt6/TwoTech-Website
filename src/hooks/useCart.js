import { useState, useEffect } from "react";
import { reconcileCart, changeQty } from "../lib/cart";
export function useCart(products, ready = true) {
  const [raw, setRaw] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("tt-cart"));
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });
  const cart = ready ? reconcileCart(raw, products) : [];
  useEffect(() => {
    if (ready) {
      const next = reconcileCart(raw, products);
      try {
        localStorage.setItem("tt-cart", JSON.stringify(next));
      } catch {
        // Cart remains usable in memory when browser storage is disabled/full.
      }
      if (JSON.stringify(next) !== JSON.stringify(raw)) setRaw(next);
    }
  }, [raw, products, ready]);
  const setQty = (id, q) => setRaw((c) => changeQty(c, id, q, products));
  const add = (p, n) =>
    setRaw((c) =>
      changeQty(
        c,
        p.id,
        (c.find((i) => i.productId === p.id)?.qty || 0) + n,
        products,
      ),
    );
  return {
    cart,
    items: cart.map((i) => ({
      p: products.find((p) => p.id === i.productId),
      q: i.qty,
    })),
    add,
    setQty,
    clear: () => setRaw([]),
    count: cart.reduce((n, i) => n + i.qty, 0),
  };
}
