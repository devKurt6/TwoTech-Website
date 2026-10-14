import { useToast } from "../hooks/useToast";
import { useState } from "react";
import { useProducts } from "../hooks/useProducts";
import { useSettings } from "../hooks/useSettings";
import DataState from "../components/DataState";
import EmptyState from "../components/EmptyState";
import Modal from "../components/Modal";
import Toast from "../components/Toast";
import ProductForm from "./ProductForm";
import { P } from "../lib/format";
import { api } from "../lib/api";
export default function Products() {
  const resource = useProducts(true),
    settings = useSettings();
  const [q, setQ] = useState(""),
    [edit, setEdit] = useState(null),
    [del, setDel] = useState(null),
    [toast, setToast] = useToast(),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const list = resource.data.filter((p) =>
    (p.name + " " + p.cat).toLowerCase().includes(q.toLowerCase()),
  );
  const close = () => setEdit(null);
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api.deleteProduct(del.id);
      setDel(null);
      resource.reload();
      setToast("Product deleted");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h1 className="text-2xl font-extrabold">Products</h1>
        <button className="btn bp" onClick={() => setEdit({})}>
          ＋ Add product
        </button>
      </div>
      <input
        className="in mt-4 max-w-md"
        type="search"
        aria-label="Search products"
        placeholder="Search by name or category"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <DataState resource={resource}>
        {list.length ? (
          <ul className="mt-4 grid gap-3">
            {list.map((p) => (
              <li
                className="card p-3 flex flex-wrap items-center gap-3"
                key={p.id}
              >
                <div className="w-16 h-14 bg-stone-100 rounded-lg overflow-hidden">
                  {p.img && (
                    <img
                      className="w-full h-full object-cover"
                      src={p.img}
                      alt=""
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <b>{p.name}</b>
                  <p className="text-sm text-stone-600">
                    {p.cat} · {P(p.price)}
                  </p>
                </div>
                <div className="text-sm">
                  <b
                    className={
                      p.stock <= settings.data.low_stock_threshold
                        ? "text-goldText"
                        : "text-emerald-700"
                    }
                  >
                    {p.stock ? p.stock + " in stock" : "Out of stock"}
                  </b>
                  {!p.visible && (
                    <span className="ml-2 bg-stone-200 rounded-full px-2 py-1">
                      Hidden
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button className="btn bs" onClick={() => setEdit(p)}>
                    Edit
                  </button>
                  <button
                    className="btn bx"
                    aria-label={"Delete " + p.name}
                    onClick={() => {
                      setDel(p);
                      setError("");
                    }}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4">
            <EmptyState title="No products found">
              <p>Try another search, or add a new product.</p>
            </EmptyState>
          </div>
        )}
      </DataState>
      {edit && (
        <Modal title={edit.id ? "Edit product" : "Add product"} onClose={close}>
          <ProductForm
            product={edit.id ? edit : null}
            onClose={close}
            onSaved={(m) => {
              close();
              resource.reload();
              setToast(m);
            }}
          />
        </Modal>
      )}
      {del && (
        <Modal
          title="Delete this product?"
          onClose={() => {
            if (!busy) setDel(null);
          }}
        >
          <p>
            <b>{del.name}</b> will be removed. To keep it but stop selling it,
            use “Show in shop”.
          </p>
          {error && (
            <p role="alert" className="text-red-700">
              {error}
            </p>
          )}
          <div className="flex gap-2 justify-end mt-5">
            <button
              className="btn bs"
              disabled={busy}
              onClick={() => setDel(null)}
            >
              Keep product
            </button>
            <button className="btn bx" disabled={busy} onClick={remove}>
              {busy ? "Deleting…" : "Delete"}
            </button>
          </div>
        </Modal>
      )}
      <Toast message={toast} />
    </>
  );
}
