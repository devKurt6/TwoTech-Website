export function reconcileCart(cart, products) {
  if (!Array.isArray(cart)) return [];
  const totals = new Map();
  for (const item of cart) {
    const p = products.find((p) => String(p.id) === String(item?.productId));
    const qty = Number(item?.qty);
    if (
      p &&
      p.visible !== false &&
      p.stock > 0 &&
      Number.isInteger(qty) &&
      qty > 0
    )
      totals.set(p.id, Math.min(p.stock, (totals.get(p.id) || 0) + qty));
  }
  return [...totals].map(([productId, qty]) => ({ productId, qty }));
}
export function changeQty(cart, id, qty, products) {
  return reconcileCart(
    [...cart.filter((i) => i.productId !== id), { productId: id, qty }],
    products,
  );
}
