import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useResource } from "../hooks/useResource";
import { useSettings } from "../hooks/useSettings";
import DataState from "../components/DataState";
const load = async () => {
  const [products, orders, bookings, quotes] = await Promise.all([
    api.products(true),
    api.inbox("orders"),
    api.inbox("bookings"),
    api.inbox("quotes"),
  ]);
  return { products, orders, bookings, quotes };
};
export default function Dashboard() {
  const resource = useResource(load, {
      products: [],
      orders: [],
      bookings: [],
      quotes: [],
    }),
    settings = useSettings();
  const d = resource.data,
    low = d.products.filter(
      (p) => p.stock <= settings.data.low_stock_threshold,
    );
  const stats = [
    ["Products listed", d.products.filter((p) => p.visible).length, "products"],
    ["Low or out of stock", low.length, "products"],
    [
      "Orders to handle",
      d.orders.filter((o) => !["completed", "cancelled"].includes(o.status))
        .length,
      "inbox",
    ],
    [
      "Bookings & quotes pending",
      [...d.bookings, ...d.quotes].filter((o) => o.status === "pending").length,
      "inbox",
    ],
  ];
  return (
    <>
      <h1 className="text-2xl font-extrabold">Dashboard</h1>
      <DataState resource={resource}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {stats.map(([label, value, route]) => (
            <Link className="card p-4" to={"/admin/" + route} key={label}>
              <span className="text-sm text-stone-600">{label}</span>
              <b className="block text-3xl mt-1">{value}</b>
            </Link>
          ))}
        </div>
        <section className="card p-4 mt-5">
          <h2 className="font-extrabold">Needs restocking</h2>
          {low.length ? (
            <ul className="divide-y mt-2">
              {low.map((p) => (
                <li key={p.id} className="py-2 flex justify-between gap-3">
                  <span>{p.name}</span>
                  <b className={p.stock ? "text-goldText" : "text-red-700"}>
                    {p.stock ? p.stock + " left" : "Out of stock"}
                  </b>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2">Everything is well stocked.</p>
          )}
        </section>
      </DataState>
    </>
  );
}
